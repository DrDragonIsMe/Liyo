import mongoose from 'mongoose'

const studyRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper',
    required: true
  },
  type: {
    type: String,
    enum: ['practice', 'exam', 'review'],
    default: 'practice'
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'paused', 'abandoned'],
    default: 'in_progress'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  totalTime: {
    type: Number, // 总用时（秒）
    default: 0
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    userAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    timeSpent: {
      type: Number, // 答题用时（秒）
      default: 0
    },
    attempts: {
      type: Number,
      default: 1
    },
    hintsUsed: {
      type: Number,
      default: 0
    },
    answeredAt: {
      type: Date,
      default: Date.now
    },
    aiHelp: {
      requested: {
        type: Boolean,
        default: false
      },
      content: String,
      helpful: Boolean
    }
  }],
  score: {
    total: {
      type: Number,
      default: 0
    },
    obtained: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  statistics: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    answeredQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    wrongAnswers: {
      type: Number,
      default: 0
    },
    skippedQuestions: {
      type: Number,
      default: 0
    },
    averageTimePerQuestion: {
      type: Number,
      default: 0
    }
  },
  weakPoints: [{
    knowledgePoint: String,
    errorCount: Number,
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }]
  }],
  strongPoints: [{
    knowledgePoint: String,
    correctCount: Number,
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }]
  }],
  aiInteractions: [{
    type: {
      type: String,
      enum: ['question_help', 'explanation', 'hint', 'general_chat']
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    userMessage: String,
    aiResponse: String,
    helpful: Boolean,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  reviewScheduled: {
    type: Date
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  difficulty: {
    perceived: {
      type: String,
      enum: ['很简单', '简单', '适中', '困难', '很困难']
    },
    actual: {
      type: String,
      enum: ['简单', '中等', '困难']
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    suggestions: [String]
  }
}, {
  timestamps: true
})

// 索引
studyRecordSchema.index({ user: 1, createdAt: -1 })
studyRecordSchema.index({ paper: 1 })
studyRecordSchema.index({ status: 1 })
studyRecordSchema.index({ type: 1 })
studyRecordSchema.index({ 'score.percentage': -1 })

// 虚拟字段：准确率
studyRecordSchema.virtual('accuracy').get(function() {
  if (this.statistics.answeredQuestions === 0) return 0
  return Math.round((this.statistics.correctAnswers / this.statistics.answeredQuestions) * 100)
})

// 虚拟字段：完成率
studyRecordSchema.virtual('completionRate').get(function() {
  if (this.statistics.totalQuestions === 0) return 0
  return Math.round((this.statistics.answeredQuestions / this.statistics.totalQuestions) * 100)
})

// 更新学习记录统计
studyRecordSchema.methods.updateStatistics = function() {
  this.statistics.answeredQuestions = this.answers.length
  this.statistics.correctAnswers = this.answers.filter(answer => answer.isCorrect).length
  this.statistics.wrongAnswers = this.answers.filter(answer => answer.isCorrect === false).length
  
  // 计算总用时
  this.totalTime = this.answers.reduce((total, answer) => total + answer.timeSpent, 0)
  
  // 计算平均答题时间
  if (this.statistics.answeredQuestions > 0) {
    this.statistics.averageTimePerQuestion = Math.round(this.totalTime / this.statistics.answeredQuestions)
  }
  
  // 计算得分百分比
  if (this.score.total > 0) {
    this.score.percentage = Math.round((this.score.obtained / this.score.total) * 100)
  }
  
  return this.save()
}

// 添加答案
studyRecordSchema.methods.addAnswer = function(questionId, userAnswer, isCorrect, timeSpent) {
  const existingAnswerIndex = this.answers.findIndex(
    answer => answer.question.toString() === questionId.toString()
  )
  
  if (existingAnswerIndex >= 0) {
    // 更新现有答案
    this.answers[existingAnswerIndex].userAnswer = userAnswer
    this.answers[existingAnswerIndex].isCorrect = isCorrect
    this.answers[existingAnswerIndex].timeSpent += timeSpent
    this.answers[existingAnswerIndex].attempts += 1
    this.answers[existingAnswerIndex].answeredAt = new Date()
  } else {
    // 添加新答案
    this.answers.push({
      question: questionId,
      userAnswer,
      isCorrect,
      timeSpent
    })
  }
  
  return this.updateStatistics()
}

// 完成学习记录
studyRecordSchema.methods.complete = function() {
  this.status = 'completed'
  this.endTime = new Date()
  return this.updateStatistics()
}

// 分析薄弱知识点
studyRecordSchema.methods.analyzeWeakPoints = async function() {
  await this.populate('answers.question')
  
  const knowledgePointStats = {}
  
  this.answers.forEach(answer => {
    if (answer.question && answer.question.knowledgePoints) {
      answer.question.knowledgePoints.forEach(point => {
        if (!knowledgePointStats[point]) {
          knowledgePointStats[point] = {
            total: 0,
            correct: 0,
            questions: []
          }
        }
        
        knowledgePointStats[point].total += 1
        knowledgePointStats[point].questions.push(answer.question._id)
        
        if (answer.isCorrect) {
          knowledgePointStats[point].correct += 1
        }
      })
    }
  })
  
  // 识别薄弱点（正确率低于70%）
  this.weakPoints = Object.entries(knowledgePointStats)
    .filter(([_, stats]) => stats.correct / stats.total < 0.7)
    .map(([point, stats]) => ({
      knowledgePoint: point,
      errorCount: stats.total - stats.correct,
      questions: stats.questions
    }))
  
  // 识别强项（正确率高于90%）
  this.strongPoints = Object.entries(knowledgePointStats)
    .filter(([_, stats]) => stats.correct / stats.total > 0.9)
    .map(([point, stats]) => ({
      knowledgePoint: point,
      correctCount: stats.correct,
      questions: stats.questions
    }))
  
  return this.save()
}

// 获取学习报告
studyRecordSchema.methods.getReport = function() {
  return {
    id: this._id,
    type: this.type,
    status: this.status,
    duration: this.totalTime,
    score: this.score,
    accuracy: this.accuracy,
    completionRate: this.completionRate,
    statistics: this.statistics,
    weakPoints: this.weakPoints,
    strongPoints: this.strongPoints,
    startTime: this.startTime,
    endTime: this.endTime
  }
}

export default mongoose.model('StudyRecord', studyRecordSchema)