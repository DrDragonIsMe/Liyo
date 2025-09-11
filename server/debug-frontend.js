import fetch from 'node-fetch'

// 模拟前端的API调用
const simulateFrontendRequest = async () => {
  // 模拟localStorage中的auth-storage数据
  const authStorage = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzAyNDM3ODE0NDliODRjMjM1OGI0MiIsImlhdCI6MTc1NzQyMzA2MiwiZXhwIjoxNzU4MDI3ODYyfQ.0Ss9WyhBPjO-PMZxCD0QI1nXk99-XZ57ecxN0YOOyRU',
    isAuthenticated: true
  }
  
  console.log('模拟的auth-storage:', authStorage)
  
  // 模拟前端的API客户端请求
  const API_BASE_URL = 'http://localhost:5001/api'
  const endpoint = '/questions?subject=数学&limit=1'
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  }
  
  // 添加Authorization头部
  if (authStorage.token && authStorage.isAuthenticated) {
    config.headers.Authorization = `Bearer ${authStorage.token}`
  }
  
  console.log('请求URL:', url)
  console.log('请求配置:', JSON.stringify(config, null, 2))
  
  try {
    const response = await fetch(url, config)
    console.log('响应状态:', response.status, response.statusText)
    
    const data = await response.json()
    console.log('响应数据:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      console.log('请求失败，状态码:', response.status)
    } else {
      console.log('请求成功！')
    }
  } catch (error) {
    console.error('请求异常:', error.message)
  }
}

// 同时测试不同的科目参数
const testDifferentSubjects = async () => {
  const subjects = ['数学', '物理', '化学', '语文', '英语']
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzAyNDM3ODE0NDliODRjMjM1OGI0MiIsImlhdCI6MTc1NzQyMzA2MiwiZXhwIjoxNzU4MDI3ODYyfQ.0Ss9WyhBPjO-PMZxCD0QI1nXk99-XZ57ecxN0YOOyRU'
  
  for (const subject of subjects) {
    console.log(`\n=== 测试科目: ${subject} ===`)
    const url = `http://localhost:5001/api/questions?subject=${encodeURIComponent(subject)}&limit=1`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log(`状态: ${response.status}, 结果:`, data.success ? '成功' : data.error)
    } catch (error) {
      console.log(`错误: ${error.message}`)
    }
  }
}

console.log('=== 模拟前端请求 ===')
await simulateFrontendRequest()

console.log('\n=== 测试不同科目 ===')
await testDifferentSubjects()