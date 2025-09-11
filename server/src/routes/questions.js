import express from 'express'
import { body, query, validationResult } from 'express-validator'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authMiddleware } from '../middleware/auth.js'
import Question from '../models/Question.js'
import Paper from '../models/Paper.js'
import StudyRecord from '../models/StudyRecord.js'
import UserSupplement from '../models/UserSupplement.js'
import ocrService from '../services/ocrService.js'

const router = express.Router()

// 配置图片上传
const upload = multer({
  dest: process.env.UPLOAD_PATH || './uploads',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 JPG、PNG、WEBP、SVG 格式的图片'), false)
    }
  }
})

// @desc    获取题目统计信息
// @route   GET /api/questions/stats
// @access  Private
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  try {
    // 获取总题目数
    const totalQuestions = await Question.countDocuments({ isActive: true })
    
    // 获取各学科题目数
    const subjectStats = await Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    
    // 转换为对象格式
    const subjectCounts = {}
    subjectStats.forEach(stat => {
      subjectCounts[stat._id] = stat.count
    })
    
    res.json({
      success: true,
      data: {
        totalQuestions,
        subjectCounts
      }
    })
  } catch (error) {
    console.error('获取题目统计失败:', error)
    res.status(500).json({
      success: false,
      error: '获取题目统计失败'
    })
  }
}))

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
  const { paper, type, subject, grade, difficulty, search, random } = req.query

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

  let questions, total
  
  if (random === 'true') {
    // 随机获取题目
    const pipeline = [
      { $match: query },
      { $sample: { size: limit } }
    ]
    
    const [randomQuestions, totalCount] = await Promise.all([
      Question.aggregate(pipeline),
      Question.countDocuments(query)
    ])
    
    // 手动populate paper字段
    questions = await Question.populate(randomQuestions, {
      path: 'paper',
      select: 'title subject grade'
    })
    
    total = totalCount
  } else {
    // 常规分页查询
    const skip = (page - 1) * limit
    
    const [regularQuestions, totalCount] = await Promise.all([
      Question.find(query)
        .populate('paper', 'title subject grade')
        .sort({ questionNumber: 1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(query)
    ])
    
    questions = regularQuestions
    total = totalCount
  }

  res.json({
    success: true,
    data: {
      questions: questions.map(question => {
        // 处理聚合查询返回的普通对象和Mongoose文档
        if (question.getSummary) {
          return {
            ...question.getSummary(),
            paper: question.paper
          }
        } else {
          // 聚合查询返回的普通对象 - 确保包含完整的图形数据
          return {
            id: question._id,
            questionNumber: question.questionNumber,
            type: question.type,
            content: question.content,
            subject: question.subject,
            difficulty: question.difficulty,
            score: question.score,
            estimatedTime: question.estimatedTime,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            knowledgePoints: question.knowledgePoints,
            tags: question.tags,
            chapter: question.chapter,
            section: question.section,
            source: question.source,
            // 确保包含所有图形相关字段
            imageData: question.imageData,
            mimeType: question.mimeType,
            svgData: question.svgData,
            figureProperties: question.figureProperties,
            hasGeometryFigure: question.hasGeometryFigure,
            ocrText: question.ocrText,
            statistics: question.statistics,
            paper: question.paper,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt
          }
        }
      }),
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

// @desc    处理粘贴的图片（直接存储，不进行OCR识别）
// @route   POST /api/questions/parse-image
// @access  Private
router.post('/parse-image', authMiddleware, upload.single('image'), [  
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('科目名称必须在1-20个字符之间')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: '请上传图片文件'
    })
  }

  const { subject } = req.body
  const filePath = req.file.path

  try {
    console.log('开始处理图片:', filePath)
    
    // 读取图片文件并转换为base64
    const imageBuffer = await fs.readFile(filePath)
    const imageBase64 = imageBuffer.toString('base64')
    const mimeType = req.file.mimetype
    
    console.log('图片处理成功，大小:', Math.round(imageBuffer.length / 1024), 'KB')

    // 使用AI分析图片内容并生成知识点
    let analyzedContent = '图片题目'
    let knowledgePoints = []
    let ocrText = ''
    let questionType = 'image'
    let difficulty = 'medium'
    let correctAnswer = null
    
    try {
      // 调用AI服务分析图片内容
      const aiService = await import('../services/aiService.js')
      const analysisResult = await aiService.default.analyzeImageContent(imageBase64, subject)
      
      if (analysisResult.success) {
        analyzedContent = analysisResult.content || '图片题目'
        knowledgePoints = analysisResult.knowledgePoints || []
        ocrText = analysisResult.ocrText || ''
        questionType = analysisResult.questionType || 'image'
        difficulty = analysisResult.difficulty || 'medium'
        console.log('AI分析成功，识别到知识点:', knowledgePoints)
        console.log('OCR识别文本:', ocrText)
        
        // 如果识别出具体题目内容，尝试生成答案
        if (ocrText && ocrText.length > 10 && questionType !== '图片题') {
          try {
            console.log('检测到具体题目，开始生成答案...')
            const answerResult = await aiService.default.generateAnswer(ocrText, subject, questionType)
            if (answerResult.success && answerResult.answer) {
              correctAnswer = answerResult.answer
              console.log('AI生成答案成功:', correctAnswer)
            }
          } catch (answerError) {
            console.error('AI生成答案失败:', answerError)
          }
        }
      }
    } catch (aiError) {
      console.error('AI分析图片失败:', aiError)
      // 继续使用默认值
    }

    // 根据题目类型决定是否需要correctAnswer
    const questionData = {
      content: analyzedContent,
      ocrText: ocrText, // 添加OCR识别的文字内容
      subject: subject,
      difficulty: difficulty,
      type: '图片题', // 明确设置为图片题类型
      knowledgePoints: knowledgePoints,
      imageData: imageBase64,
      mimeType: mimeType,
      source: 'image_upload',
      createdBy: req.user?.id || null,
      isActive: true,
      ocrExtracted: true // 标记为OCR提取的题目
    }
    
    // 如果AI生成了答案且不是纯图片题，添加correctAnswer
    if (correctAnswer && questionType !== '图片题') {
      questionData.correctAnswer = correctAnswer
      questionData.type = questionType // 使用AI识别的具体题目类型
    }
    
    // 自动保存图片题目到数据库
    const newQuestion = new Question(questionData)

    await newQuestion.save()
    console.log('图片题目已自动保存到题库，ID:', newQuestion._id)

    // 如果生成了知识点，自动保存到知识点库
    if (knowledgePoints && knowledgePoints.length > 0) {
      try {
        const KnowledgePoint = await import('../models/KnowledgePoint.js')
        for (const knowledgePointName of knowledgePoints) {
          if (knowledgePointName && knowledgePointName.trim()) {
            await KnowledgePoint.default.findOrCreate(knowledgePointName.trim(), subject, {
              definition: `${knowledgePointName}相关知识点`,
              source: 'image_analysis',
              relatedConcepts: knowledgePoints.filter(kp => kp !== knowledgePointName)
            })
          }
        }
        console.log('图片题目知识点已自动保存到知识点库')
      } catch (kpError) {
        console.error('保存知识点失败:', kpError)
        // 不影响主要功能，继续返回结果
      }
    }

    // 创建返回的题目对象
    const question = {
      _id: newQuestion._id,
      content: newQuestion.content,
      subject: newQuestion.subject,
      difficulty: newQuestion.difficulty,
      type: newQuestion.type,
      knowledgePoints: newQuestion.knowledgePoints,
      imageData: imageBase64,
      mimeType: mimeType,
      createdAt: newQuestion.createdAt
    }

    // 删除临时文件
    try {
      await fs.unlink(filePath)
    } catch (unlinkError) {
      console.error('删除临时文件失败:', unlinkError)
    }

    res.json({
      success: true,
      question: question,
      subjectMatch: true, // 图片题目暂时默认匹配当前科目
      suggestedSubject: subject // 返回当前设置的科目
    })

  } catch (error) {
    console.error('图片处理失败:', error)
    console.error('错误堆栈:', error.stack)
    console.error('错误详情:', {
      message: error.message,
      name: error.name,
      code: error.code
    })
    
    // 删除临时文件
    try {
      await fs.unlink(filePath)
    } catch (unlinkError) {
      console.error('删除临时文件失败:', unlinkError)
    }

    res.status(500).json({
      success: false,
      error: `图片处理失败: ${error.message || '请重试'}`
    })
  }
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

// @desc    获取题目的用户补充内容
// @route   GET /api/questions/:id/supplements
// @access  Private
router.get('/:id/supplements', authMiddleware, asyncHandler(async (req, res) => {
  const questionId = req.params.id
  
  // 检查题目是否存在
  const question = await Question.findById(questionId)
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在'
    })
  }
  
  // 获取该题目的所有用户补充内容
  const supplements = await UserSupplement.find({ 
    question: questionId,
    isActive: true 
  })
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 })
  
  res.json({
    success: true,
    data: { supplements }
  })
}))

// @desc    创建用户补充内容
// @route   POST /api/questions/:id/supplements
// @access  Private
router.post('/:id/supplements', authMiddleware, [
  body('type')
    .isIn(['knowledge_point', 'answer_supplement'])
    .withMessage('补充类型必须是knowledge_point或answer_supplement'),
  body('selectedText')
    .trim()
    .isLength({ min: 1 })
    .withMessage('选中文本不能为空'),
  body('supplementContent')
    .trim()
    .isLength({ min: 1 })
    .withMessage('补充内容不能为空'),
  body('textPosition.startIndex')
    .isInt({ min: 0 })
    .withMessage('文本起始位置必须是非负整数'),
  body('textPosition.endIndex')
    .isInt({ min: 0 })
    .withMessage('文本结束位置必须是非负整数'),
  body('textPosition.context')
    .trim()
    .isLength({ min: 1 })
    .withMessage('文本上下文不能为空')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }
  
  const questionId = req.params.id
  const {
    type,
    selectedText,
    supplementContent,
    knowledgePointName,
    textPosition
  } = req.body
  
  // 检查题目是否存在
  const question = await Question.findById(questionId)
  if (!question) {
    return res.status(404).json({
      success: false,
      error: '题目不存在'
    })
  }
  
  // 创建用户补充内容
  const supplement = new UserSupplement({
    question: questionId,
    type,
    selectedText,
    supplementContent,
    knowledgePointName,
    textPosition,
    createdBy: req.user.id
  })
  
  await supplement.save()
  await supplement.populate('createdBy', 'username')
  
  res.status(201).json({
    success: true,
    data: { supplement }
  })
}))

// @desc    更新用户补充内容
// @route   PUT /api/questions/:id/supplements/:supplementId
// @access  Private
router.put('/:id/supplements/:supplementId', authMiddleware, [
  body('supplementContent')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('补充内容不能为空'),
  body('knowledgePointName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('知识点名称不能为空')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }
  
  const { supplementId } = req.params
  const { supplementContent, knowledgePointName } = req.body
  
  // 查找补充内容
  const supplement = await UserSupplement.findById(supplementId)
  if (!supplement) {
    return res.status(404).json({
      success: false,
      error: '补充内容不存在'
    })
  }
  
  // 检查权限（只有创建者可以修改）
  if (supplement.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权修改该补充内容'
    })
  }
  
  // 更新补充内容
  if (supplementContent !== undefined) {
    supplement.supplementContent = supplementContent
  }
  if (knowledgePointName !== undefined) {
    supplement.knowledgePointName = knowledgePointName
  }
  
  supplement.updatedAt = new Date()
  await supplement.save()
  await supplement.populate('createdBy', 'username')
  
  res.json({
    success: true,
    data: { supplement }
  })
}))

// @desc    删除用户补充内容
// @route   DELETE /api/questions/:id/supplements/:supplementId
// @access  Private
router.delete('/:id/supplements/:supplementId', authMiddleware, asyncHandler(async (req, res) => {
  const { supplementId } = req.params
  
  // 查找补充内容
  const supplement = await UserSupplement.findById(supplementId)
  if (!supplement) {
    return res.status(404).json({
      success: false,
      error: '补充内容不存在'
    })
  }
  
  // 检查权限（只有创建者可以删除）
  if (supplement.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权删除该补充内容'
    })
  }
  
  // 软删除
  supplement.isActive = false
  supplement.updatedAt = new Date()
  await supplement.save()
  
  res.json({
    success: true,
    message: '补充内容已删除'
  })
}))

// @desc    为补充内容评分
// @route   POST /api/questions/:id/supplements/:supplementId/rate
// @access  Private
router.post('/:id/supplements/:supplementId/rate', authMiddleware, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须是1-5之间的整数')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }
  
  const { supplementId } = req.params
  const { rating } = req.body
  
  // 查找补充内容
  const supplement = await UserSupplement.findById(supplementId)
  if (!supplement) {
    return res.status(404).json({
      success: false,
      error: '补充内容不存在'
    })
  }
  
  // 更新评分（简单实现，实际应该记录每个用户的评分）
  const newRatingCount = supplement.ratingCount + 1
  const newRating = ((supplement.rating * supplement.ratingCount) + rating) / newRatingCount
  
  supplement.rating = newRating
  supplement.ratingCount = newRatingCount
  supplement.updatedAt = new Date()
  await supplement.save()
  
  res.json({
    success: true,
    data: { 
      rating: supplement.rating,
      ratingCount: supplement.ratingCount
    }
  })
}))

export default router