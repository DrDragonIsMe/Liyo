import mongoose from 'mongoose'
import Question from './src/models/Question.js'

async function checkLatestQuestions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/studdy')
    console.log('已连接到数据库')
    
    const questions = await Question.find({
      subject: '数学',
      type: '计算题'
    }).sort({ createdAt: -1 }).limit(5)
    
    console.log(`\n找到 ${questions.length} 道最新的数学计算题:`)
    
    questions.forEach((q, i) => {
      console.log(`\n=== 题目 ${i + 1} ===`)
      console.log('ID:', q._id)
      console.log('内容:', q.content.substring(0, 80) + '...')
      console.log('SVG数据存在:', !!q.svgData)
      console.log('SVG数据长度:', q.svgData ? q.svgData.length : 0)
      console.log('图形属性存在:', !!q.figureProperties)
      console.log('包含几何图形:', q.hasGeometryFigure)
      console.log('创建时间:', q.createdAt)
      
      if (q.svgData) {
        console.log('SVG数据预览:', q.svgData.substring(0, 100) + '...')
      }
      
      if (q.figureProperties) {
        console.log('图形属性:', JSON.stringify(q.figureProperties, null, 2))
      }
    })
    
  } catch (error) {
    console.error('检查失败:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

checkLatestQuestions()