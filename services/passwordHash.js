/**
 * 密码哈希工具
 * 使用 Node.js 内置 crypto 模块 (PBKDF2)
 */

const crypto = require('crypto');

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';
const SALT_LENGTH = 32;

/**
 * 生成密码哈希
 * @param {string} password - 明文密码
 * @returns {Promise<string>} - 格式: salt:hash
 */
async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
  return `${salt}:${hash}`;
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} storedHash - 存储的哈希 (salt:hash 格式)
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    
    const derivedKey = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, key) => {
        if (err) reject(err);
        else resolve(key.toString('hex'));
      });
    });
    
    // 使用时序安全比较
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derivedKey, 'hex'));
  } catch (error) {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
