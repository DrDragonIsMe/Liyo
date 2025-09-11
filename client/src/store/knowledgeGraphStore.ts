import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface KnowledgePoint {
  id: string
  name: string
  description?: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  subject: string
  masteryLevel: number
  examCount: number
  correctCount: number
  connections: string[]
  x: number
  y: number
  breakthroughStatus?: 'mastered' | 'progressing' | 'learning' | 'not_started'
  solutionCount?: number
}

export interface Connection {
  source: string
  target: string
  strength: number
}

interface SubjectKnowledgeGraph {
  knowledgePoints: KnowledgePoint[]
  connections: Connection[]
  lastUpdated: number
}

interface KnowledgeGraphState {
  // 学科特定的知识图谱数据
  subjectGraphs: Record<string, SubjectKnowledgeGraph>
  
  // 获取指定学科的知识点
  getKnowledgePoints: (subject: string) => KnowledgePoint[]
  
  // 获取指定学科的连接关系
  getConnections: (subject: string) => Connection[]
  
  // 添加知识点
  addKnowledgePoint: (subject: string, knowledgePoint: Omit<KnowledgePoint, 'id'>) => void
  
  // 更新知识点
  updateKnowledgePoint: (subject: string, id: string, updates: Partial<KnowledgePoint>) => void
  
  // 删除知识点
  deleteKnowledgePoint: (subject: string, id: string) => void
  
  // 添加连接关系
  addConnection: (subject: string, connection: Connection) => void
  
  // 删除连接关系
  removeConnection: (subject: string, sourceId: string, targetId: string) => void
  
  // 批量添加知识点
  addKnowledgePoints: (subject: string, knowledgePoints: Omit<KnowledgePoint, 'id'>[]) => void
  
  // 从API加载知识点数据
  loadKnowledgePointsFromAPI: (subject: string) => Promise<void>
  
  // 初始化学科数据
  initializeSubject: (subject: string) => void
  
  // 强制刷新学科数据
  refreshSubjectData: (subject: string) => Promise<void>
  
  // 清空学科数据
  clearSubjectData: (subject: string) => void
  
  // 同步新的知识点到知识图谱
  syncNewKnowledgePoints: (subject: string, knowledgePointNames: string[]) => Promise<void>
  
  // 更新知识点的解题方案数量
  updateKnowledgePointSolutions: (subject: string, knowledgePointName: string) => void
}

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 默认知识点数据生成函数
const generateDefaultKnowledgePoints = (subject: string): KnowledgePoint[] => {
  const mathPoints = [
    { name: '函数与方程', masteryLevel: 85, examCount: 12, correctCount: 10, connections: ['导数与微分', '积分学'], solutionCount: 3 },
    { name: '导数与微分', masteryLevel: 72, examCount: 15, correctCount: 11, connections: ['函数与方程', '积分学'], solutionCount: 2 },
    { name: '积分学', masteryLevel: 68, examCount: 10, correctCount: 7, connections: ['函数与方程', '导数与微分'], solutionCount: 1 },
    { name: '数列与级数', masteryLevel: 90, examCount: 8, correctCount: 8, connections: ['极限理论'], solutionCount: 4 },
    { name: '极限理论', masteryLevel: 75, examCount: 6, correctCount: 5, connections: ['数列与级数'], solutionCount: 0 }
  ]

  const physicsPoints = [
    { name: '力学基础', masteryLevel: 80, examCount: 14, correctCount: 11, connections: ['运动学', '动力学'], solutionCount: 2 },
    { name: '运动学', masteryLevel: 88, examCount: 10, correctCount: 9, connections: ['力学基础', '动力学'], solutionCount: 3 },
    { name: '动力学', masteryLevel: 65, examCount: 12, correctCount: 8, connections: ['力学基础', '运动学'], solutionCount: 1 },
    { name: '电磁学', masteryLevel: 70, examCount: 8, correctCount: 6, connections: ['电路分析'], solutionCount: 2 },
    { name: '电路分析', masteryLevel: 82, examCount: 9, correctCount: 7, connections: ['电磁学'], solutionCount: 0 }
  ]

  const points = subject === '数学' ? mathPoints : physicsPoints
  
  // 计算知识突破状态
  const calculateBreakthroughStatus = (point: any) => {
    if (point.solutionCount >= 3 && point.masteryLevel > 80) {
      return 'mastered'
    } else if (point.solutionCount >= 2 || point.masteryLevel > 70) {
      return 'progressing'
    } else if (point.solutionCount >= 1 || point.masteryLevel > 50) {
      return 'learning'
    } else {
      return 'not_started'
    }
  }
  
  return points.map((point, index) => ({
    id: `${subject}-${index}`,
    name: point.name,
    description: `${point.name}相关知识点`,
    difficulty: point.masteryLevel > 80 ? 'easy' as const : point.masteryLevel > 50 ? 'medium' as const : 'hard' as const,
    category: subject === '数学' ? '基础数学' : '基础物理',
    subject,
    masteryLevel: point.masteryLevel,
    examCount: point.examCount,
    correctCount: point.correctCount,
    connections: point.connections.map(conn => `${subject}-${mathPoints.findIndex(p => p.name === conn)}`).filter(id => id.includes('-') && !id.endsWith('--1')),
    x: 0,
    y: 0,
    breakthroughStatus: calculateBreakthroughStatus(point),
    solutionCount: point.solutionCount
  }))
}

// 生成默认连接关系
const generateDefaultConnections = (knowledgePoints: KnowledgePoint[]): Connection[] => {
  const connections: Connection[] = []
  
  knowledgePoints.forEach(point => {
    point.connections.forEach(targetId => {
      const target = knowledgePoints.find(p => p.id === targetId)
      if (target) {
        connections.push({
          source: point.id,
          target: targetId,
          strength: Math.random() * 0.5 + 0.5
        })
      }
    })
  })
  
  return connections
}

export const useKnowledgeGraphStore = create<KnowledgeGraphState>()(persist(
  (set, get) => ({
    subjectGraphs: {},
    
    getKnowledgePoints: (subject: string) => {
      const graph = get().subjectGraphs[subject]
      return graph?.knowledgePoints || []
    },
    
    getConnections: (subject: string) => {
      const graph = get().subjectGraphs[subject]
      return graph?.connections || []
    },
    
    addKnowledgePoint: (subject: string, knowledgePointData) => {
      set(state => {
        const graph = state.subjectGraphs[subject] || { knowledgePoints: [], connections: [], lastUpdated: Date.now() }
        const newKnowledgePoint: KnowledgePoint = {
          ...knowledgePointData,
          id: generateId(),
          subject
        }
        
        return {
          subjectGraphs: {
            ...state.subjectGraphs,
            [subject]: {
              ...graph,
              knowledgePoints: [...graph.knowledgePoints, newKnowledgePoint],
              lastUpdated: Date.now()
            }
          }
        }
      })
    },
    
    updateKnowledgePoint: (subject: string, id: string, updates) => {
      set(state => {
        const graph = state.subjectGraphs[subject]
        if (!graph) return state
        
        return {
          subjectGraphs: {
            ...state.subjectGraphs,
            [subject]: {
              ...graph,
              knowledgePoints: graph.knowledgePoints.map(point => 
                point.id === id ? { ...point, ...updates } : point
              ),
              lastUpdated: Date.now()
            }
          }
        }
      })
    },
    
    deleteKnowledgePoint: (subject: string, id: string) => {
      set(state => {
        const graph = state.subjectGraphs[subject]
        if (!graph) return state
        
        // 删除知识点和相关连接
        const filteredConnections = graph.connections.filter(
          conn => conn.source !== id && conn.target !== id
        )
        
        return {
          subjectGraphs: {
            ...state.subjectGraphs,
            [subject]: {
              ...graph,
              knowledgePoints: graph.knowledgePoints.filter(point => point.id !== id),
              connections: filteredConnections,
              lastUpdated: Date.now()
            }
          }
        }
      })
    },
    
    addConnection: (subject: string, connection) => {
      set(state => {
        const graph = state.subjectGraphs[subject] || { knowledgePoints: [], connections: [], lastUpdated: Date.now() }
        
        return {
          subjectGraphs: {
            ...state.subjectGraphs,
            [subject]: {
              ...graph,
              connections: [...graph.connections, connection],
              lastUpdated: Date.now()
            }
          }
        }
      })
    },
    
    removeConnection: (subject: string, sourceId: string, targetId: string) => {
      set(state => {
        const graph = state.subjectGraphs[subject]
        if (!graph) return state
        
        return {
          subjectGraphs: {
            ...state.subjectGraphs,
            [subject]: {
              ...graph,
              connections: graph.connections.filter(
                conn => !(conn.source === sourceId && conn.target === targetId)
              ),
              lastUpdated: Date.now()
            }
          }
        }
      })
    },
    
    addKnowledgePoints: (subject: string, knowledgePointsData) => {
      set(state => {
        const graph = state.subjectGraphs[subject] || { knowledgePoints: [], connections: [], lastUpdated: Date.now() }
        const newKnowledgePoints = knowledgePointsData.map(data => ({
          ...data,
          id: generateId(),
          subject
        }))
        
        return {
          subjectGraphs: {
            ...state.subjectGraphs,
            [subject]: {
              ...graph,
              knowledgePoints: [...graph.knowledgePoints, ...newKnowledgePoints],
              lastUpdated: Date.now()
            }
          }
        }
      })
    },
    
    loadKnowledgePointsFromAPI: async (subject: string) => {
      try {
        const response = await fetch(`/api/knowledge-points/list?subject=${encodeURIComponent(subject)}`)
        if (!response.ok) {
          throw new Error('Failed to fetch knowledge points')
        }
        
        const data = await response.json()
        if (data.success && data.data) {
          // 处理按学科分组的数据
          const subjectData = data.data[subject] || []
          const apiKnowledgePoints = subjectData.map((kp: any, index: number) => ({
            name: kp.name,
            description: kp.definition || `${kp.name}相关知识点`,
            difficulty: kp.difficulty === '基础' ? 'easy' as const : 
                       kp.difficulty === '进阶' ? 'medium' as const : 'hard' as const,
            category: subject === '数学' ? '基础数学' : subject === '物理' ? '基础物理' : subject === '化学' ? '基础化学' : '其他',
            subject: subject,
            masteryLevel: kp.examProbability || 0,
            examCount: 0,
            correctCount: 0,
            connections: kp.relatedConcepts || [],
            x: Math.random() * 400 + 200,
            y: Math.random() * 300 + 150,
            breakthroughStatus: kp.breakthroughStatus || 'not_started',
            solutionCount: kp.solutionCount || 0
          }))
          
          set(state => {
            const knowledgePoints = apiKnowledgePoints.map((data: any) => ({
              ...data,
              id: generateId()
            }))
            
            const connections = generateDefaultConnections(knowledgePoints)
            
            return {
              subjectGraphs: {
                ...state.subjectGraphs,
                [subject]: {
                  knowledgePoints,
                  connections,
                  lastUpdated: Date.now()
                }
              }
            }
          })
        }
      } catch (error) {
        console.error('Failed to load knowledge points from API:', error)
        // 如果API失败，使用默认数据
        const defaultKnowledgePoints = generateDefaultKnowledgePoints(subject)
        const defaultConnections = generateDefaultConnections(defaultKnowledgePoints)
        
        set(state => ({
          subjectGraphs: {
            ...state.subjectGraphs,
            [subject]: {
              knowledgePoints: defaultKnowledgePoints,
              connections: defaultConnections,
              lastUpdated: Date.now()
            }
          }
        }))
      }
    },
    
    initializeSubject: (subject: string) => {
      const state = get()
      if (state.subjectGraphs[subject]) return
      
      // 异步加载知识点数据
      state.loadKnowledgePointsFromAPI(subject)
    },
    
    refreshSubjectData: async (subject: string) => {
      const state = get()
      // 强制重新加载知识点数据
      await state.loadKnowledgePointsFromAPI(subject)
    },
    
    clearSubjectData: (subject: string) => {
      set(state => {
        const { [subject]: removed, ...remainingGraphs } = state.subjectGraphs
        return {
          subjectGraphs: remainingGraphs
        }
      })
    },
    
    // 同步新的知识点到知识图谱
    syncNewKnowledgePoints: async (subject: string, knowledgePointNames: string[]) => {
      if (!knowledgePointNames || knowledgePointNames.length === 0) return
      
      const state = get()
      const currentGraph = state.subjectGraphs[subject] || { knowledgePoints: [], connections: [], lastUpdated: Date.now() }
      
      // 检查哪些知识点是新的
      const existingNames = currentGraph.knowledgePoints.map(kp => kp.name)
      const newKnowledgePointNames = knowledgePointNames.filter(name => !existingNames.includes(name))
      
      if (newKnowledgePointNames.length === 0) return
      
      // 创建新的知识点对象
      const newKnowledgePoints = newKnowledgePointNames.map(name => ({
        id: generateId(),
        name,
        description: `${name}相关知识点`,
        difficulty: 'medium' as const,
        category: subject === '数学' ? '基础数学' : subject === '物理' ? '基础物理' : subject === '化学' ? '基础化学' : '其他',
        subject,
        masteryLevel: 0,
        examCount: 0,
        correctCount: 0,
        connections: [],
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 150,
        breakthroughStatus: 'not_started' as const,
        solutionCount: 0
      }))
      
      // 添加到知识图谱
      set(state => ({
        subjectGraphs: {
          ...state.subjectGraphs,
          [subject]: {
            ...currentGraph,
            knowledgePoints: [...currentGraph.knowledgePoints, ...newKnowledgePoints],
            lastUpdated: Date.now()
          }
        }
      }))
      
      console.log(`已添加 ${newKnowledgePoints.length} 个新知识点到${subject}学科图谱`)
     },
     
     // 更新知识点的解题方案数量
     updateKnowledgePointSolutions: (subject: string, knowledgePointName: string) => {
       set(state => {
         const currentGraph = state.subjectGraphs[subject]
         if (!currentGraph) return state
         
         const updatedKnowledgePoints = currentGraph.knowledgePoints.map(kp => {
           if (kp.name === knowledgePointName) {
             return {
               ...kp,
               solutionCount: (kp.solutionCount || 0) + 1
             }
           }
           return kp
         })
         
         return {
           subjectGraphs: {
             ...state.subjectGraphs,
             [subject]: {
               ...currentGraph,
               knowledgePoints: updatedKnowledgePoints,
               lastUpdated: Date.now()
             }
           }
         }
       })
       
       console.log(`已更新${subject}学科中${knowledgePointName}的解题方案数量`)
     }
  }),
  {
    name: 'knowledge-graph-storage',
    version: 1
  }
))