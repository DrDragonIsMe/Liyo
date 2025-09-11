import fs from 'fs/promises'
import path from 'path'
import fetch from 'node-fetch'

// 服务器配置
const SERVER_URL = 'http://localhost:5001'
const TEST_IMAGE_PATH = './test-simple.png'

// 测试用户凭据
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
}

/**
 * 登录获取token
 */
async function login() {
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
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
 * 上传图片并处理（新的图片模式）
 */
async function uploadAndProcessImage(token) {
  try {
    // 检查测试图片是否存在
    await fs.access(TEST_IMAGE_PATH)
    
    const FormData = (await import('form-data')).default
    const form = new FormData()
    
    // 添加文件
    const imageBuffer = await fs.readFile(TEST_IMAGE_PATH)
    form.append('file', imageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
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
 * 创建试卷（图片模式）
 */
async function createImagePaper(token, processResult) {
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
      console.log('📄 试卷信息:', data.data.paper)
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
 * 测试知识点识别
 */
async function testKnowledgePointIdentification(token, paperId) {
  try {
    const response = await fetch(`${SERVER_URL}/api/ai-image/identify-knowledge-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paperId })
    })

    const data = await response.json()
    if (data.success) {
      console.log('✅ 知识点识别成功')
      console.log('🧠 识别结果:', data.data)
      return data.data
    } else {
      throw new Error(data.error || '知识点识别失败')
    }
  } catch (error) {
    console.error('❌ 知识点识别失败:', error.message)
    throw error
  }
}

/**
 * 测试AI对话
 */
async function testAIChat(token, paperId) {
  try {
    const testQuestion = '请解释一下这道题的解题思路'
    
    const response = await fetch(`${SERVER_URL}/api/ai-image/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        paperId,
        question: testQuestion
      })
    })

    const data = await response.json()
    if (data.success) {
      console.log('✅ AI对话成功')
      console.log('💬 问题:', data.data.question)
      console.log('🤖 AI回答:', data.data.answer)
      return data.data
    } else {
      throw new Error(data.error || 'AI对话失败')
    }
  } catch (error) {
    console.error('❌ AI对话失败:', error.message)
    throw error
  }
}

/**
 * 测试题目分析
 */
async function testQuestionAnalysis(token, paperId) {
  try {
    const response = await fetch(`${SERVER_URL}/api/ai-image/analyze-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paperId })
    })

    const data = await response.json()
    if (data.success) {
      console.log('✅ 题目分析成功')
      console.log('📊 分析结果:', data.data)
      return data.data
    } else {
      throw new Error(data.error || '题目分析失败')
    }
  } catch (error) {
    console.error('❌ 题目分析失败:', error.message)
    throw error
  }
}

/**
 * 主测试函数
 */
async function runImageModeTest() {
  console.log('🚀 开始测试图片模式功能...')
  console.log('=' .repeat(50))

  try {
    // 1. 登录
    console.log('\n1️⃣ 测试登录...')
    const token = await login()

    // 2. 上传并处理图片
    console.log('\n2️⃣ 测试图片上传和处理...')
    const processResult = await uploadAndProcessImage(token)

    // 3. 创建试卷
    console.log('\n3️⃣ 测试试卷创建...')
    const paper = await createImagePaper(token, processResult)

    // 4. 测试知识点识别
    console.log('\n4️⃣ 测试知识点识别...')
    await testKnowledgePointIdentification(token, paper.id)

    // 5. 测试AI对话
    console.log('\n5️⃣ 测试AI对话...')
    await testAIChat(token, paper.id)

    // 6. 测试题目分析
    console.log('\n6️⃣ 测试题目分析...')
    await testQuestionAnalysis(token, paper.id)

    console.log('\n' + '='.repeat(50))
    console.log('🎉 所有测试完成！图片模式功能正常工作')
    
  } catch (error) {
    console.log('\n' + '='.repeat(50))
    console.error('💥 测试失败:', error.message)
    process.exit(1)
  }
}

// 运行测试
runImageModeTest()