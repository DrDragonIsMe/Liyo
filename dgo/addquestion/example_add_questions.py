#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
示例程序：在特定科目内添加试题和知识点

本程序演示如何：
1. 在指定科目内添加普通试题
2. 添加包含图片的试题
3. 创建和关联知识点

使用前请确保：
- 已安装 requests 库：pip install requests
- 服务器正在运行
- 已获得有效的认证token
"""

import requests
import json
import base64
from typing import Dict, List, Optional

class StudyQuestionManager:
    def __init__(self, base_url: str = "http://localhost:3000", token: str = None):
        """
        初始化题目管理器
        
        Args:
            base_url: API服务器地址
            token: 认证token
        """
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}' if token else None
        }
    
    def create_knowledge_point(self, name: str, subject: str, description: str = "") -> Optional[str]:
        """
        创建知识点
        
        Args:
            name: 知识点名称
            subject: 所属科目
            description: 描述
            
        Returns:
            知识点ID，创建失败返回None
        """
        url = f"{self.base_url}/api/knowledge-points"
        data = {
            "name": name,
            "subject": subject,
            "description": description
        }
        
        try:
            response = requests.post(url, json=data, headers=self.headers)
            if response.status_code == 201:
                result = response.json()
                print(f"✅ 知识点创建成功: {name} (ID: {result['knowledgePoint']['_id']})")
                return result['knowledgePoint']['_id']
            else:
                print(f"❌ 知识点创建失败: {response.json().get('error', '未知错误')}")
                return None
        except Exception as e:
            print(f"❌ 创建知识点时发生错误: {str(e)}")
            return None
    
    def add_text_question(self, 
                         subject: str,
                         content: str, 
                         options: List[str],
                         correct_answer: str,
                         explanation: str,
                         knowledge_points: List[str],
                         difficulty: str = "medium") -> bool:
        """
        添加普通文本试题
        
        Args:
            subject: 科目名称
            content: 题目内容
            options: 选项列表
            correct_answer: 正确答案
            explanation: 解析
            knowledge_points: 知识点ID列表
            difficulty: 难度等级 (easy/medium/hard)
            
        Returns:
            是否添加成功
        """
        url = f"{self.base_url}/api/ai/save-question"
        
        # 将字符串数组转换为对象数组格式
        options_objects = []
        for i, option in enumerate(options):
            label = chr(65 + i)  # A, B, C, D...
            options_objects.append({
                "label": label,
                "content": option.replace(f"{label}. ", ""),  # 移除选项前缀
                "isCorrect": label == correct_answer
            })
        
        question_data = {
            "question": {
                "content": content,
                "subject": subject,
                "options": options_objects,
                "correctAnswer": correct_answer,
                "explanation": explanation,
                "knowledgePoints": knowledge_points,
                "difficulty": difficulty,
                "type": "multiple_choice"
            }
        }
        
        try:
            response = requests.post(url, json=question_data, headers=self.headers)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ 普通试题添加成功: {content[:30]}...")
                return True
            else:
                print(f"❌ 普通试题添加失败: {response.json().get('error', '未知错误')}")
                return False
        except Exception as e:
            print(f"❌ 添加普通试题时发生错误: {str(e)}")
            return False
    
    def encode_image_to_base64(self, image_path: str) -> Optional[str]:
        """
        将图片文件编码为base64字符串
        
        Args:
            image_path: 图片文件路径
            
        Returns:
            base64编码的图片数据，失败返回None
        """
        try:
            with open(image_path, 'rb') as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                # 根据文件扩展名确定MIME类型
                if image_path.lower().endswith('.png'):
                    mime_type = 'image/png'
                elif image_path.lower().endswith('.jpg') or image_path.lower().endswith('.jpeg'):
                    mime_type = 'image/jpeg'
                else:
                    mime_type = 'image/png'  # 默认
                
                return f"data:{mime_type};base64,{encoded_string}"
        except Exception as e:
            print(f"❌ 图片编码失败: {str(e)}")
            return None
    
    def add_image_question(self,
                          subject: str,
                          content: str,
                          image_path: str,
                          options: List[str],
                          correct_answer: str,
                          explanation: str,
                          knowledge_points: List[str],
                          difficulty: str = "medium") -> bool:
        """
        添加包含图片的试题
        
        Args:
            subject: 科目名称
            content: 题目内容
            image_path: 图片文件路径
            options: 选项列表
            correct_answer: 正确答案
            explanation: 解析
            knowledge_points: 知识点ID列表
            difficulty: 难度等级
            
        Returns:
            是否添加成功
        """
        # 编码图片
        image_data = self.encode_image_to_base64(image_path)
        if not image_data:
            return False
        
        url = f"{self.base_url}/api/ai/save-question"
        
        # 将字符串数组转换为对象数组格式
        options_objects = []
        for i, option in enumerate(options):
            label = chr(65 + i)  # A, B, C, D...
            options_objects.append({
                "label": label,
                "content": option.replace(f"{label}. ", ""),  # 移除选项前缀
                "isCorrect": label == correct_answer
            })
        
        question_data = {
            "question": {
                "content": content,
                "subject": subject,
                "options": options_objects,
                "correctAnswer": correct_answer,
                "explanation": explanation,
                "knowledgePoints": knowledge_points,
                "difficulty": difficulty,
                "type": "multiple_choice",
                "imageData": image_data,
                "mimeType": image_data.split(';')[0].split(':')[1] if ';' in image_data else "image/png"
            }
        }
        
        try:
            response = requests.post(url, json=question_data, headers=self.headers)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ 图片试题添加成功: {content[:30]}...")
                return True
            else:
                print(f"❌ 图片试题添加失败: {response.json().get('error', '未知错误')}")
                return False
        except Exception as e:
            print(f"❌ 添加图片试题时发生错误: {str(e)}")
            return False

def main():
    """
    主函数 - 演示如何使用题目管理器
    """
    print("=== 学习系统题目添加示例 ===")
    
    # 初始化管理器（需要替换为实际的token）
    token = "your_auth_token_here"  # 请替换为实际的认证token
    manager = StudyQuestionManager(token=token)
    
    # 1. 创建知识点
    print("\n📚 创建知识点...")
    
    # 数学科目的知识点
    quadratic_eq_id = manager.create_knowledge_point(
        name="一元二次方程",
        subject="数学",
        description="形如ax²+bx+c=0(a≠0)的方程"
    )
    
    discriminant_id = manager.create_knowledge_point(
        name="判别式",
        subject="数学", 
        description="一元二次方程根的判别式Δ=b²-4ac"
    )
    
    # 物理科目的知识点
    mechanics_id = manager.create_knowledge_point(
        name="牛顿第二定律",
        subject="物理",
        description="物体的加速度与作用力成正比，与质量成反比"
    )
    
    # 2. 添加普通文本试题
    print("\n📝 添加普通试题...")
    
    if quadratic_eq_id and discriminant_id:
        success = manager.add_text_question(
            subject="数学",
            content="方程x²-5x+6=0的解是？",
            options=["A. x=2或x=3", "B. x=1或x=6", "C. x=-2或x=-3", "D. x=5或x=1"],
            correct_answer="A",
            explanation="使用因式分解法：x²-5x+6=(x-2)(x-3)=0，所以x=2或x=3",
            knowledge_points=[quadratic_eq_id, discriminant_id],
            difficulty="easy"
        )
    
    # 3. 添加图片试题（需要准备图片文件）
    print("\n🖼️ 添加图片试题...")
    
    # 注意：这里需要实际的图片文件路径
    image_path = "./sample_physics_diagram.png"  # 请替换为实际图片路径
    
    if mechanics_id:
        # 检查图片文件是否存在
        import os
        if os.path.exists(image_path):
            success = manager.add_image_question(
                subject="物理",
                content="如图所示，质量为2kg的物体在水平面上受到10N的水平拉力，求物体的加速度。",
                image_path=image_path,
                options=["A. 5 m/s²", "B. 10 m/s²", "C. 2 m/s²", "D. 20 m/s²"],
                correct_answer="A",
                explanation="根据牛顿第二定律F=ma，a=F/m=10N/2kg=5m/s²",
                knowledge_points=[mechanics_id],
                difficulty="medium"
            )
        else:
            print(f"⚠️ 图片文件不存在: {image_path}")
            print("💡 提示：请准备一个物理图表并更新image_path变量")
    
    print("\n✨ 示例程序执行完成！")
    print("\n📋 使用说明：")
    print("1. 替换 'your_auth_token_here' 为实际的认证token")
    print("2. 确保服务器在 http://localhost:3000 运行")
    print("3. 准备图片文件并更新 image_path 变量")
    print("4. 安装依赖：pip install requests")

if __name__ == "__main__":
    main()