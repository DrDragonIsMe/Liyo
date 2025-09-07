import express from 'express';
import LearningPath from '../models/LearningPath.js';
import Subject from '../models/Subject.js';
import learningPathService from '../services/learningPathService.js';
import { authenticateToken } from '../middleware/auth.js';
import { CURRICULUM_STANDARDS } from '../data/curriculumStandards.js';

const router = express.Router();

// 获取所有可用学科
router.get('/subjects', authenticateToken, async (req, res) => {
  try {
    const subjects = Object.entries(CURRICULUM_STANDARDS).map(([code, data]) => ({
      code,
      name: data.name,
      modules: Object.keys(data.modules),
      totalUnits: Object.values(data.modules).reduce((sum, module) => sum + module.units.length, 0)
    }));

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('获取学科列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学科列表失败',
      error: error.message
    });
  }
});

// 获取特定学科的详细信息
router.get('/subjects/:subjectCode', authenticateToken, async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const subjectData = CURRICULUM_STANDARDS[subjectCode];
    
    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: '学科不存在'
      });
    }

    res.json({
      success: true,
      data: subjectData
    });
  } catch (error) {
    console.error('获取学科详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学科详情失败',
      error: error.message
    });
  }
});

// 创建学习路径
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // 验证必要参数
    if (!preferences.subjects || !Array.isArray(preferences.subjects) || preferences.subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择至少一个学科'
      });
    }

    // 验证学科代码
    const invalidSubjects = preferences.subjects.filter(subject => !CURRICULUM_STANDARDS[subject]);
    if (invalidSubjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: `无效的学科代码: ${invalidSubjects.join(', ')}`
      });
    }

    const result = await learningPathService.generateLearningPath(userId, preferences);

    res.json({
      success: true,
      message: '学习路径生成成功',
      data: result
    });
  } catch (error) {
    console.error('生成学习路径失败:', error);
    res.status(500).json({
      success: false,
      message: '生成学习路径失败',
      error: error.message
    });
  }
});

// 获取用户的学习路径列表
router.get('/my-paths', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId, isActive: true };
    if (status) {
      query.status = status;
    }

    const learningPaths = await LearningPath.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-steps'); // 不返回详细步骤，提高性能

    const total = await LearningPath.countDocuments(query);

    res.json({
      success: true,
      data: {
        learningPaths,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total
        }
      }
    });
  } catch (error) {
    console.error('获取学习路径列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习路径列表失败',
      error: error.message
    });
  }
});

// 获取特定学习路径的详细信息
router.get('/:pathId', authenticateToken, async (req, res) => {
  try {
    const { pathId } = req.params;
    const userId = req.user.id;

    const learningPath = await LearningPath.findOne({
      _id: pathId,
      userId,
      isActive: true
    });

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: '学习路径不存在'
      });
    }

    // 更新进度
    learningPath.updateCompletedSteps();
    learningPath.calculateProgress();
    await learningPath.save();

    res.json({
      success: true,
      data: learningPath
    });
  } catch (error) {
    console.error('获取学习路径详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习路径详情失败',
      error: error.message
    });
  }
});

// 更新学习步骤状态
router.put('/:pathId/steps/:stepId', authenticateToken, async (req, res) => {
  try {
    const { pathId, stepId } = req.params;
    const { status, masteryScore, timeSpent } = req.body;
    const userId = req.user.id;

    const learningPath = await LearningPath.findOne({
      _id: pathId,
      userId,
      isActive: true
    });

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: '学习路径不存在'
      });
    }

    const step = learningPath.steps.id(stepId);
    if (!step) {
      return res.status(404).json({
        success: false,
        message: '学习步骤不存在'
      });
    }

    // 更新步骤状态
    if (status) {
      step.status = status;
      if (status === 'in_progress' && !step.startedAt) {
        step.startedAt = new Date();
      }
      if ((status === 'completed' || status === 'mastered') && !step.completedAt) {
        step.completedAt = new Date();
      }
    }

    if (masteryScore !== undefined) {
      step.masteryScore = Math.max(0, Math.min(100, masteryScore));
      step.attempts += 1;
    }

    if (timeSpent) {
      learningPath.actualTimeSpent += timeSpent;
    }

    // 更新整体进度
    learningPath.updateCompletedSteps();
    learningPath.calculateProgress();
    learningPath.updatePerformanceMetrics();

    await learningPath.save();

    res.json({
      success: true,
      message: '学习步骤更新成功',
      data: {
        step,
        progress: learningPath.progress,
        completedSteps: learningPath.completedSteps
      }
    });
  } catch (error) {
    console.error('更新学习步骤失败:', error);
    res.status(500).json({
      success: false,
      message: '更新学习步骤失败',
      error: error.message
    });
  }
});

// 获取下一个推荐学习步骤
router.get('/:pathId/next-steps', authenticateToken, async (req, res) => {
  try {
    const { pathId } = req.params;
    const { count = 3 } = req.query;
    const userId = req.user.id;

    const learningPath = await LearningPath.findOne({
      _id: pathId,
      userId,
      isActive: true
    });

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: '学习路径不存在'
      });
    }

    const nextSteps = learningPath.recommendNextSteps(parseInt(count));
    const currentStep = learningPath.getCurrentStep();

    res.json({
      success: true,
      data: {
        currentStep,
        recommendedSteps: nextSteps,
        totalRemaining: learningPath.totalSteps - learningPath.completedSteps
      }
    });
  } catch (error) {
    console.error('获取推荐步骤失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐步骤失败',
      error: error.message
    });
  }
});

// 获取学习路径统计信息
router.get('/:pathId/analytics', authenticateToken, async (req, res) => {
  try {
    const { pathId } = req.params;
    const userId = req.user.id;

    const learningPath = await LearningPath.findOne({
      _id: pathId,
      userId,
      isActive: true
    });

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: '学习路径不存在'
      });
    }

    const analytics = {
      overview: {
        totalSteps: learningPath.totalSteps,
        completedSteps: learningPath.completedSteps,
        progress: learningPath.progress,
        estimatedTotalTime: learningPath.estimatedTotalTime,
        actualTimeSpent: learningPath.actualTimeSpent,
        efficiency: learningPath.actualTimeSpent > 0 ? 
          (learningPath.estimatedTotalTime / learningPath.actualTimeSpent) * 100 : 0
      },
      performance: learningPath.performanceMetrics,
      subjectProgress: {},
      difficultyProgress: { 1: 0, 2: 0, 3: 0, 4: 0 },
      weeklyProgress: this.calculateWeeklyProgress(learningPath),
      estimatedCompletion: learningPath.calculateEstimatedCompletion()
    };

    // 计算各学科进度
    learningPath.subjects.forEach(subject => {
      const subjectSteps = learningPath.steps.filter(step => step.subjectCode === subject);
      const completedSubjectSteps = subjectSteps.filter(step => 
        step.status === 'completed' || step.status === 'mastered'
      );
      
      analytics.subjectProgress[subject] = {
        total: subjectSteps.length,
        completed: completedSubjectSteps.length,
        progress: subjectSteps.length > 0 ? 
          Math.round((completedSubjectSteps.length / subjectSteps.length) * 100) : 0
      };
    });

    // 计算各难度进度
    [1, 2, 3, 4].forEach(difficulty => {
      const difficultySteps = learningPath.steps.filter(step => step.difficulty === difficulty);
      const completedDifficultySteps = difficultySteps.filter(step => 
        step.status === 'completed' || step.status === 'mastered'
      );
      
      analytics.difficultyProgress[difficulty] = {
        total: difficultySteps.length,
        completed: completedDifficultySteps.length,
        progress: difficultySteps.length > 0 ? 
          Math.round((completedDifficultySteps.length / difficultySteps.length) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('获取学习分析失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习分析失败',
      error: error.message
    });
  }
});

// 暂停/恢复学习路径
router.put('/:pathId/status', authenticateToken, async (req, res) => {
  try {
    const { pathId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['active', 'paused', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const learningPath = await LearningPath.findOne({
      _id: pathId,
      userId,
      isActive: true
    });

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: '学习路径不存在'
      });
    }

    learningPath.status = status;
    if (status === 'completed') {
      learningPath.actualEndDate = new Date();
    }

    await learningPath.save();

    res.json({
      success: true,
      message: '状态更新成功',
      data: {
        status: learningPath.status,
        actualEndDate: learningPath.actualEndDate
      }
    });
  } catch (error) {
    console.error('更新学习路径状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新学习路径状态失败',
      error: error.message
    });
  }
});

// 删除学习路径
router.delete('/:pathId', authenticateToken, async (req, res) => {
  try {
    const { pathId } = req.params;
    const userId = req.user.id;

    const learningPath = await LearningPath.findOne({
      _id: pathId,
      userId,
      isActive: true
    });

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: '学习路径不存在'
      });
    }

    learningPath.isActive = false;
    await learningPath.save();

    res.json({
      success: true,
      message: '学习路径删除成功'
    });
  } catch (error) {
    console.error('删除学习路径失败:', error);
    res.status(500).json({
      success: false,
      message: '删除学习路径失败',
      error: error.message
    });
  }
});

// 辅助函数：计算周进度
function calculateWeeklyProgress(learningPath) {
  const weeklyData = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const completedSteps = learningPath.steps.filter(step => 
      step.completedAt && 
      step.completedAt >= dayStart && 
      step.completedAt <= dayEnd
    ).length;
    
    weeklyData.push({
      date: date.toISOString().split('T')[0],
      completed: completedSteps
    });
  }
  
  return weeklyData;
}

export default router;