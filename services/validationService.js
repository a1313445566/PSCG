// 验证服务

/**
 * 验证学科ID格式
 * @param {string} subjectId - 学科ID
 * @returns {boolean} - 是否有效
 */
export const validateSubjectId = (subjectId) => {
  return /^\d+$/.test(subjectId);
};

/**
 * 验证年级格式
 * @param {string} grade - 年级
 * @returns {boolean} - 是否有效
 */
export const validateGrade = (grade) => {
  return /^\d+$/.test(grade);
};

/**
 * 验证班级格式
 * @param {string} className - 班级
 * @returns {boolean} - 是否有效
 */
export const validateClass = (className) => {
  return /^\d+$/.test(className);
};
