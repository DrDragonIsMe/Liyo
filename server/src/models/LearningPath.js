import mongoose from 'mongoose';

// 学习步骤Schema
const learningStepSchema = new mongoose.Schema({
  knowledgePointId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  knowledgePointName: {
    type: String,
    required: true
  },
  subjectCode: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 4,
    required: true
  },
  estimatedTime: {
    type: Number, // 预计学习时间（分钟）
    required: true
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'mastered'],
    default: 'not_started'
  },
  startedAt: Date,
  completedAt: Date,
  masteryScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  attempts: {
    type: Number,
    default: 0
  },
  resources: [{
    type: {
      type: String,
      enum: ['video', 'article', 'exercise', 'quiz', 'experiment']
    },
    title: String,
    url: String,
    description: String
  }]
});

// 学习路径Schema
const learningPathSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  subjects: [{
    type: String,
    required: true
  }],
  targetLevel: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'basic', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  learningGoals: [{
    subject: String,
    target: String,
    deadline: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  steps: [learningStepSchema],
  totalSteps: {
    type: Number,
    default: 0
  },
  completedSteps: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  estimatedTotalTime: {
    type: Number, // 总预计学习时间（分钟）
    default: 0
  },
  actualTimeSpent: {
    type: Number, // 实际花费时间（分钟）
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  startDate: Date,
  targetEndDate: Date,
  actualEndDate: Date,
  adaptiveSettings: {
    difficultyAdjustment: {
      type: Boolean,
      default: true
    },
    paceAdjustment: {
      type: Boolean,
      default: true
    },
    contentRecommendation: {
      type: Boolean,
      default: true
    }
  },
  performanceMetrics: {
    averageScore: {
      type: Number,
      default: 0
    },
    strongSubjects: [String],
    weakSubjects: [String],
    learningEfficiency: {
      type: Number,
      default: 0
    },
    consistencyScore: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 计算进度
learningPathSchema.methods.calculateProgress = function() {
  if (this.totalSteps === 0) {
    this.progress = 0;
    return 0;
  }
  
  this.progress = Math.round((this.completedSteps / this.totalSteps) * 100);
  return this.progress;
};

// 更新完成步骤数
learningPathSchema.methods.updateCompletedSteps = function() {
  this.completedSteps = this.steps.filter(step => 
    step.status === 'completed' || step.status === 'mastered'
  ).length;
  return this.completedSteps;
};

// 获取下一个学习步骤
learningPathSchema.methods.getNextStep = function() {
  return this.steps.find(step => step.status === 'not_started');
};

// 获取当前进行中的步骤
learningPathSchema.methods.getCurrentStep = function() {
  return this.steps.find(step => step.status === 'in_progress');
};

// 计算预计完成时间
learningPathSchema.methods.calculateEstimatedCompletion = function() {
  const remainingSteps = this.steps.filter(step => 
    step.status === 'not_started' || step.status === 'in_progress'
  );
  
  const remainingTime = remainingSteps.reduce((total, step) => 
    total + step.estimatedTime, 0
  );
  
  // 基于用户的学习效率调整
  const efficiency = this.performanceMetrics.learningEfficiency || 1;
  const adjustedTime = remainingTime / efficiency;
  
  const now = new Date();
  const estimatedCompletion = new Date(now.getTime() + adjustedTime * 60000);
  
  return estimatedCompletion;
};

// 更新性能指标
learningPathSchema.methods.updatePerformanceMetrics = function() {
  const completedSteps = this.steps.filter(step => 
    step.status === 'completed' || step.status === 'mastered'
  );
  
  if (completedSteps.length === 0) return;
  
  // 计算平均分数
  const totalScore = completedSteps.reduce((sum, step) => sum + step.masteryScore, 0);
  this.performanceMetrics.averageScore = totalScore / completedSteps.length;
  
  // 分析强弱学科
  const subjectScores = {};
  completedSteps.forEach(step => {
    if (!subjectScores[step.subjectCode]) {
      subjectScores[step.subjectCode] = { total: 0, count: 0 };
    }
    subjectScores[step.subjectCode].total += step.masteryScore;
    subjectScores[step.subjectCode].count += 1;
  });
  
  const subjectAverages = Object.entries(subjectScores).map(([subject, data]) => ({
    subject,
    average: data.total / data.count
  }));
  
  subjectAverages.sort((a, b) => b.average - a.average);
  
  this.performanceMetrics.strongSubjects = subjectAverages
    .slice(0, Math.ceil(subjectAverages.length / 2))
    .map(item => item.subject);
    
  this.performanceMetrics.weakSubjects = subjectAverages
    .slice(Math.ceil(subjectAverages.length / 2))
    .map(item => item.subject);
  
  // 计算学习效率
  const totalEstimatedTime = completedSteps.reduce((sum, step) => sum + step.estimatedTime, 0);
  if (this.actualTimeSpent > 0 && totalEstimatedTime > 0) {
    this.performanceMetrics.learningEfficiency = totalEstimatedTime / this.actualTimeSpent;
  }
  
  this.lastUpdated = new Date();
};

// 推荐下一步学习内容
learningPathSchema.methods.recommendNextSteps = function(count = 3) {
  const availableSteps = this.steps.filter(step => {
    if (step.status !== 'not_started') return false;
    
    // 检查前置条件是否满足
    return step.prerequisites.every(prereqId => {
      const prereqStep = this.steps.find(s => s.knowledgePointId.equals(prereqId));
      return prereqStep && (prereqStep.status === 'completed' || prereqStep.status === 'mastered');
    });
  });
  
  // 根据难度和用户当前水平排序
  availableSteps.sort((a, b) => {
    // 优先推荐适合当前水平的难度
    const levelMap = { beginner: 1, basic: 2, intermediate: 3, advanced: 4 };
    const currentLevelNum = levelMap[this.currentLevel];
    
    const aDiffScore = Math.abs(a.difficulty - currentLevelNum);
    const bDiffScore = Math.abs(b.difficulty - currentLevelNum);
    
    if (aDiffScore !== bDiffScore) {
      return aDiffScore - bDiffScore;
    }
    
    // 其次按顺序排序
    return a.order - b.order;
  });
  
  return availableSteps.slice(0, count);
};

export default mongoose.model('LearningPath', learningPathSchema);