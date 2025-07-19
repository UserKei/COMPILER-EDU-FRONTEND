<template>
  <div class="dev-center">
    <!-- 开发环境标识 -->
    <div class="dev-banner">
      <div class="dev-badge">
        <Icon icon="lucide:code" class="w-5 h-5" />
        <span>开发调试模式</span>
      </div>
      <div class="environment-info">
        <span class="text-sm text-gray-600">环境：{{ currentEnv }}</span>
        <span class="text-sm text-gray-600">时间：{{ currentTime }}</span>
      </div>
    </div>

    <!-- 页面标题 -->
    <header class="dev-header">
      <h1 class="text-3xl font-bold text-gray-900">开发调试中心</h1>
      <p class="text-gray-600 mt-2">开发者工具集合，用于调试和测试各个功能模块</p>
    </header>

    <!-- 开发工具网格 -->
    <main class="dev-tools-grid">
      <div
        v-for="tool in devTools"
        :key="tool.name"
        class="dev-tool-card"
        @click="navigateToTool(tool.route)"
      >
        <div class="tool-icon">
          <Icon :icon="tool.icon" class="w-8 h-8" />
        </div>
        <div class="tool-content">
          <h3 class="tool-title">{{ tool.title }}</h3>
          <p class="tool-description">{{ tool.description }}</p>
          <div class="tool-status" :class="tool.status">
            <Icon :icon="getStatusIcon(tool.status)" class="w-4 h-4" />
            <span>{{ getStatusText(tool.status) }}</span>
          </div>
        </div>
        <div class="tool-arrow">
          <Icon icon="lucide:arrow-right" class="w-5 h-5" />
        </div>
      </div>
    </main>

    <!-- 快速操作面板 -->
    <section class="quick-actions">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">快速操作</h2>
      <div class="actions-grid">
        <button
          v-for="action in quickActions"
          :key="action.name"
          @click="executeAction(action.action)"
          :class="['action-btn', action.type]"
        >
          <Icon :icon="action.icon" class="w-5 h-5" />
          <span>{{ action.label }}</span>
        </button>
      </div>
    </section>

    <!-- 系统信息 -->
    <section class="system-info">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">系统信息</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Node.js</span>
          <span class="info-value">{{ systemInfo.node }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Vue</span>
          <span class="info-value">{{ systemInfo.vue }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Vite</span>
          <span class="info-value">{{ systemInfo.vite }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">TypeScript</span>
          <span class="info-value">{{ systemInfo.typescript }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()

// 当前环境和时间
const currentEnv = ref(import.meta.env.MODE || 'development')
const currentTime = ref('')

// 开发工具列表
const devTools = ref([
  {
    name: 'api-test',
    title: 'API连接测试',
    description: '测试前后端API连接状态和各功能模块',
    icon: 'lucide:wifi',
    route: '/dev/api-test',
    status: 'active'
  },
  {
    name: 'canvas',
    title: '画布测试',
    description: 'Vue Flow 画布组件和自定义节点测试',
    icon: 'lucide:pen-tool',
    route: '/dev/canvas',
    status: 'active'
  },
  {
    name: 'canvas-demos',
    title: '算法画布演示',
    description: '各种编译原理算法的画布组件演示',
    icon: 'lucide:layers',
    route: '/dev/canvas-demos',
    status: 'active'
  }
])

// 快速操作
const quickActions = ref([
  {
    name: 'clear-cache',
    label: '清除缓存',
    icon: 'lucide:trash-2',
    action: 'clearCache',
    type: 'danger'
  },
  {
    name: 'reload-page',
    label: '重新加载',
    icon: 'lucide:refresh-cw',
    action: 'reloadPage',
    type: 'primary'
  },
  {
    name: 'console-log',
    label: '打开控制台',
    icon: 'lucide:terminal',
    action: 'openConsole',
    type: 'secondary'
  },
  {
    name: 'export-logs',
    label: '导出日志',
    icon: 'lucide:download',
    action: 'exportLogs',
    type: 'success'
  }
])

// 系统信息
const systemInfo = ref({
  node: 'v18.0.0+',
  vue: '3.4.0',
  vite: '5.0.0',
  typescript: '5.3.0'
})

// 更新时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN')
}

// 导航到工具页面
const navigateToTool = (route: string) => {
  router.push(route)
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return 'lucide:check-circle'
    case 'pending': return 'lucide:clock'
    case 'planned': return 'lucide:calendar'
    default: return 'lucide:circle'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '可用'
    case 'pending': return '开发中'
    case 'planned': return '计划中'
    default: return '未知'
  }
}

// 执行快速操作
const executeAction = (action: string) => {
  switch (action) {
    case 'clearCache':
      localStorage.clear()
      sessionStorage.clear()
      console.log('[DEV] Cache cleared')
      break
    case 'reloadPage':
      window.location.reload()
      break
    case 'openConsole':
      console.log('[DEV] Console opened manually')
      break
    case 'exportLogs':
      console.log('[DEV] Export logs functionality would be here')
      break
  }
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
})
</script>

<style scoped>
.dev-center {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 2rem;
}

.dev-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(203, 213, 225, 0.3);
  border-radius: 1rem;
  padding: 1rem 2rem;
  margin-bottom: 2rem;
}

.dev-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #475569;
  color: #f1f5f9;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
}

.environment-info {
  display: flex;
  gap: 1rem;
  color: #475569;
}

.dev-header {
  text-align: center;
  color: #1e293b;
  margin-bottom: 3rem;
}

.dev-tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.dev-tool-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.dev-tool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  border-color: #d1d5db;
}

.tool-icon {
  width: 4rem;
  height: 4rem;
  background: #e5e7eb;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.tool-content {
  flex: 1;
}

.tool-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.tool-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.tool-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.tool-status.active { color: #374151; }
.tool-status.pending { color: #6b7280; }
.tool-status.planned { color: #9ca3af; }

.tool-arrow {
  color: #d1d5db;
  transition: all 0.3s ease;
}

.dev-tool-card:hover .tool-arrow {
  color: #6b7280;
  transform: translateX(4px);
}

.quick-actions, .system-info {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary { background: #374151; color: white; }
.action-btn.secondary { background: #6b7280; color: white; }
.action-btn.success { background: #111827; color: white; }
.action-btn.danger { background: #4b5563; color: white; }

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  opacity: 0.9;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.info-label {
  font-weight: 500;
  color: #111827;
}

.info-value {
  font-family: 'Courier New', monospace;
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
