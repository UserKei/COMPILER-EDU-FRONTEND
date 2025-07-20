<template>
  <div class="nfa-draw-step">
    <!-- 步骤头部 -->
    <div class="step-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="step-icon">
            <Icon icon="lucide:git-branch" class="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">构造 NFA (Thompson 构造法)</h2>
            <p class="text-gray-600 mt-1">第二步：使用 Thompson 构造法将正则表达式转换为非确定有限自动机</p>
          </div>
        </div>
        <div class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
          正则表达式: <code class="font-mono">{{ regexPattern }}</code>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="step-content">
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- 左侧：构造步骤 -->
        <div class="construction-steps">
          <div class="bg-gray-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">构造步骤</h3>

            <div class="space-y-3">
              <div
                v-for="(step, index) in constructionSteps"
                :key="index"
                :class="[
                  'p-3 rounded-lg border transition-all duration-300',
                  index <= currentConstructionStep
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                ]"
              >
                <div class="flex items-start gap-3">
                  <div
                    :class="[
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index <= currentConstructionStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    ]"
                  >
                    {{ index + 1 }}
                  </div>
                  <div class="flex-1">
                    <p
                      :class="[
                        'font-medium',
                        index <= currentConstructionStep ? 'text-blue-900' : 'text-gray-700'
                      ]"
                    >
                      {{ step.title }}
                    </p>
                    <p
                      :class="[
                        'text-sm mt-1',
                        index <= currentConstructionStep ? 'text-blue-700' : 'text-gray-500'
                      ]"
                    >
                      {{ step.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 flex gap-2">
              <button
                @click="startConstruction"
                :disabled="isConstructing"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition-colors',
                  isConstructing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                ]"
              >
                <Icon
                  :icon="isConstructing ? 'lucide:loader-2' : 'lucide:play'"
                  :class="['w-4 h-4 inline mr-2', isConstructing ? 'animate-spin' : '']"
                />
                {{ isConstructing ? '构造中...' : '开始构造' }}
              </button>
              <button
                @click="resetConstruction"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon icon="lucide:rotate-ccw" class="w-4 h-4 inline mr-2" />
                重置
              </button>
            </div>
          </div>
        </div>

        <!-- 中间：NFA 画布 -->
        <div class="nfa-canvas-area xl:col-span-2">
          <div class="bg-white border border-gray-200 rounded-lg h-96">
            <div class="h-full relative">
              <!-- 画布头部 -->
              <div class="border-b border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-gray-900">NFA 状态图</h3>
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    <Icon icon="lucide:info" class="w-4 h-4" />
                    <span>Thompson 构造结果</span>
                  </div>
                </div>
              </div>

              <!-- 画布主体 -->
              <div class="h-full p-4">
                <NFACanvas ref="nfaCanvasRef" />
              </div>
            </div>
          </div>

          <!-- 构造信息 -->
          <div v-if="constructionResult" class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="lucide:check-circle" class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="font-medium text-green-800">NFA 构造完成</h4>
                <div class="text-sm text-green-700 mt-2 space-y-1">
                  <p>• 状态数量: {{ constructionResult.stateCount }}</p>
                  <p>• 转换数量: {{ constructionResult.transitionCount }}</p>
                  <p>• 初始状态: {{ constructionResult.initialState }}</p>
                  <p>• 接受状态: {{ constructionResult.finalStates.join(', ') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤操作栏 -->
    <div class="step-actions">
      <div class="flex justify-between items-center">
        <button
          @click="$emit('prev-step')"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Icon icon="lucide:chevron-left" class="w-4 h-4 inline mr-2" />
          上一步
        </button>

        <div class="text-sm text-gray-500">
          步骤 2 / 6
        </div>

        <button
          @click="proceedToNext"
          :disabled="!isConstructionComplete"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            isConstructionComplete
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          下一步
          <Icon icon="lucide:chevron-right" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import NFACanvas from '@/components/flow/canvas/NFACanvas.vue'
import type { FAResult } from '@/types'

defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 从上一步获取数据
const regexPattern = ref('')
const faData = ref<FAResult | null>(null)
const nfaDotString = ref('')

// 从localStorage获取上一步的数据
onMounted(() => {
  try {
    const savedData = localStorage.getItem('fa-step1-data')
    if (savedData) {
      const stepData = JSON.parse(savedData)
      regexPattern.value = stepData.regex || ''
      faData.value = stepData.faResult || null
      nfaDotString.value = stepData.faResult?.NFA_dot_str || ''
    }
  } catch (error) {
    console.error('读取上一步数据失败：', error)
  }
})

// 构造步骤定义
const constructionSteps = [
  {
    title: '解析正则表达式',
    description: '将正则表达式解析为语法树'
  },
  {
    title: '基本状态构造',
    description: '为每个基本符号创建状态'
  },
  {
    title: '连接操作处理',
    description: '处理连接操作，连接相邻的自动机'
  },
  {
    title: '选择操作处理',
    description: '处理选择操作（|），创建分支'
  },
  {
    title: '闭包操作处理',
    description: '处理闭包操作（*和+）'
  },
  {
    title: '最终优化',
    description: '优化状态转换，生成最终NFA'
  }
]

// 当前构造步骤
const currentConstructionStep = ref(-1)
const isConstructing = ref(false)
const constructionResult = ref<{
  stateCount: number
  transitionCount: number
  initialState: string
  finalStates: string[]
} | null>(null)

// NFA 画布引用
const nfaCanvasRef = ref<InstanceType<typeof NFACanvas>>()

// 是否构造完成
const isConstructionComplete = computed(() => {
  return constructionResult.value !== null
})

// 开始构造
const startConstruction = async () => {
  if (isConstructing.value) return

  isConstructing.value = true
  currentConstructionStep.value = -1
  constructionResult.value = null

  // 清空画布
  if (nfaCanvasRef.value) {
    nfaCanvasRef.value.clearCanvas()
  }

  // 模拟构造过程
  for (let i = 0; i < constructionSteps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 800))
    currentConstructionStep.value = i

    // 在画布上添加相应的状态和转换
    await simulateConstructionStep(i)
  }

  // 构造完成
  await new Promise(resolve => setTimeout(resolve, 500))
  isConstructing.value = false

  // 设置构造结果
  constructionResult.value = {
    stateCount: 8,
    transitionCount: 10,
    initialState: 'q0',
    finalStates: ['q7']
  }
}

// 模拟构造步骤
const simulateConstructionStep = async (step: number) => {
  if (!nfaCanvasRef.value) return

  const canvas = nfaCanvasRef.value

  switch (step) {
    case 0: // 解析正则表达式
      // 不需要在画布上显示
      break

    case 1: // 基本状态构造
      // 添加初始状态
      canvas.addNode({
        id: 'q0',
        type: 'circle',
        position: { x: 100, y: 200 },
        data: {
          label: 'q0',
          isInitial: true,
          isFinal: false
        }
      })
      break

    case 2: // 连接操作处理
      // 添加 'a' 转换的状态
      canvas.addNode({
        id: 'q1',
        type: 'circle',
        position: { x: 250, y: 200 },
        data: { label: 'q1' }
      })
      canvas.addEdge({
        id: 'e1',
        type: 'custom',
        source: 'q0',
        target: 'q1',
        data: { label: 'a' },
        markerEnd: 'url(#nfa-arrow)'
      })
      break

    case 3: // 选择操作处理
      // 添加 'b' 分支
      canvas.addNode({
        id: 'q2',
        type: 'circle',
        position: { x: 250, y: 100 },
        data: { label: 'q2' }
      })
      canvas.addEdge({
        id: 'e2',
        type: 'custom',
        source: 'q0',
        target: 'q2',
        data: { label: 'b' },
        markerEnd: 'url(#nfa-arrow)'
      })
      break

    case 4: // 闭包操作处理
      // 添加闭包状态
      canvas.addNode({
        id: 'q3',
        type: 'circle',
        position: { x: 400, y: 150 },
        data: { label: 'q3' }
      })
      // 添加 ε 转换
      canvas.addEdge({
        id: 'e3',
        type: 'custom',
        source: 'q1',
        target: 'q3',
        data: { label: 'ε' },
        markerEnd: 'url(#nfa-arrow)'
      })
      canvas.addEdge({
        id: 'e4',
        type: 'custom',
        source: 'q2',
        target: 'q3',
        data: { label: 'ε' },
        markerEnd: 'url(#nfa-arrow)'
      })
      break

    case 5: // 最终优化
      // 添加最终状态
      canvas.addNode({
        id: 'q7',
        type: 'circle',
        position: { x: 700, y: 200 },
        data: {
          label: 'q7',
          isFinal: true
        }
      })
      // 添加 'abb' 序列的其余部分
      const states = ['q4', 'q5', 'q6']
      const labels = ['a', 'b', 'b']

      for (let i = 0; i < states.length; i++) {
        canvas.addNode({
          id: states[i],
          type: 'circle',
          position: { x: 500 + i * 100, y: 200 },
          data: { label: states[i] }
        })

        const sourceId = i === 0 ? 'q3' : states[i - 1]
        canvas.addEdge({
          id: `e${5 + i}`,
          type: 'custom',
          source: sourceId,
          target: states[i],
          data: { label: labels[i] },
          markerEnd: 'url(#nfa-arrow)'
        })
      }

      // 最后连接到终态
      canvas.addEdge({
        id: 'e8',
        type: 'custom',
        source: 'q6',
        target: 'q7',
        data: { label: 'ε' },
        markerEnd: 'url(#nfa-arrow)'
      })
      break
  }
}

// 重置构造
const resetConstruction = () => {
  currentConstructionStep.value = -1
  isConstructing.value = false
  constructionResult.value = null

  if (nfaCanvasRef.value) {
    nfaCanvasRef.value.clearCanvas()
  }
}

// 进入下一步
const proceedToNext = () => {
  if (isConstructionComplete.value) {
    const stepData = {
      nfa: {
        states: nfaCanvasRef.value?.getNodes() || [],
        transitions: nfaCanvasRef.value?.getEdges() || [],
        ...constructionResult.value
      },
      timestamp: new Date().toISOString()
    }

    // 保存数据
    localStorage.setItem('fa-step2-data', JSON.stringify(stepData))

    // 进入下一步
    document.dispatchEvent(new CustomEvent('next-step'))
  }
}

// 组件挂载时加载上一步数据
onMounted(() => {
  const step1Data = localStorage.getItem('fa-step1-data')
  if (step1Data) {
    const data = JSON.parse(step1Data)
    regexPattern.value = data.regex
  }
})
</script>

<style scoped>
.step-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.step-icon {
  width: 3rem;
  height: 3rem;
  background: #ede9fe;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  padding: 2rem;
}

.step-actions {
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.step-content {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
