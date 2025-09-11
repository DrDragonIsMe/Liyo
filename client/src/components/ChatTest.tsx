import React, { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import MathRenderer from './MathRenderer'

const ChatTest: React.FC = () => {
  const [testMessage, setTestMessage] = useState(
    '**解题思路：**\n\n1. 首先观察方程 $ax^2 + bx + c = 0$\n2. 计算判别式 $\\Delta = b^2 - 4ac$\n\n**求根公式：**\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n对于方程 $x^2 - 5x + 6 = 0$，我们有：\n- $a = 1$, $b = -5$, $c = 6$\n- $\\Delta = (-5)^2 - 4(1)(6) = 25 - 24 = 1$\n\n因此解为：$x_1 = 3$, $x_2 = 2$'
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">聊天消息数学公式渲染测试</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">测试消息内容：</label>
        <textarea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
          placeholder="输入包含数学公式的消息..."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MarkdownRenderer 渲染结果 */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-blue-600">MarkdownRenderer (聊天中使用)</h3>
          <div className="bg-white border rounded-lg p-3 min-h-[200px]">
            <MarkdownRenderer content={testMessage} />
          </div>
        </div>

        {/* MathRenderer 渲染结果 */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-green-600">MathRenderer (纯数学渲染)</h3>
          <div className="bg-white border rounded-lg p-3 min-h-[200px]">
            <MathRenderer content={testMessage} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">预设测试用例：</h3>
        <div className="space-y-2">
          <button
            onClick={() => setTestMessage('简单公式测试：$x^2 + 2x - 3 = 0$')}
            className="mr-2 mb-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            简单公式
          </button>
          <button
            onClick={() => setTestMessage('块级公式：$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$')}
            className="mr-2 mb-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            块级公式
          </button>
          <button
            onClick={() => setTestMessage('**AI回答示例：**\n\n解方程 $x^2 - 4 = 0$\n\n**步骤：**\n1. 移项得到 $x^2 = 4$\n2. 开平方根：$$x = \\pm\\sqrt{4} = \\pm 2$$\n\n所以解为 $x = 2$ 或 $x = -2$')}
            className="mr-2 mb-2 px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
          >
            AI回答格式
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatTest