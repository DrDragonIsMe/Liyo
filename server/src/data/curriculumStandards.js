/**
 * 普通高中课程标准（2017年版2020年修订）
 * 基于教育部官方发布的课程标准，涵盖9大学科知识点体系
 * 数据来源：人民教育出版社官网
 */

const CURRICULUM_STANDARDS = {
  // 语文学科
  chinese: {
    name: '语文',
    code: 'chinese',
    modules: {
      compulsory: {
        name: '必修课程',
        units: [
          {
            name: '现代文阅读',
            topics: ['论述类文本阅读', '实用类文本阅读', '文学类文本阅读']
          },
          {
            name: '古代诗文阅读',
            topics: ['文言文阅读', '古代诗歌阅读', '名篇名句默写']
          },
          {
            name: '语言文字运用',
            topics: ['语言文字基础', '语言表达与应用', '修辞手法']
          },
          {
            name: '写作',
            topics: ['记叙文写作', '议论文写作', '应用文写作']
          }
        ]
      },
      elective: {
        name: '选择性必修课程',
        units: [
          { name: '整本书阅读与研讨', topics: ['经典作品研读', '阅读方法指导'] },
          { name: '当代文化参与', topics: ['文化现象分析', '文化传承与创新'] },
          { name: '跨媒介阅读与交流', topics: ['多媒体文本解读', '信息整合与表达'] }
        ]
      }
    }
  },

  // 数学学科
  mathematics: {
    name: '数学',
    code: 'mathematics',
    modules: {
      compulsory: {
        name: '必修课程',
        units: [
          {
            name: '集合与常用逻辑用语',
            topics: ['集合的概念与运算', '常用逻辑用语', '充分条件与必要条件']
          },
          {
            name: '函数',
            topics: ['函数的概念与性质', '基本初等函数', '函数的应用']
          },
          {
            name: '几何与代数',
            topics: ['立体几何初步', '平面解析几何初步', '统计与概率']
          },
          {
            name: '三角函数',
            topics: ['三角函数的概念', '三角恒等变换', '解三角形']
          }
        ]
      },
      elective: {
        name: '选择性必修课程',
        units: [
          { name: '函数与导数', topics: ['导数概念', '导数应用', '定积分'] },
          { name: '空间向量与立体几何', topics: ['空间向量', '立体几何证明'] },
          { name: '概率与统计', topics: ['随机变量', '统计推断', '回归分析'] }
        ]
      }
    }
  },

  // 英语学科
  english: {
    name: '英语',
    code: 'english',
    modules: {
      compulsory: {
        name: '必修课程',
        units: [
          {
            name: '语言知识',
            topics: ['词汇知识', '语法知识', '语音知识', '语篇知识']
          },
          {
            name: '语言技能',
            topics: ['听力理解', '阅读理解', '口语表达', '书面表达']
          },
          {
            name: '文化意识',
            topics: ['中外文化对比', '跨文化交际', '文化品格']
          },
          {
            name: '思维品质',
            topics: ['逻辑思维', '批判思维', '创新思维']
          }
        ]
      },
      elective: {
        name: '选择性必修课程',
        units: [
          { name: '人与自然', topics: ['环境保护', '科技发展', '可持续发展'] },
          { name: '人与社会', topics: ['社会问题', '文化传承', '国际理解'] },
          { name: '人与自我', topics: ['个人成长', '职业规划', '价值观念'] }
        ]
      }
    }
  },

  // 物理学科
  physics: {
    name: '物理',
    code: 'physics',
    modules: {
      compulsory: {
        name: '必修课程',
        units: [
          {
            name: '运动与相互作用',
            topics: ['质点运动', '相互作用与运动规律', '抛体运动与圆周运动']
          },
          {
            name: '能量',
            topics: ['功和功率', '动能定理', '机械能守恒定律']
          },
          {
            name: '热学',
            topics: ['分子动理论', '气体定律', '热力学定律']
          }
        ]
      },
      elective: {
        name: '选择性必修课程',
        units: [
          { name: '电磁学', topics: ['电场', '磁场', '电磁感应', '交流电'] },
          { name: '机械振动和波', topics: ['简谐运动', '机械波', '光的波动性'] },
          { name: '原子物理', topics: ['原子结构', '原子核', '核反应'] }
        ]
      }
    }
  },

  // 化学学科
  chemistry: {
    name: '化学',
    code: 'chemistry',
    modules: {
      compulsory: {
        name: '必修课程',
        units: [
          {
            name: '原子结构与化学键',
            topics: ['原子结构', '化学键', '分子结构']
          },
          {
            name: '化学反应原理',
            topics: ['化学反应与能量', '化学反应速率', '化学平衡']
          },
          {
            name: '物质结构与性质',
            topics: ['元素周期律', '化合物性质', '物质分类']
          }
        ]
      },
      elective: {
        name: '选择性必修课程',
        units: [
          { name: '有机化学基础', topics: ['有机物结构', '有机反应', '生物大分子'] },
          { name: '化学反应原理', topics: ['电化学', '溶液中的离子反应'] },
          { name: '物质结构与性质', topics: ['原子结构与性质', '分子结构与性质'] }
        ]
      }
    }
  },

  // 生物学科
  biology: {
    name: '生物学',
    code: 'biology',
    modules: {
      compulsory: {
        name: '必修课程',
        units: [
          {
            name: '分子与细胞',
            topics: ['细胞的分子组成', '细胞的结构和功能', '细胞的生命历程']
          },
          {
            name: '遗传与进化',
            topics: ['遗传的分子基础', '基因的传递规律', '生物的进化']
          },
          {
            name: '稳态与调节',
            topics: ['植物的激素调节', '动物的激素调节', '免疫调节']
          }
        ]
      },
      elective: {
        name: '选择性必修课程',
        units: [
          { name: '生物技术与工程', topics: ['基因工程', '细胞工程', '发酵工程'] },
          { name: '生态与环境', topics: ['种群和群落', '生态系统', '生态环境保护'] },
          { name: '生物科学与社会', topics: ['生物科学发展', '生物技术应用'] }
        ]
      }
    }
  },

  // 历史学科
  history: {
    name: '历史',
    code: 'history',
    modules: {
      compulsory: {
        name: '必修课程',
        units: [
          {
            name: '中外历史纲要',
            topics: ['中国古代史', '中国近现代史', '世界古代中世纪史', '世界近现代史']
          }
        ]
      },
      elective: {
        name: '选择性必修课程',
        units: [
          { name: '国家制度与社会治理', topics: ['政治制度', '法律制度', '社会治理'] },
          { name: '经济与社会生活', topics: ['经济发展', '社会变迁', '生活方式'] },
          { name: '文化交流与传播', topics: ['文化传承', '文明交流', '思想发展'] }
        ]
      }
    }
  },

  // 地理学科
  geography: {
    name: '地理',
    code: 'geography',
    modules: {
      compulsory: {
        name: '必修课程',
        units: [
          {
            name: '自然地理',
            topics: ['地球的宇宙环境', '地球的圈层结构', '大气运动', '水循环', '地貌']
          },
          {
            name: '人文地理',
            topics: ['人口分布', '城市化', '农业地域', '工业地域', '交通运输']
          }
        ]
      },
      elective: {
        name: '选择性必修课程',
        units: [
          { name: '自然地理基础', topics: ['地球运动', '大气环境', '水环境', '地貌环境'] },
          { name: '区域发展', topics: ['区域发展条件', '区域发展过程', '区域可持续发展'] },
          { name: '资源、环境与国家安全', topics: ['资源安全', '环境安全', '国家安全'] }
        ]
      }
    }
  },

  // 思想政治学科
  politics: {
    name: '思想政治',
    code: 'politics',
    modules: {
      compulsory: {
        name: '必修课程',
        units: [
          {
            name: '中国特色社会主义',
            topics: ['科学社会主义', '中国特色社会主义的创立发展', '中国特色社会主义的总任务']
          },
          {
            name: '经济与社会',
            topics: ['我国的经济制度', '经济体制', '经济发展', '社会发展']
          },
          {
            name: '政治与法治',
            topics: ['中国共产党的领导', '人民当家作主', '全面依法治国']
          },
          {
            name: '哲学与文化',
            topics: ['马克思主义哲学', '认识社会与价值选择', '文化传承与文化创新']
          }
        ]
      },
      elective: {
        name: '选择性必修课程',
        units: [
          { name: '当代国际政治与经济', topics: ['各国经济发展', '国际组织', '时代主题'] },
          { name: '法律与生活', topics: ['民事权利与义务', '家庭与婚姻', '就业与创业'] },
          { name: '逻辑与思维', topics: ['逻辑的力量', '形式逻辑要求', '辩证思维方法'] }
        ]
      }
    }
  }
};

// 学科难度等级定义
const DIFFICULTY_LEVELS = {
  BASIC: 1,      // 基础
  INTERMEDIATE: 2, // 中等
  ADVANCED: 3,   // 困难
  EXPERT: 4      // 专家
};

// 知识点类型定义
const KNOWLEDGE_TYPES = {
  CONCEPT: 'concept',     // 概念理解
  SKILL: 'skill',        // 技能应用
  ANALYSIS: 'analysis',   // 分析综合
  EVALUATION: 'evaluation' // 评价创新
};

export {
  CURRICULUM_STANDARDS,
  DIFFICULTY_LEVELS,
  KNOWLEDGE_TYPES
};