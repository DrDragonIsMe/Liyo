#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
几何题目生成脚本
生成带图形的数学几何题目并添加到题库
"""

import json
import requests
import random
from typing import Dict, List
from geometry_generator import generate_geometry_question_with_figure, GeometryGenerator
from enhanced_example import EnhancedQuestionManager

class GeometryQuestionGenerator:
    """几何题目生成器"""
    
    def __init__(self, base_url: str = "http://localhost:5001"):
        self.base_url = base_url
        self.question_manager = EnhancedQuestionManager()
    
    def generate_triangle_questions(self, count: int = 10) -> List[Dict]:
        """生成三角形相关题目"""
        questions = []
        
        triangle_types = ['right', 'equilateral', 'isosceles']
        question_types = [
            'triangle_area',
            'triangle_perimeter', 
            'triangle_angles'
        ]
        
        for i in range(count):
            triangle_type = random.choice(triangle_types)
            
            if triangle_type == 'right':
                # 直角三角形题目
                question_data = self._generate_right_triangle_question()
            elif triangle_type == 'equilateral':
                # 等边三角形题目
                question_data = self._generate_equilateral_triangle_question()
            else:
                # 等腰三角形题目
                question_data = self._generate_isosceles_triangle_question()
            
            questions.append(question_data)
        
        return questions
    
    def _generate_right_triangle_question(self) -> Dict:
        """生成直角三角形题目"""
        a = random.randint(6, 15)
        b = random.randint(6, 15)
        
        generator = GeometryGenerator()
        figure_data = generator.generate_triangle('right', a=a*8, b=b*8)
        
        question_types = [
            {
                'type': 'area',
                'content': f"如图所示，在直角三角形ABC中，∠A = 90°，AB = {a}cm，AC = {b}cm。求三角形ABC的面积。",
                'answer': str(a * b / 2),
                'explanation': f"直角三角形的面积公式为：S = (1/2) × 底 × 高\n因此，S = (1/2) × {a} × {b} = {a * b / 2}平方厘米",
                'knowledge_points': ["三角形面积", "直角三角形"]
            },
            {
                'type': 'hypotenuse',
                'content': f"如图所示，在直角三角形ABC中，∠A = 90°，AB = {a}cm，AC = {b}cm。求斜边BC的长度。",
                'answer': str(round((a**2 + b**2)**0.5, 2)),
                'explanation': f"根据勾股定理：BC² = AB² + AC²\n因此，BC² = {a}² + {b}² = {a**2} + {b**2} = {a**2 + b**2}\n所以，BC = √{a**2 + b**2} = {round((a**2 + b**2)**0.5, 2)}cm",
                'knowledge_points': ["勾股定理", "直角三角形"]
            },
            {
                'type': 'perimeter',
                'content': f"如图所示，在直角三角形ABC中，∠A = 90°，AB = {a}cm，AC = {b}cm。求三角形ABC的周长。",
                'answer': str(round(a + b + (a**2 + b**2)**0.5, 2)),
                'explanation': f"首先求斜边：BC = √({a}² + {b}²) = {round((a**2 + b**2)**0.5, 2)}cm\n周长 = AB + AC + BC = {a} + {b} + {round((a**2 + b**2)**0.5, 2)} = {round(a + b + (a**2 + b**2)**0.5, 2)}cm",
                'knowledge_points': ["三角形周长", "勾股定理", "直角三角形"]
            }
        ]
        
        selected_question = random.choice(question_types)
        
        return {
            'content': selected_question['content'],
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': selected_question['answer'],
            'explanation': selected_question['explanation'],
            'knowledgePoints': selected_question['knowledge_points'],
            'svgData': figure_data['svg'],
            'figureProperties': figure_data['properties'],
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def _generate_equilateral_triangle_question(self) -> Dict:
        """生成等边三角形题目"""
        side = random.randint(8, 16)
        
        generator = GeometryGenerator()
        figure_data = generator.generate_triangle('equilateral', side=side*8)
        
        question_types = [
            {
                'type': 'area',
                'content': f"如图所示，等边三角形ABC的边长为{side}cm。求三角形ABC的面积。",
                'answer': str(round(side**2 * (3**0.5) / 4, 2)),
                'explanation': f"等边三角形的面积公式为：S = (√3/4) × a²\n因此，S = (√3/4) × {side}² = (√3/4) × {side**2} = {round(side**2 * (3**0.5) / 4, 2)}平方厘米",
                'knowledge_points': ["等边三角形面积", "等边三角形性质"]
            },
            {
                'type': 'height',
                'content': f"如图所示，等边三角形ABC的边长为{side}cm。求三角形ABC的高。",
                'answer': str(round(side * (3**0.5) / 2, 2)),
                'explanation': f"等边三角形的高公式为：h = (√3/2) × a\n因此，h = (√3/2) × {side} = {round(side * (3**0.5) / 2, 2)}cm",
                'knowledge_points': ["等边三角形高", "等边三角形性质"]
            }
        ]
        
        selected_question = random.choice(question_types)
        
        return {
            'content': selected_question['content'],
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': selected_question['answer'],
            'explanation': selected_question['explanation'],
            'knowledgePoints': selected_question['knowledge_points'],
            'svgData': figure_data['svg'],
            'figureProperties': figure_data['properties'],
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def _generate_isosceles_triangle_question(self) -> Dict:
        """生成等腰三角形题目"""
        base = random.randint(8, 14)
        height = random.randint(6, 12)
        
        generator = GeometryGenerator()
        figure_data = generator.generate_triangle('isosceles', base=base*8, height=height*8)
        
        side = round((height**2 + (base/2)**2)**0.5, 2)
        
        question_types = [
            {
                'type': 'area',
                'content': f"如图所示，等腰三角形ABC中，底边BC = {base}cm，高AD = {height}cm。求三角形ABC的面积。",
                'answer': str(base * height / 2),
                'explanation': f"三角形的面积公式为：S = (1/2) × 底 × 高\n因此，S = (1/2) × {base} × {height} = {base * height / 2}平方厘米",
                'knowledge_points': ["三角形面积", "等腰三角形"]
            },
            {
                'type': 'side',
                'content': f"如图所示，等腰三角形ABC中，底边BC = {base}cm，高AD = {height}cm。求腰AB的长度。",
                'answer': str(side),
                'explanation': f"在等腰三角形中，高将底边平分，所以BD = {base/2}cm\n在直角三角形ABD中，根据勾股定理：\nAB² = AD² + BD² = {height}² + {base/2}² = {height**2} + {(base/2)**2} = {height**2 + (base/2)**2}\n因此，AB = √{height**2 + (base/2)**2} = {side}cm",
                'knowledge_points': ["等腰三角形性质", "勾股定理"]
            }
        ]
        
        selected_question = random.choice(question_types)
        
        return {
            'content': selected_question['content'],
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': selected_question['answer'],
            'explanation': selected_question['explanation'],
            'knowledgePoints': selected_question['knowledge_points'],
            'svgData': figure_data['svg'],
            'figureProperties': figure_data['properties'],
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def generate_quadrilateral_questions(self, count: int = 8) -> List[Dict]:
        """生成四边形相关题目"""
        questions = []
        
        for i in range(count):
            quad_type = random.choice(['rectangle', 'square'])
            
            if quad_type == 'rectangle':
                question_data = self._generate_rectangle_question()
            else:
                question_data = self._generate_square_question()
            
            questions.append(question_data)
        
        return questions
    
    def _generate_rectangle_question(self) -> Dict:
        """生成矩形题目"""
        width = random.randint(8, 16)
        height = random.randint(6, 12)
        
        generator = GeometryGenerator()
        figure_data = generator.generate_quadrilateral('rectangle', width=width*8, height=height*8)
        
        question_types = [
            {
                'type': 'area',
                'content': f"如图所示，矩形ABCD的长为{width}cm，宽为{height}cm。求矩形ABCD的面积。",
                'answer': str(width * height),
                'explanation': f"矩形的面积公式为：S = 长 × 宽\n因此，S = {width} × {height} = {width * height}平方厘米",
                'knowledge_points': ["矩形面积", "矩形性质"]
            },
            {
                'type': 'perimeter',
                'content': f"如图所示，矩形ABCD的长为{width}cm，宽为{height}cm。求矩形ABCD的周长。",
                'answer': str(2 * (width + height)),
                'explanation': f"矩形的周长公式为：C = 2 × (长 + 宽)\n因此，C = 2 × ({width} + {height}) = 2 × {width + height} = {2 * (width + height)}厘米",
                'knowledge_points': ["矩形周长", "矩形性质"]
            },
            {
                'type': 'diagonal',
                'content': f"如图所示，矩形ABCD的长为{width}cm，宽为{height}cm。求矩形ABCD的对角线长度。",
                'answer': str(round((width**2 + height**2)**0.5, 2)),
                'explanation': f"矩形的对角线将矩形分成两个全等的直角三角形\n根据勾股定理：对角线² = 长² + 宽²\n因此，对角线 = √({width}² + {height}²) = √{width**2 + height**2} = {round((width**2 + height**2)**0.5, 2)}cm",
                'knowledge_points': ["矩形对角线", "勾股定理"]
            }
        ]
        
        selected_question = random.choice(question_types)
        
        return {
            'content': selected_question['content'],
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'easy',
            'correctAnswer': selected_question['answer'],
            'explanation': selected_question['explanation'],
            'knowledgePoints': selected_question['knowledge_points'],
            'svgData': figure_data['svg'],
            'figureProperties': figure_data['properties'],
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def _generate_square_question(self) -> Dict:
        """生成正方形题目"""
        side = random.randint(8, 15)
        
        generator = GeometryGenerator()
        figure_data = generator.generate_quadrilateral('square', side=side*8)
        
        question_types = [
            {
                'type': 'area',
                'content': f"如图所示，正方形ABCD的边长为{side}cm。求正方形ABCD的面积。",
                'answer': str(side * side),
                'explanation': f"正方形的面积公式为：S = 边长²\n因此，S = {side}² = {side * side}平方厘米",
                'knowledge_points': ["正方形面积", "正方形性质"]
            },
            {
                'type': 'perimeter',
                'content': f"如图所示，正方形ABCD的边长为{side}cm。求正方形ABCD的周长。",
                'answer': str(4 * side),
                'explanation': f"正方形的周长公式为：C = 4 × 边长\n因此，C = 4 × {side} = {4 * side}厘米",
                'knowledge_points': ["正方形周长", "正方形性质"]
            },
            {
                'type': 'diagonal',
                'content': f"如图所示，正方形ABCD的边长为{side}cm。求正方形ABCD的对角线长度。",
                'answer': str(round(side * (2**0.5), 2)),
                'explanation': f"正方形的对角线公式为：对角线 = 边长 × √2\n因此，对角线 = {side} × √2 = {round(side * (2**0.5), 2)}cm",
                'knowledge_points': ["正方形对角线", "正方形性质"]
            }
        ]
        
        selected_question = random.choice(question_types)
        
        return {
            'content': selected_question['content'],
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'easy',
            'correctAnswer': selected_question['answer'],
            'explanation': selected_question['explanation'],
            'knowledgePoints': selected_question['knowledge_points'],
            'svgData': figure_data['svg'],
            'figureProperties': figure_data['properties'],
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def generate_circle_questions(self, count: int = 6) -> List[Dict]:
        """生成圆相关题目"""
        questions = []
        
        for i in range(count):
            question_data = self._generate_circle_question()
            questions.append(question_data)
        
        return questions
    
    def _generate_circle_question(self) -> Dict:
        """生成圆题目"""
        radius = random.randint(4, 12)
        
        generator = GeometryGenerator()
        figure_data = generator.generate_circle(radius=radius*8)
        
        question_types = [
            {
                'type': 'area',
                'content': f"如图所示，圆O的半径为{radius}cm。求圆O的面积。（π取3.14）",
                'answer': str(3.14 * radius * radius),
                'explanation': f"圆的面积公式为：S = π × r²\n因此，S = 3.14 × {radius}² = 3.14 × {radius * radius} = {3.14 * radius * radius}平方厘米",
                'knowledge_points': ["圆的面积", "圆的性质"]
            },
            {
                'type': 'circumference',
                'content': f"如图所示，圆O的半径为{radius}cm。求圆O的周长。（π取3.14）",
                'answer': str(2 * 3.14 * radius),
                'explanation': f"圆的周长公式为：C = 2π × r\n因此，C = 2 × 3.14 × {radius} = {2 * 3.14 * radius}厘米",
                'knowledge_points': ["圆的周长", "圆的性质"]
            },
            {
                'type': 'diameter',
                'content': f"如图所示，圆O的半径为{radius}cm。求圆O的直径。",
                'answer': str(2 * radius),
                'explanation': f"圆的直径等于半径的2倍\n因此，直径 = 2 × {radius} = {2 * radius}厘米",
                'knowledge_points': ["圆的直径", "圆的性质"]
            }
        ]
        
        selected_question = random.choice(question_types)
        
        return {
            'content': selected_question['content'],
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': selected_question['answer'],
            'explanation': selected_question['explanation'],
            'knowledgePoints': selected_question['knowledge_points'],
            'svgData': figure_data['svg'],
            'figureProperties': figure_data['properties'],
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def add_geometry_questions_to_database(self, triangle_count: int = 15, quad_count: int = 10, circle_count: int = 8):
        """将几何题目添加到数据库"""
        print("开始生成几何题目...")
        
        # 生成各类题目
        triangle_questions = self.generate_triangle_questions(triangle_count)
        quad_questions = self.generate_quadrilateral_questions(quad_count)
        circle_questions = self.generate_circle_questions(circle_count)
        
        all_questions = triangle_questions + quad_questions + circle_questions
        
        print(f"共生成 {len(all_questions)} 道几何题目")
        print(f"- 三角形题目: {len(triangle_questions)} 道")
        print(f"- 四边形题目: {len(quad_questions)} 道")
        print(f"- 圆形题目: {len(circle_questions)} 道")
        
        # 添加到数据库
        success_count = 0
        for i, question in enumerate(all_questions, 1):
            try:
                print(f"\n正在添加第 {i} 道题目...")
                print(f"题目类型: {question.get('knowledgePoints', ['未知'])[0]}")
                print(f"题目内容: {question['content'][:50]}...")
                
                # 直接调用API保存题目（包含SVG数据）
                import requests
                url = "http://localhost:5001/api/ai/save-question"
                
                question_data = {
                    "question": {
                        "content": question["content"],
                        "subject": question["subject"],
                        "type": question["type"],
                        "difficulty": question["difficulty"],
                        "correctAnswer": question["correctAnswer"],
                        "explanation": question["explanation"],
                        "knowledgePoints": question["knowledgePoints"],
                        "svgData": question["svgData"],
                        "figureProperties": question["figureProperties"],
                        "hasGeometryFigure": True
                    }
                }
                
                # 调试输出
                print(f"SVG数据存在: {bool(question.get('svgData'))}")
                print(f"SVG数据长度: {len(question.get('svgData', ''))}")
                print(f"图形属性存在: {bool(question.get('figureProperties'))}")
                if question.get('svgData'):
                    print(f"SVG数据预览: {question['svgData'][:100]}...")
                
                try:
                    response = requests.post(url, json=question_data, timeout=10)
                    if response.status_code == 200:
                        result = True
                        success_count += 1
                        print(f"✓ 题目添加成功")
                    else:
                        result = False
                        print(f"✗ 题目添加失败 - 状态码: {response.status_code}")
                        print(f"响应内容: {response.text}")
                except Exception as e:
                    print(f"✗ API调用失败: {e}")
                    result = False
                    
            except Exception as e:
                print(f"✗ 添加题目时出错: {str(e)}")
        
        print(f"\n几何题目添加完成！")
        print(f"成功添加: {success_count} 道")
        print(f"失败: {len(all_questions) - success_count} 道")
        print(f"成功率: {success_count/len(all_questions)*100:.1f}%")


def main():
    """主函数"""
    print("=== 几何题目生成器 ===")
    print("正在初始化...")
    
    try:
        generator = GeometryQuestionGenerator()
        
        # 检查服务器连接
        if not generator.question_manager.check_server_connection():
            print("❌ 无法连接到服务器，请确保后端服务正在运行")
            return
        
        print("✓ 服务器连接正常")
        
        # 生成并添加几何题目
        generator.add_geometry_questions_to_database(
            triangle_count=15,  # 三角形题目数量
            quad_count=10,      # 四边形题目数量
            circle_count=8      # 圆形题目数量
        )
        
    except Exception as e:
        print(f"❌ 程序执行出错: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()