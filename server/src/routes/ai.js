import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authMiddleware } from '../middleware/auth.js'
import aiService from '../services/aiService.js'
import StudyRecord from '../models/StudyRecord.js'
import Question from '../models/Question.js'

const router = express.Router()

// 所有AI路由都需要身份验证
router.use(authMiddleware)

// @desc    获取个性化学习建议
// @route   GET /api/ai/study-advice
// @access  Private
router.get('/study-advice', asyncHandler(async (req, res) => {
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
router.post('/ask-question', [
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

// @desc    错题分析
// @route   POST /api/ai/analyze-wrong-answer
// @access  Private
router.post('/analyze-wrong-answer', [
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
router.post('/learning-path', [
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

// @desc    智能题目推荐
// @route   GET /api/ai/recommend-questions
// @access  Private
router.get('/recommend-questions', [
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
router.get('/study-report', [
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

// @desc    实时学习指导
// @route   POST /api/ai/learning-guidance
// @access  Private
router.post('/learning-guidance', [
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
router.get('/interactions/:studyRecordId', asyncHandler(async (req, res) => {
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

export default router