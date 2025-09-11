import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from './src/models/User.js'

dotenv.config()

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB连接成功')
    
    const users = await User.find({}).select('email name isActive createdAt')
    console.log('\n数据库中的用户:')
    
    if (users.length === 0) {
      console.log('❌ 数据库中没有用户记录')
      console.log('\n建议创建测试用户:')
      console.log('邮箱: test@example.com')
      console.log('密码: 123456')
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. 邮箱: ${user.email}`)
        console.log(`   姓名: ${user.name}`)
        console.log(`   激活状态: ${user.isActive ? '✅ 已激活' : '❌ 未激活'}`)
        console.log(`   创建时间: ${user.createdAt}`)
        console.log('')
      })
    }
    
    await mongoose.disconnect()
    console.log('数据库连接已关闭')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    process.exit(1)
  }
}

checkUsers()