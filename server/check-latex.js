import mongoose from 'mongoose';
import KnowledgePoint from './src/models/KnowledgePoint.js';

async function checkLatexIssues() {
  try {
    await mongoose.connect('mongodb://localhost:27017/studdy');
    console.log('Connected to MongoDB');
    
    const points = await KnowledgePoint.find({ subject: '数学' }).limit(5);
    
    console.log('\n=== 知识点LaTeX检查 ===\n');
    
    points.forEach((point, index) => {
      console.log(`${index + 1}. ${point.name}`);
      console.log('定义内容:');
      console.log(point.definition.substring(0, 300) + '...');
      
      // 检查LaTeX格式问题
      const hasInlineMath = point.definition.includes('$') && !point.definition.includes('$$');
      const hasBlockMath = point.definition.includes('$$');
      const hasUnicodeSymbols = /[²³¹₁₂₃×÷±≤≥≠≈∞π]/g.test(point.definition);
      const hasDoubleBackslash = /\\\\/.test(point.definition);
      
      console.log('LaTeX问题检查:');
      console.log(`- 包含行内公式: ${hasInlineMath}`);
      console.log(`- 包含块级公式: ${hasBlockMath}`);
      console.log(`- 包含Unicode符号: ${hasUnicodeSymbols}`);
      console.log(`- 包含双反斜杠: ${hasDoubleBackslash}`);
      
      if (hasUnicodeSymbols) {
        const unicodeMatches = point.definition.match(/[²³¹₁₂₃×÷±≤≥≠≈∞π]/g);
        console.log(`- Unicode符号: ${unicodeMatches?.join(', ')}`);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkLatexIssues();