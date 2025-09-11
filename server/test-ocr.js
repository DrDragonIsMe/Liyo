import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建一个简单的测试图片（SVG格式）
const createTestImage = () => {
  const svgContent = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white"/>
    <text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" dy=".3em">
      测试题目：1 + 1 = ?
    </text>
    <text x="50%" y="70%" font-family="Arial" font-size="16" text-anchor="middle" dy=".3em">
      A. 1  B. 2  C. 3  D. 4
    </text>
  </svg>`;
  
  const testImagePath = path.join(__dirname, 'test-image.svg');
  fs.writeFileSync(testImagePath, svgContent);
  return testImagePath;
};

const testOCR = async () => {
  try {
    console.log('🧪 开始测试OCR功能...');
    
    // 先登录获取有效token
    console.log('🔐 正在登录获取token...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'test@example.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到token');
    
    // 创建测试图片
    const imagePath = createTestImage();
    console.log('✅ 测试图片已创建:', imagePath);
    
    // 准备表单数据
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    
    // 发送请求到图片解析接口
    const response = await axios.post('http://localhost:5001/api/questions/parse-image', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000 // 30秒超时
    });
    
    console.log('✅ OCR请求成功');
    console.log('📄 识别结果:', response.data);
    
    // 清理测试文件
    fs.unlinkSync(imagePath);
    console.log('🧹 测试文件已清理');
    
  } catch (error) {
    console.error('❌ OCR测试失败:');
    console.error('错误信息:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    
    // 清理测试文件（如果存在）
    const testImagePath = path.join(__dirname, 'test-image.svg');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
};

// 运行测试
testOCR();