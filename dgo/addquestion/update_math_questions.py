#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新数学题目文件，使公式符合KaTeX标准

本脚本用于读取math_test_questions.json，格式化其中的数学公式，
并生成符合KaTeX标准的新文件
"""

import json
import os
from katex_formatter import format_math_content, validate_math_content

def update_math_questions():
    """
    更新数学题目文件中的公式格式
    """
    input_file = 'math_test_questions.json'
    output_file = 'math_test_questions_katex.json'
    backup_file = 'math_test_questions_backup.json'
    
    print("=== 数学题目KaTeX格式化工具 ===")
    
    # 检查输入文件是否存在
    if not os.path.exists(input_file):
        print(f"❌ 找不到输入文件: {input_file}")
        return False
    
    try:
        # 读取原始数据
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"✅ 成功读取 {input_file}")
        
        # 创建备份
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 创建备份文件: {backup_file}")
        
        # 格式化题目
        updated_count = 0
        validation_issues = []
        
        if 'questions' in data:
            for i, question in enumerate(data['questions']):
                question_id = question.get('id', i+1)
                print(f"\n处理题目 {question_id}...")
                
                # 格式化题目内容
                if 'content' in question:
                    original_content = question['content']
                    formatted_content = format_math_content(original_content)
                    
                    if original_content != formatted_content:
                        print(f"  📝 题目内容已格式化")
                        print(f"     原始: {original_content}")
                        print(f"     格式化: {formatted_content}")
                        question['content'] = formatted_content
                        updated_count += 1
                    
                    # 验证KaTeX兼容性
                    is_valid, issues = validate_math_content(formatted_content)
                    if not is_valid:
                        validation_issues.extend([(question_id, 'content', issue) for issue in issues])
                
                # 格式化选项
                if 'options' in question and isinstance(question['options'], list):
                    for j, option in enumerate(question['options']):
                        original_option = option
                        formatted_option = format_math_content(option)
                        
                        if original_option != formatted_option:
                            print(f"  📝 选项 {j+1} 已格式化")
                            print(f"     原始: {original_option}")
                            print(f"     格式化: {formatted_option}")
                            question['options'][j] = formatted_option
                            updated_count += 1
                        
                        # 验证选项
                        is_valid, issues = validate_math_content(formatted_option)
                        if not is_valid:
                            validation_issues.extend([(question_id, f'option_{j+1}', issue) for issue in issues])
                
                # 格式化解释
                if 'explanation' in question:
                    original_explanation = question['explanation']
                    formatted_explanation = format_math_content(original_explanation)
                    
                    if original_explanation != formatted_explanation:
                        print(f"  📝 解释已格式化")
                        print(f"     原始: {original_explanation}")
                        print(f"     格式化: {formatted_explanation}")
                        question['explanation'] = formatted_explanation
                        updated_count += 1
                    
                    # 验证解释
                    is_valid, issues = validate_math_content(formatted_explanation)
                    if not is_valid:
                        validation_issues.extend([(question_id, 'explanation', issue) for issue in issues])
        
        # 保存格式化后的数据
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 格式化完成！")
        print(f"   📊 总共更新了 {updated_count} 个字段")
        print(f"   💾 输出文件: {output_file}")
        
        # 显示验证结果
        if validation_issues:
            print(f"\n⚠️  发现 {len(validation_issues)} 个潜在的KaTeX兼容性问题:")
            for question_id, field, issue in validation_issues:
                print(f"   题目 {question_id} - {field}: {issue}")
        else:
            print("\n✅ 所有公式都符合KaTeX标准！")
        
        # 询问是否替换原文件
        replace_original = input("\n是否用格式化后的文件替换原文件？(y/N): ").lower().strip()
        if replace_original == 'y':
            os.rename(output_file, input_file)
            print(f"✅ 已替换原文件: {input_file}")
            print(f"   备份文件保存为: {backup_file}")
        else:
            print(f"📁 格式化后的文件保存为: {output_file}")
            print(f"   原文件未修改: {input_file}")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON文件格式错误: {e}")
        return False
    except Exception as e:
        print(f"❌ 处理过程中发生错误: {e}")
        return False

def preview_changes():
    """
    预览格式化变更，不实际修改文件
    """
    input_file = 'math_test_questions.json'
    
    print("=== 预览KaTeX格式化变更 ===")
    
    if not os.path.exists(input_file):
        print(f"❌ 找不到输入文件: {input_file}")
        return
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        changes_found = False
        
        if 'questions' in data:
            for i, question in enumerate(data['questions']):
                question_id = question.get('id', i+1)
                
                # 检查题目内容
                if 'content' in question:
                    original = question['content']
                    formatted = format_math_content(original)
                    if original != formatted:
                        if not changes_found:
                            print("\n发现以下格式化变更:")
                            changes_found = True
                        print(f"\n题目 {question_id} - 内容:")
                        print(f"  原始: {original}")
                        print(f"  格式化: {formatted}")
                
                # 检查选项
                if 'options' in question and isinstance(question['options'], list):
                    for j, option in enumerate(question['options']):
                        original = option
                        formatted = format_math_content(option)
                        if original != formatted:
                            if not changes_found:
                                print("\n发现以下格式化变更:")
                                changes_found = True
                            print(f"\n题目 {question_id} - 选项 {j+1}:")
                            print(f"  原始: {original}")
                            print(f"  格式化: {formatted}")
                
                # 检查解释
                if 'explanation' in question:
                    original = question['explanation']
                    formatted = format_math_content(original)
                    if original != formatted:
                        if not changes_found:
                            print("\n发现以下格式化变更:")
                            changes_found = True
                        print(f"\n题目 {question_id} - 解释:")
                        print(f"  原始: {original}")
                        print(f"  格式化: {formatted}")
        
        if not changes_found:
            print("\n✅ 所有公式已经符合KaTeX标准，无需修改！")
        
    except Exception as e:
        print(f"❌ 预览过程中发生错误: {e}")

def main():
    """
    主函数
    """
    print("KaTeX数学公式格式化工具")
    print("1. 预览变更")
    print("2. 执行格式化")
    print("3. 退出")
    
    while True:
        choice = input("\n请选择操作 (1-3): ").strip()
        
        if choice == '1':
            preview_changes()
        elif choice == '2':
            update_math_questions()
            break
        elif choice == '3':
            print("退出程序")
            break
        else:
            print("无效选择，请输入 1-3")

if __name__ == "__main__":
    main()