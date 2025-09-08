1                                                                                     # 项目配置指南

本文档详细说明 Studdy 项目的配置选项和环境设置。

## 环境变量配置

### 后端环境变量 (server/.env)

创建 `server/.env` 文件并配置以下变量：

```bash
# 服务器配置
PORT=5001                                    # 后端服务端口
NODE_ENV=development                         # 运行环境: development | production | test

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/studdy   # MongoDB 连接字符串
DB_NAME=studdy                                 # 数据库名称

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d                           # JWT 令牌过期时间
BCRYPT_ROUNDS=12                            # 密码加密轮数

# CORS 配置
CORS_ORIGIN=http://localhost:5173           # 允许的前端域名

# API 配置
API_RATE_LIMIT=100                          # API 请求频率限制 (每分钟)
API_TIMEOUT=30000                           # API 超时时间 (毫秒)

# 外部服务配置 (可选)
EXTERNAL_API_KEY=your-external-api-key      # 外部知识库 API 密钥
EXTERNAL_API_URL=https://api.example.com    # 外部 API 地址

# 日志配置
LOG_LEVEL=info                              # 日志级别: error | warn | info | debug
LOG_FILE=logs/app.log                      # 日志文件路径

# 缓存配置
CACHE_TTL=3600                              # 缓存过期时间 (秒)
CACHE_MAX_SIZE=1000                         # 最大缓存条目数

# 文件上传配置
UPLOAD_MAX_SIZE=10485760                    # 最大上传文件大小 (10MB)
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf
```

### 前端环境变量 (client/.env)

创建 `client/.env` 文件并配置以下变量：

```bash
# API 配置
VITE_API_BASE_URL=http://localhost:5001/api  # 后端 API 基础地址
VITE_API_TIMEOUT=10000                       # API 请求超时时间 (毫秒)

# 应用配置
VITE_APP_NAME=Studdy                          # 应用名称
VITE_APP_VERSION=1.2.0                      # 应用版本
VITE_APP_DESCRIPTION=智能学习平台             # 应用描述

# 功能开关
VITE_ENABLE_ANALYTICS=false                 # 是否启用分析功能
VITE_ENABLE_DEBUG=true                      # 是否启用调试模式
VITE_ENABLE_PWA=false                       # 是否启用 PWA 功能

# 第三方服务 (可选)
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX       # Google Analytics ID
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx   # Sentry 错误监控 DSN

# 开发配置
VITE_DEV_SERVER_PORT=5173                   # 开发服务器端口
VITE_DEV_SERVER_HOST=localhost              # 开发服务器主机
```

## 数据库配置

### MongoDB 配置

#### 本地开发环境

1. **安装 MongoDB**
   ```bash
   # macOS (使用 Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Ubuntu/Debian
   sudo apt-get install mongodb
   
   # Windows
   # 下载并安装: https://www.mongodb.com/try/download/community
   ```

2. **启动 MongoDB 服务**
   ```bash
   # macOS
   brew services start mongodb/brew/mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

3. **创建数据库和用户**
   ```javascript
   // 连接到 MongoDB
   mongo
   
   // 创建数据库
   use studdy
   
   // 创建用户 (可选)
   db.createUser({
     user: "studdy_user",
    pwd: "secure_password",
    roles: [{ role: "readWrite", db: "studdy" }]
   })
   ```

#### 生产环境

推荐使用 MongoDB Atlas 云服务：

1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建集群
3. 获取连接字符串
4. 更新 `MONGODB_URI` 环境变量

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studdy?retryWrites=true&w=majority
```

## 部署配置

### Docker 部署

#### Dockerfile (后端)

```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 5001

# 启动应用
CMD ["npm", "start"]
```

#### Dockerfile (前端)

```dockerfile
# client/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: studdy-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: studdy
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./server
    container_name: studdy-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/studdy?authSource=admin
      - JWT_SECRET=your-production-jwt-secret
    ports:
      - "5001:5001"
    depends_on:
      - mongodb

  frontend:
    build: ./client
    container_name: studdy-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Nginx 配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # 前端路由支持
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API 代理
        location /api {
            proxy_pass http://backend:5001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 性能配置

### 后端性能优化

```javascript
// server/config/performance.js
module.exports = {
  // 集群配置
  cluster: {
    enabled: process.env.NODE_ENV === 'production',
    workers: require('os').cpus().length
  },
  
  // 缓存配置
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000
  },
  
  // 数据库连接池
  database: {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000
  },
  
  // 压缩配置
  compression: {
    enabled: true,
    threshold: 1024,
    level: 6
  }
};
```

### 前端性能优化

```javascript
// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  
  // 构建优化
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', 'react-hot-toast']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  // 开发服务器配置
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

## 安全配置

### 安全最佳实践

1. **环境变量安全**
   - 使用强密码和随机密钥
   - 不要在代码中硬编码敏感信息
   - 定期轮换密钥和令牌

2. **数据库安全**
   - 启用身份验证
   - 使用最小权限原则
   - 定期备份数据

3. **API 安全**
   - 实施速率限制
   - 使用 HTTPS
   - 验证和清理输入数据

4. **前端安全**
   - 启用 CSP (Content Security Policy)
   - 防止 XSS 攻击
   - 安全地存储敏感数据

### 安全配置示例

```javascript
// server/middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 安全头设置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 100 次请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/api', limiter);
```

## 监控配置

### 日志配置

```javascript
// server/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 健康检查

```javascript
// server/routes/health.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'disconnected'
  };

  try {
    if (mongoose.connection.readyState === 1) {
      health.database = 'connected';
    }
  } catch (error) {
    health.status = 'ERROR';
    health.error = error.message;
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

## 故障排除

### 常见问题

1. **端口冲突**
   - 修改 `.env` 文件中的端口配置
   - 检查端口占用：`lsof -i :5001`

2. **数据库连接失败**
   - 检查 MongoDB 服务状态
   - 验证连接字符串格式
   - 检查网络连接和防火墙设置

3. **依赖安装失败**
   - 清除缓存：`npm cache clean --force`
   - 删除 `node_modules` 重新安装
   - 检查 Node.js 版本兼容性

4. **构建失败**
   - 检查 TypeScript 类型错误
   - 验证环境变量配置
   - 查看构建日志详细信息

### 调试技巧

1. **启用调试模式**
   ```bash
   DEBUG=* npm run dev
   ```

2. **查看详细日志**
   ```bash
   npm run dev -- --verbose
   ```

3. **数据库调试**
   ```javascript
   mongoose.set('debug', true);
   ```

---

**配置维护**: Studdy 开发团队  
**文档更新**: 2025-09-08
