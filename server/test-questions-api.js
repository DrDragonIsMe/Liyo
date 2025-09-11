import fetch from 'node-fetch';

const testQuestionsAPI = async () => {
  try {
    console.log('🧪 测试题目API...');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzAyNDM3ODE0NDliODRjMjM1OGI0MiIsImlhdCI6MTc1NzQ3MTc2NiwiZXhwIjoxNzU4MDc2NTY2fQ.n5qvayZd_12npX7z-XSl69P2TqVeZReOgilu89_VACA';
    
    const response = await fetch('http://localhost:5001/api/questions?subject=数学&limit=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('错误响应:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data.questions) {
      console.log(`✅ 找到 ${data.data.questions.length} 道题目`);
      data.data.questions.forEach((q, i) => {
        console.log(`题目 ${i+1}:`, {
          id: q.id,
          content: q.content?.substring(0, 50) + '...',
          subject: q.subject,
          type: q.type,
          difficulty: q.difficulty
        });
      });
    } else {
      console.log('❌ 没有找到题目');
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
};

testQuestionsAPI();