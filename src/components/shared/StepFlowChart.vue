<template>
  <div class="step-flow-chart">
    <div class="relative">
      <!-- SVG路径背景 -->
      <svg
        ref="svgRef"
        class="absolute inset-0 w-full h-24 pointer-events-none"
        viewBox="0 0 1200 96"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d1d5db;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- 连接路径 -->
        <path
          ref="pathRef"
          :d="pathData"
          stroke="url(#pathGradient)"
          stroke-width="3"
          fill="none"
          class="transition-all duration-1000"
        />

        <!-- 进度路径 -->
        <path
          ref="progressPathRef"
          :d="pathData"
          stroke="url(#progressGradient)"
          stroke-width="4"
          fill="none"
          stroke-dasharray="1000"
          :stroke-dashoffset="progressOffset"
          class="transition-all duration-1000 ease-out"
        />

        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>

      <!-- 步骤节点 -->
      <div class="relative flex justify-between items-center h-24 px-4">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="step-node-container flex flex-col items-center"
          :style="{ zIndex: 10 }"
        >
          <!-- 步骤圆圈 -->
          <button
            @click="$emit('step-click', step.id)"
            :class="[
              'step-node relative w-12 h-12 rounded-full border-3 transition-all duration-300',
              'flex items-center justify-center text-sm font-bold',
              'hover:scale-110 focus:outline-none focus:ring-4 focus:ring-opacity-20',
              getStepClasses(step, index)
            ]"
            :style="{
              backgroundColor: isStepActive(step.id) ? step.color : 'white',
              borderColor: isStepCompleted(step.id) ? step.color : (isStepActive(step.id) ? step.color : '#e5e7eb'),
              color: isStepActive(step.id) || isStepCompleted(step.id) ? 'white' : '#6b7280'
            }"
          >
            <!-- 完成状态图标 -->
            <Icon
              v-if="isStepCompleted(step.id)"
              icon="lucide:check"
              class="w-5 h-5"
            />
            <!-- 当前步骤脉冲效果 -->
            <div
              v-else-if="isStepActive(step.id)"
              class="absolute inset-0 rounded-full animate-ping"
              :style="{ backgroundColor: step.color, opacity: 0.2 }"
            />
            <!-- 步骤编号 -->
            <span v-else>{{ step.id }}</span>
          </button>

          <!-- 步骤信息 -->
          <div class="mt-3 text-center max-w-24">
            <div
              :class="[
                'text-xs font-semibold transition-colors duration-300',
                isStepActive(step.id) ? 'text-gray-900' : 'text-gray-600'
              ]"
            >
              {{ step.name }}
            </div>
            <div
              :class="[
                'text-xs mt-1 transition-colors duration-300',
                isStepActive(step.id) ? 'text-gray-700' : 'text-gray-500'
              ]"
            >
              {{ step.description }}
            </div>
          </div>

          <!-- 箭头指示器 (除了最后一个步骤) -->
          <div
            v-if="index < steps.length - 1"
            class="absolute left-full top-6 transform -translate-y-1/2 ml-2"
            style="z-index: 5;"
          >
            <Icon
              icon="lucide:arrow-right"
              :class="[
                'w-5 h-5 transition-all duration-300',
                isStepCompleted(step.id) ? 'text-blue-500 animate-pulse' : 'text-gray-300'
              ]"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 算法说明 -->
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">
        {{ getCurrentStepDescription() }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { gsap } from 'gsap'

interface Step {
  id: number
  name: string
  title: string
  description: string
  color: string
  component: string
}

interface Props {
  steps: Step[]
  currentStep: number
}

const props = defineProps<Props>()

defineEmits<{
  'step-click': [stepId: number]
}>()

const svgRef = ref<SVGElement>()
const pathRef = ref<SVGPathElement>()
const progressPathRef = ref<SVGPathElement>()

// 生成弧形路径数据
const pathData = computed(() => {
  const numSteps = props.steps.length
  const width = 1200
  const height = 96
  const stepWidth = width / (numSteps - 1)

  let path = `M 0,${height / 2}`

  for (let i = 1; i < numSteps; i++) {
    const x = i * stepWidth
    const y = height / 2
    const controlY = height / 2 - 20 // 向上的弧度

    const prevX = (i - 1) * stepWidth
    const midX = (prevX + x) / 2

    path += ` Q ${midX},${controlY} ${x},${y}`
  }

  return path
})

// 进度偏移量
const progressOffset = computed(() => {
  const totalLength = 1000 // 假设路径总长度
  const progress = Math.max(0, (props.currentStep - 1) / (props.steps.length - 1))
  return totalLength - (totalLength * progress)
})

// 判断步骤状态
const isStepActive = (stepId: number) => stepId === props.currentStep
const isStepCompleted = (stepId: number) => stepId < props.currentStep

// 获取步骤样式类
const getStepClasses = (step: Step, index: number) => {
  if (isStepActive(step.id)) {
    return 'shadow-lg transform scale-110'
  } else if (isStepCompleted(step.id)) {
    return 'shadow-md'
  } else {
    return 'shadow-sm'
  }
}

// 获取当前步骤描述
const getCurrentStepDescription = () => {
  const currentStepObj = props.steps.find(s => s.id === props.currentStep)
  return currentStepObj ?
    `第${props.currentStep}步：${currentStepObj.title} - ${currentStepObj.description}` :
    '请选择一个步骤开始'
}

// 步骤切换动画
watch(() => props.currentStep, (newStep, oldStep) => {
  nextTick(() => {
    // 节点动画
    const stepNodes = document.querySelectorAll('.step-node')
    stepNodes.forEach((node, index) => {
      const stepId = index + 1
      if (stepId === newStep) {
        gsap.fromTo(node,
          { scale: 1, rotation: 0 },
          { scale: 1.1, rotation: 360, duration: 0.6, ease: "back.out(1.7)" }
        )
      }
    })
  })
})

onMounted(() => {
  // 初始化动画
  nextTick(() => {
    const timeline = gsap.timeline()

    // 路径绘制动画
    if (pathRef.value) {
      const pathLength = pathRef.value.getTotalLength()
      gsap.set(pathRef.value, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength
      })

      timeline.to(pathRef.value, {
        strokeDashoffset: 0,
        duration: 2,
        ease: "power2.out"
      })
    }

    // 节点依次出现
    const stepNodes = document.querySelectorAll('.step-node-container')
    timeline.fromTo(stepNodes,
      { opacity: 0, y: 20, scale: 0.8 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.7)"
      },
      "-=1.5"
    )
  })
})
</script>

<style scoped>
.step-flow-chart {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  border: 1px solid rgb(243 244 246);
}

.step-node {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-node:hover {
  transform: scale(1.05);
}

.step-node-container {
  position: relative;
  min-width: 96px;
}

/* 自定义脉冲动画 */
@keyframes pulse-custom {
  0%, 100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.1);
  }
}

.animate-ping {
  animation: pulse-custom 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
