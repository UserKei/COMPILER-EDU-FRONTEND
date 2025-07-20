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
        <NFACanvas />
      </div>

      <!-- DFA 画布 -->
      <div v-if="activeTab === 'dfa'" class="canvas-content">
        <DFACanvas />
      </div>

      <!-- LR 项目集画布 -->
      <div v-if="activeTab === 'lr'" class="canvas-content">
        <LRCanvas />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import DFACanvas from '@/components/flow/canvas/DFACanvas.vue'
import NFACanvas from '@/components/flow/canvas/NFACanvas.vue'
import LRCanvas from '@/components/flow/canvas/LRCanvas.vue'

// 选项卡配置
const tabs = [
  { id: 'nfa', name: 'NFA 编辑器', icon: 'lucide:git-branch' },
  { id: 'dfa', name: 'DFA 编辑器', icon: 'lucide:workflow' },
  { id: 'lr', name: 'LR 项目集', icon: 'lucide:layers' }
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
</style>
