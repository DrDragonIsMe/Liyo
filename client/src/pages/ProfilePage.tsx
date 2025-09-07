import { useState } from 'react'
import {
  UserIcon,
  CogIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClockIcon,
  FireIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { toast } from 'react-hot-toast'

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    school: user?.school || '',
    grade: user?.grade || '',
    subjects: user?.subjects || [],
  })

  const subjects = ['数学', '物理', '化学', '语文', '英语', '生物', '历史', '地理', '政治']
  const grades = ['高一', '高二', '高三']

  // 模拟学习数据
  const studyStats = {
    totalStudyTime: 156, // 小时
    questionsAnswered: 1248,
    correctRate: 85,
    studyDays: 45,
    currentStreak: 7,
    totalPapers: 23,
    achievements: [
      { id: 1, name: '初学者', description: '完成第一次学习', icon: '🎯', earned: true },
      { id: 2, name: '勤奋学习者', description: '连续学习7天', icon: '🔥', earned: true },
      { id: 3, name: '题海战术', description: '答对100道题', icon: '💪', earned: true },
      { id: 4, name: '精准射手', description: '正确率达到90%', icon: '🎯', earned: false },
      { id: 5, name: '学习达人', description: '学习时长达到200小时', icon: '⭐', earned: false },
      { id: 6, name: '全能选手', description: '掌握所有科目', icon: '🏆', earned: false },
    ],
    weeklyProgress: [
      { day: '周一', hours: 2.5, questions: 15 },
      { day: '周二', hours: 3.2, questions: 22 },
      { day: '周三', hours: 1.8, questions: 12 },
      { day: '周四', hours: 4.1, questions: 28 },
      { day: '周五', hours: 2.9, questions: 18 },
      { day: '周六', hours: 5.2, questions: 35 },
      { day: '周日', hours: 3.8, questions: 25 },
    ],
    subjectProgress: [
      { subject: '数学', mastered: 75, weak: 15, total: 120 },
      { subject: '物理', mastered: 60, weak: 25, total: 95 },
      { subject: '化学', mastered: 80, weak: 10, total: 110 },
      { subject: '语文', mastered: 65, weak: 20, total: 85 },
      { subject: '英语', mastered: 85, weak: 8, total: 100 },
    ],
  }

  const handleSaveProfile = () => {
    updateUser(formData)
    setIsEditing(false)
    toast.success('个人信息已更新')
  }

  const handleSubjectToggle = (subject: string) => {
    const newSubjects = formData.subjects.includes(subject)
      ? formData.subjects.filter((s: string) => s !== subject)
      : [...formData.subjects, subject]
    setFormData({ ...formData, subjects: newSubjects })
  }

  const tabs = [
    { id: 'profile', name: '个人信息', icon: UserIcon },
    { id: 'stats', name: '学习统计', icon: ChartBarIcon },
    { id: 'achievements', name: '成就系统', icon: TrophyIcon },
    { id: 'settings', name: '设置', icon: CogIcon },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* 用户头像和基本信息 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-primary-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-1" />
                  {user?.school || '未设置学校'}
                </span>
                <span className="flex items-center">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  {user?.grade || '未设置年级'}
                </span>
                <span className="flex items-center">
                  <FireIcon className="h-4 w-4 mr-1" />
                  连续学习 {studyStats.currentStreak} 天
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">{studyStats.correctRate}%</div>
              <div className="text-sm text-gray-500">总体正确率</div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* 个人信息标签页 */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">个人信息</h2>
                <button
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {isEditing ? '保存' : '编辑'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    学校
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    disabled={!isEditing}
                    placeholder="请输入学校名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年级
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">请选择年级</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学习科目
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {subjects.map(subject => (
                    <label key={subject} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                        disabled={!isEditing}
                        className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 学习统计标签页 */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">学习统计</h2>
              
              {/* 总体统计 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-blue-600">总学习时长</p>
                      <p className="text-2xl font-bold text-blue-900">{studyStats.totalStudyTime}h</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-green-600">答题总数</p>
                      <p className="text-2xl font-bold text-green-900">{studyStats.questionsAnswered}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-purple-600">正确率</p>
                      <p className="text-2xl font-bold text-purple-900">{studyStats.correctRate}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm text-orange-600">学习天数</p>
                      <p className="text-2xl font-bold text-orange-900">{studyStats.studyDays}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 本周学习进度 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">本周学习进度</h3>
                <div className="grid grid-cols-7 gap-4">
                  {studyStats.weeklyProgress.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-sm text-gray-600 mb-2">{day.day}</div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-lg font-semibold text-primary-600">{day.hours}h</div>
                        <div className="text-xs text-gray-500">{day.questions}题</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 各科目掌握情况 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">各科目掌握情况</h3>
                <div className="space-y-4">
                  {studyStats.subjectProgress.map((subject, index) => (
                    <div key={index} className="bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{subject.subject}</span>
                        <span className="text-sm text-gray-500">总计 {subject.total} 个知识点</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="flex h-3 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500" 
                            style={{ width: `${(subject.mastered / subject.total) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-yellow-500" 
                            style={{ width: `${(subject.weak / subject.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>已掌握: {subject.mastered}</span>
                        <span>薄弱: {subject.weak}</span>
                        <span>未学习: {subject.total - subject.mastered - subject.weak}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 成就系统标签页 */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">成就系统</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studyStats.achievements.map((achievement) => (
                  <div key={achievement.id} className={`rounded-lg p-6 border-2 ${
                    achievement.earned 
                      ? 'border-yellow-300 bg-yellow-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="text-center">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <h3 className={`font-semibold mb-1 ${
                        achievement.earned ? 'text-yellow-800' : 'text-gray-600'
                      }`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-sm ${
                        achievement.earned ? 'text-yellow-700' : 'text-gray-500'
                      }`}>
                        {achievement.description}
                      </p>
                      {achievement.earned && (
                        <div className="mt-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <StarIcon className="h-3 w-3 mr-1" />
                            已获得
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 设置标签页 */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">设置</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">学习提醒</h3>
                    <p className="text-sm text-gray-500">每日学习提醒通知</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">错题推送</h3>
                    <p className="text-sm text-gray-500">自动推送相关错题练习</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">数据统计</h3>
                    <p className="text-sm text-gray-500">允许收集学习数据用于个性化推荐</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="pt-6">
                <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage