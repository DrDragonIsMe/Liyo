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

// 保存答题方案到知识点
router.post('/save-solution', [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('questionId').notEmpty().withMessage('题目ID不能为空'),
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
    
    const { title, approach, steps, keyPoints, questionId, subject, knowledgePoints } = req.body
    
    // 构建答题方案内容
    const solutionContent = {
      title,
      approach: approach || '',
      steps: Array.isArray(steps) ? steps : [],
      keyPoints: Array.isArray(keyPoints) ? keyPoints : [],
      questionId,
      subject,
      createdAt: new Date()
    }
    
    // 如果提供了知识点列表，为每个知识点保存方案
    if (knowledgePoints && Array.isArray(knowledgePoints)) {
      const savedSolutions = []
      
      for (const knowledgePointName of knowledgePoints) {
        try {
          // 查找或创建知识点
          let knowledgePoint = await KnowledgePoint.findOne({
            name: knowledgePointName,
            subject: subject,
            isActive: true
          })
          
          if (!knowledgePoint) {
            // 如果知识点不存在，创建一个基础的知识点记录
            knowledgePoint = await KnowledgePoint.findOrCreate(
              knowledgePointName,
              subject,
              {
                name: knowledgePointName,
                subject: subject,
                definition: `${knowledgePointName}是${subject}学科中的重要概念。`,
                source: 'user_generated',
                relatedConcepts: [],
                examQuestions: [],
                examProbability: 0,
                yearlyStats: [],
                lastUpdated: new Date(),
                lastFetched: new Date()
              }
            )
          }
          
          // 添加答题方案到知识点的自定义字段
          if (!knowledgePoint.userSolutions) {
            knowledgePoint.userSolutions = []
          }
          
          knowledgePoint.userSolutions.push(solutionContent)
          knowledgePoint.lastUpdated = new Date()
          
          await knowledgePoint.save()
          savedSolutions.push({
            knowledgePoint: knowledgePointName,
            success: true
          })
          
        } catch (error) {
          console.error(`保存到知识点 ${knowledgePointName} 失败:`, error)
          savedSolutions.push({
            knowledgePoint: knowledgePointName,
            success: false,
            error: error.message
          })
        }
      }
      
      const successCount = savedSolutions.filter(s => s.success).length
      
      res.json({
        success: successCount > 0,
        message: `成功保存到 ${successCount}/${knowledgePoints.length} 个知识点`,
        data: {
          savedSolutions,
          solutionContent
        }
      })
      
    } else {
      // 如果没有提供知识点列表，返回错误
      res.status(400).json({
        success: false,
        error: '请提供知识点列表'
      })
    }
    
  } catch (error) {
    console.error('保存答题方案失败:', error)
    res.status(500).json({
      success: false,
      error: '保存答题方案失败'
    })
   }
});

// 搜索路由 - 必须在参数路由之前
router.get('/search', async (req, res) => {
  const { query, subject } = req.query
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: '请提供搜索关键词'
    })
  }

  try {
    // 1. 在教材定义中搜索
    const textbookResults = []
    if (subject && textbookDefinitions[subject]) {
      Object.keys(textbookDefinitions[subject]).forEach(name => {
        if (name.includes(query) || textbookDefinitions[subject][name].definition.includes(query)) {
          textbookResults.push({
            name,
            definition: textbookDefinitions[subject][name].definition,
            relatedConcepts: textbookDefinitions[subject][name].relatedConcepts,
            source: 'textbook',
            subject,
            relevanceScore: calculateRelevanceScore(query, name, textbookDefinitions[subject][name].definition)
          })
        }
      })
    } else {
      // 如果没有指定学科，搜索所有学科
      Object.keys(textbookDefinitions).forEach(subj => {
        Object.keys(textbookDefinitions[subj]).forEach(name => {
          if (name.includes(query) || textbookDefinitions[subj][name].definition.includes(query)) {
            textbookResults.push({
              name,
              definition: textbookDefinitions[subj][name].definition,
              relatedConcepts: textbookDefinitions[subj][name].relatedConcepts,
              source: 'textbook',
              subject: subj,
              relevanceScore: calculateRelevanceScore(query, name, textbookDefinitions[subj][name].definition)
            })
          }
        })
      })
    }

    // 2. 在数据库中搜索
    const searchConditions = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { definition: { $regex: query, $options: 'i' } },
        { 'relatedConcepts': { $in: [new RegExp(query, 'i')] } }
      ],
      isActive: true
    }

    if (subject) {
      searchConditions.subject = subject
    }

    const dbResults = await KnowledgePoint.find(searchConditions)
      .select('name definition relatedConcepts source subject isUserEdited lastUpdated')
      .limit(20)

    // 3. 合并结果并去重
    const allResults = [...textbookResults]
    
    dbResults.forEach(dbResult => {
      const existingIndex = allResults.findIndex(result => 
        result.name === dbResult.name && result.subject === dbResult.subject
      )
      
      if (existingIndex >= 0) {
        // 用数据库版本覆盖（用户编辑的优先）
        allResults[existingIndex] = {
          name: dbResult.name,
          definition: dbResult.definition,
          relatedConcepts: dbResult.relatedConcepts,
          source: dbResult.source,
          subject: dbResult.subject,
          isUserEdited: dbResult.isUserEdited,
          lastUpdated: dbResult.lastUpdated,
          relevanceScore: calculateRelevanceScore(query, dbResult.name, dbResult.definition)
        }
      } else {
        allResults.push({
          name: dbResult.name,
          definition: dbResult.definition,
          relatedConcepts: dbResult.relatedConcepts,
          source: dbResult.source,
          subject: dbResult.subject,
          isUserEdited: dbResult.isUserEdited,
          lastUpdated: dbResult.lastUpdated,
          relevanceScore: calculateRelevanceScore(query, dbResult.name, dbResult.definition)
        })
      }
    })

    // 4. 按相关性排序
    allResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    res.json({
      success: true,
      data: {
        results: allResults,
        total: allResults.length,
        query,
        subject: subject || 'all'
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

// 辅助函数：计算相关性得分
function calculateRelevanceScore(query, name, definition) {
  let score = 0
  const queryLower = query.toLowerCase()
  const nameLower = name.toLowerCase()
  const definitionLower = definition.toLowerCase()
  
  // 名称完全匹配得分最高
  if (nameLower === queryLower) score += 100
  else if (nameLower.includes(queryLower)) score += 50
  
  // 定义中包含关键词
  if (definitionLower.includes(queryLower)) score += 20
  
  return score
}

// 辅助函数：计算考试概率
function calculateExamProbability(knowledgePointName) {
  const examQuestions = examQuestionsData[knowledgePointName] || []
  const recentYears = 5
  const currentYear = new Date().getFullYear()
  const recentQuestions = examQuestions.filter(q => 
    currentYear - q.year <= recentYears
  )
  return Math.min(Math.round((recentQuestions.length / recentYears) * 100), 100)
}

// 辅助函数：计算年度统计
function calculateYearlyStats(knowledgePointName) {
  const examQuestions = examQuestionsData[knowledgePointName] || []
  const recentYears = 5
  const currentYear = new Date().getFullYear()
  const yearlyStats = []
  
  for (let i = recentYears - 1; i >= 0; i--) {
    const year = currentYear - i
    const count = examQuestions.filter(q => q.year === year).length
    yearlyStats.push({ year, count })
  }
  
  return yearlyStats
}



// 获取知识点列表（按学科分组，支持知识突破状态）
router.get('/list', async (req, res) => {
  try {
    const { subject } = req.query
    
    // 构建查询条件
    const query = { isActive: true }
    if (subject) {
      query.subject = subject
    }
    
    // 从数据库获取知识点
    const knowledgePoints = await KnowledgePoint.find(query)
      .select('name subject definition source examProbability lastUpdated difficulty userSolutions')
      .sort({ subject: 1, name: 1 })
    
    // 按学科分组并添加知识突破状态
    const groupedBySubject = {}
    knowledgePoints.forEach(point => {
      if (!groupedBySubject[point.subject]) {
        groupedBySubject[point.subject] = []
      }
      
      // 计算知识突破状态
      const breakthroughStatus = calculateBreakthroughStatus(point)
      
      groupedBySubject[point.subject].push({
        name: point.name,
        definition: point.definition,
        source: point.source,
        examProbability: point.examProbability,
        lastUpdated: point.lastUpdated,
        difficulty: point.difficulty || '基础',
        breakthroughStatus,
        solutionCount: point.userSolutions ? point.userSolutions.length : 0
      })
    })
    
    res.json({
      success: true,
      data: groupedBySubject,
      total: knowledgePoints.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('获取知识点列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取知识点列表失败'
    })
  }
});

// 计算知识突破状态
function calculateBreakthroughStatus(knowledgePoint) {
  const solutionCount = knowledgePoint.userSolutions ? knowledgePoint.userSolutions.length : 0
  const examProbability = knowledgePoint.examProbability || 0
  
  if (solutionCount >= 3 && examProbability > 70) {
    return 'mastered' // 已掌握
  } else if (solutionCount >= 2 || examProbability > 50) {
    return 'progressing' // 进步中
  } else if (solutionCount >= 1 || examProbability > 20) {
    return 'learning' // 学习中
  } else {
    return 'not_started' // 未开始
  }
}

// ===== 参数路由必须放在最后 =====

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
      
      // 计算知识突破状态
      const breakthroughStatus = calculateBreakthroughStatus(cachedKnowledgePoint)
      
      return res.json({
        success: true,
        data: {
          name: cachedKnowledgePoint.name,
          subject: cachedKnowledgePoint.subject,
          definition: cachedKnowledgePoint.definition,
          source: cachedKnowledgePoint.source,
          relatedConcepts: cachedKnowledgePoint.relatedConcepts,
          examQuestions: cachedKnowledgePoint.examQuestions,
          examProbability: cachedKnowledgePoint.examProbability,
          yearlyStats: cachedKnowledgePoint.yearlyStats,
          lastUpdated: cachedKnowledgePoint.lastUpdated,
          isUserEdited: cachedKnowledgePoint.isUserEdited,
          needsUpdate: cachedKnowledgePoint.needsUpdate,
          freshnessScore: cachedKnowledgePoint.freshnessScore,
          difficulty: cachedKnowledgePoint.difficulty || '基础',
          breakthroughStatus,
          userSolutions: cachedKnowledgePoint.userSolutions || [],
          solutionCount: cachedKnowledgePoint.userSolutions ? cachedKnowledgePoint.userSolutions.length : 0
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
            'system',
            { prompt: enhancedPrompt, subject: decodedSubject, knowledgePoint: decodedKnowledgePoint }
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

    // 计算知识突破状态
    const breakthroughStatus = calculateBreakthroughStatus(cachedKnowledgePoint)
    
    res.json({
      success: true,
      data: {
        name: decodedKnowledgePoint,
        subject: decodedSubject,
        definition,
        source,
        relatedConcepts,
        examQuestions: allExamQuestions,
        examProbability,
        yearlyStats,
        lastUpdated: cachedKnowledgePoint.lastUpdated,
        isUserEdited: cachedKnowledgePoint.isUserEdited,
        needsUpdate: cachedKnowledgePoint.needsUpdate,
        freshnessScore: cachedKnowledgePoint.freshnessScore,
        difficulty: cachedKnowledgePoint.difficulty || '基础',
        breakthroughStatus,
        userSolutions: cachedKnowledgePoint.userSolutions || [],
        solutionCount: cachedKnowledgePoint.userSolutions ? cachedKnowledgePoint.userSolutions.length : 0
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
    
    // 修复UTF-8编码问题
    function fixUtf8Encoding(str) {
      try {
        const testBuffer = Buffer.from(str, 'utf8')
        if (testBuffer.toString('utf8') === str && !/[\u00C0-\u00FF]/.test(str)) {
          return str
        }
        const buffer = Buffer.from(str, 'latin1')
        return iconv.decode(buffer, 'utf8')
      } catch (error) {
        console.error('编码修复失败:', error)
        return str.replace(/æ°å­¦/g, '数学').replace(/ç©ç/g, '物理').replace(/åå­¦/g, '化学')
      }
    }
    
    const decodedKnowledgePoint = fixUtf8Encoding(knowledgePoint)
    const decodedSubject = fixUtf8Encoding(subject)
    
    // 直接删除缓存并重新获取，避免循环调用
    await KnowledgePoint.deleteOne({
      name: decodedKnowledgePoint,
      subject: decodedSubject
    })
    
    // 重新获取知识点信息
    let knowledgeData = null
    let source = 'fallback'
    
    // 1. 尝试从教材定义获取
    if (textbookDefinitions[decodedSubject] && textbookDefinitions[decodedSubject][decodedKnowledgePoint]) {
      const textbookData = textbookDefinitions[decodedSubject][decodedKnowledgePoint]
      knowledgeData = {
        definition: textbookData.definition,
        relatedConcepts: textbookData.relatedConcepts
      }
      source = 'textbook'
    }
    
    // 2. 如果教材没有，尝试AI生成
    if (!knowledgeData) {
      try {
        const aiResponse = await aiService.generateKnowledgePointDefinition(decodedKnowledgePoint, decodedSubject)
        if (aiResponse && aiResponse.definition) {
          knowledgeData = aiResponse
          source = 'ai'
        }
      } catch (aiError) {
        console.error('AI生成知识点失败:', aiError)
      }
    }
    
    // 3. 如果AI也失败，使用默认数据
    if (!knowledgeData) {
      knowledgeData = {
        definition: `${decodedKnowledgePoint}是${decodedSubject}学科中的重要概念，需要进一步学习和理解。`,
        relatedConcepts: ['基础概念', '应用实例']
      }
      source = 'fallback'
    }
    
    // 获取考试相关数据
    const examQuestions = examQuestionsData[decodedKnowledgePoint] || []
    const examProbability = calculateExamProbability(decodedKnowledgePoint)
    const yearlyStats = calculateYearlyStats(decodedKnowledgePoint)
    
    // 保存到数据库
    const newKnowledgePoint = new KnowledgePoint({
      name: decodedKnowledgePoint,
      subject: decodedSubject,
      definition: knowledgeData.definition,
      source: source,
      relatedConcepts: knowledgeData.relatedConcepts || [],
      examQuestions: examQuestions,
      examProbability: examProbability,
      yearlyStats: yearlyStats,
      lastUpdated: new Date(),
      fetchCount: 1,
      lastFetched: new Date(),
      isUserEdited: false,
      needsUpdate: false,
      freshnessScore: 100,
      difficulty: '基础',
      userSolutions: []
    })
    
    await newKnowledgePoint.save()
    
    // 计算知识突破状态
    const breakthroughStatus = calculateBreakthroughStatus(newKnowledgePoint)
    
    res.json({
      success: true,
      data: {
        name: newKnowledgePoint.name,
        subject: newKnowledgePoint.subject,
        definition: newKnowledgePoint.definition,
        source: newKnowledgePoint.source,
        relatedConcepts: newKnowledgePoint.relatedConcepts,
        examQuestions: newKnowledgePoint.examQuestions,
        examProbability: newKnowledgePoint.examProbability,
        yearlyStats: newKnowledgePoint.yearlyStats,
        lastUpdated: newKnowledgePoint.lastUpdated,
        isUserEdited: newKnowledgePoint.isUserEdited,
        needsUpdate: newKnowledgePoint.needsUpdate,
        freshnessScore: newKnowledgePoint.freshnessScore,
        difficulty: newKnowledgePoint.difficulty,
        breakthroughStatus,
        userSolutions: newKnowledgePoint.userSolutions,
        solutionCount: newKnowledgePoint.userSolutions.length
      }
    })
    
  } catch (error) {
    console.error('强制更新知识点失败:', error)
    res.status(500).json({
      success: false,
      error: '强制更新知识点失败: ' + error.message
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





export default router