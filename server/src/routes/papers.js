import express from 'express'
import multer from 'multer'
import { body, query, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import Paper from '../models/Paper.js'
import Question from '../models/Question.js'
import User from '../models/User.js'
import ocrService from '../services/ocrService.js'
import path from 'path'
import fs from 'fs/promises'

const router = express.Router()

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/papers'
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `paper-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('只支持 JPEG, PNG, PDF, DOC, DOCX 格式的文件'))
    }
  }
})

// @desc    获取试卷列表
// @route   GET /api/papers
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
  query('subject')
    .optional()
    .isIn(['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'])
    .withMessage('请选择有效的科目'),
  query('grade')
    .optional()
    .isIn(['高一', '高二', '高三'])
    .withMessage('请选择有效的年级'),
  query('difficulty')
    .optional()
    .isIn(['简单', '中等', '困难'])
    .withMessage('请选择有效的难度'),
  query('status')
    .optional()
    .isIn(['uploading', 'processing', 'processed', 'failed', 'published'])
    .withMessage('请选择有效的状态')
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
  const limit = parseInt(req.query.limit) || 10
  const { subject, grade, difficulty, status, search, my } = req.query

  // 构建查询条件
  const query = { isActive: true }
  
  // 如果不是管理员，只能看到自己的试卷或公开的试卷
  if (req.user.role !== 'admin') {
    if (my === 'true') {
      query.uploadedBy = req.user.id
    } else {
      query.$or = [
        { uploadedBy: req.user.id },
        { isPublic: true, status: 'published' }
      ]
    }
  }
  
  if (subject) query.subject = subject
  if (grade) query.grade = grade
  if (difficulty) query.difficulty = difficulty
  if (status) query.status = status
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ]
  }

  const skip = (page - 1) * limit

  const [papers, total] = await Promise.all([
    Paper.find(query)
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Paper.countDocuments(query)
  ])

  res.json({
    success: true,
    data: {
      papers: papers.map(paper => ({
        ...paper.getSummary(),
        uploadedBy: paper.uploadedBy,
        tags: paper.tags,
        likeCount: paper.likeCount,
        downloadCount: paper.downloadCount,
        processingProgress: paper.processingProgress
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

// @desc    获取单个试卷详情
// @route   GET /api/papers/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id)
    .populate('uploadedBy', 'name avatar school')
    .populate('questions')
  
  if (!paper) {
    return res.status(404).json({
      success: false,
      error: '试卷不存在'
    })
  }

  // 检查访问权限
  if (!paper.isPublic && paper.uploadedBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权访问该试卷'
    })
  }

  // 增加浏览次数
  await paper.incrementView()

  res.json({
    success: true,
    data: {
      paper: {
        id: paper._id,
        title: paper.title,
        description: paper.description,
        subject: paper.subject,
        grade: paper.grade,
        examType: paper.examType,
        difficulty: paper.difficulty,
        totalScore: paper.totalScore,
        timeLimit: paper.timeLimit,
        uploadedBy: paper.uploadedBy,
        tags: paper.tags,
        status: paper.status,
        processingProgress: paper.processingProgress,
        metadata: paper.metadata,
        isPublic: paper.isPublic,
        viewCount: paper.viewCount,
        downloadCount: paper.downloadCount,
        likeCount: paper.likeCount,
        averageRating: paper.averageRating,
        comments: paper.comments.slice(-5), // 只返回最新5条评论
        questions: paper.questions.map(q => q.getSummary()),
        createdAt: paper.createdAt,
        updatedAt: paper.updatedAt
      }
    }
  })
}))

// @desc    上传试卷
// @route   POST /api/papers/upload
// @access  Private
router.post('/upload', upload.single('file'), [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('试卷标题长度必须在1-200个字符之间'),
  body('subject')
    .isIn(['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'])
    .withMessage('请选择有效的科目'),
  body('grade')
    .isIn(['高一', '高二', '高三'])
    .withMessage('请选择有效的年级'),
  body('examType')
    .optional()
    .isIn(['期中考试', '期末考试', '月考', '模拟考试', '单元测试', '练习题', '高考真题', '其他'])
    .withMessage('请选择有效的考试类型'),
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

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: '请选择要上传的文件'
    })
  }

  const {
    title,
    description,
    subject,
    grade,
    examType,
    difficulty,
    totalScore,
    timeLimit,
    tags
  } = req.body

  // 创建试卷记录
  const paper = await Paper.create({
    title,
    description,
    subject,
    grade,
    examType: examType || '练习题',
    difficulty: difficulty || '中等',
    totalScore: totalScore || 100,
    timeLimit: timeLimit || 120,
    uploadedBy: req.user.id,
    originalFile: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    },
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    status: 'processing'
  })

  // 异步处理文件（OCR识别）
  const paperInfo = {
    subject,
    grade,
    examType: examType || '练习题',
    uploadedBy: req.user.id
  }
  
  ocrService.processPaper(req.file.path, paperInfo).then(async (result) => {
    if (result.success) {
      // 创建题目
      const questions = []
      for (let i = 0; i < result.questions.length; i++) {
        const questionData = result.questions[i]
        const question = await Question.create({
          paper: paper._id,
          questionNumber: i + 1,
          type: questionData.type,
          content: questionData.content,
          options: questionData.options,
          correctAnswer: questionData.correctAnswer,
          explanation: questionData.explanation,
          score: questionData.score || 1,
          difficulty: questionData.difficulty || 'medium',
          knowledgePoints: questionData.knowledgePoints || []
        })
        questions.push(question)
      }
      
      // 更新试卷状态
      await Paper.findByIdAndUpdate(paper._id, {
        status: 'processed',
        questions: questions.map(q => q._id),
        totalScore: result.totalScore,
        extractedText: result.extractedText
      })
    } else {
      await Paper.findByIdAndUpdate(paper._id, {
        status: 'failed',
        processingError: result.error
      })
    }
  }).catch(async (error) => {
    console.error('文件处理失败:', error)
    await Paper.findByIdAndUpdate(paper._id, {
      status: 'failed',
      processingError: error.message
    })
  })

  // 更新用户统计
  const user = await User.findById(req.user.id)
  user.stats.papersUploaded += 1
  await user.save()

  res.status(201).json({
    success: true,
    data: {
      paper: paper.getSummary()
    }
  })
}))

// @desc    更新试卷信息
// @route   PUT /api/papers/:id
// @access  Private
router.put('/:id', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('试卷标题长度必须在1-200个字符之间'),
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

  const paper = await Paper.findById(req.params.id)
  
  if (!paper) {
    return res.status(404).json({
      success: false,
      error: '试卷不存在'
    })
  }

  // 检查权限
  if (paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权修改该试卷'
    })
  }

  const {
    title,
    description,
    difficulty,
    totalScore,
    timeLimit,
    tags,
    isPublic
  } = req.body

  // 更新字段
  if (title) paper.title = title
  if (description !== undefined) paper.description = description
  if (difficulty) paper.difficulty = difficulty
  if (totalScore) paper.totalScore = totalScore
  if (timeLimit) paper.timeLimit = timeLimit
  if (tags) paper.tags = tags.split(',').map(tag => tag.trim())
  if (isPublic !== undefined) paper.isPublic = isPublic

  await paper.save()

  res.json({
    success: true,
    data: {
      paper: paper.getSummary()
    }
  })
}))

// @desc    删除试卷
// @route   DELETE /api/papers/:id
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id)
  
  if (!paper) {
    return res.status(404).json({
      success: false,
      error: '试卷不存在'
    })
  }

  // 检查权限
  if (paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权删除该试卷'
    })
  }

  // 软删除
  paper.isActive = false
  await paper.save()

  res.json({
    success: true,
    message: '试卷已删除'
  })
}))

// @desc    获取试卷处理状态
// @route   GET /api/papers/:id/status
// @access  Private
router.get('/:id/status', asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id)
    .select('status processingProgress processingError metadata')
  
  if (!paper) {
    return res.status(404).json({
      success: false,
      error: '试卷不存在'
    })
  }

  // 检查权限
  if (paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权访问该试卷状态'
    })
  }

  res.json({
    success: true,
    data: {
      status: paper.status,
      progress: paper.processingProgress,
      error: paper.processingError,
      totalQuestions: paper.metadata.totalQuestions
    }
  })
}))

// @desc    添加试卷评论
// @route   POST /api/papers/:id/comments
// @access  Private
router.post('/:id/comments', [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('评论内容长度必须在1-500个字符之间'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须在1-5之间')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const paper = await Paper.findById(req.params.id)
  
  if (!paper) {
    return res.status(404).json({
      success: false,
      error: '试卷不存在'
    })
  }

  const { content, rating } = req.body

  await paper.addComment(req.user.id, content, rating)

  res.status(201).json({
    success: true,
    message: '评论添加成功'
  })
}))

export default router