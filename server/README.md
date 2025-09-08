# Studdy 后端服务

基于 Node.js + Express + MongoDB 的智能学习平台后端服务，提供试卷管理、OCR识别、AI智能伴读等功能。

## 功能特性

### 核心功能
- 🔐 用户认证与权限管理
- 📄 试卷上传与管理
- 🔍 OCR文字识别（基于Azure OpenAI GPT-4 Vision）
- 🤖 AI智能伴读（基于Azure OpenAI GPT-4）
- 📊 学习记录与统计分析
- 💡 个性化学习建议
- ❓ 智能答疑系统
- 📈 学习路径规划

### 技术特性
- RESTful API设计
- JWT身份验证
- 文件上传处理
- 数据验证与错误处理
- 安全防护（Helmet、CORS、Rate Limiting）
- 异步错误处理
- 数据库索引优化

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **身份验证**: JWT
- **文件处理**: Multer + Sharp
- **AI服务**: Azure OpenAI GPT-4
- **验证**: Express Validator
- **安全**: Helmet, CORS, Express Rate Limit
- **日志**: Winston
- **任务调度**: Node-cron

## 项目结构

```
server/
├── src/
│   ├── middleware/          # 中间件
│   │   ├── auth.js         # 身份验证中间件
│   │   ├── errorHandler.js # 错误处理中间件
│   │   └── notFound.js     # 404处理中间件
│   ├── models/             # 数据模型
│   │   ├── User.js         # 用户模型
│   │   ├── Paper.js        # 试卷模型
│   │   ├── Question.js     # 题目模型
│   │   └── StudyRecord.js  # 学习记录模型
│   ├── routes/             # 路由
│   │   ├── auth.js         # 认证路由
│   │   ├── users.js        # 用户管理路由
│   │   ├── papers.js       # 试卷管理路由
│   │   ├── questions.js    # 题目管理路由
│   │   ├── study.js        # 学习记录路由
│   │   └── ai.js           # AI服务路由
│   └── services/           # 服务层
│       ├── ocrService.js   # OCR识别服务
│       └── aiService.js    # AI智能服务
├── uploads/                # 文件上传目录
├── logs/                   # 日志目录
├── index.js               # 应用入口
├── package.json           # 项目配置
├── .env.example          # 环境变量示例
└── README.md             # 项目说明
```

## 快速开始

### 环境要求

- Node.js 18.0+
- MongoDB 5.0+
- Azure OpenAI 账户

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd studdy/server
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件，配置以下必要参数：
   ```env
   # 数据库
   MONGODB_URI=mongodb://localhost:27017/studdy
   
   # JWT密钥
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Azure OpenAI
   AZURE_OPENAI_API_KEY=your-azure-openai-api-key
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   ```

4. **启动服务**
   ```bash
   # 开发模式
   npm run dev
   
   # 生产模式
   npm start
   ```

5. **验证安装**
   访问 `http://localhost:5000/api/health` 检查服务状态

## API 文档

### 认证相关

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "password123",
  "profile": {
    "grade": "高三",
    "school": "北京一中",
    "subjects": ["数学", "物理"]
  }
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

### 试卷管理

#### 上传试卷
```http
POST /api/papers/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <试卷图片文件>
title: "2024年高考数学模拟试卷"
subject: "数学"
grade: "高三"
examType: "模拟考试"
```

#### 获取试卷列表
```http
GET /api/papers?page=1&limit=10&subject=数学&grade=高三
Authorization: Bearer <token>
```

### AI 智能服务

#### 获取学习建议
```http
GET /api/ai/study-advice
Authorization: Bearer <token>
```

#### 智能答疑
```http
POST /api/ai/ask-question
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "如何解这道二次函数题？",
  "subject": "数学",
  "questionId": "<题目ID>"
}
```

#### 错题分析
```http
POST /api/ai/analyze-wrong-answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionId": "<题目ID>",
  "studentAnswer": "B",
  "studyRecordId": "<学习记录ID>"
}
```

### 学习记录

#### 开始学习
```http
POST /api/study/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "paperId": "<试卷ID>",
  "type": "practice"
}
```

#### 提交答案
```http
POST /api/questions/<questionId>/answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "studyRecordId": "<学习记录ID>",
  "answer": "A",
  "timeSpent": 120
}
```

## 数据模型

### 用户模型 (User)
```javascript
{
  name: String,           // 姓名
  email: String,          // 邮箱
  password: String,       // 密码（加密）
  role: String,           // 角色：student/teacher/admin
  profile: {
    avatar: String,       // 头像
    grade: String,        // 年级
    school: String,       // 学校
    subjects: [String]    // 科目
  },
  preferences: Object,    // 学习偏好
  statistics: Object,     // 学习统计
  achievements: [Object], // 成就
  createdAt: Date,
  updatedAt: Date
}
```

### 试卷模型 (Paper)
```javascript
{
  title: String,          // 标题
  subject: String,        // 科目
  grade: String,          // 年级
  examType: String,       // 考试类型
  difficulty: String,     // 难度
  totalScore: Number,     // 总分
  timeLimit: Number,      // 时间限制（分钟）
  uploadedBy: ObjectId,   // 上传者
  originalFile: String,   // 原始文件路径
  extractedText: String,  // 提取的文本
  questions: [ObjectId],  // 题目列表
  tags: [String],         // 标签
  isPublic: Boolean,      // 是否公开
  status: String,         // 状态
  statistics: Object,     // 统计信息
  createdAt: Date,
  updatedAt: Date
}
```

### 题目模型 (Question)
```javascript
{
  paper: ObjectId,        // 所属试卷
  questionNumber: Number, // 题号
  type: String,           // 类型：choice/fill/essay/calculation
  content: String,        // 题目内容
  options: [String],      // 选项（选择题）
  correctAnswer: String,  // 正确答案
  explanation: String,    // 解析
  score: Number,          // 分值
  difficulty: String,     // 难度
  knowledgePoints: [String], // 知识点
  statistics: Object,     // 统计信息
  createdAt: Date,
  updatedAt: Date
}
```

### 学习记录模型 (StudyRecord)
```javascript
{
  user: ObjectId,         // 用户
  paper: ObjectId,        // 试卷
  type: String,           // 类型：practice/exam/review
  status: String,         // 状态：in_progress/completed/paused/abandoned
  startTime: Date,        // 开始时间
  endTime: Date,          // 结束时间
  totalTime: Number,      // 总用时（秒）
  answers: [Object],      // 答案记录
  score: Object,          // 得分信息
  statistics: Object,     // 统计信息
  weakPoints: [String],   // 薄弱知识点
  strongPoints: [String], // 强项知识点
  aiInteractions: [Object], // AI交互记录
  notes: [Object],        // 笔记
  bookmarks: [ObjectId],  // 收藏的题目
  feedback: Object,       // 反馈
  createdAt: Date,
  updatedAt: Date
}
```

## 部署指南

### Docker 部署

1. **构建镜像**
   ```bash
   docker build -t studdy-server .
   ```

2. **运行容器**
   ```bash
   docker run -d \
     --name studdy-server \
     -p 5000:5000 \
     -e MONGODB_URI=mongodb://mongo:27017/studdy \
     -e JWT_SECRET=your-secret \
     -e AZURE_OPENAI_API_KEY=your-key \
     studdy-server
   ```

### PM2 部署

1. **安装 PM2**
   ```bash
   npm install -g pm2
   ```

2. **启动应用**
   ```bash
   pm2 start index.js --name studdy-server
   ```

3. **设置开机自启**
   ```bash
   pm2 startup
   pm2 save
   ```

## 开发指南

### 代码规范

- 使用 ES6+ 语法
- 遵循 RESTful API 设计原则
- 统一错误处理格式
- 完善的参数验证
- 详细的注释说明

### 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

### 调试

```bash
# 开启调试模式
DEBUG=studdy:* npm run dev
```

## 常见问题

### Q: OCR识别失败怎么办？
A: 检查以下几点：
1. Azure OpenAI API密钥是否正确
2. 图片格式是否支持（jpg, png, pdf等）
3. 图片大小是否超过限制（20MB）
4. 网络连接是否正常

### Q: 数据库连接失败？
A: 检查MongoDB服务是否启动，连接字符串是否正确。

### Q: JWT Token过期？
A: 前端需要实现token刷新机制，或重新登录获取新token。

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目地址：[GitHub Repository]
- 问题反馈：[GitHub Issues]
- 邮箱：[your-email@example.com]

---

**注意**: 请确保在生产环境中使用强密码和安全的API密钥，定期更新依赖包以确保安全性。