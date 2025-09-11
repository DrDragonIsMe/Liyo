import dotenv from 'dotenv'
dotenv.config()

import fetch from 'node-fetch'
import aiService from './src/services/aiService.js'

// 测试AI服务
async function testAIService() {
  console.log('测试AI服务...')
  try {
    const result = await aiService.generateStudyAdvice('system', {
      prompt: '请解释什么是导数？',
      subject: '数学',
      knowledgePoint: '导数'
    })
    console.log('AI服务测试结果:', result)
    return result.success
  } catch (error) {
    console.error('AI服务测试失败:', error)
    return false
  }
}

// 测试知识点API
async function testKnowledgePointAPI() {
  console.log('测试知识点API...')
  try {
    const response = await fetch('http://localhost:5001/api/knowledge-points/导数?subject=数学')
    const data = await response.json()
    console.log('API响应状态:', response.status)
    console.log('API响应数据:', JSON.stringify(data, null, 2))
    return response.ok
  } catch (error) {
    console.error('API测试失败:', error)
    return false
  }
}

// 运行测试
async function runTests() {
  console.log('开始测试知识点功能...')
  
  const aiTest = await testAIService()
  console.log('AI服务测试:', aiTest ? '通过' : '失败')
  
  const apiTest = await testKnowledgePointAPI()
  console.log('API测试:', apiTest ? '通过' : '失败')
  
  if (aiTest && apiTest) {
    console.log('✅ 所有测试通过')
  } else {
    console.log('❌ 部分测试失败')
  }
}

runTests().catch(console.error)