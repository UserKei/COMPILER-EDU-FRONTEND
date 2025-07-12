<template>
  <div class="canvas-flow-test">
    <!-- 页面头部 -->
    <header class="test-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Vue Flow 测试</h1>
          <p class="text-gray-600 mt-1">基础 Vue Flow 画布组件测试和调试</p>
        </div>
        <div class="flex items-center gap-4">
          <button 
            @click="showDebug = !showDebug"
            :class="['px-4 py-2 rounded-lg transition-colors', showDebug ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']"
          >
            <Icon icon="lucide:bug" class="w-4 h-4 inline mr-2" />
            调试面板
          </button>
          <router-link to="/dev" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Icon icon="lucide:arrow-left" class="w-4 h-4 inline mr-2" />
            返回
          </router-link>
        </div>
      </div>
    </header>

    <!-- Vue Flow 容器 -->
    <main class="flow-container">
      <VueFlowContainer :show-debug="showDebug" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import VueFlowContainer from '@/components/dev/VueFlowContainer.vue'

const showDebug = ref(false)
</script>

<style scoped>
.canvas-flow-test {
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

.flow-container {
  flex: 1;
  padding: 1rem;
}
</style>
