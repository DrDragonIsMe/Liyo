import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'
import aiService from '../services/aiService.js'
import StudyRecord from '../models/StudyRecord.js'
import Question from '../models/Question.js'

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

  const { message, questionContext, chatHistory } = req.body
  
  // 构建上下文提示
  let contextPrompt = '你是一个专业的AI学习伴侣，专门帮助学生学习和解题。'
  
  if (questionContext) {
    contextPrompt += `\n\n当前题目信息：
    - 科目：${questionContext.subject}
    - 难度：${questionContext.difficulty}
    - 题目内容：${questionContext.content}
    - 知识点：${questionContext.knowledgePoints?.join('、')}`
    
    if (questionContext.options) {
      contextPrompt += `\n- 选项：${questionContext.options.join('; ')}`
    }
    
    if (questionContext.userAnswer) {
      contextPrompt += `\n- 用户当前答案：${questionContext.userAnswer}`
      contextPrompt += `\n- 是否已提交：${questionContext.isAnswered ? '是' : '否'}`
    }
  }
  
  contextPrompt += `\n\n请基于以上题目信息回答学生的问题。你的回答应该：
  1. 直接针对当前题目，无需重复描述题目内容
  2. 提供具体的解题思路和方法
  3. 解释相关知识点
  4. 语言简洁明了，适合学生理解
  5. 如果学生答错了，要耐心指导正确的思路
  
  学生的问题：${message}`
  
  const userId = req.user?.id || 'demo-user' // 使用演示用户ID
  const result = await aiService.generateStudyAdvice(userId, { prompt: contextPrompt })
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error || 'AI服务暂时不可用，请稍后再试'
    })
  }
  
  res.json({
    success: true,
    response: result.advice
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

export default router