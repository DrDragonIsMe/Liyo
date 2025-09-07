import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'

const DashboardPage = () => {
  const { user } = useAuthStore()
  const [stats] = useState({
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

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              欢迎回来，{user?.name}！
            </h1>
            <p className="text-gray-600 mt-1">
              今天是学习的好日子，继续保持学习热情吧！
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <FireIcon className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-semibold text-orange-500">
              {stats.streak} 天连续学习
            </span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">试卷总数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPapers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">题目总数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">学习时长</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.studyTime}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">正确率</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.accuracy}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 学习路径 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">学习路径</h2>
            <p className="text-sm text-gray-600">基于北京高考大纲的个性化学习计划</p>
          </div>
          <div className="p-6 space-y-4">
            {learningPath.map((subject, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{subject.subject}</h3>
                  <span className="text-sm text-gray-500">{subject.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${subject.color}`}
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>下一个主题：</strong>{subject.nextTopic}</p>
                  <p><strong>薄弱点：</strong>{subject.weakPoints.join('、')}</p>
                </div>
              </div>
            ))}
            <Link
              to="/study"
              className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              开始学习
            </Link>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
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
                      {activity.title}
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