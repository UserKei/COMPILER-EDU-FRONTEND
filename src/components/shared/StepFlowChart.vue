<template>
  <div class="step-flow-chart">
    <!-- 简化的时间线导航 -->
    <div ref="timelineContainerRef" class="timeline-container relative">
      <!-- 背景进度条 -->
      <div
        ref="progressBackgroundRef"
        class="progress-background absolute h-1 bg-gray-200 rounded-full"
        style="transform: translateY(-50%)"
      ></div>

      <!-- 激活的进度条 -->
      <div
        ref="progressActiveRef"
        class="progress-active absolute h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700 ease-out"
        style="transform: translateY(-50%)"
      ></div>

      <!-- 步骤按钮 -->
      <div class="flex items-center justify-between px-4 py-4">
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          @click="$emit('step-click', step.id)"
          :class="[
            'step-button relative transition-all duration-300 ease-out',
            'flex flex-col items-center cursor-pointer group z-10',
            'hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200',
            {
              'active': isStepActive(step.id),
              'completed': isStepCompleted(step.id)
            }
          ]"
          :aria-label="`Go to ${step.name}`"
        >
          <!-- 步骤圆圈 -->
          <div
            :class="[
              'step-circle w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-300',
              'text-xs font-bold relative',
              {
                'bg-blue-500 border-blue-500 text-white scale-110 shadow-lg': isStepActive(step.id),
                'bg-green-500 border-green-500 text-white': isStepCompleted(step.id),
                'bg-white border-gray-300 text-gray-500 hover:border-gray-400': !isStepActive(step.id) && !isStepCompleted(step.id)
              }
            ]"
          >
            <!-- 完成状态图标 -->
            <Icon
              v-if="isStepCompleted(step.id)"
              icon="lucide:check"
              class="w-4 h-4"
            />
            <!-- 当前步骤脉冲效果 -->
            <div
              v-else-if="isStepActive(step.id)"
              class="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"
            />
            <!-- 步骤编号 -->
            <span v-else>{{ step.id }}</span>
          </div>

          <!-- 步骤标签 -->
          <span
            :class="[
              'step-label text-xs font-medium mt-2 transition-colors duration-300 text-center max-w-20',
              {
                'text-blue-600 font-semibold': isStepActive(step.id),
                'text-green-600': isStepCompleted(step.id),
                'text-gray-500': !isStepActive(step.id) && !isStepCompleted(step.id)
              }
            ]"
          >
            {{ step.name }}
          </span>

          <!-- 悬停提示 -->
          <span
            class="tooltip absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30"
          >
            {{ step.title }}
          </span>
        </button>
      </div>

      <!-- 动态指示器球 -->
      <div
        ref="ballRef"
        class="progress-ball absolute w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg transition-all duration-500 ease-out z-20"
        :style="ballStyle"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-ping opacity-25"></div>
      </div>
    </div>

    <!-- 当前步骤信息 -->
    <div class="step-info mt-6 text-center">
      <div v-if="getCurrentStep()" class="space-y-2">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ getCurrentStep()?.title }}
        </h3>
        <p class="text-sm text-gray-600">
          {{ getCurrentStep()?.description }}
        </p>
      </div>
      <div v-else class="text-sm text-gray-500">
        请选择一个步骤开始
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
const ballRef = ref<HTMLElement>()
const timelineContainerRef = ref<HTMLElement>()
const progressBackgroundRef = ref<HTMLElement>()
const progressActiveRef = ref<HTMLElement>()

// 强制更新位置的函数
const updatePositions = () => {
  if (!ballRef.value || !timelineContainerRef.value) return

  // 强制重新计算并设置球的位置
  const newLeft = getButtonPosition(props.currentStep)
  const newTop = getButtonVerticalCenter()
  ballRef.value.style.left = `${newLeft}%`
  ballRef.value.style.top = `${newTop}px`

  // 强制重新计算进度条位置
  if (progressBackgroundRef.value) {
    progressBackgroundRef.value.style.left = `${getFirstButtonPosition()}%`
    progressBackgroundRef.value.style.width = `${getProgressBarWidth()}%`
    progressBackgroundRef.value.style.top = `${getButtonVerticalCenter()}px`
  }

  if (progressActiveRef.value) {
    progressActiveRef.value.style.left = `${getFirstButtonPosition()}%`
    progressActiveRef.value.style.width = `${getActiveProgressWidth()}%`
    progressActiveRef.value.style.top = `${getButtonVerticalCenter()}px`
  }
}

// 动态计算按钮位置
const getButtonPosition = (stepId: number) => {
  if (!timelineContainerRef.value) return 50

  const container = timelineContainerRef.value
  const buttons = container.querySelectorAll('.step-button')
  const targetButton = buttons[stepId - 1] // stepId 是1-based，数组是0-based

  if (!targetButton || !container) return 50

  const containerRect = container.getBoundingClientRect()
  const buttonRect = targetButton.getBoundingClientRect()

  // 计算按钮中心相对于容器的位置百分比
  const buttonCenter = buttonRect.left + buttonRect.width / 2
  const containerLeft = containerRect.left
  const containerWidth = containerRect.width

  const relativePosition = (buttonCenter - containerLeft) / containerWidth
  return Math.max(0, Math.min(100, relativePosition * 100))
}

// 动态获取按钮圆圈的垂直中心位置
const getButtonVerticalCenter = () => {
  if (!timelineContainerRef.value) return 32 // 默认 2rem

  const container = timelineContainerRef.value
  const firstButton = container.querySelector('.step-button')
  const firstCircle = firstButton?.querySelector('.step-circle')

  if (!firstCircle || !container) return 32

  const containerRect = container.getBoundingClientRect()
  const circleRect = firstCircle.getBoundingClientRect()

  // 计算圆圈中心相对于容器顶部的像素位置
  const circleCenter = circleRect.top + circleRect.height / 2
  const containerTop = containerRect.top

  return circleCenter - containerTop
}

// 动态获取第一个按钮的位置
const getFirstButtonPosition = () => {
  return getButtonPosition(1)
}

// 动态获取最后一个按钮的位置
const getLastButtonPosition = () => {
  return getButtonPosition(props.steps.length)
}

// 获取进度条总宽度
const getProgressBarWidth = () => {
  const firstPos = getFirstButtonPosition()
  const lastPos = getLastButtonPosition()
  return lastPos - firstPos
}

// 获取当前激活进度条的宽度
const getActiveProgressWidth = () => {
  if (props.steps.length <= 1) return 0
  const currentPos = getButtonPosition(props.currentStep)
  const firstPos = getFirstButtonPosition()
  return Math.max(0, currentPos - firstPos)
}

// Google AI Journey 风格的颜色配置
const colors = {
  primary: '#4285F4',    // Google Blue
  success: '#34A853',    // Google Green
  warning: '#FCC924',    // Google Yellow
  background: '#e5e7eb', // Gray background
  active: '#8b5cf6'      // Purple for active state
}

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

// 判断是否为重要步骤 (类似 Google 的 markerLarge)
const isImportantStep = (stepId: number) => {
  // 可以根据业务逻辑定义重要步骤，这里简单以奇数步骤为例
  return stepId % 2 === 1 || stepId === props.steps.length
}

// 获取下一步的颜色 (类似 Google 的 bar-color)
const getNextStepColor = (stepId: number) => {
  const step = props.steps.find(s => s.id === stepId)
  const nextStep = props.steps.find(s => s.id === stepId + 1)

  if (!nextStep) return 'transparent'

  // 根据步骤类型返回不同颜色
  if (isStepCompleted(stepId)) {
    return colors.success
  } else if (isStepActive(stepId)) {
    return colors.primary
  }
  return colors.background
}

// 球形指示器位置计算
const ballPosition = computed(() => {
  const progress = Math.max(0, (props.currentStep - 1) / (props.steps.length - 1))
  return `translateX(${progress * 100}%)`
})

// 进度百分比计算
const progressPercentage = computed(() => {
  if (props.steps.length <= 1) return 0
  const progress = Math.max(0, (props.currentStep - 1) / (props.steps.length - 1))
  return progress * 100
})

// 球形指示器样式计算
const ballStyle = computed(() => {
  if (props.steps.length <= 1) {
    return {
      top: getButtonVerticalCenter() + 'px',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  // 直接获取当前步骤按钮的实际位置
  const leftPercentage = getButtonPosition(props.currentStep)

  return {
    top: getButtonVerticalCenter() + 'px',
    left: `${leftPercentage}%`,
    transform: 'translate(-50%, -50%)'
  }
})

// 获取当前步骤对象
const getCurrentStep = () => {
  return props.steps.find(s => s.id === props.currentStep)
}

// 步骤切换动画
watch(() => props.currentStep, (newStep, oldStep) => {
  nextTick(() => {
    // 先更新位置
    updatePositions()

    // 球形指示器动画
    if (ballRef.value) {
      gsap.to(ballRef.value, {
        scale: 1.2,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
        onComplete: () => {
          // 动画完成后再次更新位置确保准确
          updatePositions()
        }
      })
    }

    // 进度条动画
    if (progressActiveRef.value) {
      gsap.to(progressActiveRef.value, {
        scaleX: 1.02,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      })
    }

    // 步骤按钮动画
    const stepButtons = document.querySelectorAll('.step-button')
    stepButtons.forEach((button, index) => {
      const stepId = index + 1
      if (stepId === newStep) {
        // 当前步骤的激活动画
        gsap.to(button, {
          scale: 1.1,
          y: -4,
          duration: 0.4,
          ease: "back.out(1.7)"
        })
      } else if (stepId === oldStep) {
        // 之前步骤的退出动画
        gsap.to(button, {
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out"
        })
      }
    })
  })
})

// 监听步骤变化，重新计算位置
watch([() => props.currentStep, () => props.steps.length], () => {
  nextTick(() => {
    // 确保DOM渲染完成后再计算位置
    setTimeout(() => {
      updatePositions()
    }, 10) // 给一个小延迟确保DOM完全更新
  })
}, { flush: 'post' })

onMounted(() => {
  // 初始化动画序列
  nextTick(() => {
    const timeline = gsap.timeline()

    // 1. 容器淡入
    timeline.fromTo('.step-flow-chart',
      { opacity: 0, y: 20, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      }
    )

    // 2. 背景进度条出现
    timeline.fromTo('.progress-background',
      { scaleX: 0, transformOrigin: 'left' },
      {
        scaleX: 1,
        duration: 0.5,
        ease: "power2.out"
      },
      "-=0.3"
    )

    // 3. 步骤按钮依次出现
    const stepButtons = document.querySelectorAll('.step-button')
    timeline.fromTo(stepButtons,
      {
        opacity: 0,
        y: 30,
        scale: 0.8
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(1.7)"
      },
      "-=0.2"
    )

    // 4. 激活进度条出现
    timeline.fromTo('.progress-active',
      { scaleX: 0, transformOrigin: 'left' },
      {
        scaleX: 1,
        duration: 0.6,
        ease: "power2.out"
      },
      "-=0.3"
    )

    // 5. 球形指示器出现
    if (ballRef.value) {
      timeline.fromTo(ballRef.value,
        {
          opacity: 0,
          scale: 0
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "back.out(2)"
        },
        "-=0.4"
      )
    }

    // 6. 步骤信息淡入
    timeline.fromTo('.step-info',
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out"
      },
      "-=0.2"
    )

    // 在动画完成后，立即更新位置
    timeline.call(() => {
      // 延迟一下确保所有DOM都渲染完成
      setTimeout(() => {
        updatePositions()
        // 再次确保位置正确，多次调用确保准确性
        setTimeout(updatePositions, 100)
        setTimeout(updatePositions, 300)
      }, 50)
    })
  })

  // 监听窗口大小变化
  const handleResize = () => {
    setTimeout(updatePositions, 100)
  }
  window.addEventListener('resize', handleResize)

  // 清理事件监听器
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})
</script>

<style scoped>
.step-flow-chart {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -2px rgb(0 0 0 / 0.05);
  border: 1px solid rgb(226 232 240);
  position: relative;
}

.timeline-container {
  position: relative;
  min-height: 120px;
  overflow: hidden; /* 防止子元素溢出 */
}

/* 背景进度条 */
.progress-background {
  z-index: 1;
}

/* 激活进度条 */
.progress-active {
  z-index: 2;
  box-shadow: 0 0 8px rgb(59 130 246 / 0.3);
}

/* 步骤按钮样式 */
.step-button {
  position: relative;
  padding: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
  z-index: 10;
}

.step-button:hover {
  transform: scale(1.05) translateY(-2px);
}

.step-button.active {
  transform: scale(1.1) translateY(-4px);
}

.step-button.completed {
  opacity: 0.9;
}

/* 步骤圆圈 */
.step-circle {
  position: relative;
  z-index: 15;
}

.step-button.active .step-circle {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* 步骤标签 */
.step-label {
  line-height: 1.2;
}

/* 悬停提示 */
.tooltip {
  backdrop-filter: blur(8px);
  z-index: 50;
}

/* 进度球 */
.progress-ball {
  z-index: 20;
  animation: ball-glow 3s ease-in-out infinite;
  /* 确保球不会超出容器边界 */
  max-width: calc(100% - 1rem);
}

/* 步骤信息区域 */
.step-info {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
}

/* 动画定义 */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgb(59 130 246 / 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgb(59 130 246 / 0);
  }
}

@keyframes ball-glow {
  0%, 100% {
    box-shadow:
      0 4px 12px rgb(66 133 244 / 0.3),
      0 0 20px rgb(139 92 246 / 0.2);
  }
  50% {
    box-shadow:
      0 6px 16px rgb(66 133 244 / 0.4),
      0 0 30px rgb(139 92 246 / 0.3);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .step-flow-chart {
    padding: 1rem;
  }

  .step-button {
    padding: 0.25rem;
  }

  .step-label {
    font-size: 0.625rem;
  }

  .timeline-container {
    min-height: 100px;
  }

  .step-circle {
    width: 1.5rem;
    height: 1.5rem;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .step-button,
  .progress-active,
  .progress-ball {
    transition: none;
    animation: none;
  }
}
</style>
