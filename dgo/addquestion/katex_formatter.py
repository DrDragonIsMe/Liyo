#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KaTeX公式格式化工具

本模块用于将数学公式转换为严格符合KaTeX标准的格式
"""

import re
from typing import Dict, List, Tuple

class KaTeXFormatter:
    """
    KaTeX公式格式化器
    
    将LaTeX数学公式转换为严格符合KaTeX标准的格式
    """
    
    def __init__(self):
        # KaTeX不支持的命令映射到支持的命令
        self.unsupported_commands = {
            # 分数相关
            r'\\dfrac': r'\\frac',
            r'\\tfrac': r'\\frac',
            
            # 根号相关
            r'\\surd': r'\\sqrt',
            
            # 字体相关
            r'\\mathbb': r'\\mathbf',  # KaTeX支持有限的mathbb
            r'\\mathfrak': r'\\mathbf',
            r'\\mathscr': r'\\mathcal',
            
            # 空格相关
            r'\\,': r'\\:',  # 细空格
            r'\\;': r'\\quad',  # 中等空格
            r'\\!': '',  # 负空格，KaTeX中移除
            
            # 其他不支持的命令
            r'\\displaystyle': '',
            r'\\textstyle': '',
            r'\\scriptstyle': '',
            r'\\scriptscriptstyle': '',
        }
        
        # 需要特殊处理的环境
        self.environment_replacements = {
            r'\\begin\{align\}': r'\\begin{aligned}',
            r'\\end\{align\}': r'\\end{aligned}',
            r'\\begin\{eqnarray\}': r'\\begin{aligned}',
            r'\\end\{eqnarray\}': r'\\end{aligned}',
        }
        
        # 函数名标准化
        self.function_names = {
            r'\\operatorname\{([^}]+)\}': r'\\text{\\1}',
            r'\\mathrm\{([^}]+)\}': r'\\text{\\1}',
        }
    
    def format_latex_formula(self, text: str) -> str:
        """
        格式化LaTeX公式为KaTeX兼容格式
        
        Args:
            text: 包含LaTeX公式的文本
            
        Returns:
            格式化后的文本
        """
        if not text:
            return text
            
        # 处理行内公式 $...$
        text = re.sub(r'\$([^$]+)\$', lambda m: f'${self._format_single_formula(m.group(1))}$', text)
        
        # 处理行间公式 $$...$$
        text = re.sub(r'\$\$([^$]+)\$\$', lambda m: f'$${self._format_single_formula(m.group(1))}$$', text)
        
        # 处理\(...\)格式
        text = re.sub(r'\\\(([^)]+)\\\)', lambda m: f'\\({self._format_single_formula(m.group(1))}\\)', text)
        
        # 处理\[...\]格式
        text = re.sub(r'\\\[([^\]]+)\\\]', lambda m: f'\\[{self._format_single_formula(m.group(1))}\\]', text)
        
        return text
    
    def _format_single_formula(self, formula: str) -> str:
        """
        格式化单个公式
        
        Args:
            formula: LaTeX公式字符串
            
        Returns:
            KaTeX兼容的公式字符串
        """
        # 移除多余的空格
        formula = re.sub(r'\s+', ' ', formula.strip())
        
        # 替换不支持的命令
        for old_cmd, new_cmd in self.unsupported_commands.items():
            formula = re.sub(old_cmd, new_cmd, formula)
        
        # 替换环境
        for old_env, new_env in self.environment_replacements.items():
            formula = re.sub(old_env, new_env, formula)
        
        # 处理函数名
        for pattern, replacement in self.function_names.items():
            formula = re.sub(pattern, replacement, formula)
        
        # 标准化分数格式
        formula = self._standardize_fractions(formula)
        
        # 标准化上下标
        formula = self._standardize_scripts(formula)
        
        # 标准化括号
        formula = self._standardize_brackets(formula)
        
        # 标准化三角函数
        formula = self._standardize_trig_functions(formula)
        
        # 标准化对数函数
        formula = self._standardize_log_functions(formula)
        
        return formula
    
    def _standardize_fractions(self, formula: str) -> str:
        """
        标准化分数格式
        """
        # 确保\frac后面有正确的大括号
        formula = re.sub(r'\\frac\s*([^{])([^{])', r'\\frac{\1}{\2}', formula)
        
        # 处理简单的a/b格式转换为\frac{a}{b}
        # 但要小心不要转换已经在\frac中的内容
        def replace_simple_fraction(match):
            numerator = match.group(1)
            denominator = match.group(2)
            # 检查是否已经在数学环境中
            if '\\' in numerator or '\\' in denominator:
                return match.group(0)
            return f'\\frac{{{numerator}}}{{{denominator}}}'
        
        # 匹配简单的数字/数字或变量/变量格式
        formula = re.sub(r'([a-zA-Z0-9]+)/([a-zA-Z0-9]+)', replace_simple_fraction, formula)
        
        return formula
    
    def _standardize_scripts(self, formula: str) -> str:
        """
        标准化上下标格式
        """
        # 确保上下标有正确的大括号（当内容超过一个字符时）
        # 上标
        formula = re.sub(r'\^([a-zA-Z0-9]{2,})', r'^{\1}', formula)
        # 下标
        formula = re.sub(r'_([a-zA-Z0-9]{2,})', r'_{\1}', formula)
        
        return formula
    
    def _standardize_brackets(self, formula: str) -> str:
        """
        标准化括号格式
        """
        # 替换不支持的括号命令
        replacements = {
            r'\\langle': r'\\langle',  # KaTeX支持
            r'\\rangle': r'\\rangle',  # KaTeX支持
            r'\\lbrace': r'\\{',
            r'\\rbrace': r'\\}',
            r'\\lbrack': r'[',
            r'\\rbrack': r']',
        }
        
        for old, new in replacements.items():
            formula = re.sub(old, new, formula)
        
        return formula
    
    def _standardize_trig_functions(self, formula: str) -> str:
        """
        标准化三角函数
        """
        # 确保三角函数使用正确的格式
        trig_functions = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 
                         'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh']
        
        for func in trig_functions:
            # 将普通文本的三角函数转换为LaTeX格式
            formula = re.sub(f'\\b{func}\\b', f'\\\\{func}', formula)
        
        return formula
    
    def _standardize_log_functions(self, formula: str) -> str:
        """
        标准化对数函数
        """
        # 标准化对数函数格式
        # log_a(x) -> \log_a(x)
        formula = re.sub(r'\\blog_([a-zA-Z0-9]+)\\b', r'\\log_{\1}', formula)
        formula = re.sub(r'\\blog\\b', r'\\log', formula)
        formula = re.sub(r'\\bln\\b', r'\\ln', formula)
        
        return formula
    
    def validate_katex_compatibility(self, formula: str) -> Tuple[bool, List[str]]:
        """
        验证公式是否符合KaTeX标准
        
        Args:
            formula: LaTeX公式字符串
            
        Returns:
            (是否兼容, 问题列表)
        """
        issues = []
        
        # 检查不支持的命令
        unsupported_patterns = [
            r'\\mathbb\{[^}]*\}',  # 部分mathbb不支持
            r'\\mathfrak\{[^}]*\}',
            r'\\mathscr\{[^}]*\}',
            r'\\displaystyle',
            r'\\textstyle',
            r'\\scriptstyle',
            r'\\scriptscriptstyle',
            r'\\dfrac',
            r'\\tfrac',
        ]
        
        for pattern in unsupported_patterns:
            if re.search(pattern, formula):
                issues.append(f"发现不支持的命令: {pattern}")
        
        # 检查环境
        unsupported_envs = [r'\\begin\{align\}', r'\\begin\{eqnarray\}']
        for env in unsupported_envs:
            if re.search(env, formula):
                issues.append(f"发现不支持的环境: {env}")
        
        return len(issues) == 0, issues

# 全局格式化器实例
katex_formatter = KaTeXFormatter()

def format_math_content(content: str) -> str:
    """
    格式化包含数学公式的内容
    
    Args:
        content: 包含数学公式的文本内容
        
    Returns:
        格式化后的内容
    """
    return katex_formatter.format_latex_formula(content)

def validate_math_content(content: str) -> Tuple[bool, List[str]]:
    """
    验证数学内容的KaTeX兼容性
    
    Args:
        content: 包含数学公式的文本内容
        
    Returns:
        (是否兼容, 问题列表)
    """
    return katex_formatter.validate_katex_compatibility(content)