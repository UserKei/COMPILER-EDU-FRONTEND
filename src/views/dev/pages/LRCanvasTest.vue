<template>
  <div class="lr-canvas-test">
    <!-- 页面头部 -->
    <header class="test-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">LR Canvas 测试</h1>
          <p class="text-gray-600 mt-1">LR 项目集分析画布组件测试</p>
        </div>
        <div class="flex items-center gap-4">
          <router-link
            to="/dev/fa-canvas"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            切换到 FA Canvas
          </router-link>
        </div>
      </div>
    </header>

    <!-- LR Canvas 容器 -->
    <main class="canvas-wrapper">
      <LRCanvas />
    </main>
  </div>
</template>

<script setup lang="ts">
import LRCanvas from '@/flow/lrCanvas/index.vue'
</script>

<style scoped>
.lr-canvas-test {
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
