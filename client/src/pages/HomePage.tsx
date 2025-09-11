import { Link } from 'react-router-dom'
import { 
  AcademicCapIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  BookOpenIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

const HomePage = () => {
  const features = [
    {
      name: '智能试卷解析',
      description: '一键上传试卷，AI自动识别题目内容，快速构建个人题库',
      icon: DocumentTextIcon,
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      name: 'AI学习伴侣',
      description: '24小时智能陪伴，实时答疑解惑，让学习不再孤单',
      icon: SparklesIcon,
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      name: '个性化路径',
      description: '基于学习数据分析，为你量身定制最适合的学习计划',
      icon: RocketLaunchIcon,
      gradient: 'from-green-400 to-green-600'
    },
    {
      name: '知识点精讲',
      description: '深度解析每个知识点，帮你真正理解而非死记硬背',
      icon: LightBulbIcon,
      gradient: 'from-yellow-400 to-orange-500'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Studdy</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
            <div className="text-center">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-6">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  AI驱动的智能学习平台
                </div>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
                <span className="block text-gray-900 mb-2">让学习变得</span>
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  简单高效
                </span>
              </h1>
              <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-12 leading-relaxed">
                用AI重新定义学习体验，从试卷解析到个性化辅导，
                <br className="hidden sm:block" />
                让每一分钟的学习都更有价值
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  开始免费体验
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  立即登录
                </Link>
              </div>
            </div>
            
            {/* 装饰性元素 */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse delay-2000"></div>
          </div>
        </div>
      </div>

      {/* 功能特性 */}
      <div className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-6">
              <RocketLaunchIcon className="h-4 w-4 mr-2" />
              核心功能
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              为什么选择 <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Studdy</span>
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
              我们用最前沿的AI技术，为你打造最贴心的学习体验
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={feature.name} className="group relative">
                <div className="h-full p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA区域 */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              准备好开启学习新体验了吗？
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-blue-100 mb-10 leading-relaxed">
              加入数万名学生的行列，用AI让学习变得更简单、更高效
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                立即免费注册
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 hover:border-white/50 rounded-xl backdrop-blur-sm transition-all duration-200"
              >
                已有账号？登录
              </Link>
            </div>
          </div>
        </div>
        
        {/* 装饰性元素 */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* 页脚 */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Studdy</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-600 mb-2">
                让AI成为你最好的学习伙伴
              </p>
              <p className="text-gray-400 text-sm">
                © 2024 Studdy. 保留所有权利。
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage