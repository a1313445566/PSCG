#!/usr/bin/env node
/**
 * 管理员账户管理工具
 * - 无管理员时：创建新管理员
 * - 有管理员时：重置密码
 *
 * 用法:
 *   node scripts/admin-tool.js
 *   node scripts/admin-tool.js --username admin --password yourpassword
 *   node scripts/admin-tool.js --password newpassword  (重置第一个管理员密码)
 */

require('dotenv').config()
const readline = require('readline')
const db = require('../services/database')
const { hashPassword, verifyPassword } = require('../services/passwordHash')

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const params = {}

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '')
    const value = args[i + 1]
    if (key && value) {
      params[key] = value
    }
  }

  return params
}

// 隐藏输入
async function promptPassword(question) {
  return new Promise(resolve => {
    process.stdout.write(question)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    let password = ''
    process.stdin.on('data', function handler(char) {
      const c = char
      switch (c) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false)
          process.stdin.removeListener('data', handler)
          process.stdout.write('\n')
          resolve(password)
          break
        case '\u0003': // Ctrl+C
          process.exit()
          break
        case '\u007f': // Backspace (ASCII 127)
        case '\b': // Backspace (ASCII 8)
          if (password.length > 0) {
            password = password.slice(0, -1)
            process.stdout.write('\b \b') // 删除一个 * 号
          }
          break
        default:
          // 忽略其他控制字符
          if (c.charCodeAt(0) >= 32) {
            password += c
            process.stdout.write('*')
          }
          break
      }
    })
  })
}

// 交互式输入
async function promptInput(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('')
  console.log('╔══════════════════════════════════════╗')
  console.log('║    PSCG 管理员账户管理工具            ║')
  console.log('╚══════════════════════════════════════╝')
  console.log('')

  const args = parseArgs()
  let { username, password } = args

  try {
    // 连接数据库
    await db.connect()
    console.log('✅ 数据库连接成功\n')

    // 创建表（如果不存在）
    await db.run(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 查询现有管理员
    const admins = await db.all(
      'SELECT id, username, created_at FROM admin_credentials ORDER BY id'
    )

    if (admins.length === 0) {
      // ========== 创建新管理员 ==========
      console.log('📋 当前无管理员账户，将创建新管理员\n')

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      // 用户名
      if (!username) {
        username = await promptInput(rl, '请输入管理员用户名 (默认: admin): ')
        username = username || 'admin'
      }

      // 密码
      if (!password) {
        password = await promptPassword('请输入管理员密码: ')
        while (!password || password.length < 6) {
          console.log('❌ 密码长度不能少于6位！')
          password = await promptPassword('请重新输入密码: ')
        }

        const confirmPassword = await promptPassword('请再次输入密码: ')
        if (password !== confirmPassword) {
          console.log('❌ 两次输入的密码不一致！\n')
          rl.close()
          process.exit(1)
        }
      }

      rl.close()

      // 验证密码长度
      if (password.length < 6) {
        console.log('❌ 密码长度不能少于6位\n')
        process.exit(1)
      }

      // 哈希密码
      console.log('\n🔐 正在加密密码...')
      const passwordHash = await hashPassword(password)

      // 插入管理员
      await db.run('INSERT INTO admin_credentials (username, password_hash) VALUES (?, ?)', [
        username,
        passwordHash
      ])

      console.log('')
      console.log('╔══════════════════════════════════════╗')
      console.log('║       ✅ 管理员创建成功！             ║')
      console.log('╠══════════════════════════════════════╣')
      console.log(`║  用户名: ${username.padEnd(27)}║`)
      console.log(`║  创建时间: ${new Date().toLocaleString('zh-CN').padEnd(24)}║`)
      console.log('╚══════════════════════════════════════╝')
      console.log('')
      console.log('⚠️  请妥善保管您的密码！\n')
    } else {
      // ========== 重置密码 ==========
      console.log('📋 现有管理员账户:')
      admins.forEach((admin, index) => {
        console.log(
          `   ${index + 1}. ${admin.username} (创建于: ${new Date(admin.created_at).toLocaleString('zh-CN')})`
        )
      })
      console.log('')

      // 选择要重置的管理员
      let targetAdmin
      if (admins.length === 1) {
        targetAdmin = admins[0]
        username = targetAdmin.username
        console.log(`📌 自动选择: ${username}\n`)
      } else if (!username) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })

        username = await promptInput(rl, '请输入要重置密码的用户名: ')
        rl.close()

        targetAdmin = admins.find(a => a.username === username)
        if (!targetAdmin) {
          console.log(`❌ 用户名 "${username}" 不存在\n`)
          process.exit(1)
        }
      } else {
        targetAdmin = admins.find(a => a.username === username)
        if (!targetAdmin) {
          console.log(`❌ 用户名 "${username}" 不存在\n`)
          process.exit(1)
        }
      }

      // 密码
      if (!password) {
        password = await promptPassword('请输入新密码: ')
        while (!password || password.length < 6) {
          console.log('❌ 密码长度不能少于6位！')
          password = await promptPassword('请重新输入新密码: ')
        }

        const confirmPassword = await promptPassword('请再次输入新密码: ')
        if (password !== confirmPassword) {
          console.log('❌ 两次输入的密码不一致！\n')
          process.exit(1)
        }
      }

      // 验证密码长度
      if (password.length < 6) {
        console.log('❌ 密码长度不能少于6位\n')
        process.exit(1)
      }

      // 哈希新密码
      console.log('\n🔐 正在加密新密码...')
      const passwordHash = await hashPassword(password)

      // 更新密码
      await db.run('UPDATE admin_credentials SET password_hash = ? WHERE username = ?', [
        passwordHash,
        username
      ])

      console.log('')
      console.log('╔══════════════════════════════════════╗')
      console.log('║       ✅ 密码重置成功！               ║')
      console.log('╠══════════════════════════════════════╣')
      console.log(`║  用户名: ${username.padEnd(27)}║`)
      console.log(`║  重置时间: ${new Date().toLocaleString('zh-CN').padEnd(24)}║`)
      console.log('╚══════════════════════════════════════╝')
      console.log('')
    }

    process.exit(0)
  } catch (error) {
    console.error('\n❌ 操作失败:', error.message)
    process.exit(1)
  }
}

main()
