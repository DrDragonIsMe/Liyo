import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import { adminMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'
import StudyRecord from '../models/StudyRecord.js'
import Paper from '../models/Paper.js'

const router = express.Router()

// @desc    获取用户列表（管理员）
// @route   GET /api/users
// @access  Private/Admin
router.get('/', adminMiddleware, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('搜索关键词不能超过100个字符')
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
  const search = req.query.search
  const role = req.query.role
  const isActive = req.query.isActive

  // 构建查询条件
  const query = {}
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { school: { $regex: search, $options: 'i' } }
    ]
  }
  
  if (role) {
    query.role = role
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true'
  }

  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ])

  res.json({
    success: true,
    data: {
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        school: user.school,
        grade: user.grade,
        subjects: user.subjects,
        stats: user.getStats(),
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
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

// @desc    获取单个用户详情
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  // 处理demo用户
  if (req.params.id === 'demo-user') {
    return res.json({
      success: true,
      data: {
        user: {
          id: 'demo-user',
          name: '演示用户',
          email: 'demo@example.com',
          avatar: null,
          role: 'student',
          school: '演示学校',
          grade: '高二',
          subjects: ['数学', '物理', '化学'],
          preferences: {
            theme: 'light',
            notifications: true,
            autoSave: true
          },
          stats: {
            studyRecords: 15,
            totalStudyTime: 120,
            averageScore: 85,
            completionRate: 80
          },
          achievements: ['初学者', '勤奋学习者'],
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date('2024-01-01')
        }
      }
    })
  }

  const user = await User.findById(req.params.id).select('-password')
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    })
  }

  // 检查权限：只有管理员或用户本人可以查看详情
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({
      success: false,
      error: '无权访问该用户信息'
    })
  }

  // 获取用户的学习统计
  const studyStats = await StudyRecord.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalTime: { $sum: '$totalTime' },
        averageScore: { $avg: '$score.percentage' },
        completedRecords: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ])

  const stats = studyStats[0] || {
    totalRecords: 0,
    totalTime: 0,
    averageScore: 0,
    completedRecords: 0
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        school: user.school,
        grade: user.grade,
        subjects: user.subjects,
        preferences: user.preferences,
        stats: {
          ...user.getStats(),
          studyRecords: stats.totalRecords,
          totalStudyTime: Math.round(stats.totalTime / 60), // 转换为分钟
          averageScore: Math.round(stats.averageScore || 0),
          completionRate: stats.totalRecords > 0 
            ? Math.round((stats.completedRecords / stats.totalRecords) * 100)
            : 0
        },
        achievements: user.achievements,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  })
}))

// @desc    更新用户信息（管理员）
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', adminMiddleware, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('用户名长度必须在2-50个字符之间'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('role')
    .optional()
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('请选择有效的用户角色'),
  body('school')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('学校名称不能超过100个字符'),
  body('grade')
    .optional()
    .isIn(['高一', '高二', '高三', '其他'])
    .withMessage('请选择有效的年级')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const user = await User.findById(req.params.id)
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    })
  }

  const { name, email, role, school, grade, subjects, isActive } = req.body

  // 检查邮箱是否已被其他用户使用
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '该邮箱已被其他用户使用'
      })
    }
  }

  // 更新字段
  if (name) user.name = name
  if (email) user.email = email
  if (role) user.role = role
  if (school !== undefined) user.school = school
  if (grade) user.grade = grade
  if (subjects) user.subjects = subjects
  if (isActive !== undefined) user.isActive = isActive

  await user.save()

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        school: user.school,
        grade: user.grade,
        subjects: user.subjects,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    }
  })
}))

// @desc    删除用户（管理员）
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', adminMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    })
  }

  // 防止删除管理员账户
  if (user.role === 'admin') {
    return res.status(400).json({
      success: false,
      error: '不能删除管理员账户'
    })
  }

  // 软删除：设置为非活跃状态
  user.isActive = false
  await user.save()

  res.json({
    success: true,
    message: '用户已被禁用'
  })
}))

// @desc    获取用户学习记录
// @route   GET /api/users/:id/study-records
// @access  Private
router.get('/:id/study-records', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间')
], asyncHandler(async (req, res) => {
  // 检查权限
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({
      success: false,
      error: '无权访问该用户的学习记录'
    })
  }

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit

  const [records, total] = await Promise.all([
    StudyRecord.find({ user: req.params.id })
      .populate('paper', 'title subject grade examType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    StudyRecord.countDocuments({ user: req.params.id })
  ])

  res.json({
    success: true,
    data: {
      records: records.map(record => record.getReport()),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    }
  })
}))

// @desc    获取用户上传的试卷
// @route   GET /api/users/:id/papers
// @access  Private
router.get('/:id/papers', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间')
], asyncHandler(async (req, res) => {
  // 检查权限
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({
      success: false,
      error: '无权访问该用户的试卷'
    })
  }

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit

  const [papers, total] = await Promise.all([
    Paper.find({ uploadedBy: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Paper.countDocuments({ uploadedBy: req.params.id })
  ])

  res.json({
    success: true,
    data: {
      papers: papers.map(paper => paper.getSummary()),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    }
  })
}))

export default router