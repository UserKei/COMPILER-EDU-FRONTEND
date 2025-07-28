<template>
  <div class="dev-index">
    <!-- 页面头部 -->
    <header class="dev-header">
      <h1 class="text-3xl font-bold text-gray-900">开发调试中心</h1>
      <p class="text-gray-600 mt-2">选择要测试的画布组件</p>
    </header>

    <!-- 画布选择网格 -->
    <main class="canvas-grid">
      <div class="canvas-card" @click="$router.push('/dev/nfa')">
        <div class="card-icon">
          <Icon icon="lucide:git-branch" class="w-12 h-12" />
        </div>
        <div class="card-content">
          <h3 class="card-title">NFA Canvas</h3>
          <p class="card-description">非确定有限自动机画布组件测试</p>
        </div>
        <div class="card-arrow">
          <Icon icon="lucide:arrow-right" class="w-5 h-5" />
        </div>
      </div>

      <div class="canvas-card" @click="$router.push('/dev/dfa')">
        <div class="card-icon">
          <Icon icon="lucide:workflow" class="w-12 h-12" />
        </div>
        <div class="card-content">
          <h3 class="card-title">DFA Canvas</h3>
          <p class="card-description">确定有限自动机画布组件测试</p>
        </div>
        <div class="card-arrow">
          <Icon icon="lucide:arrow-right" class="w-5 h-5" />
        </div>
      </div>

      <div class="canvas-card" @click="$router.push('/dev/min-dfa')">
        <div class="card-icon">
          <Icon icon="lucide:minimize-2" class="w-12 h-12" />
        </div>
        <div class="card-content">
          <h3 class="card-title">最小化 DFA</h3>
          <p class="card-description">最小化确定有限自动机画布组件测试</p>
        </div>
        <div class="card-arrow">
          <Icon icon="lucide:arrow-right" class="w-5 h-5" />
        </div>
      </div>

      <div class="canvas-card" @click="$router.push('/dev/lr0')">
        <div class="card-icon">
          <Icon icon="lucide:layers" class="w-12 h-12" />
        </div>
        <div class="card-content">
          <h3 class="card-title">LR0 Canvas</h3>
          <p class="card-description">LR0 分析器画布组件测试</p>
        </div>
        <div class="card-arrow">
          <Icon icon="lucide:arrow-right" class="w-5 h-5" />
        </div>
      </div>

      <div class="canvas-card" @click="$router.push('/dev/slr1')">
        <div class="card-icon">
          <Icon icon="lucide:list-tree" class="w-12 h-12" />
        </div>
        <div class="card-content">
          <h3 class="card-title">SLR1 Canvas</h3>
          <p class="card-description">SLR1 分析器画布组件测试</p>
        </div>
        <div class="card-arrow">
          <Icon icon="lucide:arrow-right" class="w-5 h-5" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<style scoped>
.dev-index {
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem;
}

.dev-header {
  text-align: center;
  margin-bottom: 3rem;
}

.canvas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.canvas-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.canvas-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-icon {
  color: #3b82f6;
  background: #eff6ff;
  padding: 1rem;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.card-description {
  color: #6b7280;
  line-height: 1.5;
}

.card-arrow {
  color: #9ca3af;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.canvas-card:hover .card-arrow {
  color: #3b82f6;
  transform: translateX(4px);
}
</style>
