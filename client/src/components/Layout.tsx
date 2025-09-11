import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSubjectStore } from '../store/subjectStore'
import SubjectNavigation from './SubjectNavigation'
import {
  HomeIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  MapIcon,
  ChartPieIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { currentSubject, isSubjectSelected } = useSubjectStore()

  // 基础导航（首页显示）
  const baseNavigation = [
    { name: '个人资料', href: '/profile', icon: UserIcon },
  ]

  // 学科特定导航（选择学科后显示）
  const subjectNavigation = [
    { name: '仪表板', href: '/dashboard', icon: HomeIcon },
    { name: '试卷管理', href: '/papers', icon: DocumentTextIcon },
    { name: '题库管理', href: '/question-bank', icon: BookOpenIcon },
    { name: '智能学习', href: '/study', icon: AcademicCapIcon },
    { name: '考试大纲', href: '/exam-outline', icon: ChartPieIcon },
    { name: '学习路径', href: '/learning-path', icon: MapIcon },
    { name: '个人资料', href: '/profile', icon: UserIcon },
  ]

  const navigation = isSubjectSelected ? subjectNavigation : baseNavigation

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* 顶部学科导航栏 */}
      <SubjectNavigation />
      
      <div className="flex flex-1">
        {/* 移动端侧边栏背景 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 侧边栏 - 只在选择学科时显示 */}
        {isSubjectSelected && (
          <div
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ top: '64px' }}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-lg font-bold text-primary-600">
                    {currentSubject?.icon} {currentSubject?.name}
                  </span>
                </div>
              </div>
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <nav className="mt-5 px-2">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 ${
                          isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* 用户信息和登出 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                退出登录
              </button>
            </div>
          </div>
        )}

        {/* 主内容区域 */}
        <div className={`flex-1 flex flex-col ${!isSubjectSelected ? 'ml-0' : ''}`}>
          {/* 移动端顶部导航栏 */}
          {isSubjectSelected && (
            <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
              <div className="flex items-center justify-between h-16 px-4">
                <button
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
                <div className="flex-1" />
              </div>
            </header>
          )}

          {/* 页面内容 */}
          <main className="flex-1 bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout