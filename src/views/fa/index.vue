<template>
  <div class="fa-layout h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- 头部导航 -->
    <header class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link to="/" class="text-2xl font-bold text-blue-600 hover:text-blue-800 transition-colors">
              编译原理可视化
            </router-link>
            <span class="text-gray-400">|</span>
            <h1 class="text-xl font-semibold text-gray-800">有限自动机 (FA)</h1>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="resetProgress"
              class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              重置进度
            </button>
            <router-link
              to="/ll1"
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              LL1分析 →
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
          :steps="faSteps"
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
import RegexInput from './steps/01-RegexInput.vue'
import NFADraw from './steps/02-NFADraw.vue'
import SubsetConstruction from './steps/03-SubsetConstruction.vue'
import DFADraw from './steps/04-DFADraw.vue'
import DFAMinimization from './steps/05-DFAMinimization.vue'
import MinimizedDFADraw from './steps/06-MinimizedDFADraw.vue'

const router = useRouter()
const route = useRoute()

// FA流程步骤定义
const faSteps = [
  {
    id: 1,
    name: 'REGEX',
    title: '正则表达式',
    description: '输入正则表达式',
    color: '#3B82F6',
    component: 'RegexInput'
  },
  {
    id: 2,
    name: 'NFA',
    title: '非确定有限自动机',
    description: 'Thompson构造',
    color: '#8B5CF6',
    component: 'NFADraw'
  },
  {
    id: 3,
    name: 'TABLE',
    title: '转换表和状态矩阵',
    description: '子集构造法',
    color: '#10B981',
    component: 'SubsetConstruction'
  },
  {
    id: 4,
    name: 'DFA',
    title: '确定有限自动机',
    description: '转换构造',
    color: '#F59E0B',
    component: 'DFADraw'
  },
  {
    id: 5,
    name: 'MIN-DFA',
    title: '最小化DFA',
    description: 'Hopcroft算法',
    color: '#EF4444',
    component: 'DFAMinimization'
  },
  {
    id: 6,
    name: 'RESULT',
    title: '最小化DFA图',
    description: '可视化绘制',
    color: '#6366F1',
    component: 'MinimizedDFADraw'
  }
]

// 组件映射
const componentMap = {
  RegexInput,
  NFADraw,
  SubsetConstruction,
  DFADraw,
  DFAMinimization,
  MinimizedDFADraw
}

// 当前步骤
const currentStep = ref(1)

// 计算当前步骤组件
const currentStepComponent = computed(() => {
  const step = faSteps.find(s => s.id === currentStep.value)
  return step ? componentMap[step.component as keyof typeof componentMap] : RegexInput
})

// 导航到指定步骤
const navigateToStep = (stepId: number) => {
  currentStep.value = stepId
  router.push({ query: { step: stepId } })
}

// 下一步
const nextStep = () => {
  if (currentStep.value < faSteps.length) {
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
  console.log('Step completed:', currentStep.value, data)
  // 这里可以保存步骤数据到状态管理
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
  if (step >= 1 && step <= faSteps.length) {
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
