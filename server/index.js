import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 路由导入
import authRoutes from './src/routes/auth.js'
import userRoutes from './src/routes/users.js'
import paperRoutes from './src/routes/papers.js'
import questionRoutes from './src/routes/questions.js'
import studyRoutes from './src/routes/study.js'
import ocrRoutes from './src/routes/ocr.js'
import aiRoutes from './src/routes/ai.js'
import learningPathRoutes from './src/routes/learningPath.js'

// 中间件导入
import { errorHandler } from './src/middleware/errorHandler.js'
import { notFound } from './src/middleware/notFound.js'
import { authMiddleware } from './src/middleware/auth.js'

// 配置环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 安全中间件
app.use(helmet())

// CORS配置
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
})
app.use('/api/', limiter)

// 解析中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/users', authMiddleware, userRoutes)
app.use('/api/papers', authMiddleware, paperRoutes)
app.use('/api/questions', authMiddleware, questionRoutes)
app.use('/api/study', authMiddleware, studyRoutes)
app.use('/api/ocr', authMiddleware, ocrRoutes)
app.use('/api/ai', authMiddleware, aiRoutes)
app.use('/api/learning-paths', authMiddleware, learningPathRoutes)

// 错误处理中间件
app.use(notFound)
app.use(errorHandler)

// 数据库连接
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/liyo')
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('数据库连接失败:', error.message)
    process.exit(1)
  }
}

// 启动服务器
const startServer = async () => {
  await connectDB()
  
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`)
    console.log(`📱 API文档: http://localhost:${PORT}/api`)
    console.log(`🏥 健康检查: http://localhost:${PORT}/health`)
  })
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...')
  mongoose.connection.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...')
  mongoose.connection.close()
  process.exit(0)
})

startServer().catch(console.error)

export default app