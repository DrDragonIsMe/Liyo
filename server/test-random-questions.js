const testRandomQuestions = async () => {
  try {
    console.log('🧪 测试随机题目获取...')
    
    // 模拟多次调用，检查是否返回不同题目
    for (let i = 1; i <= 5; i++) {
      const response = await fetch('http://localhost:5001/api/questions?subject=数学&limit=1&random=true', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzAyNDM3ODE0NDliODRjMjM1OGI0MiIsImlhdCI6MTc1NzQ3MjI5MCwiZXhwIjoxNzU4MDc3MDkwfQ.KeGkH4_QHstNyr4CjqHlTAwW8n4TKt5hRg_I2WC3V2I',
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log(`\n第${i}次调用:`, response.status)
      
      if (data.success && data.data.questions && data.data.questions.length > 0) {
        const question = data.data.questions[0]
        console.log(`题目ID: ${question.id || question._id}`)
        console.log(`题目内容: ${question.content.substring(0, 50)}...`)
      } else {
        console.log('未获取到题目:', data)
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testRandomQuestions()