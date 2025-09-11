import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'
import aiService from '../services/aiService.js'
import aiImageService from '../services/aiImageService.js'
import StudyRecord from '../models/StudyRecord.js'
import Question from '../models/Question.js'
import KnowledgePoint from '../models/KnowledgePoint.js'

const router = express.Router()

// AI聊天和分析路由使用可选身份验证，其他路由需要强制身份验证
// router.use(authMiddleware)

// @desc    获取个性化学习建议
// @route   GET /api/ai/study-advice
// @access  Private
router.get('/study-advice', authMiddleware, asyncHandler(async (req, res) => {
  // 获取用户最近的学习数据
  const recentRecords = await StudyRecord.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('paper', 'subject grade')

  // 计算学习统计数据
  const studyData = {
    recentRecords: recentRecords.length,
    averageAccuracy: recentRecords.length > 0 
      ? Math.round(recentRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0) / recentRecords.length)
      : 0,
    totalStudyTime: Math.round(recentRecords.reduce((sum, r) => sum + (r.totalTime || 0), 0) / 60),
    weakPoints: [],
    strongPoints: []
  }

  // 分析薄弱和强项知识点
  const knowledgePointStats = {}
  recentRecords.forEach(record => {
    if (record.weakPoints) {
      record.weakPoints.forEach(point => {
        studyData.weakPoints.push(point)
      })
    }
    if (record.strongPoints) {
      record.strongPoints.forEach(point => {
        studyData.strongPoints.push(point)
      })
    }
  })

  // 去重
  studyData.weakPoints = [...new Set(studyData.weakPoints)]
  studyData.strongPoints = [...new Set(studyData.strongPoints)]

  const result = await aiService.generateStudyAdvice(req.user.id, studyData)

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    })
  }

  res.json({
    success: true,
    data: {
      advice: result.advice,
      studyData,
      timestamp: result.timestamp
    }
  })
}))

// @desc    智能答疑
// @route   POST /api/ai/ask-question
// @access  Private
router.post('/ask-question', authMiddleware, [
  body('question')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('问题长度必须在5-500个字符之间'),
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('科目名称不能超过20个字符'),
  body('questionId')
    .optional()
    .isMongoId()
    .withMessage('题目ID格式不正确'),
  body('context')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('上下文内容不能超过1000个字符')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { question, subject, questionId, context } = req.body

  // 构建上下文信息
  const contextInfo = {
    subject: subject || req.user.profile?.subjects?.[0],
    grade: req.user.profile?.grade,
    relatedContent: context
  }

  // 如果提供了题目ID，获取题目详情作为上下文
  if (questionId) {
    const questionDoc = await Question.findById(questionId)
    if (questionDoc) {
      contextInfo.relatedContent = `题目：${questionDoc.content}\n${questionDoc.options ? `选项：${questionDoc.options.join(', ')}` : ''}\n知识点：${questionDoc.knowledgePoints.join('、')}`
      contextInfo.subject = questionDoc.subject
      contextInfo.questionType = questionDoc.type
    }
  }

  const result = await aiService.answerQuestion(question, contextInfo)

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    })
  }

  res.json({
    success: true,
    data: {
      question,
      answer: result.answer,
      context: contextInfo,
      timestamp: result.timestamp
    }
  })
}))

// @desc    分析错误答案
// @route   POST /api/ai/analyze-wrong-answer
// @access  Private
router.post('/analyze-wrong-answer', authMiddleware, [
  body('questionId')
    .isMongoId()
    .withMessage('题目ID格式不正确'),
  body('studentAnswer')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('学生答案不能为空且不能超过200个字符'),
  body('studyRecordId')
    .optional()
    .isMongoId()
    .withMessage('学习记录ID格式不正确')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { questionId, studentAnswer, studyRecordId } = req.body

  // 获取题目信息
  const question = await Question.findById(questionId)
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在'
    })
  }

  // 构建错误答案信息
  const wrongAnswer = {
    question: {
      content: question.content,
      options: question.options,
      type: question.type,
      knowledgePoints: question.knowledgePoints
    },
    studentAnswer,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation
  }

  const result = await aiService.analyzeWrongAnswer(wrongAnswer)

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    })
  }

  // 如果提供了学习记录ID，将分析结果保存到学习记录中
  if (studyRecordId) {
    try {
      const studyRecord = await StudyRecord.findById(studyRecordId)
      if (studyRecord && studyRecord.user.toString() === req.user.id) {
        studyRecord.aiInteractions.push({
          type: 'wrong_answer_analysis',
          question: questionId,
          input: studentAnswer,
          response: result.analysis,
          timestamp: new Date()
        })
        await studyRecord.save()
      }
    } catch (error) {
      console.error('保存AI交互记录失败:', error)
    }
  }

  res.json({
    success: true,
    data: {
      question: {
        id: question._id,
        content: question.content,
        type: question.type
      },
      studentAnswer,
      correctAnswer: question.correctAnswer,
      analysis: result.analysis,
      timestamp: result.timestamp
    }
  })
}))

// @desc    生成学习路径
// @route   POST /api/ai/learning-path
// @access  Private
router.post('/learning-path', authMiddleware, [
  body('goals')
    .isObject()
    .withMessage('学习目标必须是对象格式'),
  body('goals.subjects')
    .isArray({ min: 1 })
    .withMessage('至少选择一个科目'),
  body('goals.timeframe')
    .optional()
    .isIn(['1week', '2weeks', '1month', '3months', '6months'])
    .withMessage('请选择有效的时间框架'),
  body('goals.priority')
    .optional()
    .isIn(['exam_prep', 'knowledge_consolidation', 'skill_improvement', 'comprehensive_review'])
    .withMessage('请选择有效的学习优先级')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { goals } = req.body

  const result = await aiService.generateLearningPath(req.user.id, goals)

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    })
  }

  res.json({
    success: true,
    data: {
      goals,
      learningPath: result.learningPath,
      timestamp: result.timestamp
    }
  })
}))

// @desc    推荐题目
// @route   GET /api/ai/recommend-questions
// @access  Private
router.get('/recommend-questions', authMiddleware, [
  query('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('科目名称不能超过20个字符'),
  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('请选择有效的难度等级'),
  query('count')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('推荐数量必须在1-20之间'),
  query('focusAreas')
    .optional()
    .isString()
    .withMessage('关注领域必须是字符串')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { subject, difficulty, count, focusAreas } = req.query

  const preferences = {
    subject,
    difficulty,
    count: parseInt(count) || 10,
    focusAreas: focusAreas ? focusAreas.split(',').map(area => area.trim()) : []
  }

  const result = await aiService.recommendQuestions(req.user.id, preferences)

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    })
  }

  res.json({
    success: true,
    data: {
      questions: result.questions,
      totalRecommended: result.totalRecommended,
      preferences,
      timestamp: result.timestamp
    }
  })
}))

// @desc    生成学习报告
// @route   GET /api/ai/study-report
// @access  Private
router.get('/study-report', authMiddleware, [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('天数必须在1-365之间')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const days = parseInt(req.query.days) || 30
  const period = { days }

  const result = await aiService.generateStudyReport(req.user.id, period)

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    })
  }

  res.json({
    success: true,
    data: {
      report: result.report,
      statistics: result.statistics,
      period: result.period,
      timestamp: result.timestamp
    }
  })
}))

// @desc    学习指导
// @route   POST /api/ai/learning-guidance
// @access  Private
router.post('/learning-guidance', authMiddleware, [
  body('studyRecordId')
    .isMongoId()
    .withMessage('学习记录ID格式不正确'),
  body('currentQuestionId')
    .optional()
    .isMongoId()
    .withMessage('当前题目ID格式不正确'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('学习时间必须是非负整数'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('请选择有效的难度等级')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { studyRecordId, currentQuestionId, timeSpent, difficulty } = req.body

  // 获取学习记录
  const studyRecord = await StudyRecord.findById(studyRecordId)
    .populate('paper', 'title totalScore')
  
  if (!studyRecord) {
    return res.status(404).json({
      success: false,
      error: '学习记录不存在'
    })
  }

  // 检查权限
  if (studyRecord.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '无权访问该学习记录'
    })
  }

  // 获取当前题目信息
  let currentQuestion = null
  if (currentQuestionId) {
    currentQuestion = await Question.findById(currentQuestionId)
  }

  // 构建学习上下文
  const context = {
    currentQuestion: currentQuestion ? {
      content: currentQuestion.content,
      type: currentQuestion.type,
      difficulty: currentQuestion.difficulty
    } : null,
    studyProgress: {
      completed: studyRecord.statistics.answeredQuestions || 0,
      total: studyRecord.statistics.totalQuestions || 0,
      accuracy: studyRecord.accuracy || 0
    },
    timeSpent: timeSpent || Math.round((studyRecord.totalTime || 0) / 60),
    difficulty: difficulty || currentQuestion?.difficulty
  }

  const result = await aiService.provideLearningGuidance(req.user.id, context)

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error
    })
  }

  // 保存AI交互记录
  try {
    studyRecord.aiInteractions.push({
      type: 'learning_guidance',
      question: currentQuestionId,
      input: JSON.stringify(context),
      response: result.guidance,
      timestamp: new Date()
    })
    await studyRecord.save()
  } catch (error) {
    console.error('保存AI交互记录失败:', error)
  }

  res.json({
    success: true,
    data: {
      guidance: result.guidance,
      context,
      timestamp: result.timestamp
    }
  })
}))

// @desc    获取AI交互历史
// @route   GET /api/ai/interactions/:studyRecordId
// @access  Private
router.get('/interactions/:studyRecordId', authMiddleware, asyncHandler(async (req, res) => {
  const studyRecord = await StudyRecord.findById(req.params.studyRecordId)
    .populate('aiInteractions.question', 'content type')
  
  if (!studyRecord) {
    return res.status(404).json({
      success: false,
      error: '学习记录不存在'
    })
  }

  // 检查权限
  if (studyRecord.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权访问该学习记录'
    })
  }

  res.json({
    success: true,
    data: {
      interactions: studyRecord.aiInteractions.map(interaction => ({
        type: interaction.type,
        question: interaction.question,
        input: interaction.input,
        response: interaction.response,
        timestamp: interaction.timestamp
      }))
    }
  })
}))

// @desc    AI聊天接口
// @route   POST /api/ai/chat
// @access  Public (可选身份验证)
router.post('/chat', optionalAuthMiddleware, [
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('消息内容不能为空且不能超过500个字符'),
  body('questionContext')
    .optional()
    .isObject()
    .withMessage('题目上下文必须是对象格式'),
  body('chatHistory')
    .optional()
    .isArray({ max: 10 })
    .withMessage('聊天历史不能超过10条消息'),
  body('ocrText')
    .optional()
    .isString()
    .withMessage('OCR文本必须是字符串格式'),
  body('imageData')
    .optional()
    .isString()
    .withMessage('图片数据必须是字符串格式'),
  body('mimeType')
    .optional()
    .isString()
    .withMessage('图片类型必须是字符串格式')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  const { message, questionContext, chatHistory, imageData, mimeType } = req.body
  
  // 构建上下文提示
  let contextPrompt = '你是一个专业的AI学习伴侣，专门帮助学生学习和解题。'
  
  // 处理学科专属上下文
  if (questionContext?.subjectContext?.isSubjectSelected && questionContext.subjectContext.currentSubject) {
    const currentSubject = questionContext.subjectContext.currentSubject
    contextPrompt = `你是一个专业的${currentSubject}AI助手，专门帮助学生学习${currentSubject}学科。你只回答与${currentSubject}相关的问题，如果学生问其他学科的问题，请礼貌地提醒他们你是${currentSubject}专属助手。`
    
    if (questionContext.subjectContext.subjectDescription) {
      contextPrompt += `\n\n${currentSubject}学科特点：${questionContext.subjectContext.subjectDescription}`
    }
  }
  
  if (questionContext) {
    contextPrompt += `\n\n当前题目信息：
    - 科目：${questionContext.subject}
    - 难度：${questionContext.difficulty}`
    
    // 如果有图片数据，说明是图片题目
    if (imageData && mimeType) {
      contextPrompt += `\n    - 题目类型：图片题目`
    } else {
      contextPrompt += `\n    - 题目内容：${questionContext.content}`
    }
    
    contextPrompt += `\n    - 知识点：${questionContext.knowledgePoints?.join('、')}`
    
    if (questionContext.options) {
      contextPrompt += `\n- 选项：${questionContext.options.join('; ')}`
    }
    
    if (questionContext.userAnswer) {
      contextPrompt += `\n- 用户当前答案：${questionContext.userAnswer}`
      contextPrompt += `\n- 是否已提交：${questionContext.isAnswered ? '是' : '否'}`
    }
  }
  
  // 根据是否选择学科调整回答要求
  if (questionContext?.subjectContext?.isSubjectSelected) {
    const currentSubject = questionContext.subjectContext.currentSubject
    contextPrompt += `\n\n请基于以上信息回答学生的${currentSubject}问题。你的回答应该：
    1. 专注于${currentSubject}学科内容，不涉及其他学科
    2. 提供${currentSubject}特有的解题思路和方法
    3. 解释${currentSubject}相关知识点和概念
    4. 使用${currentSubject}学科的专业术语和表达方式
    5. 如果问题不属于${currentSubject}学科，请提醒学生你是${currentSubject}专属助手
    6. 语言简洁明了，适合学生理解
    7. 重要提醒：请确保所有回答内容都控制在高中及以下知识范围内，使用高中生能够理解的概念和术语，避免涉及大学或更高层次的专业知识
    
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
  } else {
    contextPrompt += `\n\n请基于以上题目信息回答学生的问题。你的回答应该：
    1. 直接针对当前题目，无需重复描述题目内容
    2. 提供具体的解题思路和方法
    3. 解释相关知识点
    4. 语言简洁明了，适合学生理解
    5. 如果学生答错了，要耐心指导正确的思路
    6. 重要提醒：请确保所有回答内容都控制在高中及以下知识范围内，使用高中生能够理解的概念和术语，避免涉及大学或更高层次的专业知识
    
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
  }
  
  contextPrompt += `\n\n学生的问题：${message}`
  
  let result
  
  // 如果有图片数据，使用图片AI服务
  if (imageData && mimeType) {
    // 移除data:image/xxx;base64,前缀（如果存在）
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
    
    const context = {
      subject: questionContext?.subject,
      grade: questionContext?.grade,
      examType: questionContext?.examType
    }
    
    result = await aiImageService.chatWithImage(base64Data, contextPrompt, context)
  } else {
    // 使用普通AI服务
    const userId = req.user?.id || 'demo-user'
    result = await aiService.generateStudyAdvice(userId, { prompt: contextPrompt })
  }
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error || 'AI服务暂时不可用，请稍后再试'
    })
  }
  
  res.json({
    success: true,
    response: result.response || result.advice
  })
}))

// @desc    实时分析用户答题进度
// @route   POST /api/ai/analyze-progress
// @access  Public (可选身份验证)
router.post('/analyze-progress', optionalAuthMiddleware, [
  body('question')
    .isObject()
    .withMessage('题目信息必须是对象格式'),
  body('question.content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('题目内容不能为空'),
  body('userAnswer')
    .trim()
    .isLength({ min: 1 })
    .withMessage('用户答案不能为空'),
  body('isPartialAnswer')
    .isBoolean()
    .withMessage('答题状态必须是布尔值')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  const { question, userAnswer, isPartialAnswer } = req.body
  
  // 构建分析提示
  let analysisPrompt = `你是一个AI学习伴侣，正在实时分析学生的答题过程。\n\n题目信息：
  - 科目：${question.subject}
  - 难度：${question.difficulty}
  - 题目：${question.content}
  - 知识点：${question.knowledgePoints?.join('、')}`
  
  if (question.options) {
    analysisPrompt += `\n- 选项：${question.options.join('; ')}
  - 正确答案：${question.correctAnswer}`
  }
  
  analysisPrompt += `\n\n学生当前答案：${userAnswer}
  答题状态：${isPartialAnswer ? '正在作答' : '已提交'}`
  
  if (isPartialAnswer) {
    analysisPrompt += `\n\n请分析学生的答题思路，并提供简短的实时建议（50字以内）：
    1. 如果答题方向正确，给予鼓励和进一步提示
    2. 如果答题方向有误，温和地指出问题并给出正确思路
    3. 如果答案不完整，提示需要补充的要点
    4. 语言要简洁、友好、具有指导性
    
    只返回建议内容，不要包含其他说明。如果当前答案合理无需建议，返回空字符串。`
  } else {
    // 已提交答案的分析
    const isCorrect = question.options ? 
      userAnswer === question.correctAnswer : 
      true // 主观题暂时认为合理
      
    analysisPrompt += `\n\n请分析学生的最终答案并给出反馈（100字以内）：
    ${isCorrect ? '答案正确，请给出鼓励和知识点总结' : '答案有误，请指出错误并解释正确思路'}`
  }
  
  const userId = req.user?.id || 'demo-user' // 使用演示用户ID
  const result = await aiService.generateStudyAdvice(userId, { prompt: analysisPrompt })
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error || '分析服务暂时不可用'
    })
  }
  
  res.json({
    success: true,
    suggestion: result.advice?.trim() || ''
  })
}))

// @desc    解析粘贴的题目内容
// @route   POST /api/ai/parse-question
// @access  Public
router.post('/parse-question', optionalAuthMiddleware, [
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('题目内容长度必须在10-2000个字符之间'),
  body('currentSubject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('当前学科名称不能超过20个字符')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  const { content, currentSubject } = req.body
  
  try {
    // 使用AI服务解析题目内容
    const parsePrompt = `请分析以下粘贴的内容，判断是否为题目，并提取结构化信息：

内容：${content}

请按以下JSON格式返回：
{
  "isQuestion": true/false,
  "subject": "学科名称",
  "content": "题目内容",
  "type": "选择题/填空题/解答题/判断题",
  "difficulty": "easy/medium/hard",
  "options": ["选项A", "选项B", "选项C", "选项D"] (仅选择题),
  "correctAnswer": "正确答案",
  "knowledgePoints": ["知识点1", "知识点2"],
  "explanation": "题目解析"
}

如果不是题目，请返回 {"isQuestion": false, "reason": "不是题目的原因"}`

    const aiResponse = await aiService.generateResponse(parsePrompt, {
      maxTokens: 1000,
      temperature: 0.3
    })

    let parsedQuestion
    try {
      // 尝试解析AI返回的JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedQuestion = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('无法解析AI响应')
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: '题目解析失败，请检查内容格式'
      })
    }

    if (!parsedQuestion.isQuestion) {
      return res.json({
        success: false,
        isQuestion: false,
        reason: parsedQuestion.reason || '内容不是有效的题目格式'
      })
    }

    // 检查学科匹配
    const subjectMatch = !currentSubject || 
      parsedQuestion.subject.includes(currentSubject) || 
      currentSubject.includes(parsedQuestion.subject)

    res.json({
      success: true,
      isQuestion: true,
      question: {
        id: `parsed_${Date.now()}`,
        content: parsedQuestion.content,
        subject: parsedQuestion.subject,
        type: parsedQuestion.type,
        difficulty: parsedQuestion.difficulty || 'medium',
        options: parsedQuestion.options,
        correctAnswer: parsedQuestion.correctAnswer,
        explanation: parsedQuestion.explanation,
        knowledgePoints: parsedQuestion.knowledgePoints || [],
        createdAt: new Date()
      },
      subjectMatch,
      suggestedSubject: parsedQuestion.subject
    })

  } catch (error) {
    console.error('题目解析错误:', error)
    res.status(500).json({
      success: false,
      message: 'AI服务暂时不可用，请稍后再试'
    })
  }
}))

// @desc    保存解析的题目到题库
// @route   POST /api/ai/save-question
// @access  Public
router.post('/save-question', optionalAuthMiddleware, [
  body('question')
    .isObject()
    .withMessage('题目信息必须是对象格式'),
  body('question.content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('题目内容不能为空'),
  body('question.subject')
    .trim()
    .isLength({ min: 1 })
    .withMessage('学科不能为空')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  const { question } = req.body
  
  // 调试日志
  console.log('接收到的题目数据:')
  console.log('SVG数据存在:', !!question.svgData)
  console.log('SVG数据长度:', question.svgData ? question.svgData.length : 0)
  console.log('图形属性存在:', !!question.figureProperties)
  console.log('包含几何图形:', question.hasGeometryFigure)
  
  try {
    // 创建新题目
    const newQuestion = new Question({
      content: question.content,
      subject: question.subject,
      type: question.type || 'other',
      difficulty: question.difficulty || 'medium',
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      knowledgePoints: question.knowledgePoints || [],
      svgData: question.svgData,
      figureProperties: question.figureProperties,
      hasGeometryFigure: question.hasGeometryFigure || false,
      source: 'user_paste',
      createdBy: req.user?.id || null,
      isActive: true
    })

    await newQuestion.save()

    res.json({
      success: true,
      message: '题目已成功添加到题库',
      questionId: newQuestion._id
    })

  } catch (error) {
    console.error('保存题目错误:', error)
    res.status(500).json({
      success: false,
      message: '保存题目失败，请稍后再试'
    })
  }
}))

// @desc    获取最近粘贴的题目
// @route   GET /api/ai/recent-questions
// @access  Public
router.get('/recent-questions', optionalAuthMiddleware, [
  query('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('学科名称不能超过20个字符'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('数量限制必须在1-20之间')
], asyncHandler(async (req, res) => {
  const { subject, limit = 10 } = req.query
  
  try {
    const query = {
      source: 'user_paste',
      isActive: true
    }
    
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' }
    }
    
    if (req.user?.id) {
      query.createdBy = req.user.id
    }

    const recentQuestions = await Question.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('content subject difficulty type options knowledgePoints createdAt')

    res.json({
      success: true,
      questions: recentQuestions
    })

  } catch (error) {
    console.error('获取最近题目错误:', error)
    res.status(500).json({
      success: false,
      message: '获取题目列表失败'
    })
  }
}))

// @desc    生成实时答题方案
// @route   POST /api/ai/solutions
// @access  Public (可选身份验证)
router.post('/solutions', optionalAuthMiddleware, [
  body('question')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('题目内容不能为空且不能超过2000个字符'),
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('学科名称不能超过20个字符'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('请选择有效的难度等级'),
  body('imageData')
    .optional()
    .isString()
    .withMessage('图片数据必须是字符串格式'),
  body('mimeType')
    .optional()
    .isString()
    .withMessage('图片类型必须是字符串格式'),
  body('chatHistory')
    .optional()
    .isArray({ max: 10 })
    .withMessage('聊天历史不能超过10条消息')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  const { question, subject, difficulty, options, knowledgePoints, imageData, mimeType, chatHistory, ocrText } = req.body
  
  let prompt = `请为以下题目生成3个不同的解题方案：\n\n`
  
  // 如果有聊天历史，添加上下文信息
  if (chatHistory && chatHistory.length > 0) {
    prompt += `用户最近的问题历史：\n`
    chatHistory.forEach((chat, index) => {
      if (chat.type === 'user') {
        prompt += `${index + 1}. ${chat.content}\n`
      }
    })
    prompt += `\n基于以上问题历史，请生成针对性的解题方案：\n\n`
  }
  
  // 如果有OCR文本，优先使用OCR识别的内容
  if (ocrText) {
    prompt += `题目内容（OCR识别）：${ocrText}\n`
    if (question !== ocrText) {
      prompt += `题目描述：${question}\n`
    }
  } else if (imageData && mimeType) {
    prompt += `题目类型：图片题目\n题目内容：${question}\n`
  } else {
    prompt += `题目内容：${question}\n`
  }
  
  if (subject) {
    prompt += `学科：${subject}\n`
  }
  if (difficulty) {
    prompt += `难度：${difficulty}\n`
  }
  if (options && options.length > 0) {
    prompt += `选项：${options.join('; ')}\n`
  }
  if (knowledgePoints && knowledgePoints.length > 0) {
    prompt += `知识点：${knowledgePoints.join('、')}\n`
  }
  
  prompt += `\n请提供3种不同的解题思路和方法，每种方案包括：
  1. 解题思路
  2. 具体步骤
  3. 关键要点
  4. 常见错误提醒
  
  **重要：数学公式格式要求**
  - 必须使用KaTeX兼容格式，严禁使用Unicode数学符号
  - 行内公式请使用 $公式$ 格式，如：$x^2 + 2x - 3 = 0$
  - 块级公式请使用 $$公式$$ 格式，如：$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
  - KaTeX命令使用单反斜杠，如：\frac、\sqrt、\pm
  - 上标用^，下标用_，如：$x^2$、$a_1$
  - 分数用\frac{分子}{分母}，如：$\frac{1}{2}$
  - 根号用\sqrt{}，如：$\sqrt{16}$
  - 正负号用\pm，如：$\pm 2$
  - 积分用\int，如：$\int x dx$
  - 求和用\sum，如：$\sum_{i=1}^{n} i$
  - 禁止使用：∫、²、³、×、÷、±、≤、≥、≠、π等Unicode符号
  - 必须用KaTeX：\int、^2、^3、\times、\div、\pm、\leq、\geq、\neq、\pi
  
  **重要：必须严格按照以下JSON格式返回，不要添加任何其他文本：**
  {
    "solutions": [
      {
        "title": "方案标题",
        "approach": "解题思路",
        "steps": ["步骤1", "步骤2", "步骤3"],
        "keyPoints": ["要点1", "要点2"],
        "commonMistakes": ["错误1", "错误2"]
      }
    ]
  }
  
  确保返回的是有效的JSON格式，不要包含任何解释性文字。`
  
  let result
  
  try {
    // 如果有图片数据，使用图片AI服务
    if (imageData && mimeType) {
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
      
      const context = {
        subject: subject,
        difficulty: difficulty
      }
      
      result = await aiImageService.chatWithImage(base64Data, prompt, context)
    } else {
      // 使用普通AI服务生成结构化响应
      result = await aiService.generateResponse(prompt, {
        systemMessage: '你是一名专业的解题专家，专门为学生提供详细的解题方案。重要提醒：确保所有解题方案和知识点都控制在高中及以下知识范围内，使用高中生能够理解的概念和术语，避免涉及大学或更高层次的专业知识。如需要返回专业的概念涉及到公式，请严格按照标准的Katex格式。整个内容请严格按照要求的JSON格式返回结果，不要添加任何其他文本。',
        temperature: 0.3
      })
      
      // 将generateResponse的返回格式转换为标准格式
      if (result) {
        result = {
          success: true,
          response: result
        }
      } else {
        result = {
          success: false,
          error: 'AI服务返回空结果'
        }
      }
    }
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'AI服务暂时不可用，请稍后再试'
      })
    }
    
    // 尝试解析AI返回的JSON
    let solutions = []
    try {
      const responseText = result.response || result.advice
      console.log('AI原始响应:', responseText)
      
      // 清理响应文本，移除可能的markdown代码块标记
      let cleanedText = responseText.trim()
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // 尝试直接解析JSON
      let parsed
      try {
        parsed = JSON.parse(cleanedText)
      } catch (directParseError) {
        // 如果直接解析失败，尝试提取JSON部分
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法找到有效的JSON格式')
        }
      }
      
      solutions = parsed.solutions || []
      console.log('解析得到的solutions:', solutions)
      
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      console.error('原始响应文本:', result.response || result.advice)
      
      // 如果解析失败，返回原始文本作为单个方案
      solutions = [{
        title: '解题方案',
        approach: result.response || result.advice,
        steps: [],
        keyPoints: [],
        commonMistakes: []
      }]
    }
    
    // 自动存储知识点
    if (knowledgePoints && knowledgePoints.length > 0 && subject) {
      try {
        for (const knowledgePointName of knowledgePoints) {
          if (knowledgePointName && knowledgePointName.trim()) {
            await KnowledgePoint.findOrCreate(knowledgePointName.trim(), subject, {
              definition: `${knowledgePointName}相关知识点`,
              source: 'ai',
              relatedConcepts: knowledgePoints.filter(kp => kp !== knowledgePointName)
            })
          }
        }
        console.log('知识点自动存储完成')
      } catch (kpError) {
        console.error('知识点自动存储失败:', kpError)
        // 不影响主要功能，继续返回结果
      }
    }

    res.json({
      success: true,
      solutions: solutions
    })
    
  } catch (error) {
    console.error('生成答题方案失败:', error)
    res.status(500).json({
      success: false,
      error: '生成答题方案失败，请稍后重试'
    })
  }
}))

export default router