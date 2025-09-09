# 依赖包说明

## 当前版本信息

- **项目版本**: 1.0.0
- **前端版本**: 0.0.0
- **后端版本**: 1.0.0
- **Git 分支**: main
- **Git 提交**: b333cbc
- **最后更新**: 2025-09-08

## 系统依赖

### 运行环境
- **Node.js** >= 16.0.0 - JavaScript 运行环境
- **npm** >= 8.0.0 - 包管理器
- **MongoDB** >= 4.4 - 数据库

## 后端依赖 (server/)

### 核心框架
- **express** ^4.18.2 - Web 应用框架
- **mongoose** ^8.0.3 - MongoDB 对象建模工具
- **cors** ^2.8.5 - 跨域资源共享中间件
- **dotenv** ^16.3.1 - 环境变量管理

### 工具库
- **axios** ^1.6.2 - HTTP 客户端，用于外部API调用
- **iconv-lite** ^0.6.3 - 字符编码转换，解决中文编码问题
- **cheerio** ^1.0.0-rc.12 - 服务端jQuery，用于HTML解析
- **bcryptjs** ^2.4.3 - 密码加密
- **jsonwebtoken** ^9.0.2 - JWT令牌生成和验证

### 开发工具
- **nodemon** ^3.0.2 - 开发时自动重启服务器

## 前端依赖 (client/)

### 核心框架
- **react** ^18.2.0 - 用户界面库
- **react-dom** ^18.2.0 - React DOM 渲染
- **react-router-dom** ^6.20.1 - 路由管理

### UI 组件库
- **@headlessui/react** ^1.7.17 - 无样式UI组件
- **@heroicons/react** ^2.2.0 - 图标库
- **@radix-ui/react-checkbox** ^1.3.3 - 复选框组件
- **@radix-ui/react-label** ^2.1.7 - 标签组件
- **@radix-ui/react-progress** ^1.1.7 - 进度条组件
- **@radix-ui/react-radio-group** ^1.3.8 - 单选按钮组
- **@radix-ui/react-select** ^2.2.6 - 选择器组件
- **@radix-ui/react-slot** ^1.2.3 - 插槽组件
- **@radix-ui/react-tabs** ^1.1.13 - 标签页组件
- **lucide-react** ^0.542.0 - 图标库

### 样式和工具
- **tailwindcss** ^3.3.5 - CSS 框架
- **autoprefixer** ^10.4.16 - CSS 自动前缀
- **postcss** ^8.4.31 - CSS 后处理器
- **class-variance-authority** ^0.7.1 - 类名变体管理
- **clsx** ^2.1.1 - 条件类名工具
- **tailwind-merge** ^2.6.0 - Tailwind 类名合并

### 功能库
- **axios** ^1.6.2 - HTTP 客户端
- **react-hot-toast** ^2.6.0 - 通知提示组件
- **react-dropzone** ^14.2.3 - 文件拖拽上传
- **zustand** ^4.5.7 - 状态管理
- **katex** ^0.16.9 - 数学公式渲染引擎 🆕
- **react-katex** ^3.0.1 - React KaTeX 组件 🆕

### 开发工具
- **vite** ^4.5.0 - 构建工具
- **@vitejs/plugin-react** ^4.1.1 - Vite React 插件
- **typescript** ^5.2.2 - TypeScript 编译器
- **@types/react** ^18.2.37 - React 类型定义
- **@types/react-dom** ^18.2.15 - React DOM 类型定义
- **@types/node** ^24.3.1 - Node.js 类型定义
- **@types/react-katex** ^3.0.4 - React KaTeX 类型定义 🆕
- **eslint** ^8.53.0 - 代码检查工具
- **@typescript-eslint/eslint-plugin** ^6.10.0 - TypeScript ESLint 插件
- **@typescript-eslint/parser** ^6.10.0 - TypeScript ESLint 解析器
- **eslint-plugin-react-hooks** ^4.6.0 - React Hooks ESLint 插件
- **eslint-plugin-react-refresh** ^0.4.4 - React Refresh ESLint 插件

## 根目录依赖

### 开发工具
- **concurrently** ^8.2.2 - 并发运行多个命令
- **cross-env** ^7.0.3 - 跨平台环境变量设置

## 依赖安装说明

### 自动安装
```bash
# 使用安装脚本
./install/install.sh

# 或使用 npm 脚本
npm run install:all
```

### 手动安装
```bash
# 安装根目录依赖
npm install

# 安装服务端依赖
cd server && npm install && cd ..

# 安装客户端依赖
cd client && npm install && cd ..
```

## 版本兼容性

- 所有依赖包版本都经过测试，确保相互兼容
- 建议使用 `package-lock.json` 锁定版本
- 升级依赖时请注意破坏性变更

## 故障排除

### 常见问题
1. **安装失败**: 检查 Node.js 和 npm 版本
2. **网络问题**: 使用国内镜像源
   ```bash
   npm config set registry https://registry.npmmirror.com
   ```
3. **权限问题**: 使用 `sudo` 或配置 npm 权限
4. **缓存问题**: 清理 npm 缓存
   ```bash
   npm cache clean --force
   ```

### 依赖冲突
如果遇到依赖冲突，可以尝试：
1. 删除 `node_modules` 和 `package-lock.json`
2. 重新安装依赖
3. 使用 `npm audit fix` 修复安全漏洞