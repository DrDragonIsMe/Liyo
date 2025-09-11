#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高考级别复杂几何题生成脚本
生成20道高考难度的几何题目
"""

import json
import requests
import random
import math
from typing import Dict, List
from geometry_generator import GeometryGenerator
from enhanced_example import EnhancedQuestionManager

class AdvancedGeometryGenerator:
    """高考级别几何题生成器"""
    
    def __init__(self, base_url: str = "http://localhost:5001"):
        self.base_url = base_url
        self.question_manager = EnhancedQuestionManager()
        self.generator = GeometryGenerator()
    
    def generate_advanced_triangle_questions(self, count: int = 8) -> List[Dict]:
        """生成高级三角形题目"""
        questions = []
        
        for i in range(count):
            question_type = random.choice([
                'triangle_similarity',
                'triangle_congruence', 
                'triangle_median_altitude',
                'triangle_circumcenter',
                'triangle_incenter'
            ])
            
            if question_type == 'triangle_similarity':
                question = self._generate_similarity_question()
            elif question_type == 'triangle_congruence':
                question = self._generate_congruence_question()
            elif question_type == 'triangle_median_altitude':
                question = self._generate_median_altitude_question()
            elif question_type == 'triangle_circumcenter':
                question = self._generate_circumcenter_question()
            else:
                question = self._generate_incenter_question()
            
            questions.append(question)
        
        return questions
    
    def _generate_similarity_question(self) -> Dict:
        """生成三角形相似题目"""
        # 生成两个相似三角形
        a1, b1, c1 = 6, 8, 10  # 第一个三角形
        scale = random.uniform(1.5, 2.5)  # 相似比
        a2, b2, c2 = a1 * scale, b1 * scale, c1 * scale
        
        # 生成SVG图形
        svg_content = self.generator._create_svg_header()
        
        # 第一个三角形
        A1 = (80, 200)
        B1 = (80 + a1*8, 200)
        C1 = (80, 200 - b1*8)
        
        svg_content += f'  <polygon points="{A1[0]},{A1[1]} {B1[0]},{B1[1]} {C1[0]},{C1[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A1[0], A1[1], "A")
        svg_content += self.generator._add_point(B1[0], B1[1], "B")
        svg_content += self.generator._add_point(C1[0], C1[1], "C")
        
        # 第二个三角形
        A2 = (250, 200)
        B2 = (250 + a2*4, 200)
        C2 = (250, 200 - b2*4)
        
        svg_content += f'  <polygon points="{A2[0]},{A2[1]} {B2[0]},{B2[1]} {C2[0]},{C2[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A2[0], A2[1], "D")
        svg_content += self.generator._add_point(B2[0], B2[1], "E")
        svg_content += self.generator._add_point(C2[0], C2[1], "F")
        
        svg_content += self.generator._create_svg_footer()
        
        return {
            'content': f"如图所示，△ABC与△DEF相似，已知AB = {a1}cm，BC = {c1}cm，AC = {b1}cm，DE = {a2:.1f}cm。求△DEF的周长。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'hard',
            'correctAnswer': str(round(a2 + b2 + c2, 1)),
            'explanation': f"由于△ABC∽△DEF，相似比为 DE/AB = {a2:.1f}/{a1} = {scale:.1f}\n因此 EF = BC × {scale:.1f} = {c1} × {scale:.1f} = {c2:.1f}cm\nDF = AC × {scale:.1f} = {b1} × {scale:.1f} = {b2:.1f}cm\n△DEF的周长 = {a2:.1f} + {b2:.1f} + {c2:.1f} = {round(a2 + b2 + c2, 1)}cm",
            'knowledgePoints': ["三角形相似", "相似比", "周长计算"],
            'svgData': svg_content,
            'figureProperties': {
                'triangle1': {'sides': [a1, b1, c1]},
                'triangle2': {'sides': [round(a2, 1), round(b2, 1), round(c2, 1)]},
                'similarity_ratio': round(scale, 1)
            },
            'hasGeometryFigure': True,
            'grade': '高二'
        }
    
    def _generate_congruence_question(self) -> Dict:
        """生成三角形全等题目"""
        a, b, c = 8, 6, 10
        
        svg_content = self.generator._create_svg_header()
        
        # 第一个三角形
        A1 = (80, 180)
        B1 = (80 + a*10, 180)
        C1 = (80, 180 - b*10)
        
        svg_content += f'  <polygon points="{A1[0]},{A1[1]} {B1[0]},{B1[1]} {C1[0]},{C1[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A1[0], A1[1], "A")
        svg_content += self.generator._add_point(B1[0], B1[1], "B")
        svg_content += self.generator._add_point(C1[0], C1[1], "C")
        
        # 第二个全等三角形（旋转180度）
        A2 = (280, 120)
        B2 = (280 - a*10, 120)
        C2 = (280, 120 + b*10)
        
        svg_content += f'  <polygon points="{A2[0]},{A2[1]} {B2[0]},{B2[1]} {C2[0]},{C2[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A2[0], A2[1], "D")
        svg_content += self.generator._add_point(B2[0], B2[1], "E")
        svg_content += self.generator._add_point(C2[0], C2[1], "F")
        
        svg_content += self.generator._create_svg_footer()
        
        return {
            'content': f"如图所示，△ABC≌△DEF，已知AB = {a}cm，AC = {b}cm，BC = {c}cm，∠A = 90°。求△DEF的面积。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': str(a * b / 2),
            'explanation': f"由于△ABC≌△DEF，所以对应边相等，对应角相等\n∠A = ∠D = 90°，DE = AB = {a}cm，DF = AC = {b}cm\n△DEF的面积 = (1/2) × DE × DF = (1/2) × {a} × {b} = {a * b / 2}平方厘米",
            'knowledgePoints': ["三角形全等", "直角三角形面积"],
            'svgData': svg_content,
            'figureProperties': {
                'sides': [a, b, c],
                'area': a * b / 2
            },
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def _generate_median_altitude_question(self) -> Dict:
        """生成三角形中线和高线题目"""
        a, b = 12, 9  # 底边和高
        
        svg_content = self.generator._create_svg_header()
        
        # 三角形顶点
        A = (200, 80)
        B = (200 - a*8, 200)
        C = (200 + a*8, 200)
        
        svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        svg_content += self.generator._add_point(C[0], C[1], "C")
        
        # 中点D
        D = ((B[0] + C[0])/2, (B[1] + C[1])/2)
        svg_content += self.generator._add_point(D[0], D[1], "D")
        
        # 中线AD
        svg_content += f'  <line x1="{A[0]}" y1="{A[1]}" x2="{D[0]}" y2="{D[1]}" class="dimension"/>\n'
        
        # 高线AH
        H = (A[0], B[1])
        svg_content += self.generator._add_point(H[0], H[1], "H")
        svg_content += f'  <line x1="{A[0]}" y1="{A[1]}" x2="{H[0]}" y2="{H[1]}" class="dimension"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        median_length = math.sqrt((a*4)**2 + b**2) / 2
        
        return {
            'content': f"如图所示，在△ABC中，BC = {a*2}cm，高AH = {b}cm，D是BC的中点。求中线AD的长度。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'hard',
            'correctAnswer': str(round(median_length, 2)),
            'explanation': f"设BC = {a*2}cm，高AH = {b}cm\n由于D是BC中点，所以BD = DC = {a}cm\n在直角三角形AHD中，HD = {a}cm，AH = {b}cm\n由勾股定理：AD² = AH² + HD² = {b}² + {a}² = {b*b} + {a*a} = {b*b + a*a}\n因此 AD = √{b*b + a*a} = {round(median_length, 2)}cm",
            'knowledgePoints': ["三角形中线", "勾股定理", "三角形高线"],
            'svgData': svg_content,
            'figureProperties': {
                'base': a*2,
                'height': b,
                'median_length': round(median_length, 2)
            },
            'hasGeometryFigure': True,
            'grade': '高二'
        }
    
    def _generate_circumcenter_question(self) -> Dict:
        """生成三角形外心题目"""
        a, b, c = 6, 8, 10  # 直角三角形
        
        svg_content = self.generator._create_svg_header()
        
        # 直角三角形顶点
        A = (150, 200)  # 直角顶点
        B = (150 + a*12, 200)
        C = (150, 200 - b*12)
        
        svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        svg_content += self.generator._add_point(C[0], C[1], "C")
        
        # 外心O（直角三角形的外心是斜边中点）
        O = ((B[0] + C[0])/2, (B[1] + C[1])/2)
        svg_content += self.generator._add_point(O[0], O[1], "O")
        
        # 外接圆
        radius = c * 6  # 外接圆半径
        svg_content += f'  <circle cx="{O[0]}" cy="{O[1]}" r="{radius}" class="shape-fill"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        return {
            'content': f"如图所示，在直角三角形ABC中，∠A = 90°，AB = {a}cm，AC = {b}cm。求外接圆的半径。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': str(c/2),
            'explanation': f"在直角三角形中，外心位于斜边的中点\n斜边BC = √(AB² + AC²) = √({a}² + {b}²) = √{a*a + b*b} = {c}cm\n外接圆半径 = 斜边长度/2 = {c}/2 = {c/2}cm",
            'knowledgePoints': ["三角形外心", "外接圆", "直角三角形性质"],
            'svgData': svg_content,
            'figureProperties': {
                'sides': [a, b, c],
                'circumradius': c/2
            },
            'hasGeometryFigure': True,
            'grade': '高二'
        }
    
    def _generate_incenter_question(self) -> Dict:
        """生成三角形内心题目"""
        a, b, c = 6, 8, 10
        
        svg_content = self.generator._create_svg_header()
        
        # 三角形顶点
        A = (150, 80)
        B = (100, 200)
        C = (250, 200)
        
        svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        svg_content += self.generator._add_point(C[0], C[1], "C")
        
        # 内心I（简化计算，放在重心位置）
        I = ((A[0] + B[0] + C[0])/3, (A[1] + B[1] + C[1])/3)
        svg_content += self.generator._add_point(I[0], I[1], "I")
        
        # 内切圆半径
        s = (a + b + c) / 2  # 半周长
        area = a * b / 2  # 面积
        inradius = area / s  # 内切圆半径
        
        # 内切圆
        svg_content += f'  <circle cx="{I[0]}" cy="{I[1]}" r="{inradius*15}" class="shape-fill"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        return {
            'content': f"如图所示，在直角三角形ABC中，∠A = 90°，AB = {a}cm，AC = {b}cm。求内切圆的半径。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'hard',
            'correctAnswer': str(round(inradius, 2)),
            'explanation': f"直角三角形内切圆半径公式：r = (a + b - c)/2\n其中a、b为直角边，c为斜边\nc = √({a}² + {b}²) = {c}cm\nr = ({a} + {b} - {c})/2 = ({a + b} - {c})/2 = {a + b - c}/2 = {round(inradius, 2)}cm",
            'knowledgePoints': ["三角形内心", "内切圆", "直角三角形内切圆半径"],
            'svgData': svg_content,
            'figureProperties': {
                'sides': [a, b, c],
                'inradius': round(inradius, 2),
                'area': area
            },
            'hasGeometryFigure': True,
            'grade': '高二'
        }
    
    def generate_advanced_quadrilateral_questions(self, count: int = 6) -> List[Dict]:
        """生成高级四边形题目"""
        questions = []
        
        for i in range(count):
            question_type = random.choice([
                'parallelogram_properties',
                'rhombus_diagonal',
                'trapezoid_median',
                'rectangle_diagonal'
            ])
            
            if question_type == 'parallelogram_properties':
                question = self._generate_parallelogram_question()
            elif question_type == 'rhombus_diagonal':
                question = self._generate_rhombus_question()
            elif question_type == 'trapezoid_median':
                question = self._generate_trapezoid_question()
            else:
                question = self._generate_rectangle_diagonal_question()
            
            questions.append(question)
        
        return questions
    
    def _generate_parallelogram_question(self) -> Dict:
        """生成平行四边形题目"""
        a = random.randint(8, 12)  # 底边
        h = random.randint(6, 10)  # 高
        angle = random.randint(60, 120)  # 内角
        
        # 计算邻边长度
        b = h / math.sin(math.radians(angle))
        
        # 生成SVG
        svg_content = self.generator._create_svg_header()
        
        # 平行四边形顶点
        A = (100, 200)
        B = (100 + a*15, 200)
        D = (100 + b*math.cos(math.radians(angle))*15, 200 - h*15)
        C = (B[0] + D[0] - A[0], B[1] + D[1] - A[1])
        
        svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]} {D[0]},{D[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        svg_content += self.generator._add_point(C[0], C[1], "C")
        svg_content += self.generator._add_point(D[0], D[1], "D")
        
        # 添加高线
        svg_content += f'  <line x1="{D[0]}" y1="{D[1]}" x2="{D[0]}" y2="{A[1]}" class="dimension"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        area = a * h
        perimeter = 2 * (a + b)
        
        return {
            'content': f"如图所示，在平行四边形ABCD中，AB = {a}cm，∠DAB = {angle}°，平行四边形的高为{h}cm。求平行四边形ABCD的面积和周长。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'hard',
            'correctAnswer': f"面积：{area}平方厘米，周长：{round(perimeter, 1)}厘米",
            'explanation': f"平行四边形面积 = 底 × 高 = {a} × {h} = {area}平方厘米\n由于∠DAB = {angle}°，所以AD = 高/sin({angle}°) = {h}/sin({angle}°) = {round(b, 1)}cm\n周长 = 2(AB + AD) = 2({a} + {round(b, 1)}) = {round(perimeter, 1)}厘米",
            'knowledgePoints': ["平行四边形面积", "平行四边形周长", "三角函数应用"],
            'svgData': svg_content,
            'figureProperties': {
                'base': a,
                'height': h,
                'angle': angle,
                'side': round(b, 1),
                'area': area,
                'perimeter': round(perimeter, 1)
            },
            'hasGeometryFigure': True,
            'grade': '高二'
        }
    
    def _generate_rhombus_question(self) -> Dict:
        """生成菱形题目"""
        side = random.randint(8, 12)
        d1 = random.randint(12, 16)  # 对角线1
        d2 = random.randint(10, 14)  # 对角线2
        
        svg_content = self.generator._create_svg_header()
        
        # 菱形顶点（以对角线交点为中心）
        center = (200, 150)
        A = (center[0], center[1] - d1*5)
        B = (center[0] + d2*5, center[1])
        C = (center[0], center[1] + d1*5)
        D = (center[0] - d2*5, center[1])
        
        svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]} {D[0]},{D[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        svg_content += self.generator._add_point(C[0], C[1], "C")
        svg_content += self.generator._add_point(D[0], D[1], "D")
        
        # 对角线
        svg_content += f'  <line x1="{A[0]}" y1="{A[1]}" x2="{C[0]}" y2="{C[1]}" class="dimension"/>\n'
        svg_content += f'  <line x1="{B[0]}" y1="{B[1]}" x2="{D[0]}" y2="{D[1]}" class="dimension"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        area = d1 * d2 / 2
        
        return {
            'content': f"如图所示，菱形ABCD的两条对角线长分别为{d1}cm和{d2}cm。求菱形的面积。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': str(area),
            'explanation': f"菱形面积 = (对角线1 × 对角线2)/2\n面积 = ({d1} × {d2})/2 = {d1 * d2}/2 = {area}平方厘米",
            'knowledgePoints': ["菱形面积", "对角线性质"],
            'svgData': svg_content,
            'figureProperties': {
                'diagonals': [d1, d2],
                'area': area
            },
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def _generate_trapezoid_question(self) -> Dict:
        """生成梯形题目"""
        a = random.randint(12, 16)  # 上底
        b = random.randint(18, 24)  # 下底
        h = random.randint(8, 12)   # 高
        
        svg_content = self.generator._create_svg_header()
        
        # 梯形顶点
        A = (150, 100)
        B = (150 + a*8, 100)
        C = (150 + b*8, 200)
        D = (150, 200)
        
        svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]} {D[0]},{D[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        svg_content += self.generator._add_point(C[0], C[1], "C")
        svg_content += self.generator._add_point(D[0], D[1], "D")
        
        # 中位线
        M = ((A[0] + D[0])/2, (A[1] + D[1])/2)
        N = ((B[0] + C[0])/2, (B[1] + C[1])/2)
        svg_content += self.generator._add_point(M[0], M[1], "M")
        svg_content += self.generator._add_point(N[0], N[1], "N")
        svg_content += f'  <line x1="{M[0]}" y1="{M[1]}" x2="{N[0]}" y2="{N[1]}" class="dimension"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        median = (a + b) / 2
        area = median * h
        
        return {
            'content': f"如图所示，梯形ABCD中，AB∥CD，AB = {a}cm，CD = {b}cm，高为{h}cm，MN是梯形的中位线。求中位线MN的长度和梯形的面积。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': f"中位线：{median}cm，面积：{area}平方厘米",
            'explanation': f"梯形中位线长度 = (上底 + 下底)/2 = ({a} + {b})/2 = {median}cm\n梯形面积 = 中位线 × 高 = {median} × {h} = {area}平方厘米",
            'knowledgePoints': ["梯形中位线", "梯形面积"],
            'svgData': svg_content,
            'figureProperties': {
                'upper_base': a,
                'lower_base': b,
                'height': h,
                'median': median,
                'area': area
            },
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def _generate_rectangle_diagonal_question(self) -> Dict:
        """生成矩形对角线题目"""
        length = random.randint(12, 16)
        width = random.randint(8, 12)
        
        svg_content = self.generator._create_svg_header()
        
        # 矩形顶点
        A = (100, 100)
        B = (100 + length*10, 100)
        C = (100 + length*10, 100 + width*10)
        D = (100, 100 + width*10)
        
        svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]} {D[0]},{D[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        svg_content += self.generator._add_point(C[0], C[1], "C")
        svg_content += self.generator._add_point(D[0], D[1], "D")
        
        # 对角线
        svg_content += f'  <line x1="{A[0]}" y1="{A[1]}" x2="{C[0]}" y2="{C[1]}" class="dimension"/>\n'
        svg_content += f'  <line x1="{B[0]}" y1="{B[1]}" x2="{D[0]}" y2="{D[1]}" class="dimension"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        diagonal = math.sqrt(length**2 + width**2)
        
        return {
            'content': f"如图所示，矩形ABCD的长为{length}cm，宽为{width}cm。求对角线AC的长度。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'easy',
            'correctAnswer': str(round(diagonal, 2)),
            'explanation': f"在矩形中，对角线长度可用勾股定理计算\nAC² = AB² + BC² = {length}² + {width}² = {length**2} + {width**2} = {length**2 + width**2}\n因此 AC = √{length**2 + width**2} = {round(diagonal, 2)}cm",
            'knowledgePoints': ["矩形对角线", "勾股定理"],
            'svgData': svg_content,
            'figureProperties': {
                'length': length,
                'width': width,
                'diagonal': round(diagonal, 2)
            },
            'hasGeometryFigure': True,
            'grade': '高一'
        }
    
    def generate_advanced_circle_questions(self, count: int = 6) -> List[Dict]:
        """生成高级圆形题目"""
        questions = []
        
        for i in range(count):
            question_type = random.choice([
                'circle_tangent',
                'circle_chord',
                'circle_sector',
                'circle_inscribed_triangle'
            ])
            
            if question_type == 'circle_tangent':
                question = self._generate_tangent_question()
            elif question_type == 'circle_chord':
                question = self._generate_chord_question()
            elif question_type == 'circle_sector':
                question = self._generate_sector_question()
            else:
                question = self._generate_inscribed_triangle_question()
            
            questions.append(question)
        
        return questions
    
    def _generate_tangent_question(self) -> Dict:
        """生成圆的切线题目"""
        r = random.randint(5, 8)  # 圆半径
        d = random.randint(10, 15)  # 外点到圆心距离
        
        # 计算切线长
        tangent_length = math.sqrt(d*d - r*r)
        
        # 生成SVG
        svg_content = self.generator._create_svg_header()
        
        # 圆心和圆
        O = (200, 150)
        svg_content += f'  <circle cx="{O[0]}" cy="{O[1]}" r="{r*10}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(O[0], O[1], "O")
        
        # 外点P
        P = (O[0] + d*10, O[1])
        svg_content += self.generator._add_point(P[0], P[1], "P")
        
        # 切点T
        angle = math.asin(r/d)
        T1 = (O[0] + r*10*math.cos(angle), O[1] - r*10*math.sin(angle))
        T2 = (O[0] + r*10*math.cos(angle), O[1] + r*10*math.sin(angle))
        
        svg_content += self.generator._add_point(T1[0], T1[1], "T₁")
        svg_content += self.generator._add_point(T2[0], T2[1], "T₂")
        
        # 切线
        svg_content += f'  <line x1="{P[0]}" y1="{P[1]}" x2="{T1[0]}" y2="{T1[1]}" class="shape-fill"/>\n'
        svg_content += f'  <line x1="{P[0]}" y1="{P[1]}" x2="{T2[0]}" y2="{T2[1]}" class="shape-fill"/>\n'
        
        # 连接圆心到切点
        svg_content += f'  <line x1="{O[0]}" y1="{O[1]}" x2="{T1[0]}" y2="{T1[1]}" class="dimension"/>\n'
        svg_content += f'  <line x1="{O[0]}" y1="{O[1]}" x2="{T2[0]}" y2="{T2[1]}" class="dimension"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        return {
            'content': f"如图所示，从圆外一点P向半径为{r}cm的圆O引切线，已知PO = {d}cm。求切线长PT的值。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'hard',
            'correctAnswer': str(round(tangent_length, 2)),
            'explanation': f"根据切线的性质，OT ⊥ PT\n在直角三角形OTP中，OT = {r}cm，OP = {d}cm\n由勾股定理：PT² = OP² - OT² = {d}² - {r}² = {d*d} - {r*r} = {d*d - r*r}\n因此 PT = √{d*d - r*r} = {round(tangent_length, 2)}cm",
            'knowledgePoints': ["圆的切线", "勾股定理", "切线长定理"],
            'svgData': svg_content,
            'figureProperties': {
                'radius': r,
                'distance_to_center': d,
                'tangent_length': round(tangent_length, 2)
            },
            'hasGeometryFigure': True,
            'grade': '高二'
        }
    
    def _generate_chord_question(self) -> Dict:
        """生成圆的弦长题目"""
        r = random.randint(8, 12)  # 圆半径
        d = random.randint(4, 7)   # 弦心距
        
        # 计算弦长
        chord_length = 2 * math.sqrt(r*r - d*d)
        
        svg_content = self.generator._create_svg_header()
        
        # 圆心和圆
        O = (200, 150)
        svg_content += f'  <circle cx="{O[0]}" cy="{O[1]}" r="{r*10}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(O[0], O[1], "O")
        
        # 弦的端点
        A = (O[0] - chord_length*5, O[1] + d*10)
        B = (O[0] + chord_length*5, O[1] + d*10)
        
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        
        # 弦
        svg_content += f'  <line x1="{A[0]}" y1="{A[1]}" x2="{B[0]}" y2="{B[1]}" class="shape-fill"/>\n'
        
        # 弦心距
        M = ((A[0] + B[0])/2, (A[1] + B[1])/2)
        svg_content += self.generator._add_point(M[0], M[1], "M")
        svg_content += f'  <line x1="{O[0]}" y1="{O[1]}" x2="{M[0]}" y2="{M[1]}" class="dimension"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        return {
            'content': f"如图所示，在半径为{r}cm的圆O中，弦AB的弦心距OM = {d}cm。求弦AB的长度。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': str(round(chord_length, 2)),
            'explanation': f"设弦AB的中点为M，则OM ⊥ AB\n在直角三角形OMA中，OA = {r}cm，OM = {d}cm\n由勾股定理：AM² = OA² - OM² = {r}² - {d}² = {r*r} - {d*d} = {r*r - d*d}\n因此 AM = √{r*r - d*d} = {round(math.sqrt(r*r - d*d), 2)}cm\n弦长 AB = 2AM = 2 × {round(math.sqrt(r*r - d*d), 2)} = {round(chord_length, 2)}cm",
            'knowledgePoints': ["圆的弦长", "弦心距", "勾股定理"],
            'svgData': svg_content,
            'figureProperties': {
                'radius': r,
                'chord_distance': d,
                'chord_length': round(chord_length, 2)
            },
            'hasGeometryFigure': True,
            'grade': '高二'
        }
    
    def _generate_sector_question(self) -> Dict:
        """生成扇形题目"""
        r = random.randint(8, 12)  # 半径
        angle = random.randint(60, 120)  # 圆心角（度）
        
        # 计算扇形面积和弧长
        area = (angle / 360) * math.pi * r * r
        arc_length = (angle / 180) * math.pi * r
        
        svg_content = self.generator._create_svg_header()
        
        # 圆心
        O = (200, 150)
        svg_content += self.generator._add_point(O[0], O[1], "O")
        
        # 扇形的两条半径
        angle_rad = math.radians(angle)
        A = (O[0] + r*10, O[1])
        B = (O[0] + r*10*math.cos(angle_rad), O[1] - r*10*math.sin(angle_rad))
        
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        
        # 半径
        svg_content += f'  <line x1="{O[0]}" y1="{O[1]}" x2="{A[0]}" y2="{A[1]}" class="shape-fill"/>\n'
        svg_content += f'  <line x1="{O[0]}" y1="{O[1]}" x2="{B[0]}" y2="{B[1]}" class="shape-fill"/>\n'
        
        # 弧
        large_arc = 1 if angle > 180 else 0
        svg_content += f'  <path d="M {A[0]} {A[1]} A {r*10} {r*10} 0 {large_arc} 0 {B[0]} {B[1]}" class="shape-fill"/>\n'
        
        svg_content += self.generator._create_svg_footer()
        
        return {
            'content': f"如图所示，扇形AOB的半径为{r}cm，圆心角为{angle}°。求扇形的面积和弧长。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'medium',
            'correctAnswer': f"面积：{round(area, 2)}平方厘米，弧长：{round(arc_length, 2)}厘米",
            'explanation': f"扇形面积公式：S = (n°/360°) × πr²\n面积 = ({angle}°/360°) × π × {r}² = {angle/360} × π × {r*r} = {round(area, 2)}平方厘米\n弧长公式：l = (n°/180°) × πr\n弧长 = ({angle}°/180°) × π × {r} = {angle/180} × π × {r} = {round(arc_length, 2)}厘米",
            'knowledgePoints': ["扇形面积", "弧长公式", "圆心角"],
            'svgData': svg_content,
            'figureProperties': {
                'radius': r,
                'central_angle': angle,
                'area': round(area, 2),
                'arc_length': round(arc_length, 2)
            },
            'hasGeometryFigure': True,
            'grade': '高二'
        }
    
    def _generate_inscribed_triangle_question(self) -> Dict:
        """生成圆内接三角形题目"""
        r = random.randint(8, 12)  # 外接圆半径
        
        # 等边三角形内接于圆
        side = r * math.sqrt(3)
        
        svg_content = self.generator._create_svg_header()
        
        # 圆心和外接圆
        O = (200, 150)
        svg_content += f'  <circle cx="{O[0]}" cy="{O[1]}" r="{r*10}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(O[0], O[1], "O")
        
        # 等边三角形顶点
        A = (O[0], O[1] - r*10)
        B = (O[0] - r*10*math.cos(math.pi/6), O[1] + r*10*math.sin(math.pi/6))
        C = (O[0] + r*10*math.cos(math.pi/6), O[1] + r*10*math.sin(math.pi/6))
        
        svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]}" class="shape-fill"/>\n'
        svg_content += self.generator._add_point(A[0], A[1], "A")
        svg_content += self.generator._add_point(B[0], B[1], "B")
        svg_content += self.generator._add_point(C[0], C[1], "C")
        
        svg_content += self.generator._create_svg_footer()
        
        area = (math.sqrt(3) / 4) * side * side
        
        return {
            'content': f"如图所示，等边三角形ABC内接于半径为{r}cm的圆O。求三角形ABC的边长和面积。",
            'type': '计算题',
            'subject': '数学',
            'difficulty': 'hard',
            'correctAnswer': f"边长：{round(side, 2)}cm，面积：{round(area, 2)}平方厘米",
            'explanation': f"对于内接于圆的等边三角形，边长公式：a = R√3\n其中R为外接圆半径\n边长 = {r}√3 = {round(side, 2)}cm\n等边三角形面积 = (√3/4) × a² = (√3/4) × {round(side, 2)}² = {round(area, 2)}平方厘米",
            'knowledgePoints': ["圆内接三角形", "等边三角形", "外接圆"],
            'svgData': svg_content,
            'figureProperties': {
                'circumradius': r,
                'side_length': round(side, 2),
                'area': round(area, 2)
            },
            'hasGeometryFigure': True,
            'grade': '高二'
        }
    
    def add_questions_to_database(self):
        """将生成的题目添加到数据库"""
        print("开始生成20道高考级别几何题目...")
        
        # 生成各类题目
        triangle_questions = self.generate_advanced_triangle_questions(8)
        quad_questions = self.generate_advanced_quadrilateral_questions(6)
        circle_questions = self.generate_advanced_circle_questions(6)
        
        all_questions = triangle_questions + quad_questions + circle_questions
        
        print(f"共生成 {len(all_questions)} 道高考级别几何题目")
        print(f"- 高级三角形题目: {len(triangle_questions)} 道")
        print(f"- 高级四边形题目: {len(quad_questions)} 道")
        print(f"- 高级圆形题目: {len(circle_questions)} 道")
        
        # 添加到数据库
        success_count = 0
        for i, question in enumerate(all_questions, 1):
            try:
                print(f"\n正在添加第 {i} 道题目...")
                print(f"题目类型: {question.get('knowledgePoints', ['未知'])[0]}")
                print(f"题目内容: {question['content'][:50]}...")
                
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
                        "hasGeometryFigure": True,
                        "grade": question.get("grade", "高二")
                    }
                }
                
                response = requests.post(url, json=question_data, timeout=10)
                if response.status_code == 200:
                    success_count += 1
                    print(f"✓ 题目添加成功")
                else:
                    print(f"✗ 题目添加失败 - 状态码: {response.status_code}")
                    
            except Exception as e:
                print(f"✗ 添加题目时出错: {str(e)}")
        
        print(f"\n高考级别几何题目添加完成！")
        print(f"成功添加: {success_count} 道")
        print(f"失败: {len(all_questions) - success_count} 道")
        print(f"成功率: {success_count/len(all_questions)*100:.1f}%")

def main():
    """主函数"""
    print("=== 高考级别几何题生成器 ===")
    
    try:
        generator = AdvancedGeometryGenerator()
        
        # 检查服务器连接
        if not generator.question_manager.check_server_connection():
            print("❌ 无法连接到服务器，请确保后端服务正在运行")
            return
        
        print("✓ 服务器连接正常")
        
        # 生成并添加题目
        generator.add_questions_to_database()
        
    except Exception as e:
        print(f"❌ 程序执行出错: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()