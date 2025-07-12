<template>
  <div class="lr0-analysis">
    <div class="analysis-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="text-3xl font-bold text-gray-900">LR0 语法分析</h1>
          <p class="text-gray-600 mt-2">
            LR0是一种自底向上的语法分析方法，通过构造项目集规范族和LR分析表进行语法分析
          </p>
        </div>
        <div class="badge">
          <Icon icon="lucide:layers" class="w-5 h-5" />
          <span>自底向上分析</span>
        </div>
      </div>
    </div>

    <div class="flow-section">
      <StepFlowChart :steps="lr0Steps" :current-step="currentStep" @step-click="handleStepClick" />
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
  'LR0TableBuild': () => import('./steps/03-LR0TableBuild.vue'),
  'StringAnalysis': () => import('./steps/04-StringAnalysis.vue')
}

const lr0Steps = [
  { id: 1, name: '文法输入', title: '文法输入', key: 'GrammarInput', description: '输入LR0文法并进行预处理', color: '#3b82f6', component: 'GrammarInput' },
  { id: 2, name: '项目集构造', title: '项目集构造', key: 'ItemSetConstruction', description: '构造LR0项目集规范族', color: '#8b5cf6', component: 'ItemSetConstruction' },
  { id: 3, name: 'LR0表构建', title: 'LR0表构建', key: 'LR0TableBuild', description: '构建LR0分析表', color: '#10b981', component: 'LR0TableBuild' },
  { id: 4, name: '字符串分析', title: '字符串分析', key: 'StringAnalysis', description: '使用LR0分析表分析字符串', color: '#f59e0b', component: 'StringAnalysis' }
]

const route = useRoute()
const router = useRouter()

// 根据路由参数初始化当前步骤
const initializeCurrentStep = () => {
  const stepParam = route.params.step as string
  if (stepParam) {
    const stepNumber = parseInt(stepParam)
    if (stepNumber >= 1 && stepNumber <= lr0Steps.length) {
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
    if (stepNumber >= 1 && stepNumber <= lr0Steps.length) {
      currentStep.value = stepNumber
    }
  }
})

const currentStepComponent = computed(() => {
  const step = lr0Steps.find(s => s.id === currentStep.value)
  return step ? stepComponents[step.key as keyof typeof stepComponents] : null
})

const nextStep = () => {
  if (currentStep.value < lr0Steps.length) {
    const nextStepNum = currentStep.value + 1
    router.push(`/lr0/${nextStepNum}`)
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    const prevStepNum = currentStep.value - 1
    router.push(`/lr0/${prevStepNum}`)
  }
}

const handleStepClick = (stepId: number) => {
  router.push(`/lr0/${stepId}`)
}

const completeAnalysis = (data: any) => {
  console.log('LR0 Analysis completed:', data)
  // 可以添加完成后的逻辑
}
</script>

<style scoped>
.lr0-analysis {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: #f3e8ff;
  color: #7c3aed;
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
