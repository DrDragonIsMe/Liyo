import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
  BookOpenIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { useSubjectStore, SUBJECTS } from '../store/subjectStore'

const DashboardPage = () => {
  const { user } = useAuthStore()
  const { currentSubject, isSubjectSelected, setCurrentSubject } = useSubjectStore()
  
  // 总体学习统计
  const [overallStats] = useState({
    totalStudyTime: 156,
    totalPapers: 45,
    totalQuestions: 1280,
    averageAccuracy: 87,
    streak: 12,
    completedSubjects: 6,
  })
  
  // 学科特定统计
  const [subjectStats] = useState({
    totalPapers: 12,
    totalQuestions: 156,
    studyTime: 24,
    completedTests: 8,
    accuracy: 85,
    streak: 7,
  })

  const recentActivities = [
    {
      id: 1,
      type: 'upload',
      title: '上传了数学试卷',
      description: '2024年高考模拟试卷（一）',
      time: '2小时前',
      icon: DocumentTextIcon,
    },
    {
      id: 2,
      type: 'study',
      title: '完成了物理练习',
      description: '电磁感应专题练习',
      time: '4小时前',
      icon: AcademicCapIcon,
    },
    {
      id: 3,
      type: 'achievement',
      title: '获得成就',
      description: '连续学习7天',
      time: '1天前',
      icon: TrophyIcon,
    },
  ]

  const learningPath = [
    {
      subject: '数学',
      progress: 75,
      nextTopic: '导数应用',
      weakPoints: ['三角函数', '立体几何'],
      color: 'bg-blue-500',
    },
    {
      subject: '物理',
      progress: 60,
      nextTopic: '电磁感应',
      weakPoints: ['力学综合', '光学'],
      color: 'bg-green-500',
    },
    {
      subject: '化学',
      progress: 80,
      nextTopic: '有机化学',
      weakPoints: ['化学平衡'],
      color: 'bg-purple-500',
    },
  ]

  // 根据是否选择学科显示不同内容
  if (!isSubjectSelected) {
    // 首页总览
    return (
      <div className="space-y-8">
        {/* 欢迎横幅 */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative px-8 py-12">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  在线学习中
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                欢迎回来，<span className="text-yellow-300">{user?.name}</span>！
              </h1>
              <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
                今天也要加油学习哦～选择一个学科开始你的智能学习之旅
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                  <div className="p-2 bg-orange-500/80 rounded-lg">
                    <FireIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/80 text-sm">学习连击</p>
                    <p className="text-2xl font-bold text-white">{overallStats.streak} 天</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                  <div className="p-2 bg-green-500/80 rounded-lg">
                    <BookOpenIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/80 text-sm">完成学科</p>
                    <p className="text-2xl font-bold text-white">{overallStats.completedSubjects} 个</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 总体学习统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-100 hover:border-blue-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总学习时长</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{overallStats.totalStudyTime}h</p>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-100 hover:border-green-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总试卷数</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">{overallStats.totalPapers}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 hover:border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总题目数</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">{overallStats.totalQuestions}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-orange-100 hover:border-orange-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">平均正确率</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{overallStats.averageAccuracy}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 学科学习进度 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">各学科学习进度</h2>
                <p className="text-gray-500">点击学科卡片进入专项学习，开启智能学习之旅</p>
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                <span>实时同步</span>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SUBJECTS.map((subject) => {
                const progress = Math.floor(Math.random() * 100) // 模拟进度数据
                const getColorClasses = (color: string) => {
                  const colorMap = {
                    blue: 'from-blue-400 via-blue-500 to-blue-600 hover:from-blue-500 hover:to-blue-700',
                    purple: 'from-purple-400 via-purple-500 to-purple-600 hover:from-purple-500 hover:to-purple-700',
                    green: 'from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:to-green-700',
                    amber: 'from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700',
                    red: 'from-red-400 via-red-500 to-red-600 hover:from-red-500 hover:to-red-700',
                    teal: 'from-teal-400 via-teal-500 to-teal-600 hover:from-teal-500 hover:to-teal-700',
                    emerald: 'from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700',
                    rose: 'from-rose-400 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-700',
                    indigo: 'from-indigo-400 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-700',
                  }
                  return colorMap[color as keyof typeof colorMap] || colorMap.blue
                }
                
                return (
                  <div
                    key={subject.id}
                    className={`group relative overflow-hidden bg-gradient-to-br ${getColorClasses(subject.color)} rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 transform`}
                    onClick={() => {
                       // 触发学科选择
                       setCurrentSubject(subject)
                     }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl group-hover:scale-110 transition-transform duration-300">{subject.icon}</div>
                          <div>
                            <h3 className="font-bold text-lg">{subject.name}</h3>
                            <p className="text-white/80 text-sm">智能学习</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{progress}%</div>
                          <div className="text-white/80 text-xs">完成度</div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/90 text-sm">学习进度</span>
                          <span className="text-white/90 text-sm">{progress}/100</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-white rounded-full h-3 transition-all duration-500 shadow-sm"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      <p className="text-white/90 text-sm leading-relaxed mb-4">{subject.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-white/80 text-xs">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span>AI 助手就绪</span>
                        </div>
                        <div className="text-white/80 text-xs group-hover:text-white transition-colors">
                          点击进入 →
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 学科特定仪表板
  return (
    <div className="space-y-8">
      {/* 学科欢迎横幅 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative px-8 py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4">
                <span className="text-2xl mr-2">{currentSubject?.icon}</span>
                专项学习模式
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                {currentSubject?.name} <span className="text-yellow-300">学习中心</span>
              </h1>
              <p className="text-blue-100 text-xl leading-relaxed max-w-2xl">
                专注于{currentSubject?.name}学科的深度学习，AI助手为你量身定制学习计划
              </p>
            </div>
            <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <div className="p-3 bg-orange-500/80 rounded-lg">
                <FireIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white/80 text-sm">学习连击</p>
                <p className="text-3xl font-bold text-white">{subjectStats.streak} 天</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 学科统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-100 hover:border-blue-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">试卷总数</p>
              <p className="text-3xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{subjectStats.totalPapers}</p>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-100 hover:border-green-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">题目总数</p>
              <p className="text-3xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">{subjectStats.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 hover:border-purple-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">学习时长</p>
              <p className="text-3xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">{subjectStats.studyTime}h</p>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-orange-100 hover:border-orange-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">正确率</p>
              <p className="text-3xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{subjectStats.accuracy}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 学科学习路径 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{currentSubject?.name} 学习路径</h2>
            <p className="text-sm text-gray-600">专为{currentSubject?.name}学科设计的学习计划</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{currentSubject?.name} 基础概念</h3>
                    <p className="text-sm text-gray-600">掌握{currentSubject?.name}的基本概念和原理</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">75%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{currentSubject?.name} 专项练习</h3>
                    <p className="text-sm text-gray-600">通过{currentSubject?.name}专项练习巩固知识</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">30%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{currentSubject?.name} 综合测试</h3>
                    <p className="text-sm text-gray-600">检验{currentSubject?.name}学习成果</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">0%</span>
                </div>
              </div>
            </div>
            <button
              className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 mt-4 rounded-lg"
              onClick={() => {
                // 这里可以跳转到学科特定的学习页面
                console.log(`开始学习${currentSubject?.name}`)
              }}
            >
              开始{currentSubject?.name}学习
            </button>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{currentSubject?.name} 最近活动</h2>
            <p className="text-sm text-gray-600">查看你在{currentSubject?.name}学科的学习记录</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <activity.icon className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      [{currentSubject?.name}] {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/papers"
              className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mt-4"
            >
              查看更多
            </Link>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/papers"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">上传试卷</h3>
              <p className="text-sm text-gray-500">添加新的试卷到题库</p>
            </div>
          </Link>
          
          <Link
            to="/study"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AcademicCapIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">开始学习</h3>
              <p className="text-sm text-gray-500">智能伴读学习</p>
            </div>
          </Link>
          
          <Link
            to="/profile"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">学习报告</h3>
              <p className="text-sm text-gray-500">查看学习进度</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage