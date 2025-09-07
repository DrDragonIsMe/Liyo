import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import Question from '../models/Question.js'
import Paper from '../models/Paper.js'
import StudyRecord from '../models/StudyRecord.js'

const router = express.Router()

// @desc    获取题目列表
// @route   GET /api/questions
// @access  Private
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间'),
  query('paper')
    .optional()
    .isMongoId()
    .withMessage('试卷ID格式不正确'),
  query('type')
    .optional()
    .isIn(['选择题', '填空题', '解答题', '判断题', '简答题', '计算题', '证明题', '作文题'])
    .withMessage('请选择有效的题目类型'),
  query('subject')
    .optional()
    .isIn(['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'])
    .withMessage('请选择有效的科目'),
  query('difficulty')
    .optional()
    .isIn(['简单', '中等', '困难'])
    .withMessage('请选择有效的难度')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const { paper, type, subject, grade, difficulty, search } = req.query

  // 构建查询条件
  const query = { isActive: true }
  
  if (paper) {
    query.paper = paper
  }
  if (type) {
    query.type = type
  }
  if (subject) {
    query.subject = subject
  }
  if (grade) {
    query.grade = grade
  }
  if (difficulty) {
    query.difficulty = difficulty
  }
  
  if (search) {
    query.$or = [
      { content: { $regex: search, $options: 'i' } },
      { knowledgePoints: { $in: [new RegExp(search, 'i')] } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ]
  }

  const skip = (page - 1) * limit

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate('paper', 'title subject grade')
      .sort({ questionNumber: 1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments(query)
  ])

  res.json({
    success: true,
    data: {
      questions: questions.map(question => ({
        ...question.getSummary(),
        paper: question.paper
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    }
  })
}))

// @desc    获取单个题目详情
// @route   GET /api/questions/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('paper', 'title subject grade uploadedBy')
    .populate('createdBy', 'name avatar')
  
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在'
    })
  }

  // 检查访问权限
  const paper = await Paper.findById(question.paper._id)
  if (!paper.isPublic && paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权访问该题目'
    })
  }

  res.json({
    success: true,
    data: {
      question: {
        id: question._id,
        paper: question.paper,
        questionNumber: question.questionNumber,
        type: question.type,
        content: question.content,
        images: question.images,
        options: question.options,
        explanation: question.explanation,
        solution: question.solution,
        hints: question.hints,
        difficulty: question.difficulty,
        score: question.score,
        estimatedTime: question.estimatedTime,
        subject: question.subject,
        grade: question.grade,
        knowledgePoints: question.knowledgePoints,
        tags: question.tags,
        chapter: question.chapter,
        section: question.section,
        source: question.source,
        year: question.year,
        statistics: question.statistics,
        accuracy: question.accuracy,
        aiGenerated: question.aiGenerated,
        ocrExtracted: question.ocrExtracted,
        ocrConfidence: question.ocrConfidence,
        manuallyReviewed: question.manuallyReviewed,
        createdBy: question.createdBy,
        createdAt: question.createdAt
      }
    }
  })
}))

// @desc    获取答题用的题目信息（不包含答案）
// @route   GET /api/questions/:id/for-answering
// @access  Private
router.get('/:id/for-answering', asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('paper', 'title subject grade uploadedBy')
  
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在'
    })
  }

  // 检查访问权限
  const paper = await Paper.findById(question.paper._id)
  if (!paper.isPublic && paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权访问该题目'
    })
  }

  res.json({
    success: true,
    data: {
      question: question.getForAnswering()
    }
  })
}))

// @desc    创建题目
// @route   POST /api/questions
// @access  Private
router.post('/', [
  body('paper')
    .isMongoId()
    .withMessage('试卷ID格式不正确'),
  body('questionNumber')
    .isInt({ min: 1 })
    .withMessage('题目序号必须是正整数'),
  body('type')
    .isIn(['选择题', '填空题', '解答题', '判断题', '简答题', '计算题', '证明题', '作文题'])
    .withMessage('请选择有效的题目类型'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('题目内容不能为空'),
  body('score')
    .isInt({ min: 1 })
    .withMessage('题目分值必须是正整数'),
  body('difficulty')
    .optional()
    .isIn(['简单', '中等', '困难'])
    .withMessage('请选择有效的难度')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const {
    paper: paperId,
    questionNumber,
    type,
    content,
    options,
    correctAnswer,
    explanation,
    solution,
    hints,
    difficulty,
    score,
    estimatedTime,
    knowledgePoints,
    tags,
    chapter,
    section
  } = req.body

  // 检查试卷是否存在且有权限
  const paper = await Paper.findById(paperId)
  if (!paper) {
    return res.status(404).json({
      success: false,
      error: '试卷不存在'
    })
  }

  if (paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权在该试卷中添加题目'
    })
  }

  // 检查题目序号是否重复
  const existingQuestion = await Question.findOne({
    paper: paperId,
    questionNumber,
    isActive: true
  })
  
  if (existingQuestion) {
    return res.status(400).json({
      success: false,
      error: `题目序号 ${questionNumber} 已存在`
    })
  }

  // 创建题目
  const question = await Question.create({
    paper: paperId,
    questionNumber,
    type,
    content,
    options: options || [],
    correctAnswer,
    explanation,
    solution,
    hints: hints || [],
    difficulty: difficulty || '中等',
    score,
    estimatedTime: estimatedTime || 2,
    subject: paper.subject,
    grade: paper.grade,
    knowledgePoints: knowledgePoints || [],
    tags: tags || [],
    chapter,
    section,
    createdBy: req.user.id
  })

  // 更新试卷的题目列表
  paper.questions.push(question._id)
  await paper.updateStats()

  res.status(201).json({
    success: true,
    data: {
      question: question.getSummary()
    }
  })
}))

// @desc    更新题目
// @route   PUT /api/questions/:id
// @access  Private
router.put('/:id', [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('题目内容不能为空'),
  body('score')
    .optional()
    .isInt({ min: 1 })
    .withMessage('题目分值必须是正整数'),
  body('difficulty')
    .optional()
    .isIn(['简单', '中等', '困难'])
    .withMessage('请选择有效的难度')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const question = await Question.findById(req.params.id).populate('paper')
  
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在'
    })
  }

  // 检查权限
  if (question.paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权修改该题目'
    })
  }

  const {
    content,
    options,
    correctAnswer,
    explanation,
    solution,
    hints,
    difficulty,
    score,
    estimatedTime,
    knowledgePoints,
    tags,
    chapter,
    section
  } = req.body

  // 更新字段
  if (content) question.content = content
  if (options) question.options = options
  if (correctAnswer !== undefined) question.correctAnswer = correctAnswer
  if (explanation !== undefined) question.explanation = explanation
  if (solution !== undefined) question.solution = solution
  if (hints) question.hints = hints
  if (difficulty) question.difficulty = difficulty
  if (score) question.score = score
  if (estimatedTime) question.estimatedTime = estimatedTime
  if (knowledgePoints) question.knowledgePoints = knowledgePoints
  if (tags) question.tags = tags
  if (chapter !== undefined) question.chapter = chapter
  if (section !== undefined) question.section = section

  // 标记为已人工审核
  question.manuallyReviewed = true
  question.reviewedBy = req.user.id
  question.reviewNotes = '手动更新'

  await question.save()

  res.json({
    success: true,
    data: {
      question: question.getSummary()
    }
  })
}))

// @desc    删除题目
// @route   DELETE /api/questions/:id
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).populate('paper')
  
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在'
    })
  }

  // 检查权限
  if (question.paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权删除该题目'
    })
  }

  // 软删除
  question.isActive = false
  await question.save()

  // 从试卷中移除题目引用
  const paper = await Paper.findById(question.paper._id)
  paper.questions = paper.questions.filter(qId => qId.toString() !== question._id.toString())
  await paper.updateStats()

  res.json({
    success: true,
    message: '题目已删除'
  })
}))

// @desc    提交答案
// @route   POST /api/questions/:id/answer
// @access  Private
router.post('/:id/answer', [
  body('answer')
    .notEmpty()
    .withMessage('答案不能为空'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('答题时间必须是非负整数'),
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

  const question = await Question.findById(req.params.id)
  
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在'
    })
  }

  const { answer, timeSpent = 0, studyRecordId } = req.body

  // 检查答案
  const isCorrect = question.checkAnswer(answer)
  
  // 更新题目统计
  if (isCorrect !== null) {
    await question.updateStats(isCorrect, timeSpent)
  }

  // 更新用户学习统计
  const user = await User.findById(req.user.id)
  await user.updateStudyStats(Math.round(timeSpent / 60), isCorrect)

  // 如果提供了学习记录ID，更新学习记录
  if (studyRecordId) {
    const studyRecord = await StudyRecord.findById(studyRecordId)
    if (studyRecord && studyRecord.user.toString() === req.user.id) {
      await studyRecord.addAnswer(question._id, answer, isCorrect, timeSpent)
    }
  }

  res.json({
    success: true,
    data: {
      isCorrect,
      correctAnswer: isCorrect === false ? question.correctAnswer : undefined,
      explanation: isCorrect === false ? question.explanation : undefined,
      solution: isCorrect === false ? question.solution : undefined,
      timeSpent,
      accuracy: question.accuracy
    }
  })
}))

// @desc    获取题目统计信息
// @route   GET /api/questions/:id/stats
// @access  Private
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('paper', 'title uploadedBy')
  
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在'
    })
  }

  // 检查权限
  if (question.paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权查看该题目统计'
    })
  }

  res.json({
    success: true,
    data: {
      statistics: {
        totalAttempts: question.statistics.totalAttempts,
        correctAttempts: question.statistics.correctAttempts,
        accuracy: question.accuracy,
        averageTime: question.statistics.averageTime,
        difficultyRating: question.statistics.difficultyRating
      }
    }
  })
}))

export default router