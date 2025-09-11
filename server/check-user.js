import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './src/models/User.js'

// 加载环境变量
dotenv.config()

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studdy')
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('数据库连接失败:', error.message)
    process.exit(1)
  }
}

const checkUser = async () => {
  await connectDB()
  
  const userId = '68c0243781449b84c2358b42'
  console.log('Checking user with ID:', userId)
  
  try {
    const user = await User.findById(userId)
    if (user) {
      console.log('User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      })
    } else {
      console.log('User not found in database')
      
      // 查看所有用户
      const allUsers = await User.find({}, 'name email _id')
      console.log('All users in database:', allUsers)
    }
  } catch (error) {
    console.error('Error checking user:', error)
  } finally {
    mongoose.connection.close()
  }
}

checkUser().catch(console.error)