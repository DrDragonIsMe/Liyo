import React from 'react';
import MarkdownRenderer from './components/MarkdownRenderer';
import MathRenderer from './components/MathRenderer';

const TestLatexComponent: React.FC = () => {
  const testContent = `配方法是将二次方程 $ax^2 + bx + c = 0$ 转化为 $(x + m)^2 = n$ 的形式的解法。

## 基本步骤

1. **移项**：将常数项移到等号右边
   $ax^2 + bx = -c$

2. **系数化1**：两边同时除以 $a$
   $x^2 + \\frac{b}{a}x = -\\frac{c}{a}$

3. **配方**：两边同时加上一次项系数一半的平方
   $x^2 + \\frac{b}{a}x + \\left(\\frac{b}{2a}\\right)^2 = -\\frac{c}{a} + \\left(\\frac{b}{2a}\\right)^2$

4. **化简**：左边写成完全平方式
   $$\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}$$

## 关键公式

配方后的标准形式：
$$\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{\\Delta}{4a^2}$$

其中判别式 $\\Delta = b^2 - 4ac$`;

  const simpleLatex = "这是一个简单的行内公式 $x^2 + y^2 = z^2$ 和块级公式：$$\\int_0^1 x^2 dx = \\frac{1}{3}$$";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">LaTeX渲染测试</h1>
      
      <div className="mb-8 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">测试1: MarkdownRenderer组件</h2>
        <div className="bg-gray-50 p-4 rounded">
          <MarkdownRenderer content={testContent} />
        </div>
      </div>
      
      <div className="mb-8 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">测试2: MathRenderer组件</h2>
        <div className="bg-gray-50 p-4 rounded">
          <MathRenderer content={simpleLatex} />
        </div>
      </div>
      
      <div className="mb-8 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">测试3: 原始HTML显示（对比）</h2>
        <div className="bg-gray-50 p-4 rounded font-mono text-sm">
          {testContent}
        </div>
      </div>
    </div>
  );
};

export default TestLatexComponent;