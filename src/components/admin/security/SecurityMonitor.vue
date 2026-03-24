<template>
  <div class="security-monitor">
    <!-- 刷新按钮 -->
    <div class="header-actions">
      <el-button type="primary" @click="refreshAll" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
      <el-button type="warning" @click="unblockAll" :loading="unblocking">
        <el-icon><Unlock /></el-icon>
        解除所有封禁
      </el-button>
      <span class="last-update" v-if="lastUpdate">
        上次更新: {{ lastUpdate }}
      </span>
    </div>

    <!-- 限流状态 -->
    <el-card class="security-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Warning /></el-icon>
            限流状态监控
          </span>
          <el-tag :type="rateLimitStatus.blockedIPs > 0 ? 'danger' : 'success'">
            {{ rateLimitStatus.blockedIPs > 0 ? `${rateLimitStatus.blockedIPs} 个IP被封禁` : '正常' }}
          </el-tag>
        </div>
      </template>
      
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ rateLimitStatus.global?.activeIPs || 0 }}</div>
          <div class="stat-label">全局活跃IP</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ rateLimitStatus.api?.activeIPs || 0 }}</div>
          <div class="stat-label">API活跃IP</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ rateLimitStatus.submit?.activeIPs || 0 }}</div>
          <div class="stat-label">提交活跃IP</div>
        </div>
        <div class="stat-item danger">
          <div class="stat-value">{{ rateLimitStatus.blockedIPs || 0 }}</div>
          <div class="stat-label">被封禁IP</div>
        </div>
      </div>

      <!-- 被封禁IP列表 -->
      <div class="blocked-list" v-if="rateLimitStatus.blockedList && rateLimitStatus.blockedList.length > 0">
        <h4>被封禁IP列表</h4>
        <el-table :data="rateLimitStatus.blockedList" stripe style="width: 100%">
          <el-table-column prop="ip" label="IP地址" width="180" />
          <el-table-column prop="reason" label="原因" width="150">
            <template #default="{ row }">
              <el-tag :type="row.reason === 'manual_block' ? 'warning' : 'danger'" size="small">
                {{ row.reason === 'manual_block' ? '手动封禁' : '频率超限' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remainingTime" label="剩余时间">
            <template #default="{ row }">
              {{ formatTime(row.remainingTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="success" size="small" @click="unblockIP(row.ip)">
                解封
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="暂无被封禁IP" :image-size="80" />
    </el-card>

    <!-- 签名缓存状态 -->
    <el-card class="security-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Key /></el-icon>
            签名缓存状态
          </span>
          <el-tag type="info">
            防重放保护
          </el-tag>
        </div>
      </template>
      
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ signatureCacheStatus.usedSignatures || 0 }}</div>
          <div class="stat-label">已使用签名</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ signatureCacheStatus.maxSize || 0 }}</div>
          <div class="stat-label">最大缓存数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ formatTime(signatureCacheStatus.maxAge) }}</div>
          <div class="stat-label">有效期</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            {{ ((signatureCacheStatus.usedSignatures / signatureCacheStatus.maxSize) * 100).toFixed(1) }}%
          </div>
          <div class="stat-label">缓存使用率</div>
        </div>
      </div>

      <div class="cache-progress">
        <el-progress 
          :percentage="(signatureCacheStatus.usedSignatures / signatureCacheStatus.maxSize) * 100" 
          :color="getProgressColor((signatureCacheStatus.usedSignatures / signatureCacheStatus.maxSize) * 100)"
        />
      </div>
    </el-card>

    <!-- 手动封禁IP -->
    <el-card class="security-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Lock /></el-icon>
            手动封禁IP
          </span>
        </div>
      </template>
      
      <el-form :model="blockForm" label-width="100px" class="block-form">
        <el-form-item label="IP地址">
          <el-input v-model="blockForm.ip" placeholder="输入要封禁的IP地址" />
        </el-form-item>
        <el-form-item label="封禁时长">
          <el-select v-model="blockForm.duration" placeholder="选择封禁时长">
            <el-option label="10分钟" :value="600000" />
            <el-option label="30分钟" :value="1800000" />
            <el-option label="1小时" :value="3600000" />
            <el-option label="6小时" :value="21600000" />
            <el-option label="24小时" :value="86400000" />
            <el-option label="永久（需手动解封）" :value="31536000000" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="danger" @click="blockIP" :loading="blocking">
            封禁IP
          </el-button>
          <el-button type="success" @click="quickUnblock">
            快速解封
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 防护规则说明 -->
    <el-card class="security-card info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><InfoFilled /></el-icon>
            防护规则说明
          </span>
        </div>
      </template>
      
      <el-descriptions :column="1" border>
        <el-descriptions-item label="全局API限流">
          每分钟最多 200 次请求，超限封禁 1 分钟
        </el-descriptions-item>
        <el-descriptions-item label="提交接口限流">
          每分钟最多 10 次提交，超限封禁 5 分钟
        </el-descriptions-item>
        <el-descriptions-item label="签名防重放">
          同一签名 5 分钟内只能使用一次
        </el-descriptions-item>
        <el-descriptions-item label="白名单IP">
          127.0.0.1, ::1 不受限流影响
        </el-descriptions-item>
        <el-descriptions-item label="对正常用户影响">
          <el-tag type="success" size="small">无影响</el-tag>
          <span style="margin-left: 8px; color: #67c23a;">正常做题速度下完全不受限制</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Warning, Key, Lock, Unlock, InfoFilled } from '@element-plus/icons-vue'
import { getApiBaseUrl } from '../../../utils/database'

// 获取管理员 Token
const getAdminToken = () => sessionStorage.getItem('adminToken')

// 状态
const loading = ref(false)
const blocking = ref(false)
const unblocking = ref(false)
const lastUpdate = ref('')
const autoRefreshInterval = ref(null)

// 限流状态
const rateLimitStatus = ref({
  global: { activeIPs: 0, blockedIPs: 0 },
  api: { activeIPs: 0, blockedIPs: 0 },
  submit: { activeIPs: 0, blockedIPs: 0 },
  blockedIPs: 0,
  blockedList: []
})

// 签名缓存状态
const signatureCacheStatus = ref({
  usedSignatures: 0,
  maxSize: 100000,
  maxAge: 300000
})

// 封禁表单
const blockForm = ref({
  ip: '',
  duration: 3600000
})

// 格式化时间
const formatTime = (ms) => {
  if (!ms || ms <= 0) return '-'
  
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分`
  } else if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 刷新所有数据
const refreshAll = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchRateLimitStatus(),
      fetchSignatureCacheStatus()
    ])
    lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
    ElMessage.success('数据已刷新')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

// 获取限流状态
const fetchRateLimitStatus = async () => {
  try {
    const token = getAdminToken()
    const response = await fetch(`${getApiBaseUrl()}/security/rate-limit`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      rateLimitStatus.value = data
      
      // 计算总封禁数
      let totalBlocked = 0
      let allBlockedList = []
      
      if (data.global?.blockedList) {
        allBlockedList = allBlockedList.concat(data.global.blockedList)
      }
      if (data.api?.blockedList) {
        allBlockedList = allBlockedList.concat(data.api.blockedList)
      }
      if (data.submit?.blockedList) {
        allBlockedList = allBlockedList.concat(data.submit.blockedList)
      }
      
      // 去重
      const uniqueBlocked = [...new Map(allBlockedList.map(item => [item.ip, item])).values()]
      rateLimitStatus.value.blockedIPs = uniqueBlocked.length
      rateLimitStatus.value.blockedList = uniqueBlocked
    }
  } catch (error) {
    console.error('获取限流状态失败:', error)
  }
}

// 获取签名缓存状态
const fetchSignatureCacheStatus = async () => {
  try {
    const token = getAdminToken()
    const response = await fetch(`${getApiBaseUrl()}/security/signature-cache`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (response.ok) {
      signatureCacheStatus.value = await response.json()
    }
  } catch (error) {
    console.error('获取签名缓存状态失败:', error)
  }
}

// 封禁IP
const blockIP = async () => {
  if (!blockForm.value.ip) {
    ElMessage.warning('请输入IP地址')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要封禁 IP ${blockForm.value.ip} 吗？`,
      '封禁确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    blocking.value = true
    const token = getAdminToken()
    const response = await fetch(`${getApiBaseUrl()}/security/block-ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ip: blockForm.value.ip,
        duration: blockForm.value.duration
      })
    })
    
    if (response.ok) {
      ElMessage.success(`IP ${blockForm.value.ip} 已被封禁`)
      blockForm.value.ip = ''
      await refreshAll()
    } else {
      throw new Error('封禁失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('封禁IP失败:', error)
      ElMessage.error('封禁IP失败')
    }
  } finally {
    blocking.value = false
  }
}

// 解封IP
const unblockIP = async (ip) => {
  try {
    await ElMessageBox.confirm(
      `确定要解封 IP ${ip} 吗？`,
      '解封确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    const token = getAdminToken()
    const response = await fetch(`${getApiBaseUrl()}/security/unblock-ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ip })
    })
    
    if (response.ok) {
      ElMessage.success(`IP ${ip} 已解除封禁`)
      await refreshAll()
    } else {
      throw new Error('解封失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解封IP失败:', error)
      ElMessage.error('解封IP失败')
    }
  }
}

// 快速解封
const quickUnblock = async () => {
  const { value } = await ElMessageBox.prompt(
    '请输入要解封的IP地址',
    '快速解封',
    {
      confirmButtonText: '解封',
      cancelButtonText: '取消',
      inputPattern: /^[\d.:a-fA-F]+$/,
      inputErrorMessage: 'IP格式不正确'
    }
  ).catch(() => ({ value: null }))
  
  if (value) {
    await unblockIP(value)
  }
}

// 解除所有封禁
const unblockAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要解除所有 IP 的封禁吗？此操作不可撤销。',
      '解除所有封禁',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    unblocking.value = true
    const token = getAdminToken()
    const response = await fetch(`${getApiBaseUrl()}/security/unblock-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      // 显示详细操作结果
      const details = data.details
      const totalBlocked = (details.global?.blockedCount || 0) + 
                           (details.api?.blockedCount || 0) + 
                           (details.submit?.blockedCount || 0)
      
      ElMessage.success(`已解除 ${totalBlocked} 个 IP 封禁`)
      await refreshAll()
    } else {
      throw new Error(data.error || '解除封禁失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解除所有封禁失败:', error)
      ElMessage.error('解除所有封禁失败')
    }
  } finally {
    unblocking.value = false
  }
}

// 生命周期
onMounted(async () => {
  await refreshAll()
  // 每30秒自动刷新
  autoRefreshInterval.value = setInterval(refreshAll, 30000)
})

onUnmounted(() => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
})
</script>

<style scoped>
.security-monitor {
  padding: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.last-update {
  color: #909399;
  font-size: 14px;
}

.security-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item.danger {
  background: #fef0f0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-item.danger .stat-value {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.blocked-list {
  margin-top: 20px;
}

.blocked-list h4 {
  margin-bottom: 12px;
  color: #606266;
}

.cache-progress {
  margin-top: 16px;
}

.block-form {
  max-width: 500px;
}

.info-card :deep(.el-descriptions__label) {
  width: 150px;
  font-weight: 600;
}

@media screen and (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
