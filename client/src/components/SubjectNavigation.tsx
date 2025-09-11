import { useSubjectStore, SUBJECTS, Subject } from '../store/subjectStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'

const SubjectNavigation = () => {
  const { currentSubject, setCurrentSubject } = useSubjectStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubjectSelect = (subject: Subject) => {
    setCurrentSubject(subject)
    // 如果当前在首页，跳转到仪表板
    if (location.pathname === '/dashboard') {
      navigate('/dashboard')
    }
  }

  const handleHomeClick = () => {
    setCurrentSubject(null)
    navigate('/dashboard')
  }

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive ? 'bg-blue-100 text-blue-800 border-blue-200' : 'text-blue-600 hover:bg-blue-50 border-blue-100',
      purple: isActive ? 'bg-purple-100 text-purple-800 border-purple-200' : 'text-purple-600 hover:bg-purple-50 border-purple-100',
      green: isActive ? 'bg-green-100 text-green-800 border-green-200' : 'text-green-600 hover:bg-green-50 border-green-100',
      amber: isActive ? 'bg-amber-100 text-amber-800 border-amber-200' : 'text-amber-600 hover:bg-amber-50 border-amber-100',
      red: isActive ? 'bg-red-100 text-red-800 border-red-200' : 'text-red-600 hover:bg-red-50 border-red-100',
      teal: isActive ? 'bg-teal-100 text-teal-800 border-teal-200' : 'text-teal-600 hover:bg-teal-50 border-teal-100',
      emerald: isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-100',
      rose: isActive ? 'bg-rose-100 text-rose-800 border-rose-200' : 'text-rose-600 hover:bg-rose-50 border-rose-100',
      indigo: isActive ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'text-indigo-600 hover:bg-indigo-50 border-indigo-100',
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600 mr-8">Studdy</h1>
          </div>

          {/* 学科导航 */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {/* 首页按钮 */}
            <button
              onClick={handleHomeClick}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                !currentSubject
                  ? 'bg-gray-100 text-gray-800 border-gray-200'
                  : 'text-gray-600 hover:bg-gray-50 border-gray-100'
              }`}
            >
              <HomeIcon className="h-4 w-4 mr-1" />
              首页
            </button>

            {/* 学科按钮 */}
            {SUBJECTS.map((subject) => {
              const isActive = currentSubject?.id === subject.id
              return (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectSelect(subject)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap ${
                    getColorClasses(subject.color, isActive)
                  }`}
                >
                  <span className="mr-1">{subject.icon}</span>
                  {subject.name}
                </button>
              )
            })}
          </div>

          {/* 右侧空间 */}
          <div className="flex-shrink-0 w-8" />
        </div>
      </div>
    </div>
  )
}

export default SubjectNavigation