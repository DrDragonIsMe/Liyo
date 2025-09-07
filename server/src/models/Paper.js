import mongoose from 'mongoose'

const paperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '请提供试卷标题'],
    trim: true,
    maxlength: [200, '试卷标题不能超过200个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '试卷描述不能超过1000个字符']
  },
  subject: {
    type: String,
    required: [true, '请选择科目'],
    enum: ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
  },
  grade: {
    type: String,
    required: [true, '请选择年级'],
    enum: ['高一', '高二', '高三']
  },
  examType: {
    type: String,
    enum: ['期中考试', '期末考试', '月考', '模拟考试', '单元测试', '练习题', '高考真题', '其他'],
    default: '练习题'
  },
  difficulty: {
    type: String,
    enum: ['简单', '中等', '困难'],
    default: '中等'
  },
  totalScore: {
    type: Number,
    default: 100
  },
  timeLimit: {
    type: Number, // 考试时间限制（分钟）
    default: 120
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalFile: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  processedImages: [{
    filename: String,
    path: String,
    pageNumber: Number,
    ocrText: String,
    processedAt: {
      type: Date,
      default: Date.now
    }
  }],
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['uploading', 'processing', 'processed', 'failed', 'published'],
    default: 'uploading'
  },
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  processingError: {
    type: String,
    default: null
  },
  metadata: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    questionTypes: [{
      type: String,
      enum: ['选择题', '填空题', '解答题', '判断题', '简答题', '计算题', '证明题', '作文题']
    }],
    knowledgePoints: [{
      type: String,
      trim: true
    }],
    estimatedTime: Number, // 预估完成时间（分钟）
    averageScore: Number,
    completionCount: {
      type: Number,
      default: 0
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// 索引
paperSchema.index({ subject: 1, grade: 1 })
paperSchema.index({ uploadedBy: 1 })
paperSchema.index({ status: 1 })
paperSchema.index({ isPublic: 1, isActive: 1 })
paperSchema.index({ createdAt: -1 })
paperSchema.index({ 'metadata.knowledgePoints': 1 })

// 虚拟字段：平均评分
paperSchema.virtual('averageRating').get(function() {
  if (this.comments.length === 0) return 0
  const totalRating = this.comments.reduce((sum, comment) => sum + (comment.rating || 0), 0)
  return Math.round((totalRating / this.comments.length) * 10) / 10
})

// 更新试卷统计信息
paperSchema.methods.updateStats = function() {
  this.metadata.totalQuestions = this.questions.length
  return this.save()
}

// 增加浏览次数
paperSchema.methods.incrementView = function() {
  this.viewCount += 1
  return this.save()
}

// 增加下载次数
paperSchema.methods.incrementDownload = function() {
  this.downloadCount += 1
  return this.save()
}

// 添加评论
paperSchema.methods.addComment = function(userId, content, rating) {
  this.comments.push({
    user: userId,
    content,
    rating
  })
  return this.save()
}

// 获取试卷摘要信息
paperSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    subject: this.subject,
    grade: this.grade,
    examType: this.examType,
    difficulty: this.difficulty,
    totalQuestions: this.metadata.totalQuestions,
    estimatedTime: this.metadata.estimatedTime,
    averageRating: this.averageRating,
    viewCount: this.viewCount,
    status: this.status,
    createdAt: this.createdAt
  }
}

export default mongoose.model('Paper', paperSchema)