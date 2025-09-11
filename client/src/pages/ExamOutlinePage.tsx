import React, { useState } from 'react'
import { 
  AcademicCapIcon, 
  ChartBarIcon, 
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useSubjectStore } from '../store/subjectStore'
import { useKnowledgeGraphStore } from '../store/knowledgeGraphStore'
import KnowledgeGraph from '../components/KnowledgeGraph'
import DocumentUpload from '../components/DocumentUpload'

interface ExamOutlineStats {
  totalPoints: number
  masteredPoints: number
  consolidatingPoints: number
  weakPoints: number
  untestedPoints: number
}

interface ExtractedKnowledgePoint {
  name: string
  isSelected: boolean
}

const ExamOutlinePage: React.FC = () => {
  const { currentSubject } = useSubjectStore()
  const { addKnowledgePoint } = useKnowledgeGraphStore()
  const [activeTab, setActiveTab] = useState<'graph' | 'outline'>('graph')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedPoints, setExtractedPoints] = useState<ExtractedKnowledgePoint[]>([])
  const [showExtractedPoints, setShowExtractedPoints] = useState(false)

  // 模拟考试大纲统计数据
  const getExamStats = (): ExamOutlineStats => {
    if (!currentSubject) {
      return {
        totalPoints: 0,
        masteredPoints: 0,
        consolidatingPoints: 0,
        weakPoints: 0,
        untestedPoints: 0
      }
    }

    // 根据不同学科返回不同的统计数据
    const mathStats = {
      totalPoints: 10,
      masteredPoints: 3,
      consolidatingPoints: 4,
      weakPoints: 2,
      untestedPoints: 1
    }

    const physicsStats = {
      totalPoints: 8,
      masteredPoints: 2,
      consolidatingPoints: 3,
      weakPoints: 2,
      untestedPoints: 1
    }

    return currentSubject.name === '数学' ? mathStats : physicsStats
  }

  const stats = getExamStats()
  const masteryPercentage = stats.totalPoints > 0 ? Math.round((stats.masteredPoints / stats.totalPoints) * 100) : 0

  // 考试大纲结构数据
  const getOutlineStructure = () => {
    if (!currentSubject) return []

    const mathOutline = [
      {
        chapter: '第一章 函数与导数',
        sections: [
          { name: '函数基础', status: 'mastered', progress: 95 },
          { name: '函数性质', status: 'consolidating', progress: 85 },
          { name: '函数图像', status: 'consolidating', progress: 75 },
          { name: '导数概念', status: 'weak', progress: 60 },
          { name: '导数应用', status: 'weak', progress: 45 }
        ]
      },
      {
        chapter: '第二章 三角函数',
        sections: [
          { name: '三角函数', status: 'mastered', progress: 88 },
          { name: '三角恒等式', status: 'consolidating', progress: 72 }
        ]
      },
      {
        chapter: '第三章 数列',
        sections: [
          { name: '数列基础', status: 'mastered', progress: 92 },
          { name: '数列求和', status: 'consolidating', progress: 68 }
        ]
      },
      {
        chapter: '第四章 积分',
        sections: [
          { name: '积分基础', status: 'untested', progress: 0 }
        ]
      }
    ]

    const physicsOutline = [
      {
        chapter: '第一章 力学',
        sections: [
          { name: '力学基础', status: 'mastered', progress: 90 },
          { name: '运动学', status: 'mastered', progress: 85 },
          { name: '动力学', status: 'consolidating', progress: 70 }
        ]
      },
      {
        chapter: '第二章 能量',
        sections: [
          { name: '能量守恒', status: 'weak', progress: 55 },
          { name: '功和功率', status: 'weak', progress: 40 }
        ]
      },
      {
        chapter: '第三章 电学',
        sections: [
          { name: '电场基础', status: 'untested', progress: 0 },
          { name: '电场强度', status: 'consolidating', progress: 75 },
          { name: '电势', status: 'consolidating', progress: 65 }
        ]
      }
    ]

    return currentSubject.name === '数学' ? mathOutline : physicsOutline
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered': return 'bg-green-500'
      case 'consolidating': return 'bg-orange-500'
      case 'weak': return 'bg-gray-800'
      case 'untested': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'mastered': return '已掌握'
      case 'consolidating': return '待巩固'
      case 'weak': return '需加强'
      case 'untested': return '未考核'
      default: return '未知'
    }
  }

  const handleFileUpload = (file: File) => {
    setIsProcessing(true)
    console.log('上传文件:', file.name)
  }

  const handleKnowledgePointsExtracted = (points: string[]) => {
    setIsProcessing(false)
    const extractedKnowledgePoints = points.map(point => ({
      name: point,
      isSelected: true
    }))
    setExtractedPoints(extractedKnowledgePoints)
    setShowExtractedPoints(true)
  }

  const togglePointSelection = (index: number) => {
    setExtractedPoints(prev => 
      prev.map((point, i) => 
        i === index ? { ...point, isSelected: !point.isSelected } : point
      )
    )
  }

  const addSelectedPoints = () => {
    const selectedPoints = extractedPoints.filter(point => point.isSelected)
    if (currentSubject) {
      selectedPoints.forEach(point => {
        addKnowledgePoint(currentSubject.name, {
          name: point.name,
          description: `从文档中提取的知识点：${point.name}`,
          difficulty: 'medium' as const,
          category: '文档提取',
          subject: currentSubject.name,
          masteryLevel: 0,
          examCount: 0,
          correctCount: 0,
          connections: [],
          x: Math.random() * 400 + 200,
          y: Math.random() * 300 + 150
        })
      })
    }
    setShowExtractedPoints(false)
    setExtractedPoints([])
  }

  const cancelSelection = () => {
    setShowExtractedPoints(false)
    setExtractedPoints([])
  }

  if (!currentSubject) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">选择学科查看考试大纲</h2>
        <p className="text-gray-500">请先在仪表板中选择一个学科，然后查看对应的考试大纲和知识图谱</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg text-white">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <span className="text-4xl mr-3">{currentSubject.icon}</span>
                {currentSubject.name} 考试大纲
              </h1>
              <p className="text-blue-100 mt-2">
                基于知识图谱的考试大纲分析，助你精准备考
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{masteryPercentage}%</div>
              <div className="text-blue-100">整体掌握度</div>
            </div>
          </div>
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-300 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{stats.masteredPoints}</div>
                  <div className="text-blue-100 text-sm">已掌握</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-orange-300 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{stats.consolidatingPoints}</div>
                  <div className="text-blue-100 text-sm">待巩固</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-300 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{stats.weakPoints}</div>
                  <div className="text-blue-100 text-sm">需加强</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-gray-300 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{stats.untestedPoints}</div>
                  <div className="text-blue-100 text-sm">未考核</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文档上传区域 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <DocumentUpload
          onUpload={handleFileUpload}
          onKnowledgePointsExtracted={handleKnowledgePointsExtracted}
          isProcessing={isProcessing}
          currentSubject={currentSubject}
        />
      </div>

      {/* 提取的知识点选择 */}
      {showExtractedPoints && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">提取的知识点</h3>
            <div className="flex space-x-3">
              <button
                onClick={cancelSelection}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={addSelectedPoints}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                添加选中的知识点
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            请选择要添加到知识图谱中的知识点：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {extractedPoints.map((point, index) => (
              <label
                key={index}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={point.isSelected}
                  onChange={() => togglePointSelection(index)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">{point.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 标签页切换 */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('graph')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'graph'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              知识图谱
            </button>
            <button
              onClick={() => setActiveTab('outline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'outline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              大纲结构
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'graph' ? (
            <div>
              <KnowledgeGraph />
            </div>
          ) : (
            <div className="space-y-6">
              {getOutlineStructure().map((chapter, chapterIndex) => (
                <div key={chapterIndex} className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{chapter.chapter}</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {chapter.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-4 h-4 rounded-full ${getStatusColor(section.status)}`}></div>
                            <div>
                              <h4 className="font-medium text-gray-900">{section.name}</h4>
                              <p className="text-sm text-gray-500">{getStatusText(section.status)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getStatusColor(section.status)}`}
                                style={{ width: `${section.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {section.progress}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExamOutlinePage