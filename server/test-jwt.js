import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
console.log('JWT_SECRET:', JWT_SECRET)

// 测试token生成
const testUserId = '507f1f77bcf86cd799439011'
const token = jwt.sign({ id: testUserId }, JWT_SECRET, {
  expiresIn: '30d'
})

console.log('Generated token:', token)
console.log('Token length:', token.length)

// 测试token验证
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  console.log('Token verification successful:', decoded)
} catch (error) {
  console.error('Token verification failed:', error.message)
}

// 测试一个格式错误的token
try {
  const malformedToken = 'invalid.token.here'
  const decoded = jwt.verify(malformedToken, JWT_SECRET)
  console.log('Malformed token verification:', decoded)
} catch (error) {
  console.error('Malformed token error (expected):', error.message)
}