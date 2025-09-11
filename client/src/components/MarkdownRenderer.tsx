import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
  className?: string
  compact?: boolean // 紧凑模式，更激进地移除换行
  reduceMathSpacing?: boolean // 减少数学公式周围的间距，但保持段落结构
}

/**
 * Markdown渲染组件
 * 支持标准markdown语法、数学公式和GitHub风格的markdown
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '', compact = true, reduceMathSpacing = false }) => {
  // 检查内容是否为空或undefined
  if (!content || typeof content !== 'string') {
    return <div className={`markdown-content ${className}`}></div>
  }

  // 使用useMemo缓存清理函数，避免重复创建
  const { cleanMathContent, cleanTextContent } = useMemo(() => {
    // 清理数学内容，移除可能导致渲染问题的字符
    const cleanMathContent = (content: string): string => {
      return content
        .replace(/\\n/g, ' ') // 移除换行符
        .replace(/\s+/g, ' ') // 合并多个空格
        .trim()
    }

    // 清理文本内容，移除不必要的换行，但保留markdown语法
    const cleanTextContent = (text: string): string => {
      if (compact) {
        // 紧凑模式：移除所有换行，转为空格，但保护特殊格式
        return text
          .replace(/\r\n/g, '\n') // 统一换行符
          .replace(/\r/g, '\n') // 统一换行符
          // 先用占位符保护特殊格式
          .replace(/(^|\n)(#{1,6}\s[^\n]*)/g, '$1__TITLE_PLACEHOLDER__$2__TITLE_END__') // 保护标题
          .replace(/(^|\n)(---\s*#\s[^\n]*)/g, '$1__ANSWER_PLACEHOLDER__$2__ANSWER_END__') // 保护答号
          .replace(/\*\*([^*\n]+)\*\*/g, '__BOLD_START__$1__BOLD_END__') // 保护粗体
          .replace(/\*([^*\n]+)\*/g, '__ITALIC_START__$1__ITALIC_END__') // 保护斜体
          .replace(/\\\[([\s\S]*?)\\\]/g, '__LATEX_BLOCK_START__$1__LATEX_BLOCK_END__') // 保护\[...\]格式
          .replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, '__LATEX_ENV_START__\\begin{$1}$2\\end{$1}__LATEX_ENV_END__') // 保护\begin{}...\end{}格式
          .replace(/\n+/g, ' ') // 将所有换行都转为空格
          .replace(/\s+/g, ' ') // 合并多个空格
          // 恢复保护的格式
          .replace(/__TITLE_PLACEHOLDER__/g, '\n')
          .replace(/__TITLE_END__/g, '\n')
          .replace(/__ANSWER_PLACEHOLDER__/g, '\n')
          .replace(/__ANSWER_END__/g, '\n')
          .replace(/__BOLD_START__/g, '**')
          .replace(/__BOLD_END__/g, '**')
          .replace(/__ITALIC_START__/g, '*')
          .replace(/__ITALIC_END__/g, '*')
          .replace(/__LATEX_BLOCK_START__/g, '\n\\[')
          .replace(/__LATEX_BLOCK_END__/g, '\\]\n')
          .replace(/__LATEX_ENV_START__/g, '\n')
          .replace(/__LATEX_ENV_END__/g, '\n')
          .replace(/^\s+|\s+$/g, '') // 移除首尾空白
      } else if (reduceMathSpacing) {
        // 减少数学公式间距模式：保留段落但减少多余换行
        return text
          .replace(/\r\n/g, '\n') // 统一换行符
          .replace(/\r/g, '\n') // 统一换行符
          .replace(/\n{3,}/g, '\n\n') // 将3个或更多连续换行替换为2个
          .replace(/\n\s*\n/g, '\n\n') // 保留段落间的双换行
          // 确保markdown语法标记前后有换行
          .replace(/(#{1,6}\s[^\n]*)/g, '\n$1\n') // 标题前后保留换行
          .replace(/(---\s*#\s[^\n]*)/g, '\n$1\n') // 答号标记前后保留换行
          // 确保LaTeX块级公式前后有换行
          .replace(/(\\\[[\s\S]*?\\\])/g, '\n$1\n') // \[...\]前后保留换行
          .replace(/(\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\})/g, '\n$1\n') // \begin{}...\end{}前后保留换行
          .replace(/\n(?!\n)/g, ' ') // 将单个换行转为空格，保留双换行
          .replace(/\s+/g, ' ') // 合并多个空格
          .replace(/^\s+|\s+$/g, '') // 移除首尾空白
      } else {
        // 标准模式：保留段落结构和markdown语法
        return text
          .replace(/\r\n/g, '\n') // 统一换行符
          .replace(/\r/g, '\n') // 统一换行符
          .replace(/\n{3,}/g, '\n\n') // 将3个或更多连续换行替换为2个
          .replace(/\n\s*\n/g, '\n\n') // 保留段落间的双换行
          // 确保markdown语法标记前后有换行
          .replace(/(#{1,6}\s[^\n]*)/g, '\n$1\n') // 标题前后保留换行
          .replace(/(---\s*#\s[^\n]*)/g, '\n$1\n') // 答号标记前后保留换行
          // 确保LaTeX块级公式前后有换行
          .replace(/(\\\[[\s\S]*?\\\])/g, '\n$1\n') // \[...\]前后保留换行
          .replace(/(\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\})/g, '\n$1\n') // \begin{}...\end{}前后保留换行
          .replace(/\n(?!\n)/g, ' ') // 将单个换行转为空格，保留双换行
          .replace(/\s+/g, ' ') // 合并多个空格
          .replace(/^\s+|\s+$/g, '') // 移除首尾空白
      }
    }

    return { cleanMathContent, cleanTextContent }
  }, [compact, reduceMathSpacing])

  // 移除自定义组件，使用react-markdown默认渲染

  // 第一步：解析数学公式（优化的正则表达式匹配）
  const parseMathFormulas = useMemo(() => (text: string) => {
    // 直接使用原始文本，不进行预处理
    const processedText = text
    
    const allMatches: Array<{ start: number; end: number; content: string; type: 'block' | 'inline' }> = []
    
    // 优化的块级公式匹配：$$...$$（支持多行，避免贪婪匹配）
    const blockMathRegex = /\$\$([\s\S]*?)\$\$/g
    let blockMatch
    
    while ((blockMatch = blockMathRegex.exec(processedText)) !== null) {
      // 验证匹配的有效性：确保不是转义的$$
      const beforeMatch = processedText.substring(Math.max(0, blockMatch.index - 10), blockMatch.index)
      const escapeCount = (beforeMatch.match(/\\+$/)?.[0]?.length || 0)
      
      // 如果前面有奇数个反斜杠，说明$$被转义了，跳过
      if (escapeCount % 2 === 0) {
        allMatches.push({
          start: blockMatch.index,
          end: blockMatch.index + blockMatch[0].length,
          content: blockMatch[1].trim(),
          type: 'block'
        })
      }
    }

    // 优化的行内公式匹配：$...$（避免与$$冲突，不跨行）
    // 使用更兼容的正则表达式，避免lookbehind在某些浏览器中的兼容性问题
    const inlineMathRegex = /\$(?!\$)([^$\n\r]+?)\$(?!\$)/g
    let inlineMatch
    
    while ((inlineMatch = inlineMathRegex.exec(processedText)) !== null) {
      // 检查是否与块级公式重叠
      const isOverlapping = allMatches.some(block => 
        block.type === 'block' && 
        inlineMatch!.index >= block.start && 
        inlineMatch!.index < block.end
      )
      
      if (!isOverlapping) {
        // 验证匹配的有效性：确保不是转义的$
        const beforeMatch = processedText.substring(Math.max(0, inlineMatch.index - 5), inlineMatch.index)
        const escapeCount = (beforeMatch.match(/\\+$/)?.[0]?.length || 0)
        
        if (escapeCount % 2 === 0) {
          // 验证内容：确保不为空且不包含换行
          const content = inlineMatch[1].trim()
          if (content && !content.includes('\n') && !content.includes('\r') && content.length > 0) {
            allMatches.push({
              start: inlineMatch.index,
              end: inlineMatch.index + inlineMatch[0].length,
              content: content,
              type: 'inline'
            })
          }
        }
      }
    }

    // 按位置排序所有匹配
    allMatches.sort((a, b) => a.start - b.start)
    
    return { processedText, allMatches }
  }, [])

  // 第二步：渲染混合内容（优化的分段处理）
  const renderMixedContent = useMemo(() => {
    const { processedText, allMatches } = parseMathFormulas(content)
    
    // 如果没有数学公式，直接使用ReactMarkdown渲染
    if (allMatches.length === 0) {
      const cleanedText = cleanTextContent(processedText)
      if (compact) {
        // 紧凑模式下直接渲染文本，避免ReactMarkdown的段落换行
        return <span>{cleanedText}</span>
      } else {
        return (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
          >
            {cleanedText}
          </ReactMarkdown>
        )
      }
    }

    // 有数学公式时，采用优化的分段处理方式
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let key = 0

    // 创建可复用的ReactMarkdown配置
    const createMarkdownElement = (content: string, keyValue: number) => {
      if (compact) {
        return <span key={keyValue}>{content}</span>
      } else {
        return (
          <ReactMarkdown
            key={keyValue}
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        )
      }
    }

    // 按顺序处理每个数学公式
    allMatches.forEach(match => {
      // 添加匹配前的markdown内容
      if (lastIndex < match.start) {
        const markdownText = cleanTextContent(processedText.slice(lastIndex, match.start))
        if (markdownText.trim()) {
          parts.push(createMarkdownElement(markdownText, key++))
        }
      }

      // 添加数学公式（改进错误处理和渲染）
      try {
        const cleanedContent = cleanMathContent(match.content)
        
        // 验证数学公式内容
        if (!cleanedContent.trim()) {
          console.warn('空的数学公式内容，跳过渲染')
          lastIndex = match.end
          return
        }

        if (match.type === 'block') {
          const blockClassName = "text-center"
          parts.push(
            <div key={key++} className={blockClassName}>
              <BlockMath math={cleanedContent} />
            </div>
          )
        } else {
          parts.push(
            <InlineMath key={key++} math={cleanedContent} />
          )
        }
      } catch (error) {
        console.error('KaTeX渲染错误:', error, '公式内容:', match.content)
        // 提供更友好的错误显示
        parts.push(
          <span 
            key={key++} 
            className="text-red-600 bg-red-50 px-2 py-1 rounded text-sm border border-red-200"
            title={`渲染错误: ${error}`}
          >
            [公式错误: {match.content.substring(0, 20)}{match.content.length > 20 ? '...' : ''}]
          </span>
        )
      }

      lastIndex = match.end
    })

    // 添加剩余的markdown内容
    if (lastIndex < processedText.length) {
      const remainingText = cleanTextContent(processedText.slice(lastIndex))
      if (remainingText.trim()) {
        parts.push(createMarkdownElement(remainingText, key++))
      }
    }

    return <div className={compact ? "inline-flex flex-wrap items-center gap-1" : ""}>{parts}</div>
  }, [content, compact, reduceMathSpacing, cleanTextContent, cleanMathContent, parseMathFormulas])

  return (
    <div className={className}>
      {renderMixedContent}
    </div>
  )
}

export default MarkdownRenderer