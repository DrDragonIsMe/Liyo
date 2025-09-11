#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数学测试题目批量添加脚本

本脚本用于将math_test_questions.json中的10道数学选择题批量添加到系统中
"""

import json
import requests
from config import SERVER_CONFIG, AUTH_CONFIG
from enhanced_example import EnhancedQuestionManager
from katex_formatter import format_math_content, validate_math_content

def load_test_questions():
    """加载测试题目数据"""
    try:
        with open('math_test_questions.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print("❌ 找不到 math_test_questions.json 文件")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ JSON文件格式错误: {e}")
        return None

def add_math_test_questions():
    """批量添加数学测试题目"""
    print("=== 数学测试题目批量添加 ===")
    
    # 加载题目数据
    data = load_test_questions()
    if not data:
        return False
    
    # 初始化管理器
    manager = EnhancedQuestionManager()
    
    # 检查服务器连接
    if not manager.check_server_connection():
        print("❌ 服务器连接失败，请检查服务器是否启动")
        return False
    
    # 验证Token
    if not manager.validate_token():
        print("❌ Token验证失败，请检查配置")
        return False
    
    print("✅ 服务器连接和Token验证成功")
    
    # 创建知识点 - 直接调用API
    print("\n--- 创建知识点 ---")
    knowledge_points_map = {}
    
    def create_knowledge_point_direct(name, subject, description):
        """直接调用API创建知识点"""
        url = f"{SERVER_CONFIG['base_url']}/api/knowledge-points/{name}"
        params = {'subject': subject}
        
        try:
            # 先尝试获取知识点，如果不存在会自动创建
            response = requests.get(url, params=params, headers={
                'Authorization': f'Bearer {AUTH_CONFIG["token"]}',
                'Content-Type': 'application/json'
            }, proxies={'http': None, 'https': None})
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return True
            return False
        except Exception as e:
            print(f"创建知识点API调用失败: {e}")
            return False
    
    for kp in data['knowledge_points']:
        success = create_knowledge_point_direct(
            name=kp['name'],
            subject=data['subject'],
            description=kp['description']
        )
        if success:
            knowledge_points_map[kp['name']] = kp['name']  # 使用名称作为ID
            print(f"✅ 创建/获取知识点: {kp['name']}")
        else:
            print(f"❌ 创建知识点失败: {kp['name']}")
    
    # 添加题目
    print("\n--- 添加题目 ---")
    success_count = 0
    
    for question in data['questions']:
        print(f"\n正在处理题目: {question['id']}")
        
        # 格式化题目内容中的数学公式
        formatted_content = format_math_content(question['content'])
        if not validate_math_content(formatted_content):
            print(f"⚠️  题目内容包含不符合KaTeX标准的公式: {question['id']}")
        
        # 格式化解析中的数学公式
        formatted_explanation = format_math_content(question['explanation'])
        if not validate_math_content(formatted_explanation):
            print(f"⚠️  题目解析包含不符合KaTeX标准的公式: {question['id']}")
        
        # 构造选项数组 - 需要对象格式
        options = []
        correct_answer_label = None
        labels = ['A', 'B', 'C', 'D', 'E', 'F']
        for i, option in enumerate(question['options']):
            # 去掉A. B. C. D.前缀
            option_content = option.split('. ', 1)[1] if '. ' in option else option
            # 格式化选项中的数学公式
            formatted_option = format_math_content(option_content)
            if not validate_math_content(formatted_option):
                print(f"⚠️  选项 {labels[i]} 包含不符合KaTeX标准的公式: {question['id']}")
            
            is_correct = (question['correct_answer'] == labels[i])
            if is_correct:
                correct_answer_label = labels[i]
            options.append({
                'label': labels[i],
                'content': formatted_option,
                'isCorrect': is_correct
            })
        
        # 获取知识点名称列表
        kp_names = [kp_name for kp_name in question['knowledge_points'] if kp_name in knowledge_points_map]
        
        # 直接调用API添加题目
        def add_question_direct(question_data):
            """直接调用API添加题目"""
            url = f"{SERVER_CONFIG['base_url']}/api/ai/save-question"
            
            payload = {
                "question": {
                     "content": formatted_content,
                     "subject": question_data['subject'],
                     "type": "选择题",
                     "difficulty": question_data['difficulty'],
                     "options": options,  # 使用构造好的options对象数组
                     "correctAnswer": question_data['correct_answer'],
                     "explanation": formatted_explanation,
                     "knowledgePoints": question_data['knowledge_points']
                 }
            }
            
            try:
                response = requests.post(url, json=payload, headers={
                    'Authorization': f'Bearer {AUTH_CONFIG["token"]}',
                    'Content-Type': 'application/json'
                }, proxies={'http': None, 'https': None})
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success'):
                        return True
                    else:
                        print(f"API返回错误: {result.get('message', '未知错误')}")
                        return False
                else:
                    print(f"HTTP错误: {response.status_code}")
                    if response.text:
                        print(f"响应内容: {response.text}")
                    return False
            except Exception as e:
                print(f"请求异常: {e}")
                return False
        
        success = add_question_direct({
             'content': formatted_content,
             'subject': '数学',  # 使用中文学科名称
             'options': options,
             'correct_answer': correct_answer_label or question['correct_answer'],
             'explanation': formatted_explanation,
             'knowledge_points': kp_names,
             'difficulty': question['difficulty']
         })
        
        if success:
            success_count += 1
            print(f"✅ 添加题目 {question['id']}: {question['content'][:30]}...")
        else:
            print(f"❌ 添加题目失败 {question['id']}: {question['content'][:30]}...")
    
    print(f"\n=== 批量添加完成 ===")
    print(f"成功添加 {success_count}/{len(data['questions'])} 道题目")
    
    return success_count == len(data['questions'])

def main():
    """主函数"""
    print("数学测试题目批量添加工具")
    print("本工具将添加10道数学选择题用于测试")
    
    # 确认操作
    confirm = input("\n是否继续添加题目？(y/N): ").strip().lower()
    if confirm not in ['y', 'yes', '是']:
        print("操作已取消")
        return
    
    # 执行添加
    success = add_math_test_questions()
    
    if success:
        print("\n🎉 所有题目添加成功！")
        print("\n题目包含以下知识点：")
        print("- 函数与方程")
        print("- 三角函数")
        print("- 数列")
        print("- 立体几何")
        print("- 概率统计")
        print("\n难度分布：")
        print("- 简单题目：4道")
        print("- 中等题目：5道")
        print("- 困难题目：1道")
    else:
        print("\n⚠️  部分题目添加失败，请检查日志")

if __name__ == "__main__":
    main()