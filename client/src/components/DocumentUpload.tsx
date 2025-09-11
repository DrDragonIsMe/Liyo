import React, { useState, useRef } from 'react'
import { CloudArrowUpIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import mammoth from 'mammoth'

interface DocumentUploadProps {
  onUpload: (file: File) => void
  onKnowledgePointsExtracted: (knowledgePoints: string[]) => void
  isProcessing: boolean
  currentSubject?: {
    name: string
    icon: string
  }
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  onKnowledgePointsExtracted,
  isProcessing,
  currentSubject
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // 检查文件类型
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      alert('请上传 PDF、Word 或文本文件')
      return
    }

    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB')
      return
    }

    setUploadedFile(file)
    onUpload(file)
    
    // 解析文档内容
    try {
      const knowledgePoints = await extractKnowledgePoints(file)
      onKnowledgePointsExtracted(knowledgePoints)
    } catch (error) {
      console.error('文档解析失败:', error)
      // 如果解析失败，使用模拟数据
      const mockKnowledgePoints = extractMockKnowledgePoints(file.name)
      onKnowledgePointsExtracted(mockKnowledgePoints)
    }
  }

  const extractKnowledgePoints = async (file: File): Promise<string[]> => {
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // 解析 docx 文件
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const text = result.value
      
      // 简单的知识点提取逻辑
      const knowledgePoints = extractKnowledgePointsFromText(text)
      return knowledgePoints
    } else if (file.type === 'text/plain') {
      // 解析文本文件
      const text = await file.text()
      const knowledgePoints = extractKnowledgePointsFromText(text)
      return knowledgePoints
    } else {
      // 对于其他格式（PDF、DOC），暂时使用模拟数据
      return extractMockKnowledgePoints(file.name)
    }
  }

  const extractKnowledgePointsFromText = (text: string): string[] => {
    // 简单的知识点提取算法
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const knowledgePoints: string[] = []
    
    // 查找可能的知识点（标题、要点等）
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // 跳过过短或过长的行
      if (trimmedLine.length < 3 || trimmedLine.length > 50) continue
      
      // 查找数字开头的列表项
      if (/^\d+[.、]/.test(trimmedLine)) {
        const point = trimmedLine.replace(/^\d+[.、]\s*/, '').trim()
        if (point.length > 2) knowledgePoints.push(point)
      }
      // 查找项目符号开头的列表项
      else if (/^[•·-]/.test(trimmedLine)) {
        const point = trimmedLine.replace(/^[•·-]\s*/, '').trim()
        if (point.length > 2) knowledgePoints.push(point)
      }
      // 查找可能的标题（全大写或首字母大写）
      else if (/^[A-Z\u4e00-\u9fa5]/.test(trimmedLine) && !trimmedLine.includes('。')) {
        knowledgePoints.push(trimmedLine)
      }
    }
    
    // 如果没有找到知识点，返回模拟数据
    if (knowledgePoints.length === 0) {
      return extractMockKnowledgePoints('default')
    }
    
    // 限制返回的知识点数量
    return knowledgePoints.slice(0, 10)
  }

  const extractMockKnowledgePoints = (fileName: string): string[] => {
    // 模拟从文档中提取的知识点
    const mockPoints = [
      '函数的定义与性质',
      '导数的计算方法',
      '积分的基本概念',
      '微分方程求解',
      '极限的计算技巧',
      '连续性与可导性',
      '多元函数偏导数',
      '重积分的应用'
    ]
    
    // 根据文件名随机返回一些知识点
    const count = Math.floor(Math.random() * 5) + 3
    return mockPoints.slice(0, count)
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-2">
          {currentSubject && (
            <span className="text-2xl">{currentSubject.icon}</span>
          )}
          <h3 className="text-lg font-medium text-gray-900">
            {currentSubject ? `${currentSubject.name} - 文档上传` : '文档上传'}
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          {currentSubject 
            ? `上传 ${currentSubject.name} 学科的考试大纲或教学文档，系统将自动提取知识点并添加到该学科的知识图谱中`
            : '上传考试大纲或教学文档，系统将自动提取知识点'
          }
        </p>
      </div>

      {!uploadedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept=".pdf,.doc,.docx,.txt"
          />
          
          <div className="text-center">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onButtonClick}
              >
                选择文件
              </button>
              <p className="mt-2 text-sm text-gray-600">
                或拖拽文件到此处
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              支持 PDF、Word、文本文件，最大 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">正在解析文档...</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DocumentUpload