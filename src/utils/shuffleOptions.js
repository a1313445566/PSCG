/**
 * 打乱选项并生成映射
 * @param {Array} options - 原始选项数组
 * @returns {Object} { shuffledOptions, shuffleMapping, reverseMapping }
 */
export function shuffleOptions(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return {
      shuffledOptions: options,
      shuffleMapping: {},
      reverseMapping: {}
    };
  }

  // 创建索引数组 [0, 1, 2, 3...]
  const indices = options.map((_, index) => index);
  
  // Fisher-Yates 洗牌算法
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // 生成打乱后的选项
  const shuffledOptions = indices.map(i => options[i]);
  
  // 生成映射：原始选项索引 -> 打乱后的位置
  // 例如：{0: 2, 1: 0, 2: 3, 3: 1} 表示原始第0个选项现在在第2个位置
  const shuffleMapping = {};
  indices.forEach((originalIndex, shuffledIndex) => {
    shuffleMapping[originalIndex] = shuffledIndex;
  });
  
  // 生成反向映射：打乱后的位置 -> 原始选项索引
  const reverseMapping = {};
  indices.forEach((originalIndex, shuffledIndex) => {
    reverseMapping[shuffledIndex] = originalIndex;
  });

  return {
    shuffledOptions,
    shuffleMapping,
    reverseMapping
  };
}

/**
 * 将用户答案从打乱后的位置映射回原始位置
 * @param {String|Array} userAnswer - 用户答案（A, B, C, D 或 ['A', 'B']）
 * @param {Object} reverseMapping - 反向映射 {打乱后位置: 原始位置}
 * @returns {String|Array} 映射后的答案
 */
export function mapAnswerToOriginal(userAnswer, reverseMapping) {
  if (!userAnswer) return userAnswer;
  
  // 将字母转换为索引（A->0, B->1, C->2, D->3）
  const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5 };
  const indexToLetter = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  if (Array.isArray(userAnswer)) {
    // 多选题
    return userAnswer.map(letter => {
      const shuffledIndex = letterToIndex[letter];
      const originalIndex = reverseMapping[shuffledIndex];
      return indexToLetter[originalIndex];
    });
  } else {
    // 单选题
    const shuffledIndex = letterToIndex[userAnswer];
    const originalIndex = reverseMapping[shuffledIndex];
    return indexToLetter[originalIndex];
  }
}

/**
 * 将正确答案从原始位置映射到打乱后的位置（用于前端显示）
 * @param {String|Array} correctAnswer - 正确答案
 * @param {Object} shuffleMapping - 映射 {原始位置: 打乱后位置}
 * @returns {String|Array} 映射后的答案
 */
export function mapAnswerToShuffled(correctAnswer, shuffleMapping) {
  if (!correctAnswer) return correctAnswer;
  
  const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5 };
  const indexToLetter = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  if (Array.isArray(correctAnswer)) {
    // 多选题
    return correctAnswer.map(letter => {
      const originalIndex = letterToIndex[letter];
      const shuffledIndex = shuffleMapping[originalIndex];
      return indexToLetter[shuffledIndex];
    });
  } else if (typeof correctAnswer === 'string' && correctAnswer.length > 1) {
    // 多选题，格式为 "ABC"
    const letters = correctAnswer.split('');
    const mappedLetters = letters.map(letter => {
      const originalIndex = letterToIndex[letter];
      const shuffledIndex = shuffleMapping[originalIndex];
      return indexToLetter[shuffledIndex];
    });
    return mappedLetters.join('');
  } else {
    // 单选题
    const originalIndex = letterToIndex[correctAnswer];
    const shuffledIndex = shuffleMapping[originalIndex];
    return indexToLetter[shuffledIndex];
  }
}
