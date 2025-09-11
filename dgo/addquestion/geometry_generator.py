#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
几何图形生成器
用于生成数学几何题目中的各种图形（SVG格式）
"""

import math
import random
from typing import Dict, List, Tuple, Optional

class GeometryGenerator:
    """几何图形生成器类"""
    
    def __init__(self, width: int = 400, height: int = 300):
        self.width = width
        self.height = height
        self.center_x = width // 2
        self.center_y = height // 2
        self.margin = 20
    
    def _create_svg_header(self) -> str:
        """创建SVG头部"""
        return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{self.width}" height="{self.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .shape-fill {{ fill: none; stroke: #2563eb; stroke-width: 2; }}
      .shape-fill-light {{ fill: #dbeafe; stroke: #2563eb; stroke-width: 2; }}
      .point {{ fill: #dc2626; stroke: none; }}
      .label {{ font-family: Arial, sans-serif; font-size: 14px; fill: #374151; }}
      .dimension {{ stroke: #6b7280; stroke-width: 1; stroke-dasharray: 3,3; }}
      .angle-arc {{ fill: none; stroke: #059669; stroke-width: 1.5; }}
      .grid {{ stroke: #e5e7eb; stroke-width: 0.5; }}
    </style>
  </defs>
  <rect width="{self.width}" height="{self.height}" fill="white"/>'''
    
    def _create_svg_footer(self) -> str:
        """创建SVG尾部"""
        return '</svg>'
    
    def _add_point(self, x: float, y: float, label: str = "") -> str:
        """添加点"""
        point_svg = f'  <circle cx="{x}" cy="{y}" r="3" class="point"/>\n'
        if label:
            point_svg += f'  <text x="{x+8}" y="{y-8}" class="label">{label}</text>\n'
        return point_svg
    
    def _add_line(self, x1: float, y1: float, x2: float, y2: float, class_name: str = "shape-fill") -> str:
        """添加直线"""
        return f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{class_name}"/>\n'
    
    def _add_text(self, x: float, y: float, text: str, class_name: str = "label") -> str:
        """添加文本"""
        return f'  <text x="{x}" y="{y}" class="{class_name}">{text}</text>\n'
    
    def generate_triangle(self, triangle_type: str = "general", **kwargs) -> Dict:
        """生成三角形
        
        Args:
            triangle_type: 三角形类型 (general, right, equilateral, isosceles)
            **kwargs: 其他参数如边长、角度等
        """
        svg_content = self._create_svg_header()
        
        if triangle_type == "right":
            # 直角三角形
            a = kwargs.get('a', 80)  # 直角边a
            b = kwargs.get('b', 60)  # 直角边b
            
            # 计算顶点坐标
            A = (self.center_x - a//2, self.center_y + b//2)  # 直角顶点
            B = (self.center_x + a//2, self.center_y + b//2)  # 底边右端点
            C = (self.center_x - a//2, self.center_y - b//2)  # 顶点
            
            # 绘制三角形
            svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]}" class="shape-fill"/>\n'
            
            # 添加顶点标签
            svg_content += self._add_point(A[0], A[1], "A")
            svg_content += self._add_point(B[0], B[1], "B")
            svg_content += self._add_point(C[0], C[1], "C")
            
            # 添加直角标记
            svg_content += f'  <path d="M {A[0]+10},{A[1]} L {A[0]+10},{A[1]-10} L {A[0]},{A[1]-10}" class="shape-fill"/>\n'
            
            # 计算斜边长度
            c = math.sqrt(a*a + b*b)
            
            return {
                "svg": svg_content + self._create_svg_footer(),
                "properties": {
                    "type": "直角三角形",
                    "sides": {"a": a, "b": b, "c": round(c, 2)},
                    "angles": {"A": 90, "B": round(math.degrees(math.atan(b/a)), 1), "C": round(90 - math.degrees(math.atan(b/a)), 1)},
                    "area": a * b / 2,
                    "perimeter": a + b + c
                }
            }
        
        elif triangle_type == "equilateral":
            # 等边三角形
            side = kwargs.get('side', 100)
            height = side * math.sqrt(3) / 2
            
            # 计算顶点坐标
            A = (self.center_x, self.center_y - height/2)  # 顶点
            B = (self.center_x - side/2, self.center_y + height/2)  # 左下
            C = (self.center_x + side/2, self.center_y + height/2)  # 右下
            
            # 绘制三角形
            svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]}" class="shape-fill"/>\n'
            
            # 添加顶点标签
            svg_content += self._add_point(A[0], A[1], "A")
            svg_content += self._add_point(B[0], B[1], "B")
            svg_content += self._add_point(C[0], C[1], "C")
            
            return {
                "svg": svg_content + self._create_svg_footer(),
                "properties": {
                    "type": "等边三角形",
                    "sides": {"a": side, "b": side, "c": side},
                    "angles": {"A": 60, "B": 60, "C": 60},
                    "area": side * side * math.sqrt(3) / 4,
                    "perimeter": 3 * side
                }
            }
        
        elif triangle_type == "isosceles":
            # 等腰三角形
            base = kwargs.get('base', 80)
            height = kwargs.get('height', 60)
            
            # 计算顶点坐标
            A = (self.center_x, self.center_y - height/2)  # 顶点
            B = (self.center_x - base/2, self.center_y + height/2)  # 左下
            C = (self.center_x + base/2, self.center_y + height/2)  # 右下
            
            # 绘制三角形
            svg_content += f'  <polygon points="{A[0]},{A[1]} {B[0]},{B[1]} {C[0]},{C[1]}" class="shape-fill"/>\n'
            
            # 添加顶点标签
            svg_content += self._add_point(A[0], A[1], "A")
            svg_content += self._add_point(B[0], B[1], "B")
            svg_content += self._add_point(C[0], C[1], "C")
            
            # 计算腰长
            side = math.sqrt((height/2)**2 + (base/2)**2)
            
            return {
                "svg": svg_content + self._create_svg_footer(),
                "properties": {
                    "type": "等腰三角形",
                    "sides": {"base": base, "side": round(side, 2)},
                    "height": height,
                    "area": base * height / 2,
                    "perimeter": base + 2 * side
                }
            }
    
    def generate_quadrilateral(self, quad_type: str = "rectangle", **kwargs) -> Dict:
        """生成四边形
        
        Args:
            quad_type: 四边形类型 (rectangle, square, parallelogram, rhombus, trapezoid)
            **kwargs: 其他参数如边长、角度等
        """
        svg_content = self._create_svg_header()
        
        if quad_type == "rectangle":
            # 矩形
            width = kwargs.get('width', 120)
            height = kwargs.get('height', 80)
            
            # 计算顶点坐标
            x = self.center_x - width/2
            y = self.center_y - height/2
            
            # 绘制矩形
            svg_content += f'  <rect x="{x}" y="{y}" width="{width}" height="{height}" class="shape-fill"/>\n'
            
            # 添加顶点标签
            svg_content += self._add_point(x, y, "A")
            svg_content += self._add_point(x + width, y, "B")
            svg_content += self._add_point(x + width, y + height, "C")
            svg_content += self._add_point(x, y + height, "D")
            
            return {
                "svg": svg_content + self._create_svg_footer(),
                "properties": {
                    "type": "矩形",
                    "width": width,
                    "height": height,
                    "area": width * height,
                    "perimeter": 2 * (width + height)
                }
            }
        
        elif quad_type == "square":
            # 正方形
            side = kwargs.get('side', 100)
            
            # 计算顶点坐标
            x = self.center_x - side/2
            y = self.center_y - side/2
            
            # 绘制正方形
            svg_content += f'  <rect x="{x}" y="{y}" width="{side}" height="{side}" class="shape-fill"/>\n'
            
            # 添加顶点标签
            svg_content += self._add_point(x, y, "A")
            svg_content += self._add_point(x + side, y, "B")
            svg_content += self._add_point(x + side, y + side, "C")
            svg_content += self._add_point(x, y + side, "D")
            
            return {
                "svg": svg_content + self._create_svg_footer(),
                "properties": {
                    "type": "正方形",
                    "side": side,
                    "area": side * side,
                    "perimeter": 4 * side
                }
            }
    
    def generate_circle(self, **kwargs) -> Dict:
        """生成圆形
        
        Args:
            **kwargs: 参数如半径等
        """
        svg_content = self._create_svg_header()
        
        radius = kwargs.get('radius', 60)
        
        # 绘制圆
        svg_content += f'  <circle cx="{self.center_x}" cy="{self.center_y}" r="{radius}" class="shape-fill"/>\n'
        
        # 添加圆心
        svg_content += self._add_point(self.center_x, self.center_y, "O")
        
        # 添加半径线
        svg_content += self._add_line(self.center_x, self.center_y, self.center_x + radius, self.center_y)
        svg_content += self._add_text(self.center_x + radius/2, self.center_y - 10, "r")
        
        return {
            "svg": svg_content + self._create_svg_footer(),
            "properties": {
                "type": "圆",
                "radius": radius,
                "diameter": 2 * radius,
                "area": math.pi * radius * radius,
                "circumference": 2 * math.pi * radius
            }
        }
    
    def generate_coordinate_system(self, x_range: Tuple[int, int] = (-5, 5), y_range: Tuple[int, int] = (-4, 4)) -> str:
        """生成坐标系
        
        Args:
            x_range: x轴范围
            y_range: y轴范围
        """
        svg_content = self._create_svg_header()
        
        # 计算网格间距
        x_min, x_max = x_range
        y_min, y_max = y_range
        
        grid_width = (self.width - 2 * self.margin) / (x_max - x_min)
        grid_height = (self.height - 2 * self.margin) / (y_max - y_min)
        
        # 绘制网格
        for i in range(x_min, x_max + 1):
            x = self.margin + (i - x_min) * grid_width
            svg_content += self._add_line(x, self.margin, x, self.height - self.margin, "grid")
        
        for i in range(y_min, y_max + 1):
            y = self.height - self.margin - (i - y_min) * grid_height
            svg_content += self._add_line(self.margin, y, self.width - self.margin, y, "grid")
        
        # 绘制坐标轴
        origin_x = self.margin + (0 - x_min) * grid_width
        origin_y = self.height - self.margin - (0 - y_min) * grid_height
        
        # x轴
        svg_content += self._add_line(self.margin, origin_y, self.width - self.margin, origin_y, "shape-fill")
        # y轴
        svg_content += self._add_line(origin_x, self.margin, origin_x, self.height - self.margin, "shape-fill")
        
        # 添加箭头
        svg_content += f'  <polygon points="{self.width - self.margin},{origin_y} {self.width - self.margin - 8},{origin_y - 4} {self.width - self.margin - 8},{origin_y + 4}" class="shape-fill"/>\n'
        svg_content += f'  <polygon points="{origin_x},{self.margin} {origin_x - 4},{self.margin + 8} {origin_x + 4},{self.margin + 8}" class="shape-fill"/>\n'
        
        # 添加轴标签
        svg_content += self._add_text(self.width - self.margin + 10, origin_y + 5, "x")
        svg_content += self._add_text(origin_x - 10, self.margin - 5, "y")
        svg_content += self._add_text(origin_x - 15, origin_y + 15, "O")
        
        return svg_content + self._create_svg_footer()


def generate_geometry_question_with_figure(question_type: str, **params) -> Dict:
    """生成带图形的几何题目
    
    Args:
        question_type: 题目类型
        **params: 题目参数
    
    Returns:
        包含题目内容、图形SVG和答案的字典
    """
    generator = GeometryGenerator()
    
    if question_type == "triangle_area":
        # 三角形面积题目
        triangle_type = params.get('triangle_type', 'right')
        
        if triangle_type == 'right':
            a = random.randint(6, 12)
            b = random.randint(6, 12)
            
            figure_data = generator.generate_triangle('right', a=a*10, b=b*10)
            
            question_content = f"如图所示，在直角三角形ABC中，直角边AB = {a}cm，直角边AC = {b}cm。求三角形ABC的面积。"
            
            correct_answer = a * b / 2
            explanation = f"直角三角形的面积公式为：面积 = (1/2) × 底 × 高\n" + \
                         f"因此，面积 = (1/2) × {a} × {b} = {correct_answer}平方厘米"
            
            return {
                "content": question_content,
                "svg": figure_data["svg"],
                "type": "计算题",
                "subject": "数学",
                "difficulty": "medium",
                "correctAnswer": str(correct_answer),
                "explanation": explanation,
                "knowledgePoints": ["三角形面积", "直角三角形"],
                "figureProperties": figure_data["properties"]
            }
    
    elif question_type == "circle_area":
        # 圆面积题目
        radius = random.randint(3, 8)
        
        figure_data = generator.generate_circle(radius=radius*10)
        
        question_content = f"如图所示，圆O的半径为{radius}cm。求圆O的面积。（π取3.14）"
        
        correct_answer = 3.14 * radius * radius
        explanation = f"圆的面积公式为：面积 = π × r²\n" + \
                     f"因此，面积 = 3.14 × {radius}² = 3.14 × {radius * radius} = {correct_answer}平方厘米"
        
        return {
            "content": question_content,
            "svg": figure_data["svg"],
            "type": "计算题",
            "subject": "数学",
            "difficulty": "medium",
            "correctAnswer": str(correct_answer),
            "explanation": explanation,
            "knowledgePoints": ["圆的面积", "圆的性质"],
            "figureProperties": figure_data["properties"]
        }
    
    elif question_type == "rectangle_perimeter":
        # 矩形周长题目
        width = random.randint(5, 12)
        height = random.randint(4, 10)
        
        figure_data = generator.generate_quadrilateral('rectangle', width=width*10, height=height*10)
        
        question_content = f"如图所示，矩形ABCD的长为{width}cm，宽为{height}cm。求矩形ABCD的周长。"
        
        correct_answer = 2 * (width + height)
        explanation = f"矩形的周长公式为：周长 = 2 × (长 + 宽)\n" + \
                     f"因此，周长 = 2 × ({width} + {height}) = 2 × {width + height} = {correct_answer}厘米"
        
        return {
            "content": question_content,
            "svg": figure_data["svg"],
            "type": "计算题",
            "subject": "数学",
            "difficulty": "easy",
            "correctAnswer": str(correct_answer),
            "explanation": explanation,
            "knowledgePoints": ["矩形周长", "矩形性质"],
            "figureProperties": figure_data["properties"]
        }
    
    # 默认返回简单的三角形题目
    return generate_geometry_question_with_figure("triangle_area", triangle_type='right')


if __name__ == "__main__":
    # 测试代码
    generator = GeometryGenerator()
    
    # 测试生成直角三角形
    triangle = generator.generate_triangle('right', a=80, b=60)
    print("直角三角形SVG:")
    print(triangle['svg'])
    print("\n属性:", triangle['properties'])
    
    # 测试生成几何题目
    question = generate_geometry_question_with_figure('triangle_area')
    print("\n几何题目:")
    print(f"题目: {question['content']}")
    print(f"答案: {question['correctAnswer']}")
    print(f"解析: {question['explanation']}")