# Studdy 项目安装指南

## 项目简介

Studdy 是一个智能学习平台，提供知识点管理、学习路径规划、考试题目练习等功能。

## 系统要求

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm >= 8.0.0

## 快速安装

### 1. 克隆项目
```bash
git clone <repository-url>
cd Studdy
```

### 2. 运行安装脚本

**Linux/macOS 用户：**
```bash
chmod +x install/install.sh
./install/install.sh
```

**Windows 用户：**
```cmd
# 以管理员身份运行命令提示符
install\install.bat
```

**手动安装：**
```bash
npm run install:all
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑配置文件
vim server/.env
```

### 4. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## 目录结构

```
install/
├── README.md          # 本文件，安装说明和快速入门
├── install.sh         # Linux/macOS 自动安装脚本
├── install.bat        # Windows 自动安装脚本
├── dependencies.md    # 依赖包详细说明和版本信息
├── features.md        # 产品功能特性详细介绍
├── changelog.md       # 版本更新历史和变更记录
└── config.md          # 项目配置指南和环境设置
```

## 访问地址

- 前端应用: http://localhost:5173
- 后端API: http://localhost:5001
- API文档: http://localhost:5001/api

## 文档维护

### 自动更新文档

本项目提供了自动文档更新功能，确保文档与开发进度保持同步：

```bash
# 更新所有文档
npm run docs:update

# 或直接运行脚本
node install/update-docs.js

# 验证文档完整性
npm run docs:validate
```

### 文档更新内容

- ✅ 自动更新版本信息和Git提交记录
- ✅ 同步依赖包版本到文档
- ✅ 检测新版本并添加到更新日志
- ✅ 验证文档完整性
- ✅ 生成文档统计信息

### 手动维护

当有重要功能更新时，请手动编辑以下内容：

1. **功能特性** (`features.md`) - 添加新功能描述
2. **更新日志** (`changelog.md`) - 详细描述版本变更
3. **配置指南** (`config.md`) - 更新配置选项

## 更多信息

- 📦 [依赖包说明](dependencies.md) - 查看所有依赖包的详细信息和版本要求
- 🚀 [功能特性](features.md) - 了解 Studdy 平台的完整功能列表
- 🔄 [更新日志](changelog.md) - 查看版本更新历史和功能变更
- ⚙️ [配置指南](config.md) - 详细的项目配置和环境设置说明
- 🔧 故障排除 - 在配置指南中查看常见问题解决方案
- 📚 部署指南 - 在配置指南中查看生产环境部署说明
- 🔄 [文档更新脚本](update-docs.js) - 自动维护文档同步的工具脚本