#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试KaTeX格式化功能
"""

import json
from katex_formatter import format_math_content, validate_math_content

def test_katex_formatting():
    """测试KaTeX格式化功能"""
    print("=== KaTeX格式化功能测试 ===")
    
    # 加载测试题目
    with open('math_test_questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"\n加载了 {len(data['questions'])} 道题目")
    
    total_fields = 0
    formatted_fields = 0
    
    for i, question in enumerate(data['questions'], 1):
        print(f"\n--- 题目 {i} (ID: {question['id']}) ---")
        
        # 测试题目内容
        original_content = question['content']
        formatted_content = format_math_content(original_content)
        total_fields += 1
        
        if original_content != formatted_content:
            formatted_fields += 1
            print(f"✅ 题目内容已格式化")
            print(f"   原始: {original_content[:50]}...")
            print(f"   格式化: {formatted_content[:50]}...")
        else:
            print(f"ℹ️  题目内容无需格式化")
        
        # 验证格式化后的内容
        if validate_math_content(formatted_content):
            print(f"✅ 题目内容符合KaTeX标准")
        else:
            print(f"❌ 题目内容不符合KaTeX标准")
        
        # 测试选项
        for j, option in enumerate(question['options']):
            option_content = option.split('. ', 1)[1] if '. ' in option else option
            formatted_option = format_math_content(option_content)
            total_fields += 1
            
            if option_content != formatted_option:
                formatted_fields += 1
                print(f"✅ 选项 {chr(65+j)} 已格式化")
            
            if not validate_math_content(formatted_option):
                print(f"❌ 选项 {chr(65+j)} 不符合KaTeX标准")
        
        # 测试解析
        original_explanation = question['explanation']
        formatted_explanation = format_math_content(original_explanation)
        total_fields += 1
        
        if original_explanation != formatted_explanation:
            formatted_fields += 1
            print(f"✅ 解析已格式化")
            print(f"   原始: {original_explanation[:50]}...")
            print(f"   格式化: {formatted_explanation[:50]}...")
        else:
            print(f"ℹ️  解析无需格式化")
        
        # 验证格式化后的解析
        if validate_math_content(formatted_explanation):
            print(f"✅ 解析符合KaTeX标准")
        else:
            print(f"❌ 解析不符合KaTeX标准")
    
    print(f"\n=== 测试总结 ===")
    print(f"总字段数: {total_fields}")
    print(f"格式化字段数: {formatted_fields}")
    print(f"格式化率: {formatted_fields/total_fields*100:.1f}%")
    
    return True

if __name__ == "__main__":
    test_katex_formatting()