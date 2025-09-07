import jwt from 'jsonwebtoken'
import { asyncHandler } from './errorHandler.js'
import User from '../models/User.js'

// JWT身份验证中间件
export const authMiddleware = asyncHandler(async (req, res, next) => {
  let token

  // 检查Authorization头部
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 获取token
      token = req.headers.authorization.split(' ')[1]

      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

      // 获取用户信息（排除密码）
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '用户不存在，访问被拒绝'
        })
      }

      next()
    } catch (error) {
      console.error('Token验证失败:', error)
      return res.status(401).json({
        success: false,
        error: '无效的访问令牌'
      })
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: '未提供访问令牌，访问被拒绝'
    })
  }
})

// 别名导出，保持向后兼容
export const authenticateToken = authMiddleware

// 管理员权限中间件
export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({
      success: false,
      error: '需要管理员权限'
    })
  }
}

// 可选的身份验证中间件（不强制要求登录）
export const optionalAuthMiddleware = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
      req.user = await User.findById(decoded.id).select('-password')
    } catch (error) {
      // 忽略错误，继续执行
      console.log('可选身份验证失败:', error.message)
    }
  }

  next()
})