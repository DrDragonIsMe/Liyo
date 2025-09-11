import React, { useEffect, useRef, useState } from 'react'
import { useSubjectStore } from '../store/subjectStore'
import { useKnowledgeGraphStore, KnowledgePoint, Connection } from '../store/knowledgeGraphStore'
import ContextMenu from './ContextMenu'
import KnowledgePointModal from './KnowledgePointModal'

// 图例项接口
interface LegendItem {
  color: string
  label: string
  description: string
}

const KnowledgeGraph: React.FC = () => {
  const { currentSubject } = useSubjectStore()
  const {
    getKnowledgePoints,
    getConnections,
    addKnowledgePoint,
    updateKnowledgePoint,
    deleteKnowledgePoint,
    initializeSubject,
    subjectGraphs
  } = useKnowledgeGraphStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedPoint, setSelectedPoint] = useState<KnowledgePoint | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<KnowledgePoint | null>(null)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, target: 'canvas' as 'node' | 'canvas', nodeId: '' })
  const [modal, setModal] = useState({ isOpen: false, mode: 'add' as 'add' | 'edit', knowledgePoint: null as KnowledgePoint | null })
  
  // 获取当前学科的知识点和连接关系
  const knowledgePoints = currentSubject ? getKnowledgePoints(currentSubject.name) : []
  const connections = currentSubject ? getConnections(currentSubject.name) : []
  
  // 添加调试日志
  useEffect(() => {
    if (currentSubject) {
      console.log(`知识图谱 - 当前学科: ${currentSubject.name}, 知识点数量: ${knowledgePoints.length}`)
      console.log('知识点列表:', knowledgePoints.map(kp => kp.name))
    }
  }, [currentSubject, knowledgePoints])

  // 图例配置 - 知识突破状态
  const legend: LegendItem[] = [
    { color: '#10B981', label: '已掌握', description: '知识突破完成，掌握程度高' },
    { color: '#3B82F6', label: '进步中', description: '正在突破，有一定掌握' },
    { color: '#F59E0B', label: '学习中', description: '开始学习，需要加强' },
    { color: '#9CA3AF', label: '未开始', description: '尚未开始学习' }
  ]

  // 根据知识突破状态获取颜色
  const getBreakthroughColor = (point: KnowledgePoint): string => {
    // 如果有breakthroughStatus字段，使用新的状态系统
    if (point.breakthroughStatus) {
      switch (point.breakthroughStatus) {
        case 'mastered': return '#10B981' // 绿色：已掌握
        case 'progressing': return '#3B82F6' // 蓝色：进步中
        case 'learning': return '#F59E0B' // 橙色：学习中
        case 'not_started': return '#9CA3AF' // 灰色：未开始
        default: return '#9CA3AF'
      }
    }
    
    // 兼容旧的掌握程度系统
    if (point.examCount === 0) return '#9CA3AF' // 灰色：未考核
    const accuracy = point.examCount > 0 ? (point.correctCount / point.examCount) * 100 : 0
    
    if (accuracy >= 90) return '#10B981' // 绿色：已掌握
    if (accuracy >= 50) return '#F59E0B' // 橙色：待巩固
    return '#1F2937' // 黑色：需加强
  }



  // 使用力导向算法布局知识点
  const layoutPoints = (points: KnowledgePoint[], connections: Connection[]): KnowledgePoint[] => {
    const canvas = canvasRef.current
    if (!canvas) return points
    
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    
    // 初始化位置（圆形布局）
    const radius = Math.min(width, height) * 0.3
    const layoutPoints = points.map((point, index) => {
      const angle = (index / points.length) * 2 * Math.PI
      return {
        ...point,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      }
    })
    
    // 简单的力导向布局迭代
    for (let iteration = 0; iteration < 50; iteration++) {
      layoutPoints.forEach(point => {
        let fx = 0, fy = 0
        
        // 排斥力
        layoutPoints.forEach(other => {
          if (point.id !== other.id) {
            const dx = point.x - other.x
            const dy = point.y - other.y
            const distance = Math.sqrt(dx * dx + dy * dy) || 1
            const force = 1000 / (distance * distance)
            fx += (dx / distance) * force
            fy += (dy / distance) * force
          }
        })
        
        // 吸引力（连接的点之间）
        connections.forEach(conn => {
          if (conn.source === point.id) {
            const target = layoutPoints.find(p => p.id === conn.target)
            if (target) {
              const dx = target.x - point.x
              const dy = target.y - point.y
              const distance = Math.sqrt(dx * dx + dy * dy) || 1
              const force = distance * 0.01 * conn.strength
              fx += (dx / distance) * force
              fy += (dy / distance) * force
            }
          }
        })
        
        // 更新位置
        point.x += fx * 0.01
        point.y += fy * 0.01
        
        // 边界约束
        point.x = Math.max(50, Math.min(width - 50, point.x))
        point.y = Math.max(50, Math.min(height - 50, point.y))
      })
    }
    
    return layoutPoints
  }

  // 绘制图谱
  const drawGraph = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制连接线
    connections.forEach(conn => {
      const fromPoint = knowledgePoints.find(p => p.id === conn.source)
      const toPoint = knowledgePoints.find(p => p.id === conn.target)
      
      if (fromPoint && toPoint) {
        ctx.beginPath()
        ctx.moveTo(fromPoint.x, fromPoint.y)
        ctx.lineTo(toPoint.x, toPoint.y)
        ctx.strokeStyle = `rgba(156, 163, 175, ${conn.strength})`
        ctx.lineWidth = Math.max(1, conn.strength * 3)
        ctx.stroke()
      }
    })
    
    // 绘制知识点
    knowledgePoints.forEach(point => {
      const isSelected = selectedPoint?.id === point.id
      const isHovered = hoveredPoint?.id === point.id
      const radius = isSelected || isHovered ? 25 : 20
      
      // 绘制圆形背景
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = getBreakthroughColor(point)
      ctx.fill()
      
      // 绘制边框
      if (isSelected || isHovered) {
        ctx.strokeStyle = '#3B82F6'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      
      // 如果有知识突破状态，绘制状态指示器
      if (point.breakthroughStatus === 'mastered') {
        // 绘制完成标记
        ctx.beginPath()
        ctx.arc(point.x + radius - 8, point.y - radius + 8, 6, 0, 2 * Math.PI)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
        ctx.strokeStyle = '#10B981'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // 绘制勾号
        ctx.beginPath()
        ctx.moveTo(point.x + radius - 10, point.y - radius + 8)
        ctx.lineTo(point.x + radius - 8, point.y - radius + 10)
        ctx.lineTo(point.x + radius - 6, point.y - radius + 6)
        ctx.strokeStyle = '#10B981'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      
      // 绘制文字
      ctx.fillStyle = point.examCount === 0 ? '#374151' : '#FFFFFF'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // 文字换行处理
      const words = point.name.split('')
      if (words.length > 4) {
        const line1 = words.slice(0, 4).join('')
        const line2 = words.slice(4).join('')
        ctx.fillText(line1, point.x, point.y - 6)
        ctx.fillText(line2, point.x, point.y + 6)
      } else {
        ctx.fillText(point.name, point.x, point.y)
      }
    })
  }

  // 处理知识点操作
  const handleAddKnowledgePoint = (newPoint: Omit<KnowledgePoint, 'id' | 'x' | 'y' | 'subject' | 'connections' | 'masteryLevel' | 'examCount' | 'correctCount'>) => {
    if (!currentSubject) return
    
    addKnowledgePoint(currentSubject.name, {
      ...newPoint,
      subject: currentSubject.name,
      masteryLevel: 0,
      examCount: 0,
      correctCount: 0,
      connections: [],
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150
    })
  }

  const handleEditKnowledgePoint = (updatedPoint: Omit<KnowledgePoint, 'id' | 'x' | 'y' | 'subject' | 'connections' | 'masteryLevel' | 'examCount' | 'correctCount'>) => {
    if (!modal.knowledgePoint || !currentSubject) return
    updateKnowledgePoint(currentSubject.name, modal.knowledgePoint.id, updatedPoint)
  }

  const handleDeleteKnowledgePoint = (nodeId: string) => {
    if (!currentSubject) return
    deleteKnowledgePoint(currentSubject.name, nodeId)
  }

  const handleContextMenu = (event: React.MouseEvent, target: 'node' | 'canvas', nodeId?: string) => {
    event.preventDefault()
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      target,
      nodeId: nodeId || ''
    })
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const openModal = (mode: 'add' | 'edit', knowledgePoint?: KnowledgePoint) => {
    setModal({ isOpen: true, mode, knowledgePoint: knowledgePoint || null })
    closeContextMenu()
  }

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add', knowledgePoint: null })
  }

  // 处理鼠标事件
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // 查找点击的知识点
    const clickedPoint = knowledgePoints.find(point => {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
      return distance <= 25
    })
    
    setSelectedPoint(clickedPoint || null)
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // 查找悬停的知识点
    const hoveredPoint = knowledgePoints.find(point => {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
      return distance <= 25
    })
    
    setHoveredPoint(hoveredPoint || null)
    canvas.style.cursor = hoveredPoint ? 'pointer' : 'default'
  }

  const handleCanvasContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // 查找右键点击的知识点
    const clickedPoint = knowledgePoints.find(point => {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
      return distance <= 25
    })
    
    if (clickedPoint) {
      handleContextMenu(event, 'node', clickedPoint.id)
    } else {
      handleContextMenu(event, 'canvas')
    }
  }

  // 初始化数据
  useEffect(() => {
    if (currentSubject) {
      initializeSubject(currentSubject.name)
    }
  }, [currentSubject, initializeSubject])

  // 绘制图谱
  useEffect(() => {
    // 总是尝试绘制图谱，即使没有知识点也要清空画布
    drawGraph()
  }, [knowledgePoints, connections, selectedPoint, hoveredPoint, currentSubject])

  // 画布尺寸调整
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const resizeCanvas = () => {
        const container = canvas.parentElement
        if (container) {
          canvas.width = container.clientWidth
          canvas.height = 600
          
          // 重新布局
          if (knowledgePoints.length > 0 && currentSubject) {
          const layoutedPoints = layoutPoints(knowledgePoints, connections)
          // 使用store方法更新位置
          layoutedPoints.forEach(point => {
            updateKnowledgePoint(currentSubject.name, point.id, {
              x: point.x,
              y: point.y
            })
          })
        }
        }
      }
      
      resizeCanvas()
      window.addEventListener('resize', resizeCanvas)
      return () => window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  if (!currentSubject) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">请先选择一个学科查看知识图谱</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">{currentSubject.icon}</span>
              {currentSubject.name} 知识图谱
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              可视化展示知识点掌握情况和关联关系
            </p>
          </div>
          
          {/* 图例 */}
          <div className="flex items-center space-x-4">
            {legend.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-gray-500 text-xs">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 图谱画布 */}
      <div className="p-6">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onContextMenu={handleCanvasContextMenu}
            className="border border-gray-200 rounded-lg w-full"
          />
          
          {/* 选中知识点的详细信息 */}
          {selectedPoint && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedPoint.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">考核次数：</span>
                  <span className="font-medium">{selectedPoint.examCount} 次</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">正确次数：</span>
                  <span className="font-medium">{selectedPoint.correctCount} 次</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">正确率：</span>
                  <span className="font-medium">
                    {selectedPoint.examCount > 0 
                      ? `${Math.round((selectedPoint.correctCount / selectedPoint.examCount) * 100)}%`
                      : '未考核'
                    }
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-600">掌握状态：</span>
                  <span 
                    className="ml-2 px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getBreakthroughColor(selectedPoint) }}
                  >
                    {selectedPoint.examCount === 0 ? '未考核' :
                     (selectedPoint.correctCount / selectedPoint.examCount) >= 0.9 ? '已掌握' :
                     (selectedPoint.correctCount / selectedPoint.examCount) >= 0.5 ? '待巩固' : '需加强'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右键菜单 */}
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          visible={contextMenu.visible}
          target={contextMenu.target}
          onClose={closeContextMenu}
          onAdd={() => openModal('add')}
          onEdit={() => {
            const kp = knowledgePoints.find(k => k.id === contextMenu.nodeId)
            if (kp) openModal('edit', kp)
          }}
          onDelete={() => {
            if (contextMenu.nodeId) {
              handleDeleteKnowledgePoint(contextMenu.nodeId)
              closeContextMenu()
            }
          }}
        />

        {/* 知识点编辑弹窗 */}
        <KnowledgePointModal
           isOpen={modal.isOpen}
           mode={modal.mode}
           knowledgePoint={modal.knowledgePoint || undefined}
           onClose={closeModal}
           onSave={modal.mode === 'add' ? handleAddKnowledgePoint : handleEditKnowledgePoint}
         />
      </div>
    </div>
  )
}

export default KnowledgeGraph