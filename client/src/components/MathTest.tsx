import React, { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import MathRenderer from './MathRenderer'

const MathTest: React.FC = () => {
  const [testContent, setTestContent] = useState(`
# 数学公式测试

## 行内公式测试
这是一个行内公式：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

## 块级公式测试
这是一个块级公式：
$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

## 复杂公式测试
二次函数的顶点坐标为：$(-\\frac{b}{2a}, \\frac{4ac-b^2}{4a})$

勾股定理：$$a^2 + b^2 = c^2$$

## 常见数学符号
- 分数：$\\frac{1}{2}$, $\\frac{x+1}{x-1}$
- 根号：$\\sqrt{16} = 4$, $\\sqrt[3]{27} = 3$
- 三角函数：$\\sin(\\theta)$, $\\cos(\\theta)$, $\\tan(\\theta)$
- 希腊字母：$\\alpha$, $\\beta$, $\\gamma$, $\\pi$
- 运算符：$\\times$, $\\div$, $\\pm$, $\\leq$, $\\geq$
  `)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">数学公式渲染测试</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">测试内容编辑器</h2>
        <textarea
          value={testContent}
          onChange={(e) => setTestContent(e.target.value)}
          className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm"
          placeholder="输入包含数学公式的内容..."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">MarkdownRenderer 渲染结果</h2>
          <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-[300px]">
            <MarkdownRenderer content={testContent} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">MathRenderer 渲染结果</h2>
          <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-[300px]">
            <MathRenderer content={testContent} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">预设测试用例</h2>
        <div className="space-y-2">
          <button
            onClick={() => setTestContent('这是一个简单的数学公式：$x^2 + 2x - 3 = 0$')}
            className="mr-2 mb-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            基础公式
          </button>
          <button
            onClick={() => setTestContent('二次公式：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$')}
            className="mr-2 mb-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            复杂公式
          </button>
          <button
            onClick={() => setTestContent('解方程 $x^2 - 5x + 6 = 0$\n\n使用因式分解法：\n$$x^2 - 5x + 6 = (x-2)(x-3) = 0$$\n\n所以 $x = 2$ 或 $x = 3$')}
            className="mr-2 mb-2 px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
          >
            混合内容
          </button>
          <button
            onClick={() => setTestContent('**解题思路：**\n\n1. 首先观察方程 $ax^2 + bx + c = 0$\n2. 计算判别式 $\\Delta = b^2 - 4ac$\n3. 根据判别式的值判断解的情况：\n   - 当 $\\Delta > 0$ 时，方程有两个不相等的实根\n   - 当 $\\Delta = 0$ 时，方程有两个相等的实根\n   - 当 $\\Delta < 0$ 时，方程无实根\n\n**具体步骤：**\n\n对于方程 $x^2 - 5x + 6 = 0$：\n\n$$\\Delta = (-5)^2 - 4 \\times 1 \\times 6 = 25 - 24 = 1 > 0$$\n\n所以方程有两个不相等的实根：\n\n$$x = \\frac{5 \\pm \\sqrt{1}}{2} = \\frac{5 \\pm 1}{2}$$\n\n因此：$x_1 = 3$，$x_2 = 2$')}
            className="mr-2 mb-2 px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
          >
            AI返回格式测试
          </button>
        </div>
      </div>
    </div>
  )
}

export default MathTest