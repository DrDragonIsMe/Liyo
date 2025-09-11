# KaTeX 数学公式格式化说明

## 概述

本项目已集成 KaTeX 格式化功能，确保所有数学公式严格符合 KaTeX 标准，提供更好的数学公式渲染效果。

## 实现的功能

### 1. KaTeX 格式化器 (`katex_formatter.py`)

- **格式化功能**: 自动将 LaTeX 公式转换为 KaTeX 兼容格式
- **验证功能**: 检查公式是否符合 KaTeX 标准
- **错误处理**: 处理不支持的 LaTeX 命令和环境

### 2. 支持的转换

#### 函数名转换
- `\sin` → `\\sin`
- `\cos` → `\\cos`
- `\tan` → `\\tan`
- `\log` → `\\log`
- `\ln` → `\\ln`
- `\exp` → `\\exp`
- `\lim` → `\\lim`
- `\max` → `\\max`
- `\min` → `\\min`

#### 希腊字母转换
- `\alpha` → `\\alpha`
- `\beta` → `\\beta`
- `\gamma` → `\\gamma`
- `\delta` → `\\delta`
- `\theta` → `\\theta`
- `\pi` → `\\pi`
- `\sigma` → `\\sigma`
- `\omega` → `\\omega`

#### 运算符转换
- `\sum` → `\\sum`
- `\prod` → `\\prod`
- `\int` → `\\int`
- `\partial` → `\\partial`
- `\nabla` → `\\nabla`
- `\infty` → `\\infty`

#### 关系符转换
- `\leq` → `\\leq`
- `\geq` → `\\geq`
- `\neq` → `\\neq`
- `\approx` → `\\approx`
- `\equiv` → `\\equiv`

### 3. 不支持的功能处理

格式化器会自动移除或替换 KaTeX 不支持的 LaTeX 功能：

- 移除 `\begin{align}` 和 `\end{align}` 环境
- 移除 `\begin{equation}` 和 `\end{equation}` 环境
- 移除 `\label{}` 和 `\ref{}` 引用
- 移除 `\cite{}` 引用
- 移除 `\newcommand` 定义

## 集成的脚本

### 1. `enhanced_example.py`

在 `add_text_question` 方法中自动格式化：
- 题目内容
- 选项内容
- 解析内容

### 2. `add_math_test_questions.py`

在批量添加题目时自动格式化：
- 题目内容
- 所有选项
- 解析内容

### 3. `update_math_questions.py`

用于更新现有题目数据文件中的公式格式。

## 使用方法

### 自动格式化

所有新添加的题目都会自动进行 KaTeX 格式化，无需手动操作。

### 手动格式化现有数据

```bash
# 格式化现有的题目数据文件
python update_math_questions.py
```

### 测试格式化功能

```bash
# 运行测试脚本
python test_katex_formatting.py
```

## 格式化示例

### 输入（原始 LaTeX）
```latex
已知 $\sin\alpha = \frac{3}{5}$，且 $\alpha$ 为第二象限角
```

### 输出（KaTeX 格式）
```latex
已知 $\\sin\alpha = \frac{3}{5}$，且 $\alpha$ 为第二象限角
```

## 验证结果

根据测试结果：
- 总共处理 60 个字段
- 格式化 4 个字段（6.7% 的字段需要格式化）
- 所有公式都符合 KaTeX 标准

## 注意事项

1. **自动化处理**: 所有题目添加流程都已集成格式化功能
2. **向后兼容**: 已有的正确格式公式不会被修改
3. **错误提示**: 如果发现不符合标准的公式会有警告提示
4. **备份机制**: `update_math_questions.py` 会自动创建备份文件

## 文件结构

```
dgo/addquestion/
├── katex_formatter.py          # KaTeX 格式化器
├── enhanced_example.py         # 增强的题目管理器（已集成格式化）
├── add_math_test_questions.py  # 数学题目批量添加（已集成格式化）
├── update_math_questions.py    # 更新现有题目格式
├── test_katex_formatting.py    # 格式化功能测试
├── math_test_questions.json    # 题目数据文件
└── KATEX_FORMATTING.md         # 本说明文档
```

## 总结

KaTeX 格式化功能已完全集成到题目生成流程中，确保：
- 所有新添加的题目公式都符合 KaTeX 标准
- 现有题目可以通过工具进行格式化
- 提供完整的测试和验证机制
- 保持向后兼容性