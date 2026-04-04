﻿<template>
  <div class="animated-login-page">
    <!-- 背景 -->
    <div class="bg-gradient"></div>
    <div class="floating-bubbles">
      <span v-for="n in 15" :key="n" class="bubble" :style="getBubbleStyle(n)"></span>
    </div>

    <!-- 主容器 -->
    <div class="login-container">
      <!-- 左侧：动画角色区域 -->
      <div class="character-section">
        <div class="character-switcher">
          <el-switch
            v-model="useKawaii"
            active-text="Kawaii"
            inactive-text="原始"
            size="small"
            style="--el-switch-on-color: #ff6b6b"
          />
        </div>

        <div v-if="useKawaii" class="character-switcher">
          <el-radio-group v-model="kawaiiCharacter" size="small" class="kawaii-selector">
            <el-radio-button v-for="char in kawaiiCharacters" :key="char.value" :value="char.value">
              {{ char.label.split(' ')[0] }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <!-- Kawaii 角色 -->
        <transition name="character-fade" mode="out-in">
          <div v-if="useKawaii" :key="kawaiiCharacter" class="kawaii-container">
            <KawaiiCharacter
              :character="kawaiiCharacter"
              :mood="currentKawaiiMood"
              :size="200"
              :color="currentKawaiiColor"
              :show-bubble="showBubble"
              :bubble-text="bubbleText"
            />
          </div>

          <!-- 原始角色 -->
          <div v-else key="original" class="character-wrapper" :class="characterState">
            <!-- 角色 SVG -->
            <svg class="character-svg" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
              <!-- 身体 -->
              <ellipse cx="100" cy="180" rx="60" ry="50" :fill="bodyColor" class="body" />

              <!-- 头部 -->
              <circle cx="100" cy="90" r="65" :fill="headColor" class="head" />

              <!-- 耳朵 -->
              <circle cx="45" cy="55" r="18" :fill="headColor" class="ear ear-left" />
              <circle cx="155" cy="55" r="18" :fill="headColor" class="ear ear-right" />
              <circle
                cx="45"
                cy="55"
                r="10"
                :fill="innerEarColor"
                class="ear-inner ear-inner-left"
              />
              <circle
                cx="155"
                cy="55"
                r="10"
                :fill="innerEarColor"
                class="ear-inner ear-inner-right"
              />

              <!-- 眼睛 -->
              <g class="eyes">
                <!-- 左眼 -->
                <g class="eye eye-left">
                  <ellipse cx="75" cy="85" rx="16" ry="20" fill="white" class="eye-white" />
                  <circle
                    cx="78"
                    cy="88"
                    r="10"
                    fill="#2d3748"
                    class="pupil"
                    :class="{ 'pupil-looking': characterState === 'active' }"
                  />
                  <circle cx="81" cy="84" r="4" fill="white" class="eye-shine" />
                </g>

                <!-- 右眼 -->
                <g class="eye eye-right">
                  <ellipse cx="125" cy="85" rx="16" ry="20" fill="white" class="eye-white" />
                  <circle
                    cx="122"
                    cy="88"
                    r="10"
                    fill="#2d3748"
                    class="pupil"
                    :class="{ 'pupil-looking': characterState === 'active' }"
                  />
                  <circle cx="119" cy="84" r="4" fill="white" class="eye-shine" />
                </g>

                <!-- 害羞时的眼睛（闭眼） -->
                <path
                  v-if="characterState === 'shy'"
                  d="M 60 88 Q 75 78 90 88"
                  stroke="#2d3748"
                  stroke-width="3"
                  fill="none"
                  class="eye-closed eye-closed-left"
                  stroke-linecap="round"
                />
                <path
                  v-if="characterState === 'shy'"
                  d="M 110 88 Q 125 78 140 88"
                  stroke="#2d3748"
                  stroke-width="3"
                  fill="none"
                  class="eye-closed eye-closed-right"
                  stroke-linecap="round"
                />

                <!-- 偷看时的眼睛（斜视） -->
                <g v-if="characterState === 'peek'" class="peek-eyes">
                  <ellipse
                    cx="75"
                    cy="85"
                    rx="14"
                    ry="8"
                    fill="white"
                    transform="rotate(-15 75 85)"
                  />
                  <ellipse
                    cx="125"
                    cy="85"
                    rx="14"
                    ry="8"
                    fill="white"
                    transform="rotate(15 125 85)"
                  />
                </g>
              </g>

              <!-- 腮红 -->
              <ellipse
                cx="55"
                cy="110"
                rx="12"
                ry="8"
                :fill="blushColor"
                class="blush blush-left"
                opacity="0.6"
              />
              <ellipse
                cx="145"
                cy="110"
                rx="12"
                ry="8"
                :fill="blushColor"
                class="blush blush-right"
                opacity="0.6"
              />

              <!-- 鼻子 -->
              <ellipse cx="100" cy="105" rx="8" ry="6" fill="#f6ad55" class="nose" />

              <!-- 嘴巴 -->
              <g class="mouth">
                <!-- 正常微笑 -->
                <path
                  v-if="characterState === 'neutral' || characterState === 'active'"
                  d="M 80 120 Q 100 138 120 120"
                  stroke="#2d3748"
                  stroke-width="3"
                  fill="none"
                  stroke-linecap="round"
                  class="smile"
                />

                <!-- 害羞表情（小嘴） -->
                <ellipse
                  v-if="characterState === 'shy'"
                  cx="100"
                  cy="125"
                  rx="8"
                  ry="5"
                  fill="#f687b3"
                  class="shy-mouth"
                />

                <!-- 开心大笑 -->
                <path
                  v-if="characterState === 'success'"
                  d="M 70 115 Q 100 150 130 115"
                  stroke="#2d3748"
                  stroke-width="3.5"
                  fill="#f687b3"
                  stroke-linecap="round"
                  class="happy-mouth"
                />

                <!-- 偷看表情（惊讶） -->
                <ellipse
                  v-if="characterState === 'peek'"
                  cx="100"
                  cy="125"
                  rx="10"
                  ry="12"
                  fill="#2d3748"
                  class="surprised-mouth"
                />
              </g>

              <!-- 手臂 -->
              <g class="arms">
                <!-- 左手臂 -->
                <path
                  d="M 50 170 Q 30 190 40 210"
                  stroke="#fbd38d"
                  stroke-width="18"
                  fill="none"
                  stroke-linecap="round"
                  class="arm arm-left"
                  :class="{ 'arm-wave': characterState === 'active' }"
                />
                <!-- 右手臂 -->
                <path
                  d="M 150 170 Q 170 190 160 210"
                  stroke="#fbd38d"
                  stroke-width="18"
                  fill="none"
                  stroke-linecap="round"
                  class="arm arm-right"
                  :class="{
                    'arm-cover': characterState === 'shy',
                    'arm-celebrate': characterState === 'success'
                  }"
                />
              </g>

              <!-- 小脚 -->
              <ellipse cx="70" cy="225" rx="20" ry="12" fill="#4a5568" class="foot foot-left" />
              <ellipse cx="130" cy="225" rx="20" ry="12" fill="#4a5568" class="foot foot-right" />
            </svg>

            <!-- 对话气泡 -->
            <transition name="bubble-fade">
              <div v-if="showBubble" class="speech-bubble">
                {{ bubbleText }}
              </div>
            </transition>
          </div>
        </transition>

        <!-- 提示文字 -->
        <p class="character-hint">{{ currentHint }}</p>
      </div>

      <!-- 右侧：表单区域 -->
      <div class="form-section">
        <div class="form-header">
          <h1 class="form-title">{{ interfaceName }}</h1>
          <p class="form-subtitle">请输入信息开始学习之旅</p>
        </div>

        <!-- 错误提示 -->
        <div v-if="loadError" class="error-box">
          <el-result icon="warning" title="数据加载失败" sub-title="请检查网络连接后重试">
            <template #extra>
              <el-button type="primary" @click="loadGradesAndClasses">重新加载</el-button>
            </template>
          </el-result>
        </div>

        <!-- 表单 -->
        <el-form
          v-else
          ref="loginFormRef"
          :model="formData"
          :rules="formRules"
          class="login-form"
          label-position="top"
          size="large"
          @submit.prevent="saveStudentId"
        >
          <el-form-item label="🆔 学号" prop="studentId">
            <el-input
              v-model="formData.studentId"
              placeholder="请输入2位学号"
              :prefix-icon="UserFilled"
              clearable
              maxlength="2"
              inputmode="numeric"
              @focus="setActiveField('studentId')"
              @blur="clearActiveField"
              @input="handleStudentIdInput"
            />
          </el-form-item>

          <el-form-item label="👤 姓名" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入姓名（可选）"
              :prefix-icon="Avatar"
              clearable
              maxlength="4"
              @focus="setActiveField('name')"
              @blur="clearActiveField"
              @input="handleNameInputEvent"
              @compositionstart="isComposing = true"
              @compositionend="handleCompositionEnd"
            >
              <template #suffix>
                <span class="optional-hint">可选</span>
              </template>
            </el-input>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="📚 年级" prop="grade">
                <el-select
                  v-model="formData.grade"
                  placeholder="请选择年级"
                  :prefix-icon="Reading"
                  clearable
                  style="width: 100%"
                  @focus="setActiveField('grade')"
                  @blur="clearActiveField"
                  @change="handleGradeChange"
                >
                  <el-option
                    v-for="grade in grades"
                    :key="grade"
                    :label="`${grade}年级`"
                    :value="grade"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="🏫 班级" prop="class">
                <el-select
                  v-model="formData.class"
                  placeholder="请选择班级"
                  :prefix-icon="School"
                  clearable
                  style="width: 100%"
                  @focus="setActiveField('class')"
                  @blur="clearActiveField"
                  @change="handleClassChange"
                >
                  <el-option v-for="cls in classes" :key="cls" :label="`${cls}班`" :value="cls" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item class="submit-item">
            <el-button
              type="primary"
              native-type="submit"
              :loading="isLoading"
              size="large"
              round
              class="submit-btn"
            >
              {{ isLoading ? '登录中...' : '开始学习 ✨' }}
            </el-button>
          </el-form-item>
        </el-form>

        <p class="footer-text">© 2026 {{ interfaceName }} · 让学习更有趣</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../stores/questionStore'
import { api } from '../../utils/api'
import { ElMessage } from 'element-plus'
import { UserFilled, Avatar, Reading, School } from '@element-plus/icons-vue'
import KawaiiCharacter from './KawaiiCharacter.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const loginFormRef = ref(null)

const interfaceName = computed(() => settingsStore.interfaceName)

// 表单数据（使用 reactive 统一管理）
const formData = reactive({
  studentId: '',
  name: '',
  grade: '',
  class: ''
})

// 表单验证规则
const formRules = reactive({
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{1,2}$/, message: '学号必须为数字', trigger: 'blur' }
  ],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  class: [{ required: true, message: '请选择班级', trigger: 'change' }]
})

const isLoading = ref(false)
const isComposing = ref(false)
const activeField = ref('')
const grades = ref([])
const classes = ref([])
const loadError = ref(false)

// 角色状态管理
const characterState = ref('neutral')
const showBubble = ref(false)
const bubbleText = ref('')
const hintTimeout = ref(null)
const inputTimer = ref(null)

// Kawaii 角色切换
const useKawaii = ref(true)
const kawaiiCharacters = [
  { value: 'astronaut', label: '👨‍🚀 宇航员', color: '#83D0F1' },
  { value: 'cat', label: '🐱 小猫', color: '#FFB347' },
  { value: 'ghost', label: '👻 幽灵', color: '#E8E8E8' },
  { value: 'burger', label: '🍔 汉堡', color: '#F6AD55' },
  { value: 'planet', label: '🪐 行星', color: '#A6E191' }
]

// 随机选择角色（每次刷新不同）
const getRandomCharacter = () => {
  const randomIndex = Math.floor(Math.random() * kawaiiCharacters.length)
  return kawaiiCharacters[randomIndex].value
}
const kawaiiCharacter = ref(getRandomCharacter())
const currentKawaiiColor = computed(() => {
  const found = kawaiiCharacters.find(c => c.value === kawaiiCharacter.value)
  return found?.color || '#A6E191'
})

// 状态映射：原状态 → kawaii mood（每个场景独立情绪）
const kawaiiMoodMap = {
  neutral: 'happy',
  active: 'excited',
  shy: 'shocked',
  peek: 'ko',
  success: 'blissful',
  lovestruck: 'lovestruck'
}
const currentKawaiiMood = computed(() => kawaiiMoodMap[characterState.value] || 'happy')

// 颜色配置
const headColor = '#fbd38d'
const bodyColor = '#f6e05e'
const innerEarColor = '#f687b3'
const blushColor = '#fc8181'

// 当前提示文字
const currentHint = computed(() => {
  switch (characterState.value) {
    case 'neutral':
      return '我在这里等你哦~ 😊'
    case 'active':
      return '哇！你在输入什么呢？👀'
    case 'shy':
      return '哎呀，有点害羞... 😳'
    case 'peek':
      return '嘿嘿，让我看看！🙈'
    case 'success':
      return '太棒了！登录成功！🎉'
    default:
      return ''
  }
})

// 设置活动字段
const setActiveField = field => {
  activeField.value = field

  // 根据字段设置角色状态
  if (field === 'studentId' || field === 'name') {
    characterState.value = 'active'
    showSpeechBubble(['你好呀！', '继续输入~', '加油加油！'])
  } else if (field === 'grade' || field === 'class') {
    characterState.value = 'shy'
    showSpeechBubble(['选择一个吧~', '嗯嗯...', '这个不错！'])
  }
}

// 清除活动字段
const clearActiveField = () => {
  setTimeout(() => {
    const activeElement = document.activeElement
    if (!activeElement?.closest('.el-input') && !activeElement?.closest('.el-select')) {
      activeField.value = ''
      characterState.value = 'neutral'
    }
  }, 100)
}

// 显示对话气泡
const showSpeechBubble = texts => {
  const randomText = texts[Math.floor(Math.random() * texts.length)]
  bubbleText.value = randomText
  showBubble.value = true

  clearTimeout(hintTimeout.value)
  hintTimeout.value = setTimeout(() => {
    showBubble.value = false
  }, 2500)
}

// 生成气泡样式
const getBubbleStyle = _n => {
  const size = Math.random() * 20 + 5
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${Math.random() * 10 + 10}s`
  }
}

// 学号输入变化
const handleStudentIdInput = () => {
  if (isComposing.value) return
  formData.studentId = formData.studentId.replace(/[^0-9]/g, '').slice(0, 2)
  characterState.value = 'active'
  showSpeechBubble(['学号输入中~', '继续加油！'])
  clearTimeout(inputTimer.value)
  inputTimer.value = setTimeout(() => {
    characterState.value = 'neutral'
  }, 1500)
}

// 姓名输入变化（独立情绪：lovestruck）
const handleNameInputEvent = event => {
  if (isComposing.value) return
  processNameInput(event)
  characterState.value = 'lovestruck'
  showSpeechBubble(['名字真好听！', '喜欢你~'])
  clearTimeout(inputTimer.value)
  inputTimer.value = setTimeout(() => {
    characterState.value = 'neutral'
  }, 1500)
}

// 处理姓名输入
const processNameInput = value => {
  const filtered = value.replace(/[^\u4e00-\u9fa5]/g, '').slice(0, 4)
  if (value !== filtered) ElMessage.warning('只能输入中文')
  if (filtered.length > 4) ElMessage.warning('最多4个字符')
  if (formData.name !== filtered) formData.name = filtered
}

// 处理输入法组合结束
const handleCompositionEnd = event => {
  isComposing.value = false
  processNameInput(event.target.value || formData.name)
}

// 年级选择变化（独立情绪：shocked）
const handleGradeChange = () => {
  characterState.value = 'shy'
  showSpeechBubble(['哇！选好年级了', '继续选班级~'])
}

// 班级选择变化（独立情绪：blissful）
const handleClassChange = () => {
  characterState.value = 'success'
  showSpeechBubble(['班级也选好了~', '准备登录吧！'])
}

// 加载年级班级数据
const loadGradesAndClasses = async () => {
  loadError.value = false
  try {
    const [serverGrades, serverClasses] = await Promise.all([
      api.get('/grades'),
      api.get('/classes')
    ])

    grades.value = parseGradeClassData(serverGrades)
    classes.value = parseGradeClassData(serverClasses)
  } catch (error) {
    console.error('加载数据失败:', error)
    loadError.value = true
    ElMessage.error('加载失败，请重试')
  }
}

// 解析年级/班级数据
const parseGradeClassData = data => {
  if (!Array.isArray(data)) return []
  return data
    .map(item => {
      if (typeof item === 'object' && item.name) {
        const num = parseInt(item.name.match(/\d+/)?.[0] || '')
        return isNaN(num) ? parseInt(item.id) || 1 : num
      }
      return typeof item === 'number' ? item : 1
    })
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a - b)
}

// 保存登录信息
const saveStudentId = async () => {
  // 使用 Element Plus 表单验证
  try {
    await loginFormRef.value?.validate()
  } catch (error) {
    characterState.value = 'peek'
    showSpeechBubble(['哎呀...再检查下', '表单不完整哦~'])
    return
  }

  isLoading.value = true
  characterState.value = 'active'
  showSpeechBubble(['正在登录...', '稍等一下~'])

  try {
    const formattedId = formData.studentId.trim().padStart(2, '0')
    const data = await api.post('/users/login', {
      studentId: formattedId,
      name: formData.name.trim(),
      grade: parseInt(formData.grade),
      class: parseInt(formData.class)
    })

    localStorage.setItem('userId', data.userId)
    localStorage.setItem('studentId', formattedId)
    localStorage.setItem('userName', data.name || '')
    localStorage.setItem('userGrade', formData.grade)
    localStorage.setItem('userClass', formData.class)
    localStorage.setItem('token', data.token)
    localStorage.setItem('tokenExpiresAt', Date.now() + 24 * 60 * 60 * 1000)
    sessionStorage.setItem('lastActivity', Date.now())

    characterState.value = 'lovestruck'
    showSpeechBubble(['太开心了！', '你成功啦！🎉'])
    setTimeout(() => {
      characterState.value = 'success'
    }, 800)

    ElMessage.success('登录成功')
    setTimeout(() => router.push('/home'), 1500)
  } catch (error) {
    characterState.value = 'neutral'
    ElMessage.error('登录失败，请检查网络')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await settingsStore.loadSettings()
  await loadGradesAndClasses()

  characterState.value = 'peek'
  showSpeechBubble(['嗨~ 欢迎回来！', '今天也要加油哦！'])
  setTimeout(() => {
    characterState.value = 'neutral'
  }, 2000)

  setInterval(() => {
    if (characterState.value === 'neutral') {
      document.querySelectorAll('.eye-white').forEach(eye => {
        eye.style.transform = 'scaleY(0.1)'
        setTimeout(() => {
          eye.style.transform = 'scaleY(1)'
        }, 150)
      })
    }
  }, 4000)

  // 12秒循环：4种独立情绪轮换（shocked/blissful/excited/ko）
  const idleMoods = [
    { state: 'shy', texts: ['咦？发现新东西！', '这是什么？🤔'] },
    { state: 'success', texts: ['今天天气真好~', '心情美美哒！☀️'] },
    { state: 'active', texts: ['嘿！动起来！', '别发呆啦！💪'] },
    { state: 'peek', texts: ['zzZ...', '困了...想睡觉💤'] }
  ]
  let moodIndex = 0
  setInterval(() => {
    if (characterState.value === 'neutral') {
      const mood = idleMoods[moodIndex % 4]
      characterState.value = mood.state
      showSpeechBubble(mood.texts)
      setTimeout(() => {
        characterState.value = 'neutral'
      }, 2500)
      moodIndex++
    }
  }, 12000)
})
</script>

<style scoped lang="scss">
@use '../../styles/scss/abstracts' as *;

.animated-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  position: relative;
  overflow: hidden;
}

.bg-gradient {
  position: fixed;
  inset: 0;
  background: var(--header-gradient);
  z-index: -2;
}

.floating-bubbles {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;

  .bubble {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float-bubble linear infinite;
  }
}

@keyframes float-bubble {
  0%,
  100% {
    transform: translateY(0) translateX(0);
    opacity: 0.3;
  }
  25% {
    transform: translateY(-30px) translateX(15px);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-15px) translateX(-10px);
    opacity: 0.4;
  }
  75% {
    transform: translateY(-40px) translateX(20px);
    opacity: 0.7;
  }
}

.login-container {
  display: flex;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  max-width: 950px;
  width: 100%;
  overflow: hidden;
  animation: slide-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ====== 左侧角色区域 ====== */
.character-section {
  flex: 1;
  background: linear-gradient(135deg, #fef5e7 0%, #fdebd0 100%);
  padding: $spacing-xl $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border-right: 2px solid rgba(0, 0, 0, 0.05);
}

.character-wrapper {
  position: relative;
  width: 220px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    animation: bounce-character 0.6s ease-in-out;
  }

  &.shy {
    .head {
      transform: translateY(5px) rotate(-5deg);
    }
  }

  &.peek {
    .head {
      transform: translateX(10px) rotate(8deg);
    }
  }

  &.success {
    animation: celebrate 0.8s ease-in-out infinite;
  }
}

@keyframes bounce-character {
  0%,
  100% {
    transform: translateY(0);
  }

  25% {
    transform: translateY(-15px);
  }

  50% {
    transform: translateY(0);
  }

  75% {
    transform: translateY(-8px);
  }
}

@keyframes celebrate {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  25% {
    transform: translateY(-20px) rotate(-5deg);
  }

  50% {
    transform: translateY(0) rotate(5deg);
  }

  75% {
    transform: translateY(-15px) rotate(-3deg);
  }
}

.character-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow($shadow-sm);

  .head,
  .body,
  .ear {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .eye-white {
    transition: transform 0.2s ease;
    transform-origin: center;
  }

  .pupil {
    transition: all 0.3s ease;
    transform-origin: center;

    &.pupil-looking {
      animation: look-around 2s ease-in-out infinite;
    }
  }

  @keyframes look-around {
    0%,
    100% {
      transform: translate(0, 0);
    }

    25% {
      transform: translate(3px, -2px);
    }

    50% {
      transform: translate(-2px, 1px);
    }

    75% {
      transform: translate(2px, 2px);
    }
  }

  .blush {
    transition: opacity 0.3s ease;

    &.blush-left,
    &.blush-right {
      &::after {
        content: '';
      }
    }
  }

  .arm {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: top center;

    &.arm-wave {
      animation: wave-arm 0.5s ease-in-out infinite;
      transform-origin: 50px 170px;
    }

    &.arm-cover {
      transform: rotate(30deg) translateY(-20px);
    }

    &.arm-celebrate {
      animation: celebrate-arm 0.6s ease-in-out infinite;
      transform-origin: 160px 170px;
    }
  }

  @keyframes wave-arm {
    0%,
    100% {
      transform: rotate(0deg);
    }

    50% {
      transform: rotate(-25deg);
    }
  }

  @keyframes celebrate-arm {
    0%,
    100% {
      transform: rotate(0deg);
    }

    50% {
      transform: rotate(-35deg);
    }
  }

  .foot {
    animation: foot-tap 1s ease-in-out infinite;
    transform-origin: center;

    &.foot-right {
      animation-delay: 0.5s;
    }
  }

  @keyframes foot-tap {
    0%,
    100% {
      transform: translateY(0);
    }

    50% {
      transform: translateY(-5px);
    }
  }
}

.speech-bubble {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background-color: $card-background;
  padding: $spacing-md $spacing-lg;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  font-size: 0.95rem;
  font-weight: 600;
  color: $text-primary;
  white-space: nowrap;
  z-index: 10;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid $card-background;
  }
}

.bubble-fade-enter-active,
.bubble-fade-leave-active {
  transition: all 0.3s ease;
}

.bubble-fade-enter-from,
.bubble-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

.character-hint {
  margin-top: $spacing-lg;
  font-size: 1rem;
  color: $text-secondary;
  font-weight: 600;
  text-align: center;
  min-height: 1.5em;
  transition: all 0.3s ease;
}

/* ====== Kawaii 角色切换器 ====== */
.character-switcher {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.75rem;

  .kawaii-selector {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;

    :deep(.el-radio-button__inner) {
      padding: 4px 8px;
      font-size: 0.8rem;
    }
  }

  :deep(.el-switch__label) {
    font-size: 0.8rem;
    font-weight: 600;
  }
}

.kawaii-container {
  width: 220px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.character-fade-enter-active,
.character-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.character-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.character-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}

/* ====== 右侧表单区域 ====== */
.form-section {
  flex: 1.2;
  padding: $spacing-xl $spacing-lg;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: $spacing-lg;
}

.form-title {
  font-family: var(--game-font);
  font-size: 1.75rem;
  font-weight: 700;
  color: $primary-color;
  margin: 0 0 $spacing-sm 0;
  letter-spacing: -0.3px;
}

.form-subtitle {
  color: $text-secondary;
  font-size: 0.95rem;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;

  :deep(.el-form-item) {
    margin-bottom: 1.25rem;

    .el-form-item__label {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.9rem;
      padding-bottom: 0.4rem;
      letter-spacing: 0.01em;
    }
  }

  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: 12px;
      padding: 0.25rem 0.875rem;
      box-shadow: 0 0 0 1.5px var(--border-color) inset;
      background: var(--card-background);
      transition: all 0.25s ease;

      &:hover {
        box-shadow: 0 0 0 1.5px var(--text-light) inset;
        background: white;
      }

      &.is-focus {
        box-shadow:
          0 0 0 1.5px var(--primary-color) inset,
          0 0 0 3px rgba(255, 107, 107, 0.12);
        background: white;
      }
    }

    .el-input__inner {
      font-size: 0.95rem;
      &::placeholder {
        color: var(--text-light);
      }
    }

    .el-input__prefix,
    .el-input__suffix {
      color: var(--text-secondary);
    }
  }

  :deep(.el-select) {
    width: 100%;

    .el-select__wrapper {
      border-radius: 12px;
      padding: 0.25rem 0.875rem;
      box-shadow: 0 0 0 1.5px var(--border-color) inset;
      background: var(--card-background);
      transition: all 0.25s ease;

      &:hover {
        box-shadow: 0 0 0 1.5px var(--text-light) inset;
        background: white;
      }

      &.is-focused {
        box-shadow:
          0 0 0 1.5px var(--primary-color) inset,
          0 0 0 3px rgba(255, 107, 107, 0.12);
        background: white;
      }
    }
  }

  .submit-item {
    margin-top: 0.75rem;
    margin-bottom: 0;
  }

  .submit-btn {
    width: 100%;
    height: 48px;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    background: var(--primary-color);
    border: none;
    border-radius: 14px;
    color: white;
    transition: all 0.3s ease;

    &:hover:not(:disabled):not(.is-loading) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(255, 107, 107, 0.35);
      filter: brightness(1.1);
    }

    &:active:not(:disabled):not(.is-loading) {
      transform: translateY(0);
    }

    &.is-loading {
      opacity: 0.85;
    }
  }
}

.optional-hint {
  color: var(--text-light);
  font-size: 0.8rem;
  font-style: italic;
}

.error-box {
  text-align: center;
  padding: 2rem 1rem;
  background: #fff5f5;
  border-radius: 16px;
  border: 2px solid var(--danger-color);
}

.footer-text {
  margin-top: auto;
  padding-top: 1.5rem;
  text-align: center;
  color: var(--text-light);
  font-size: 0.875rem;
}

/* ====== 响应式设计 ====== */
@media (max-width: 768px) {
  .animated-login-page {
    padding: 1rem;
  }

  .login-container {
    flex-direction: column;
    max-width: 480px;
  }

  .character-section {
    padding: 2rem 1.5rem;
    border-right: none;
    border-bottom: 2px solid rgba(0, 0, 0, 0.05);

    .character-wrapper {
      width: 180px;
      height: 220px;
    }

    .character-hint {
      font-size: 0.9rem;
    }
  }

  .form-section {
    padding: 2rem 1.5rem;
  }

  .form-title {
    font-size: 1.75rem;
  }

  .row-group {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .login-container {
    border-radius: 20px;
  }

  .character-section {
    padding: 1.5rem;
  }

  .form-section {
    padding: 1.5rem;
  }

  .form-title {
    font-size: 1.5rem;
  }

  .submit-btn {
    padding: 0.875rem 1.5rem;
  }
}
</style>
