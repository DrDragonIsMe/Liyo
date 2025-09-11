#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版题目管理示例程序

本程序提供了更完整的功能演示：
1. 使用配置文件管理参数
2. 批量创建知识点和题目
3. 更好的错误处理和日志记录
4. 交互式操作界面
"""

import requests
import json
import base64
import os
import logging
from typing import Dict, List, Optional, Tuple
from config import (
    SERVER_CONFIG, AUTH_CONFIG, DEFAULT_QUESTION_CONFIG,
    SUPPORTED_SUBJECTS, SAMPLE_KNOWLEDGE_POINTS, SAMPLE_QUESTIONS,
    LOGGING_CONFIG, MAX_IMAGE_SIZE
)
from katex_formatter import format_math_content, validate_math_content

# 配置日志
logging.basicConfig(
    level=getattr(logging, LOGGING_CONFIG['level']),
    format=LOGGING_CONFIG['format'],
    filename=LOGGING_CONFIG.get('file')
)
logger = logging.getLogger(__name__)

class EnhancedQuestionManager:
    def __init__(self):
        """
        初始化增强版题目管理器
        """
        self.base_url = SERVER_CONFIG['base_url'].rstrip('/')
        self.timeout = SERVER_CONFIG['timeout']
        self.token = AUTH_CONFIG['token']
        
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}' if self.token != 'your_auth_token_here' else None
        }
        
        # 存储创建的知识点ID，避免重复创建
        self.knowledge_point_cache = {}
        
        logger.info("题目管理器初始化完成")
    
    def check_server_connection(self) -> bool:
        """
        检查服务器连接状态
        
        Returns:
            服务器是否可访问
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            }
            # 禁用代理以避免503错误
            proxies = {'http': None, 'https': None}
            response = requests.get(f"{self.base_url}/health", timeout=5, headers=headers, proxies=proxies)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"服务器连接失败: {e}")
            try:
                # 尝试访问根路径
                response = requests.get(self.base_url, timeout=5, headers=headers, proxies=proxies)
                return True
            except Exception as e2:
                logger.error(f"根路径连接也失败: {e2}")
                return False
    
    def validate_token(self) -> bool:
        """
        验证认证token是否有效
        
        Returns:
            token是否有效
        """
        if not self.headers.get('Authorization'):
            return False
        
        try:
            # 尝试访问需要认证的接口
            # 禁用代理以避免503错误
            proxies = {'http': None, 'https': None}
            response = requests.get(
                f"{self.base_url}/api/ai/study-advice",
                headers=self.headers,
                timeout=self.timeout,
                proxies=proxies
            )
            return response.status_code != 401
        except:
            return False
    
    def create_knowledge_point_batch(self, subject: str, points: List[Dict]) -> Dict[str, str]:
        """
        批量创建知识点
        
        Args:
            subject: 科目名称
            points: 知识点列表，每个元素包含name和description
            
        Returns:
            知识点名称到ID的映射
        """
        created_points = {}
        
        for point in points:
            point_id = self.create_knowledge_point(
                name=point['name'],
                subject=subject,
                description=point.get('description', '')
            )
            
            if point_id:
                created_points[point['name']] = point_id
                self.knowledge_point_cache[f"{subject}:{point['name']}"] = point_id
        
        logger.info(f"批量创建知识点完成，科目：{subject}，成功：{len(created_points)}个")
        return created_points
    
    def create_knowledge_point(self, name: str, subject: str, description: str = "") -> Optional[str]:
        """
        创建知识点（带缓存）
        """
        cache_key = f"{subject}:{name}"
        if cache_key in self.knowledge_point_cache:
            logger.info(f"使用缓存的知识点: {name}")
            return self.knowledge_point_cache[cache_key]
        
        url = f"{self.base_url}/api/knowledge-points"
        data = {
            "name": name,
            "subject": subject,
            "description": description
        }
        
        try:
            # 禁用代理以避免503错误
            proxies = {'http': None, 'https': None}
            response = requests.post(url, json=data, headers=self.headers, timeout=self.timeout, proxies=proxies)
            if response.status_code == 201:
                result = response.json()
                point_id = result['knowledgePoint']['_id']
                self.knowledge_point_cache[cache_key] = point_id
                logger.info(f"知识点创建成功: {name} (ID: {point_id})")
                print(f"✅ 知识点创建成功: {name}")
                return point_id
            else:
                error_msg = response.json().get('error', '未知错误')
                logger.error(f"知识点创建失败: {name}, 错误: {error_msg}")
                print(f"❌ 知识点创建失败: {name} - {error_msg}")
                return None
        except Exception as e:
            logger.error(f"创建知识点时发生异常: {name}, 异常: {str(e)}")
            print(f"❌ 创建知识点时发生错误: {str(e)}")
            return None
    
    def validate_image_file(self, image_path: str) -> Tuple[bool, str]:
        """
        验证图片文件
        
        Args:
            image_path: 图片文件路径
            
        Returns:
            (是否有效, 错误信息)
        """
        if not os.path.exists(image_path):
            return False, f"文件不存在: {image_path}"
        
        file_size = os.path.getsize(image_path)
        if file_size > MAX_IMAGE_SIZE:
            return False, f"文件过大: {file_size} bytes (最大: {MAX_IMAGE_SIZE} bytes)"
        
        ext = os.path.splitext(image_path)[1].lower()
        if ext not in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']:
            return False, f"不支持的图片格式: {ext}"
        
        return True, ""
    
    def add_question_batch(self, subject: str, questions: List[Dict], knowledge_points_map: Dict[str, str]) -> int:
        """
        批量添加题目
        
        Args:
            subject: 科目名称
            questions: 题目列表
            knowledge_points_map: 知识点名称到ID的映射
            
        Returns:
            成功添加的题目数量
        """
        success_count = 0
        
        for i, question in enumerate(questions, 1):
            print(f"\n正在添加第 {i}/{len(questions)} 道题目...")
            
            # 转换知识点名称为ID
            knowledge_point_ids = []
            for point_name in question.get('knowledge_points', []):
                if point_name in knowledge_points_map:
                    knowledge_point_ids.append(knowledge_points_map[point_name])
                else:
                    logger.warning(f"未找到知识点: {point_name}")
            
            success = self.add_text_question(
                subject=subject,
                content=question['content'],
                options=question['options'],
                correct_answer=question['correct_answer'],
                explanation=question['explanation'],
                knowledge_points=knowledge_point_ids,
                difficulty=question.get('difficulty', DEFAULT_QUESTION_CONFIG['difficulty'])
            )
            
            if success:
                success_count += 1
        
        logger.info(f"批量添加题目完成，科目：{subject}，成功：{success_count}/{len(questions)}")
        return success_count
    
    def add_text_question(self, 
                         subject: str,
                         content: str, 
                         options: List[str],
                         correct_answer: str,
                         explanation: str,
                         knowledge_points: List[str],
                         difficulty: str = "medium") -> bool:
        """
        添加普通文本试题（自动格式化数学公式为KaTeX标准）
        """
        url = f"{self.base_url}/api/ai/save-question"
        
        # 格式化数学公式为KaTeX标准
        formatted_content = format_math_content(content)
        formatted_options = [format_math_content(option) for option in options]
        formatted_explanation = format_math_content(explanation)
        
        # 验证KaTeX兼容性
        content_valid, content_issues = validate_math_content(formatted_content)
        if not content_valid:
            logger.warning(f"题目内容KaTeX兼容性问题: {content_issues}")
        
        explanation_valid, explanation_issues = validate_math_content(formatted_explanation)
        if not explanation_valid:
            logger.warning(f"题目解释KaTeX兼容性问题: {explanation_issues}")
        
        question_data = {
            "question": {
                "content": formatted_content,
                "subject": subject,
                "options": formatted_options,
                "correctAnswer": correct_answer,
                "explanation": formatted_explanation,
                "knowledgePoints": knowledge_points,
                "difficulty": difficulty,
                "type": DEFAULT_QUESTION_CONFIG['type']
            }
        }
        
        try:
            # 禁用代理以避免503错误
            proxies = {'http': None, 'https': None}
            response = requests.post(url, json=question_data, headers=self.headers, timeout=self.timeout, proxies=proxies)
            if response.status_code == 200:
                logger.info(f"题目添加成功: {content[:30]}...")
                print(f"✅ 题目添加成功: {content[:30]}...")
                return True
            else:
                error_msg = response.json().get('error', '未知错误')
                logger.error(f"题目添加失败: {content[:30]}..., 错误: {error_msg}")
                print(f"❌ 题目添加失败: {error_msg}")
                return False
        except Exception as e:
            logger.error(f"添加题目时发生异常: {content[:30]}..., 异常: {str(e)}")
            print(f"❌ 添加题目时发生错误: {str(e)}")
            return False
    
    def interactive_demo(self):
        """
        交互式演示程序
        """
        print("\n" + "="*50)
        print("🎓 学习系统题目管理器 - 交互式演示")
        print("="*50)
        
        # 检查服务器连接
        print("\n🔍 检查服务器连接...")
        if not self.check_server_connection():
            print(f"❌ 无法连接到服务器: {self.base_url}")
            print("请确保服务器正在运行")
            return
        print("✅ 服务器连接正常")
        
        # 检查认证
        print("\n🔐 验证认证token...")
        if not self.validate_token():
            print("❌ 认证token无效或未配置")
            print("请在 config.py 中配置正确的token")
            return
        print("✅ 认证验证通过")
        
        # 选择操作模式
        print("\n📋 请选择操作模式:")
        print("1. 快速演示（使用示例数据）")
        print("2. 自定义添加")
        print("3. 批量导入")
        
        choice = input("\n请输入选择 (1-3): ").strip()
        
        if choice == "1":
            self.quick_demo()
        elif choice == "2":
            self.custom_add()
        elif choice == "3":
            self.batch_import()
        else:
            print("❌ 无效选择")
    
    def quick_demo(self):
        """
        快速演示模式
        """
        print("\n🚀 快速演示模式")
        print("将使用预设的示例数据创建知识点和题目")
        
        # 选择科目
        print("\n📚 可用科目:")
        available_subjects = list(SAMPLE_KNOWLEDGE_POINTS.keys())
        for i, subject in enumerate(available_subjects, 1):
            print(f"{i}. {subject}")
        
        try:
            subject_choice = int(input("\n请选择科目 (输入数字): ")) - 1
            if 0 <= subject_choice < len(available_subjects):
                subject = available_subjects[subject_choice]
            else:
                print("❌ 无效选择")
                return
        except ValueError:
            print("❌ 请输入有效数字")
            return
        
        print(f"\n📖 开始处理科目: {subject}")
        
        # 创建知识点
        print("\n📝 创建知识点...")
        knowledge_points = SAMPLE_KNOWLEDGE_POINTS[subject]
        points_map = self.create_knowledge_point_batch(subject, knowledge_points)
        
        if not points_map:
            print("❌ 知识点创建失败，无法继续")
            return
        
        # 添加题目
        if subject in SAMPLE_QUESTIONS:
            print("\n📋 添加示例题目...")
            questions = SAMPLE_QUESTIONS[subject]
            success_count = self.add_question_batch(subject, questions, points_map)
            
            print(f"\n✨ 快速演示完成！")
            print(f"📊 统计信息:")
            print(f"   - 科目: {subject}")
            print(f"   - 知识点: {len(points_map)} 个")
            print(f"   - 题目: {success_count}/{len(questions)} 个")
        else:
            print(f"⚠️ 暂无 {subject} 科目的示例题目")
    
    def custom_add(self):
        """
        自定义添加模式
        """
        print("\n✏️ 自定义添加模式")
        print("请按提示输入题目信息")
        
        # 输入基本信息
        subject = input("\n科目名称: ").strip()
        if not subject:
            print("❌ 科目名称不能为空")
            return
        
        content = input("题目内容: ").strip()
        if not content:
            print("❌ 题目内容不能为空")
            return
        
        # 输入选项
        print("\n请输入选项 (输入空行结束):")
        options = []
        while True:
            option = input(f"选项 {len(options)+1}: ").strip()
            if not option:
                break
            options.append(option)
        
        if len(options) < 2:
            print("❌ 至少需要2个选项")
            return
        
        correct_answer = input("\n正确答案: ").strip()
        explanation = input("题目解析: ").strip()
        
        difficulty = input("难度等级 (easy/medium/hard, 默认medium): ").strip() or "medium"
        
        # 创建或选择知识点
        print("\n📚 知识点设置:")
        print("1. 创建新知识点")
        print("2. 跳过知识点")
        
        kp_choice = input("选择 (1-2): ").strip()
        knowledge_points = []
        
        if kp_choice == "1":
            while True:
                kp_name = input("知识点名称 (输入空行结束): ").strip()
                if not kp_name:
                    break
                
                kp_desc = input(f"'{kp_name}' 的描述: ").strip()
                kp_id = self.create_knowledge_point(kp_name, subject, kp_desc)
                if kp_id:
                    knowledge_points.append(kp_id)
        
        # 添加题目
        print("\n💾 保存题目...")
        success = self.add_text_question(
            subject=subject,
            content=content,
            options=options,
            correct_answer=correct_answer,
            explanation=explanation,
            knowledge_points=knowledge_points,
            difficulty=difficulty
        )
        
        if success:
            print("\n✨ 自定义题目添加完成！")
        else:
            print("\n❌ 题目添加失败")
    
    def batch_import(self):
        """
        批量导入模式
        """
        print("\n📦 批量导入模式")
        print("支持从JSON文件导入题目数据")
        
        file_path = input("\n请输入JSON文件路径: ").strip()
        
        if not os.path.exists(file_path):
            print(f"❌ 文件不存在: {file_path}")
            return
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 验证数据格式
            if not isinstance(data, dict) or 'subject' not in data or 'questions' not in data:
                print("❌ JSON文件格式错误，需要包含 'subject' 和 'questions' 字段")
                return
            
            subject = data['subject']
            questions = data['questions']
            knowledge_points_data = data.get('knowledge_points', [])
            
            print(f"\n📖 导入科目: {subject}")
            print(f"📝 知识点数量: {len(knowledge_points_data)}")
            print(f"📋 题目数量: {len(questions)}")
            
            # 创建知识点
            points_map = {}
            if knowledge_points_data:
                print("\n创建知识点...")
                points_map = self.create_knowledge_point_batch(subject, knowledge_points_data)
            
            # 导入题目
            print("\n导入题目...")
            success_count = self.add_question_batch(subject, questions, points_map)
            
            print(f"\n✨ 批量导入完成！")
            print(f"📊 导入统计: {success_count}/{len(questions)} 道题目成功")
            
        except json.JSONDecodeError:
            print("❌ JSON文件格式错误")
        except Exception as e:
            print(f"❌ 导入过程中发生错误: {str(e)}")

def main():
    """
    主函数
    """
    try:
        manager = EnhancedQuestionManager()
        manager.interactive_demo()
    except KeyboardInterrupt:
        print("\n\n👋 程序已退出")
    except Exception as e:
        print(f"\n❌ 程序运行出错: {str(e)}")
        logger.error(f"程序异常: {str(e)}")

if __name__ == "__main__":
    main()