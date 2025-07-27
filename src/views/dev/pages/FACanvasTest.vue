<template>
  <div class="fa-canvas-test">
    <!-- 页面头部 -->
    <header class="test-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">FA Canvas 测试</h1>
          <p class="text-gray-600 mt-1">有限自动机画布组件测试 (NFA/DFA)</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700">模式:</label>
            <select
              v-model="currentMode"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="nfa">NFA</option>
              <option value="dfa">DFA</option>
            </select>
          </div>
          <router-link
            to="/dev/lr-canvas"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            切换到 LR Canvas
          </router-link>
        </div>
      </div>
    </header>

    <!-- FA Canvas 容器 -->
    <main class="canvas-wrapper">
      <FACanvas :mode="currentMode" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FACanvas from '@/flow/faCanvas/index.vue'

const currentMode = ref<'nfa' | 'dfa'>('nfa')
</script>

<style scoped>
.fa-canvas-test {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.test-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
}

.canvas-wrapper {
  flex: 1;
  overflow: hidden;
}
</style>
