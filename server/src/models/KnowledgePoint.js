import mongoose from 'mongoose'

const knowledgePointSchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['数学', '物理', '化学', '语文', '英语', '历史', '地理', '政治', '生物']
  },
  
  // 知识点内容
  definition: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['textbook', 'web_baike.baidu.com', 'web_zhihu.com', 'ai_enhanced', 'ai', 'fallback', 'user_edited']
  },
  relatedConcepts: [{
    type: String,
    trim: true
  }],
  
  // 考试相关数据
  examQuestions: [{
    year: Number,
    subject: String,
    questionType: String,
    content: String,
    difficulty: {
      type: String,
      enum: ['简单', '中等', '困难']
    }
  }],
  examProbability: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  yearlyStats: [{
    year: Number,
    count: Number
  }],
  
  // 缓存和更新信息
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastFetched: {
    type: Date,
    default: Date.now
  },
  fetchCount: {
    type: Number,
    default: 1
  },
  
  // 用户编辑相关
  isUserEdited: {
    type: Boolean,
    default: false
  },
  originalDefinition: String, // 保存原始定义，用于对比
  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    previousDefinition: String,
    editReason: String
  }],
  
  // 元数据
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['基础', '进阶', '高级'],
    default: '基础'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 创建复合索引
knowledgePointSchema.index({ name: 1, subject: 1 }, { unique: true })
knowledgePointSchema.index({ subject: 1, lastUpdated: -1 })
knowledgePointSchema.index({ fetchCount: -1 })
knowledgePointSchema.index({ isActive: 1 })

// 虚拟字段：是否需要更新（超过7天未更新）
knowledgePointSchema.virtual('needsUpdate').get(function() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return this.lastUpdated < sevenDaysAgo
})

// 虚拟字段：内容新鲜度评分
knowledgePointSchema.virtual('freshnessScore').get(function() {
  const daysSinceUpdate = Math.floor((Date.now() - this.lastUpdated) / (24 * 60 * 60 * 1000))
  return Math.max(0, 100 - daysSinceUpdate * 2) // 每天减2分
})

// 静态方法：查找或创建知识点
knowledgePointSchema.statics.findOrCreate = async function(name, subject, data = {}) {
  try {
    // 使用 findOneAndUpdate 的 upsert 选项来避免竞态条件
    const knowledgePoint = await this.findOneAndUpdate(
      { name, subject },
      {
        $setOnInsert: {
          name,
          subject,
          ...data
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    )
    
    return knowledgePoint
  } catch (error) {
    // 如果仍然出现重复键错误，尝试查找现有记录
    if (error.code === 11000) {
      const existingKnowledgePoint = await this.findOne({ name, subject })
      if (existingKnowledgePoint) {
        return existingKnowledgePoint
      }
    }
    throw error
  }
}

// 实例方法：更新知识点内容
knowledgePointSchema.methods.updateContent = async function(newData, reason = '系统更新') {
  // 保存编辑历史
  if (this.definition !== newData.definition) {
    this.editHistory.push({
      previousDefinition: this.definition,
      editReason: reason
    })
  }
  
  // 更新内容
  Object.assign(this, newData)
  this.lastUpdated = new Date()
  this.fetchCount += 1
  
  return await this.save()
}

// 实例方法：标记为用户编辑
knowledgePointSchema.methods.markAsUserEdited = async function(editedDefinition, reason = '用户编辑') {
  if (!this.originalDefinition) {
    this.originalDefinition = this.definition
  }
  
  this.definition = editedDefinition
  this.source = 'user_edited'
  this.isUserEdited = true
  this.lastUpdated = new Date()
  
  this.editHistory.push({
    previousDefinition: this.originalDefinition,
    editReason: reason
  })
  
  return await this.save()
}

// 中间件：更新前自动设置lastFetched
knowledgePointSchema.pre('save', function(next) {
  if (this.isModified('definition') || this.isModified('examQuestions')) {
    this.lastFetched = new Date()
  }
  next()
})

const KnowledgePoint = mongoose.model('KnowledgePoint', knowledgePointSchema)

export default KnowledgePoint