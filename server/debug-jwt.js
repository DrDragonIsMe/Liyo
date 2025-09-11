import axios from 'axios';

const debugJWT = async () => {
  try {
    console.log('🔍 调试JWT问题...');
    
    // 1. 测试登录
    console.log('\n1. 测试登录...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'test@example.com',
      password: '123456'
    });
    
    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data.token;
    console.log('\n获取到的token:', token);
    console.log('Token长度:', token ? token.length : 'undefined');
    console.log('Token类型:', typeof token);
    
    if (!token) {
      console.error('❌ 未获取到token');
      return;
    }
    
    // 2. 测试token格式
    console.log('\n2. 测试token格式...');
    const tokenParts = token.split('.');
    console.log('Token部分数量:', tokenParts.length);
    console.log('Token是否为JWT格式:', tokenParts.length === 3);
    
    // 3. 测试Authorization头部
    console.log('\n3. 测试Authorization头部...');
    const authHeader = `Bearer ${token}`;
    console.log('Authorization头部:', authHeader);
    
    // 4. 测试简单的认证接口
    console.log('\n4. 测试认证接口...');
    try {
      const meResponse = await axios.get('http://localhost:5001/api/auth/me', {
        headers: {
          'Authorization': authHeader
        }
      });
      console.log('✅ /api/auth/me 请求成功');
      console.log('用户信息:', meResponse.data.data.user.name);
    } catch (error) {
      console.error('❌ /api/auth/me 请求失败:');
      console.error('状态码:', error.response?.status);
      console.error('错误信息:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出错:');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
};

// 运行调试
debugJWT();