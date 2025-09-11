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
  PencilIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
// import ReactMarkdown from 'react-markdown' // 已替换为MarkdownRenderer
import { useSubjectStore, SUBJECTS } from '../store/subjectStore'
import { useKnowledgeGraphStore } from '../store/knowledgeGraphStore'
import KnowledgePointDetail from '../components/KnowledgePointDetail'
import MathRenderer from '../components/MathRenderer'
import MarkdownRenderer from '../components/MarkdownRenderer'
import ErrorBoundary from '../components/ErrorBoundary'

import UserSupplements from '../components/UserSupplements'
import SVGViewer from '../components/SVGViewer'
import ImageViewer from '../components/ImageViewer'
import api from '../utils/api'

interface QuestionOption {
  label: string
  content: string
  isCorrect: boolean
  _id: string
}

interface Question {
  id: string
  content: string
  ocrText?: string // OCR识别的原始文字内容
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  options?: string[] | QuestionOption[]
  correctAnswer?: string
  explanation?: string
  knowledgePoints: string[]
  imageData?: string
  mimeType?: string
  type?: string
  svgData?: string // SVG图形数据
  figureProperties?: any // 图形属性
  hasGeometryFigure?: boolean // 是否包含几何图形
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
}

const StudyPage = () => {
  const { currentSubject, setCurrentSubject } = useSubjectStore()
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<string | null>(null)

  const [studySession, setStudySession] = useState({
    startTime: new Date(),
    questionsAnswered: 0,
    correctAnswers: 0,
    currentStreak: 0,
    longestStreak: 0,
    accuracy: 0
  })
  
  // 答题相关状态
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState<string>('')
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [realTimeSolutions, setRealTimeSolutions] = useState<string[]>([])
  const [isGeneratingSolutions, setIsGeneratingSolutions] = useState(false)
  const [editingSolutionIndex, setEditingSolutionIndex] = useState<number | null>(null)
  const [editingSolutionData, setEditingSolutionData] = useState<any>(null)
  const [userSupplements, setUserSupplements] = useState<any[]>([])  
  const [isLoadingSupplements, setIsLoadingSupplements] = useState(false)
  // 添加题目统计信息状态
  const [questionStats, setQuestionStats] = useState({
    totalQuestions: 0,
    currentIndex: 0,
    subjectQuestions: 0
  })
  // 实时答题方案更新相关状态
  const [questionCount, setQuestionCount] = useState(0) // 用户连续提问计数器
  const [lastThreeQuestions, setLastThreeQuestions] = useState<string[]>([]) // 保存最近三个问题
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 处理键盘粘贴事件
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // 检查是否有图片
      const items = e.clipboardData?.items
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile()
            if (file) {
              await handleImagePaste(file)
              return
            }
          }
        }
      }
      
      // 如果没有图片，处理文本
      const text = e.clipboardData?.getData('text')
      if (text && text.trim()) {
        await handleTextPaste(text.trim())
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [currentSubject])



  // 开始编辑答题方案
  const startEditingSolution = (index: number, solution: any) => {
    setEditingSolutionIndex(index)
    setEditingSolutionData({
      title: solution.title || '',
      approach: solution.approach || '',
      steps: Array.isArray(solution.steps) ? solution.steps.join('\n') : '',
      keyPoints: Array.isArray(solution.keyPoints) ? solution.keyPoints.join('\n') : '',
      customTitle: '' // 用户自定义标题
    })
  }

  // 取消编辑
  const cancelEditingSolution = () => {
    setEditingSolutionIndex(null)
    setEditingSolutionData(null)
  }

  // 保存编辑的答题方案到知识点
  const saveSolutionToKnowledgePoint = async () => {
    console.log('🔄 开始保存答题方案到知识点')
    console.log('editingSolutionData:', editingSolutionData)
    console.log('currentQuestion:', currentQuestion)
    console.log('editingSolutionIndex:', editingSolutionIndex)
    
    if (!editingSolutionData || !currentQuestion || editingSolutionIndex === null) {
      console.log('❌ 保存失败：缺少必要信息')
      toast.error('保存失败：缺少必要信息')
      return
    }

    try {
      const authStorage = localStorage.getItem('auth-storage')
      console.log('🔐 Auth storage:', authStorage)
      const token = authStorage ? JSON.parse(authStorage).token : null
      console.log('🎫 Token:', token ? '存在' : '不存在')
      
      if (!token) {
        console.log('❌ 未找到token')
        toast.error('请先登录')
        return
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // 构建保存的内容
      const content = {
        title: editingSolutionData.customTitle || editingSolutionData.title,
        approach: editingSolutionData.approach,
        steps: editingSolutionData.steps.split('\n').filter((step: string) => step.trim()),
        keyPoints: editingSolutionData.keyPoints.split('\n').filter((point: string) => point.trim()),
        questionId: currentQuestion.id,
        subject: currentQuestion.subject || currentSubject?.name || '数学',
        knowledgePoints: currentQuestion.knowledgePoints
      }
      
      console.log('📦 准备发送的内容:', content)
      console.log('🌐 发送API请求到: /api/knowledge-points/save-solution')

      const response = await fetch('/api/knowledge-points/save-solution', {
        method: 'POST',
        headers,
        body: JSON.stringify(content)
      })
      
      console.log('📡 API响应状态:', response.status, response.statusText)

      if (response.ok) {
        const responseData = await response.json()
        console.log('✅ API响应成功:', responseData)
        toast.success('答题方案已保存到知识点')
        cancelEditingSolution()
        
        // 刷新知识图谱数据以显示新保存的知识点
        const { refreshSubjectData } = useKnowledgeGraphStore.getState()
        await refreshSubjectData(currentQuestion.subject || currentSubject?.name || '数学')
      } else {
        const errorData = await response.json()
        console.log('❌ API响应失败:', errorData)
        toast.error(`保存失败: ${errorData.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('💥 保存答题方案异常:', error)
      toast.error('保存失败，请重试')
    }
    
    console.log('🏁 saveSolutionToKnowledgePoint 函数执行完毕')
  }

  // 更新编辑数据
  const updateEditingData = (field: string, value: string) => {
    setEditingSolutionData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  // 处理图片粘贴（直接存储和显示图片）
  const handleImagePaste = async (file: File) => {
    if (!currentSubject) {
      toast.error('请先选择学科')
      return
    }

    const formData = new FormData()
    formData.append('image', file)
    formData.append('subject', currentSubject.name)

    try {
      setIsLoading(true)
      const data = await api.uploadImage(formData)
      if (data.success && data.question) {
        // 检查是否需要切换科目
        if (!data.subjectMatch && data.suggestedSubject) {
          // 查找匹配的科目
          const matchedSubject = SUBJECTS.find(subject => 
            subject.name === data.suggestedSubject || 
            subject.name.includes(data.suggestedSubject) ||
            data.suggestedSubject.includes(subject.name)
          )
          
          if (matchedSubject) {
            setCurrentSubject(matchedSubject)
            toast.success(`已自动切换到${matchedSubject.name}学科`)
          }
        }
        const newQuestion = {
          id: data.question._id,
          content: data.question.content,
          ocrText: data.question.ocrText, // 添加OCR识别的文字内容
          subject: data.question.subject,
          difficulty: (data.question.difficulty === 'easy' || data.question.difficulty === 'hard') 
            ? data.question.difficulty 
            : 'medium' as const,
          options: data.question.options || [],
          knowledgePoints: data.question.knowledgePoints || [],
          imageData: data.question.imageData,
          mimeType: data.question.mimeType,
          type: data.question.type
        }
        // 重置答题状态，确保新题目完全替换原题目
        resetAnswerState()
        setChatMessages([])
        setRealTimeSolutions([])
        setUserSupplements([])
        
        setCurrentQuestion(newQuestion)
        generateRealTimeSolutions(data.question)
        fetchUserSupplements(data.question._id)
        
        // 刷新知识图谱数据以显示新的知识点
        if (data.question.knowledgePoints && data.question.knowledgePoints.length > 0) {
          const { refreshSubjectData } = useKnowledgeGraphStore.getState()
          await refreshSubjectData(data.question.subject || currentSubject?.name || '数学')
        }
        
        toast.success('图片上传成功！')
      }
    } catch (error: any) {
      console.error('图片处理失败:', error)
      console.error('错误详情:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        stack: error?.stack
      })
      toast.error(`图片处理失败: ${error?.message || '请重试'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理文本粘贴
  const handleTextPaste = async (text: string) => {
    if (!currentSubject) {
      toast.error('请先选择学科')
      return
    }

    try {
      setIsLoading(true)
      // 使用AI解析题目
      const parseResponse = await fetch('/api/ai/parse-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: text,
          currentSubject: currentSubject.name
        })
      })

      if (!parseResponse.ok) {
        throw new Error('题目解析失败')
      }

      const parseData = await parseResponse.json()
      if (parseData.success && parseData.isQuestion && parseData.question) {
        const parsedQuestion = parseData.question
        
        // 检查是否需要切换科目
        if (!parseData.subjectMatch && parseData.suggestedSubject) {
          // 查找匹配的科目
          const matchedSubject = SUBJECTS.find(subject => 
            subject.name === parseData.suggestedSubject || 
            subject.name.includes(parseData.suggestedSubject) ||
            parseData.suggestedSubject.includes(subject.name)
          )
          
          if (matchedSubject) {
            setCurrentSubject(matchedSubject)
            toast.success(`已自动切换到${matchedSubject.name}学科`)
          }
        }
        
        // 自动保存题目到题库
        try {
          const saveResponse = await fetch('/api/ai/save-question', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              question: parsedQuestion
            })
          })
          
          const saveData = await saveResponse.json()
          if (saveData.success) {
            console.log('题目已自动保存到题库')
          }
        } catch (saveError) {
          console.error('保存题目失败:', saveError)
          // 不影响主流程，继续显示题目
        }
        
        // 重置答题状态，确保新题目完全替换原题目
        resetAnswerState()
        setChatMessages([])
        setRealTimeSolutions([])
        setUserSupplements([])
        
        // 设置当前题目
        const newQuestion = {
          id: parsedQuestion.id,
          content: parsedQuestion.content,
          subject: parsedQuestion.subject,
          difficulty: convertDifficultyToEnglish(parsedQuestion.difficulty) as 'easy' | 'medium' | 'hard',
          options: parsedQuestion.options || [],
          correctAnswer: parsedQuestion.correctAnswer,
          explanation: parsedQuestion.explanation,
          knowledgePoints: parsedQuestion.knowledgePoints || [],
          type: parsedQuestion.type
        }
        setCurrentQuestion(newQuestion)
        generateRealTimeSolutions(parsedQuestion)
        
        // 刷新知识图谱数据以显示新的知识点
        if (parsedQuestion.knowledgePoints && parsedQuestion.knowledgePoints.length > 0) {
          const { refreshSubjectData } = useKnowledgeGraphStore.getState()
          await refreshSubjectData(parsedQuestion.subject || currentSubject?.name || '数学')
        }
        
        toast.success('题目解析并保存成功！')
      } else {
        toast.error(parseData.reason || '内容不是有效的题目格式')
      }
    } catch (error) {
      console.error('题目解析失败:', error)
      toast.error('题目解析失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 转换中文难度为英文
  const convertDifficultyToEnglish = (difficulty: string): 'easy' | 'medium' | 'hard' => {
    const difficultyMap: { [key: string]: 'easy' | 'medium' | 'hard' } = {
      '简单': 'easy',
      '中等': 'medium', 
      '困难': 'hard',
      'easy': 'easy',
      'medium': 'medium',
      'hard': 'hard'
    }
    return difficultyMap[difficulty] || 'medium'
  }

  // 生成实时答题方案
  const generateRealTimeSolutions = async (question: any) => {
    if (!question) return
    
    setIsGeneratingSolutions(true)
    setRealTimeSolutions([])
    
    try {
      const authStorage = localStorage.getItem('auth-storage')
      const token = authStorage ? JSON.parse(authStorage).token : null
      
      const requestBody = {
        question: question.ocrText || question.content, // 优先使用OCR识别的内容
        subject: question.subject || currentSubject?.name || '数学',
        options: question.options || [],
        knowledgePoints: question.knowledgePoints || [],
        difficulty: convertDifficultyToEnglish(question.difficulty),
        imageData: question.imageData,
        mimeType: question.mimeType,
        ocrText: question.ocrText // 传递OCR文本用于更准确的分析
      }
      
      console.log('发送答题方案请求:', requestBody)
      
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      try {
        const response = await fetch('/api/ai/solutions', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        })

        console.log('API响应状态:', response.status)
        
        if (!response.ok) {
          const errorData = await response.text()
          console.error('API请求失败:', response.status, errorData)
          throw new Error(`API请求失败: ${response.status} - ${errorData}`)
        }

        const data = await response.json()
        console.log('API响应数据:', data)
        
        if (data.solutions && data.solutions.length > 0) {
          console.log('设置答题方案:', data.solutions)
          setRealTimeSolutions(data.solutions)
          
          // 同步知识点到知识图谱
          if (question.knowledgePoints && question.knowledgePoints.length > 0 && question.subject) {
            const { syncNewKnowledgePoints } = useKnowledgeGraphStore.getState()
            try {
              await syncNewKnowledgePoints(question.subject, question.knowledgePoints)
              console.log('知识点已同步到知识图谱')
            } catch (syncError) {
              console.error('同步知识点到知识图谱失败:', syncError)
            }
          }
        } else {
          console.log('API返回成功但无solutions数据')
          setRealTimeSolutions(['暂无实时答题方案'])
        }
      } catch (fetchError) {
        console.error('网络请求错误:', fetchError)
        setRealTimeSolutions(['网络连接失败，请检查网络设置'])
      }
    } catch (error) {
      console.error('生成答题方案失败:', error)
    } finally {
      setIsGeneratingSolutions(false)
    }
  }

  // 基于最近三个问题更新实时答题方案
  const updateRealTimeSolutionsBasedOnQuestions = async () => {
    if (!currentQuestion || lastThreeQuestions.length < 3) return
    
    setIsGeneratingSolutions(true)
    
    try {
      const authStorage = localStorage.getItem('auth-storage')
      const token = authStorage ? JSON.parse(authStorage).token : null
      
      // 创建基于聊天历史的增强请求
      const requestBody = {
        question: currentQuestion.content,
        subject: currentQuestion.subject || currentSubject?.name || '数学',
        options: currentQuestion.options || [],
        knowledgePoints: currentQuestion.knowledgePoints || [],
        difficulty: convertDifficultyToEnglish(currentQuestion.difficulty),
        imageData: currentQuestion.imageData,
        mimeType: currentQuestion.mimeType,
        // 添加聊天历史上下文
        chatContext: {
          recentQuestions: lastThreeQuestions,
          questionCount: questionCount,
          isContextualUpdate: true
        }
      }
      
      console.log('发送基于聊天历史的答题方案更新请求:', requestBody)
      
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/ai/solutions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('基于聊天历史的答题方案更新失败:', response.status, errorData)
        throw new Error(`API请求失败: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      console.log('基于聊天历史的答题方案更新成功:', data)
      
      if (data.solutions && data.solutions.length > 0) {
        setRealTimeSolutions(data.solutions)
        toast.success('答题方案已根据您的问题更新！')
        
        // 重置问题计数器
        setQuestionCount(0)
        setLastThreeQuestions([])
        
        // 同步知识点到知识图谱
        if (currentQuestion.knowledgePoints && currentQuestion.knowledgePoints.length > 0 && currentQuestion.subject) {
          const { syncNewKnowledgePoints } = useKnowledgeGraphStore.getState()
          try {
            await syncNewKnowledgePoints(currentQuestion.subject, currentQuestion.knowledgePoints)
            console.log('知识点已同步到知识图谱')
          } catch (syncError) {
            console.error('同步知识点到知识图谱失败:', syncError)
          }
        }
      } else {
         console.log('API返回成功但无solutions数据')
         toast.success('暂无新的答题方案')
       }
    } catch (error) {
      console.error('基于聊天历史更新答题方案失败:', error)
      toast.error('答题方案更新失败，请稍后再试')
    } finally {
      setIsGeneratingSolutions(false)
    }
  }

  // 重置答题状态
  const resetAnswerState = () => {
    setSelectedAnswer(null)
    setUserAnswer('')
    setIsAnswered(false)
    setIsCorrect(null)
    setShowExplanation(false)
  }

  // 处理选择题答案选择
  const handleOptionSelect = (optionLabel: string) => {
    if (isAnswered) return
    setSelectedAnswer(optionLabel)
  }

  // 提交答案
  const submitAnswer = () => {
    if (!currentQuestion) return
    
    let userSelectedAnswer = ''
    let correctAnswer = ''
    let isAnswerCorrect = false

    if (currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
      // 选择题
      if (!selectedAnswer) {
        toast.error('请选择一个答案')
        return
      }
      userSelectedAnswer = selectedAnswer
      
      // 检查选项格式
      if (typeof currentQuestion.options[0] === 'object') {
        // 新格式：对象数组
        const correctOption = (currentQuestion.options as QuestionOption[]).find(opt => opt.isCorrect)
        correctAnswer = correctOption?.label || ''
        isAnswerCorrect = selectedAnswer === correctAnswer
      } else {
        // 旧格式：字符串数组，使用correctAnswer字段
        correctAnswer = currentQuestion.correctAnswer || ''
        isAnswerCorrect = selectedAnswer === correctAnswer
      }
    } else {
      // 非选择题
      if (!userAnswer.trim()) {
        toast.error('请输入答案')
        return
      }
      userSelectedAnswer = userAnswer.trim()
      correctAnswer = currentQuestion.correctAnswer || ''
      // 对于非选择题，可以进行简单的字符串比较或者调用AI判断
      isAnswerCorrect = userSelectedAnswer.toLowerCase() === correctAnswer.toLowerCase()
    }

    // 更新答题状态
    setIsAnswered(true)
    setIsCorrect(isAnswerCorrect)
    setShowExplanation(true)

    // 更新学习统计
    updateStudyStats(isAnswerCorrect)
    
    // 显示结果提示
    if (isAnswerCorrect) {
      toast.success('回答正确！')
    } else {
      toast.error(`回答错误，正确答案是：${correctAnswer}`)
    }
  }

  // 更新学习统计数据
  const updateStudyStats = (isCorrect: boolean) => {
    setStudySession(prev => {
      const newQuestionsAnswered = prev.questionsAnswered + 1
      const newCorrectAnswers = prev.correctAnswers + (isCorrect ? 1 : 0)
      const newCurrentStreak = isCorrect ? prev.currentStreak + 1 : 0
      const newLongestStreak = Math.max(prev.longestStreak, newCurrentStreak)
      const newAccuracy = newQuestionsAnswered > 0 ? (newCorrectAnswers / newQuestionsAnswered) * 100 : 0

      return {
        ...prev,
        questionsAnswered: newQuestionsAnswered,
        correctAnswers: newCorrectAnswers,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        accuracy: Math.round(newAccuracy * 100) / 100
      }
    })
  }

  // 下一题
  const nextQuestion = () => {
    resetAnswerState()
    fetchSubjectQuestions()
  }

  // 获取用户补充内容
  const fetchUserSupplements = async (questionId: string) => {
    if (!questionId) return
    
    setIsLoadingSupplements(true)
    try {
      const authStorage = localStorage.getItem('auth-storage')
      const token = authStorage ? JSON.parse(authStorage).token : null
      
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`/api/questions/${questionId}/supplements`, {
        method: 'GET',
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserSupplements(data.supplements || [])
      } else {
        console.error('获取用户补充内容失败:', response.status)
        setUserSupplements([])
      }
    } catch (error) {
      console.error('获取用户补充内容失败:', error)
      setUserSupplements([])
    } finally {
      setIsLoadingSupplements(false)
    }
  }

  // 处理补充内容添加
  const handleSupplementAdded = (supplement: any) => {
    setUserSupplements(prev => [...prev, supplement])
  }

  // 处理补充内容更新
  const handleSupplementUpdated = (updatedSupplement: any) => {
    setUserSupplements(prev => 
      prev.map(s => s._id === updatedSupplement._id ? updatedSupplement : s)
    )
  }

  // 处理补充内容删除
  const handleSupplementDeleted = (supplementId: string) => {
    setUserSupplements(prev => prev.filter(s => s._id !== supplementId))
  }

  // 首次加载或学科切换时获取题目
  useEffect(() => {
    if (currentSubject) {
      // 清空当前内容，确保显示新学科的内容
      setCurrentQuestion(null)
      setChatMessages([])
      setRealTimeSolutions([])
      setUserSupplements([])
      
      // 获取新学科的题目
      fetchSubjectQuestions()
    }
  }, [currentSubject])

  // 获取学科题目数据
  const fetchSubjectQuestions = async () => {
    if (!currentSubject) {
      toast.error('请先选择学科')
      return
    }
    
    setIsLoading(true)
    try {
      // 检查认证状态
      const authStorage = localStorage.getItem('auth-storage')
      if (!authStorage) {
        toast.error('请先登录')
        return
      }
      
      // 将学科ID转换为中文名称
      const subjectName = currentSubject.name
      console.log('正在获取题目，学科:', subjectName)
      
      // 获取题目统计信息
      const statsResponse = await api.get('/questions/stats')
      if (statsResponse.success) {
        const subjectCount = statsResponse.data.subjectCounts[subjectName] || 0
        setQuestionStats({
          totalQuestions: statsResponse.data.totalQuestions || 0,
          currentIndex: 1,
          subjectQuestions: subjectCount
        })
      }
      
      const response = await api.get(`/questions?subject=${encodeURIComponent(subjectName)}&limit=1`)
      console.log('API响应:', response)
      
      if (response.success && response.data.questions && response.data.questions.length > 0) {
        const question = response.data.questions[0]
        
        // 调试：检查题目数据
        console.log('原始题目数据:', question)
        console.log('图片相关字段检查:')
        console.log('- imageData:', question.imageData ? '存在' : '不存在')
        console.log('- mimeType:', question.mimeType)
        console.log('- svgData:', question.svgData ? '存在' : '不存在')
        console.log('- hasGeometryFigure:', question.hasGeometryFigure)
        console.log('- figureProperties:', question.figureProperties)
        console.log('- ocrText:', question.ocrText ? '存在' : '不存在')
        
        const newQuestion = {
          id: question.id || question._id,
          content: question.content,
          subject: question.paper?.subject || question.subject,
          difficulty: (question.difficulty === 'easy' || question.difficulty === 'hard') 
            ? question.difficulty 
            : 'medium' as const,
          options: question.options || [],
          correctAnswer: question.correctAnswer || '',
          explanation: question.explanation || '',
          knowledgePoints: question.knowledgePoints || [],
          imageData: question.imageData,
          mimeType: question.mimeType,
          svgData: question.svgData,
          figureProperties: question.figureProperties,
          hasGeometryFigure: question.hasGeometryFigure,
          ocrText: question.ocrText,
          type: question.type
        }
        
        console.log('处理后的题目数据:', newQuestion)
        setCurrentQuestion(newQuestion)
        resetAnswerState() // 重置答题状态
        generateRealTimeSolutions(question)
        fetchUserSupplements(question.id || question._id)
        toast.success('题目加载成功！')
      } else {
        // 没有找到题目时的处理
        toast.success(`暂无${subjectName}题目，请尝试其他学科或添加题目`)
      }
    } catch (error: any) {
      console.error('获取题目失败:', error)
      if (error.message?.includes('401')) {
        toast.error('登录已过期，请重新登录')
      } else {
        toast.error(`获取题目失败: ${error.message || '未知错误'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 处理AI聊天
  const handleAIChat = async () => {
    if (!chatInput.trim() || !currentQuestion) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    
    // 更新问题计数器和最近三个问题
    const newQuestionCount = questionCount + 1
    setQuestionCount(newQuestionCount)
    
    // 更新最近三个问题列表
    setLastThreeQuestions(prev => {
      const updated = [...prev, chatInput.trim()]
      return updated.length > 3 ? updated.slice(-3) : updated
    })
    
    setChatInput('')
    setIsLoading(true)
    
    try {
      const requestBody = {
        message: chatInput,
        questionContext: {
          content: currentQuestion.content,
          subject: currentQuestion.subject,
          difficulty: currentQuestion.difficulty,
          options: currentQuestion.options || [],
          knowledgePoints: currentQuestion.knowledgePoints || [],
          correctAnswer: currentQuestion.correctAnswer,
          explanation: currentQuestion.explanation,
          subjectContext: {
            isSubjectSelected: !!currentSubject,
            currentSubject: currentSubject?.name || currentQuestion.subject
          }
        },
        chatHistory: chatMessages,
        imageData: currentQuestion.imageData,
        mimeType: currentQuestion.mimeType
      }
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error('AI服务暂时不可用')
      }

      const data = await response.json()
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI聊天失败:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'AI助手暂时无法回应，请稍后再试。',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      
      // 检查是否需要更新实时答题方案
      if (newQuestionCount % 3 === 0 && lastThreeQuestions.length === 3) {
        console.log('触发实时答题方案更新，基于最近三个问题:', lastThreeQuestions)
        updateRealTimeSolutionsBasedOnQuestions()
      }
    }
  }

  // 获取下一题
  const getNextQuestion = async () => {
    if (!currentSubject) {
      toast.error('请先选择学科')
      return
    }
    
    setIsLoading(true)
    setRealTimeSolutions([])
    setChatMessages([])
    setUserSupplements([])
    
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (!authStorage) {
        toast.error('请先登录')
        return
      }
      
      const subjectName = currentSubject.name
      const response = await api.get(`/questions?subject=${encodeURIComponent(subjectName)}&limit=1&random=true`)
      
      if (response.success && response.data.questions && response.data.questions.length > 0) {
        const question = response.data.questions[0]
        const newQuestion = {
          id: question.id || question._id,
          content: question.content,
          subject: question.paper?.subject || question.subject,
          difficulty: (question.difficulty === 'easy' || question.difficulty === 'hard') 
            ? question.difficulty 
            : 'medium' as const,
          options: question.options || [],
          correctAnswer: question.correctAnswer || '',
          explanation: question.explanation || '',
          knowledgePoints: question.knowledgePoints || [],
          imageData: question.imageData,
          mimeType: question.mimeType,
          svgData: question.svgData,
          figureProperties: question.figureProperties,
          hasGeometryFigure: question.hasGeometryFigure,
          ocrText: question.ocrText,
          type: question.type
        }
        resetAnswerState() // 重置答题状态
        setCurrentQuestion(newQuestion)
        generateRealTimeSolutions(question)
        fetchUserSupplements(question.id || question._id)
        
        // 更新学习统计
        setStudySession(prev => ({
          ...prev,
          questionsAnswered: prev.questionsAnswered + 1
        }))
        
        // 更新题目进展
        setQuestionStats(prev => ({
          ...prev,
          currentIndex: Math.min(prev.currentIndex + 1, prev.subjectQuestions)
        }))
        
        toast.success('已切换到下一题！')
      } else {
        toast.error('暂无更多题目')
      }
    } catch (error) {
      console.error('获取下一题失败:', error)
      toast.error('获取下一题失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 自动滚动到聊天底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">学习中心</h1>
              <p className="text-sm md:text-base text-gray-600">
                {currentSubject ? `当前学科：${currentSubject.name}` : '请选择学科开始学习'}
              </p>
            </div>

          </div>
        </div>

        {/* 学习统计 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">学习时长</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {Math.floor((Date.now() - studySession.startTime.getTime()) / 60000)}分钟
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">已答题目</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{studySession.questionsAnswered}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <AcademicCapIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">正确率</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {studySession.accuracy}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <ArrowRightIcon className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">当前连击</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{studySession.currentStreak}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center">
              <LightBulbIcon className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">最长连击</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{studySession.longestStreak}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          {/* 题目区域 */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div className="flex flex-col">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center">
                    <BookOpenIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 text-blue-500" />
                    当前题目
                  </h2>
                  <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-2">
                    <span>库中总共: <span className="font-medium text-blue-600">{questionStats.totalQuestions}</span> 题</span>
                    <span>•</span>
                    <span>本组: <span className="font-medium text-green-600">{questionStats.subjectQuestions}</span> 题</span>
                    <span>•</span>
                    <span>进展: <span className="font-medium text-purple-600">{questionStats.currentIndex}/{questionStats.subjectQuestions}</span></span>
                    <span>•</span>
                    <span>答对: <span className="font-medium text-orange-600">{studySession.correctAnswers}</span> 题</span>
                    <span>•</span>
                    <span>正确率: <span className="font-medium text-red-600">
                      {studySession.questionsAnswered > 0 
                        ? Math.round((studySession.correctAnswers / studySession.questionsAnswered) * 100)
                        : 0}%
                    </span></span>
                  </div>
                </div>
                {currentQuestion && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentQuestion.difficulty === 'easy' ? '简单' :
                     currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                )}
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">加载中...</span>
                </div>
              ) : currentQuestion ? (
                <div className="space-y-4">
                  {/* OCR识别内容 */}
                  {currentQuestion.ocrText && currentQuestion.imageData && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <BookOpenIcon className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">OCR识别内容</span>
                      </div>
                      <div className="prose max-w-none text-sm text-blue-700">
                        <ErrorBoundary>
                        <MarkdownRenderer content={currentQuestion.ocrText} />
                      </ErrorBoundary>
                      </div>
                    </div>
                  )}
                  
                  {/* 题目内容 */}
                  <div className="prose max-w-none mb-4">
                    <ErrorBoundary>
                      <MarkdownRenderer content={currentQuestion.content} compact={true} />
                    </ErrorBoundary>
                  </div>
                  
                  {/* 题目图片 */}
                  {currentQuestion.imageData && currentQuestion.mimeType && (
                    <div className="mb-4">
                      <ImageViewer
                        imageData={currentQuestion.imageData}
                        mimeType={currentQuestion.mimeType}
                        alt="题目图片"
                        showControls={true}
                      />
                    </div>
                  )}
                  
                  {/* SVG几何图形 */}
                  {currentQuestion.hasGeometryFigure && currentQuestion.svgData && (
                    <div className="mb-4">
                      <SVGViewer 
                        svgData={currentQuestion.svgData}
                        title="几何图形"
                        showControls={true}
                      />
                    </div>
                  )}
                  
                  {/* 选项 */}
                  {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {currentQuestion.options.map((option, index) => {
                        const optionContent = typeof option === 'string' ? option : option.content;
                        const optionLabel = typeof option === 'string' ? String.fromCharCode(65 + index) : option.label;
                        const isSelected = selectedAnswer === optionLabel;
                        const isCorrectOption = isAnswered && typeof option === 'object' && option.isCorrect;
                        const isWrongSelection = isAnswered && isSelected && !isCorrectOption;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(optionLabel)}
                            disabled={isAnswered}
                            className={`w-full p-3 border rounded-lg text-left transition-all ${
                              isAnswered
                                ? isCorrectOption
                                  ? 'bg-green-100 border-green-500 text-green-800'
                                  : isWrongSelection
                                  ? 'bg-red-100 border-red-500 text-red-800'
                                  : 'bg-gray-50 border-gray-300'
                                : isSelected
                                ? 'bg-blue-100 border-blue-500 text-blue-800'
                                : 'hover:bg-gray-50 border-gray-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                isAnswered
                                  ? isCorrectOption
                                    ? 'border-green-500 bg-green-500'
                                    : isWrongSelection
                                    ? 'border-red-500 bg-red-500'
                                    : 'border-gray-300'
                                  : isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                              }`}>
                                {(isSelected || (isAnswered && isCorrectOption)) && (
                                  <CheckIcon className="h-3 w-3 text-white" />
                                )}
                                {isAnswered && isWrongSelection && (
                                  <XCircleIcon className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <ErrorBoundary>
                                <MarkdownRenderer content={`${optionLabel}. ${optionContent}`} />
                              </ErrorBoundary>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* 非选择题答题区域 */
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        请输入您的答案：
                      </label>
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={isAnswered}
                        placeholder="请在此输入您的答案..."
                        className={`w-full p-3 border rounded-lg resize-none ${
                          isAnswered
                            ? isCorrect
                              ? 'bg-green-50 border-green-300'
                              : 'bg-red-50 border-red-300'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                        rows={4}
                      />
                      {isAnswered && (
                        <div className={`mt-2 p-2 rounded text-sm ${
                          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isCorrect ? '✓ 回答正确！' : `✗ 回答错误，正确答案：${currentQuestion.correctAnswer}`}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 答题按钮区域 */}
                  <div className="flex gap-3 mb-4">
                    {!isAnswered ? (
                      <button
                        onClick={submitAnswer}
                        disabled={(!selectedAnswer && (!userAnswer || !userAnswer.trim())) || isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        提交答案
                      </button>
                    ) : (
                      <button
                        onClick={nextQuestion}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        下一题
                      </button>
                    )}
                  </div>
                  
                  {/* 答案解析 */}
                  {showExplanation && currentQuestion.explanation && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">答案解析：</h4>
                      <ErrorBoundary>
                        <MarkdownRenderer content={currentQuestion.explanation} />
                      </ErrorBoundary>
                    </div>
                  )}
                  
                  {/* 知识点标签 */}
                  {currentQuestion.knowledgePoints && currentQuestion.knowledgePoints.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-sm font-medium text-gray-700">相关知识点：</span>
                      {currentQuestion.knowledgePoints.map((point, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedKnowledgePoint(point)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                        >
                          {point}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* 下一题按钮 */}
                  <div className="flex justify-center sm:justify-end mt-6">
                    <button
                      onClick={getNextQuestion}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto justify-center"
                    >
                      <span>下一题</span>
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    {currentSubject ? '粘贴题目内容或图片开始学习' : '请先选择学科'}
                  </p>
                  <p className="text-sm text-gray-400">
                    支持直接粘贴文字题目或截图
                  </p>
                </div>
              )}
            </div>



            {/* 用户补充内容 */}
             {currentQuestion && (
               <UserSupplements
                 questionId={currentQuestion.id}
                 supplements={userSupplements}
                 onSupplementUpdated={handleSupplementUpdated}
                 onSupplementDeleted={handleSupplementDeleted}
               />
             )}

            {/* 实时答题方案 */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <LightBulbIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  实时答题方案
                </h3>
                {isGeneratingSolutions && (
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500 mr-1"></div>
                    生成中...
                  </div>
                )}
              </div>
              
              <ErrorBoundary>
                {realTimeSolutions.length > 0 ? (
                  <div className="space-y-3">
                    {realTimeSolutions.map((solution, index) => {
                      const isEditing = editingSolutionIndex === index;
                      
                      return (
                        <div key={index} className="border rounded-md p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">方案 {index + 1}</h4>
                            <div className="flex space-x-1">
                              {!isEditing ? (
                                <button
                                  onClick={() => startEditingSolution(index, solution)}
                                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                  title="编辑方案"
                                >
                                  <PencilIcon className="h-3 w-3" />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={saveSolutionToKnowledgePoint}
                                    className="p-1 text-green-600 hover:text-green-700 transition-colors"
                                    title="保存到知识点"
                                  >
                                    <CheckIcon className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={cancelEditingSolution}
                                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                    title="取消编辑"
                                  >
                                    <XCircleIcon className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  自定义标题
                                </label>
                                <input
                                  type="text"
                                  value={editingSolutionData?.customTitle || ''}
                                  onChange={(e) => updateEditingData('customTitle', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="为这个方案添加标题"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  方法
                                </label>
                                <textarea
                                  value={editingSolutionData?.approach || ''}
                                  onChange={(e) => updateEditingData('approach', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  rows={2}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  步骤（每行一个）
                                </label>
                                <textarea
                                  value={editingSolutionData?.steps || ''}
                                  onChange={(e) => updateEditingData('steps', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  rows={3}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  关键点（每行一个）
                                </label>
                                <textarea
                                  value={editingSolutionData?.keyPoints || ''}
                                  onChange={(e) => updateEditingData('keyPoints', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  rows={2}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {typeof solution === 'string' ? (
                                <ErrorBoundary>
                                  <div className="text-sm">
                                    <MarkdownRenderer content={solution} compact={true} />
                                  </div>
                                </ErrorBoundary>
                              ) : typeof solution === 'object' && solution !== null ? (
                                <div className="space-y-1">
                                  {(solution as any).title && (
                                    <h5 className="text-sm font-medium text-gray-800">
                                      {(solution as any).title}
                                    </h5>
                                  )}
                                  {(solution as any).approach && (
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">方法：</span>
                                      <ErrorBoundary>
                                        <MarkdownRenderer content={(solution as any).approach} compact={true} />
                                      </ErrorBoundary>
                                    </div>
                                  )}
                                  {(solution as any).steps && Array.isArray((solution as any).steps) && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-700 mb-1">步骤：</p>
                                      <ol className="text-xs text-gray-600 space-y-0.5 ml-3">
                                        {(solution as any).steps.map((step: string, stepIndex: number) => (
                                          <li key={stepIndex} className="list-decimal">
                                            <ErrorBoundary>
                                              <MarkdownRenderer content={step} compact={true} />
                                            </ErrorBoundary>
                                          </li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}
                                  {(solution as any).keyPoints && Array.isArray((solution as any).keyPoints) && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-700 mb-1">关键点：</p>
                                      <ul className="text-xs text-gray-600 space-y-0.5 ml-3">
                                        {(solution as any).keyPoints.map((point: string, pointIndex: number) => (
                                          <li key={pointIndex} className="list-disc">
                                            <ErrorBoundary>
                                              <MarkdownRenderer content={point} compact={true} />
                                            </ErrorBoundary>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">
                                  无效的答题方案
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-3 text-sm">
                    {currentQuestion ? '暂无答题方案' : '请先添加题目'}
                  </p>
                )}
              </ErrorBoundary>
            </div>
          </div>

          {/* AI聊天区域 */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-3 md:p-4 sticky top-6">
              <div className="flex items-center mb-3">
                <ChatBubbleLeftRightIcon className="h-4 w-4 md:h-5 md:w-5 mr-2 text-green-500" />
                <h3 className="text-sm md:text-base font-semibold text-gray-900">AI助手</h3>
              </div>
              
              {/* 问题计数提示 */}
              {questionCount > 0 && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-700">
                      已提问 {questionCount} 次
                    </span>
                    <span className="text-blue-600">
                      {questionCount < 3 ? `再问 ${3 - questionCount} 次更新答题方案` : '即将更新答题方案'}
                    </span>
                  </div>
                  <div className="mt-1 bg-blue-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${(questionCount / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* 聊天消息 */}
              <div className="h-80 md:h-96 xl:h-[32rem] overflow-y-auto mb-3 border rounded-lg p-2 md:p-3 bg-gray-50">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-6">
                  <p className="text-sm">AI助手准备就绪</p>
                  <p className="text-xs mt-1">有问题随时问我！</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-3 py-2 rounded-lg text-xs ${
                        message.type === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : message.type === 'ai'
                          ? 'bg-white border'
                          : 'bg-yellow-100 border border-yellow-300'
                      }`}>
                        <ErrorBoundary>
                          <MarkdownRenderer content={message.content} compact={true} />
                        </ErrorBoundary>
                        <p className="text-xs mt-1 opacity-60">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {/* 输入框 */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                placeholder="输入问题..."
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                disabled={isLoading || !currentQuestion}
              />
              <button
                onClick={handleAIChat}
                disabled={isLoading || !chatInput.trim() || !currentQuestion}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs w-full sm:w-auto"
              >
                发送
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 知识点详情弹窗 */}
      {selectedKnowledgePoint && currentQuestion && (
        <KnowledgePointDetail
          knowledgePoint={selectedKnowledgePoint}
          subject={currentQuestion.subject || currentSubject?.name || '数学'}
          onClose={() => setSelectedKnowledgePoint(null)}
          onAddToChat={async (content) => {
            // 添加用户消息到聊天记录
            const userMessage: ChatMessage = {
              id: Date.now().toString(),
              type: 'user',
              content,
              timestamp: new Date()
            }
            setChatMessages(prev => [...prev, userMessage])
            
            // 触发AI响应
            setIsLoading(true)
            
            try {
              const requestBody = {
                message: content,
                questionContext: {
                  content: currentQuestion.content,
                  subject: currentQuestion.subject,
                  difficulty: currentQuestion.difficulty,
                  options: currentQuestion.options || [],
                  knowledgePoints: currentQuestion.knowledgePoints || [],
                  correctAnswer: currentQuestion.correctAnswer,
                  explanation: currentQuestion.explanation,
                  subjectContext: {
                    isSubjectSelected: !!currentSubject,
                    currentSubject: currentSubject?.name || currentQuestion.subject
                  }
                },
                chatHistory: [...chatMessages, userMessage],
                imageData: currentQuestion.imageData,
                mimeType: currentQuestion.mimeType
              }
              
              const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
              })

              if (!response.ok) {
                throw new Error('AI服务暂时不可用')
              }

              const data = await response.json()
              
              const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: data.response,
                timestamp: new Date()
              }

              setChatMessages(prev => [...prev, aiMessage])
            } catch (error) {
              console.error('AI聊天失败:', error)
              const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'system',
                content: 'AI助手暂时无法回应，请稍后再试。',
                timestamp: new Date()
              }
              setChatMessages(prev => [...prev, errorMessage])
            } finally {
              setIsLoading(false)
            }
          }}
        />
      )}
    </div>
  )
}

export default StudyPage