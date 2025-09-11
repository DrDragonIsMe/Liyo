import { OpenAI } from 'openai'
import StudyRecord from '../models/StudyRecord.js'
import Question from '../models/Question.js'
import User from '../models/User.js'

// 延迟初始化Azure OpenAI客户端
let openai = null

function initializeOpenAI() {
  if (openai) return openai
  
  try {
    if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
      openai = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
        defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
        defaultHeaders: {
          'api-key': process.env.AZURE_OPENAI_API_KEY,
        },
      })
      console.log('Azure OpenAI客户端初始化成功')
      return openai
    }
  } catch (error) {
    console.warn('Azure OpenAI客户端初始化失败:', error.message)
    openai = null
  }
  return null
}

/**
 * AI服务类 - 智能伴读功能
 */
class AIService {
  constructor() {
    this.model = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini'
    this.maxTokens = 2000
    this.temperature = 0.7
  }

  /**
   * 生成个性化学习建议
   * @param {string} userId - 用户ID
   * @param {Object} studyData - 学习数据或包含prompt的对象
   * @returns {Promise<Object>}
   */
  async generateStudyAdvice(userId, studyData) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }

      let prompt
      let systemMessage = '你是一名经验丰富的学习顾问，擅长根据学生的学习情况提供个性化的学习建议。你的建议应该具体、可行、鼓励性强。重要提醒：请确保所有建议和内容都控制在高中及以下知识范围内，不要涉及大学或更高层次的专业知识。\n\n**重要：Markdown格式要求**\n- 请使用标准的Markdown格式，确保与react-markdown完全兼容\n- 标题使用 # ## ### 等格式\n- 列表使用 - 或 1. 格式\n- 代码块使用 \`\`\`语言 格式\n- 强调使用 **粗体** 或 *斜体*\n- 链接使用 [文本](URL) 格式\n- 表格使用标准Markdown表格格式\n\n**重要：数学公式格式要求**\n- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号\n- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$\n- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm\n- 上标用^，下标用_，如：$x^2$、$a_1$\n- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$\n- 根号用\\sqrt{}，如：$\\sqrt{16}$\n- 正负号用\\pm，如：$\\pm 2$\n- 积分用\\int，如：$\\int x dx$\n- 求和用\\sum，如：$\\sum_{i=1}^{n} i$\n- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号\n- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi'
      
      // 如果直接传入了prompt，则使用该prompt
      if (studyData.prompt) {
        prompt = studyData.prompt
        systemMessage = '你是一名专业的AI学习伴侣，专门帮助学生学习和解题。请根据用户的问题提供准确、有用的回答。重要提醒：请确保所有回答内容都控制在高中及以下知识范围内，使用高中生能够理解的概念和术语，避免涉及大学或更高层次的专业知识。\n\n**重要：Markdown格式要求**\n- 请使用标准的Markdown格式，确保与react-markdown完全兼容\n- 标题使用 # ## ### 等格式\n- 列表使用 - 或 1. 格式\n- 代码块使用 \`\`\`语言 格式\n- 强调使用 **粗体** 或 *斜体*\n- 链接使用 [文本](URL) 格式\n- 表格使用标准Markdown表格格式\n\n**重要：数学公式格式要求**\n- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号\n- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$\n- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm\n- 上标用^，下标用_，如：$x^2$、$a_1$\n- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$\n- 根号用\\sqrt{}，如：$\\sqrt{16}$\n- 正负号用\\pm，如：$\\pm 2$\n- 积分用\\int，如：$\\int x dx$\n- 求和用\\sum，如：$\\sum_{i=1}^{n} i$\n- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号\n- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi'
      } else {
        // 原有的学习建议生成逻辑
        let user = null
        if (userId !== 'demo-user') {
          user = await User.findById(userId)
          if (!user) {
            throw new Error('用户不存在')
          }
        }

        prompt = `作为一名专业的学习顾问，请根据以下学生信息和学习数据，生成个性化的学习建议：

学生信息：
- 年级：${user?.profile?.grade || '未知'}
- 学校：${user?.profile?.school || '未知'}
- 主要科目：${user?.profile?.subjects?.join('、') || '未知'}
- 学习偏好：${JSON.stringify(user?.preferences || {})}

学习数据：
- 最近学习记录：${studyData.recentRecords || 0}次
- 平均正确率：${studyData.averageAccuracy || 0}%
- 薄弱知识点：${studyData.weakPoints?.join('、') || '无'}
- 强项知识点：${studyData.strongPoints?.join('、') || '无'}
- 学习时长：${studyData.totalStudyTime || 0}分钟

请提供以下方面的建议：
1. 学习计划调整
2. 薄弱环节改进
3. 学习方法优化
4. 时间管理建议
5. 下一步学习重点

请用温暖、鼓励的语气，提供具体可行的建议。`
      }

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      })

      return {
        success: true,
        advice: response.choices[0]?.message?.content || '',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('生成学习建议失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 智能答疑 - 解答学生问题
   * @param {string} question - 学生问题
   * @param {Object} context - 上下文信息
   * @returns {Promise<Object>}
   */
  async answerQuestion(question, context = {}) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }
      
      const { subject, grade, questionType, relatedContent } = context

      const prompt = `作为一名${subject || ''}老师，请回答以下${grade || ''}学生的问题：

学生问题：${question}

${relatedContent ? `相关内容：\n${relatedContent}\n` : ''}
请按照以下要求回答：
1. 用通俗易懂的语言解释
2. 提供具体的解题步骤或思路
3. 举例说明（如果适用）
4. 给出相关的知识点总结
5. 推荐进一步学习的方向

回答要有耐心、详细，适合${grade || '中学'}生理解。`

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一名耐心、专业的老师，擅长用简单易懂的方式解答学生问题，并能够根据学生的年级调整解答的深度和方式。重要提醒：请确保所有解答内容都控制在高中及以下知识范围内，使用高中生能够理解的概念和术语，避免涉及大学或更高层次的专业知识。\n\n**重要：Markdown格式要求**\n- 请使用标准的Markdown格式，确保与react-markdown完全兼容\n- 标题使用 # ## ### 等格式\n- 列表使用 - 或 1. 格式\n- 代码块使用 \`\`\`语言 格式\n- 强调使用 **粗体** 或 *斜体*\n- 链接使用 [文本](URL) 格式\n- 表格使用标准Markdown表格格式\n\n**重要：数学公式格式要求**\n- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号\n- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$\n- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm\n- 上标用^，下标用_，如：$x^2$、$a_1$\n- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$\n- 根号用\\sqrt{}，如：$\\sqrt{16}$\n- 正负号用\\pm，如：$\\pm 2$\n- 积分用\\int，如：$\\int x dx$\n- 求和用\\sum，如：$\\sum_{i=1}^{n} i$\n- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号\n- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.5
      })

      return {
        success: true,
        answer: response.choices[0]?.message?.content || '',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('智能答疑失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 错题分析 - 分析学生的错误并提供改进建议
   * @param {Object} wrongAnswer - 错误答案信息
   * @returns {Promise<Object>}
   */
  async analyzeWrongAnswer(wrongAnswer) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }
      
      const { question, studentAnswer, correctAnswer, explanation } = wrongAnswer

      const prompt = `请分析以下学生的错误答案，并提供详细的分析和改进建议：

题目：${question.content}
${question.options ? `选项：\n${question.options.join('\n')}` : ''}
正确答案：${correctAnswer}
学生答案：${studentAnswer}
${explanation ? `题目解析：${explanation}` : ''}

请提供：
1. 错误原因分析
2. 知识点梳理
3. 解题思路指导
4. 类似题型练习建议
5. 避免类似错误的方法

分析要深入浅出，帮助学生真正理解错误所在。`

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一名专业的教学分析师，擅长分析学生的错误原因，并提供有针对性的改进建议。重要提醒：请确保所有分析和建议都控制在高中及以下知识范围内，使用高中生能够理解的概念和术语，避免涉及大学或更高层次的专业知识。\n\n**重要：Markdown格式要求**\n- 请使用标准的Markdown格式，确保与react-markdown完全兼容\n- 标题使用 # ## ### 等格式\n- 列表使用 - 或 1. 格式\n- 代码块使用 \`\`\`语言 格式\n- 强调使用 **粗体** 或 *斜体*\n- 链接使用 [文本](URL) 格式\n- 表格使用标准Markdown表格格式\n\n**重要：数学公式格式要求**\n- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号\n- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$\n- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm\n- 上标用^，下标用_，如：$x^2$、$a_1$\n- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$\n- 根号用\\sqrt{}，如：$\\sqrt{16}$\n- 正负号用\\pm，如：$\\pm 2$\n- 积分用\\int，如：$\\int x dx$\n- 求和用\\sum，如：$\\sum_{i=1}^{n} i$\n- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号\n- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.6
      })

      return {
        success: true,
        analysis: response.choices[0]?.message?.content || '',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('错题分析失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 生成学习路径 - 根据学生情况制定学习计划
   * @param {string} userId - 用户ID
   * @param {Object} goals - 学习目标
   * @returns {Promise<Object>}
   */
  async generateLearningPath(userId, goals) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }
      
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      // 获取用户学习统计
      const stats = await user.getStudyStatistics()
      
      const prompt = `请为以下学生制定个性化的学习路径：

学生信息：
- 年级：${user.profile.grade}
- 科目：${user.profile.subjects.join('、')}
- 当前水平：平均正确率${stats.averageAccuracy || 0}%
- 薄弱环节：${stats.weakPoints?.join('、') || '待评估'}
- 强项：${stats.strongPoints?.join('、') || '待发现'}

学习目标：
${JSON.stringify(goals, null, 2)}

请制定包含以下内容的学习路径：
1. 短期目标（1-2周）
2. 中期目标（1个月）
3. 长期目标（3个月）
4. 每个阶段的具体学习内容
5. 推荐的学习资源和方法
6. 进度检查点和评估标准

学习路径要循序渐进，符合学生当前水平。`

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一名专业的学习规划师，擅长根据学生的具体情况制定个性化、可执行的学习路径。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.6
      })

      return {
        success: true,
        learningPath: response.choices[0]?.message?.content || '',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('生成学习路径失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 智能推荐题目 - 根据学生情况推荐合适的练习题
   * @param {string} userId - 用户ID
   * @param {Object} preferences - 推荐偏好
   * @returns {Promise<Object>}
   */
  async recommendQuestions(userId, preferences = {}) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }
      
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      const { subject, difficulty, count = 10, focusAreas } = preferences

      // 构建查询条件
      const query = {}
      if (subject) query.subject = subject
      if (difficulty) query.difficulty = difficulty
      if (focusAreas && focusAreas.length > 0) {
        query.knowledgePoints = { $in: focusAreas }
      }

      // 获取用户的薄弱知识点
      const recentRecords = await StudyRecord.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('answers.question')

      const weakPoints = []
      recentRecords.forEach(record => {
        record.answers.forEach(answer => {
          if (!answer.isCorrect && answer.question) {
            weakPoints.push(...answer.question.knowledgePoints)
          }
        })
      })

      // 优先推荐薄弱知识点相关的题目
      if (weakPoints.length > 0) {
        query.knowledgePoints = { $in: weakPoints }
      }

      const questions = await Question.find(query)
        .limit(count * 2) // 获取更多题目用于筛选
        .populate('paper', 'title subject grade')

      // 使用AI进行智能筛选和排序
      const prompt = `请从以下题目中选择最适合学生当前水平的${count}道题目：

学生信息：
- 年级：${user.profile.grade}
- 薄弱知识点：${weakPoints.join('、') || '无'}
- 目标科目：${subject || '不限'}
- 期望难度：${difficulty || '适中'}

题目列表：
${questions.map((q, i) => `${i + 1}. [${q.difficulty}] ${q.content.substring(0, 100)}... (知识点: ${q.knowledgePoints.join('、')})`).join('\n')}

请选择题目并说明推荐理由，按照以下JSON格式输出：
{
  "recommendations": [
    {
      "questionId": "题目ID",
      "reason": "推荐理由",
      "priority": "high|medium|low"
    }
  ]
}`

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一名专业的题目推荐系统，能够根据学生的学习情况智能推荐最合适的练习题目。\n\n**重要：数学公式格式要求**\n- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号\n- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$\n- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm\n- 上标用^，下标用_，如：$x^2$、$a_1$\n- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$\n- 根号用\\sqrt{}，如：$\\sqrt{16}$\n- 正负号用\\pm，如：$\\pm 2$\n- 积分用\\int，如：$\\int x dx$\n- 求和用\\sum，如：$\\sum_{i=1}^{n} i$\n- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号\n- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.4
      })

      const result = response.choices[0]?.message?.content
      let recommendations = []
      
      try {
        const parsed = JSON.parse(result)
        recommendations = parsed.recommendations || []
      } catch (parseError) {
        console.error('推荐结果解析失败:', parseError)
        // 如果AI推荐失败，使用简单的推荐逻辑
        recommendations = questions.slice(0, count).map(q => ({
          questionId: q._id,
          reason: '基于知识点匹配推荐',
          priority: 'medium'
        }))
      }

      // 获取推荐题目的详细信息
      const recommendedQuestions = []
      for (const rec of recommendations) {
        const question = questions.find(q => q._id.toString() === rec.questionId)
        if (question) {
          recommendedQuestions.push({
            ...question.toObject(),
            recommendationReason: rec.reason,
            priority: rec.priority
          })
        }
      }

      return {
        success: true,
        questions: recommendedQuestions,
        totalRecommended: recommendedQuestions.length,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('智能推荐失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 生成学习报告 - 分析学习情况并生成报告
   * @param {string} userId - 用户ID
   * @param {Object} period - 时间周期
   * @returns {Promise<Object>}
   */
  async generateStudyReport(userId, period = { days: 30 }) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }
      
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      // 获取指定时间段的学习记录
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (period.days || 30))

      const studyRecords = await StudyRecord.find({
        user: userId,
        createdAt: { $gte: startDate }
      }).populate('paper', 'title subject grade')

      // 统计学习数据
      const stats = {
        totalSessions: studyRecords.length,
        totalTime: studyRecords.reduce((sum, r) => sum + (r.totalTime || 0), 0),
        averageScore: studyRecords.length > 0 
          ? studyRecords.reduce((sum, r) => sum + (r.score?.percentage || 0), 0) / studyRecords.length 
          : 0,
        subjectDistribution: {},
        difficultyDistribution: {},
        progressTrend: []
      }

      // 按科目统计
      studyRecords.forEach(record => {
        const subject = record.paper?.subject || '未知'
        stats.subjectDistribution[subject] = (stats.subjectDistribution[subject] || 0) + 1
      })

      const prompt = `请根据以下学习数据生成详细的学习报告：

学生信息：
- 姓名：${user.profile.name}
- 年级：${user.profile.grade}
- 报告周期：最近${period.days}天

学习统计：
- 学习次数：${stats.totalSessions}次
- 总学习时长：${Math.round(stats.totalTime / 60)}分钟
- 平均得分：${Math.round(stats.averageScore)}%
- 科目分布：${JSON.stringify(stats.subjectDistribution)}

请生成包含以下内容的学习报告：
1. 学习概况总结
2. 优势分析
3. 需要改进的方面
4. 学习习惯评价
5. 具体改进建议
6. 下阶段学习重点

报告要客观、鼓励性强，并提供具体可行的建议。`

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一名专业的学习分析师，能够根据学习数据生成详细、客观、有建设性的学习报告。\n\n**重要：数学公式格式要求**\n- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号\n- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$\n- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm\n- 上标用^，下标用_，如：$x^2$、$a_1$\n- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$\n- 根号用\\sqrt{}，如：$\\sqrt{16}$\n- 正负号用\\pm，如：$\\pm 2$\n- 积分用\\int，如：$\\int x dx$\n- 求和用\\sum，如：$\\sum_{i=1}^{n} i$\n- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号\n- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.6
      })

      return {
        success: true,
        report: response.choices[0]?.message?.content || '',
        statistics: stats,
        period: period,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('生成学习报告失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 实时学习伴读 - 在学习过程中提供实时指导
   * @param {string} userId - 用户ID
   * @param {Object} context - 当前学习上下文
   * @returns {Promise<Object>}
   */
  async provideLearningGuidance(userId, context) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }
      
      const { currentQuestion, studyProgress, timeSpent, difficulty } = context

      const prompt = `作为学习伴读助手，请根据当前学习情况提供实时指导：

当前情况：
- 当前题目：${currentQuestion?.content || '未知'}
- 学习进度：${studyProgress?.completed || 0}/${studyProgress?.total || 0}
- 已用时间：${timeSpent || 0}分钟
- 题目难度：${difficulty || '未知'}

请提供：
1. 鼓励性的话语
2. 解题提示（如果需要）
3. 时间管理建议
4. 学习状态评估
5. 下一步建议

回复要简洁、鼓励、实用。`

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一名贴心的学习伴读助手，能够在学习过程中提供及时、有用的指导和鼓励。重要提醒：请确保所有指导内容都控制在高中及以下知识范围内，使用高中生能够理解的概念和术语，避免涉及大学或更高层次的专业知识。\n\n**重要：Markdown格式要求**\n- 请使用标准的Markdown格式，确保与react-markdown完全兼容\n- 标题使用 # ## ### 等格式\n- 列表使用 - 或 1. 格式\n- 代码块使用 \`\`\`语言 格式\n- 强调使用 **粗体** 或 *斜体*\n- 链接使用 [文本](URL) 格式\n- 表格使用标准Markdown表格格式\n\n**重要：数学公式格式要求**\n- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号\n- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$\n- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm\n- 上标用^，下标用_，如：$x^2$、$a_1$\n- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$\n- 根号用\\sqrt{}，如：$\\sqrt{16}$\n- 正负号用\\pm，如：$\\pm 2$\n- 积分用\\int，如：$\\int x dx$\n- 求和用\\sum，如：$\\sum_{i=1}^{n} i$\n- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号\n- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8
      })

      return {
        success: true,
        guidance: response.choices[0]?.message?.content || '',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('实时学习指导失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 分析图片内容并生成知识点
   * @param {string} imageBase64 - 图片的base64编码
   * @param {string} subject - 学科
   * @returns {Promise<Object>}
   */
  async analyzeImageContent(imageBase64, subject) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置')
      }

      const prompt = `请仔细分析这张${subject}学科的题目图片，完成以下任务：

1. **OCR识别**：准确识别图片中的所有文字内容，包括题目、选项、公式、符号等
2. **题目解析**：理解题目的具体要求和考查内容
3. **知识点提取**：识别题目涉及的具体知识点（3-5个）
4. **难度评估**：评估题目难度（简单/中等/困难）

请严格按照以下JSON格式返回，确保OCR识别的准确性：
{
  "ocrText": "完整的OCR识别文字内容，保持原有格式和结构",
  "content": "题目的完整内容描述，包括具体的题目要求",
  "knowledgePoints": ["具体知识点1", "具体知识点2", "具体知识点3"],
  "difficulty": "简单|中等|困难",
  "questionType": "选择题|填空题|解答题|计算题|证明题",
  "subject": "${subject}"
}

注意事项：
- OCR识别要完整准确，不要遗漏任何文字

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
- 知识点要具体明确，避免过于宽泛
- 如果是选择题，要识别出所有选项
- 如果包含数学公式，要准确识别公式内容`

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一名专业的${subject}教师和OCR专家，擅长准确识别题目图片中的文字内容并分析相关知识点。你必须确保OCR识别的准确性和完整性。`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
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
        max_tokens: 2000,
        temperature: 0.1
      })

      const result = response.choices[0]?.message?.content
      console.log('AI图片分析原始响应:', result)
      
      if (result) {
        try {
          // 尝试提取JSON内容
          let jsonStr = result
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/{[\s\S]*}/)
          if (jsonMatch) {
            jsonStr = jsonMatch[1] || jsonMatch[0]
          }
          
          const parsed = JSON.parse(jsonStr)
          console.log('AI图片分析解析结果:', parsed)
          
          return {
            success: true,
            ocrText: parsed.ocrText || parsed.content || '图片题目',
            content: parsed.content || parsed.ocrText || '图片题目',
            knowledgePoints: parsed.knowledgePoints || [],
            difficulty: parsed.difficulty || 'medium',
            questionType: parsed.questionType || '图片题',
            subject: parsed.subject || subject
          }
        } catch (parseError) {
          console.error('解析AI响应失败:', parseError)
          console.log('尝试手动解析AI响应...')
          
          // 尝试从文本中提取信息
          const ocrMatch = result.match(/"ocrText"\s*:\s*"([^"]+)"/) || result.match(/OCR[识别]*[：:][\s]*([^\n]+)/i)
          const contentMatch = result.match(/"content"\s*:\s*"([^"]+)"/) || result.match(/题目[内容]*[：:][\s]*([^\n]+)/i)
          const pointsMatch = result.match(/"knowledgePoints"\s*:\s*\[([^\]]+)\]/) || result.match(/知识点[：:][\s]*\[([^\]]+)\]/i)
          const difficultyMatch = result.match(/"difficulty"\s*:\s*"([^"]+)"/) || result.match(/难度[：:][\s]*(简单|中等|困难)/i)
          
          const extractedContent = ocrMatch ? ocrMatch[1] : (contentMatch ? contentMatch[1] : '图片题目')
          const extractedPoints = pointsMatch ? 
            pointsMatch[1].split(',').map(p => p.trim().replace(/"/g, '').replace(/'/g, '')) : []
          const extractedDifficulty = difficultyMatch ? difficultyMatch[1] : 'medium'
          
          return {
            success: true,
            ocrText: extractedContent,
            content: extractedContent,
            knowledgePoints: extractedPoints,
            difficulty: extractedDifficulty,
            questionType: '图片题',
            subject: subject
          }
        }
      }

      return {
        success: false,
        error: '无法分析图片内容'
      }
    } catch (error) {
      console.error('分析图片内容失败:', error)
      return {
        success: false,
        error: error.message || '图片分析服务暂时不可用'
      }
    }
  }

  /**
   * 生成题目答案
   * @param {string} questionText - 题目文本
   * @param {string} subject - 科目
   * @param {string} questionType - 题目类型
   * @returns {Promise<Object>}
   */
  async generateAnswer(questionText, subject, questionType) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        return {
          success: false,
          error: 'AI服务未配置'
        }
      }

      const prompt = `请为以下${subject}题目生成正确答案：

题目类型：${questionType}
题目内容：${questionText}

要求：
1. 提供准确的答案
2. 如果是选择题，只返回选项字母（如A、B、C、D）
3. 如果是填空题，返回准确的答案内容
4. 如果是解答题，提供简洁的答案要点
5. 确保答案符合高中知识水平

请直接返回答案，不需要解释过程。`

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一名专业的学科教师，擅长解答各类题目。请根据题目内容生成准确的答案。\n\n**重要：Markdown格式要求**\n- 请使用标准的Markdown格式，确保与react-markdown完全兼容\n- 标题使用 # ## ### 等格式\n- 列表使用 - 或 1. 格式\n- 代码块使用 \`\`\`语言 格式\n- 强调使用 **粗体** 或 *斜体*\n- 链接使用 [文本](URL) 格式\n- 表格使用标准Markdown表格格式\n\n**重要：数学公式格式要求**\n- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号\n- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$\n- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm\n- 上标用^，下标用_，如：$x^2$、$a_1$\n- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$\n- 根号用\\sqrt{}，如：$\\sqrt{16}$\n- 正负号用\\pm，如：$\\pm 2$\n- 积分用\\int，如：$\\int x dx$\n- 求和用\\sum，如：$\\sum_{i=1}^{n} i$\n- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号\n- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })

      const answer = response.choices[0]?.message?.content?.trim()
      
      if (answer) {
        return {
          success: true,
          answer: answer
        }
      } else {
        return {
          success: false,
          error: '未能生成答案'
        }
      }
    } catch (error) {
      console.error('生成答案失败:', error)
      return {
        success: false,
        error: error.message || '答案生成服务暂时不可用'
      }
    }
  }

  /**
   * 通用AI响应生成方法
   * @param {string} prompt - 提示词
   * @param {Object} options - 选项
   * @returns {Promise<string>}
   */
  async generateResponse(prompt, options = {}) {
    try {
      const client = initializeOpenAI()
      if (!client) {
        throw new Error('AI服务未配置，请检查环境变量AZURE_OPENAI_API_KEY和AZURE_OPENAI_ENDPOINT')
      }

      const {
        maxTokens = this.maxTokens,
        temperature = this.temperature,
        systemMessage = '你是一名专业的AI助手，请根据用户的问题提供准确、有用的回答。重要提醒：请确保所有回答内容都控制在高中及以下知识范围内，使用高中生能够理解的概念和术语，避免涉及大学或更高层次的专业知识。\n\n**重要：Markdown格式要求**\n- 请使用标准的Markdown格式，确保与react-markdown完全兼容\n- 标题使用 # ## ### 等格式\n- 列表使用 - 或 1. 格式\n- 代码块使用 \`\`\`语言 格式\n- 强调使用 **粗体** 或 *斜体*\n- 链接使用 [文本](URL) 格式\n- 表格使用标准Markdown表格格式\n\n**重要：数学公式格式要求**\n- 必须使用严格的KaTeX兼容格式，严禁使用Unicode数学符号\n- 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$\n- 块级公式请使用 $$公式$$ 格式，如：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n- KaTeX命令使用单反斜杠，如：\\frac、\\sqrt、\\pm\n- 上标用^，下标用_，如：$x^2$、$a_1$\n- 分数用\\frac{分子}{分母}，如：$\\frac{1}{2}$\n- 根号用\\sqrt{}，如：$\\sqrt{16}$\n- 正负号用\\pm，如：$\\pm 2$\n- 积分用\\int，如：$\\int x dx$\n- 求和用\\sum，如：$\\sum_{i=1}^{n} i$\n- 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号\n- 必须用KaTeX：\\int、^2、^3、\\times、\\div、\\pm、\\leq、\\geq、\\neq、\\pi'
      } = options

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature
      })

      return response.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('生成AI响应失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const aiService = new AIService()

export default aiService
export { AIService }