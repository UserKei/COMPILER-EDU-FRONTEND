<template>
  <main class="h-screen w-full">
    <div class="h-full flex flex-col">
      <!-- 导航栏 -->
      <nav class="bg-white border-b border-gray-200 px-4 py-3">
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-semibold text-gray-800">编译原理可视化工具</h1>
          <div class="flex gap-4">
            <router-link
              to="/"
              class="px-3 py-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              测试容器
            </router-link>
            <router-link
              to="/canvas-demo"
              class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              画布演示
            </router-link>
          </div>
        </div>
      </nav>

      <!-- 测试容器 -->
      <div class="flex-1">
        <VueFlowContainer />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import VueFlowContainer from '@/components/dev/VueFlowContainer.vue'
</script>
