import fetch from 'node-fetch'

// 服务器配置
const SERVER_URL = 'http://localhost:5001'

// 测试用户信息
const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
}

/**
 * 创建测试用户
 */
async function createTestUser() {
  try {
    console.log('🔧 正在创建测试用户...')
    
    const response = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ 测试用户创建成功')
      console.log('👤 用户信息:', {
        name: TEST_USER.name,
        email: TEST_USER.email,
        id: data.data.user.id
      })
      return data.data
    } else {
      if (data.error && data.error.includes('已存在')) {
        console.log('ℹ️ 测试用户已存在，可以直接使用')
        return { message: '用户已存在' }
      } else {
        throw new Error(data.error || '用户创建失败')
      }
    }
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message)
    throw error
  }
}

/**
 * 测试登录
 */
async function testLogin() {
  try {
    console.log('🔐 测试登录...')
    
    const response = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ 登录成功')
      console.log('🎫 Token:', data.token.substring(0, 20) + '...')
      return data.token
    } else {
      throw new Error(data.error || '登录失败')
    }
  } catch (error) {
    console.error('❌ 登录失败:', error.message)
    throw error
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始设置测试环境...')
  console.log('=' .repeat(40))

  try {
    // 1. 创建测试用户
    await createTestUser()
    
    // 2. 测试登录
    const token = await testLogin()
    
    console.log('\n' + '='.repeat(40))
    console.log('🎉 测试环境设置完成！')
    console.log('📝 现在可以运行 test-image-mode.js 进行功能测试')
    
  } catch (error) {
    console.log('\n' + '='.repeat(40))
    console.error('💥 设置失败:', error.message)
    process.exit(1)
  }
}

// 运行设置
main()