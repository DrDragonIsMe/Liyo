# Liyo - 智能试卷解析与伴读学习系统

一个基于AI的SaaS教育平台，提供试卷OCR解析、智能伴读和个性化学习路径生成功能。

## 功能特性

### 🔍 试卷管理与OCR解析
- 支持多种格式试卷上传（PDF、图片等）
- 自动OCR识别试卷内容
- 智能题目分类和题库构建
- 试卷版本管理和历史记录

### 🤖 智能伴读系统
- 基于Azure OpenAI GPT-4的智能对话
- 跟随学生解题思路提供知识扩展
- 个性化学习建议和解题指导
- 实时答疑和概念解释

### 📊 学习路径生成
- 结合北京市高考考试大纲
- 智能分析已掌握、待巩固、薄弱知识点
- 生成碎片化时间学习计划
- 自适应难度调整

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
- Tailwind CSS 样式框架
- React Router 路由管理
- Zustand 状态管理
- Axios HTTP客户端

### 后端
- Node.js + Express
- MongoDB 数据库
- JWT 身份认证
- Multer 文件上传
- Tesseract.js OCR识别
- Azure OpenAI API集成

## 项目结构

```
liyo/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── services/      # API服务
│   │   ├── store/         # 状态管理
│   │   ├── types/         # TypeScript类型定义
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   └── package.json
├── server/                # 后端API
│   ├── controllers/       # 控制器
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── middleware/       # 中间件
│   ├── services/         # 业务服务
│   ├── utils/            # 工具函数
│   ├── uploads/          # 文件上传目录
│   └── package.json
└── README.md
```

## 快速开始

### 环境要求
- Node.js 18+
- MongoDB 6+
- npm 或 yarn

### 安装依赖
```bash
# 安装所有依赖
npm run install-all
```

### 环境配置
1. 复制环境配置文件：
```bash
cp server/.env.example server/.env
```

2. 修改 `server/.env` 文件中的配置项

### 启动开发服务器
```bash
# 同时启动前后端开发服务器
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:5000

### 生产构建
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

## API文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 试卷管理
- `POST /api/papers/upload` - 上传试卷
- `GET /api/papers` - 获取试卷列表
- `GET /api/papers/:id` - 获取试卷详情
- `DELETE /api/papers/:id` - 删除试卷

### 题库管理
- `GET /api/questions` - 获取题目列表
- `GET /api/questions/:id` - 获取题目详情
- `POST /api/questions` - 创建题目

### AI服务
- `POST /api/ai/chat` - AI对话
- `POST /api/ai/analyze` - 学习分析
- `POST /api/ai/path` - 生成学习路径

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。