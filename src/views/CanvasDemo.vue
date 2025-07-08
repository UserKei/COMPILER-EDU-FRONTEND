<template>
  <div class="canvas-demo">
    <div class="header">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">画布组件演示</h1>
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-2 rounded-t-lg transition-colors',
            activeTab === tab.id
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <div class="canvas-wrapper">
      <!-- NFA 画布 -->
      <NFACanvas v-if="activeTab === 'nfa'" />

      <!-- DFA 画布 -->
      <DFACanvas v-if="activeTab === 'dfa'" />

      <!-- LR0 画布 -->
      <LR0Canvas v-if="activeTab === 'lr0'" />

      <!-- SLR1 画布 -->
      <SLR1Canvas v-if="activeTab === 'slr1'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NFACanvas from '@/components/flow/canvas/NFACanvas.vue'
import DFACanvas from '@/components/flow/canvas/DFACanvas.vue'
import LR0Canvas from '@/components/flow/canvas/LR0Canvas.vue'
import SLR1Canvas from '@/components/flow/canvas/SLR1Canvas.vue'

// 选项卡配置
const tabs = [
  { id: 'nfa', name: 'NFA 编辑器' },
  { id: 'dfa', name: 'DFA 编辑器' },
  { id: 'lr0', name: 'LR0 项目集' },
  { id: 'slr1', name: 'SLR1 项目集' }
]

// 当前活动选项卡
const activeTab = ref('nfa')
</script>

<style scoped>
.canvas-demo {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.canvas-wrapper {
  flex: 1;
  overflow: hidden;
}
</style>
