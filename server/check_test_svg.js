import mongoose from 'mongoose'
import Question from './src/models/Question.js'

async function checkTestSVG() {
  try {
    await mongoose.connect('mongodb://localhost:27017/studdy')
    console.log('已连接到数据库')
    
    const question = await Question.findById('68c2af0ddffc002f91be3c1e')
    
    if (question) {
      console.log('\n测试题目信息:')
      console.log('内容:', question.content)
      console.log('SVG数据存在:', !!question.svgData)
      console.log('SVG数据长度:', question.svgData ? question.svgData.length : 0)
      console.log('图形属性存在:', !!question.figureProperties)
      console.log('包含几何图形:', question.hasGeometryFigure)
      
      if (question.svgData) {
        console.log('SVG数据预览:', question.svgData.substring(0, 200) + '...')
      }
      
      if (question.figureProperties) {
        console.log('图形属性:', JSON.stringify(question.figureProperties, null, 2))
      }
    } else {
      console.log('未找到测试题目')
    }
    
  } catch (error) {
    console.error('检查失败:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

checkTestSVG()