import { create } from 'zustand'

// 学科类型定义
export type Subject = {
  id: string
  name: string
  icon: string
  color: string
  description: string
}

// 预定义的学科
export const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: '数学',
    icon: '📐',
    color: 'blue',
    description: '数学学科学习'
  },
  {
    id: 'physics',
    name: '物理',
    icon: '⚛️',
    color: 'purple',
    description: '物理学科学习'
  },
  {
    id: 'chemistry',
    name: '化学',
    icon: '🧪',
    color: 'green',
    description: '化学学科学习'
  },
  {
    id: 'history',
    name: '历史',
    icon: '📜',
    color: 'amber',
    description: '历史学科学习'
  },
  {
    id: 'politics',
    name: '政治',
    icon: '🏛️',
    color: 'red',
    description: '政治学科学习'
  },
  {
    id: 'geography',
    name: '地理',
    icon: '🌍',
    color: 'teal',
    description: '地理学科学习'
  },
  {
    id: 'biology',
    name: '生物',
    icon: '🧬',
    color: 'emerald',
    description: '生物学科学习'
  },
  {
    id: 'chinese',
    name: '语文',
    icon: '📚',
    color: 'rose',
    description: '语文学科学习'
  },
  {
    id: 'english',
    name: '英语',
    icon: '🌐',
    color: 'indigo',
    description: '英语学科学习'
  }
]

interface SubjectState {
  currentSubject: Subject | null
  subjects: Subject[]
  setCurrentSubject: (subject: Subject | null) => void
  getSubjectById: (id: string) => Subject | undefined
  isSubjectSelected: boolean
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  currentSubject: null,
  subjects: SUBJECTS,
  isSubjectSelected: false,
  
  setCurrentSubject: (subject: Subject | null) => {
    set({
      currentSubject: subject,
      isSubjectSelected: subject !== null
    })
    // 保存到localStorage
    if (subject) {
      localStorage.setItem('current-subject', JSON.stringify(subject))
    } else {
      localStorage.removeItem('current-subject')
    }
  },
  
  getSubjectById: (id: string) => {
    return get().subjects.find(subject => subject.id === id)
  }
}))

// 初始化时从localStorage恢复状态
const stored = localStorage.getItem('current-subject')
if (stored) {
  try {
    const subject = JSON.parse(stored)
    useSubjectStore.getState().setCurrentSubject(subject)
  } catch (error) {
    console.error('Failed to parse stored subject:', error)
    localStorage.removeItem('current-subject')
  }
}