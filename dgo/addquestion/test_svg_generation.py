#!/usr/bin/env python3

from geometry_generator import GeometryGenerator

def test_svg_generation():
    """测试SVG生成功能"""
    generator = GeometryGenerator()
    
    print("测试圆形SVG生成...")
    try:
        circle_data = generator.generate_circle(radius=50)
        print(f"圆形SVG长度: {len(circle_data['svg']) if circle_data['svg'] else 0}")
        print(f"圆形属性: {circle_data['properties']}")
        if circle_data['svg']:
            print(f"SVG预览: {circle_data['svg'][:200]}...")
        else:
            print("警告: 圆形SVG为空")
    except Exception as e:
        print(f"圆形SVG生成失败: {e}")
    
    print("\n测试三角形SVG生成...")
    try:
        triangle_data = generator.generate_triangle(triangle_type="right", a=80, b=60)
        print(f"三角形SVG长度: {len(triangle_data['svg']) if triangle_data['svg'] else 0}")
        print(f"三角形属性: {triangle_data['properties']}")
        if triangle_data['svg']:
            print(f"SVG预览: {triangle_data['svg'][:200]}...")
        else:
            print("警告: 三角形SVG为空")
    except Exception as e:
        print(f"三角形SVG生成失败: {e}")
    
    print("\n测试四边形SVG生成...")
    try:
        quad_data = generator.generate_quadrilateral(quad_type="rectangle", width=80, height=60)
        print(f"四边形SVG长度: {len(quad_data['svg']) if quad_data['svg'] else 0}")
        print(f"四边形属性: {quad_data['properties']}")
        if quad_data['svg']:
            print(f"SVG预览: {quad_data['svg'][:200]}...")
        else:
            print("警告: 四边形SVG为空")
    except Exception as e:
        print(f"四边形SVG生成失败: {e}")

if __name__ == "__main__":
    test_svg_generation()