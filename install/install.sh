#!/bin/bash

# Studdy 项目自动安装脚本
# 作者: Studdy Team
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_success() {
    print_message "✅ $1" "$GREEN"
}

print_error() {
    print_message "❌ $1" "$RED"
}

print_warning() {
    print_message "⚠️  $1" "$YELLOW"
}

print_info() {
    print_message "ℹ️  $1" "$BLUE"
}

# 检查系统要求
check_requirements() {
    print_info "检查系统要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js >= 16.0.0"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Node.js 版本过低，当前版本: $NODE_VERSION，要求版本: >= $REQUIRED_VERSION"
        exit 1
    fi
    
    print_success "Node.js 版本检查通过: $NODE_VERSION"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    print_success "npm 版本: $NPM_VERSION"
    
    # 检查 MongoDB (可选)
    if command -v mongod &> /dev/null; then
        MONGO_VERSION=$(mongod --version | head -n1 | cut -d' ' -f3)
        print_success "MongoDB 版本: $MONGO_VERSION"
    else
        print_warning "MongoDB 未检测到，请确保 MongoDB 服务正在运行"
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    
    # 安装根目录依赖
    if [ -f "package.json" ]; then
        print_info "安装根目录依赖..."
        npm install
        print_success "根目录依赖安装完成"
    fi
    
    # 安装服务端依赖
    if [ -d "server" ] && [ -f "server/package.json" ]; then
        print_info "安装服务端依赖..."
        cd server
        npm install
        cd ..
        print_success "服务端依赖安装完成"
    fi
    
    # 安装客户端依赖
    if [ -d "client" ] && [ -f "client/package.json" ]; then
        print_info "安装客户端依赖..."
        cd client
        npm install
        cd ..
        print_success "客户端依赖安装完成"
    fi
}

# 配置环境变量
setup_environment() {
    print_info "配置环境变量..."
    
    if [ -f "server/.env.example" ] && [ ! -f "server/.env" ]; then
        cp server/.env.example server/.env
        print_success "环境变量文件已创建: server/.env"
        print_warning "请编辑 server/.env 文件配置数据库连接等信息"
    elif [ -f "server/.env" ]; then
        print_info "环境变量文件已存在: server/.env"
    else
        print_warning "未找到环境变量模板文件"
    fi
}

# 构建项目
build_project() {
    print_info "构建项目..."
    
    # 构建客户端
    if [ -d "client" ]; then
        print_info "构建客户端..."
        cd client
        npm run build
        cd ..
        print_success "客户端构建完成"
    fi
}

# 验证安装
verify_installation() {
    print_info "验证安装..."
    
    # 检查关键文件
    local files=("server/package.json" "client/package.json" "server/.env")
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file 存在"
        else
            print_error "$file 不存在"
        fi
    done
    
    # 检查 node_modules
    if [ -d "server/node_modules" ]; then
        print_success "服务端依赖已安装"
    else
        print_error "服务端依赖未安装"
    fi
    
    if [ -d "client/node_modules" ]; then
        print_success "客户端依赖已安装"
    else
        print_error "客户端依赖未安装"
    fi
}

# 显示启动说明
show_startup_info() {
    print_success "\n🎉 安装完成！"
    print_info "\n启动说明:"
    echo -e "${BLUE}开发模式:${NC}"
    echo "  npm run dev          # 同时启动前后端开发服务器"
    echo "  npm run dev:server   # 仅启动后端服务器"
    echo "  npm run dev:client   # 仅启动前端开发服务器"
    echo
    echo -e "${BLUE}生产模式:${NC}"
    echo "  npm run build        # 构建项目"
    echo "  npm start            # 启动生产服务器"
    echo
    echo -e "${BLUE}访问地址:${NC}"
    echo "  前端应用: http://localhost:5173"
    echo "  后端API:  http://localhost:5001"
    echo "  API文档:  http://localhost:5001/api"
    echo
    print_warning "请确保 MongoDB 服务正在运行，并检查 server/.env 配置文件"
}

# 主函数
main() {
    print_info "🚀 开始安装 Studdy 项目..."
    echo
    
    check_requirements
    echo
    
    install_dependencies
    echo
    
    setup_environment
    echo
    
    # 询问是否构建项目
    read -p "是否构建项目? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_project
        echo
    fi
    
    verify_installation
    echo
    
    show_startup_info
}

# 错误处理
trap 'print_error "安装过程中发生错误，请检查上述输出信息"' ERR

# 运行主函数
main "$@"