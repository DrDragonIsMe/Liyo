import fetch from 'node-fetch'

async function testAPIResponse() {
  try {
    console.log('测试API响应中的图片字段...')
    
    // 测试获取数学题目
    const response = await fetch('http://localhost:5001/api/questions?subject=数学&limit=5&random=true')
    const data = await response.json()
    
    if (data.success && data.data.questions.length > 0) {
      console.log(`\n找到 ${data.data.questions.length} 道数学题目:`)
      
      data.data.questions.forEach((question, index) => {
        console.log(`\n=== 题目 ${index + 1} ===`)
        console.log('ID:', question.id)
        console.log('内容:', question.content)
        console.log('包含几何图形:', question.hasGeometryFigure)
        console.log('SVG数据存在:', !!question.svgData)
        console.log('SVG数据长度:', question.svgData ? question.svgData.length : 0)
        console.log('图形属性存在:', !!question.figureProperties)
        console.log('图片数据存在:', !!question.imageData)
        console.log('MIME类型:', question.mimeType || '无')
        console.log('OCR文本存在:', !!question.ocrText)
        
        if (question.svgData) {
          console.log('SVG数据预览:', question.svgData.substring(0, 100) + '...')
        }
      })
      
      // 检查是否有几何题
      const geometryQuestions = data.data.questions.filter(q => q.hasGeometryFigure)
      console.log(`\n几何题数量: ${geometryQuestions.length}`)
      
      if (geometryQuestions.length > 0) {
        console.log('✅ API正确返回了几何题的图片相关字段')
      } else {
        console.log('⚠️  没有找到几何题')
      }
      
    } else {
      console.log('❌ API响应失败或没有题目数据')
      console.log('响应:', data)
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testAPIResponse()