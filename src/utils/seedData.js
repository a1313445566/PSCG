// 初始化测试数据
export const seedTestData = () => {
  // 清空现有数据
  localStorage.removeItem('quiz_data')
  
  // 初始化默认数据
  const defaultData = {
    subjects: [
      { id: 1, name: '语文', subcategories: [
        { id: 11, name: '古诗' },
        { id: 12, name: '多音字' },
        { id: 13, name: '成语' },
        { id: 14, name: '阅读' }
      ]},
      { id: 2, name: '数学', subcategories: [
        { id: 21, name: '加减法' },
        { id: 22, name: '乘除法' },
        { id: 23, name: '几何' },
        { id: 24, name: '应用题' }
      ]},
      { id: 3, name: '英语', subcategories: [
        { id: 31, name: '单词' },
        { id: 32, name: '语法' },
        { id: 33, name: '听力' },
        { id: 34, name: '阅读' }
      ]}
    ],
    questions: []
  }
  
  // 生成题目数据
  const questions = []
  
  // 语文题目
  questions.push(...generateChineseQuestions())
  
  // 数学题目
  questions.push(...generateMathQuestions())
  
  // 英语题目
  questions.push(...generateEnglishQuestions())
  
  // 添加题目到默认数据
  defaultData.questions = questions
  
  // 保存数据到 localStorage
  localStorage.setItem('quiz_data', JSON.stringify(defaultData))
  
  console.log(`成功插入 ${questions.length} 条测试数据`)
}

// 生成语文题目
const generateChineseQuestions = () => {
  const questions = []
  
  // 古诗子分类
  questions.push(
    // 古诗题目1
    {
      id: 1,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '《望庐山瀑布》的作者是谁？',
      options: ['A. 李白', 'B. 杜甫', 'C. 苏轼', 'D. 王维'],
      answer: 'A',
      explanation: '《望庐山瀑布》的作者是唐代诗人李白。'
    },
    // 古诗题目2
    {
      id: 2,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '"春眠不觉晓，处处闻啼鸟"出自哪首诗？',
      options: ['A. 《春晓》', 'B. 《春夜喜雨》', 'C. 《春日》', 'D. 《春望》'],
      answer: 'A',
      explanation: '"春眠不觉晓，处处闻啼鸟"出自唐代诗人孟浩然的《春晓》。'
    },
    // 古诗题目3
    {
      id: 3,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '"床前明月光，疑是地上霜"的下一句是什么？',
      options: ['A. 举头望明月，低头思故乡', 'B. 小时不识月，呼作白玉盘', 'C. 海上生明月，天涯共此时', 'D. 明月松间照，清泉石上流'],
      answer: 'A',
      explanation: '"床前明月光，疑是地上霜"的下一句是"举头望明月，低头思故乡"，出自李白的《静夜思》。'
    },
    // 古诗题目4
    {
      id: 4,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '《绝句》"两个黄鹂鸣翠柳，一行白鹭上青天"的作者是谁？',
      options: ['A. 李白', 'B. 杜甫', 'C. 王维', 'D. 孟浩然'],
      answer: 'B',
      explanation: '《绝句》的作者是唐代诗人杜甫。'
    },
    // 古诗题目5
    {
      id: 5,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '"小荷才露尖尖角，早有蜻蜓立上头"出自哪首诗？',
      options: ['A. 《小池》', 'B. 《池上》', 'C. 《望湖楼醉书》', 'D. 《饮湖上初晴后雨》'],
      answer: 'A',
      explanation: '"小荷才露尖尖角，早有蜻蜓立上头"出自宋代诗人杨万里的《小池》。'
    },
    // 古诗题目6
    {
      id: 6,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '"墙角数枝梅，凌寒独自开"的作者是谁？',
      options: ['A. 王安石', 'B. 苏轼', 'C. 陆游', 'D. 杨万里'],
      answer: 'A',
      explanation: '"墙角数枝梅，凌寒独自开"出自宋代诗人王安石的《梅花》。'
    },
    // 古诗题目7
    {
      id: 7,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '"欲穷千里目，更上一层楼"出自哪首诗？',
      options: ['A. 《登鹳雀楼》', 'B. 《望岳》', 'C. 《黄鹤楼》', 'D. 《滕王阁序》'],
      answer: 'A',
      explanation: '"欲穷千里目，更上一层楼"出自唐代诗人王之涣的《登鹳雀楼》。'
    },
    // 古诗题目8
    {
      id: 8,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '《江雪》"千山鸟飞绝，万径人踪灭"的作者是谁？',
      options: ['A. 柳宗元', 'B. 韩愈', 'C. 刘禹锡', 'D. 白居易'],
      answer: 'A',
      explanation: '《江雪》的作者是唐代诗人柳宗元。'
    },
    // 古诗题目9
    {
      id: 9,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '"碧玉妆成一树高，万条垂下绿丝绦"描写的是什么季节？',
      options: ['A. 春季', 'B. 夏季', 'C. 秋季', 'D. 冬季'],
      answer: 'A',
      explanation: '"碧玉妆成一树高，万条垂下绿丝绦"描写的是春季的景色，出自贺知章的《咏柳》。'
    },
    // 古诗题目10
    {
      id: 10,
      subjectId: 1,
      subcategoryId: 11,
      type: 'single',
      content: '"停车坐爱枫林晚，霜叶红于二月花"出自哪首诗？',
      options: ['A. 《山行》', 'B. 《枫桥夜泊》', 'C. 《秋词》', 'D. 《登高》'],
      answer: 'A',
      explanation: '"停车坐爱枫林晚，霜叶红于二月花"出自唐代诗人杜牧的《山行》。'
    },
    
    // 多音字子分类
    {
      id: 11,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"好"字在"爱好"中读什么音？',
      options: ['A. hǎo', 'B. hào', 'C. háo', 'D. hāo'],
      answer: 'B',
      explanation: '"爱好"中的"好"读hào，表示喜爱的意思。'
    },
    {
      id: 12,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"乐"字在"快乐"中读什么音？',
      options: ['A. lè', 'B. yuè', 'C. yào', 'D. lào'],
      answer: 'A',
      explanation: '"快乐"中的"乐"读lè，表示愉快的意思。'
    },
    {
      id: 13,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"行"字在"银行"中读什么音？',
      options: ['A. xíng', 'B. háng', 'C. héng', 'D. hàng'],
      answer: 'B',
      explanation: '"银行"中的"行"读háng，表示金融机构的意思。'
    },
    {
      id: 14,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"着"字在"着急"中读什么音？',
      options: ['A. zhe', 'B. zhuó', 'C. zháo', 'D. zhāo'],
      answer: 'C',
      explanation: '"着急"中的"着"读zháo，表示急躁的意思。'
    },
    {
      id: 15,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"地"字在"慢慢地"中读什么音？',
      options: ['A. dì', 'B. de', 'C. dí', 'D. dī'],
      answer: 'B',
      explanation: '"慢慢地"中的"地"读de，是结构助词。'
    },
    {
      id: 16,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"和"字在"和诗"中读什么音？',
      options: ['A. hé', 'B. hè', 'C. huó', 'D. huò'],
      answer: 'B',
      explanation: '"和诗"中的"和"读hè，表示应和的意思。'
    },
    {
      id: 17,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"折"字在"折断"中读什么音？',
      options: ['A. zhé', 'B. shé', 'C. zhē', 'D. zhǎ'],
      answer: 'A',
      explanation: '"折断"中的"折"读zhé，表示弄断的意思。'
    },
    {
      id: 18,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"转"字在"转身"中读什么音？',
      options: ['A. zhuǎn', 'B. zhuàn', 'C. zhuǎi', 'D. zhuāi'],
      answer: 'A',
      explanation: '"转身"中的"转"读zhuǎn，表示改变方向的意思。'
    },
    {
      id: 19,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"参"字在"参加"中读什么音？',
      options: ['A. cān', 'B. shēn', 'C. cēn', 'D. sān'],
      answer: 'A',
      explanation: '"参加"中的"参"读cān，表示加入的意思。'
    },
    {
      id: 20,
      subjectId: 1,
      subcategoryId: 12,
      type: 'single',
      content: '"处"字在"处理"中读什么音？',
      options: ['A. chǔ', 'B. chù', 'C. chū', 'D. chū'],
      answer: 'A',
      explanation: '"处理"中的"处"读chǔ，表示办理的意思。'
    },
    
    // 成语子分类
    {
      id: 21,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示做事有始有终？',
      options: ['A. 半途而废', 'B. 有始有终', 'C. 三心二意', 'D. 虎头蛇尾'],
      answer: 'B',
      explanation: '"有始有终"表示做事从开始到结束都很认真，有头有尾。'
    },
    {
      id: 22,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示学习勤奋？',
      options: ['A. 守株待兔', 'B. 亡羊补牢', 'C. 囊萤映雪', 'D. 画蛇添足'],
      answer: 'C',
      explanation: '"囊萤映雪"表示学习勤奋，用萤火虫的光和雪的反光来读书。'
    },
    {
      id: 23,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示说话算数？',
      options: ['A. 言而有信', 'B. 言行不一', 'C. 出尔反尔', 'D. 自食其言'],
      answer: 'A',
      explanation: '"言而有信"表示说话算数，守信用。'
    },
    {
      id: 24,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示团结一致？',
      options: ['A. 四分五裂', 'B. 一盘散沙', 'C. 齐心协力', 'D. 各自为政'],
      answer: 'C',
      explanation: '"齐心协力"表示大家心往一处想，劲往一处使，团结一致。'
    },
    {
      id: 25,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示谦虚好学？',
      options: ['A. 骄傲自满', 'B. 夜郎自大', 'C. 不耻下问', 'D. 目空一切'],
      answer: 'C',
      explanation: '"不耻下问"表示不以向地位比自己低、知识比自己少的人请教为可耻，形容谦虚好学。'
    },
    {
      id: 26,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示做事果断？',
      options: ['A. 犹豫不决', 'B. 优柔寡断', 'C. 当机立断', 'D. 举棋不定'],
      answer: 'C',
      explanation: '"当机立断"表示在紧要时刻立即做出决断。'
    },
    {
      id: 27,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示勤奋努力？',
      options: ['A. 游手好闲', 'B. 好吃懒做', 'C. 废寝忘食', 'D. 无所事事'],
      answer: 'C',
      explanation: '"废寝忘食"表示顾不得睡觉，忘记了吃饭，形容专心努力。'
    },
    {
      id: 28,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示团结协作？',
      options: ['A. 孤军奋战', 'B. 单打独斗', 'C. 众志成城', 'D. 各自为战'],
      answer: 'C',
      explanation: '"众志成城"表示大家团结一致，就能形成强大的力量。'
    },
    {
      id: 29,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示珍惜时间？',
      options: ['A. 虚度光阴', 'B. 蹉跎岁月', 'C. 争分夺秒', 'D. 游手好闲'],
      answer: 'C',
      explanation: '"争分夺秒"表示不放过一分一秒，形容对时间抓得很紧。'
    },
    {
      id: 30,
      subjectId: 1,
      subcategoryId: 13,
      type: 'single',
      content: '下列哪个成语表示知错能改？',
      options: ['A. 执迷不悟', 'B. 死不悔改', 'C. 知错就改', 'D. 一意孤行'],
      answer: 'C',
      explanation: '"知错就改"表示知道自己错了就立即改正。'
    },
    
    // 阅读子分类
    {
      id: 31,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '春天来了，万物复苏。小草从地下探出头来，花儿绽开了笑脸，小鸟在枝头唱歌。小朋友们在公园里放风筝，开心极了。',
      options: ['A. 春天', 'B. 夏天', 'C. 秋天', 'D. 冬天'],
      answer: 'A',
      explanation: '短文描述了春天的景象，如小草发芽、花儿开放、小鸟唱歌等。'
    },
    {
      id: 32,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '小明是个勤奋的孩子。每天早上，他都早早起床，认真完成作业。放学后，他还会帮助妈妈做家务。晚上，他会复习当天的功课。',
      options: ['A. 懒惰', 'B. 勤奋', 'C. 调皮', 'D. 粗心'],
      answer: 'B',
      explanation: '短文描述了小明勤奋学习和帮助家长的事迹。'
    },
    {
      id: 33,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '周末，我们全家去了动物园。我们看到了大象、长颈鹿、猴子、熊猫等动物。熊猫正在吃竹子，猴子在树上跳来跳去，非常可爱。',
      options: ['A. 公园', 'B. 动物园', 'C. 博物馆', 'D. 图书馆'],
      answer: 'B',
      explanation: '短文描述了全家去动物园看动物的经历。'
    },
    {
      id: 34,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '今天是我的生日，妈妈给我买了一个大蛋糕，爸爸送我一辆玩具车。朋友们也来给我庆祝生日，我们一起唱生日歌，吃蛋糕，玩游戏，度过了一个快乐的一天。',
      options: ['A. 生日', 'B. 圣诞节', 'C. 新年', 'D. 国庆节'],
      answer: 'A',
      explanation: '短文描述了过生日的情景，包括吃蛋糕、收礼物等。'
    },
    {
      id: 35,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '秋天到了，树叶变黄了，一片片从树上落下来。果园里，苹果红了，梨黄了，葡萄紫了，到处都是丰收的景象。',
      options: ['A. 春季', 'B. 夏季', 'C. 秋季', 'D. 冬季'],
      answer: 'C',
      explanation: '短文描述了秋天的景象，如树叶变黄、果实成熟等。'
    },
    {
      id: 36,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '我们的学校非常美丽。校园里有高大的教学楼，宽阔的操场，还有一个漂亮的花园。花园里种满了各种各样的花，有玫瑰、牡丹、菊花等。',
      options: ['A. 公园', 'B. 学校', 'C. 医院', 'D. 商场'],
      answer: 'B',
      explanation: '短文描述了学校的环境，包括教学楼、操场和花园等。'
    },
    {
      id: 37,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '夏天的天气非常炎热。人们穿着轻薄的衣服，吃着冰淇淋，还会去游泳。晚上，大家会在树下乘凉，聊天，非常惬意。',
      options: ['A. 春季', 'B. 夏季', 'C. 秋季', 'D. 冬季'],
      answer: 'B',
      explanation: '短文描述了夏天的炎热天气和人们的活动。'
    },
    {
      id: 38,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '我的好朋友是小红。她有一双明亮的眼睛，一张可爱的笑脸。她很善良，经常帮助别人。我们一起上学，一起做作业，一起玩游戏。',
      options: ['A. 小红', 'B. 小明', 'C. 小花', 'D. 小刚'],
      answer: 'A',
      explanation: '短文介绍了好朋友小红的外貌和性格。'
    },
    {
      id: 39,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '冬天来了，天气变冷了。天空中下起了雪，大地穿上了白色的衣服。小朋友们在雪地里堆雪人，打雪仗，玩得非常开心。',
      options: ['A. 春季', 'B. 夏季', 'C. 秋季', 'D. 冬季'],
      answer: 'D',
      explanation: '短文描述了冬天的雪景和小朋友们的活动。'
    },
    {
      id: 40,
      subjectId: 1,
      subcategoryId: 14,
      type: 'reading',
      content: '今天是周末，我和爸爸妈妈一起去了超市。我们买了水果、蔬菜、牛奶和面包等东西。妈妈还买了我喜欢的巧克力，我非常开心。',
      options: ['A. 公园', 'B. 超市', 'C. 医院', 'D. 学校'],
      answer: 'B',
      explanation: '短文描述了和爸爸妈妈一起去超市购物的经历。'
    }
  )
  
  return questions
}

// 生成数学题目
const generateMathQuestions = () => {
  const questions = []
  
  // 加减法子分类
  questions.push(
    {
      id: 41,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '35 + 47 = ?',
      options: ['A. 82', 'B. 72', 'C. 92', 'D. 62'],
      answer: 'A',
      explanation: '35 + 47 = 82'
    },
    {
      id: 42,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '100 - 36 = ?',
      options: ['A. 64', 'B. 54', 'C. 74', 'D. 44'],
      answer: 'A',
      explanation: '100 - 36 = 64'
    },
    {
      id: 43,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '28 + 59 = ?',
      options: ['A. 87', 'B. 77', 'C. 97', 'D. 67'],
      answer: 'A',
      explanation: '28 + 59 = 87'
    },
    {
      id: 44,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '85 - 49 = ?',
      options: ['A. 36', 'B. 46', 'C. 26', 'D. 56'],
      answer: 'A',
      explanation: '85 - 49 = 36'
    },
    {
      id: 45,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '43 + 58 = ?',
      options: ['A. 101', 'B. 91', 'C. 111', 'D. 81'],
      answer: 'A',
      explanation: '43 + 58 = 101'
    },
    {
      id: 46,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '120 - 78 = ?',
      options: ['A. 42', 'B. 32', 'C. 52', 'D. 62'],
      answer: 'A',
      explanation: '120 - 78 = 42'
    },
    {
      id: 47,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '67 + 35 = ?',
      options: ['A. 102', 'B. 92', 'C. 112', 'D. 82'],
      answer: 'A',
      explanation: '67 + 35 = 102'
    },
    {
      id: 48,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '92 - 56 = ?',
      options: ['A. 36', 'B. 46', 'C. 26', 'D. 56'],
      answer: 'A',
      explanation: '92 - 56 = 36'
    },
    {
      id: 49,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '54 + 68 = ?',
      options: ['A. 122', 'B. 112', 'C. 132', 'D. 102'],
      answer: 'A',
      explanation: '54 + 68 = 122'
    },
    {
      id: 50,
      subjectId: 2,
      subcategoryId: 21,
      type: 'single',
      content: '150 - 89 = ?',
      options: ['A. 61', 'B. 51', 'C. 71', 'D. 41'],
      answer: 'A',
      explanation: '150 - 89 = 61'
    },
    
    // 乘除法子分类
    {
      id: 51,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '8 × 9 = ?',
      options: ['A. 72', 'B. 63', 'C. 81', 'D. 54'],
      answer: 'A',
      explanation: '8 × 9 = 72'
    },
    {
      id: 52,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '72 ÷ 8 = ?',
      options: ['A. 9', 'B. 8', 'C. 7', 'D. 10'],
      answer: 'A',
      explanation: '72 ÷ 8 = 9'
    },
    {
      id: 53,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '6 × 7 = ?',
      options: ['A. 42', 'B. 36', 'C. 49', 'D. 56'],
      answer: 'A',
      explanation: '6 × 7 = 42'
    },
    {
      id: 54,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '48 ÷ 6 = ?',
      options: ['A. 8', 'B. 7', 'C. 9', 'D. 6'],
      answer: 'A',
      explanation: '48 ÷ 6 = 8'
    },
    {
      id: 55,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '9 × 7 = ?',
      options: ['A. 63', 'B. 54', 'C. 72', 'D. 45'],
      answer: 'A',
      explanation: '9 × 7 = 63'
    },
    {
      id: 56,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '56 ÷ 7 = ?',
      options: ['A. 8', 'B. 7', 'C. 9', 'D. 6'],
      answer: 'A',
      explanation: '56 ÷ 7 = 8'
    },
    {
      id: 57,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '5 × 8 = ?',
      options: ['A. 40', 'B. 45', 'C. 35', 'D. 50'],
      answer: 'A',
      explanation: '5 × 8 = 40'
    },
    {
      id: 58,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '36 ÷ 4 = ?',
      options: ['A. 9', 'B. 8', 'C. 7', 'D. 10'],
      answer: 'A',
      explanation: '36 ÷ 4 = 9'
    },
    {
      id: 59,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '7 × 8 = ?',
      options: ['A. 56', 'B. 49', 'C. 63', 'D. 42'],
      answer: 'A',
      explanation: '7 × 8 = 56'
    },
    {
      id: 60,
      subjectId: 2,
      subcategoryId: 22,
      type: 'single',
      content: '63 ÷ 9 = ?',
      options: ['A. 7', 'B. 8', 'C. 6', 'D. 9'],
      answer: 'A',
      explanation: '63 ÷ 9 = 7'
    },
    
    // 几何子分类
    {
      id: 61,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '一个正方形的边长是5厘米，它的周长是多少？',
      options: ['A. 20厘米', 'B. 25厘米', 'C. 15厘米', 'D. 10厘米'],
      answer: 'A',
      explanation: '正方形的周长 = 边长 × 4 = 5 × 4 = 20厘米'
    },
    {
      id: 62,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '一个长方形的长是8厘米，宽是3厘米，它的面积是多少？',
      options: ['A. 24平方厘米', 'B. 22平方厘米', 'C. 11平方厘米', 'D. 16平方厘米'],
      answer: 'A',
      explanation: '长方形的面积 = 长 × 宽 = 8 × 3 = 24平方厘米'
    },
    {
      id: 63,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '一个三角形的内角和是多少度？',
      options: ['A. 180度', 'B. 90度', 'C. 270度', 'D. 360度'],
      answer: 'A',
      explanation: '三角形的内角和是180度'
    },
    {
      id: 64,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '一个圆的直径是6厘米，它的半径是多少？',
      options: ['A. 3厘米', 'B. 6厘米', 'C. 12厘米', 'D. 2厘米'],
      answer: 'A',
      explanation: '圆的半径 = 直径 ÷ 2 = 6 ÷ 2 = 3厘米'
    },
    {
      id: 65,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '一个正方形的面积是36平方厘米，它的边长是多少？',
      options: ['A. 6厘米', 'B. 9厘米', 'C. 12厘米', 'D. 4厘米'],
      answer: 'A',
      explanation: '正方形的面积 = 边长 × 边长，所以边长 = √36 = 6厘米'
    },
    {
      id: 66,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '一个长方形的周长是24厘米，长是8厘米，宽是多少？',
      options: ['A. 4厘米', 'B. 6厘米', 'C. 3厘米', 'D. 5厘米'],
      answer: 'A',
      explanation: '长方形的周长 = (长 + 宽) × 2，所以宽 = (24 ÷ 2) - 8 = 4厘米'
    },
    {
      id: 67,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '下列哪个是四边形？',
      options: ['A. 正方形', 'B. 三角形', 'C. 圆形', 'D. 五边形'],
      answer: 'A',
      explanation: '正方形有4条边，是四边形'
    },
    {
      id: 68,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '一个长方体有多少个面？',
      options: ['A. 6个', 'B. 4个', 'C. 8个', 'D. 12个'],
      answer: 'A',
      explanation: '长方体有6个面'
    },
    {
      id: 69,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '一个正方体有多少条棱？',
      options: ['A. 12条', 'B. 8条', 'C. 6条', 'D. 10条'],
      answer: 'A',
      explanation: '正方体有12条棱'
    },
    {
      id: 70,
      subjectId: 2,
      subcategoryId: 23,
      type: 'single',
      content: '下列哪个图形是对称的？',
      options: ['A. 正方形', 'B. 不规则四边形', 'C. 任意三角形', 'D. 梯形'],
      answer: 'A',
      explanation: '正方形是对称图形，有4条对称轴'
    },
    
    // 应用题子分类
    {
      id: 71,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '小明有25元，买了一本12元的书，他还剩多少钱？',
      options: ['A. 13元', 'B. 12元', 'C. 14元', 'D. 11元'],
      answer: 'A',
      explanation: '25 - 12 = 13元'
    },
    {
      id: 72,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '班级里有36个学生，每6人一组，可以分成几组？',
      options: ['A. 6组', 'B. 5组', 'C. 7组', 'D. 4组'],
      answer: 'A',
      explanation: '36 ÷ 6 = 6组'
    },
    {
      id: 73,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '一盒铅笔有12支，3盒铅笔一共有多少支？',
      options: ['A. 36支', 'B. 30支', 'C. 42支', 'D. 24支'],
      answer: 'A',
      explanation: '12 × 3 = 36支'
    },
    {
      id: 74,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '妈妈买了4千克苹果，每千克8元，一共花了多少钱？',
      options: ['A. 32元', 'B. 28元', 'C. 36元', 'D. 24元'],
      answer: 'A',
      explanation: '4 × 8 = 32元'
    },
    {
      id: 75,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '学校买了5箱粉笔，每箱24盒，一共有多少盒粉笔？',
      options: ['A. 120盒', 'B. 100盒', 'C. 140盒', 'D. 96盒'],
      answer: 'A',
      explanation: '5 × 24 = 120盒'
    },
    {
      id: 76,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '小明每天看15页书，一个星期（7天）能看多少页？',
      options: ['A. 105页', 'B. 95页', 'C. 115页', 'D. 85页'],
      answer: 'A',
      explanation: '15 × 7 = 105页'
    },
    {
      id: 77,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '一辆公交车上有28人，到站后下去9人，又上来12人，现在车上有多少人？',
      options: ['A. 31人', 'B. 29人', 'C. 33人', 'D. 27人'],
      answer: 'A',
      explanation: '28 - 9 + 12 = 31人'
    },
    {
      id: 78,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '一个篮球28元，一个足球35元，买一个篮球和一个足球一共需要多少钱？',
      options: ['A. 63元', 'B. 53元', 'C. 73元', 'D. 43元'],
      answer: 'A',
      explanation: '28 + 35 = 63元'
    },
    {
      id: 79,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '小明每分钟走60米，从家到学校需要15分钟，小明家到学校有多远？',
      options: ['A. 900米', 'B. 800米', 'C. 1000米', 'D. 700米'],
      answer: 'A',
      explanation: '60 × 15 = 900米'
    },
    {
      id: 80,
      subjectId: 2,
      subcategoryId: 24,
      type: 'single',
      content: '果园里有4行苹果树，每行8棵，一共有多少棵苹果树？',
      options: ['A. 32棵', 'B. 28棵', 'C. 36棵', 'D. 24棵'],
      answer: 'A',
      explanation: '4 × 8 = 32棵'
    }
  )
  
  return questions
}

// 生成英语题目
const generateEnglishQuestions = () => {
  const questions = []
  
  // 单词子分类
  questions.push(
    {
      id: 81,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "猫"?',
      options: ['A. Cat', 'B. Dog', 'C. Bird', 'D. Fish'],
      answer: 'A',
      explanation: '"猫"的英语单词是"Cat"'
    },
    {
      id: 82,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "狗"?',
      options: ['A. Cat', 'B. Dog', 'C. Bird', 'D. Fish'],
      answer: 'B',
      explanation: '"狗"的英语单词是"Dog"'
    },
    {
      id: 83,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "书"?',
      options: ['A. Pen', 'B. Book', 'C. Pencil', 'D. Paper'],
      answer: 'B',
      explanation: '"书"的英语单词是"Book"'
    },
    {
      id: 84,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "钢笔"?',
      options: ['A. Pen', 'B. Book', 'C. Pencil', 'D. Paper'],
      answer: 'A',
      explanation: '"钢笔"的英语单词是"Pen"'
    },
    {
      id: 85,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "苹果"?',
      options: ['A. Apple', 'B. Banana', 'C. Orange', 'D. Grape'],
      answer: 'A',
      explanation: '"苹果"的英语单词是"Apple"'
    },
    {
      id: 86,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "香蕉"?',
      options: ['A. Apple', 'B. Banana', 'C. Orange', 'D. Grape'],
      answer: 'B',
      explanation: '"香蕉"的英语单词是"Banana"'
    },
    {
      id: 87,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "红色"?',
      options: ['A. Red', 'B. Blue', 'C. Green', 'D. Yellow'],
      answer: 'A',
      explanation: '"红色"的英语单词是"Red"'
    },
    {
      id: 88,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "蓝色"?',
      options: ['A. Red', 'B. Blue', 'C. Green', 'D. Yellow'],
      answer: 'B',
      explanation: '"蓝色"的英语单词是"Blue"'
    },
    {
      id: 89,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "学校"?',
      options: ['A. School', 'B. Home', 'C. Park', 'D. Hospital'],
      answer: 'A',
      explanation: '"学校"的英语单词是"School"'
    },
    {
      id: 90,
      subjectId: 3,
      subcategoryId: 31,
      type: 'single',
      content: 'What is the English word for "家"?',
      options: ['A. School', 'B. Home', 'C. Park', 'D. Hospital'],
      answer: 'B',
      explanation: '"家"的英语单词是"Home"'
    },
    
    // 语法子分类
    {
      id: 91,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: 'I ____ a student.',
      options: ['A. am', 'B. is', 'C. are', 'D. be'],
      answer: 'A',
      explanation: '第一人称单数用am'
    },
    {
      id: 92,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: 'You ____ a teacher.',
      options: ['A. am', 'B. is', 'C. are', 'D. be'],
      answer: 'C',
      explanation: '第二人称用are'
    },
    {
      id: 93,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: 'He ____ my brother.',
      options: ['A. am', 'B. is', 'C. are', 'D. be'],
      answer: 'B',
      explanation: '第三人称单数用is'
    },
    {
      id: 94,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: 'They ____ my friends.',
      options: ['A. am', 'B. is', 'C. are', 'D. be'],
      answer: 'C',
      explanation: '第三人称复数用are'
    },
    {
      id: 95,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: 'I ____ English every day.',
      options: ['A. study', 'B. studies', 'C. studying', 'D. studied'],
      answer: 'A',
      explanation: '第一人称单数一般现在时用动词原形'
    },
    {
      id: 96,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: 'He ____ football every afternoon.',
      options: ['A. play', 'B. plays', 'C. playing', 'D. played'],
      answer: 'B',
      explanation: '第三人称单数一般现在时动词加s'
    },
    {
      id: 97,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: 'I ____ to the park yesterday.',
      options: ['A. go', 'B. goes', 'C. went', 'D. going'],
      answer: 'C',
      explanation: 'yesterday表示过去时，用went'
    },
    {
      id: 98,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: 'She ____ a book now.',
      options: ['A. read', 'B. reads', 'C. reading', 'D. is reading'],
      answer: 'D',
      explanation: 'now表示现在进行时，用is reading'
    },
    {
      id: 99,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: '____ you like apples?',
      options: ['A. Do', 'B. Does', 'C. Did', 'D. Doing'],
      answer: 'A',
      explanation: '第二人称一般疑问句用Do'
    },
    {
      id: 100,
      subjectId: 3,
      subcategoryId: 32,
      type: 'single',
      content: '____ he like football?',
      options: ['A. Do', 'B. Does', 'C. Did', 'D. Doing'],
      answer: 'B',
      explanation: '第三人称单数一般疑问句用Does'
    },
    
    // 听力子分类
    {
      id: 101,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。What animal is it?',
      options: ['A. Cat', 'B. Dog', 'C. Bird', 'D. Fish'],
      answer: 'A',
      explanation: '录音内容是关于猫的描述'
    },
    {
      id: 102,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。What color is it?',
      options: ['A. Red', 'B. Blue', 'C. Green', 'D. Yellow'],
      answer: 'B',
      explanation: '录音内容是关于蓝色的描述'
    },
    {
      id: 103,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。How old is he?',
      options: ['A. 8', 'B. 9', 'C. 10', 'D. 11'],
      answer: 'C',
      explanation: '录音内容是关于10岁的描述'
    },
    {
      id: 104,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。What is his name?',
      options: ['A. Tom', 'B. Jack', 'C. Jim', 'D. John'],
      answer: 'A',
      explanation: '录音内容是关于Tom的描述'
    },
    {
      id: 105,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。Where is the book?',
      options: ['A. On the desk', 'B. Under the chair', 'C. In the bag', 'D. On the bed'],
      answer: 'A',
      explanation: '录音内容是关于书在桌子上的描述'
    },
    {
      id: 106,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。What time is it?',
      options: ['A. 7:00', 'B. 8:00', 'C. 9:00', 'D. 10:00'],
      answer: 'B',
      explanation: '录音内容是关于8点的描述'
    },
    {
      id: 107,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。What day is today?',
      options: ['A. Monday', 'B. Tuesday', 'C. Wednesday', 'D. Thursday'],
      answer: 'C',
      explanation: '录音内容是关于星期三的描述'
    },
    {
      id: 108,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。What is she doing?',
      options: ['A. Reading', 'B. Writing', 'C. Singing', 'D. Dancing'],
      answer: 'A',
      explanation: '录音内容是关于读书的描述'
    },
    {
      id: 109,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。What does he like?',
      options: ['A. Apples', 'B. Bananas', 'C. Oranges', 'D. Grapes'],
      answer: 'B',
      explanation: '录音内容是关于喜欢香蕉的描述'
    },
    {
      id: 110,
      subjectId: 3,
      subcategoryId: 33,
      type: 'listening',
      content: '听录音，选择正确的答案。How many books are there?',
      options: ['A. 3', 'B. 4', 'C. 5', 'D. 6'],
      answer: 'C',
      explanation: '录音内容是关于5本书的描述'
    },
    
    // 阅读子分类
    {
      id: 111,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'Hello, my name is Tom. I am a student. I like reading books and playing football. I have a cat. Its name is Mimi.',
      options: ['A. Tom', 'B. Jim', 'C. Jack', 'D. John'],
      answer: 'A',
      explanation: '短文中提到"Hello, my name is Tom."'
    },
    {
      id: 112,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'Today is Sunday. I go to the park with my family. We play games and have a picnic. We are very happy.',
      options: ['A. Monday', 'B. Tuesday', 'C. Sunday', 'D. Saturday'],
      answer: 'C',
      explanation: '短文中提到"Today is Sunday."'
    },
    {
      id: 113,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'I have a bag. It is blue. There are three books, a pen and a pencil in it.',
      options: ['A. Red', 'B. Blue', 'C. Green', 'D. Yellow'],
      answer: 'B',
      explanation: '短文中提到"It is blue."'
    },
    {
      id: 114,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'My mother is a teacher. She teaches English. She is very nice. I love her.',
      options: ['A. Teacher', 'B. Doctor', 'C. Nurse', 'D. Driver'],
      answer: 'A',
      explanation: '短文中提到"My mother is a teacher."'
    },
    {
      id: 115,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'There are four people in my family. They are my father, my mother, my sister and me. We are a happy family.',
      options: ['A. 3', 'B. 4', 'C. 5', 'D. 6'],
      answer: 'B',
      explanation: '短文中提到"There are four people in my family."'
    },
    {
      id: 116,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'I get up at 7:00 every morning. I wash my face and brush my teeth. Then I have breakfast.',
      options: ['A. 6:00', 'B. 7:00', 'C. 8:00', 'D. 9:00'],
      answer: 'B',
      explanation: '短文中提到"I get up at 7:00 every morning."'
    },
    {
      id: 117,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'My favorite color is red. I have a red shirt and a red hat. I like them very much.',
      options: ['A. Red', 'B. Blue', 'C. Green', 'D. Yellow'],
      answer: 'A',
      explanation: '短文中提到"My favorite color is red."'
    },
    {
      id: 118,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'It is summer now. The weather is hot. I like swimming in the river.',
      options: ['A. Spring', 'B. Summer', 'C. Autumn', 'D. Winter'],
      answer: 'B',
      explanation: '短文中提到"It is summer now."'
    },
    {
      id: 119,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'I have a pet dog. Its name is Lucky. It is white. It likes to play with me.',
      options: ['A. Cat', 'B. Dog', 'C. Bird', 'D. Fish'],
      answer: 'B',
      explanation: '短文中提到"I have a pet dog."'
    },
    {
      id: 120,
      subjectId: 3,
      subcategoryId: 34,
      type: 'reading',
      content: 'I go to school by bus every day. It takes me 10 minutes to get to school.',
      options: ['A. By bus', 'B. By car', 'C. By bike', 'D. On foot'],
      answer: 'A',
      explanation: '短文中提到"I go to school by bus every day."'
    }
  )
  
  return questions
}
