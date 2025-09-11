#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
题目管理工具安装和配置脚本

使用方法：
    python setup.py install    # 安装依赖
    python setup.py config     # 配置服务器信息
    python setup.py test       # 测试连接
"""

import sys
import subprocess
import os
import json
from pathlib import Path

def install_dependencies():
    """安装Python依赖包"""
    print("正在安装Python依赖包...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ 依赖包安装成功！")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖包安装失败: {e}")
        return False

def configure_server():
    """交互式配置服务器信息"""
    print("\n=== 服务器配置 ===")
    
    # 读取当前配置
    config_file = Path("config.py")
    if not config_file.exists():
        print("❌ 配置文件不存在")
        return False
    
    print("请输入服务器配置信息（直接回车保持默认值）：")
    
    # 获取用户输入
    server_url = input("服务器地址 [http://localhost:3000]: ").strip()
    if not server_url:
        server_url = "http://localhost:3000"
    
    auth_token = input("认证Token [your_auth_token_here]: ").strip()
    if not auth_token:
        auth_token = "your_auth_token_here"
    
    # 更新配置文件
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 替换配置值
        content = content.replace(
            '"base_url": "http://localhost:3000"',
            f'"base_url": "{server_url}"'
        )
        content = content.replace(
            '"token": "your_auth_token_here"',
            f'"token": "{auth_token}"'
        )
        
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ 配置更新成功！")
        return True
        
    except Exception as e:
        print(f"❌ 配置更新失败: {e}")
        return False

def test_connection():
    """测试服务器连接"""
    print("\n=== 测试服务器连接 ===")
    
    try:
        from enhanced_example import EnhancedQuestionManager
        
        manager = EnhancedQuestionManager()
        
        # 测试服务器连接
        if manager.check_server_connection():
            print("✅ 服务器连接成功！")
            
            # 测试Token验证
            if manager.validate_token():
                print("✅ Token验证成功！")
                return True
            else:
                print("❌ Token验证失败，请检查配置")
                return False
        else:
            print("❌ 服务器连接失败，请检查服务器地址")
            return False
            
    except ImportError as e:
        print(f"❌ 导入模块失败: {e}")
        print("请先运行 'python setup.py install' 安装依赖")
        return False
    except Exception as e:
        print(f"❌ 连接测试失败: {e}")
        return False

def show_help():
    """显示帮助信息"""
    print("""
题目管理工具 - 安装和配置脚本

使用方法：
    python setup.py install    # 安装Python依赖包
    python setup.py config     # 交互式配置服务器信息
    python setup.py test       # 测试服务器连接和Token验证
    python setup.py all        # 执行完整安装流程
    python setup.py help       # 显示此帮助信息

安装完成后，可以运行以下程序：
    python example_add_questions.py     # 基础示例
    python enhanced_example.py          # 增强版示例（推荐）
    """)

def main():
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "install":
        install_dependencies()
    elif command == "config":
        configure_server()
    elif command == "test":
        test_connection()
    elif command == "all":
        print("开始完整安装流程...\n")
        if install_dependencies():
            if configure_server():
                test_connection()
    elif command == "help":
        show_help()
    else:
        print(f"未知命令: {command}")
        show_help()

if __name__ == "__main__":
    main()