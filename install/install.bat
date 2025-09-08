@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo           Studdy 项目安装脚本
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] 管理员权限检查通过
) else (
    echo [!] 警告: 建议以管理员身份运行此脚本
)

echo.
echo [1/8] 检查系统要求...

:: 检查 Node.js
node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [✓] Node.js 已安装: !NODE_VERSION!
) else (
    echo [✗] Node.js 未安装
    echo 请访问 https://nodejs.org 下载并安装 Node.js 18.0.0 或更高版本
    pause
    exit /b 1
)

:: 检查 npm
npm --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [✓] npm 已安装: !NPM_VERSION!
) else (
    echo [✗] npm 未安装
    echo npm 通常随 Node.js 一起安装，请重新安装 Node.js
    pause
    exit /b 1
)

:: 检查 Git
git --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo [✓] Git 已安装: !GIT_VERSION!
) else (
    echo [!] Git 未安装 (可选)
    echo 建议安装 Git 以便版本控制: https://git-scm.com
)

:: 检查 MongoDB
mongod --version >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] MongoDB 已安装
) else (
    echo [!] MongoDB 未检测到
    echo 请确保 MongoDB 已安装并正在运行
    echo 下载地址: https://www.mongodb.com/try/download/community
)

echo.
echo [2/8] 检查项目结构...

if not exist "package.json" (
    echo [✗] 未找到 package.json，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "client" (
    echo [✗] 未找到 client 目录
    pause
    exit /b 1
)

if not exist "server" (
    echo [✗] 未找到 server 目录
    pause
    exit /b 1
)

echo [✓] 项目结构检查通过

echo.
echo [3/8] 安装根目录依赖...
npm install
if %errorLevel% neq 0 (
    echo [✗] 根目录依赖安装失败
    pause
    exit /b 1
)
echo [✓] 根目录依赖安装完成

echo.
echo [4/8] 安装前端依赖...
cd client
npm install
if %errorLevel% neq 0 (
    echo [✗] 前端依赖安装失败
    cd ..
    pause
    exit /b 1
)
echo [✓] 前端依赖安装完成
cd ..

echo.
echo [5/8] 安装后端依赖...
cd server
npm install
if %errorLevel% neq 0 (
    echo [✗] 后端依赖安装失败
    cd ..
    pause
    exit /b 1
)
echo [✓] 后端依赖安装完成
cd ..

echo.
echo [6/8] 检查环境变量配置...

if not exist "server\.env" (
    echo [!] 未找到 .env 文件，创建默认配置...
    (
        echo PORT=5001
        echo MONGODB_URI=mongodb://localhost:27017/studdy
        echo JWT_SECRET=your-secret-key-change-this-in-production
        echo NODE_ENV=development
    ) > "server\.env"
    echo [✓] 已创建默认 .env 配置文件
    echo [!] 请根据需要修改 server\.env 中的配置
) else (
    echo [✓] .env 配置文件已存在
)

echo.
echo [7/8] 构建项目...

echo 构建前端项目...
cd client
npm run build
if %errorLevel% neq 0 (
    echo [!] 前端构建失败，但可以继续使用开发模式
) else (
    echo [✓] 前端构建完成
)
cd ..

echo.
echo [8/8] 验证安装...

echo 检查前端依赖...
cd client
npm list --depth=0 >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] 前端依赖验证通过
) else (
    echo [!] 前端依赖可能存在问题
)
cd ..

echo 检查后端依赖...
cd server
npm list --depth=0 >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] 后端依赖验证通过
) else (
    echo [!] 后端依赖可能存在问题
)
cd ..

echo.
echo ========================================
echo           安装完成！
echo ========================================
echo.
echo 🎉 Studdy 项目安装成功！
echo.
echo 📋 启动说明:
echo.
echo 1. 启动后端服务器:
echo    cd server
echo    npm run dev
echo.
echo 2. 启动前端开发服务器 (新终端):
echo    cd client
echo    npm run dev
echo.
echo 3. 访问应用:
echo    前端: http://localhost:5173
echo    后端: http://localhost:5001
echo.
echo 📚 更多信息:
echo    - 查看 install/README.md 了解详细说明
echo    - 查看 install/dependencies.md 了解依赖信息
echo    - 查看 install/features.md 了解功能特性
echo    - 查看 install/changelog.md 了解更新历史
echo.
echo ⚠️  注意事项:
echo    - 确保 MongoDB 服务正在运行
echo    - 首次运行可能需要等待依赖下载
echo    - 如遇问题请查看终端错误信息
echo.
echo 🔧 故障排除:
echo    - 端口冲突: 修改 server/.env 中的 PORT 配置
echo    - 数据库连接: 检查 MongoDB 服务状态
echo    - 依赖问题: 删除 node_modules 重新安装
echo.
echo 按任意键退出...
pause >nul