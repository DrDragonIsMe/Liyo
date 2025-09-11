// 在浏览器控制台中运行此代码来测试知识点功能

// 测试知识点API调用
async function testKnowledgePointAPI() {
    console.log('🧪 开始测试知识点API...');
    
    try {
        // 模拟前端API调用
        const response = await fetch('/api/knowledge-points/导数?subject=数学');
        
        console.log('📡 API响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 API响应数据:', data);
        
        // 模拟KnowledgePointDetail组件的数据处理逻辑
        if (!data || !data.success || !data.data) {
            throw new Error(data?.error || 'API响应数据格式错误');
        }
        
        const knowledgeData = data.data;
        if (!knowledgeData.definition) {
            throw new Error('知识点定义数据缺失');
        }
        
        console.log('✅ 知识点API测试成功!');
        console.log('📚 知识点定义:', knowledgeData.definition);
        console.log('🔗 相关概念:', knowledgeData.relatedConcepts);
        console.log('📊 考试概率:', knowledgeData.examProbability + '%');
        
        return { success: true, data: knowledgeData };
        
    } catch (error) {
        console.error('❌ 知识点API测试失败:', error);
        console.error('🔍 错误详情:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        return { success: false, error: error.message };
    }
}

// 测试知识点组件渲染逻辑
function testKnowledgePointComponent() {
    console.log('🎨 测试知识点组件逻辑...');
    
    // 查找StudyPage中的知识点按钮
    const knowledgeButtons = document.querySelectorAll('[data-testid="knowledge-point-button"], .knowledge-point-button, button[class*="knowledge"]');
    
    console.log('🔍 找到知识点按钮数量:', knowledgeButtons.length);
    
    if (knowledgeButtons.length > 0) {
        console.log('🎯 知识点按钮:', Array.from(knowledgeButtons).map(btn => btn.textContent));
        
        // 尝试点击第一个知识点按钮
        const firstButton = knowledgeButtons[0];
        console.log('👆 尝试点击知识点按钮:', firstButton.textContent);
        
        firstButton.click();
        
        // 检查是否出现知识点详情弹窗
        setTimeout(() => {
            const modal = document.querySelector('[class*="modal"], [class*="dialog"], [class*="popup"]');
            if (modal) {
                console.log('✅ 知识点详情弹窗已显示');
            } else {
                console.log('⚠️ 未找到知识点详情弹窗');
            }
        }, 1000);
        
    } else {
        console.log('⚠️ 未找到知识点按钮，请确保在StudyPage页面');
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🚀 开始运行知识点功能测试...');
    console.log('=' .repeat(50));
    
    // 测试API
    const apiResult = await testKnowledgePointAPI();
    
    console.log('=' .repeat(50));
    
    // 测试组件
    testKnowledgePointComponent();
    
    console.log('=' .repeat(50));
    console.log('🏁 测试完成');
    
    return apiResult;
}

// 导出测试函数
window.testKnowledgePoint = {
    api: testKnowledgePointAPI,
    component: testKnowledgePointComponent,
    all: runAllTests
};

console.log('📋 知识点测试工具已加载！');
console.log('💡 使用方法:');
console.log('  - testKnowledgePoint.api() - 测试API调用');
console.log('  - testKnowledgePoint.component() - 测试组件交互');
console.log('  - testKnowledgePoint.all() - 运行所有测试');