import fetch from 'node-fetch';

const testQuestionStructure = async () => {
  console.log('🔍 检查题目数据结构...');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzAyNDM3ODE0NDliODRjMjM1OGI0MiIsImlhdCI6MTc1NzQ3MjI5MCwiZXhwIjoxNzU4MDc3MDkwfQ.KeGkH4_QHstNyr4CjqHlTAwW8n4TKt5hRg_I2WC3V2I';
  
  try {
    const response = await fetch('http://localhost:5001/api/questions?subject=数学&random=true&limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API响应成功');
      console.log('📊 完整响应数据:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.questions && data.questions.length > 0) {
        const question = data.questions[0];
        console.log('\n🔍 题目详细结构分析:');
        console.log('题目ID:', question._id);
        console.log('题目内容:', question.content);
        console.log('题目类型:', question.type);
        console.log('选项类型:', typeof question.options);
        console.log('选项内容:', question.options);
        
        if (Array.isArray(question.options)) {
          console.log('\n📝 选项详细分析:');
          question.options.forEach((option, index) => {
            console.log(`选项 ${index + 1}:`);
            console.log('  类型:', typeof option);
            console.log('  内容:', option);
            if (typeof option === 'object') {
              console.log('  对象结构:', JSON.stringify(option, null, 4));
            }
          });
        }
      }
    } else {
      console.log('❌ API响应失败:', response.status);
      console.log('错误信息:', data);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
};

testQuestionStructure();