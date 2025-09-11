import { useState, useEffect } from 'react'
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface UserSupplement {
  _id: string
  type: 'knowledge_point' | 'answer_supplement'
  selectedText: string
  supplementContent: string
  knowledgePointName?: string
  textPosition: {
    startIndex: number
    endIndex: number
    context: string
  }
  rating: number
  ratingCount: number
  createdAt: string
  updatedAt: string
  createdBy: {
    _id: string
    username: string
  }
}

interface UserSupplementsProps {
  questionId: string
  supplements: UserSupplement[]
  onSupplementUpdated?: (supplement: UserSupplement) => void
  onSupplementDeleted?: (supplementId: string) => void
}

const UserSupplements = ({ 
  questionId, 
  supplements, 
  onSupplementUpdated, 
  onSupplementDeleted 
}: UserSupplementsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editKnowledgePointName, setEditKnowledgePointName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRatings, setUserRatings] = useState<{ [key: string]: number }>({})

  // 获取当前用户信息
  const getCurrentUser = () => {
    const authStorage = localStorage.getItem('auth-storage')
    return authStorage ? JSON.parse(authStorage).state?.user : null
  }

  const currentUser = getCurrentUser()

  // 开始编辑
  const startEdit = (supplement: UserSupplement) => {
    setEditingId(supplement._id)
    setEditContent(supplement.supplementContent)
    setEditKnowledgePointName(supplement.knowledgePointName || '')
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
    setEditKnowledgePointName('')
  }

  // 保存编辑
  const saveEdit = async (supplementId: string, type: string) => {
    if (!editContent.trim()) {
      toast.error('请填写补充内容')
      return
    }

    if (type === 'knowledge_point' && !editKnowledgePointName.trim()) {
      toast.error('请填写知识点名称')
      return
    }

    setIsSubmitting(true)
    try {
      const authStorage = localStorage.getItem('auth-storage')
      const token = authStorage ? JSON.parse(authStorage).state?.token : null
      
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const requestBody: any = {
        supplementContent: editContent.trim()
      }

      if (type === 'knowledge_point') {
        requestBody.knowledgePointName = editKnowledgePointName.trim()
      }

      const response = await fetch(`/api/user-supplements/${supplementId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('修改成功！')
        onSupplementUpdated?.(data.data)
        cancelEdit()
      } else {
        toast.error(data.message || '修改失败')
      }
    } catch (error) {
      console.error('修改补充内容失败:', error)
      toast.error('网络错误，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 删除补充内容
  const deleteSupplement = async (supplementId: string) => {
    if (!confirm('确定要删除这个补充内容吗？')) {
      return
    }

    try {
      const authStorage = localStorage.getItem('auth-storage')
      const token = authStorage ? JSON.parse(authStorage).state?.token : null
      
      const headers: { [key: string]: string } = {}
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/user-supplements/${supplementId}`, {
        method: 'DELETE',
        headers
      })

      const data = await response.json()

      if (data.success) {
        toast.success('删除成功！')
        onSupplementDeleted?.(supplementId)
      } else {
        toast.error(data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除补充内容失败:', error)
      toast.error('网络错误，请重试')
    }
  }

  // 评价补充内容
  const rateSupplement = async (supplementId: string, rating: number) => {
    try {
      const authStorage = localStorage.getItem('auth-storage')
      const token = authStorage ? JSON.parse(authStorage).state?.token : null
      
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/user-supplements/${supplementId}/rate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rating })
      })

      const data = await response.json()

      if (data.success) {
        setUserRatings(prev => ({ ...prev, [supplementId]: rating }))
        onSupplementUpdated?.(data.data)
        toast.success('评价成功！')
      } else {
        toast.error(data.message || '评价失败')
      }
    } catch (error) {
      console.error('评价补充内容失败:', error)
      toast.error('网络错误，请重试')
    }
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
      }
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  if (supplements.length === 0) {
    return null
  }

  // 按类型分组
  const knowledgePoints = supplements.filter(s => s.type === 'knowledge_point')
  const answerSupplements = supplements.filter(s => s.type === 'answer_supplement')

  return (
    <div className="mt-6 space-y-6">
      {/* 知识点补充 */}
      {knowledgePoints.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <BookOpenIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-blue-900">相关知识点</h3>
          </div>
          <div className="space-y-3">
            {knowledgePoints.map((supplement) => (
              <div key={supplement._id} className="bg-white rounded-md p-4 border border-blue-200">
                {editingId === supplement._id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        知识点名称
                      </label>
                      <input
                        type="text"
                        value={editKnowledgePointName}
                        onChange={(e) => setEditKnowledgePointName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        知识点说明
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        maxLength={5000}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => saveEdit(supplement._id, supplement.type)}
                        disabled={isSubmitting}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center text-sm"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-blue-900">{supplement.knowledgePointName}</h4>
                      <div className="flex items-center space-x-2">
                        {currentUser && currentUser._id === supplement.createdBy._id && (
                          <>
                            <button
                              onClick={() => startEdit(supplement)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="编辑"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteSupplement(supplement._id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="删除"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      选中文字: "{supplement.selectedText}"
                    </div>
                    <div className="text-gray-800 mb-3">
                      {supplement.supplementContent}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>by {supplement.createdBy.username}</span>
                        <span>{formatTime(supplement.createdAt)}</span>
                        {supplement.ratingCount > 0 && (
                          <span>评分: {(supplement.rating / supplement.ratingCount).toFixed(1)} ({supplement.ratingCount})</span>
                        )}
                      </div>
                      {currentUser && currentUser._id !== supplement.createdBy._id && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => rateSupplement(supplement._id, 1)}
                            className={`p-1 rounded transition-colors ${
                              userRatings[supplement._id] === 1
                                ? 'text-green-600 bg-green-100'
                                : 'text-gray-400 hover:text-green-600'
                            }`}
                            title="有用"
                          >
                            <HandThumbUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => rateSupplement(supplement._id, -1)}
                            className={`p-1 rounded transition-colors ${
                              userRatings[supplement._id] === -1
                                ? 'text-red-600 bg-red-100'
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                            title="无用"
                          >
                            <HandThumbDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 答案补充 */}
      {answerSupplements.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-900">补充答案</h3>
          </div>
          <div className="space-y-3">
            {answerSupplements.map((supplement) => (
              <div key={supplement._id} className="bg-white rounded-md p-4 border border-green-200">
                {editingId === supplement._id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        补充内容
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        maxLength={5000}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => saveEdit(supplement._id, supplement.type)}
                        disabled={isSubmitting}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center text-sm"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center text-sm"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-gray-600">
                        针对: "{supplement.selectedText}"
                      </div>
                      <div className="flex items-center space-x-2">
                        {currentUser && currentUser._id === supplement.createdBy._id && (
                          <>
                            <button
                              onClick={() => startEdit(supplement)}
                              className="text-gray-400 hover:text-green-600 transition-colors"
                              title="编辑"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteSupplement(supplement._id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="删除"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-800 mb-3">
                      {supplement.supplementContent}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>by {supplement.createdBy.username}</span>
                        <span>{formatTime(supplement.createdAt)}</span>
                        {supplement.ratingCount > 0 && (
                          <span>评分: {(supplement.rating / supplement.ratingCount).toFixed(1)} ({supplement.ratingCount})</span>
                        )}
                      </div>
                      {currentUser && currentUser._id !== supplement.createdBy._id && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => rateSupplement(supplement._id, 1)}
                            className={`p-1 rounded transition-colors ${
                              userRatings[supplement._id] === 1
                                ? 'text-green-600 bg-green-100'
                                : 'text-gray-400 hover:text-green-600'
                            }`}
                            title="有用"
                          >
                            <HandThumbUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => rateSupplement(supplement._id, -1)}
                            className={`p-1 rounded transition-colors ${
                              userRatings[supplement._id] === -1
                                ? 'text-red-600 bg-red-100'
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                            title="无用"
                          >
                            <HandThumbDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserSupplements