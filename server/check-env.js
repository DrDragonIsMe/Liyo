console.log('检查环境变量:');
console.log('AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? '已设置' : '未设置');
console.log('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT);
console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME);
console.log('AZURE_OPENAI_API_VERSION:', process.env.AZURE_OPENAI_API_VERSION);

// 检查.env文件是否存在
import fs from 'fs';
import path from 'path';

const envPath = './.env';
if (fs.existsSync(envPath)) {
  console.log('\n.env文件存在');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('文件内容长度:', envContent.length);
  
  // 检查是否包含Azure配置
  if (envContent.includes('AZURE_OPENAI_API_KEY')) {
    console.log('✅ .env文件包含Azure OpenAI配置');
  } else {
    console.log('❌ .env文件不包含Azure OpenAI配置');
  }
} else {
  console.log('❌ .env文件不存在');
}

// 尝试手动加载dotenv
try {
  const dotenv = await import('dotenv');
  dotenv.config();
  console.log('\n手动加载dotenv后:');
  console.log('AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? '已设置' : '未设置');
  console.log('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT);
} catch (error) {
  console.log('dotenv加载失败:', error.message);
}