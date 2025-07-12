<template>
  <div class="canvas-demos">
    <!-- 页面头部 -->
    <header class="demos-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">算法画布演示</h1>
          <p class="text-gray-600 mt-1">各种编译原理算法的画布组件演示</p>
        </div>
        <div class="flex items-center gap-4">
          <router-link to="/dev" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Icon icon="lucide:arrow-left" class="w-4 h-4 inline mr-2" />
            返回开发中心
          </router-link>
        </div>
      </div>
    </header>

    <!-- 选项卡导航 -->
    <div class="tabs-section">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-2 rounded-t-lg transition-colors border-b-2',
            activeTab === tab.id
              ? 'bg-white text-blue-600 border-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
          ]"
        >
          <Icon :icon="tab.icon" class="w-4 h-4 inline mr-2" />
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- 画布容器 -->
    <main class="canvas-wrapper">
      <!-- NFA 画布 -->
      <div v-if="activeTab === 'nfa'" class="canvas-content">
        <div class="canvas-info">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">NFA 编辑器</h3>
          <p class="text-gray-600 text-sm">非确定有限自动机可视化编辑器</p>
        </div>
        <div class="canvas-placeholder">
          <Icon icon="lucide:git-branch" class="w-16 h-16 text-gray-400 mb-4" />
          <h4 class="text-xl font-semibold text-gray-600 mb-2">NFA 画布组件</h4>
          <p class="text-gray-500">待开发：NFA 状态图编辑器</p>
        </div>
      </div>

      <!-- DFA 画布 -->
      <div v-if="activeTab === 'dfa'" class="canvas-content">
        <div class="canvas-info">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">DFA 编辑器</h3>
          <p class="text-gray-600 text-sm">确定有限自动机可视化编辑器</p>
        </div>
        <div class="canvas-placeholder">
          <Icon icon="lucide:workflow" class="w-16 h-16 text-gray-400 mb-4" />
          <h4 class="text-xl font-semibold text-gray-600 mb-2">DFA 画布组件</h4>
          <p class="text-gray-500">待开发：DFA 状态图编辑器</p>
        </div>
      </div>

      <!-- LR0 画布 -->
      <div v-if="activeTab === 'lr0'" class="canvas-content">
        <div class="canvas-info">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">LR0 项目集</h3>
          <p class="text-gray-600 text-sm">LR0 项目集规范族可视化</p>
        </div>
        <div class="canvas-placeholder">
          <Icon icon="lucide:layers" class="w-16 h-16 text-gray-400 mb-4" />
          <h4 class="text-xl font-semibold text-gray-600 mb-2">LR0 项目集画布</h4>
          <p class="text-gray-500">待开发：LR0 项目集可视化组件</p>
        </div>
      </div>

      <!-- SLR1 画布 -->
      <div v-if="activeTab === 'slr1'" class="canvas-content">
        <div class="canvas-info">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">SLR1 项目集</h3>
          <p class="text-gray-600 text-sm">SLR1 项目集规范族可视化</p>
        </div>
        <div class="canvas-placeholder">
          <Icon icon="lucide:zap" class="w-16 h-16 text-gray-400 mb-4" />
          <h4 class="text-xl font-semibold text-gray-600 mb-2">SLR1 项目集画布</h4>
          <p class="text-gray-500">待开发：SLR1 项目集可视化组件</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

// 选项卡配置
const tabs = [
  { id: 'nfa', name: 'NFA 编辑器', icon: 'lucide:git-branch' },
  { id: 'dfa', name: 'DFA 编辑器', icon: 'lucide:workflow' },
  { id: 'lr0', name: 'LR0 项目集', icon: 'lucide:layers' },
  { id: 'slr1', name: 'SLR1 项目集', icon: 'lucide:zap' }
]

// 当前活动选项卡
const activeTab = ref('nfa')
</script>

<style scoped>
.canvas-demos {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.demos-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
}

.tabs-section {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 2rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.canvas-wrapper {
  flex: 1;
  overflow: hidden;
}

.canvas-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.canvas-info {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.canvas-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem;
}
</style>
