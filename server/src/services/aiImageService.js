import { OpenAI } from 'openai'

// 动态初始化OpenAI客户端
let openai = null

function initializeOpenAI() {
  if (openai) {
    return openai
  }
  
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
      console.log('AI图片服务初始化成功')
      return openai
    }
  } catch (error) {
    console.warn('AI图片服务初始化失败:', error.message)
    openai = null
  }
  
  return null
}

/**
 * AI图片识别服务类
 */
class AIImageService {
  constructor() {
    this.maxTokens = 4000
    this.temperature = 0.1
  }

  /**
   * 识别图片中的知识点
   * @param {string} imageBase64 - base64编码的图片数据
   * @param {Object} paperInfo - 试卷信息
   * @returns {Promise<Array>}
   */
  async identifyKnowledgePoints(imageBase64, paperInfo) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量')
      }

      const response = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请分析这张${paperInfo.subject}试卷图片，识别其中涉及的知识点。

科目：${paperInfo.subject}
年级：${paperInfo.grade}
考试类型：${paperInfo.examType}

请按照以下JSON格式输出：
{
  "knowledgePoints": [
    {
      "name": "知识点名称",
      "category": "知识点分类",
      "difficulty": "easy|medium|hard",
      "description": "知识点描述"
    }
  ],
  "summary": "整体内容概述"
}

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
- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      })

      const content = response.choices[0]?.message?.content || '{}'
      return JSON.parse(content)
    } catch (error) {
      console.error('知识点识别失败:', error)
      throw new Error(`知识点识别失败: ${error.message}`)
    }
  }

  /**
   * 基于图片进行AI陪练对话
   * @param {string} imageBase64 - base64编码的图片数据
   * @param {string} userQuestion - 用户问题
   * @param {Object} context - 上下文信息
   * @returns {Promise<Object>}
   */
  async chatWithImage(imageBase64, userQuestion, context = {}) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量')
      }

      const systemPrompt = `你是一个专业的学习助手，正在帮助学生理解试卷内容。

当前试卷信息：
- 科目：${context.subject || '未知'}
- 年级：${context.grade || '未知'}
- 考试类型：${context.examType || '未知'}

请根据图片内容和学生的问题，提供准确、详细的解答和指导。重要提醒：请确保所有解答和指导都控制在高中及以下知识范围内，使用高中生能够理解的概念和术语，避免涉及大学或更高层次的专业知识。

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
- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi`

      const response = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userQuestion
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      })

      return {
        success: true,
        response: response.choices[0]?.message?.content || '',
        usage: response.usage
      }
    } catch (error) {
      console.error('AI对话失败:', error)
      return {
        success: false,
        error: error.message,
        response: '抱歉，AI服务暂时不可用，请稍后重试。'
      }
    }
  }

  /**
   * 分析题目难度和类型
   * @param {string} imageBase64 - base64编码的图片数据
   * @param {Object} paperInfo - 试卷信息
   * @returns {Promise<Object>}
   */
  async analyzeQuestions(imageBase64, paperInfo) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量')
      }

      const response = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请分析这张${paperInfo.subject}试卷图片中的题目，识别题目类型和难度。

请按照以下JSON格式输出：
{
  "questions": [
    {
      "questionNumber": 1,
      "type": "choice|fill|essay|calculation",
      "difficulty": "easy|medium|hard",
      "estimatedTime": 5,
      "knowledgePoints": ["知识点1", "知识点2"]
    }
  ],
  "summary": {
    "totalQuestions": 10,
    "questionTypes": {"choice": 5, "fill": 3, "essay": 2},
    "averageDifficulty": "medium",
    "estimatedTotalTime": 90
  }
}

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
- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      })

      const content = response.choices[0]?.message?.content || '{}'
      return JSON.parse(content)
    } catch (error) {
      console.error('题目分析失败:', error)
      throw new Error(`题目分析失败: ${error.message}`)
    }
  }
}

const aiImageService = new AIImageService()

export default aiImageService
export { AIImageService }