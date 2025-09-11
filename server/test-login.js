import fetch from 'node-fetch'

const testLogin = async () => {
  const loginData = {
    email: 'test@example.com',
    password: '123456'
  }
  
  console.log('🧪 测试登录功能...')
  console.log('邮箱:', loginData.email)
  console.log('密码:', loginData.password)
  console.log('')
  
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    })
    
    console.log('响应状态:', response.status, response.statusText)
    
    const data = await response.json()
    console.log('响应数据:', JSON.stringify(data, null, 2))
    
    if (response.ok && data.success) {
      console.log('\n✅ 登录测试成功！')
      console.log('用户ID:', data.data.user.id)
      console.log('用户名:', data.data.user.name)
      console.log('Token长度:', data.data.token.length)
    } else {
      console.log('\n❌ 登录测试失败！')
      console.log('错误信息:', data.error || '未知错误')
    }
  } catch (error) {
    console.error('\n❌ 请求异常:', error.message)
    console.log('\n请确保后端服务器正在运行 (npm start)')
  }
}

// 测试错误的密码
const testWrongPassword = async () => {
  console.log('\n\n🧪 测试错误密码...')
  
  const wrongLoginData = {
    email: 'test@example.com',
    password: 'wrongpassword'
  }
  
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wrongLoginData)
    })
    
    const data = await response.json()
    console.log('错误密码响应:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      console.log('✅ 错误密码正确被拒绝')
    }
  } catch (error) {
    console.error('请求异常:', error.message)
  }
}

// 测试不存在的邮箱
const testWrongEmail = async () => {
  console.log('\n\n🧪 测试不存在的邮箱...')
  
  const wrongEmailData = {
    email: 'nonexistent@example.com',
    password: '123456'
  }
  
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wrongEmailData)
    })
    
    const data = await response.json()
    console.log('不存在邮箱响应:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      console.log('✅ 不存在的邮箱正确被拒绝')
    }
  } catch (error) {
    console.error('请求异常:', error.message)
  }
}

// 运行所有测试
const runAllTests = async () => {
  await testLogin()
  await testWrongPassword()
  await testWrongEmail()
}

runAllTests()