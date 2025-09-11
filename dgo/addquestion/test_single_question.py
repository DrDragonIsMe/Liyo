#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
from geometry_generator import generate_geometry_question_with_figure, GeometryGenerator

def test_single_question():
    # 生成一个测试题目
    question = generate_geometry_question_with_figure("triangle_area")
    
    print("=== 生成的题目数据 ===")
    print(f"内容: {question['content']}")
    print(f"SVG数据存在: {bool(question.get('svgData'))}")
    print(f"SVG数据长度: {len(question.get('svgData', ''))}")
    print(f"图形属性存在: {bool(question.get('figureProperties'))}")
    print(f"包含几何图形: {question.get('hasGeometryFigure', False)}")
    
    if question.get('svgData'):
        print(f"SVG数据: {question['svgData']}")
    
    if question.get('figureProperties'):
        print(f"图形属性: {json.dumps(question['figureProperties'], indent=2, ensure_ascii=False)}")
    
    # 构建请求数据
    question_data = {
        "question": {
            "content": question["content"],
            "subject": question["subject"],
            "type": question["type"],
            "difficulty": question["difficulty"],
            "correctAnswer": question["correctAnswer"],
            "explanation": question["explanation"],
            "knowledgePoints": question["knowledgePoints"],
            "svgData": question.get("svg", question.get("svgData", "")),
            "figureProperties": question["figureProperties"],
            "hasGeometryFigure": True
        }
    }
    
    print("\n=== 发送的请求数据 ===")
    print(json.dumps(question_data, indent=2, ensure_ascii=False))
    
    # 发送请求
    url = "http://localhost:5001/api/ai/save-question"
    try:
        response = requests.post(url, json=question_data, timeout=10)
        print(f"\n=== 服务器响应 ===")
        print(f"状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                question_id = result.get('questionId')
                print(f"题目保存成功，ID: {question_id}")
                return question_id
            else:
                print(f"保存失败: {result.get('message')}")
        else:
            print(f"请求失败: {response.status_code}")
            
    except Exception as e:
        print(f"请求异常: {e}")
    
    return None

if __name__ == "__main__":
    test_single_question()