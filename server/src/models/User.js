import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供用户名'],
    trim: true,
    maxlength: [50, '用户名不能超过50个字符']
  },
  email: {
    type: String,
    required: [true, '请提供邮箱地址'],
    unique: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      '请提供有效的邮箱地址'
    ]
  },
  password: {
    type: String,
    required: [true, '请提供密码'],
    minlength: [6, '密码至少需要6个字符'],
    select: false // 默认查询时不返回密码
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  school: {
    type: String,
    trim: true,
    maxlength: [100, '学校名称不能超过100个字符']
  },
  grade: {
    type: String,
    enum: ['高一', '高二', '高三', '其他'],
    default: '高一'
  },
  subjects: [{
    type: String,
    enum: ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
  }],
  preferences: {
    studyReminder: {
      type: Boolean,
      default: true
    },
    emailNotification: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  stats: {
    totalStudyTime: {
      type: Number,
      default: 0 // 总学习时间（分钟）
    },
    questionsAnswered: {
      type: Number,
      default: 0 // 已答题目数
    },
    correctAnswers: {
      type: Number,
      default: 0 // 正确答案数
    },
    papersUploaded: {
      type: Number,
      default: 0 // 上传试卷数
    },
    streak: {
      type: Number,
      default: 0 // 连续学习天数
    },
    lastStudyDate: {
      type: Date,
      default: null
    }
  },
  achievements: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
})

// 密码加密中间件
userSchema.pre('save', async function(next) {
  // 如果密码没有被修改，跳过加密
  if (!this.isModified('password')) {
    next()
  }

  // 加密密码
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// 密码验证方法
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// 获取用户统计信息
userSchema.methods.getStats = function() {
  const accuracy = this.stats.questionsAnswered > 0 
    ? Math.round((this.stats.correctAnswers / this.stats.questionsAnswered) * 100)
    : 0

  return {
    totalStudyTime: this.stats.totalStudyTime,
    questionsAnswered: this.stats.questionsAnswered,
    correctAnswers: this.stats.correctAnswers,
    accuracy,
    papersUploaded: this.stats.papersUploaded,
    streak: this.stats.streak,
    achievements: this.achievements.length
  }
}

// 更新学习统计
userSchema.methods.updateStudyStats = function(studyTime, isCorrect = null) {
  this.stats.totalStudyTime += studyTime
  
  if (isCorrect !== null) {
    this.stats.questionsAnswered += 1
    if (isCorrect) {
      this.stats.correctAnswers += 1
    }
  }

  // 更新连续学习天数
  const today = new Date()
  const lastStudy = this.stats.lastStudyDate
  
  if (!lastStudy || !isSameDay(lastStudy, today)) {
    if (lastStudy && isConsecutiveDay(lastStudy, today)) {
      this.stats.streak += 1
    } else if (!lastStudy || !isConsecutiveDay(lastStudy, today)) {
      this.stats.streak = 1
    }
    this.stats.lastStudyDate = today
  }

  return this.save()
}

// 辅助函数：检查是否为同一天
function isSameDay(date1, date2) {
  return date1.toDateString() === date2.toDateString()
}

// 辅助函数：检查是否为连续的天
function isConsecutiveDay(lastDate, currentDate) {
  const diffTime = Math.abs(currentDate - lastDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays === 1
}

export default mongoose.model('User', userSchema)