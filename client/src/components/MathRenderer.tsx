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
 */
const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  // 解析内容中的数学公式
  const renderContent = (text: string) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let key = 0

    // 匹配块级公式 $$...$$
    const blockMathRegex = /\$\$([^$]+)\$\$/g
    let blockMatch
    const blockMatches: Array<{ start: number; end: number; content: string }> = []
    
    while ((blockMatch = blockMathRegex.exec(text)) !== null) {
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
    
    while ((inlineMatch = inlineMathRegex.exec(text)) !== null) {
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
        const normalText = text.slice(lastIndex, match.start)
        if (normalText) {
          parts.push(
            <span key={key++} dangerouslySetInnerHTML={{ __html: normalText.replace(/\n/g, '<br/>') }} />
          )
        }
      }

      // 添加数学公式
      try {
        if (match.type === 'block') {
          parts.push(
            <div key={key++} className="my-4 text-center">
              <BlockMath math={match.content} />
            </div>
          )
        } else {
          parts.push(
            <InlineMath key={key++} math={match.content} />
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
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex)
      if (remainingText) {
        parts.push(
          <span key={key++} dangerouslySetInnerHTML={{ __html: remainingText.replace(/\n/g, '<br/>') }} />
        )
      }
    }

    return parts.length > 0 ? parts : [
      <span key={0} dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />
    ]
  }

  return (
    <div className={`math-content ${className}`}>
      {renderContent(content)}
    </div>
  )
}

export default MathRenderer