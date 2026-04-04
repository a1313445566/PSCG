<template>
  <div class="security-monitor">
    <!-- Tabs 切换 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 实时监控 Tab -->
      <el-tab-pane label="实时监控" name="realtime">
        <!-- 刷新按钮 -->
        <div class="header-actions">
          <el-button type="primary" :loading="loading" @click="refreshAll">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
          <el-button type="warning" :loading="unblocking" @click="unblockAll">
            <el-icon><Unlock /></el-icon>
            解除所有封禁
          </el-button>
          <el-button type="danger" @click="batchBlockDialogVisible = true">
            <el-icon><Delete /></el-icon>
            批量封禁
          </el-button>
          <span v-if="lastUpdate" class="last-update">上次更新: {{ lastUpdate }}</span>
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
                {{
                  rateLimitStatus.blockedIPs > 0
                    ? `${rateLimitStatus.blockedIPs} 个IP被封禁`
                    : '正常'
                }}
              </el-tag>
            </div>
          </template>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ rateLimitStatus.api?.activeUsers || 0 }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ rateLimitStatus.api?.activeIPs || 0 }}</div>
              <div class="stat-label">匿名IP</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ rateLimitStatus.submit?.activeUsers || 0 }}</div>
              <div class="stat-label">答题用户</div>
            </div>
            <div class="stat-item danger">
              <div class="stat-value">{{ rateLimitStatus.blockedIPs || 0 }}</div>
              <div class="stat-label">被封禁</div>
            </div>
          </div>

          <!-- 被封禁列表 -->
          <div
            v-if="rateLimitStatus.blockedList && rateLimitStatus.blockedList.length > 0"
            class="blocked-list"
          >
            <h4>被封禁列表</h4>
            <el-table :data="rateLimitStatus.blockedList" stripe style="width: 100%">
              <el-table-column prop="key" label="标识" width="200">
                <template #default="{ row }">
                  <span v-if="row">{{ row.key || row.ip }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag
                    v-if="row"
                    :type="row.type === 'user' ? 'primary' : 'warning'"
                    size="small"
                  >
                    {{ row.type === 'user' ? '用户' : 'IP' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="原因" width="120">
                <template #default="{ row }">
                  <el-tag
                    v-if="row"
                    :type="row.reason === 'manual_block' ? 'warning' : 'danger'"
                    size="small"
                  >
                    {{ row.reason === 'manual_block' ? '手动封禁' : '频率超限' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="remainingTime" label="剩余时间">
                <template #default="{ row }">
                  <span v-if="row">{{ formatTime(row.remainingTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button
                    v-if="row"
                    type="success"
                    size="small"
                    @click="unblockIP(row.ip || row.key)"
                  >
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
              <el-tag type="info">防重放保护</el-tag>
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
                {{
                  (
                    (signatureCacheStatus.usedSignatures / signatureCacheStatus.maxSize) *
                    100
                  ).toFixed(1)
                }}%
              </div>
              <div class="stat-label">缓存使用率</div>
            </div>
          </div>

          <div class="cache-progress">
            <el-progress
              :percentage="
                (signatureCacheStatus.usedSignatures / signatureCacheStatus.maxSize) * 100
              "
              :color="
                getProgressColor(
                  (signatureCacheStatus.usedSignatures / signatureCacheStatus.maxSize) * 100
                )
              "
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
            <el-form-item label="IP地址" required>
              <el-input v-model="blockForm.ip" placeholder="输入要封禁的IP地址" />
            </el-form-item>
            <el-form-item label="封禁时长" required>
              <el-select v-model="blockForm.duration" placeholder="选择封禁时长">
                <el-option label="10分钟" :value="600000" />
                <el-option label="30分钟" :value="1800000" />
                <el-option label="1小时" :value="3600000" />
                <el-option label="6小时" :value="21600000" />
                <el-option label="24小时" :value="86400000" />
                <el-option label="永久（需手动解封）" :value="31536000000" />
              </el-select>
            </el-form-item>
            <el-form-item label="封禁原因" required>
              <el-input
                v-model="blockForm.reason"
                type="textarea"
                :rows="3"
                placeholder="请填写封禁原因（必填）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="danger"
                :loading="blocking"
                :disabled="!blockForm.reason"
                @click="blockIP"
              >
                封禁IP
              </el-button>
              <el-button type="success" @click="quickUnblock">快速解封</el-button>
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
            <el-descriptions-item label="限流策略">
              <el-tag type="primary" size="small">用户ID优先</el-tag>
              <span style="margin-left: 8px; color: #409eff">
                登录用户独立配额，支持学校NAT环境
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="API限流（用户）">
              每个用户每分钟最多 150 次请求
            </el-descriptions-item>
            <el-descriptions-item label="API限流（IP）">
              每个 IP 每分钟最多 1000 次请求（支持 NAT 多用户）
            </el-descriptions-item>
            <el-descriptions-item label="提交限流（用户）">
              每个用户每分钟最多 20 次提交
            </el-descriptions-item>
            <el-descriptions-item label="提交限流（IP）">
              每个 IP 每分钟最多 500 次提交（防御匿名攻击）
            </el-descriptions-item>
            <el-descriptions-item label="签名防重放">
              同一签名 5 分钟内只能使用一次
            </el-descriptions-item>
            <el-descriptions-item label="白名单IP">
              127.0.0.1, ::1 不受限流影响
            </el-descriptions-item>
            <el-descriptions-item label="学校环境适配">
              <el-tag type="success" size="small">已启用</el-tag>
              <span style="margin-left: 8px; color: #67c23a">同一AP下多用户各自独立配额</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-tab-pane>

      <!-- 操作日志 Tab -->
      <el-tab-pane label="操作日志" name="logs">
        <!-- 筛选条件 -->
        <el-form :inline="true" :model="logFilters" class="log-filters">
          <el-form-item label="操作类型">
            <el-select v-model="logFilters.type" placeholder="全部" clearable style="width: 150px">
              <el-option label="封禁" value="block" />
              <el-option label="解封" value="unblock" />
              <el-option label="批量封禁" value="batch_block" />
              <el-option label="批量解封" value="unblock_all" />
            </el-select>
          </el-form-item>
          <el-form-item label="IP 地址">
            <el-input
              v-model="logFilters.ip"
              placeholder="输入 IP 地址"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="操作人">
            <el-input
              v-model="logFilters.operator"
              placeholder="输入操作人"
              clearable
              style="width: 150px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadLogs">查询</el-button>
            <el-button @click="resetLogFilters">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 日志表格 -->
        <el-table v-loading="logsLoading" :data="logs" stripe style="margin-top: 20px">
          <el-table-column prop="ip" label="IP 地址" width="150" />
          <el-table-column prop="type" label="操作类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getLogTypeTag(row.type)">
                {{ getLogTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
          <el-table-column prop="operator" label="操作人" width="120" />
          <el-table-column prop="timestamp" label="操作时间" width="180">
            <template #default="{ row }">
              {{ formatTimestamp(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="封禁时长" width="120">
            <template #default="{ row }">
              {{ row.duration ? formatDuration(row.duration / 1000) : '-' }}
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
          v-model:current-page="logCurrentPage"
          v-model:page-size="logPageSize"
          :total="logTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          style="margin-top: 20px; justify-content: center"
          @size-change="handleLogSizeChange"
          @current-change="handleLogCurrentChange"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 批量封禁对话框 -->
    <el-dialog v-model="batchBlockDialogVisible" title="批量封禁 IP" width="600px">
      <el-alert title="注意事项" type="warning" :closable="false" style="margin-bottom: 20px">
        <p>• 每行一个 IP 地址，最多 100 个</p>
        <p>• 支持 IPv4 和 IPv6 格式</p>
        <p>• 封禁原因必填，将应用于所有 IP</p>
      </el-alert>

      <el-form :model="batchBlockForm" label-width="100px">
        <el-form-item label="IP 列表" required>
          <el-input
            v-model="batchBlockForm.ipsText"
            type="textarea"
            :rows="8"
            placeholder="每行一个 IP 地址&#10;例如:&#10;192.168.1.1&#10;192.168.1.2&#10;192.168.1.3"
          />
          <div style="margin-top: 5px; color: #909399; font-size: 12px">
            已输入 {{ ipCount }} 个 IP
          </div>
        </el-form-item>
        <el-form-item label="封禁时长" required>
          <el-select v-model="batchBlockForm.duration" placeholder="选择封禁时长">
            <el-option label="1 小时" :value="3600000" />
            <el-option label="24 小时" :value="86400000" />
            <el-option label="7 天" :value="604800000" />
            <el-option label="永久" :value="31536000000" />
          </el-select>
        </el-form-item>
        <el-form-item label="封禁原因" required>
          <el-input
            v-model="batchBlockForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请填写批量封禁原因（必填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchBlockDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          :disabled="ipCount === 0 || !batchBlockForm.reason"
          :loading="batchBlocking"
          @click="handleBatchBlock"
        >
          确定封禁
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Refresh, Warning, Key, Lock, Unlock, InfoFilled, Delete } from '@element-plus/icons-vue'
import { api } from '../../../utils/api'
import message from '../../../utils/message'
import { useLoading } from '../../../composables/useLoading'
import { formatDuration } from '../../../utils/format'
import { escapeHtml } from '../../../utils/xss-filter'

// 使用 Loading Hook
const { withLoading: _withLoading, cleanup } = useLoading() // eslint-disable-line @typescript-eslint/no-unused-vars -- withLoading 暂未使用

// Tab 状态
const activeTab = ref('realtime')

// 实时监控状态
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
  duration: 3600000,
  reason: ''
})

// 批量封禁
const batchBlockDialogVisible = ref(false)
const batchBlocking = ref(false)
const batchBlockForm = reactive({
  ipsText: '',
  duration: 86400000,
  reason: ''
})

// 计算 IP 数量
const ipCount = computed(() => {
  return batchBlockForm.ipsText
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0).length
})

// 操作日志状态
const logs = ref([])
const logsLoading = ref(false)
const logTotal = ref(0)
const logCurrentPage = ref(1)
const logPageSize = ref(20)

const logFilters = reactive({
  type: '',
  ip: '',
  operator: ''
})

// 格式化时间
const formatTime = ms => {
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

// 格式化时间戳
const formatTimestamp = timestamp => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai'
  })
}

// 获取进度条颜色
const getProgressColor = percentage => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 刷新所有数据
const refreshAll = async () => {
  loading.value = true
  try {
    await Promise.all([fetchRateLimitStatus(), fetchSignatureCacheStatus()])
    lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
    message.success('数据已刷新')
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取限流状态
const fetchRateLimitStatus = async () => {
  try {
    const data = await api.get('/security/rate-limit')
    rateLimitStatus.value = data

    // 计算总封禁数
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
  } catch (error) {
    console.error('获取限流状态失败:', error)
  }
}

// 获取签名缓存状态
const fetchSignatureCacheStatus = async () => {
  try {
    const data = await api.get('/security/signature-cache')
    signatureCacheStatus.value = data
  } catch (error) {
    console.error('获取签名缓存状态失败:', error)
  }
}

// 封禁IP
const blockIP = async () => {
  if (!blockForm.value.ip) {
    message.warning('请输入IP地址')
    return
  }
  if (!blockForm.value.reason) {
    message.warning('请填写封禁原因')
    return
  }

  // XSS 防护
  const safeReason = escapeHtml(blockForm.value.reason.trim())

  // 确认操作
  const confirmed = await message.confirm(`确定要封禁 IP ${blockForm.value.ip} 吗？`, '封禁确认', {
    type: 'warning'
  })
  if (!confirmed) return

  try {
    blocking.value = true
    await api.post('/security/block-ip', {
      ip: blockForm.value.ip,
      duration: blockForm.value.duration,
      reason: safeReason
    })

    message.actionSuccess('封禁')
    blockForm.value.ip = ''
    blockForm.value.reason = ''
    await refreshAll()
  } catch (error) {
    // api 已自动显示错误
  } finally {
    blocking.value = false
  }
}

// 解封IP
const unblockIP = async ip => {
  const confirmed = await message.confirm(`确定要解封 IP ${ip} 吗？`, '解封确认', { type: 'info' })
  if (!confirmed) return

  try {
    await api.post('/security/unblock-ip', { ip })
    message.actionSuccess('解封')
    await refreshAll()
  } catch (error) {
    // api 已自动显示错误
  }
}

// 快速解封
const quickUnblock = async () => {
  const { value } = await ElMessageBox.prompt('请输入要解封的IP地址', '快速解封', {
    confirmButtonText: '解封',
    cancelButtonText: '取消',
    inputPattern: /^[\d.:a-fA-F]+$/,
    inputErrorMessage: 'IP格式不正确'
  }).catch(() => ({ value: null }))

  if (value) {
    await unblockIP(value)
  }
}

// 解除所有封禁
const unblockAll = async () => {
  const confirmed = await message.confirm(
    '确定要解除所有 IP 的封禁吗？此操作不可撤销。',
    '解除所有封禁',
    { type: 'warning' }
  )
  if (!confirmed) return

  try {
    unblocking.value = true
    const data = await api.post('/security/unblock-all')

    // 显示详细操作结果
    const details = data.details
    const totalBlocked =
      (details.global?.blockedCount || 0) +
      (details.api?.blockedCount || 0) +
      (details.submit?.blockedCount || 0)

    message.success(`已解除 ${totalBlocked} 个 IP 封禁`)
    await refreshAll()
  } catch (error) {
    // api 已自动显示错误
  } finally {
    unblocking.value = false
  }
}

// 批量封禁
const handleBatchBlock = async () => {
  // 解析 IP 列表
  const ips = batchBlockForm.ipsText
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0)

  // 输入验证
  if (ips.length === 0) {
    message.warning('请输入至少一个 IP 地址')
    return
  }
  if (ips.length > 100) {
    message.warning('单次最多封禁 100 个 IP')
    return
  }
  if (!batchBlockForm.reason) {
    message.warning('请填写封禁原因')
    return
  }

  // XSS 防护
  const safeReason = escapeHtml(batchBlockForm.reason.trim())

  // 确认操作
  const confirmed = await message.confirmBatch(ips.length, '封禁')
  if (!confirmed) return

  try {
    batchBlocking.value = true
    const result = await api.post('/security/batch-block', {
      ips,
      duration: batchBlockForm.duration,
      reason: safeReason
    })

    message.success(result.message)
    batchBlockDialogVisible.value = false
    batchBlockForm.ipsText = ''
    batchBlockForm.reason = ''

    await refreshAll()
  } catch (error) {
    // api 已自动显示错误
  } finally {
    batchBlocking.value = false
  }
}

// 加载操作日志
const loadLogs = async () => {
  try {
    logsLoading.value = true

    const params = {
      page: logCurrentPage.value,
      limit: logPageSize.value,
      ...logFilters
    }

    const result = await api.get('/security/logs', params)

    logs.value = result.logs
    logTotal.value = result.total
  } catch (error) {
    // api 已自动显示错误
  } finally {
    logsLoading.value = false
  }
}

// 重置筛选
const resetLogFilters = () => {
  logFilters.type = ''
  logFilters.ip = ''
  logFilters.operator = ''
  logCurrentPage.value = 1
  loadLogs()
}

// 格式化操作类型
const getLogTypeText = type => {
  const map = {
    block: '封禁',
    unblock: '解封',
    batch_block: '批量封禁',
    unblock_all: '批量解封'
  }
  return map[type] || type
}

const getLogTypeTag = type => {
  const map = {
    block: 'danger',
    unblock: 'success',
    batch_block: 'warning',
    unblock_all: 'info'
  }
  return map[type] || ''
}

// Tab 切换
const handleTabChange = tab => {
  if (tab === 'logs') {
    loadLogs()
  }
}

// 分页事件
const handleLogSizeChange = size => {
  logPageSize.value = size
  logCurrentPage.value = 1
  loadLogs()
}

const handleLogCurrentChange = page => {
  logCurrentPage.value = page
  loadLogs()
}

// 引入 ElMessageBox 用于快速解封
import { ElMessageBox } from 'element-plus'

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
  cleanup()
})
</script>

<style scoped lang="scss">
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

.log-filters {
  margin-bottom: 20px;
}

@media screen and (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
