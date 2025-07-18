<template>
  <div class="home-page min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- 头部导航 -->
    <header class="bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold text-blue-600">编译原理可视化工具</h1>
          </div>
          <div class="flex items-center gap-2">
            <router-link
              to="/"
              class="px-3 py-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              首页
            </router-link>
            <router-link
              to="/dev"
              class="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              开发调试
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto px-4 py-16">
      <!-- 欢迎区域 -->
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          编译原理算法可视化平台
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          通过交互式步骤和可视化图表，深入理解有限自动机、语法分析等编译原理核心概念
        </p>
      </div>

      <!-- 算法卡片网格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <!-- FA 卡片 -->
        <div class="algorithm-card group">
          <div class="algorithm-icon fa-icon">
            <Icon icon="lucide:git-branch" class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">有限自动机 (FA)</h3>
          <p class="text-gray-600 text-sm mb-4">
            从正则表达式到NFA，再到DFA最小化的完整流程
          </p>
          <div class="text-xs text-gray-500 mb-4">
            正则表达式 → NFA → DFA → 最小化DFA
          </div>
          <router-link
            to="/fa"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group-hover:scale-105 transform duration-200"
          >
            开始学习
            <Icon icon="lucide:arrow-right" class="w-4 h-4 ml-2" />
          </router-link>
        </div>

        <!-- LL1 卡片 -->
        <div class="algorithm-card group">
          <div class="algorithm-icon ll1-icon">
            <Icon icon="lucide:layers" class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">LL1 分析</h3>
          <p class="text-gray-600 text-sm mb-4">
            自顶向下语法分析，构建LL1分析表
          </p>
          <div class="text-xs text-gray-500 mb-4">
            文法 → First/Follow集 → 分析表 → 字符串分析
          </div>
          <router-link
            to="/ll1"
            class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group-hover:scale-105 transform duration-200"
          >
            开始学习
            <Icon icon="lucide:arrow-right" class="w-4 h-4 ml-2" />
          </router-link>
        </div>

        <!-- LR0 卡片 -->
        <div class="algorithm-card group">
          <div class="algorithm-icon lr0-icon">
            <Icon icon="lucide:workflow" class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">LR0 分析</h3>
          <p class="text-gray-600 text-sm mb-4">
            自底向上语法分析，构建LR0分析表
          </p>
          <div class="text-xs text-gray-500 mb-4">
            文法 → 增广文法 → DFA → 分析表 → 字符串分析
          </div>
          <router-link
            to="/lr0"
            class="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors group-hover:scale-105 transform duration-200"
          >
            开始学习
            <Icon icon="lucide:arrow-right" class="w-4 h-4 ml-2" />
          </router-link>
        </div>

        <!-- SLR1 卡片 -->
        <div class="algorithm-card group">
          <div class="algorithm-icon slr1-icon">
            <Icon icon="lucide:zap" class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">SLR1 分析</h3>
          <p class="text-gray-600 text-sm mb-4">
            改进的LR分析，解决LR0冲突问题
          </p>
          <div class="text-xs text-gray-500 mb-4">
            文法 → 增广文法 → DFA → SLR1分析表 → 字符串分析
          </div>
          <router-link
            to="/slr1"
            class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors group-hover:scale-105 transform duration-200"
          >
            开始学习
            <Icon icon="lucide:arrow-right" class="w-4 h-4 ml-2" />
          </router-link>
        </div>
      </div>

      <!-- 特性展示 -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-16">
        <h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">平台特性</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="lucide:eye" class="w-8 h-8 text-blue-600" />
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">可视化步骤</h4>
            <p class="text-gray-600 text-sm">
              每个算法步骤都有详细的可视化展示，帮助理解复杂概念
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="lucide:mouse-pointer-click" class="w-8 h-8 text-green-600" />
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">交互式学习</h4>
            <p class="text-gray-600 text-sm">
              通过交互式画布和步骤操作，动手实践每个算法流程
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="lucide:zap" class="w-8 h-8 text-purple-600" />
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">实时反馈</h4>
            <p class="text-gray-600 text-sm">
              实时验证输入，提供即时反馈和错误提示
            </p>
          </div>
        </div>
      </div>

      <!-- 开发者工具 -->
      <div class="bg-gray-50 rounded-xl p-8">
        <h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">开发者工具</h3>
        <div class="flex justify-center gap-4">
          <router-link
            to="/dev/canvas"
            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
          >
            <Icon icon="lucide:palette" class="w-5 h-5 inline mr-2" />
            画布测试
          </router-link>
          <router-link
            to="/dev"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon icon="lucide:code" class="w-5 h-5 inline mr-2" />
            开发中心
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<style scoped>
.algorithm-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  border: 1px solid rgb(243 244 246);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.algorithm-card:hover {
  box-shadow: 0 25px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.algorithm-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.fa-icon {
  background: rgb(219 234 254);
  color: rgb(37 99 235);
}

.ll1-icon {
  background: rgb(220 252 231);
  color: rgb(22 163 74);
}

.lr0-icon {
  background: rgb(254 215 170);
  color: rgb(234 88 12);
}

.slr1-icon {
  background: rgb(237 233 254);
  color: rgb(147 51 234);
}
</style>
