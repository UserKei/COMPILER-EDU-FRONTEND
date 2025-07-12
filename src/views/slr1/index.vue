<template>
  <div class="slr1-analysis">
    <div class="analysis-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="text-3xl font-bold text-gray-900">SLR1 语法分析</h1>
          <p class="text-gray-600 mt-2">
            SLR1是LR0的改进版本，通过引入FOLLOW集减少冲突，提高语法分析的准确性
          </p>
        </div>
        <div class="badge">
          <Icon icon="lucide:zap" class="w-5 h-5" />
          <span>改进分析</span>
        </div>
      </div>
    </div>

    <div class="flow-section">
      <StepFlowChart :steps="slr1Steps" :current-step="currentStep" @step-click="handleStepClick" />
    </div>

    <div class="step-container">
      <Transition name="step-slide" mode="out-in">
        <component :is="currentStepComponent" @next-step="nextStep" @prev-step="prevStep" @complete="completeAnalysis" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import StepFlowChart from '@/components/shared/StepFlowChart.vue'

// 动态导入所有步骤组件
const stepComponents = {
  'GrammarInput': () => import('./steps/01-GrammarInput.vue'),
  'ItemSetConstruction': () => import('./steps/02-ItemSetConstruction.vue'),
  'FollowSetCalculation': () => import('./steps/03-FollowSetCalculation.vue'),
  'SLR1TableBuild': () => import('./steps/04-SLR1TableBuild.vue'),
  'StringAnalysis': () => import('./steps/05-StringAnalysis.vue')
}

const slr1Steps = [
  { id: 1, name: '文法输入', title: '文法输入', key: 'GrammarInput', description: '输入SLR1文法并进行预处理', color: '#3b82f6', component: 'GrammarInput' },
  { id: 2, name: '项目集构造', title: '项目集构造', key: 'ItemSetConstruction', description: '构造LR0项目集规范族', color: '#8b5cf6', component: 'ItemSetConstruction' },
  { id: 3, name: 'FOLLOW集计算', title: 'FOLLOW集计算', key: 'FollowSetCalculation', description: '计算非终结符的FOLLOW集', color: '#10b981', component: 'FollowSetCalculation' },
  { id: 4, name: 'SLR1表构建', title: 'SLR1表构建', key: 'SLR1TableBuild', description: '构建SLR1分析表', color: '#f59e0b', component: 'SLR1TableBuild' },
  { id: 5, name: '字符串分析', title: '字符串分析', key: 'StringAnalysis', description: '使用SLR1分析表分析字符串', color: '#ef4444', component: 'StringAnalysis' }
]

const route = useRoute()
const router = useRouter()

// 根据路由参数初始化当前步骤
const initializeCurrentStep = () => {
  const stepParam = route.params.step as string
  if (stepParam) {
    const stepNumber = parseInt(stepParam)
    if (stepNumber >= 1 && stepNumber <= slr1Steps.length) {
      return stepNumber
    }
  }
  return 1
}

const currentStep = ref(initializeCurrentStep())

// 监听路由变化
watch(() => route.params.step, (newStep) => {
  if (newStep) {
    const stepNumber = parseInt(newStep as string)
    if (stepNumber >= 1 && stepNumber <= slr1Steps.length) {
      currentStep.value = stepNumber
    }
  }
})

const currentStepComponent = computed(() => {
  const step = slr1Steps.find(s => s.id === currentStep.value)
  return step ? stepComponents[step.key as keyof typeof stepComponents] : null
})

const nextStep = () => {
  if (currentStep.value < slr1Steps.length) {
    const nextStepNum = currentStep.value + 1
    router.push(`/slr1/${nextStepNum}`)
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    const prevStepNum = currentStep.value - 1
    router.push(`/slr1/${prevStepNum}`)
  }
}

const handleStepClick = (stepId: number) => {
  router.push(`/slr1/${stepId}`)
}

const completeAnalysis = (data: any) => {
  console.log('SLR1 Analysis completed:', data)
  // 可以添加完成后的逻辑
}
</script>

<style scoped>
.slr1-analysis {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.analysis-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef3c7;
  color: #d97706;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

.flow-section {
  background: white;
  padding: 3rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.step-container {
  background: white;
  min-height: 60vh;
}

.step-slide-enter-active,
.step-slide-leave-active {
  transition: all 0.3s ease;
}

.step-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.step-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
