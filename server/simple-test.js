import fetch from 'node-fetch'
import fs from 'fs/promises'

// 服务器配置
const SERVER_URL = 'http://localhost:5001'

/**
 * 测试健康检查
 */
async function testHealth() {
  try {
    const response = await fetch(`${SERVER_URL}/health`)
    const data = await response.json()
    console.log('✅ 服务器健康检查:', data)
    return true
  } catch (error) {
    console.error('❌ 服务器连接失败:', error.message)
    return false
  }
}

/**
 * 测试用户注册（如果需要）
 */
async function testRegister() {
  try {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }

    const response = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ 用户注册成功')
      return data.token
    } else if (data.error && data.error.includes('已被注册')) {
      console.log('ℹ️ 用户已存在，尝试登录')
      return await testLogin()
    } else {
      throw new Error(data.error || '注册失败')
    }
  } catch (error) {
    console.error('❌ 注册失败:', error.message)
    return await testLogin()
  }
}

/**
 * 测试用户登录
 */
async function testLogin() {
  try {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    }

    const response = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ 登录成功')
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
 * 创建测试图片
 */
async function createTestImage() {
  try {
    // 创建一个简单的SVG测试图片
    const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="50%" y="30%" text-anchor="middle" font-size="24" font-family="Arial">数学测试题</text>
  <text x="50%" y="50%" text-anchor="middle" font-size="18" font-family="Arial">1. 求解方程 x² + 2x - 3 = 0</text>
  <text x="50%" y="70%" text-anchor="middle" font-size="18" font-family="Arial">2. 计算 ∫(x² + 1)dx</text>
</svg>`
    
    await fs.writeFile('./test-image.svg', svgContent)
    console.log('✅ 测试图片创建成功: test-image.svg')
    return './test-image.svg'
  } catch (error) {
    console.error('❌ 创建测试图片失败:', error.message)
    throw error
  }
}

/**
 * 测试图片上传和处理
 */
async function testImageUpload(token, imagePath) {
  try {
    const FormData = (await import('form-data')).default
    const form = new FormData()
    
    // 添加文件
    const imageBuffer = await fs.readFile(imagePath)
    form.append('file', imageBuffer, {
      filename: 'test-image.svg',
      contentType: 'image/svg+xml'
    })
    
    // 添加试卷信息
    form.append('subject', '数学')
    form.append('grade', '高二')
    form.append('examType', '练习')

    const response = await fetch(`${SERVER_URL}/api/ocr/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ 图片处理成功')
      console.log('📊 处理结果:', {
        imageSize: `${Math.round(data.data.imageData.length / 1024)}KB`,
        imageInfo: data.data.imageInfo,
        message: data.data.message
      })
      return data.data
    } else {
      throw new Error(data.error || '图片处理失败')
    }
  } catch (error) {
    console.error('❌ 图片处理失败:', error.message)
    throw error
  }
}

/**
 * 测试试卷创建
 */
async function testPaperCreation(token, processResult) {
  try {
    const paperData = {
      title: '测试试卷（图片模式）',
      subject: processResult.paperInfo.subject,
      grade: processResult.paperInfo.grade,
      examType: processResult.paperInfo.examType,
      imageData: processResult.imageData,
      imageInfo: processResult.imageInfo,
      filePath: processResult.filePath
    }

    const response = await fetch(`${SERVER_URL}/api/ocr/create-paper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paperData)
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ 试卷创建成功')
      console.log('📄 试卷ID:', data.data.paper.id)
      return data.data.paper
    } else {
      throw new Error(data.error || '试卷创建失败')
    }
  } catch (error) {
    console.error('❌ 试卷创建失败:', error.message)
    throw error
  }
}

/**
 * 主测试函数
 */
async function runSimpleTest() {
  console.log('🚀 开始简单功能测试...')
  console.log('=' .repeat(50))

  try {
    // 1. 健康检查
    console.log('\n1️⃣ 服务器健康检查...')
    const isHealthy = await testHealth()
    if (!isHealthy) {
      throw new Error('服务器不可用')
    }

    // 2. 用户认证
    console.log('\n2️⃣ 用户认证...')
    const token = await testRegister()

    // 3. 创建测试图片
    console.log('\n3️⃣ 创建测试图片...')
    const imagePath = await createTestImage()

    // 4. 测试图片上传
    console.log('\n4️⃣ 测试图片上传和处理...')
    const processResult = await testImageUpload(token, imagePath)

    // 5. 测试试卷创建
    console.log('\n5️⃣ 测试试卷创建...')
    const paper = await testPaperCreation(token, processResult)

    console.log('\n' + '='.repeat(50))
    console.log('🎉 基础功能测试完成！')
    console.log('📋 测试结果:')
    console.log('  - 服务器运行正常')
    console.log('  - 用户认证成功')
    console.log('  - 图片上传和处理成功')
    console.log('  - 试卷创建成功')
    console.log(`  - 试卷ID: ${paper.id}`)
    
  } catch (error) {
    console.log('\n' + '='.repeat(50))
    console.error('💥 测试失败:', error.message)
    process.exit(1)
  }
}

// 运行测试
runSimpleTest()