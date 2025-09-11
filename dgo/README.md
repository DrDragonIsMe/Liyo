# 题目管理工具示例

本目录包含了完整的Python示例程序，演示如何在特定科目内添加普通试题和图片试题，并管理相关知识点。

## 目录结构

```
dgo/
├── README.md              # 说明文档
└── addquestion/           # 题目管理工具
    ├── requirements.txt   # Python依赖
    ├── setup.py          # 安装配置脚本
    ├── config.py         # 配置文件
    ├── example_add_questions.py    # 基础示例
    ├── enhanced_example.py         # 增强版示例
    ├── sample_data.json           # 示例数据
    └── sample_physics_diagram.svg # 示例图片
```

## 文件说明

- `example_add_questions.py` - 主要示例程序
- `README.md` - 本说明文件

## 功能特性

### 1. 知识点管理
- 创建新的知识点
- 指定知识点所属科目
- 添加知识点描述

### 2. 普通试题添加
- 支持多选题格式
- 设置题目内容、选项、正确答案
- 添加详细解析
- 关联相关知识点
- 设置难度等级（easy/medium/hard）

### 3. 图片试题添加
- 支持PNG、JPG格式图片
- 自动进行base64编码
- 图文结合的题目展示
- 与普通试题相同的配置选项

## 快速开始

### 1. 进入工具目录
```bash
cd dgo/addquestion
```

### 2. 一键安装和配置
```bash
# 完整安装流程（推荐）
python setup.py all

# 或者分步执行
python setup.py install    # 安装依赖
python setup.py config     # 配置服务器
python setup.py test       # 测试连接
```

### 3. 运行示例程序
```bash
# 基础示例
python example_add_questions.py

# 增强版示例（推荐）
python enhanced_example.py
```

## 手动配置（可选）

如果不使用setup.py脚本，也可以手动配置：

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 配置服务器信息
- 修改 `config.py` 中的 `SERVER_CONFIG['base_url']`
- 设置有效的 `AUTH_CONFIG['token']`

### 3. 准备图片文件（可选）
- 为图片试题准备相应的图片文件
- 支持的格式：PNG, JPG, JPEG, SVG
- 建议文件大小不超过10MB

## 代码示例

### 创建知识点
```python
manager = StudyQuestionManager(token="your_token")

# 创建数学知识点
point_id = manager.create_knowledge_point(
    name="一元二次方程",
    subject="数学",
    description="形如ax²+bx+c=0(a≠0)的方程"
)
```

### 添加普通试题
```python
manager.add_text_question(
    subject="数学",
    content="方程x²-5x+6=0的解是？",
    options=["A. x=2或x=3", "B. x=1或x=6", "C. x=-2或x=-3", "D. x=5或x=1"],
    correct_answer="A",
    explanation="使用因式分解法：x²-5x+6=(x-2)(x-3)=0，所以x=2或x=3",
    knowledge_points=[point_id],
    difficulty="easy"
)
```

### 添加图片试题
```python
manager.add_image_question(
    subject="物理",
    content="如图所示，质量为2kg的物体在水平面上受到10N的水平拉力，求物体的加速度。",
    image_path="./physics_diagram.png",
    options=["A. 5 m/s²", "B. 10 m/s²", "C. 2 m/s²", "D. 20 m/s²"],
    correct_answer="A",
    explanation="根据牛顿第二定律F=ma，a=F/m=10N/2kg=5m/s²",
    knowledge_points=[mechanics_id],
    difficulty="medium"
)
```

## API接口说明

### 知识点创建接口
- **URL**: `POST /api/knowledge-points`
- **参数**: name, subject, description
- **返回**: 知识点ID

### 试题保存接口
- **URL**: `POST /api/ai/save-question`
- **参数**: question对象（包含所有试题信息）
- **支持**: 文本试题和图片试题

## 注意事项

1. **认证**: 所有API调用都需要有效的认证token
2. **图片大小**: 建议图片文件不超过5MB
3. **知识点**: 建议先创建知识点，再创建试题
4. **科目一致性**: 确保试题的科目与知识点的科目保持一致
5. **服务器状态**: 确保后端服务器正在运行

## 错误处理

程序包含完整的错误处理机制：
- 网络请求异常
- 文件读取错误
- API响应错误
- 图片编码失败

所有错误都会有详细的提示信息，便于调试和问题定位。

## 扩展功能

可以基于此示例程序扩展更多功能：
- 批量导入试题
- 从Excel/CSV文件读取题目数据
- 支持更多题型（填空题、判断题等）
- 添加题目标签和分类
- 实现题目的修改和删除功能