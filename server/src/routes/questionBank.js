import express from 'express';
import Question from '../models/Question.js';
import mongoose from 'mongoose';

const router = express.Router();

// 支持的学科列表
const SUPPORTED_SUBJECTS = [
  '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'
];

// 验证学科参数
const validateSubject = (req, res, next) => {
  const { subject } = req.params;
  if (!SUPPORTED_SUBJECTS.includes(subject)) {
    return res.status(400).json({
      success: false,
      message: `不支持的学科: ${subject}。支持的学科: ${SUPPORTED_SUBJECTS.join(', ')}`
    });
  }
  next();
};

// 获取学科题目列表
router.get('/:subject', validateSubject, async (req, res) => {
  try {
    const { subject } = req.params;
    const {
      page = 1,
      limit = 20,
      type,
      difficulty,
      keyword,
      knowledgePoint,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = { subject };
    
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (knowledgePoint) query.knowledgePoints = { $in: [knowledgePoint] };
    if (keyword) {
      query.$or = [
        { content: { $regex: keyword, $options: 'i' } },
        { explanation: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // 排序参数
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 执行查询
    const [questions, total] = await Promise.all([
      Question.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-__v')
        .lean(),
      Question.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          limit: limitNum,
          totalItems: total,
          hasNext,
          hasPrev
        }
      }
    });
  } catch (error) {
    console.error('获取题目列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取题目列表失败',
      error: error.message
    });
  }
});

// 获取学科统计信息
router.get('/:subject/stats', validateSubject, async (req, res) => {
  try {
    const { subject } = req.params;

    // 总数统计
    const total = await Question.countDocuments({ subject });

    // 按类型统计
    const byType = await Question.aggregate([
      { $match: { subject } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 按难度统计
    const byDifficulty = await Question.aggregate([
      { $match: { subject } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 最近7天的活动
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await Question.aggregate([
      {
        $match: {
          subject,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        byType: byType.map(item => ({ type: item._id, count: item.count })),
        byDifficulty: byDifficulty.map(item => ({ difficulty: item._id, count: item.count })),
        recentActivity: recentActivity.map(item => ({ date: item._id, count: item.count }))
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

// 创建题目
router.post('/:subject', validateSubject, async (req, res) => {
  try {
    const { subject } = req.params;
    const questionData = {
      ...req.body,
      subject,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 验证必填字段
    if (!questionData.content) {
      return res.status(400).json({
        success: false,
        message: '题目内容不能为空'
      });
    }

    if (!questionData.type) {
      return res.status(400).json({
        success: false,
        message: '题目类型不能为空'
      });
    }

    const question = new Question(questionData);
    await question.save();

    res.status(201).json({
      success: true,
      message: '题目创建成功',
      data: {
        questionId: question._id
      }
    });
  } catch (error) {
    console.error('创建题目失败:', error);
    res.status(500).json({
      success: false,
      message: '创建题目失败',
      error: error.message
    });
  }
});

// 获取单个题目详情
router.get('/:subject/:id', validateSubject, async (req, res) => {
  try {
    const { subject, id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的题目ID'
      });
    }

    const question = await Question.findOne({ _id: id, subject }).select('-__v');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('获取题目详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取题目详情失败',
      error: error.message
    });
  }
});

// 更新题目
router.put('/:subject/:id', validateSubject, async (req, res) => {
  try {
    const { subject, id } = req.params;
    const updateData = {
      ...req.body,
      subject,
      updatedAt: new Date()
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的题目ID'
      });
    }

    const question = await Question.findOneAndUpdate(
      { _id: id, subject },
      updateData,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    res.json({
      success: true,
      message: '题目更新成功',
      data: question
    });
  } catch (error) {
    console.error('更新题目失败:', error);
    res.status(500).json({
      success: false,
      message: '更新题目失败',
      error: error.message
    });
  }
});

// 删除题目
router.delete('/:subject/:id', validateSubject, async (req, res) => {
  try {
    const { subject, id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的题目ID'
      });
    }

    const question = await Question.findOneAndDelete({ _id: id, subject });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    res.json({
      success: true,
      message: '题目删除成功'
    });
  } catch (error) {
    console.error('删除题目失败:', error);
    res.status(500).json({
      success: false,
      message: '删除题目失败',
      error: error.message
    });
  }
});

// 批量操作
router.post('/:subject/batch', validateSubject, async (req, res) => {
  try {
    const { subject } = req.params;
    const { action, questionIds, data } = req.body;

    if (!action || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的批量操作参数'
      });
    }

    // 验证所有ID的有效性
    const invalidIds = questionIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `无效的题目ID: ${invalidIds.join(', ')}`
      });
    }

    let result;
    switch (action) {
      case 'delete':
        result = await Question.deleteMany({
          _id: { $in: questionIds },
          subject
        });
        res.json({
          success: true,
          message: `成功删除 ${result.deletedCount} 道题目`,
          data: { deletedCount: result.deletedCount }
        });
        break;

      case 'update':
        if (!data) {
          return res.status(400).json({
            success: false,
            message: '批量更新需要提供更新数据'
          });
        }
        result = await Question.updateMany(
          { _id: { $in: questionIds }, subject },
          { ...data, updatedAt: new Date() }
        );
        res.json({
          success: true,
          message: `成功更新 ${result.modifiedCount} 道题目`,
          data: { modifiedCount: result.modifiedCount }
        });
        break;

      case 'export':
        const questions = await Question.find({
          _id: { $in: questionIds },
          subject
        }).select('-__v').lean();
        
        res.json({
          success: true,
          message: `成功导出 ${questions.length} 道题目`,
          data: { questions }
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `不支持的批量操作: ${action}`
        });
    }
  } catch (error) {
    console.error('批量操作失败:', error);
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
});

// 获取所有支持的学科
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      subjects: SUPPORTED_SUBJECTS
    }
  });
});

export default router;