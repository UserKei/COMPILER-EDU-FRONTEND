<template>
  <div class="ll1-layout h-screen bg-gradient-to-br from-green-50 to-emerald-100">
    <!-- 头部导航 -->
    <header class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link to="/" class="text-2xl font-bold text-green-600 hover:text-green-800 transition-colors">
              编译原理可视化
            </router-link>
            <span class="text-gray-400">|</span>
            <h1 class="text-xl font-semibold text-gray-800">LL1 语法分析</h1>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="resetProgress"
              class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              重置进度
            </button>
            <router-link
              to="/lr0"
              class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              LR0分析 →
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- 流程图导航 -->
      <div class="mb-8">
        <StepFlowChart
          :steps="ll1Steps"
          :current-step="currentStep"
          @step-click="navigateToStep"
        />
      </div>

      <!-- 步骤内容 -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <Transition name="slide-fade" mode="out-in">
          <component
            :is="currentStepComponent"
            :key="currentStep"
            @next-step="nextStep"
            @prev-step="prevStep"
            @complete="onStepComplete"
          />
        </Transition>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StepFlowChart from '@/components/shared/StepFlowChart.vue'

// 导入步骤组件
import GrammarInput from './steps/01-GrammarInput.vue'
import FirstFollowSets from './steps/02-FirstFollowSets.vue'
import LL1TableBuild from './steps/03-LL1TableBuild.vue'
import StringAnalysis from './steps/04-StringAnalysis.vue'

const router = useRouter()
const route = useRoute()

// LL1流程步骤定义
const ll1Steps = [
  {
    id: 1,
    name: 'GRAMMAR',
    title: '输入文法',
    description: '定义上下文无关文法',
    color: '#10B981',
    component: 'GrammarInput'
  },
  {
    id: 2,
    name: 'FIRST/FOLLOW',
    title: 'First集和Follow集',
    description: '集合提取',
    color: '#059669',
    component: 'FirstFollowSets'
  },
  {
    id: 3,
    name: 'LL1-TABLE',
    title: 'LL1分析表',
    description: '表格构建',
    color: '#047857',
    component: 'LL1TableBuild'
  },
  {
    id: 4,
    name: 'ANALYSIS',
    title: '字符串分析结果',
    description: '语法分析',
    color: '#065f46',
    component: 'StringAnalysis'
  }
]

// 组件映射
const componentMap = {
  GrammarInput,
  FirstFollowSets,
  LL1TableBuild,
  StringAnalysis
}

// 当前步骤
const currentStep = ref(1)

// 计算当前步骤组件
const currentStepComponent = computed(() => {
  const step = ll1Steps.find(s => s.id === currentStep.value)
  return step ? componentMap[step.component as keyof typeof componentMap] : GrammarInput
})

// 导航到指定步骤
const navigateToStep = (stepId: number) => {
  currentStep.value = stepId
  router.push({ query: { step: stepId } })
}

// 下一步
const nextStep = () => {
  if (currentStep.value < ll1Steps.length) {
    navigateToStep(currentStep.value + 1)
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 1) {
    navigateToStep(currentStep.value - 1)
  }
}

// 步骤完成回调
const onStepComplete = (data: any) => {
  console.log('LL1 Step completed:', currentStep.value, data)
}

// 重置进度
const resetProgress = () => {
  if (confirm('确定要重置所有进度吗？')) {
    navigateToStep(1)
  }
}

// 组件挂载时从路由获取步骤
onMounted(() => {
  const step = Number(route.query.step) || 1
  if (step >= 1 && step <= ll1Steps.length) {
    currentStep.value = step
  }
})
</script>

<style scoped>
/* 页面切换动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
