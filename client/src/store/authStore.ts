import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  school?: string
  grade?: string
  subjects?: string[]
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  
  login: (user: User, token: string) => {
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    })
    // 保存到localStorage
    localStorage.setItem('auth-storage', JSON.stringify({ user, token, isAuthenticated: true }))
  },
  
  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
    // 清除localStorage
    localStorage.removeItem('auth-storage')
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },
  
  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData }
      set({ user: updatedUser })
      // 更新localStorage
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const parsedStored = JSON.parse(stored)
        localStorage.setItem('auth-storage', JSON.stringify({ ...parsedStored, user: updatedUser }))
      }
    }
  },
}))

// 初始化时从localStorage恢复状态
const stored = localStorage.getItem('auth-storage')
if (stored) {
  try {
    const { user, token, isAuthenticated } = JSON.parse(stored)
    useAuthStore.setState({ user, token, isAuthenticated })
  } catch (error) {
    console.error('Failed to parse stored auth data:', error)
    localStorage.removeItem('auth-storage')
  }
}