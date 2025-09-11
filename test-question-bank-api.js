const axios = require('axios');

// 配置API基础URL
const API_BASE_URL = 'http://localhost:5001/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 测试题库管理API
async function testQuestionBankAPI() {
  console.log('开始测试题库管理API...');
  
  try {
    // 0. 先登录获取token
    console.log('\n0. 登录获取访问令牌');
    let token = null;
    
    try {
      const loginResponse = await api.post('/auth/login', {
        email: 'testuser' + Date.now() + '@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
         token = loginResponse.data.data.token;
       }
    } catch (loginError) {
      console.log('登录失败，尝试注册新用户...');
      
      try {
         const testEmail = 'testuser' + Date.now() + '@example.com';
         const registerResponse = await api.post('/auth/register', {
           name: '测试用户',
           email: testEmail,
           password: 'password123'
         });
        
        if (registerResponse.data.success) {
          console.log('注册成功，重新登录...');
          const retryLoginResponse = await api.post('/auth/login', {
             email: testEmail,
             password: 'password123'
           });
          token = retryLoginResponse.data.data.token;
        }
      } catch (registerError) {
        console.error('注册也失败了:', registerError.response?.data || registerError.message);
        throw new Error('无法获取访问令牌');
      }
    }
    
    if (!token) {
      throw new Error('无法获取访问令牌');
    }
    
    // 设置认证头
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('登录成功，获得访问令牌');
    
    // 1. 测试获取学科列表
    console.log('\n1. 测试获取学科列表');
    const subjectsResponse = await api.get('/question-bank');
    console.log('学科列表:', subjectsResponse.data);
    
    // 2. 测试获取题目列表（数学学科）
    console.log('\n2. 测试获取数学题目列表');
    const questionsResponse = await api.get('/question-bank/数学', {
      params: {
        page: 1,
        limit: 5
      }
    });
    console.log('题目列表:', questionsResponse.data);
    
    // 3. 测试获取统计信息
    console.log('\n3. 测试获取数学统计信息');
    const statsResponse = await api.get('/question-bank/数学/stats');
    console.log('统计信息:', statsResponse.data);
    
    // 4. 测试创建新题目
    console.log('\n4. 测试创建新题目');
    const newQuestion = {
      content: '测试题目：计算 $\\int_0^1 x^2 dx$ 的值',
      type: '计算题',
      difficulty: '中等',
      points: 10,
      options: [],
      correctAnswer: '$\\frac{1}{3}$',
      explanation: '使用基本积分公式：$\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$',
      knowledgePoints: ['定积分', '基本积分公式'],
      tags: ['积分', '计算']
    };
    
    const createResponse = await api.post('/question-bank/数学', newQuestion);
    console.log('创建题目结果:', createResponse.data);
    
    const questionId = createResponse.data.data.questionId;
    
    // 5. 测试获取单个题目
    console.log('\n5. 测试获取单个题目');
    const questionResponse = await api.get(`/question-bank/数学/${questionId}`);
    console.log('题目详情:', questionResponse.data);
    
    // 6. 测试更新题目
    console.log('\n6. 测试更新题目');
    const updateData = {
      content: '测试题目（已更新）：计算 $\\int_0^1 x^2 dx$ 的值',
      difficulty: '简单'
    };
    
    const updateResponse = await api.put(`/question-bank/数学/${questionId}`, updateData);
    console.log('更新题目结果:', updateResponse.data);
    
    // 7. 测试删除题目
    console.log('\n7. 测试删除题目');
    const deleteResponse = await api.delete(`/question-bank/数学/${questionId}`);
    console.log('删除题目结果:', deleteResponse.data);
    
    console.log('\n✅ 所有API测试通过！');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应头:', error.response.headers);
    }
  }
}

// 运行测试
testQuestionBankAPI();