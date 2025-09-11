# 题库管理模块设计文档

## 1. 模块概述

题库管理模块是一个按学科分类的题目管理系统，提供完整的题目增删改查功能，支持批量操作和高级筛选。

## 2. 功能需求

### 2.1 核心功能
- 按学科分类管理题目
- 题目的增删改查操作
- 批量导入/导出题目
- 题目预览和编辑
- 数学公式支持（KaTeX）
- 题目统计和分析

### 2.2 学科管理
- 支持的学科：语文、数学、英语、物理、化学、生物、历史、地理、政治
- 每个学科独立管理题目
- 学科间题目隔离
- 学科统计信息

### 2.3 题目类型支持
- 选择题
- 填空题
- 解答题
- 判断题
- 简答题
- 计算题
- 证明题
- 作文题
- 图片题

## 3. 系统架构

### 3.1 后端架构
```
server/src/
├── routes/
│   ├── questions.js (现有，需扩展)
│   └── questionBank.js (新增)
├── models/
│   └── Question.js (现有)
├── services/
│   └── questionBankService.js (新增)
└── middleware/
    └── questionBankAuth.js (新增)
```

### 3.2 前端架构
```
client/src/
├── pages/
│   └── QuestionBankPage.tsx (新增)
├── components/
│   ├── QuestionBank/
│   │   ├── QuestionBankLayout.tsx
│   │   ├── SubjectSelector.tsx
│   │   ├── QuestionList.tsx
│   │   ├── QuestionEditor.tsx
│   │   ├── QuestionPreview.tsx
│   │   ├── BatchOperations.tsx
│   │   └── QuestionStats.tsx
│   └── common/
│       └── MarkdownRenderer.tsx (现有)
└── store/
    └── questionBankStore.ts (新增)
```

## 4. API 设计

### 4.1 题库管理 API

#### 获取学科题目列表
```
GET /api/question-bank/:subject
Query: page, limit, type, difficulty, keyword
Response: { questions, pagination, stats }
```

#### 创建题目
```
POST /api/question-bank/:subject
Body: { content, type, difficulty, options, correctAnswer, explanation, knowledgePoints }
Response: { success, questionId }
```

#### 更新题目
```
PUT /api/question-bank/:subject/:id
Body: { content, type, difficulty, options, correctAnswer, explanation, knowledgePoints }
Response: { success }
```

#### 删除题目
```
DELETE /api/question-bank/:subject/:id
Response: { success }
```

#### 批量操作
```
POST /api/question-bank/:subject/batch
Body: { action: 'delete'|'export'|'import', questionIds: [], data: {} }
Response: { success, results }
```

#### 学科统计
```
GET /api/question-bank/:subject/stats
Response: { total, byType, byDifficulty, recentActivity }
```

### 4.2 现有API扩展

扩展 `/api/questions` 路由，添加题库管理相关的查询参数和功能。

## 5. 数据模型

### 5.1 Question 模型（现有）
已有完整的Question模型，包含所需的所有字段：
- 基础信息：content, type, subject, difficulty
- 选项和答案：options, correctAnswer, explanation
- 分类信息：knowledgePoints, tags, chapter, section
- 统计信息：statistics, isActive
- 元数据：source, createdBy, timestamps

### 5.2 扩展字段（如需要）
- 题目版本管理
- 审核状态
- 使用频率统计

## 6. 前端界面设计

### 6.1 主界面布局
```
┌─────────────────────────────────────────────────────────┐
│ 题库管理                                                  │
├─────────────────────────────────────────────────────────┤
│ [数学] [物理] [化学] [语文] [英语] [生物] [历史] [地理] [政治] │
├─────────────────────────────────────────────────────────┤
│ 搜索: [___________] 类型:[选择题▼] 难度:[全部▼] [+ 新增题目] │
├─────────────────────────────────────────────────────────┤
│ □ 题目1 - 选择题 - 中等 - 2024-01-15        [编辑] [删除]  │
│ □ 题目2 - 填空题 - 简单 - 2024-01-14        [编辑] [删除]  │
│ □ 题目3 - 解答题 - 困难 - 2024-01-13        [编辑] [删除]  │
├─────────────────────────────────────────────────────────┤
│ [批量删除] [批量导出] [导入题目]           第1页 共10页 >   │
└─────────────────────────────────────────────────────────┘
```

### 6.2 题目编辑器
- 富文本编辑器支持数学公式
- 选项动态添加/删除
- 实时预览功能
- 知识点标签管理

### 6.3 统计面板
- 学科题目总数
- 按类型分布图表
- 按难度分布图表
- 最近活动记录

## 7. 技术实现要点

### 7.1 数学公式支持
- 集成现有的MarkdownRenderer组件
- 支持KaTeX渲染
- 公式编辑器集成

### 7.2 性能优化
- 题目列表虚拟滚动
- 分页加载
- 搜索防抖
- 缓存机制

### 7.3 用户体验
- 响应式设计
- 快捷键支持
- 拖拽排序
- 批量操作确认

## 8. 开发计划

### Phase 1: 基础功能
1. 创建后端API路由
2. 实现基础的增删改查
3. 创建前端页面框架
4. 实现学科切换功能

### Phase 2: 高级功能
1. 批量操作功能
2. 高级搜索和筛选
3. 题目统计面板
4. 导入导出功能

### Phase 3: 优化完善
1. 性能优化
2. 用户体验改进
3. 错误处理完善
4. 测试和文档

## 9. 安全考虑

- 用户权限验证
- 题目访问控制
- 批量操作限制
- 数据备份机制

## 10. 测试策略

- 单元测试：API接口测试
- 集成测试：前后端交互测试
- 用户测试：界面操作测试
- 性能测试：大量数据处理测试