import mongoose from 'mongoose'

const userSupplementSchema = new mongoose.Schema({
  // 关联的题目ID
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  
  // 用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // 允许匿名用户补充
  },
  
  // 补充类型：知识点或答案补充
  type: {
    type: String,
    required: true,
    enum: ['knowledge_point', 'answer_supplement']
  },
  
  // 原始选中的文字
  selectedText: {
    type: String,
    required: true,
    trim: true
  },
  
  // 用户补充的内容
  supplementContent: {
    type: String,
    required: true,
    trim: true
  },
  
  // 如果是知识点，记录知识点名称
  knowledgePointName: {
    type: String,
    trim: true
  },
  
  // 选中文字在原文中的位置信息
  textPosition: {
    startIndex: Number,
    endIndex: Number,
    context: String // 前后文上下文
  },
  
  // 补充内容的来源
  source: {
    type: String,
    enum: ['user_input', 'ai_generated', 'web_search'],
    default: 'user_input'
  },
  
  // 是否已验证/审核
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // 验证者
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 验证时间
  verifiedAt: {
    type: Date
  },
  
  // 点赞数
  likes: {
    type: Number,
    default: 0
  },
  
  // 点踩数
  dislikes: {
    type: Number,
    default: 0
  },
  
  // 用户评价记录
  userRatings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: String,
      enum: ['like', 'dislike']
    },
    ratedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 是否激活
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 标签
  tags: [{
    type: String,
    trim: true
  }],
  
  // 备注
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// 索引
userSupplementSchema.index({ questionId: 1 })
userSupplementSchema.index({ userId: 1 })
userSupplementSchema.index({ type: 1 })
userSupplementSchema.index({ knowledgePointName: 1 })
userSupplementSchema.index({ isActive: 1 })
userSupplementSchema.index({ isVerified: 1 })
userSupplementSchema.index({ createdAt: -1 })

// 虚拟字段：获取评分
userSupplementSchema.virtual('score').get(function() {
  return this.likes - this.dislikes
})

// 实例方法：用户评价
userSupplementSchema.methods.rateByUser = function(userId, rating) {
  // 移除用户之前的评价
  this.userRatings = this.userRatings.filter(r => !r.userId.equals(userId))
  
  // 添加新评价
  this.userRatings.push({
    userId,
    rating,
    ratedAt: new Date()
  })
  
  // 重新计算点赞点踩数
  this.likes = this.userRatings.filter(r => r.rating === 'like').length
  this.dislikes = this.userRatings.filter(r => r.rating === 'dislike').length
  
  return this.save()
}

// 静态方法：获取题目的所有补充内容
userSupplementSchema.statics.getByQuestion = function(questionId, options = {}) {
  const query = {
    questionId,
    isActive: true
  }
  
  if (options.type) {
    query.type = options.type
  }
  
  if (options.verified !== undefined) {
    query.isVerified = options.verified
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .populate('verifiedBy', 'name email')
    .sort({ score: -1, createdAt: -1 })
    .limit(options.limit || 50)
}

// 静态方法：获取知识点相关补充
userSupplementSchema.statics.getByKnowledgePoint = function(knowledgePointName, options = {}) {
  const query = {
    type: 'knowledge_point',
    knowledgePointName,
    isActive: true
  }
  
  if (options.verified !== undefined) {
    query.isVerified = options.verified
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .populate('questionId', 'content subject')
    .sort({ score: -1, createdAt: -1 })
    .limit(options.limit || 20)
}

export default mongoose.model('UserSupplement', userSupplementSchema)