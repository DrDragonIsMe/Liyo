import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import StudyRecord from '../models/StudyRecord.js'
import Paper from '../models/Paper.js'
import Question from '../models/Question.js'
import User from '../models/User.js'

const router = express.Router()

// @desc    获取学习记录列表
// @route   GET /api/study/records
// @access  Private
router.get('/records', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间'),
  query('type')
    .optional()
    .isIn(['practice', 'exam', 'review'])
    .withMessage('请选择有效的学习类型'),
  query('status')
    .optional()
    .isIn(['in_progress', 'completed', 'paused', 'abandoned'])
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
  const { type, status, subject, grade } = req.query

  // 构建查询条件
  const query = { user: req.user.id }
  
  if (type) query.type = type
  if (status) query.status = status

  const skip = (page - 1) * limit

  let studyRecords = StudyRecord.find(query)
    .populate('paper', 'title subject grade examType difficulty totalScore')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  // 如果有科目或年级筛选，需要通过试卷进行过滤
  if (subject || grade) {
    const paperQuery = {}
    if (subject) paperQuery.subject = subject
    if (grade) paperQuery.grade = grade
    
    const papers = await Paper.find(paperQuery).select('_id')
    const paperIds = papers.map(p => p._id)
    query.paper = { $in: paperIds }
  }

  const [records, total] = await Promise.all([
    studyRecords,
    StudyRecord.countDocuments(query)
  ])

  res.json({
    success: true,
    data: {
      records: records.map(record => ({
        ...record.getReport(),
        paper: record.paper
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

// @desc    获取单个学习记录详情
// @route   GET /api/study/records/:id
// @access  Private
router.get('/records/:id', asyncHandler(async (req, res) => {
  const record = await StudyRecord.findById(req.params.id)
    .populate('paper', 'title subject grade examType difficulty totalScore timeLimit')
    .populate('answers.question', 'questionNumber type content score knowledgePoints')
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '学习记录不存在'
    })
  }

  // 检查权限
  if (record.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权访问该学习记录'
    })
  }

  res.json({
    success: true,
    data: {
      record: {
        ...record.getReport(),
        paper: record.paper,
        answers: record.answers,
        weakPoints: record.weakPoints,
        strongPoints: record.strongPoints,
        aiInteractions: record.aiInteractions,
        notes: record.notes,
        bookmarks: record.bookmarks,
        feedback: record.feedback
      }
    }
  })
}))

// @desc    开始学习记录
// @route   POST /api/study/start
// @access  Private
router.post('/start', [
  body('paperId')
    .isMongoId()
    .withMessage('试卷ID格式不正确'),
  body('type')
    .optional()
    .isIn(['practice', 'exam', 'review'])
    .withMessage('请选择有效的学习类型')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { paperId, type = 'practice' } = req.body

  // 检查试卷是否存在
  const paper = await Paper.findById(paperId).populate('questions')
  if (!paper) {
    return res.status(404).json({
      success: false,
      error: '试卷不存在'
    })
  }

  // 检查访问权限
  if (!paper.isPublic && paper.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '无权访问该试卷'
    })
  }

  // 检查是否有未完成的学习记录
  const existingRecord = await StudyRecord.findOne({
    user: req.user.id,
    paper: paperId,
    status: 'in_progress'
  })

  if (existingRecord) {
    return res.json({
      success: true,
      data: {
        record: existingRecord.getReport(),
        message: '继续之前的学习记录'
      }
    })
  }

  // 创建新的学习记录
  const studyRecord = await StudyRecord.create({
    user: req.user.id,
    paper: paperId,
    type,
    statistics: {
      totalQuestions: paper.questions.length
    },
    score: {
      total: paper.totalScore
    }
  })

  res.status(201).json({
    success: true,
    data: {
      record: studyRecord.getReport()
    }
  })
}))

// @desc    暂停学习记录
// @route   PUT /api/study/records/:id/pause
// @access  Private
router.put('/records/:id/pause', asyncHandler(async (req, res) => {
  const record = await StudyRecord.findById(req.params.id)
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '学习记录不存在'
    })
  }

  // 检查权限
  if (record.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '无权操作该学习记录'
    })
  }

  if (record.status !== 'in_progress') {
    return res.status(400).json({
      success: false,
      error: '只能暂停进行中的学习记录'
    })
  }

  record.status = 'paused'
  await record.save()

  res.json({
    success: true,
    data: {
      record: record.getReport()
    }
  })
}))

// @desc    恢复学习记录
// @route   PUT /api/study/records/:id/resume
// @access  Private
router.put('/records/:id/resume', asyncHandler(async (req, res) => {
  const record = await StudyRecord.findById(req.params.id)
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '学习记录不存在'
    })
  }

  // 检查权限
  if (record.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '无权操作该学习记录'
    })
  }

  if (record.status !== 'paused') {
    return res.status(400).json({
      success: false,
      error: '只能恢复已暂停的学习记录'
    })
  }

  record.status = 'in_progress'
  await record.save()

  res.json({
    success: true,
    data: {
      record: record.getReport()
    }
  })
}))

// @desc    完成学习记录
// @route   PUT /api/study/records/:id/complete
// @access  Private
router.put('/records/:id/complete', [
  body('feedback')
    .optional()
    .isObject()
    .withMessage('反馈信息格式不正确')
], asyncHandler(async (req, res) => {
  const record = await StudyRecord.findById(req.params.id)
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '学习记录不存在'
    })
  }

  // 检查权限
  if (record.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '无权操作该学习记录'
    })
  }

  if (record.status === 'completed') {
    return res.status(400).json({
      success: false,
      error: '学习记录已完成'
    })
  }

  const { feedback } = req.body

  // 完成学习记录
  await record.complete()
  
  // 分析薄弱知识点
  await record.analyzeWeakPoints()

  // 添加反馈
  if (feedback) {
    record.feedback = feedback
    await record.save()
  }

  res.json({
    success: true,
    data: {
      record: record.getReport()
    }
  })
}))

// @desc    添加学习笔记
// @route   POST /api/study/records/:id/notes
// @access  Private
router.post('/records/:id/notes', [
  body('questionId')
    .optional()
    .isMongoId()
    .withMessage('题目ID格式不正确'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('笔记内容长度必须在1-1000个字符之间')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const record = await StudyRecord.findById(req.params.id)
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '学习记录不存在'
    })
  }

  // 检查权限
  if (record.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '无权操作该学习记录'
    })
  }

  const { questionId, content } = req.body

  record.notes.push({
    question: questionId,
    content
  })

  await record.save()

  res.status(201).json({
    success: true,
    message: '笔记添加成功'
  })
}))

// @desc    添加书签
// @route   POST /api/study/records/:id/bookmarks
// @access  Private
router.post('/records/:id/bookmarks', [
  body('questionId')
    .isMongoId()
    .withMessage('题目ID格式不正确')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const record = await StudyRecord.findById(req.params.id)
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '学习记录不存在'
    })
  }

  // 检查权限
  if (record.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '无权操作该学习记录'
    })
  }

  const { questionId } = req.body

  // 检查是否已收藏
  if (record.bookmarks.includes(questionId)) {
    return res.status(400).json({
      success: false,
      error: '该题目已收藏'
    })
  }

  record.bookmarks.push(questionId)
  await record.save()

  res.status(201).json({
    success: true,
    message: '题目收藏成功'
  })
}))

// @desc    移除书签
// @route   DELETE /api/study/records/:id/bookmarks/:questionId
// @access  Private
router.delete('/records/:id/bookmarks/:questionId', asyncHandler(async (req, res) => {
  const record = await StudyRecord.findById(req.params.id)
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '学习记录不存在'
    })
  }

  // 检查权限
  if (record.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: '无权操作该学习记录'
    })
  }

  const { questionId } = req.params

  record.bookmarks = record.bookmarks.filter(id => id.toString() !== questionId)
  await record.save()

  res.json({
    success: true,
    message: '书签移除成功'
  })
}))

// @desc    获取学习统计
// @route   GET /api/study/stats
// @access  Private
router.get('/stats', [
  query('period')
    .optional()
    .isIn(['week', 'month', 'year', 'all'])
    .withMessage('请选择有效的统计周期')
], asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query
  
  // 计算时间范围
  let startDate
  const endDate = new Date()
  
  switch (period) {
    case 'week':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(0) // 所有时间
  }

  const matchQuery = {
    user: req.user.id,
    createdAt: { $gte: startDate, $lte: endDate }
  }

  // 获取学习统计
  const [overallStats, subjectStats, dailyStats] = await Promise.all([
    // 总体统计
    StudyRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalTime: { $sum: '$totalTime' },
          averageScore: { $avg: '$score.percentage' },
          completedRecords: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalQuestions: { $sum: '$statistics.answeredQuestions' },
          correctAnswers: { $sum: '$statistics.correctAnswers' }
        }
      }
    ]),
    
    // 按科目统计
    StudyRecord.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'papers',
          localField: 'paper',
          foreignField: '_id',
          as: 'paperInfo'
        }
      },
      { $unwind: '$paperInfo' },
      {
        $group: {
          _id: '$paperInfo.subject',
          count: { $sum: 1 },
          totalTime: { $sum: '$totalTime' },
          averageScore: { $avg: '$score.percentage' },
          totalQuestions: { $sum: '$statistics.answeredQuestions' },
          correctAnswers: { $sum: '$statistics.correctAnswers' }
        }
      }
    ]),
    
    // 按日期统计
    StudyRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          totalTime: { $sum: '$totalTime' },
          averageScore: { $avg: '$score.percentage' }
        }
      },
      { $sort: { '_id': 1 } }
    ])
  ])

  const overall = overallStats[0] || {
    totalRecords: 0,
    totalTime: 0,
    averageScore: 0,
    completedRecords: 0,
    totalQuestions: 0,
    correctAnswers: 0
  }

  res.json({
    success: true,
    data: {
      period,
      overall: {
        ...overall,
        accuracy: overall.totalQuestions > 0 
          ? Math.round((overall.correctAnswers / overall.totalQuestions) * 100)
          : 0,
        completionRate: overall.totalRecords > 0
          ? Math.round((overall.completedRecords / overall.totalRecords) * 100)
          : 0,
        averageStudyTime: Math.round(overall.totalTime / 60) // 转换为分钟
      },
      bySubject: subjectStats.map(stat => ({
        subject: stat._id,
        count: stat.count,
        totalTime: Math.round(stat.totalTime / 60),
        averageScore: Math.round(stat.averageScore || 0),
        accuracy: stat.totalQuestions > 0
          ? Math.round((stat.correctAnswers / stat.totalQuestions) * 100)
          : 0
      })),
      daily: dailyStats.map(stat => ({
        date: stat._id,
        count: stat.count,
        totalTime: Math.round(stat.totalTime / 60),
        averageScore: Math.round(stat.averageScore || 0)
      }))
    }
  })
}))

export default router