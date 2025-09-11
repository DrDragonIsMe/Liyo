#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配置文件 - 题目管理系统配置

在这里配置你的系统参数
"""

# 服务器配置
SERVER_CONFIG = {
    "base_url": "http://localhost:5001",  # API服务器地址
    "timeout": 30,  # 请求超时时间（秒）
}

# 认证配置
AUTH_CONFIG = {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzAyNDM3ODE0NDliODRjMjM1OGI0MiIsImlhdCI6MTc1NzQ3MDg1OCwiZXhwIjoxNzU4MDc1NjU4fQ.W3SXy2Segkn1ZmOBNQeEjnVe5fUPip3FNCEkDNqQRzU",  # 测试用户的认证token
    # 获取token的方法：
    # 1. 启动学习系统
    # 2. 在浏览器中登录
    # 3. 打开开发者工具 -> Application -> Local Storage
    # 4. 找到 'auth_token' 或类似的键值
}

# 默认题目配置
DEFAULT_QUESTION_CONFIG = {
    "difficulty": "medium",  # 默认难度：easy, medium, hard
    "type": "multiple_choice",  # 题目类型
}

# 支持的科目列表
SUPPORTED_SUBJECTS = [
    "数学",
    "物理", 
    "化学",
    "生物",
    "语文",
    "英语",
    "历史",
    "地理",
    "政治"
]

# 支持的图片格式
SUPPORTED_IMAGE_FORMATS = [
    ".png",
    ".jpg", 
    ".jpeg",
    ".gif",
    ".bmp"
]

# 文件大小限制（字节）
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

# 示例数据
SAMPLE_KNOWLEDGE_POINTS = {
    "数学": [
        {"name": "一元二次方程", "description": "形如ax²+bx+c=0(a≠0)的方程"},
        {"name": "判别式", "description": "一元二次方程根的判别式Δ=b²-4ac"},
        {"name": "因式分解", "description": "将多项式表示为几个因式乘积的形式"},
        {"name": "函数图像", "description": "函数在坐标系中的图形表示"},
    ],
    "物理": [
        {"name": "牛顿第二定律", "description": "物体的加速度与作用力成正比，与质量成反比"},
        {"name": "动能定理", "description": "合外力对物体做的功等于物体动能的变化"},
        {"name": "电路分析", "description": "分析电路中电流、电压、电阻的关系"},
        {"name": "光的折射", "description": "光从一种介质进入另一种介质时方向发生改变的现象"},
    ],
    "化学": [
        {"name": "化学平衡", "description": "可逆反应中正反应速率等于逆反应速率的状态"},
        {"name": "氧化还原反应", "description": "有电子转移的化学反应"},
        {"name": "酸碱中和", "description": "酸与碱反应生成盐和水的反应"},
        {"name": "有机化学", "description": "研究有机化合物的结构、性质和反应的化学分支"},
    ]
}

SAMPLE_QUESTIONS = {
    "数学": [
        {
            "content": "方程x²-5x+6=0的解是？",
            "options": ["A. x=2或x=3", "B. x=1或x=6", "C. x=-2或x=-3", "D. x=5或x=1"],
            "correct_answer": "A",
            "explanation": "使用因式分解法：x²-5x+6=(x-2)(x-3)=0，所以x=2或x=3",
            "difficulty": "easy",
            "knowledge_points": ["一元二次方程", "因式分解"]
        },
        {
            "content": "函数f(x)=x²-4x+3的最小值是？",
            "options": ["A. -1", "B. 0", "C. 1", "D. 3"],
            "correct_answer": "A",
            "explanation": "配方得f(x)=(x-2)²-1，当x=2时取得最小值-1",
            "difficulty": "medium",
            "knowledge_points": ["函数图像", "一元二次方程"]
        }
    ],
    "物理": [
        {
            "content": "质量为2kg的物体受到10N的水平拉力，求加速度。",
            "options": ["A. 5 m/s²", "B. 10 m/s²", "C. 2 m/s²", "D. 20 m/s²"],
            "correct_answer": "A",
            "explanation": "根据牛顿第二定律F=ma，a=F/m=10N/2kg=5m/s²",
            "difficulty": "easy",
            "knowledge_points": ["牛顿第二定律"]
        },
        {
            "content": "光从空气射入水中，入射角为60°，折射角约为？（水的折射率n=1.33）",
            "options": ["A. 30°", "B. 40°", "C. 45°", "D. 50°"],
            "correct_answer": "B",
            "explanation": "根据折射定律sinθ₁/sinθ₂=n，sin60°/sinθ₂=1.33，解得θ₂≈40°",
            "difficulty": "hard",
            "knowledge_points": ["光的折射"]
        }
    ]
}

# 日志配置
LOGGING_CONFIG = {
    "level": "INFO",  # DEBUG, INFO, WARNING, ERROR
    "format": "%(asctime)s - %(levelname)s - %(message)s",
    "file": "question_manager.log"  # 日志文件名，None表示不写入文件
}