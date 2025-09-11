import { OpenAI } from 'openai'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

// 初始化OpenAI客户端
let openai = null
try {
  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    openai = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview' },
      defaultHeaders: {
        'api-key': process.env.AZURE_OPENAI_API_KEY,
      },
    })
    console.log('Azure OpenAI客户端初始化成功，部署名称:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME)
  }
} catch (error) {
  console.warn('OpenAI客户端初始化失败:', error.message)
  openai = null
}

/**
 * OCR服务类
 */
class OCRService {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.pdf', '.webp', '.svg']
    this.maxFileSize = 300 * 1024 * 1024 // 300MB
    this.maxImageSize = 2048 // 最大图片尺寸
  }

  /**
   * 检查文件是否支持
   * @param {string} filePath - 文件路径
   * @returns {boolean}
   */
  isSupportedFile(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    return this.supportedFormats.includes(ext)
  }

  /**
   * 预处理图片
   * @param {string} imagePath - 图片路径
   * @returns {Promise<Buffer>}
   */
  async preprocessImage(imagePath) {
    try {
      const image = sharp(imagePath)
      const metadata = await image.metadata()
      
      // 如果图片太大，进行压缩
      if (metadata.width > this.maxImageSize || metadata.height > this.maxImageSize) {
        return await image
          .resize(this.maxImageSize, this.maxImageSize, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toBuffer()
      }
      
      // 转换为JPEG格式以减小文件大小
      return await image
        .jpeg({ quality: 90 })
        .toBuffer()
    } catch (error) {
      console.error('图片预处理失败:', error)
      throw new Error('图片预处理失败')
    }
  }

  /**
   * 使用GPT-4 Vision进行OCR识别
   * @param {string} imagePath - 图片路径
   * @returns {Promise<string>}
   */
  async extractTextFromImage(imagePath) {
    try {
      if (!openai) {
        throw new Error('OpenAI客户端未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }
      
      // 预处理图片
      const imageBuffer = await this.preprocessImage(imagePath)
      const base64Image = imageBuffer.toString('base64')
      
      const response = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请仔细识别这张试卷图片中的所有文字内容，包括题目、选项、答案等。请按照以下格式输出：

1. 保持原有的题目编号和结构
2. 准确识别所有文字，包括数学公式、特殊符号
3. 对于选择题，请保持A、B、C、D的选项格式
4. 对于填空题，用______表示空白处
5. 对于解答题，保持题目的完整性

**重要：Markdown格式要求**
- 请使用标准的Markdown格式，确保与react-markdown完全兼容
- 标题使用 # ## ### 等格式
- 列表使用 - 或 1. 格式
- 代码块使用 \`\`\`语言 格式
- 强调使用 **粗体** 或 *斜体*
- 链接使用 [文本](URL) 格式
- 表格使用标准Markdown表格格式

请直接输出识别的文字内容，不要添加额外的说明。`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })

      return response.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('OCR识别失败:', error)
      throw new Error(`OCR识别失败: ${error.message}`)
    }
  }

  /**
   * 解析试卷文本，提取题目信息
   * @param {string} text - OCR识别的文本
   * @param {Object} paperInfo - 试卷基本信息
   * @returns {Promise<Array>}
   */
  async parseQuestions(text, paperInfo) {
    try {
      if (!openai) {
        throw new Error('OpenAI客户端未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }
      
      const prompt = `请分析以下试卷文本，提取出所有题目信息。试卷信息：科目=${paperInfo.subject}，年级=${paperInfo.grade}，考试类型=${paperInfo.examType}。

试卷文本：
${text}

请按照以下JSON格式输出每道题目：
{
  "questions": [
    {
      "questionNumber": 1,
      "type": "choice|fill|essay|calculation",
      "content": "题目内容",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"], // 仅选择题需要
      "correctAnswer": "正确答案",
      "explanation": "解题思路或解析",
      "score": 分值,
      "difficulty": "easy|medium|hard",
      "knowledgePoints": ["知识点1", "知识点2"]
    }
  ]
}

注意事项：
1. 题目类型：choice(选择题)、fill(填空题)、essay(简答题)、calculation(计算题)
2. 对于选择题，correctAnswer应该是选项字母(如"A")
3. 对于填空题，correctAnswer是填空内容
4. 对于主观题，correctAnswer可以是参考答案或答题要点
5. 根据题目内容合理估算分值和难度
6. 知识点要具体且相关

**重要：Markdown格式要求**
- 请使用标准的Markdown格式，确保与react-markdown完全兼容
- 标题使用 # ## ### 等格式
- 列表使用 - 或 1. 格式
- 代码块使用 \`\`\`语言 格式
- 强调使用 **粗体** 或 *斜体*
- 链接使用 [文本](URL) 格式
- 表格使用标准Markdown表格格式

**重要：数学公式格式要求**
- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号
- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$
- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm
- 上标用^，下标用_，如：$x^2$、$a_1$
- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$
- 根号用\\sqrt{}，如：$\\sqrt{16}$
- 正负号用\\pm，如：$\\pm 2$
- 积分用\\int，如：$\\int x dx$
- 求和用\\sum，如：$\\sum_{i=1}^{n} i$
- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号
- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi

请只输出JSON格式的结果，不要包含其他文字。`

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2
      })

      const result = response.choices[0]?.message?.content
      if (!result) {
        throw new Error('GPT-4响应为空')
      }

      // 尝试解析JSON
      try {
        const parsed = JSON.parse(result)
        return parsed.questions || []
      } catch (parseError) {
        console.error('JSON解析失败:', parseError)
        console.error('GPT-4响应:', result)
        throw new Error('题目解析结果格式错误')
      }
    } catch (error) {
      console.error('题目解析失败:', error)
      throw new Error(`题目解析失败: ${error.message}`)
    }
  }

  /**
   * 获取文件MIME类型
   * @param {string} filePath - 文件路径
   * @returns {string}
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf'
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }

  /**
   * 处理单个试卷文件（直接存储图片）
   * @param {string} filePath - 文件路径
   * @param {Object} paperInfo - 试卷信息
   * @returns {Promise<Object>}
   */
  async processPaper(filePath, paperInfo) {
    try {
      // 检查文件是否支持
      if (!this.isSupportedFile(filePath)) {
        throw new Error('不支持的文件格式')
      }

      // 检查文件大小
      const stats = await fs.stat(filePath)
      if (stats.size > this.maxFileSize) {
        throw new Error('文件大小超过限制')
      }

      console.log(`开始处理试卷文件: ${filePath}`)
      
      // 预处理图片（优化尺寸和质量）
      const imageBuffer = await this.preprocessImage(filePath)
      
      // 获取图片信息
      const imageInfo = {
        originalPath: filePath,
        size: stats.size,
        mimeType: this.getMimeType(filePath),
        processedAt: new Date().toISOString()
      }

      console.log('图片处理完成，准备存储')

      return {
        success: true,
        imageBuffer,
        imageInfo,
        filePath,
        paperInfo
      }
    } catch (error) {
      console.error('试卷处理失败:', error)
      return {
        success: false,
        error: error.message,
        imageBuffer: null,
        imageInfo: null,
        filePath: null
      }
    }
  }

  /**
   * 批量处理多个图片文件
   * @param {Array<string>} filePaths - 文件路径数组
   * @param {Object} paperInfo - 试卷信息
   * @returns {Promise<Object>}
   */
  async processPaperBatch(filePaths, paperInfo) {
    try {
      const results = []
      let allQuestions = []
      let allText = ''
      
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i]
        console.log(`处理第 ${i + 1}/${filePaths.length} 个文件: ${filePath}`)
        
        const result = await this.processPaper(filePath, {
          ...paperInfo,
          pageNumber: i + 1
        })
        
        results.push(result)
        
        if (result.success) {
          allQuestions = allQuestions.concat(result.questions)
          allText += `\n\n=== 第${i + 1}页 ===\n${result.extractedText}`
        }
      }
      
      // 重新编号题目
      allQuestions.forEach((question, index) => {
        question.questionNumber = index + 1
      })
      
      return {
        success: results.some(r => r.success),
        results,
        extractedText: allText.trim(),
        questions: allQuestions,
        totalQuestions: allQuestions.length,
        totalScore: allQuestions.reduce((sum, q) => sum + (q.score || 0), 0),
        processedPages: results.filter(r => r.success).length,
        totalPages: filePaths.length
      }
    } catch (error) {
      console.error('批量处理失败:', error)
      return {
        success: false,
        error: error.message,
        results: [],
        extractedText: '',
        questions: [],
        totalQuestions: 0,
        totalScore: 0,
        processedPages: 0,
        totalPages: filePaths.length
      }
    }
  }

  /**
   * 优化题目信息
   * @param {Array} questions - 题目数组
   * @param {Object} paperInfo - 试卷信息
   * @returns {Promise<Array>}
   */
  async optimizeQuestions(questions, paperInfo) {
    try {
      if (!openai) {
        throw new Error('OpenAI客户端未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }
      
      const prompt = `请优化以下题目信息，确保知识点准确、难度合理、分值恰当。

试卷信息：科目=${paperInfo.subject}，年级=${paperInfo.grade}，考试类型=${paperInfo.examType}

题目信息：
${JSON.stringify(questions, null, 2)}

请按照以下要求优化：
1. 完善知识点标签，确保准确且具体
2. 根据题目内容和年级调整难度等级
3. 根据题目类型和复杂度调整分值
4. 补充或优化题目解析
5. 确保选择题的正确答案格式正确

**重要：Markdown格式要求**
- 请使用标准的Markdown格式，确保与react-markdown完全兼容
- 标题使用 # ## ### 等格式
- 列表使用 - 或 1. 格式
- 代码块使用 \`\`\`语言 格式
- 强调使用 **粗体** 或 *斜体*
- 链接使用 [文本](URL) 格式
- 表格使用标准Markdown表格格式

**重要：数学公式格式要求**
- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号
- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$
- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm
- 上标用^，下标用_，如：$x^2$、$a_1$
- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$
- 根号用\\sqrt{}，如：$\\sqrt{16}$
- 正负号用\\pm，如：$\\pm 2$
- 积分用\\int，如：$\\int x dx$
- 求和用\\sum，如：$\\sum_{i=1}^{n} i$
- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号
- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi

请输出优化后的JSON格式结果。`

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      })

      const result = response.choices[0]?.message?.content
      if (!result) {
        return questions // 如果优化失败，返回原题目
      }

      try {
        const optimized = JSON.parse(result)
        return Array.isArray(optimized) ? optimized : optimized.questions || questions
      } catch (parseError) {
        console.error('题目优化结果解析失败:', parseError)
        return questions
      }
    } catch (error) {
      console.error('题目优化失败:', error)
      return questions
    }
  }
}

// 创建单例实例
const ocrService = new OCRService()

export default ocrService
export { OCRService }