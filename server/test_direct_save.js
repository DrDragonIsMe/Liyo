import mongoose from 'mongoose'
import Question from './src/models/Question.js'

async function testDirectSave() {
  try {
    await mongoose.connect('mongodb://localhost:27017/studdy')
    console.log('已连接到数据库')
    
    // 直接创建包含SVG数据的题目
    const testQuestion = new Question({
      content: '直接保存测试题目',
      subject: '数学',
      type: '计算题',
      difficulty: 'medium',
      correctAnswer: '42',
      explanation: '测试解释',
      svgData: '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>',
      figureProperties: {
        shapes: ['circle'],
        radius: 40,
        center: { x: 50, y: 50 }
      },
      hasGeometryFigure: true,
      source: 'user_paste',
      isActive: true
    })
    
    console.log('保存前的数据:')
    console.log('SVG数据存在:', !!testQuestion.svgData)
    console.log('SVG数据长度:', testQuestion.svgData ? testQuestion.svgData.length : 0)
    console.log('图形属性存在:', !!testQuestion.figureProperties)
    console.log('包含几何图形:', testQuestion.hasGeometryFigure)
    
    const savedQuestion = await testQuestion.save()
    console.log('\n题目保存成功，ID:', savedQuestion._id)
    
    // 重新查询验证
    const retrievedQuestion = await Question.findById(savedQuestion._id)
    console.log('\n重新查询的数据:')
    console.log('SVG数据存在:', !!retrievedQuestion.svgData)
    console.log('SVG数据长度:', retrievedQuestion.svgData ? retrievedQuestion.svgData.length : 0)
    console.log('图形属性存在:', !!retrievedQuestion.figureProperties)
    console.log('包含几何图形:', retrievedQuestion.hasGeometryFigure)
    
    if (retrievedQuestion.svgData) {
      console.log('SVG数据:', retrievedQuestion.svgData)
    }
    
    if (retrievedQuestion.figureProperties) {
      console.log('图形属性:', JSON.stringify(retrievedQuestion.figureProperties, null, 2))
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

testDirectSave()