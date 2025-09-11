import express from 'express'
import { body, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authMiddleware } from '../middleware/auth.js'
import aiImageService from '../services/aiImageService.js'
import Paper from '../models/Paper.js'

const router = express.Router()

// 所有AI图片路由都需要身份验证
router.use(authMiddleware)

// @desc    识别图片中的知识点
// @route   POST /api/ai-image/identify-knowledge-points
// @access  Private
router.post('/identify-knowledge-points', [
  body('paperId')
    .isMongoId()
    .withMessage('无效的试卷ID'),
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { paperId } = req.body

  try {
    // 获取试卷信息
    const paper = await Paper.findById(paperId)
    if (!paper) {
      return res.status(404).json({
        success: false,
        error: '试卷不存在'
      })
    }

    // 检查是否为图片模式
    if (paper.processingType !== 'image' || !paper.imageData) {
      return res.status(400).json({
        success: false,
        error: '该试卷不支持图片识别模式'
      })
    }

    // 检查权限
    if (paper.uploadedBy.toString() !== req.user.id && !paper.isPublic) {
      return res.status(403).json({
        success: false,
        error: '无权访问该试卷'
      })
    }

    // 识别知识点
    const result = await aiImageService.identifyKnowledgePoints(
      paper.imageData,
      {
        subject: paper.subject,
        grade: paper.grade,
        examType: paper.examType
      }
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('知识点识别失败:', error)
    res.status(500).json({
      success: false,
      error: '知识点识别失败'
    })
  }
}))

// @desc    基于图片进行AI对话
// @route   POST /api/ai-image/chat
// @access  Private
router.post('/chat', [
  body('paperId')
    .isMongoId()
    .withMessage('无效的试卷ID'),
  body('question')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('问题内容必须在1-1000个字符之间')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { paperId, question } = req.body

  try {
    // 获取试卷信息
    const paper = await Paper.findById(paperId)
    if (!paper) {
      return res.status(404).json({
        success: false,
        error: '试卷不存在'
      })
    }

    // 检查是否为图片模式
    if (paper.processingType !== 'image' || !paper.imageData) {
      return res.status(400).json({
        success: false,
        error: '该试卷不支持图片识别模式'
      })
    }

    // 检查权限
    if (paper.uploadedBy.toString() !== req.user.id && !paper.isPublic) {
      return res.status(403).json({
        success: false,
        error: '无权访问该试卷'
      })
    }

    // AI对话
    const result = await aiImageService.chatWithImage(
      paper.imageData,
      question,
      {
        subject: paper.subject,
        grade: paper.grade,
        examType: paper.examType
      }
    )

    res.json({
      success: true,
      data: {
        question: question,
        answer: result.response,
        usage: result.usage
      }
    })
  } catch (error) {
    console.error('AI对话失败:', error)
    res.status(500).json({
      success: false,
      error: 'AI对话失败'
    })
  }
}))

// @desc    分析题目
// @route   POST /api/ai-image/analyze-questions
// @access  Private
router.post('/analyze-questions', [
  body('paperId')
    .isMongoId()
    .withMessage('无效的试卷ID'),
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { paperId } = req.body

  try {
    // 获取试卷信息
    const paper = await Paper.findById(paperId)
    if (!paper) {
      return res.status(404).json({
        success: false,
        error: '试卷不存在'
      })
    }

    // 检查是否为图片模式
    if (paper.processingType !== 'image' || !paper.imageData) {
      return res.status(400).json({
        success: false,
        error: '该试卷不支持图片识别模式'
      })
    }

    // 检查权限
    if (paper.uploadedBy.toString() !== req.user.id && !paper.isPublic) {
      return res.status(403).json({
        success: false,
        error: '无权访问该试卷'
      })
    }

    // 分析题目
    const result = await aiImageService.analyzeQuestions(
      paper.imageData,
      {
        subject: paper.subject,
        grade: paper.grade,
        examType: paper.examType
      }
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('题目分析失败:', error)
    res.status(500).json({
      success: false,
      error: '题目分析失败'
    })
  }
}))

// @desc    获取试卷图片信息
// @route   GET /api/ai-image/paper/:id/info
// @access  Private
router.get('/paper/:id/info', asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    // 获取试卷信息
    const paper = await Paper.findById(id).select('-imageData') // 不返回图片数据
    if (!paper) {
      return res.status(404).json({
        success: false,
        error: '试卷不存在'
      })
    }

    // 检查权限
    if (paper.uploadedBy.toString() !== req.user.id && !paper.isPublic) {
      return res.status(403).json({
        success: false,
        error: '无权访问该试卷'
      })
    }

    res.json({
      success: true,
      data: {
        id: paper._id,
        title: paper.title,
        subject: paper.subject,
        grade: paper.grade,
        examType: paper.examType,
        processingType: paper.processingType,
        imageInfo: paper.imageInfo,
        createdAt: paper.createdAt,
        updatedAt: paper.updatedAt
      }
    })
  } catch (error) {
    console.error('获取试卷信息失败:', error)
    res.status(500).json({
      success: false,
      error: '获取试卷信息失败'
    })
  }
}))

export default router