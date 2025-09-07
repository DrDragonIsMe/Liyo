import Subject from '../models/Subject.js';
import LearningPath from '../models/LearningPath.js';
import User from '../models/User.js';
import { CURRICULUM_STANDARDS, DIFFICULTY_LEVELS, KNOWLEDGE_TYPES } from '../data/curriculumStandards.js';
import aiService from './aiService.js';

class LearningPathService {
  /**
   * 为用户生成个性化学习路径
   * @param {string} userId - 用户ID
   * @param {Object} preferences - 学习偏好
   * @param {Array} subjects - 选择的学科
   * @param {string} targetLevel - 目标水平
   * @param {Object} currentAbilities - 当前能力评估
   * @returns {Promise<Object>} 生成的学习路径
   */
  async generateLearningPath(userId, preferences = {}) {
    try {
      const {
        subjects = ['chinese', 'mathematics', 'english'],
        targetLevel = 'intermediate',
        currentLevel = 'beginner',
        learningGoals = [],
        timeConstraints = {},
        difficultyPreference = 'adaptive'
      } = preferences;

      // 获取用户信息
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 分析用户当前能力
      const currentAbilities = await this.analyzeUserAbilities(userId, subjects);

      // 生成学习步骤
      const learningSteps = await this.generateLearningSteps(
        subjects,
        currentAbilities,
        targetLevel,
        difficultyPreference
      );

      // 优化学习路径
      const optimizedSteps = await this.optimizeLearningPath(
        learningSteps,
        timeConstraints,
        currentAbilities
      );

      // 创建学习路径
      const learningPath = new LearningPath({
        userId,
        title: `${user.username}的个性化学习路径`,
        description: `基于人教版课程标准，涵盖${subjects.join('、')}等学科的个性化学习计划`,
        subjects,
        targetLevel,
        currentLevel,
        learningGoals,
        steps: optimizedSteps,
        totalSteps: optimizedSteps.length,
        estimatedTotalTime: optimizedSteps.reduce((total, step) => total + step.estimatedTime, 0),
        status: 'active',
        startDate: new Date(),
        targetEndDate: this.calculateTargetEndDate(optimizedSteps, timeConstraints)
      });

      await learningPath.save();

      // 生成AI学习建议
      const aiRecommendations = await this.generateAIRecommendations(
        learningPath,
        currentAbilities
      );

      return {
        learningPath,
        recommendations: aiRecommendations,
        analytics: {
          totalKnowledgePoints: optimizedSteps.length,
          estimatedCompletionTime: learningPath.estimatedTotalTime,
          difficultyDistribution: this.analyzeDifficultyDistribution(optimizedSteps),
          subjectDistribution: this.analyzeSubjectDistribution(optimizedSteps)
        }
      };
    } catch (error) {
      console.error('生成学习路径失败:', error);
      throw error;
    }
  }

  /**
   * 分析用户当前能力
   * @param {string} userId - 用户ID
   * @param {Array} subjects - 学科列表
   * @returns {Promise<Object>} 能力分析结果
   */
  async analyzeUserAbilities(userId, subjects) {
    try {
      const abilities = {};
      
      for (const subjectCode of subjects) {
        const userHistory = await this.getUserSubjectHistory(userId, subjectCode);
        
        abilities[subjectCode] = {
          currentLevel: this.calculateCurrentLevel(userHistory),
          strengths: this.identifyStrengths(userHistory),
          weaknesses: this.identifyWeaknesses(userHistory),
          learningStyle: this.analyzeLearningStyle(userHistory),
          completedTopics: userHistory.completedTopics || [],
          averageScore: userHistory.averageScore || 0,
          totalStudyTime: userHistory.totalStudyTime || 0
        };
      }
      
      return abilities;
    } catch (error) {
      console.error('分析用户能力失败:', error);
      // 返回默认能力评估
      const defaultAbilities = {};
      subjects.forEach(subject => {
        defaultAbilities[subject] = {
          currentLevel: 'beginner',
          strengths: [],
          weaknesses: [],
          learningStyle: 'balanced',
          completedTopics: [],
          averageScore: 0,
          totalStudyTime: 0
        };
      });
      return defaultAbilities;
    }
  }

  /**
   * 生成学习步骤
   * @param {Array} subjects - 学科列表
   * @param {Object} currentAbilities - 当前能力
   * @param {string} targetLevel - 目标水平
   * @param {string} difficultyPreference - 难度偏好
   * @returns {Promise<Array>} 学习步骤列表
   */
  async generateLearningSteps(subjects, currentAbilities, targetLevel, difficultyPreference) {
    const allSteps = [];
    let stepOrder = 1;
    
    for (const subjectCode of subjects) {
      const subjectStandard = CURRICULUM_STANDARDS[subjectCode];
      if (!subjectStandard) {
        console.warn(`未找到学科 ${subjectCode} 的课程标准`);
        continue;
      }
      
      const userAbility = currentAbilities[subjectCode] || {
        currentLevel: 'beginner',
        strengths: [],
        weaknesses: [],
        completedTopics: []
      };
      
      const subjectSteps = this.generateSubjectSteps(
        subjectCode,
        subjectStandard,
        userAbility,
        targetLevel,
        stepOrder
      );
      
      allSteps.push(...subjectSteps);
      stepOrder += subjectSteps.length;
    }
    
    return allSteps;
  }

  /**
   * 为单个学科生成学习步骤
   * @param {string} subjectCode - 学科代码
   * @param {Object} subjectStandard - 学科标准
   * @param {Object} userAbility - 用户能力
   * @param {string} targetLevel - 目标水平
   * @param {number} startOrder - 起始顺序
   * @returns {Array} 学科学习步骤
   */
  generateSubjectSteps(subjectCode, subjectStandard, userAbility, targetLevel, startOrder) {
    const steps = [];
    let currentOrder = startOrder;
    
    // 处理必修课程
    if (subjectStandard.modules.compulsory) {
      const compulsorySteps = this.processModule(
        subjectCode,
        subjectStandard.modules.compulsory,
        userAbility,
        targetLevel,
        currentOrder,
        'compulsory'
      );
      steps.push(...compulsorySteps);
      currentOrder += compulsorySteps.length;
    }
    
    // 根据目标水平决定是否包含选修课程
    if (targetLevel !== 'basic' && subjectStandard.modules.elective) {
      const electiveSteps = this.processModule(
        subjectCode,
        subjectStandard.modules.elective,
        userAbility,
        targetLevel,
        currentOrder,
        'elective'
      );
      steps.push(...electiveSteps);
    }
    
    return steps;
  }

  /**
   * 处理模块（必修/选修）
   * @param {string} subjectCode - 学科代码
   * @param {Object} module - 模块信息
   * @param {Object} userAbility - 用户能力
   * @param {string} targetLevel - 目标水平
   * @param {number} startOrder - 起始顺序
   * @param {string} moduleType - 模块类型
   * @returns {Array} 模块学习步骤
   */
  processModule(subjectCode, module, userAbility, targetLevel, startOrder, moduleType) {
    const steps = [];
    let currentOrder = startOrder;
    
    for (const unit of module.units) {
      for (const topic of unit.topics) {
        // 跳过已完成的知识点
        if (userAbility.completedTopics.includes(topic)) {
          continue;
        }
        
        const difficulty = this.calculateTopicDifficulty(
          topic,
          subjectCode,
          moduleType,
          userAbility
        );
        
        const estimatedTime = this.calculateEstimatedTime(
          topic,
          difficulty,
          userAbility.learningStyle
        );
        
        const prerequisites = this.identifyPrerequisites(topic, steps);
        const resources = this.generateResources(topic, subjectCode, difficulty);
        
        const step = {
          id: `${subjectCode}_${unit.name}_${topic}`.replace(/\s+/g, '_'),
          order: currentOrder++,
          subject: subjectCode,
          subjectName: CURRICULUM_STANDARDS[subjectCode].name,
          module: module.name,
          unit: unit.name,
          topic,
          difficulty,
          estimatedTime,
          prerequisites,
          resources,
          knowledgeType: this.determineKnowledgeType(topic),
          isCompleted: false,
          completedAt: null,
          score: null,
          notes: ''
        };
        
        steps.push(step);
      }
    }
    
    return steps;
  }

  /**
   * 优化学习路径
   * @param {Array} steps - 原始学习步骤
   * @param {Object} timeConstraints - 时间约束
   * @param {Object} currentAbilities - 当前能力
   * @returns {Array} 优化后的学习步骤
   */
  async optimizeLearningPath(steps, timeConstraints, currentAbilities) {
    // 1. 根据依赖关系排序
    const sortedSteps = this.topologicalSort(steps);

    // 2. 根据时间约束调整
    const timeAdjustedSteps = this.adjustForTimeConstraints(sortedSteps, timeConstraints);

    // 3. 根据学习效率优化
    const optimizedSteps = this.optimizeForLearningEfficiency(timeAdjustedSteps, currentAbilities);

    // 4. 平衡学科分布
    const balancedSteps = this.balanceSubjectDistribution(optimizedSteps);

    return balancedSteps;
  }

  /**
   * 拓扑排序处理依赖关系
   * @param {Array} steps - 学习步骤
   * @returns {Array} 排序后的步骤
   */
  topologicalSort(steps) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (step) => {
      if (visiting.has(step.knowledgePointId.toString())) {
        throw new Error('检测到循环依赖');
      }
      if (visited.has(step.knowledgePointId.toString())) {
        return;
      }

      visiting.add(step.knowledgePointId.toString());

      // 先访问所有前置条件
      step.prerequisites.forEach(prereqId => {
        const prereqStep = steps.find(s => s.knowledgePointId.equals(prereqId));
        if (prereqStep) {
          visit(prereqStep);
        }
      });

      visiting.delete(step.knowledgePointId.toString());
      visited.add(step.knowledgePointId.toString());
      sorted.push(step);
    };

    steps.forEach(step => {
      if (!visited.has(step.knowledgePointId.toString())) {
        visit(step);
      }
    });

    // 重新分配顺序
    sorted.forEach((step, index) => {
      step.order = index + 1;
    });

    return sorted;
  }

  /**
   * 生成AI学习建议
   * @param {Object} learningPath - 学习路径
   * @param {Object} currentAbilities - 当前能力
   * @returns {Promise<Object>} AI建议
   */
  async generateAIRecommendations(learningPath, currentAbilities) {
    try {
      const prompt = `
        基于以下学习路径和用户能力分析，请提供个性化的学习建议：
        
        学习路径信息：
        - 目标水平：${learningPath.targetLevel}
        - 当前水平：${learningPath.currentLevel}
        - 涉及学科：${learningPath.subjects.join('、')}
        - 总学习步骤：${learningPath.totalSteps}
        - 预计时间：${Math.round(learningPath.estimatedTotalTime / 60)}小时
        
        用户能力分析：
        ${JSON.stringify(currentAbilities, null, 2)}
        
        请提供以下方面的建议：
        1. 学习策略和方法
        2. 时间安排建议
        3. 重点关注领域
        4. 可能的挑战和应对方法
        5. 学习资源推荐
        
        请用中文回答，内容要具体实用。
      `;

      const aiResponse = await aiService.generateResponse(prompt);
      
      return {
        generalAdvice: aiResponse,
        studyTips: this.generateStudyTips(learningPath, currentAbilities),
        timeManagement: this.generateTimeManagementTips(learningPath),
        motivationalMessages: this.generateMotivationalMessages(learningPath)
      };
    } catch (error) {
      console.error('生成AI建议失败:', error);
      return {
        generalAdvice: '暂时无法生成AI建议，请稍后重试。',
        studyTips: [],
        timeManagement: [],
        motivationalMessages: []
      };
    }
  }

  // 辅助方法
  calculateCurrentLevel(userHistory) {
    if (!userHistory || !userHistory.averageScore) {
      return 'beginner';
    }
    
    const score = userHistory.averageScore;
    if (score >= 90) return 'expert';
    if (score >= 80) return 'advanced';
    if (score >= 70) return 'intermediate';
    return 'beginner';
  }

  identifyStrengths(userHistory) {
    return userHistory?.strengths || [];
  }

  identifyWeaknesses(userHistory) {
    return userHistory?.weaknesses || [];
  }

  analyzeLearningStyle(userHistory) {
    return userHistory?.learningStyle || 'balanced';
  }

  calculateTopicDifficulty(topic, subjectCode, moduleType, userAbility) {
    let baseDifficulty = moduleType === 'compulsory' ? 2 : 3;
    
    // 根据用户能力调整
    const levelMap = { beginner: 1, basic: 2, intermediate: 3, advanced: 4, expert: 5 };
    const userLevel = levelMap[userAbility.currentLevel] || 1;
    
    // 根据用户当前水平调整基础难度
    if (userAbility.currentLevel === 'beginner') {
      baseDifficulty = Math.max(baseDifficulty - 1, 1);
    } else if (userAbility.currentLevel === 'expert') {
      baseDifficulty = Math.min(baseDifficulty + 1, 4);
    }
    
    // 如果是用户的弱项，增加难度
    if (userAbility.weaknesses && userAbility.weaknesses.some(weakness => topic.includes(weakness))) {
      baseDifficulty += 1;
    }
    
    // 如果是用户的强项，降低难度
    if (userAbility.strengths && userAbility.strengths.some(strength => topic.includes(strength))) {
      baseDifficulty -= 1;
    }
    
    return Math.max(1, Math.min(4, baseDifficulty));
  }

  calculateEstimatedTime(topic, difficulty, learningStyle) {
    const baseTime = 45; // 基础时间45分钟
    const difficultyMultiplier = [1, 1, 1.2, 1.5, 2][difficulty] || 1;
    
    let styleMultiplier = 1.0;
    switch (learningStyle) {
      case 'visual':
        styleMultiplier = 0.9; // 视觉学习者稍快
        break;
      case 'auditory':
        styleMultiplier = 1.0; // 听觉学习者标准
        break;
      case 'kinesthetic':
        styleMultiplier = 1.2; // 动觉学习者需要更多时间
        break;
      case 'balanced':
      default:
        styleMultiplier = 1.0;
    }
    
    return Math.round(baseTime * difficultyMultiplier * styleMultiplier);
  }

  identifyPrerequisites(topic, existingSteps) {
    const prerequisites = [];
    
    // 基于知识点名称的依赖关系映射
    const dependencyMap = {
      '函数的应用': ['函数的概念与性质', '基本初等函数'],
      '导数应用': ['导数概念', '函数的概念与性质'],
      '立体几何证明': ['空间向量', '平面几何'],
      '有机反应': ['有机物结构', '化学键'],
      '电磁感应': ['电场', '磁场'],
      '解三角形': ['三角函数的概念', '三角恒等变换']
    };
    
    // 查找当前知识点的前置条件
    const topicDeps = dependencyMap[topic] || [];
    
    // 在现有步骤中查找前置条件对应的步骤
    topicDeps.forEach(dep => {
      const prereqStep = existingSteps.find(step => 
        step.topic && (step.topic.includes(dep) || step.topic === dep)
      );
      if (prereqStep) {
        prerequisites.push(prereqStep.id);
      }
    });
    
    // 通用的数学前置条件检查
    if (topic.includes('函数') && !topic.includes('概念')) {
      const funcBasic = existingSteps.find(s => s.topic && s.topic.includes('函数的概念'));
      if (funcBasic && !prerequisites.includes(funcBasic.id)) {
        prerequisites.push(funcBasic.id);
      }
    }
    
    return prerequisites;
  }

  generateResources(topic, subjectCode, difficulty) {
    const resources = {
      videos: [],
      articles: [],
      exercises: [],
      books: []
    };
    
    // 根据学科和难度生成相应资源
    const subjectName = CURRICULUM_STANDARDS[subjectCode]?.name || subjectCode;
    const topicSlug = topic.replace(/\s+/g, '-');
    
    // 基础视频资源
    resources.videos.push({
      type: 'video',
      title: `${topic} - 基础讲解`,
      description: `${topic}的详细视频教程`,
      url: `#video-${subjectCode}-${topicSlug}`,
      duration: '15分钟',
      difficulty: 'basic'
    });
    
    // 根据难度添加进阶视频
    if (difficulty >= 3) {
      resources.videos.push({
        type: 'video',
        title: `${topic} - 进阶应用`,
        description: `${topic}的高级应用和解题技巧`,
        url: `#video-${subjectCode}-${topicSlug}-advanced`,
        duration: '25分钟',
        difficulty: 'advanced'
      });
    }
    
    // 文章资源
    resources.articles.push({
      type: 'article',
      title: `${topic} - 知识点总结`,
      description: `${topic}的重点知识归纳和要点梳理`,
      url: `#article-${subjectCode}-${topicSlug}`,
      readTime: '10分钟'
    });
    
    // 练习题资源
    resources.exercises.push({
      type: 'exercise',
      title: `${topic} - 练习题`,
      description: `${topic}相关的练习题集`,
      url: `#exercise-${subjectCode}-${topicSlug}`,
      count: difficulty * 5,
      difficulty
    });
    
    // 参考书籍
    resources.books.push({
      type: 'book',
      title: `${subjectName}教材 - ${topic}章节`,
      description: `官方教材中关于${topic}的详细内容`,
      url: `#book-${subjectCode}-${topicSlug}`
    });
    
    return resources;
  }

  adjustForTimeConstraints(steps, timeConstraints) {
    if (!timeConstraints || !timeConstraints.dailyStudyTime) {
      return steps;
    }
    
    // 根据每日学习时间调整步骤安排
    const dailyTime = timeConstraints.dailyStudyTime;
    let currentDay = 1;
    let currentDayTime = 0;
    
    return steps.map(step => {
      if (currentDayTime + step.estimatedTime > dailyTime) {
        currentDay++;
        currentDayTime = step.estimatedTime;
      } else {
        currentDayTime += step.estimatedTime;
      }
      
      return {
        ...step,
        scheduledDay: currentDay,
        scheduledTime: currentDayTime - step.estimatedTime
      };
    });
  }

  optimizeForLearningEfficiency(steps, currentAbilities) {
    // 根据用户能力优化步骤顺序
    return steps.sort((a, b) => {
      // 优先安排用户擅长领域的简单知识点
      const aIsStrength = Object.values(currentAbilities).some(ability => 
        ability.strengths && ability.strengths.some(strength => a.topic.includes(strength))
      );
      const bIsStrength = Object.values(currentAbilities).some(ability => 
        ability.strengths && ability.strengths.some(strength => b.topic.includes(strength))
      );
      
      if (aIsStrength && !bIsStrength) return -1;
      if (!aIsStrength && bIsStrength) return 1;
      
      // 其次按难度排序
      return a.difficulty - b.difficulty;
    });
  }

  balanceSubjectDistribution(steps) {
    // 确保各学科均匀分布，避免连续学习同一学科
    const subjects = [...new Set(steps.map(step => step.subject))];
    const balanced = [];
    const subjectQueues = {};
    
    // 按学科分组
    subjects.forEach(subject => {
      subjectQueues[subject] = steps.filter(step => step.subject === subject);
    });
    
    // 轮流从各学科队列中取出步骤
    let currentSubjectIndex = 0;
    while (Object.values(subjectQueues).some(queue => queue.length > 0)) {
      const currentSubject = subjects[currentSubjectIndex];
      if (subjectQueues[currentSubject] && subjectQueues[currentSubject].length > 0) {
        const step = subjectQueues[currentSubject].shift();
        step.order = balanced.length + 1;
        balanced.push(step);
      }
      currentSubjectIndex = (currentSubjectIndex + 1) % subjects.length;
    }
    
    return balanced;
  }

  calculateTargetEndDate(steps, timeConstraints) {
    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const dailyStudyTime = timeConstraints?.dailyStudyTime || 120; // 默认2小时
    const studyDays = Math.ceil(totalTime / dailyStudyTime);
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + studyDays);
    return targetDate;
  }

  analyzeDifficultyDistribution(steps) {
    const distribution = {
      basic: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0
    };
    
    steps.forEach(step => {
      switch (step.difficulty) {
        case 1:
          distribution.basic++;
          break;
        case 2:
          distribution.intermediate++;
          break;
        case 3:
          distribution.advanced++;
          break;
        case 4:
          distribution.expert++;
          break;
        default:
          distribution.intermediate++;
      }
    });
    
    return distribution;
  }

  analyzeSubjectDistribution(steps) {
    const distribution = {};
    
    steps.forEach(step => {
      const subjectName = step.subjectName || step.subject;
      if (!distribution[subjectName]) {
        distribution[subjectName] = 0;
      }
      distribution[subjectName]++;
    });
    
    return distribution;
  }

  generateStudyTips(learningPath, currentAbilities) {
    const tips = [
      '制定每日学习计划，保持规律的学习节奏',
      '及时复习已学内容，巩固知识点',
      '遇到困难时，不要急躁，可以寻求帮助',
      '多做练习题，通过实践加深理解'
    ];
    
    // 根据用户能力添加个性化建议
    Object.entries(currentAbilities).forEach(([subject, ability]) => {
      if (ability.weaknesses && ability.weaknesses.length > 0) {
        tips.push(`在${CURRICULUM_STANDARDS[subject]?.name || subject}学科中，重点关注${ability.weaknesses.join('、')}等薄弱环节`);
      }
      if (ability.strengths && ability.strengths.length > 0) {
        tips.push(`发挥你在${ability.strengths.join('、')}方面的优势，建立学习信心`);
      }
    });
    
    return tips;
  }

  generateTimeManagementTips(learningPath) {
    const tips = [
      '建议每天安排固定的学习时间',
      '合理分配各学科的学习时间',
      '适当安排休息时间，避免疲劳学习',
      '定期回顾学习进度，调整学习计划'
    ];
    
    // 根据学习路径特点添加建议
    if (learningPath.subjects.length > 3) {
      tips.push('学科较多，建议采用轮换学习法，避免单一学科学习过久');
    }
    
    if (learningPath.estimatedTotalTime > 1000) {
      tips.push('学习任务较重，建议分阶段制定目标，逐步完成');
    }
    
    return tips;
  }

  generateMotivationalMessages(learningPath) {
    const messages = [
      '每一步的努力都在为成功铺路！',
      '坚持就是胜利，你已经在正确的道路上！',
      '知识的积累需要时间，但收获是值得的！',
      '相信自己，你有能力完成这个学习目标！',
      '学习是一场马拉松，保持节奏最重要！',
      '今天的努力，就是明天的实力！'
    ];
    
    return messages;
  }

  async getUserSubjectHistory(userId, subjectCode) {
    try {
      // 这里应该从数据库获取用户的学习历史
      // 暂时返回模拟数据，实际应用中需要查询用户的学习记录
      return {
        completedTopics: [],
        averageScore: 0,
        totalStudyTime: 0,
        strengths: [],
        weaknesses: [],
        learningStyle: 'balanced',
        recentPerformance: [],
        studyFrequency: 0
      };
    } catch (error) {
      console.error('获取用户学科历史失败:', error);
      return {
        completedTopics: [],
        averageScore: 0,
        totalStudyTime: 0,
        strengths: [],
        weaknesses: [],
        learningStyle: 'balanced',
        recentPerformance: [],
        studyFrequency: 0
      };
    }
  }

  /**
   * 确定知识类型
   */
  determineKnowledgeType(topic) {
    const conceptKeywords = ['概念', '定义', '理论', '原理', '基础'];
    const skillKeywords = ['计算', '解题', '应用', '操作', '方法'];
    const analysisKeywords = ['分析', '比较', '综合', '推理', '证明'];
    const evaluationKeywords = ['评价', '创新', '设计', '批判', '探究'];
    
    if (conceptKeywords.some(keyword => topic.includes(keyword))) {
      return KNOWLEDGE_TYPES.CONCEPT;
    }
    if (skillKeywords.some(keyword => topic.includes(keyword))) {
      return KNOWLEDGE_TYPES.SKILL;
    }
    if (analysisKeywords.some(keyword => topic.includes(keyword))) {
      return KNOWLEDGE_TYPES.ANALYSIS;
    }
    if (evaluationKeywords.some(keyword => topic.includes(keyword))) {
      return KNOWLEDGE_TYPES.EVALUATION;
    }
    
    return KNOWLEDGE_TYPES.CONCEPT; // 默认为概念类型
  }
}

export default new LearningPathService();