import express from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import { authMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

// 生成JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  })
}

// @desc    用户注册
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('用户名长度必须在2-50个字符之间'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { name, email, password, school, grade, subjects } = req.body

  // 检查用户是否已存在
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: '该邮箱已被注册'
    })
  }

  // 创建用户
  const user = await User.create({
    name,
    email,
    password,
    school,
    grade,
    subjects: subjects || []
  })

  // 生成token
  const token = generateToken(user._id)

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        school: user.school,
        grade: user.grade,
        subjects: user.subjects,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    }
  })
}))

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('请提供密码')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { email, password } = req.body

  // 查找用户（包含密码）
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    return res.status(401).json({
      success: false,
      error: '邮箱或密码错误'
    })
  }

  // 检查密码
  const isPasswordMatch = await user.matchPassword(password)
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      error: '邮箱或密码错误'
    })
  }

  // 检查用户是否激活
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: '账户已被禁用，请联系管理员'
    })
  }

  // 更新最后登录时间
  user.lastLogin = new Date()
  await user.save()

  // 生成token
  const token = generateToken(user._id)

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        school: user.school,
        grade: user.grade,
        subjects: user.subjects,
        role: user.role,
        stats: user.getStats(),
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      token
    }
  })
}))

// @desc    获取当前用户信息
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  // 处理demo用户
  if (req.user.id === 'demo-user') {
    return res.json({
      success: true,
      data: {
        user: {
          id: 'demo-user',
          name: 'Demo User',
          email: 'demo@example.com',
          avatar: null,
          school: '示例学校',
          grade: '高二',
          subjects: ['数学', '物理', '化学'],
          role: 'student',
          preferences: {
            studyReminder: true,
            emailNotification: false,
            theme: 'light'
          },
          stats: {
            totalStudyTime: 120,
            questionsAnswered: 50,
            correctAnswers: 42,
            papersUploaded: 3,
            streak: 5
          }
        }
      }
    })
  }

  const user = await User.findById(req.user.id)

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        school: user.school,
        grade: user.grade,
        subjects: user.subjects,
        role: user.role,
        preferences: user.preferences,
        stats: user.getStats(),
        achievements: user.achievements,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    }
  })
}))

// @desc    更新用户资料
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authMiddleware, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('用户名长度必须在2-50个字符之间'),
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

  const { name, school, grade, subjects, preferences } = req.body

  const user = await User.findById(req.user.id)

  // 更新字段
  if (name) user.name = name
  if (school !== undefined) user.school = school
  if (grade) user.grade = grade
  if (subjects) user.subjects = subjects
  if (preferences) {
    user.preferences = { ...user.preferences, ...preferences }
  }

  await user.save()

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        school: user.school,
        grade: user.grade,
        subjects: user.subjects,
        role: user.role,
        preferences: user.preferences,
        stats: user.getStats(),
        achievements: user.achievements
      }
    }
  })
}))

// @desc    修改密码
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', authMiddleware, [
  body('currentPassword')
    .notEmpty()
    .withMessage('请提供当前密码'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码至少需要6个字符')
], asyncHandler(async (req, res) => {
  // 检查验证错误
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    })
  }

  const { currentPassword, newPassword } = req.body

  // 获取用户（包含密码）
  const user = await User.findById(req.user.id).select('+password')

  // 验证当前密码
  const isCurrentPasswordMatch = await user.matchPassword(currentPassword)
  if (!isCurrentPasswordMatch) {
    return res.status(400).json({
      success: false,
      error: '当前密码错误'
    })
  }

  // 更新密码
  user.password = newPassword
  await user.save()

  res.json({
    success: true,
    message: '密码修改成功'
  })
}))

// @desc    登出
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  // 在实际应用中，可以将token加入黑名单
  // 这里只是返回成功响应
  res.json({
    success: true,
    message: '登出成功'
  })
}))

// @desc    刷新Token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', authMiddleware, asyncHandler(async (req, res) => {
  // 生成新的token
  const token = generateToken(req.user.id)

  res.json({
    success: true,
    data: {
      token
    }
  })
}))

export default router