import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  paper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper',
    required: true
  },
  questionNumber: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: [true, '请选择题目类型'],
    enum: ['选择题', '填空题', '解答题', '判断题', '简答题', '计算题', '证明题', '作文题']
  },
  content: {
    type: String,
    required: [true, '请提供题目内容'],
    trim: true
  },
  images: [{
    filename: String,
    path: String,
    description: String
  }],
  options: [{
    label: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E', 'F']
    },
    content: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // 可以是字符串、数组或对象
    required: function() {
      return this.type !== '作文题'
    }
  },
  explanation: {
    type: String,
    trim: true
  },
  solution: {
    type: String,
    trim: true
  },
  hints: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['简单', '中等', '困难'],
    default: '中等'
  },
  score: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedTime: {
    type: Number, // 预估答题时间（分钟）
    default: 2
  },
  subject: {
    type: String,
    required: true,
    enum: ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
  },
  grade: {
    type: String,
    required: true,
    enum: ['高一', '高二', '高三']
  },
  knowledgePoints: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  chapter: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: 2000,
    max: new Date().getFullYear() + 1
  },
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    correctAttempts: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    },
    difficultyRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  ocrExtracted: {
    type: Boolean,
    default: false
  },
  ocrConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  manuallyReviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// 索引
questionSchema.index({ paper: 1, questionNumber: 1 })
questionSchema.index({ type: 1 })
questionSchema.index({ subject: 1, grade: 1 })
questionSchema.index({ difficulty: 1 })
questionSchema.index({ knowledgePoints: 1 })
questionSchema.index({ tags: 1 })
questionSchema.index({ isActive: 1 })

// 虚拟字段：正确率
questionSchema.virtual('accuracy').get(function() {
  if (this.statistics.totalAttempts === 0) return 0
  return Math.round((this.statistics.correctAttempts / this.statistics.totalAttempts) * 100)
})

// 更新题目统计信息
questionSchema.methods.updateStats = function(isCorrect, timeSpent) {
  this.statistics.totalAttempts += 1
  
  if (isCorrect) {
    this.statistics.correctAttempts += 1
  }
  
  // 更新平均用时
  const totalTime = this.statistics.averageTime * (this.statistics.totalAttempts - 1) + timeSpent
  this.statistics.averageTime = Math.round(totalTime / this.statistics.totalAttempts)
  
  return this.save()
}

// 验证答案
questionSchema.methods.checkAnswer = function(userAnswer) {
  if (this.type === '选择题') {
    return userAnswer === this.correctAnswer
  } else if (this.type === '判断题') {
    return userAnswer === this.correctAnswer
  } else if (this.type === '填空题') {
    // 填空题可能有多个正确答案
    if (Array.isArray(this.correctAnswer)) {
      return this.correctAnswer.some(answer => 
        answer.toLowerCase().trim() === userAnswer.toLowerCase().trim()
      )
    }
    return this.correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim()
  } else {
    // 对于主观题，需要人工评判或AI评判
    return null
  }
}

// 获取题目摘要
questionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    questionNumber: this.questionNumber,
    type: this.type,
    content: this.content.substring(0, 100) + (this.content.length > 100 ? '...' : ''),
    difficulty: this.difficulty,
    score: this.score,
    estimatedTime: this.estimatedTime,
    accuracy: this.accuracy,
    knowledgePoints: this.knowledgePoints
  }
}

// 获取完整题目信息（用于答题）
questionSchema.methods.getForAnswering = function() {
  const question = this.toObject()
  
  // 移除正确答案和解析（防止作弊）
  delete question.correctAnswer
  delete question.explanation
  delete question.solution
  
  // 对于选择题，移除选项中的isCorrect字段
  if (question.options) {
    question.options = question.options.map(option => ({
      label: option.label,
      content: option.content
    }))
  }
  
  return question
}

export default mongoose.model('Question', questionSchema)