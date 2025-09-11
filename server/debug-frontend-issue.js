import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// 模拟前端API调用
class FrontendAPISimulator {
  constructor() {
    this.baseURL = 'http://localhost:5001/api';
  }

  async testKnowledgePointAPI(knowledgePoint, subject) {
    console.log(`\n=== 测试知识点API ===`);
    console.log(`知识点: ${knowledgePoint}`);
    console.log(`学科: ${subject}`);
    
    try {
      const url = `${this.baseURL}/knowledge-points/${encodeURIComponent(knowledgePoint)}?subject=${encodeURIComponent(subject)}`;
      console.log(`请求URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 不添加Authorization头，模拟未登录状态
        }
      });
      
      console.log(`响应状态: ${response.status} ${response.statusText}`);
      console.log(`响应头:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ HTTP错误: ${response.status}`);
        console.log(`错误内容: ${errorText}`);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
      
      const data = await response.json();
      console.log(`✅ 响应数据:`, JSON.stringify(data, null, 2));
      
      return data;
      
    } catch (error) {
      console.log(`❌ 请求异常: ${error.message}`);
      console.log(`错误堆栈:`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async testWithAuth(knowledgePoint, subject) {
    console.log(`\n=== 测试带认证的知识点API ===`);
    
    try {
      // 首先尝试登录获取token
      const loginResponse = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log(`✅ 登录成功，获得token`);
        
        // 使用token请求知识点
        const url = `${this.baseURL}/knowledge-points/${encodeURIComponent(knowledgePoint)}?subject=${encodeURIComponent(subject)}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`带认证的响应状态: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ 带认证的响应:`, JSON.stringify(data, null, 2));
          return data;
        } else {
          const errorText = await response.text();
          console.log(`❌ 带认证的请求失败: ${errorText}`);
        }
      } else {
        console.log(`❌ 登录失败，使用无认证方式测试`);
        return await this.testKnowledgePointAPI(knowledgePoint, subject);
      }
      
    } catch (error) {
      console.log(`❌ 认证测试异常: ${error.message}`);
      return await this.testKnowledgePointAPI(knowledgePoint, subject);
    }
  }

  async checkServerHealth() {
    console.log(`\n=== 检查服务器健康状态 ===`);
    
    try {
      const response = await fetch('http://localhost:5001/health');
      const data = await response.json();
      console.log(`服务器健康状态:`, data);
      return data;
    } catch (error) {
      console.log(`❌ 服务器健康检查失败: ${error.message}`);
      return null;
    }
  }

  async testCORS() {
    console.log(`\n=== 测试CORS配置 ===`);
    
    try {
      const response = await fetch('http://localhost:5001/api/knowledge-points/test', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      console.log(`CORS预检响应状态: ${response.status}`);
      console.log(`CORS响应头:`, Object.fromEntries(response.headers.entries()));
      
    } catch (error) {
      console.log(`❌ CORS测试失败: ${error.message}`);
    }
  }
}

async function runTests() {
  const simulator = new FrontendAPISimulator();
  
  console.log('开始前端API问题调试...');
  
  // 1. 检查服务器健康状态
  await simulator.checkServerHealth();
  
  // 2. 测试CORS
  await simulator.testCORS();
  
  // 3. 测试无认证的知识点API
  await simulator.testKnowledgePointAPI('导数', '数学');
  
  // 4. 测试带认证的知识点API
  await simulator.testWithAuth('导数', '数学');
  
  // 5. 测试不存在的知识点
  await simulator.testKnowledgePointAPI('不存在的知识点', '数学');
  
  console.log('\n=== 调试完成 ===');
}

runTests().catch(console.error);