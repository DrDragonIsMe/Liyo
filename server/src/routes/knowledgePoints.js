import express from 'express'
import { body, validationResult } from 'express-validator'
import Question from '../models/Question.js'
import KnowledgePoint from '../models/KnowledgePoint.js'
import aiService from '../services/aiService.js'
import webSearchService from '../services/webSearchService.js'
import iconv from 'iconv-lite'
const router = express.Router()

// 人教版教材知识点定义数据库（模拟数据）
const textbookDefinitions = {
  '数学': {
    '导数': {
      definition: '导数是函数在某一点处的瞬时变化率，反映了函数在该点附近的变化趋势。对于函数f(x)，在点x₀处的导数定义为：f\'(x₀) = lim[h→0] [f(x₀+h) - f(x₀)]/h',
      relatedConcepts: ['极限', '微分', '切线斜率', '变化率']
    },
    '三角函数': {
      definition: '三角函数是以角度（数学上最常用弧度制，下同）为自变量，角度对应任意角终边与单位圆交点坐标或其比值为因变量的函数。常见的三角函数包括正弦函数、余弦函数和正切函数。',
      relatedConcepts: ['单位圆', '弧度制', '周期函数', '三角恒等式']
    },
    '立体几何': {
      definition: '立体几何是研究三维空间中几何图形的性质、关系和度量的数学分支。主要研究点、线、面在空间中的位置关系，以及各种立体图形的体积和表面积。',
      relatedConcepts: ['空间向量', '平行关系', '垂直关系', '体积公式']
    }
  },
  '物理': {
    '电磁感应': {
      definition: '电磁感应是指放在变化磁通量中的导体，会产生电动势。此电动势称为感应电动势或感生电动势，若将此导体闭合成一回路，则该电动势会驱使电子流动，形成感应电流。',
      relatedConcepts: ['磁通量', '法拉第定律', '楞次定律', '自感现象']
    },
    '力学综合': {
      definition: '力学综合是指运用牛顿运动定律、动量定理、动能定理、机械能守恒定律等力学基本规律，综合分析和解决复杂力学问题的方法。',
      relatedConcepts: ['牛顿定律', '动量守恒', '能量守恒', '圆周运动']
    },
    '光学': {
      definition: '光学是研究光的传播规律及光与物质相互作用的物理学分支。包括几何光学（研究光的直线传播、反射、折射）和波动光学（研究光的干涉、衍射、偏振）。',
      relatedConcepts: ['折射定律', '全反射', '光的干涉', '光的衍射']
    }
  },
  '化学': {
    '化学平衡': {
      definition: '化学平衡是指在一定条件下的可逆反应中，正反应速率与逆反应速率相等，反应混合物中各组分的浓度保持不变的状态。',
      relatedConcepts: ['平衡常数', '勒夏特列原理', '反应速率', '浓度商']
    },
    '有机化学': {
      definition: '有机化学是研究有机化合物的组成、结构、性质、制备方法与应用的化学分支。有机化合物是指含碳的化合物（一氧化碳、二氧化碳、碳酸盐等除外）。',
      relatedConcepts: ['官能团', '同分异构', '取代反应', '加成反应']
    }
  }
}

// 模拟高考真题数据
const examQuestionsData = {
  '导数': [
    { year: 2023, subject: '数学', questionType: '选择题', content: '已知函数f(x)=x³-3x²+2，求f\'(1)的值', difficulty: '中等' },
    { year: 2022, subject: '数学', questionType: '解答题', content: '利用导数研究函数y=x²e^(-x)的单调性', difficulty: '困难' },
    { year: 2021, subject: '数学', questionType: '填空题', content: '曲线y=x³在点(1,1)处的切线方程为______', difficulty: '简单' },
    { year: 2020, subject: '数学', questionType: '选择题', content: '函数f(x)=ln(x)+x²的导数为', difficulty: '简单' },
    { year: 2019, subject: '数学', questionType: '解答题', content: '已知f(x)=ax³+bx²+cx+d，利用导数求其极值', difficulty: '困难' }
  ],
  '三角函数': [
    { year: 2023, subject: '数学', questionType: '选择题', content: 'sin(π/6)的值为', difficulty: '简单' },
    { year: 2022, subject: '数学', questionType: '解答题', content: '已知sinα+cosα=1/2，求sin2α的值', difficulty: '中等' },
    { year: 2021, subject: '数学', questionType: '填空题', content: '函数y=2sin(2x+π/3)的周期为______', difficulty: '简单' },
    { year: 2020, subject: '数学', questionType: '选择题', content: '化简sin²x+cos²x的结果', difficulty: '简单' }
  ],
  '电磁感应': [
    { year: 2023, subject: '物理', questionType: '选择题', content: '根据法拉第电磁感应定律，感应电动势的大小与什么成正比', difficulty: '中等' },
    { year: 2022, subject: '物理', questionType: '计算题', content: '矩形线圈在匀强磁场中转动产生的感应电动势', difficulty: '困难' },
    { year: 2021, subject: '物理', questionType: '实验题', content: '探究影响感应电流方向的因素', difficulty: '中等' }
  ],
  '化学平衡': [
    { year: 2023, subject: '化学', questionType: '选择题', content: '对于反应2SO₂+O₂⇌2SO₃，增大压强对平衡的影响', difficulty: '中等' },
    { year: 2022, subject: '化学', questionType: '计算题', content: '根据平衡常数计算各组分的平衡浓度', difficulty: '困难' },
    { year: 2021, subject: '化学', questionType: '填空题', content: '温度升高对吸热反应平衡的影响', difficulty: '简单' }
  ]
}

// @desc    获取知识点详细信息
// @route   GET /api/knowledge-points/:knowledgePoint
// @access  Private
router.get('/:knowledgePoint', async (req, res) => {
  const { knowledgePoint } = req.params
  const { subject, forceUpdate } = req.query

  if (!subject) {
    return res.status(400).json({
      success: false,
      error: '请提供学科参数'
    })
  }

  // 修复UTF-8编码问题 - 使用iconv-lite库
  
  function fixUtf8Encoding(str) {
    try {
      // 检查是否是正确的UTF-8编码
      const testBuffer = Buffer.from(str, 'utf8')
      if (testBuffer.toString('utf8') === str && !/[\u00C0-\u00FF]/.test(str)) {
        return str
      }
      
      // 尝试从latin1转换为utf8
      const buffer = Buffer.from(str, 'latin1')
      return iconv.decode(buffer, 'utf8')
    } catch (error) {
      console.error('编码修复失败:', error)
      // 如果所有方法都失败，尝试简单的字符替换
      return str.replace(/æ°å­¦/g, '数学').replace(/ç©ç/g, '物理').replace(/åå­¦/g, '化学')
    }
  }
  
  const decodedKnowledgePoint = fixUtf8Encoding(knowledgePoint)
  const decodedSubject = fixUtf8Encoding(subject)
  
  try {
    // 1. 优先从本地数据库查询
    let cachedKnowledgePoint = await KnowledgePoint.findOne({
      name: decodedKnowledgePoint,
      subject: decodedSubject,
      isActive: true
    })
    
    // 如果找到缓存且不需要强制更新，直接返回
    if (cachedKnowledgePoint && !forceUpdate) {
      // 更新访问次数
      cachedKnowledgePoint.fetchCount += 1
      cachedKnowledgePoint.lastFetched = new Date()
      await cachedKnowledgePoint.save()
      
      return res.json({
        success: true,
        data: {
          definition: cachedKnowledgePoint.definition,
          source: cachedKnowledgePoint.source,
          relatedConcepts: cachedKnowledgePoint.relatedConcepts,
          examQuestions: cachedKnowledgePoint.examQuestions,
          examProbability: cachedKnowledgePoint.examProbability,
          yearlyStats: cachedKnowledgePoint.yearlyStats,
          lastUpdated: cachedKnowledgePoint.lastUpdated,
          isUserEdited: cachedKnowledgePoint.isUserEdited,
          needsUpdate: cachedKnowledgePoint.needsUpdate,
          freshnessScore: cachedKnowledgePoint.freshnessScore
        }
      })
    }
    
    // 2. 如果没有缓存或需要强制更新，获取新数据
    let definition = ''
    let source = 'ai'
    let relatedConcepts = []
    
    if (textbookDefinitions[decodedSubject] && textbookDefinitions[decodedSubject][decodedKnowledgePoint]) {
        const textbookData = textbookDefinitions[decodedSubject][decodedKnowledgePoint]
        definition = textbookData.definition
        relatedConcepts = textbookData.relatedConcepts
        source = 'textbook'
      } else {
        // 3. 如果没有教材定义，先尝试网络搜索获取权威定义
        try {
          const searchResult = await webSearchService.searchKnowledgePoint(decodedKnowledgePoint, decodedSubject)
          
          if (searchResult && searchResult.definition) {
            const webDefinition = searchResult.definition
            definition = webDefinition.content
            source = `web_${webDefinition.source}`
            relatedConcepts = webDefinition.relatedConcepts || []
          } else {
            throw new Error('网络搜索未找到相关内容')
          }
          
        } catch (searchError) {
          // 4. 如果网络搜索失败，使用AI生成增强版定义
        try {
          const enhancedPrompt = `作为一名资深的${decodedSubject}教师，请详细解释"${decodedKnowledgePoint}"这个知识点：
1. 准确的定义（参考权威教材）
2. 核心概念和要点
3. 在${decodedSubject}学科中的重要性
4. 与其他知识点的关联
请确保内容准确、权威、易于理解。`
          
          const aiResponse = await aiService.generateStudyAdvice(
            enhancedPrompt,
            { subject: decodedSubject, knowledgePoint: decodedKnowledgePoint }
          )
          
          // 检查AI响应是否成功
          if (aiResponse.success && aiResponse.advice) {
            definition = aiResponse.advice
            source = 'ai_enhanced'
            
            // 尝试从AI响应中提取相关概念
            const conceptMatches = aiResponse.advice.match(/相关概念[：:]?([^。\n]+)/)
            if (conceptMatches) {
              relatedConcepts = conceptMatches[1].split(/[、，,]/).map(c => c.trim()).filter(c => c.length > 0)
            }
          } else {
            throw new Error(aiResponse.error || 'AI服务响应异常')
          }
          
        } catch (aiError) {
          console.error('AI生成定义失败:', aiError)
          definition = `${decodedKnowledgePoint}是${decodedSubject}学科中的重要概念。建议查阅相关教材或咨询老师获取详细定义。我们正在努力完善知识点内容库，感谢您的理解。`
          source = 'fallback'
        }
      }
    }

    // 5. 查找相关真题
    const examQuestions = examQuestionsData[decodedKnowledgePoint] || []
    
    // 6. 计算考试概率（基于真题数量和年份分布）
    const recentYears = 5
    const currentYear = new Date().getFullYear()
    const recentQuestions = examQuestions.filter(q => 
      currentYear - q.year <= recentYears
    )
    const examProbability = Math.min(Math.round((recentQuestions.length / recentYears) * 100), 100)

    // 7. 生成年度统计
    const yearlyStats = []
    for (let i = recentYears - 1; i >= 0; i--) {
      const year = currentYear - i
      const count = examQuestions.filter(q => q.year === year).length
      yearlyStats.push({ year, count })
    }

    // 8. 从数据库查找相关题目（实际项目中的补充）
    const dbQuestions = await Question.find({
      knowledgePoints: { $in: [decodedKnowledgePoint] },
      subject: decodedSubject,
      isActive: true
    })
    .select('content difficulty type createdAt')
    .limit(5)
    .sort({ createdAt: -1 })

    // 9. 合并数据库题目到考试题目中
    const additionalQuestions = dbQuestions.map(q => ({
      year: q.createdAt.getFullYear(),
      subject: decodedSubject,
      questionType: q.type || '练习题',
      content: q.content.substring(0, 100) + (q.content.length > 100 ? '...' : ''),
      difficulty: q.difficulty || '中等'
    }))

    const allExamQuestions = [...examQuestions, ...additionalQuestions]
    
    // 10. 保存或更新到本地数据库
    const knowledgePointData = {
      name: decodedKnowledgePoint,
      subject: decodedSubject,
      definition,
      source,
      relatedConcepts,
      examQuestions: allExamQuestions,
      examProbability,
      yearlyStats,
      lastUpdated: new Date(),
      lastFetched: new Date()
    }
    
    if (cachedKnowledgePoint) {
      // 更新现有记录
      await cachedKnowledgePoint.updateContent(knowledgePointData, forceUpdate ? '强制更新' : '自动更新')
    } else {
      // 创建新记录
      cachedKnowledgePoint = await KnowledgePoint.findOrCreate(
        decodedKnowledgePoint,
        decodedSubject,
        knowledgePointData
      )
    }

    res.json({
      success: true,
      data: {
        definition,
        source,
        relatedConcepts,
        examQuestions: allExamQuestions,
        examProbability,
        yearlyStats,
        lastUpdated: cachedKnowledgePoint.lastUpdated,
        isUserEdited: cachedKnowledgePoint.isUserEdited,
        needsUpdate: cachedKnowledgePoint.needsUpdate,
        freshnessScore: cachedKnowledgePoint.freshnessScore
      }
    })

  } catch (error) {
    console.error('获取知识点信息失败:', error)
    res.status(500).json({
      success: false,
      error: '获取知识点信息失败'
    })
  }
});

// 强制更新知识点
router.put('/:knowledgePoint/update', async (req, res) => {
  try {
    const { knowledgePoint } = req.params
    const { subject } = req.query
    
    if (!subject) {
      return res.status(400).json({
        success: false,
        error: '请提供学科参数'
      })
    }
    
    // 调用原有的获取逻辑，但强制更新
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/knowledge-points/${knowledgePoint}?subject=${subject}&forceUpdate=true`)
    const data = await response.json()
    
    res.json(data)
  } catch (error) {
    console.error('强制更新知识点失败:', error)
    res.status(500).json({
      success: false,
      error: '强制更新知识点失败'
    })
  }
})

// 编辑知识点
router.put('/:knowledgePoint/edit', [
  body('definition').notEmpty().withMessage('知识点定义不能为空'),
  body('subject').notEmpty().withMessage('学科不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '参数验证失败',
        details: errors.array()
      })
    }
    
    const { knowledgePoint } = req.params
    const { definition, relatedConcepts, editReason, subject } = req.body
    
    // 查找现有知识点
    let existingKnowledgePoint = await KnowledgePoint.findOne({
      name: knowledgePoint,
      subject: subject,
      isActive: true
    })
    
    if (!existingKnowledgePoint) {
      return res.status(404).json({
        success: false,
        error: '知识点不存在'
      })
    }
    
    // 标记为用户编辑
    await existingKnowledgePoint.markAsUserEdited(
      definition,
      editReason || '用户编辑'
    )
    
    // 更新相关概念（如果提供）
    if (relatedConcepts && Array.isArray(relatedConcepts)) {
      existingKnowledgePoint.relatedConcepts = relatedConcepts
      await existingKnowledgePoint.save()
    }
    
    res.json({
      success: true,
      data: {
        definition: existingKnowledgePoint.definition,
        source: existingKnowledgePoint.source,
        relatedConcepts: existingKnowledgePoint.relatedConcepts,
        examQuestions: existingKnowledgePoint.examQuestions,
        examProbability: existingKnowledgePoint.examProbability,
        yearlyStats: existingKnowledgePoint.yearlyStats,
        lastUpdated: existingKnowledgePoint.lastUpdated,
        isUserEdited: existingKnowledgePoint.isUserEdited,
        editHistory: existingKnowledgePoint.editHistory
      }
    })
  } catch (error) {
    console.error('编辑知识点失败:', error)
    res.status(500).json({
      success: false,
      error: '编辑知识点失败'
    })
  }
})

// 获取知识点编辑历史
router.get('/:knowledgePoint/history', async (req, res) => {
  try {
    const { knowledgePoint } = req.params
    const { subject } = req.query
    
    if (!subject) {
      return res.status(400).json({
        success: false,
        error: '请提供学科参数'
      })
    }
    
    const existingKnowledgePoint = await KnowledgePoint.findOne({
      name: knowledgePoint,
      subject: subject,
      isActive: true
    })
    
    if (!existingKnowledgePoint) {
      return res.status(404).json({
        success: false,
        error: '知识点不存在'
      })
    }
    
    res.json({
      success: true,
      data: {
        editHistory: existingKnowledgePoint.editHistory,
        originalDefinition: existingKnowledgePoint.originalDefinition,
        currentDefinition: existingKnowledgePoint.definition,
        isUserEdited: existingKnowledgePoint.isUserEdited
      }
    })
  } catch (error) {
    console.error('获取编辑历史失败:', error)
    res.status(500).json({
      success: false,
      error: '获取编辑历史失败'
    })
  }
})

// @desc    搜索知识点
// @route   GET /api/knowledge-points/search
// @access  Private
router.get('/search', async (req, res) => {
  const { query, subject } = req.query

  if (!query) {
    return res.status(400).json({
      success: false,
      error: '请提供搜索关键词'
    })
  }

  try {
    // 从数据库搜索相关知识点
    const searchConditions = {
      isActive: true,
      knowledgePoints: { $regex: query, $options: 'i' }
    }

    if (subject) {
      searchConditions.subject = subject
    }

    const questions = await Question.find(searchConditions)
      .select('knowledgePoints subject')
      .limit(50)

    // 提取并去重知识点
    const knowledgePointsSet = new Set()
    questions.forEach(q => {
      q.knowledgePoints.forEach(kp => {
        if (kp.toLowerCase().includes(query.toLowerCase())) {
          knowledgePointsSet.add(kp)
        }
      })
    })

    // 添加教材中的知识点
    Object.keys(textbookDefinitions).forEach(subj => {
      if (!subject || subj === subject) {
        Object.keys(textbookDefinitions[subj]).forEach(kp => {
          if (kp.toLowerCase().includes(query.toLowerCase())) {
            knowledgePointsSet.add(kp)
          }
        })
      }
    })

    const knowledgePoints = Array.from(knowledgePointsSet).slice(0, 20)

    res.json({
      success: true,
      data: {
        knowledgePoints,
        total: knowledgePoints.length
      }
    })

  } catch (error) {
    console.error('搜索知识点失败:', error)
    res.status(500).json({
      success: false,
      error: '搜索知识点失败'
    })
  }
});

export default router