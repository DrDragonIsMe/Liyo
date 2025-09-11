import { useState, useRef } from 'react'
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import api from '../utils/api'
import { useSubjectStore } from '../store/subjectStore'
import { SUBJECTS } from '../store/subjectStore'

interface Paper {
  id: string
  name: string
  subject: string
  type: string
  uploadDate: string
  questionCount: number
  status: 'processing' | 'completed' | 'failed'
  fileSize: string
}

const PapersPage = () => {
  const { currentSubject, isSubjectSelected } = useSubjectStore()
  
  const [papers, setPapers] = useState<Paper[]>([
    {
      id: '1',
      name: '2024年高考数学模拟试卷（一）',
      subject: '数学',
      type: '高考模拟',
      uploadDate: '2024-01-15',
      questionCount: 22,
      status: 'completed',
      fileSize: '2.3 MB',
    },
    {
      id: '2',
      name: '物理电磁感应专题练习',
      subject: '物理',
      type: '专题练习',
      uploadDate: '2024-01-14',
      questionCount: 15,
      status: 'completed',
      fileSize: '1.8 MB',
    },
    {
      id: '3',
      name: '化学有机化学综合测试',
      subject: '化学',
      type: '单元测试',
      uploadDate: '2024-01-13',
      questionCount: 0,
      status: 'processing',
      fileSize: '3.1 MB',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadSubject, setUploadSubject] = useState('')
  const [uploadType, setUploadType] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const subjects = SUBJECTS.map(s => s.name)
  const paperTypes = ['高考模拟', '专题练习', '单元测试', '期中考试', '期末考试']

  // 根据学科选择过滤试卷
  const subjectFilteredPapers = isSubjectSelected && currentSubject
    ? papers.filter(paper => paper.subject === currentSubject.name)
    : papers

  const filteredPapers = subjectFilteredPapers.filter(paper => {
    const matchesSearch = paper.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === 'all' || paper.subject === selectedSubject
    const matchesType = selectedType === 'all' || paper.type === selectedType
    return matchesSearch && matchesSubject && matchesType
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const validFiles: File[] = []
    
    for (const file of Array.from(files)) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        toast.error(`不支持的文件类型: ${file.name}`)
        continue
      }

      if (file.size > 300 * 1024 * 1024) {
        toast.error(`文件过大: ${file.name} (最大支持300MB)`)
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      setUploadFiles(validFiles)
      // 如果已选择学科，自动设置上传科目
      setUploadSubject(isSubjectSelected && currentSubject ? currentSubject.name : '')
      setUploadType('')
      setShowUploadModal(true)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirmUpload = async () => {
    const finalSubject = isSubjectSelected && currentSubject ? currentSubject.name : uploadSubject
    
    if (!finalSubject || !uploadType) {
      toast.error('请选择科目和类型')
      return
    }

    setIsUploading(true)
    setShowUploadModal(false)
    
    try {
      for (const file of uploadFiles) {
        const newPaper: Paper = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ''),
          subject: finalSubject,
          type: uploadType,
          uploadDate: new Date().toISOString().split('T')[0],
          questionCount: 0,
          status: 'processing',
          fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        }

        setPapers(prev => [newPaper, ...prev])
        toast.success(`开始处理: ${file.name}`)

        setTimeout(() => {
          setPapers(prev => prev.map(p => 
            p.id === newPaper.id 
              ? { ...p, status: 'completed', questionCount: Math.floor(Math.random() * 20) + 10 }
              : p
          ))
          toast.success(`处理完成: ${file.name}`)
        }, 3000 + Math.random() * 2000)
      }
    } catch (error) {
      toast.error('上传失败，请重试')
    } finally {
      setIsUploading(false)
      setUploadFiles([])
    }
  }

  const handleDeletePaper = (paperId: string) => {
    if (window.confirm('确定要删除这份试卷吗？')) {
      setPapers(prev => prev.filter(p => p.id !== paperId))
      toast.success('试卷已删除')
    }
  }

  const handlePreviewPaper = async (paperId: string, paperName: string) => {
    try {
      const blob = await api.previewPaper(paperId)
      const url = URL.createObjectURL(blob)
      
      const newWindow = window.open(url, '_blank')
      if (!newWindow) {
        toast.error('请允许弹出窗口以预览文件')
        return
      }
      
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
      
      toast.success('正在预览试卷')
    } catch (error) {
      console.error('预览失败:', error)
      toast.error('预览失败，请重试')
    }
  }

  const handleDownloadPaper = async (paperId: string, paperName: string) => {
    try {
      const blob = await api.downloadPaper(paperId)
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${paperName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      toast.success('下载完成')
    } catch (error) {
      console.error('下载失败:', error)
      toast.error('下载失败，请重试')
    }
  }

  const getStatusBadge = (status: Paper['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            已完成
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            处理中
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            处理失败
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSubjectSelected && currentSubject ? `${currentSubject.name}试卷管理` : '试卷管理'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isSubjectSelected && currentSubject 
              ? `上传${currentSubject.name}试卷，自动OCR解析生成题库` 
              : '上传试卷，自动OCR解析生成题库'
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
            {isUploading ? '上传中...' : '上传试卷'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索试卷名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          
          {!isSubjectSelected && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">所有科目</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          )}
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">所有类型</option>
            {paperTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <div className="flex items-center text-sm text-gray-500">
            <FunnelIcon className="h-5 w-5 mr-1" />
            共 {filteredPapers.length} 份试卷
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredPapers.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无试卷</h3>
            <p className="mt-1 text-sm text-gray-500">
              {papers.length === 0 ? '开始上传您的第一份试卷吧！' : '没有找到匹配的试卷'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    试卷名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    科目
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上传日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    题目数量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    文件大小
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">
                          {paper.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paper.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paper.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paper.uploadDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paper.status === 'completed' ? paper.questionCount : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(paper.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paper.fileSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreviewPaper(paper.id, paper.name)}
                          className="text-blue-600 hover:text-blue-900"
                          title="预览试卷"
                          disabled={paper.status !== 'completed'}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPaper(paper.id, paper.name)}
                          className="text-green-600 hover:text-green-900"
                          title="下载试卷"
                          disabled={paper.status !== 'completed'}
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePaper(paper.id)}
                          className="text-red-600 hover:text-red-900"
                          title="删除"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">上传说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 支持的文件格式：PDF、JPG、PNG</li>
          <li>• 单个文件最大支持 300MB</li>
          <li>• 支持批量上传多个文件</li>
          <li>• 系统将自动进行OCR识别，提取试卷中的题目</li>
          <li>• 处理完成后，题目将自动加入题库</li>
        </ul>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isSubjectSelected && currentSubject ? `上传${currentSubject.name}试卷` : '上传试卷'}
              </h3>
              
              <div className="space-y-4">
                {isSubjectSelected && currentSubject ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      科目
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                      {currentSubject.name}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择科目 *
                    </label>
                    <select
                      value={uploadSubject}
                      onChange={(e) => setUploadSubject(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">请选择科目</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择类型 *
                  </label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">请选择类型</option>
                    {paperTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    待上传文件
                  </label>
                  <div className="bg-gray-50 rounded-md p-3">
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={!uploadSubject || !uploadType}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认上传
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PapersPage