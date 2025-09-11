import mongoose from 'mongoose';
import KnowledgePoint from './src/models/KnowledgePoint.js';

async function findLatexPoints() {
  try {
    await mongoose.connect('mongodb://localhost:27017/studdy');
    console.log('已连接到MongoDB');
    
    // 查找包含LaTeX公式的知识点
    const points = await KnowledgePoint.find({ 
      subject: '数学', 
      definition: { $regex: /\$.*\$/ } 
    }).select('name definition').limit(10);
    
    console.log(`\n找到 ${points.length} 个包含LaTeX的知识点:\n`);
    
    points.forEach((point, i) => {
      console.log(`${i+1}. ${point.name}`);
      
      // 统计公式数量
      const inlineMatches = point.definition.match(/\$[^$]+\$/g) || [];
      const blockMatches = point.definition.match(/\$\$[^$]+\$\$/g) || [];
      
      console.log(`   行内公式: ${inlineMatches.length}个`);
      console.log(`   块级公式: ${blockMatches.length}个`);
      
      // 显示示例公式
      if (inlineMatches.length > 0) {
        console.log(`   行内示例: ${inlineMatches.slice(0, 2).join(', ')}`);
      }
      if (blockMatches.length > 0) {
        console.log(`   块级示例: ${blockMatches.slice(0, 1).join('')}`);
      }
      
      // 检查可能有问题的公式
      const problematicPatterns = [
        /\$[^$]*[\u4e00-\u9fff][^$]*\$/g,  // 包含中文的公式
        /\$[^$]*\\\\[^$]*\$/g,              // 包含双反斜杠的公式
        /\$[^$]*[，。；：？！（）【】][^$]*\$/g  // 包含中文标点的公式
      ];
      
      let hasProblems = false;
      problematicPatterns.forEach((pattern, patternIndex) => {
        const matches = point.definition.match(pattern) || [];
        if (matches.length > 0) {
          if (!hasProblems) {
            console.log(`   ⚠️  可能有问题的公式:`);
            hasProblems = true;
          }
          const patternNames = ['包含中文', '双反斜杠', '中文标点'];
          console.log(`      ${patternNames[patternIndex]}: ${matches.slice(0, 2).join(', ')}`);
        }
      });
      
      console.log('');
    });
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('已断开MongoDB连接');
  }
}

findLatexPoints();