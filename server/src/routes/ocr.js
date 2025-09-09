import express from 'express'
import { body, validationResult } from 'express-validator'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authMiddleware } from '../middleware/auth.js'
import ocrService from '../services/ocrService.js'
import Paper from '../models/Paper.js'
import Question from '../models/Question.js'

const router = express.Router()

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads'
    try {
      await fs.mkdir(uploadPath, { recursive: true })
      cb(null, uploadPath)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.OCR_MAX_FILE_SIZE) || 300 * 1024 * 1024 // 300MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.OCR_SUPPORTED_FORMATS || 'jpg,jpeg,png,pdf,webp').split(',')
    const fileExt = path.extname(file.originalname).toLowerCase().slice(1)
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件格式。支持的格式：${allowedTypes.join(', ')}`), false)
    }
  }
})

// 所有OCR路由都需要身份验证
router.use(authMiddleware)

// @desc    处理单个文件OCR
// @route   POST /api/ocr/process
// @access  Private
router.post('/process', upload.single('file'), [
  body('subject')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('科目名称必须在1-20个字符之间'),
  body('grade')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('年级必须在1-10个字符之间'),
  body('examType')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('考试类型不能超过20个字符')
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
      error: '请上传文件'
    })
  }

  const { subject, grade, examType = '练习' } = req.body
  const filePath = req.file.path

  try {
    // 构建试卷信息
    const paperInfo = {
      subject,
      grade,
      examType,
      uploadedBy: req.user.id
    }

    // 处理OCR
    const result = await ocrService.processPaper(filePath, paperInfo)

    if (!result.success) {
      // 删除上传的文件
      try {
        await fs.unlink(filePath)
      } catch (unlinkError) {
        console.error('删除文件失败:', unlinkError)
      }

      return res.status(500).json({
        success: false,
        error: result.error
      })
    }

    res.json({
      success: true,
      data: {
        extractedText: result.extractedText,
        questions: result.questions,
        totalQuestions: result.totalQuestions,
        totalScore: result.totalScore,
        filePath: filePath,
        paperInfo
      }
    })
  } catch (error) {
    console.error('OCR处理失败:', error)
    
    // 删除上传的文件
    try {
      await fs.unlink(filePath)
    } catch (unlinkError) {
      console.error('删除文件失败:', unlinkError)
    }

    res.status(500).json({
      success: false,
      error: 'OCR处理失败'
    })
  }
}))

// @desc    批量处理多个文件OCR
// @route   POST /api/ocr/process-batch
// @access  Private
router.post('/process-batch', upload.array('files', 10), [
  body('subject')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('科目名称必须在1-20个字符之间'),
  body('grade')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('年级必须在1-10个字符之间'),
  body('examType')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('考试类型不能超过20个字符')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: '请上传至少一个文件'
    })
  }

  const { subject, grade, examType = '练习' } = req.body
  const filePaths = req.files.map(file => file.path)

  try {
    // 构建试卷信息
    const paperInfo = {
      subject,
      grade,
      examType,
      uploadedBy: req.user.id
    }

    // 批量处理OCR
    const result = await ocrService.processPaperBatch(filePaths, paperInfo)

    if (!result.success) {
      // 删除上传的文件
      for (const filePath of filePaths) {
        try {
          await fs.unlink(filePath)
        } catch (unlinkError) {
          console.error('删除文件失败:', unlinkError)
        }
      }

      return res.status(500).json({
        success: false,
        error: result.error
      })
    }

    res.json({
      success: true,
      data: {
        extractedText: result.extractedText,
        questions: result.questions,
        totalQuestions: result.totalQuestions,
        totalScore: result.totalScore,
        processedPages: result.processedPages,
        totalPages: result.totalPages,
        results: result.results,
        filePaths: filePaths,
        paperInfo
      }
    })
  } catch (error) {
    console.error('批量OCR处理失败:', error)
    
    // 删除上传的文件
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath)
      } catch (unlinkError) {
        console.error('删除文件失败:', unlinkError)
      }
    }

    res.status(500).json({
      success: false,
      error: '批量OCR处理失败'
    })
  }
}))

// @desc    创建试卷并保存题目
// @route   POST /api/ocr/create-paper
// @access  Private
router.post('/create-paper', [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('试卷标题必须在1-100个字符之间'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('科目名称必须在1-20个字符之间'),
  body('grade')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('年级必须在1-10个字符之间'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('至少需要一道题目'),
  body('extractedText')
    .optional()
    .isString()
    .withMessage('提取文本必须是字符串'),
  body('filePath')
    .optional()
    .isString()
    .withMessage('文件路径必须是字符串')
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
    title,
    subject,
    grade,
    examType = '练习',
    difficulty = 'medium',
    timeLimit,
    questions,
    extractedText,
    filePath,
    isPublic = false
  } = req.body

  try {
    // 计算总分
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0)

    // 创建试卷
    const paper = await Paper.create({
      title,
      subject,
      grade,
      examType,
      difficulty,
      timeLimit,
      totalScore,
      uploadedBy: req.user.id,
      originalFile: filePath,
      extractedText,
      isPublic,
      status: 'active'
    })

    // 创建题目
    const createdQuestions = []
    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i]
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
      createdQuestions.push(question)
    }

    // 更新试卷的题目列表
    paper.questions = createdQuestions.map(q => q._id)
    await paper.save()

    res.status(201).json({
      success: true,
      data: {
        paper: {
          id: paper._id,
          title: paper.title,
          subject: paper.subject,
          grade: paper.grade,
          examType: paper.examType,
          totalScore: paper.totalScore,
          totalQuestions: createdQuestions.length
        },
        questions: createdQuestions.map(q => ({
          id: q._id,
          questionNumber: q.questionNumber,
          type: q.type,
          content: q.content,
          score: q.score
        }))
      }
    })
  } catch (error) {
    console.error('创建试卷失败:', error)
    res.status(500).json({
      success: false,
      error: '创建试卷失败'
    })
  }
}))

// @desc    优化题目信息
// @route   POST /api/ocr/optimize-questions
// @access  Private
router.post('/optimize-questions', [
  body('questions')
    .isArray({ min: 1 })
    .withMessage('至少需要一道题目'),
  body('paperInfo')
    .isObject()
    .withMessage('试卷信息必须是对象格式')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { questions, paperInfo } = req.body

  try {
    const optimizedQuestions = await ocrService.optimizeQuestions(questions, paperInfo)

    res.json({
      success: true,
      data: {
        questions: optimizedQuestions,
        totalQuestions: optimizedQuestions.length,
        totalScore: optimizedQuestions.reduce((sum, q) => sum + (q.score || 0), 0)
      }
    })
  } catch (error) {
    console.error('题目优化失败:', error)
    res.status(500).json({
      success: false,
      error: '题目优化失败'
    })
  }
}))

// @desc    获取OCR处理状态
// @route   GET /api/ocr/status
// @access  Private
router.get('/status', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'OCR Service',
      status: 'active',
      supportedFormats: (process.env.OCR_SUPPORTED_FORMATS || 'jpg,jpeg,png,pdf,webp').split(','),
      maxFileSize: parseInt(process.env.OCR_MAX_FILE_SIZE) || 20 * 1024 * 1024,
      maxImageSize: parseInt(process.env.OCR_MAX_IMAGE_SIZE) || 2048
    }
  })
}))

export default router