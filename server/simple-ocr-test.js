import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const testOCR = async () => {
  try {
    console.log('🧪 开始简化OCR测试...');
    
    // 1. 登录获取token
    console.log('🔐 正在登录...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'test@example.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，token长度:', token.length);
    
    // 2. 创建简单的PNG测试图片
    const testImageContent = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const imagePath = './test-simple.png';
    fs.writeFileSync(imagePath, testImageContent);
    console.log('✅ 测试PNG图片已创建');
    
    // 3. 测试图片上传
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    form.append('subject', '数学');
    
    console.log('📤 发送OCR请求...');
    const response = await axios.post('http://localhost:5001/api/questions/parse-image', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });
    
    console.log('✅ OCR请求成功!');
    console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));
    
    // 清理测试文件
    fs.unlinkSync(imagePath);
    
  } catch (error) {
    console.log('❌ OCR测试失败:');
    console.log('错误信息:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
  }
};

testOCR();