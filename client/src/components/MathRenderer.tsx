import React from 'react'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  content: string
  className?: string
}

/**
 * 数学公式渲染组件
 * 支持行内公式 $...$ 和块级公式 $$...$$
 * 针对Azure GPT-4生成的LaTeX语法进行优化
 */
const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  // 检查内容是否为空或undefined
  if (!content || typeof content !== 'string') {
    return <div className={`math-content ${className}`}></div>
  }

  // 简化的预处理函数，仅处理基本的Unicode符号转换
  const preprocessLatex = (text: string): string => {
    return text
      // 仅处理常见的Unicode数学符号转换为KaTeX格式
      .replace(/×/g, '\\times')
      .replace(/÷/g, '\\div')
      .replace(/±/g, '\\pm')
      .replace(/≤/g, '\\leq')
      .replace(/≥/g, '\\geq')
      .replace(/≠/g, '\\neq')
      .replace(/≈/g, '\\approx')
      .replace(/∞/g, '\\infty')
      .replace(/π/g, '\\pi')
      .replace(/∫/g, '\\int')
      .replace(/∑/g, '\\sum')
      .replace(/√/g, '\\sqrt')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
  }

  // 清理数学内容，移除可能导致渲染问题的字符
  const cleanMathContent = (content: string): string => {
    return content
      .replace(/\\n/g, ' ') // 移除换行符
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim()
  }

  // 解析内容中的数学公式
  const renderContent = (text: string) => {
    // 首先预处理LaTeX公式
    const processedText = preprocessLatex(text)
    
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let key = 0

    // 匹配块级公式 $$...$$
    const blockMathRegex = /\$\$([^$]+)\$\$/g
    let blockMatch
    const blockMatches: Array<{ start: number; end: number; content: string }> = []
    
    while ((blockMatch = blockMathRegex.exec(processedText)) !== null) {
      blockMatches.push({
        start: blockMatch.index,
        end: blockMatch.index + blockMatch[0].length,
        content: blockMatch[1].trim()
      })
    }

    // 匹配行内公式 $...$（排除已经被块级公式匹配的部分）
    const inlineMathRegex = /\$([^$]+)\$/g
    let inlineMatch
    const inlineMatches: Array<{ start: number; end: number; content: string }> = []
    
    while ((inlineMatch = inlineMathRegex.exec(processedText)) !== null) {
      // 检查是否与块级公式重叠
      const isOverlapping = blockMatches.some(block => 
        inlineMatch!.index >= block.start && inlineMatch!.index < block.end
      )
      
      if (!isOverlapping) {
        inlineMatches.push({
          start: inlineMatch.index,
          end: inlineMatch.index + inlineMatch[0].length,
          content: inlineMatch[1].trim()
        })
      }
    }

    // 合并所有匹配并按位置排序
    const allMatches = [
      ...blockMatches.map(m => ({ ...m, type: 'block' as const })),
      ...inlineMatches.map(m => ({ ...m, type: 'inline' as const }))
    ].sort((a, b) => a.start - b.start)

    // 渲染内容
    allMatches.forEach(match => {
      // 添加匹配前的普通文本
      if (lastIndex < match.start) {
        const normalText = processedText.slice(lastIndex, match.start)
        if (normalText) {
          // 将换行符转换为实际的换行元素
          const textWithBreaks = normalText.split('\n').map((line, index, array) => (
            <React.Fragment key={`${key}-${index}`}>
              {line}
              {index < array.length - 1 && <br />}
            </React.Fragment>
          ))
          parts.push(
            <span key={key++}>{textWithBreaks}</span>
          )
        }
      }

      // 添加数学公式
      try {
        const cleanedContent = cleanMathContent(match.content)
        if (match.type === 'block') {
          parts.push(
            <div key={key++} className="my-4 text-center">
              <BlockMath math={cleanedContent} />
            </div>
          )
        } else {
          parts.push(
            <InlineMath key={key++} math={cleanedContent} />
          )
        }
      } catch (error) {
        console.error('KaTeX渲染错误:', error)
        // 如果渲染失败，显示原始文本
        parts.push(
          <span key={key++} className="text-red-500 bg-red-50 px-1 rounded">
            {match.type === 'block' ? `$$${match.content}$$` : `$${match.content}$`}
          </span>
        )
      }

      lastIndex = match.end
    })

    // 添加剩余的普通文本
    if (lastIndex < processedText.length) {
      const remainingText = processedText.slice(lastIndex)
      if (remainingText) {
        // 将换行符转换为实际的换行元素
        const textWithBreaks = remainingText.split('\n').map((line, index, array) => (
          <React.Fragment key={`${key}-${index}`}>
            {line}
            {index < array.length - 1 && <br />}
          </React.Fragment>
        ))
        parts.push(
          <span key={key++}>{textWithBreaks}</span>
        )
      }
    }

    return parts.length > 0 ? parts : [
      <span key={0}>
        {processedText.split('\n').map((line, index, array) => (
          <React.Fragment key={index}>
            {line}
            {index < array.length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    ]
  }

  return (
    <div className={`math-content ${className}`} style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#333'
    }}>
      <style>{`
        .math-content .katex-display {
          margin: 1.5em 0;
          text-align: center;
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #eee;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .math-content .katex {
          font-size: 1.1em;
        }
        .math-content .katex-display .katex {
          font-size: 1.2em;
        }
        .math-content h1 {
          font-size: 1.8em;
          font-weight: bold;
          margin: 1.2em 0 0.8em 0;
          color: #333;
          border-bottom: 2px solid #007acc;
          padding-bottom: 5px;
        }
        .math-content h2 {
          font-size: 1.4em;
          font-weight: bold;
          margin: 1em 0 0.6em 0;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 3px;
        }
        .math-content strong {
          font-weight: 600;
          color: #2c3e50;
        }
        .math-content li {
          margin: 0.3em 0;
          list-style-type: decimal;
          margin-left: 1.5em;
        }
        .math-content .error {
          background: #f8d7da;
          color: #721c24;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
      `}</style>
      {renderContent(content)}
    </div>
  )
}

export default MathRenderer