import express from 'express'
import { body, validationResult } from 'express-validator'
import UserSupplement from '../models/UserSupplement.js'
import Question from '../models/Question.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// 创建用户补充内容
router.post('/', 
  authMiddleware,
  [
    body('questionId').isMongoId().withMessage('无效的题目ID'),
    body('type').isIn(['knowledge_point', 'answer_supplement']).withMessage('补充类型必须是knowledge_point或answer_supplement'),
    body('selectedText').trim().isLength({ min: 1, max: 1000 }).withMessage('选中文字长度必须在1-1000字符之间'),
    body('supplementContent').trim().isLength({ min: 1, max: 5000 }).withMessage('补充内容长度必须在1-5000字符之间'),
    body('knowledgePointName').optional().trim().isLength({ max: 100 }).withMessage('知识点名称不能超过100字符'),
    body('textPosition.startIndex').optional().isInt({ min: 0 }).withMessage('起始位置必须是非负整数'),
    body('textPosition.endIndex').optional().isInt({ min: 0 }).withMessage('结束位置必须是非负整数'),
    body('textPosition.context').optional().trim().isLength({ max: 500 }).withMessage('上下文不能超过500字符')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        })
      }

      const {
        questionId,
        type,
        selectedText,
        supplementContent,
        knowledgePointName,
        textPosition,
        tags,
        notes
      } = req.body

      // 验证题目是否存在
      const question = await Question.findById(questionId)
      if (!question) {
        return res.status(404).json({
          success: false,
          message: '题目不存在'
        })
      }

      // 创建补充内容
      const supplement = new UserSupplement({
        questionId,
        userId: req.user?.id || null,
        type,
        selectedText,
        supplementContent,
        knowledgePointName: type === 'knowledge_point' ? knowledgePointName : undefined,
        textPosition,
        tags: tags || [],
        notes
      })

      await supplement.save()

      // 填充用户信息
      await supplement.populate('userId', 'name email')

      res.status(201).json({
        success: true,
        message: '补充内容创建成功',
        data: supplement
      })
    } catch (error) {
      console.error('创建补充内容失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      })
    }
  }
)

// 获取题目的补充内容
router.get('/question/:questionId',
  async (req, res) => {
    try {
      const { questionId } = req.params
      const { type, verified, limit = 50 } = req.query

      // 验证题目是否存在
      const question = await Question.findById(questionId)
      if (!question) {
        return res.status(404).json({
          success: false,
          message: '题目不存在'
        })
      }

      const options = {
        type,
        verified: verified !== undefined ? verified === 'true' : undefined,
        limit: Math.min(parseInt(limit), 100)
      }

      const supplements = await UserSupplement.getByQuestion(questionId, options)

      res.json({
        success: true,
        data: {
          questionId,
          supplements,
          total: supplements.length
        }
      })
    } catch (error) {
      console.error('获取补充内容失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      })
    }
  }
)

// 获取知识点相关补充
router.get('/knowledge-point/:knowledgePointName',
  async (req, res) => {
    try {
      const { knowledgePointName } = req.params
      const { verified, limit = 20 } = req.query

      const decodedKnowledgePoint = decodeURIComponent(knowledgePointName)

      const options = {
        verified: verified !== undefined ? verified === 'true' : undefined,
        limit: Math.min(parseInt(limit), 50)
      }

      const supplements = await UserSupplement.getByKnowledgePoint(decodedKnowledgePoint, options)

      res.json({
        success: true,
        data: {
          knowledgePoint: decodedKnowledgePoint,
          supplements,
          total: supplements.length
        }
      })
    } catch (error) {
      console.error('获取知识点补充失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      })
    }
  }
)

// 用户评价补充内容
router.post('/:supplementId/rate',
  authMiddleware,
  [
    body('rating').isIn(['like', 'dislike']).withMessage('评价必须是like或dislike')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        })
      }

      const { supplementId } = req.params
      const { rating } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '需要登录才能评价'
        })
      }

      const supplement = await UserSupplement.findById(supplementId)
      if (!supplement) {
        return res.status(404).json({
          success: false,
          message: '补充内容不存在'
        })
      }

      await supplement.rateByUser(userId, rating)

      res.json({
        success: true,
        message: '评价成功',
        data: {
          likes: supplement.likes,
          dislikes: supplement.dislikes,
          score: supplement.score
        }
      })
    } catch (error) {
      console.error('评价补充内容失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      })
    }
  }
)

// 更新补充内容
router.put('/:supplementId',
  authMiddleware,
  [
    body('supplementContent').optional().trim().isLength({ min: 1, max: 5000 }).withMessage('补充内容长度必须在1-5000字符之间'),
    body('knowledgePointName').optional().trim().isLength({ max: 100 }).withMessage('知识点名称不能超过100字符'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('备注不能超过1000字符')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        })
      }

      const { supplementId } = req.params
      const userId = req.user?.id

      const supplement = await UserSupplement.findById(supplementId)
      if (!supplement) {
        return res.status(404).json({
          success: false,
          message: '补充内容不存在'
        })
      }

      // 只有创建者可以编辑
      if (supplement.userId && !supplement.userId.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: '只能编辑自己创建的补充内容'
        })
      }

      const { supplementContent, knowledgePointName, tags, notes } = req.body

      if (supplementContent !== undefined) {
        supplement.supplementContent = supplementContent
      }
      if (knowledgePointName !== undefined && supplement.type === 'knowledge_point') {
        supplement.knowledgePointName = knowledgePointName
      }
      if (tags !== undefined) {
        supplement.tags = tags
      }
      if (notes !== undefined) {
        supplement.notes = notes
      }

      await supplement.save()
      await supplement.populate('userId', 'name email')

      res.json({
        success: true,
        message: '补充内容更新成功',
        data: supplement
      })
    } catch (error) {
      console.error('更新补充内容失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      })
    }
  }
)

// 删除补充内容
router.delete('/:supplementId',
  authMiddleware,
  async (req, res) => {
    try {
      const { supplementId } = req.params
      const userId = req.user?.id

      const supplement = await UserSupplement.findById(supplementId)
      if (!supplement) {
        return res.status(404).json({
          success: false,
          message: '补充内容不存在'
        })
      }

      // 只有创建者可以删除
      if (supplement.userId && !supplement.userId.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: '只能删除自己创建的补充内容'
        })
      }

      // 软删除
      supplement.isActive = false
      await supplement.save()

      res.json({
        success: true,
        message: '补充内容删除成功'
      })
    } catch (error) {
      console.error('删除补充内容失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      })
    }
  }
)

// 获取用户的补充内容
router.get('/user/my',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '需要登录'
        })
      }

      const { type, page = 1, limit = 20 } = req.query
      const skip = (parseInt(page) - 1) * parseInt(limit)

      const query = {
        userId,
        isActive: true
      }

      if (type) {
        query.type = type
      }

      const supplements = await UserSupplement.find(query)
        .populate('questionId', 'content subject type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))

      const total = await UserSupplement.countDocuments(query)

      res.json({
        success: true,
        data: {
          supplements,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      })
    } catch (error) {
      console.error('获取用户补充内容失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      })
    }
  }
)

export default router