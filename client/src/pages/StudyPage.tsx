import { useState, useEffect, useRef } from 'react'
import {
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ClockIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Question {
  id: string
  content: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  options?: string[]
  correctAnswer?: string
  explanation?: string
  knowledgePoints: string[]
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
}

const StudyPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [isAnswered, setIsAnswered] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [studySession, setStudySession] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    startTime: new Date(),
    currentStreak: 0,
  })
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 模拟题目数据
  const sampleQuestions: Question[] = [
    {
      id: '1',
      content: '已知函数 f(x) = x² - 2x + 1，求 f(x) 的最小值。',
      subject: '数学',
      difficulty: 'medium',
      correctAnswer: '0',
      explanation: 'f(x) = x² - 2x + 1 = (x-1)²，当 x = 1 时，f(x) 取得最小值 0。',
      knowledgePoints: ['二次函数', '配方法', '函数最值'],
    },
    {
      id: '2',
      content: '下列关于电磁感应的说法正确的是：',
      subject: '物理',
      difficulty: 'medium',
      options: [
        'A. 只有磁场变化才能产生感应电流',
        'B. 导体在磁场中运动一定产生感应电流',
        'C. 闭合回路中磁通量发生变化时产生感应电动势',
        'D. 感应电流的方向与磁场方向相同',
      ],
      correctAnswer: 'C',
      explanation: '根据法拉第电磁感应定律，当闭合回路中的磁通量发生变化时，回路中就会产生感应电动势。',
      knowledgePoints: ['电磁感应', '法拉第定律', '磁通量'],
    },
  ]

  useEffect(() => {
    // 初始化第一个问题
    if (!currentQuestion) {
      loadNextQuestion()
    }
  }, [])

  useEffect(() => {
    // 自动滚动到聊天底部
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadNextQuestion = () => {
    const randomIndex = Math.floor(Math.random() * sampleQuestions.length)
    const question = sampleQuestions[randomIndex]
    setCurrentQuestion(question)
    setUserAnswer('')
    setSelectedOption('')
    setIsAnswered(false)
    setShowExplanation(false)
    
    // 添加系统消息
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: `开始新题目：${question.subject} - ${question.difficulty === 'easy' ? '简单' : question.difficulty === 'medium' ? '中等' : '困难'}`,
      timestamp: new Date(),
    }
    setChatMessages(prev => [...prev, systemMessage])
  }

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return
    
    const answer = currentQuestion.options ? selectedOption : userAnswer
    if (!answer.trim()) {
      toast.error('请输入答案')
      return
    }

    setIsAnswered(true)
    const isCorrect = answer === currentQuestion.correctAnswer
    
    // 更新学习统计
    setStudySession(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      currentStreak: isCorrect ? prev.currentStreak + 1 : 0,
    }))

    // 添加用户答案到聊天
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `我的答案：${answer}`,
      timestamp: new Date(),
    }
    
    // 添加AI反馈
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: isCorrect 
        ? `✅ 回答正确！你掌握了${currentQuestion.knowledgePoints.join('、')}的相关知识。` 
        : `❌ 答案不正确。正确答案是：${currentQuestion.correctAnswer}。让我来解释一下...`,
      timestamp: new Date(),
    }

    setChatMessages(prev => [...prev, userMessage, aiMessage])
    
    if (isCorrect) {
      toast.success('回答正确！')
    } else {
      toast.error('答案不正确，查看解析学习吧')
      setShowExplanation(true)
    }
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date(),
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsLoading(true)
    
    // 模拟AI回复
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `这是一个很好的问题！让我来帮你分析一下...

基于你的提问，我建议你关注以下几个要点：
1. 理解题目的核心概念
2. 掌握相关的解题方法
3. 多做类似的练习题

你还有其他疑问吗？`,
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000 + Math.random() * 2000)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return '未知'
    }
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">加载中...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 学习统计 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">已答题数</p>
              <p className="text-xl font-semibold">{studySession.questionsAnswered}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">正确率</p>
              <p className="text-xl font-semibold">
                {studySession.questionsAnswered > 0 
                  ? Math.round((studySession.correctAnswers / studySession.questionsAnswered) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">学习时长</p>
              <p className="text-xl font-semibold">
                {Math.floor((Date.now() - studySession.startTime.getTime()) / 60000)}分钟
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <LightBulbIcon className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">连续正确</p>
              <p className="text-xl font-semibold">{studySession.currentStreak}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 题目区域 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpenIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">{currentQuestion.subject}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                  {getDifficultyText(currentQuestion.difficulty)}
                </span>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-lg text-gray-900 mb-4">{currentQuestion.content}</p>
            </div>
            
            {/* 选择题选项 */}
            {currentQuestion.options && (
              <div className="space-y-2 mb-4">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="answer"
                      value={option.charAt(0)}
                      checked={selectedOption === option.charAt(0)}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      disabled={isAnswered}
                      className="mr-3"
                    />
                    <span className={isAnswered && option.charAt(0) === currentQuestion.correctAnswer ? 'text-green-600 font-medium' : ''}>
                      {option}
                    </span>
                    {isAnswered && option.charAt(0) === currentQuestion.correctAnswer && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 ml-auto" />
                    )}
                    {isAnswered && selectedOption === option.charAt(0) && option.charAt(0) !== currentQuestion.correctAnswer && (
                      <XCircleIcon className="h-5 w-5 text-red-500 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            )}
            
            {/* 主观题输入 */}
            {!currentQuestion.options && (
              <div className="mb-4">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="请输入你的答案..."
                  disabled={isAnswered}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            )}
            
            {/* 答题按钮 */}
            <div className="flex space-x-3">
              {!isAnswered ? (
                <button
                  onClick={handleSubmitAnswer}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  提交答案
                </button>
              ) : (
                <button
                  onClick={loadNextQuestion}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  下一题
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              )}
            </div>
          </div>
          
          {/* 解析区域 */}
          {showExplanation && currentQuestion.explanation && (
            <div className="p-6 bg-blue-50">
              <h3 className="text-lg font-medium text-blue-900 mb-2">解题思路</h3>
              <p className="text-blue-800 mb-4">{currentQuestion.explanation}</p>
              
              <div className="mb-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">相关知识点：</h4>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.knowledgePoints.map((point, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI伴读聊天区域 */}
        <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">AI学习伴侣</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">有疑问随时问我，我会为你提供个性化的学习指导</p>
          </div>
          
          {/* 聊天消息 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <LightBulbIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>开始学习吧！我会在这里为你答疑解惑</p>
              </div>
            )}
            
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-primary-600 text-white' 
                    : message.type === 'system'
                    ? 'bg-gray-100 text-gray-600 text-sm'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span>AI正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
          
          {/* 聊天输入 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="有什么问题想问我吗？"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleChatSubmit}
                disabled={!chatInput.trim() || isLoading}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudyPage