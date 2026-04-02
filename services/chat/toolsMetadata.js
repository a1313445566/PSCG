/**
 * 工具元数据（供前端使用）
 * 文件: services/chat/toolsMetadata.js
 * 功能: 提供工具分类、参数说明、快捷提问模板
 */

const toolsMetadata = [
  // ============ 学生分析类 ============
  {
    name: 'query_student_stats',
    displayName: '学生学习统计',
    category: 'student',
    icon: 'User',
    description: '查询学生答题次数、正确率、积分',
    requiredParams: [],
    optionalParams: ['studentId', 'studentName', 'subjectId', 'grade', 'startDate', 'endDate'],
    quickQuestions: [
      '查看{studentName}的学习统计数据',
      '{grade}年级{studentName}最近的学习情况如何',
      '查询{studentName}在本学期的答题情况'
    ]
  },
  {
    name: 'query_student_alerts',
    displayName: '学生预警',
    category: 'student',
    icon: 'Warning',
    description: '识别学习异常学生（连续错误、正确率下降、未登录）',
    requiredParams: [],
    optionalParams: ['grade', 'className', 'alertType', 'days', 'threshold'],
    quickQuestions: [
      '查看{grade}年级需要关注的学生',
      '{grade}年级{className}班有哪些学生需要预警',
      '最近{days}天有哪些学生连续错误'
    ]
  },

  // ============ 题库分析类 ============
  {
    name: 'get_subject_list',
    displayName: '题库列表',
    category: 'subject',
    icon: 'Collection',
    description: '获取所有学科（题库）列表及统计数据',
    requiredParams: [],
    optionalParams: [],
    quickQuestions: ['系统中有哪些题库', '查看所有学科的题目数量统计', '各学科有多少学生参与答题']
  },
  {
    name: 'get_subject_detail',
    displayName: '题库详情分析',
    category: 'subject',
    icon: 'DataAnalysis',
    description: '获取特定学科（题库）的详细统计数据',
    requiredParams: ['subjectId'],
    optionalParams: [],
    quickQuestions: [
      '{subjectName}题库的详细分析',
      '查看{subjectName}学科的学生表现',
      '{subjectName}有哪些高频错题'
    ]
  },
  {
    name: 'get_subject_questions',
    displayName: '题库题目列表',
    category: 'subject',
    icon: 'List',
    description: '获取特定学科（题库）下的题目列表',
    requiredParams: ['subjectId'],
    optionalParams: ['page', 'pageSize', 'sortBy', 'order'],
    quickQuestions: [
      '{subjectName}题库有哪些题目',
      '查看{subjectName}学科正确率最低的题目',
      '{subjectName}学科难度最大的题目有哪些'
    ]
  },
  {
    name: 'get_question_answer_analysis',
    displayName: '题目答案分析',
    category: 'question',
    icon: 'PieChart',
    description: '分析特定题目的答案分布和学生选择情况',
    requiredParams: ['questionId'],
    optionalParams: [],
    quickQuestions: [
      '分析题目{questionId}的答题情况',
      '题目{questionId}学生最容易选哪个错误答案',
      '为什么学生{questionId}这道题容易做错'
    ]
  },
  {
    name: 'get_student_answer_detail',
    displayName: '学生答题详情',
    category: 'student',
    icon: 'Document',
    description: '查询学生在特定题目或学科的详细答题记录',
    requiredParams: ['studentId'],
    optionalParams: ['questionId', 'subjectId', 'limit'],
    quickQuestions: [
      '{studentName}在{subjectName}学科的答题详情',
      '{studentName}做题目{questionId}的情况如何',
      '查看{studentName}最近的答题记录'
    ]
  },

  // ============ 班级分析类 ============
  {
    name: 'query_class_analysis',
    displayName: '班级学情分析',
    category: 'class',
    icon: 'School',
    description: '查询班级学生人数、平均正确率、答题总数',
    requiredParams: [],
    optionalParams: ['grade', 'className', 'subjectId'],
    quickQuestions: [
      '查看{grade}年级{className}班的学情分析',
      '对比{grade}年级各班的学习情况',
      '{grade}年级{className}班的整体表现如何'
    ]
  },
  {
    name: 'query_class_full_analysis',
    displayName: '班级深度分析',
    category: 'class',
    icon: 'DataAnalysis',
    description: '班级学习数据深度分析（包含进步退步学生）',
    requiredParams: [],
    optionalParams: ['grade', 'className', 'subjectId', 'startDate', 'endDate'],
    quickQuestions: [
      '深度分析{grade}年级{className}班',
      '{grade}年级{className}班本学期进步和退步的学生',
      '{grade}年级{className}班近期学习趋势'
    ]
  },
  {
    name: 'query_class_comparison',
    displayName: '班级对比分析',
    category: 'class',
    icon: 'TrendCharts',
    description: '对比不同班级的学习情况',
    requiredParams: [],
    optionalParams: ['grades', 'classNames', 'subjectId', 'compareType'],
    quickQuestions: [
      '对比{grade}年级各班的学习表现',
      '{grade}年级1班和2班哪个班学习更好',
      '{grade}年级各班学科掌握情况对比'
    ]
  },

  // ============ 知识点分析类 ============
  {
    name: 'query_weak_points',
    displayName: '薄弱知识点',
    category: 'knowledge',
    icon: 'Aim',
    description: '查询学生或班级的薄弱知识点',
    requiredParams: [],
    optionalParams: ['studentId', 'studentName', 'grade', 'className', 'subjectId', 'limit'],
    quickQuestions: [
      '查看{studentName}的薄弱知识点',
      '{grade}年级{className}班整体薄弱知识点',
      '{studentName}在数学方面的薄弱环节'
    ]
  },
  {
    name: 'query_knowledge_mastery',
    displayName: '知识点掌握度',
    category: 'knowledge',
    icon: 'Histogram',
    description: '查询学生各知识点的掌握程度',
    requiredParams: [],
    optionalParams: ['studentId', 'studentName', 'grade', 'subjectId', 'masteryLevel'],
    quickQuestions: [
      '查看{studentName}的知识点掌握情况',
      '{grade}年级{className}班哪个知识点掌握最差',
      '{studentName}在哪些知识点需要加强'
    ]
  },
  {
    name: 'query_error_analysis',
    displayName: '错题分析',
    category: 'knowledge',
    icon: 'DocumentRemove',
    description: '分析学生或班级的错题情况',
    requiredParams: [],
    optionalParams: [
      'studentId',
      'studentName',
      'grade',
      'className',
      'subjectId',
      'startDate',
      'endDate'
    ],
    quickQuestions: [
      '分析{studentName}的错题',
      '{grade}年级{className}班常见错误类型',
      '{studentName}最近做错的题目有哪些'
    ]
  },

  // ============ 学习轨迹类 ============
  {
    name: 'query_time_trend',
    displayName: '时间趋势分析',
    category: 'progress',
    icon: 'TrendCharts',
    description: '查询学习数据随时间变化趋势',
    requiredParams: [],
    optionalParams: [
      'studentId',
      'studentName',
      'grade',
      'className',
      'startDate',
      'endDate',
      'granularity'
    ],
    quickQuestions: [
      '查看{studentName}的学习趋势',
      '{grade}年级{className}班本学期学习曲线',
      '{studentName}最近一个月的进步情况'
    ]
  },
  {
    name: 'query_learning_path',
    displayName: '学习轨迹追踪',
    category: 'progress',
    icon: 'Compass',
    description: '追踪学生完整学习轨迹（知识点演进、能力变化）',
    requiredParams: [],
    optionalParams: ['studentId', 'studentName', 'grade', 'subjectId', 'startDate', 'endDate'],
    quickQuestions: [
      '追踪{studentName}的学习轨迹',
      '{studentName}在数学学科的学习成长路径',
      '{studentName}最近的学习进步情况'
    ]
  },
  {
    name: 'query_subject_progress',
    displayName: '学科进度分析',
    category: 'progress',
    icon: 'DataLine',
    description: '查询学生在各学科的进步情况',
    requiredParams: [],
    optionalParams: ['studentId', 'studentName', 'grade', 'subjectId', 'startDate', 'endDate'],
    quickQuestions: [
      '查看{studentName}各学科的进步情况',
      '{grade}年级{className}班各学科掌握情况',
      '{studentName}哪个学科进步最快'
    ]
  },

  // ============ 个性化推荐类 ============
  {
    name: 'query_personalized_recommendation',
    displayName: '个性化推荐',
    category: 'recommendation',
    icon: 'MagicStick',
    description: '为学生生成个性化学习建议和题目推荐',
    requiredParams: [],
    optionalParams: [
      'studentId',
      'studentName',
      'grade',
      'subjectId',
      'recommendationType',
      'limit'
    ],
    quickQuestions: [
      '为{studentName}推荐练习题目',
      '{studentName}需要重点复习哪些内容',
      '给{studentName}制定个性化学习计划'
    ]
  },

  // ============ 题目分析类 ============
  {
    name: 'query_question_info',
    displayName: '题目详情',
    category: 'question',
    icon: 'Document',
    description: '查询题目详细信息',
    requiredParams: [],
    optionalParams: ['questionId', 'subjectId', 'difficulty', 'grade'],
    quickQuestions: [
      '查看题目{questionId}的详细信息',
      '{grade}年级难度较高的题目有哪些',
      '查询{subjectId}学科的典型题目'
    ]
  },
  {
    name: 'query_wrong_questions',
    displayName: '错题本查询',
    category: 'question',
    icon: 'Collection',
    description: '查询学生错题本',
    requiredParams: [],
    optionalParams: ['studentId', 'studentName', 'subjectId', 'grade', 'limit'],
    quickQuestions: [
      '查看{studentName}的错题本',
      '{studentName}在数学学科的错题',
      '列出{studentName}需要复习的错题'
    ]
  },

  // ============ 系统概览类 ============
  {
    name: 'query_system_overview',
    displayName: '系统概览',
    category: 'system',
    icon: 'Monitor',
    description: '查询系统整体统计数据',
    requiredParams: [],
    optionalParams: ['startDate', 'endDate'],
    quickQuestions: ['查看系统整体使用情况', '本学期平台使用统计', '最近一周的学生活跃度']
  }
]

// 工具分类
const categories = [
  { id: 'student', name: '学生分析', icon: 'User' },
  { id: 'class', name: '班级分析', icon: 'School' },
  { id: 'knowledge', name: '知识点分析', icon: 'Aim' },
  { id: 'progress', name: '学习轨迹', icon: 'TrendCharts' },
  { id: 'recommendation', name: '个性化推荐', icon: 'MagicStick' },
  { id: 'question', name: '题目查询', icon: 'Document' },
  { id: 'system', name: '系统概览', icon: 'Monitor' }
]

module.exports = {
  toolsMetadata,
  categories
}
