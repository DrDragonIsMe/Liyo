import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowPathIcon,
  PencilIcon,
  CheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import api from '../utils/api'
import { toast } from 'react-hot-toast'
import MathRenderer from './MathRenderer'

interface KnowledgePointDetailProps {
  knowledgePoint: string
  subject: string
  onClose: () => void
  onAddToChat: (message: string) => void
}

interface ExamQuestion {
  year: number
  subject: string
  questionType: string
  content: string
  difficulty: string
}

interface KnowledgePointInfo {
  definition: string
  source: 'textbook' | 'ai' | 'web_baike.baidu.com' | 'web_zhihu.com' | 'ai_enhanced' | 'fallback' | 'user_edited'
  relatedConcepts: string[]
  examQuestions: ExamQuestion[]
  examProbability: number
  yearlyStats: { year: number; count: number }[]
  lastUpdated?: string
  isUserEdited?: boolean
  needsUpdate?: boolean
  freshnessScore?: number
  editHistory?: Array<{
    editedAt: string
    previousDefinition: string
    editReason: string
  }>
}

const KnowledgePointDetail: React.FC<KnowledgePointDetailProps> = ({
  knowledgePoint,
  subject,
  onClose,
  onAddToChat,
}) => {
  const [loading, setLoading] = useState(true)
  const [knowledgeInfo, setKnowledgeInfo] = useState<KnowledgePointInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDefinition, setEditedDefinition] = useState('')
  const [editedConcepts, setEditedConcepts] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [originalData, setOriginalData] = useState<KnowledgePointInfo | null>(null)

  useEffect(() => {
    fetchKnowledgePointInfo()
  }, [knowledgePoint, subject])

  const fetchKnowledgePointInfo = async (forceUpdate = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const url = `/knowledge-points/${encodeURIComponent(knowledgePoint)}?subject=${encodeURIComponent(subject)}${forceUpdate ? '&forceUpdate=true' : ''}`
      const response = await api.get(url)
      
      setKnowledgeInfo(response.data.data)
      setEditedDefinition(response.data.data.definition)
      setEditedConcepts(response.data.data.relatedConcepts || [])
    } catch (err: any) {
      console.error('获取知识点信息失败:', err)
      setError(err.response?.data?.error || '获取知识点信息失败')
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpdate = async () => {
    try {
      setIsUpdating(true)
      setOriginalData(knowledgeInfo) // 保存原始数据用于对比
      
      const response = await api.put(`/knowledge-points/${encodeURIComponent(knowledgePoint)}/update?subject=${encodeURIComponent(subject)}`)
      
      if (response.data.success) {
        setKnowledgeInfo(response.data.data)
        setEditedDefinition(response.data.data.definition)
        setEditedConcepts(response.data.data.relatedConcepts || [])
        setShowComparison(true) // 显示对比界面
        toast.success('知识点已更新')
      }
    } catch (err: any) {
      console.error('更新知识点失败:', err)
      toast.error(err.response?.data?.error || '更新知识点失败')
    } finally {
      setIsUpdating(false)
    }
  }
  
  const handleEdit = async () => {
    try {
      const response = await api.put(`/knowledge-points/${encodeURIComponent(knowledgePoint)}/edit`, {
        definition: editedDefinition,
        relatedConcepts: editedConcepts,
        subject: subject,
        editReason: '用户编辑'
      })
      
      if (response.data.success) {
        setKnowledgeInfo(response.data.data)
        setIsEditing(false)
        toast.success('知识点已保存')
      }
    } catch (err: any) {
      console.error('编辑知识点失败:', err)
      toast.error(err.response?.data?.error || '编辑知识点失败')
    }
  }
  
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedDefinition(knowledgeInfo?.definition || '')
    setEditedConcepts(knowledgeInfo?.relatedConcepts || [])
  }
  
  const addConcept = () => {
    setEditedConcepts([...editedConcepts, ''])
  }
  
  const updateConcept = (index: number, value: string) => {
    const newConcepts = [...editedConcepts]
    newConcepts[index] = value
    setEditedConcepts(newConcepts)
  }
  
  const removeConcept = (index: number) => {
    setEditedConcepts(editedConcepts.filter((_, i) => i !== index))
  }

  const handleAddToChat = () => {
    if (knowledgeInfo) {
      const message = `请详细解释"${knowledgePoint}"这个知识点，包括其定义、应用场景和解题技巧。`
      onAddToChat(message)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '简单': return 'text-green-600 bg-green-100'
      case '中等': return 'text-yellow-600 bg-yellow-100'
      case '困难': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">正在获取知识点信息...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">知识点详情</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchKnowledgePointInfo()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BookOpenIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">{knowledgePoint}</h2>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {subject}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {knowledgeInfo && (
              <>
                <button
                   onClick={(e) => {
                     e.preventDefault()
                     handleUpdate()
                   }}
                   disabled={isUpdating}
                   className="p-2 hover:bg-blue-50 rounded-full transition-colors text-blue-600 disabled:opacity-50"
                   title="更新知识点"
                 >
                   <ArrowPathIcon className={`h-5 w-5 ${isUpdating ? 'animate-spin' : ''}`} />
                 </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-green-50 rounded-full transition-colors text-green-600"
                  title="编辑知识点"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {showComparison && originalData && knowledgeInfo ? (
          <div className="space-y-6">
            {/* 对比模式 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-800">内容对比</h3>
                <button
                  onClick={() => setShowComparison(false)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-yellow-700 text-sm mb-4">
                以下是更新前后的内容对比，您可以参考新内容进行编辑。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 原始内容 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  更新前内容
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-red-700 mb-1">定义:</p>
                    <p className="text-sm text-red-800 bg-red-100 p-2 rounded">
                      {originalData.definition}
                    </p>
                  </div>
                  {originalData.relatedConcepts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-700 mb-1">相关概念:</p>
                      <div className="flex flex-wrap gap-1">
                        {originalData.relatedConcepts.map((concept, index) => (
                          <span key={index} className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 新内容 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  更新后内容
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">定义:</p>
                    <p className="text-sm text-green-800 bg-green-100 p-2 rounded">
                      {knowledgeInfo.definition}
                    </p>
                  </div>
                  {knowledgeInfo.relatedConcepts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">相关概念:</p>
                      <div className="flex flex-wrap gap-1">
                        {knowledgeInfo.relatedConcepts.map((concept, index) => (
                          <span key={index} className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setIsEditing(true)
                  setShowComparison(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                编辑内容
              </button>
              <button
                onClick={() => setShowComparison(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                使用新内容
              </button>
            </div>
          </div>
        ) : knowledgeInfo && (
          <div className="space-y-6">
            {/* 定义部分 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-blue-900">官方定义</h3>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    knowledgeInfo.source === 'textbook' 
                      ? 'bg-green-100 text-green-800' 
                      : knowledgeInfo.source === 'user_edited'
                      ? 'bg-purple-100 text-purple-800'
                      : knowledgeInfo.source?.startsWith('web_')
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {knowledgeInfo.source === 'textbook' ? '教材来源' : 
                     knowledgeInfo.source === 'user_edited' ? '用户编辑' :
                     knowledgeInfo.source?.startsWith('web_') ? '网络来源' : 'AI生成'}
                  </span>
                  {knowledgeInfo.isUserEdited && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      已编辑
                    </span>
                  )}
                </div>
                {isEditing && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleEdit}
                      className="p-1 hover:bg-green-100 rounded text-green-600"
                      title="保存"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="取消"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={editedDefinition}
                  onChange={(e) => setEditedDefinition(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="输入知识点定义..."
                />
              ) : (
                <p className="text-blue-800 leading-relaxed">{knowledgeInfo.definition}</p>
              )}
              {knowledgeInfo.lastUpdated && (
                <div className="mt-2 text-xs text-gray-500">
                  最后更新: {new Date(knowledgeInfo.lastUpdated).toLocaleString()}
                </div>
              )}
              
              {knowledgeInfo.relatedConcepts.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">相关概念：</h4>
                  {isEditing ? (
                    <div className="space-y-2">
                      {editedConcepts.map((concept, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={concept}
                            onChange={(e) => updateConcept(index, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                            placeholder="相关概念"
                          />
                          <button
                            onClick={() => removeConcept(index)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                          >
                            <XCircleIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addConcept}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        + 添加相关概念
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {knowledgeInfo.relatedConcepts.map((concept, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 考试统计 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-green-900">考试概率</h3>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {knowledgeInfo.examProbability}%
                </div>
                <p className="text-sm text-green-700">近5年高考出现频率</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-purple-900">题目总数</h3>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {knowledgeInfo.examQuestions.length}
                </div>
                <p className="text-sm text-purple-700">相关真题数量</p>
              </div>
            </div>

            {/* 年度统计图表 */}
            {knowledgeInfo.yearlyStats.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">年度考察趋势</h3>
                <div className="flex items-end space-x-2 h-32">
                  {knowledgeInfo.yearlyStats.map((stat, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="bg-primary-500 rounded-t w-full transition-all duration-300"
                        style={{ height: `${(stat.count / Math.max(...knowledgeInfo.yearlyStats.map(s => s.count))) * 100}%` }}
                      ></div>
                      <div className="text-xs text-gray-600 mt-1">{stat.year}</div>
                      <div className="text-xs font-medium text-gray-900">{stat.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 相关真题 */}
            {knowledgeInfo.examQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">相关真题</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {knowledgeInfo.examQuestions.slice(0, 10).map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {question.year}年 {question.subject}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {question.questionType}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-2">
                        <MathRenderer content={question.content} />
                      </div>
                    </div>
                  ))}
                  {knowledgeInfo.examQuestions.length > 10 && (
                    <p className="text-sm text-gray-500 text-center">
                      还有 {knowledgeInfo.examQuestions.length - 10} 道相关题目...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleAddToChat}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
              >
                向AI提问
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgePointDetail