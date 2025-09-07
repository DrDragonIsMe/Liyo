import mongoose from 'mongoose';

// 知识点Schema
const knowledgePointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  difficulty: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },
  type: {
    type: String,
    enum: ['concept', 'skill', 'analysis', 'evaluation'],
    default: 'concept'
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgePoint'
  }],
  estimatedTime: {
    type: Number, // 预计学习时间（分钟）
    default: 30
  },
  tags: [String]
});

// 单元Schema
const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  order: {
    type: Number,
    default: 0
  },
  knowledgePoints: [knowledgePointSchema]
});

// 模块Schema（必修/选修）
const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['compulsory', 'elective'],
    required: true
  },
  description: String,
  units: [unitSchema]
});

// 学科Schema
const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  modules: [moduleSchema],
  totalKnowledgePoints: {
    type: Number,
    default: 0
  },
  averageDifficulty: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 计算总知识点数量
subjectSchema.methods.calculateTotalKnowledgePoints = function() {
  let total = 0;
  this.modules.forEach(module => {
    module.units.forEach(unit => {
      total += unit.knowledgePoints.length;
    });
  });
  this.totalKnowledgePoints = total;
  return total;
};

// 计算平均难度
subjectSchema.methods.calculateAverageDifficulty = function() {
  let totalDifficulty = 0;
  let count = 0;
  
  this.modules.forEach(module => {
    module.units.forEach(unit => {
      unit.knowledgePoints.forEach(kp => {
        totalDifficulty += kp.difficulty;
        count++;
      });
    });
  });
  
  this.averageDifficulty = count > 0 ? totalDifficulty / count : 1;
  return this.averageDifficulty;
};

// 获取所有知识点
subjectSchema.methods.getAllKnowledgePoints = function() {
  const knowledgePoints = [];
  this.modules.forEach(module => {
    module.units.forEach(unit => {
      unit.knowledgePoints.forEach(kp => {
        knowledgePoints.push({
          ...kp.toObject(),
          moduleName: module.name,
          moduleType: module.type,
          unitName: unit.name
        });
      });
    });
  });
  return knowledgePoints;
};

// 根据难度获取知识点
subjectSchema.methods.getKnowledgePointsByDifficulty = function(difficulty) {
  return this.getAllKnowledgePoints().filter(kp => kp.difficulty === difficulty);
};

// 根据类型获取知识点
subjectSchema.methods.getKnowledgePointsByType = function(type) {
  return this.getAllKnowledgePoints().filter(kp => kp.type === type);
};

export default mongoose.model('Subject', subjectSchema);