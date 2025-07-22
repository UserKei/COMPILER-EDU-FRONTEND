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
          正则表达式: <code class="font-mono">{{ faStore.inputRegex }}</code>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="step-content">
      <div class="space-y-6">
        <!-- 上方：用户画图区域 -->
        <div class="user-draw-area">
          <div class="bg-white border border-gray-200 rounded-lg">
            <!-- 用户画布 -->
            <div class="h-[700px] p-4">
              <FACanvas
                ref="userCanvasRef"
                mode="nfa"
                :readonly="false"
              />
            </div>
          </div>

          <!-- 画图提示 -->
          <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="lucide:lightbulb" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="font-medium text-blue-800">绘制提示</h4>
                <ul class="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• 使用 Thompson 构造法构造 NFA</li>
                  <li>• 为每个基本符号创建状态和转换</li>
                  <li>• 处理连接、选择和闭包操作</li>
                  <li>• 确保有明确的初始状态和接受状态</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 下方：答案区域 -->
        <div class="answer-area">
          <div class="bg-white border border-gray-200 rounded-lg">
            <!-- 答案区域头部 -->
            <div class="border-b border-gray-200 p-4">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">标准答案</h3>
                <button
                  @click="toggleAnswer"
                  :class="[
                    'px-4 py-2 rounded-lg transition-colors',
                    showAnswer
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  ]"
                >
                  <Icon
                    :icon="showAnswer ? 'lucide:eye-off' : 'lucide:eye'"
                    class="w-4 h-4 inline mr-2"
                  />
                  {{ showAnswer ? '隐藏答案' : '查看答案' }}
                </button>
              </div>
            </div>

            <!-- 答案内容 -->
            <div class="h-80 p-4">
              <div v-if="!showAnswer" class="h-full flex items-center justify-center">
                <div class="text-center text-gray-500">
                  <Icon icon="lucide:lock" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p class="text-lg font-medium">答案已隐藏</p>
                  <p class="text-sm mt-1">完成你的绘制后点击"查看答案"按钮</p>
                </div>
              </div>

              <div v-else class="h-full">
                <!-- SVG 渲染的答案 -->
                <div v-if="nfaDotString" class="h-full">
                  <div
                    ref="answerSvgContainer"
                    class="h-full w-full flex items-center justify-center bg-gray-50 rounded"
                  >
                    <!-- SVG 内容将通过 JavaScript 渲染到这里 -->
                  </div>
                </div>
                <div v-else class="h-full flex items-center justify-center text-gray-500">
                  <div class="text-center">
                    <Icon icon="lucide:alert-circle" class="w-8 h-8 mx-auto mb-2" />
                    <p>暂无答案数据</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 答案分析 -->
            <div v-if="showAnswer && hasNFAData" class="border-t border-gray-200 bg-green-50 p-4">
              <div class="flex items-start gap-3">
                <Icon icon="lucide:check-circle" class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 class="font-medium text-green-800">NFA 构造分析</h4>
                  <div class="text-sm text-green-700 mt-2 space-y-1">
                    <p>• 正则表达式: <code class="font-mono bg-white px-1 rounded">{{ faStore.inputRegex }}</code></p>
                    <p>• NFA 构造完成</p>
                    <p>• 使用 Thompson 构造法生成</p>
                    <p>• 可进行下一步 NFA → DFA 转换</p>
                  </div>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import FACanvas from '@/components/flow/canvas/FACanvas.vue'
import { useFAStore } from '@/stores'
import { instance } from '@viz-js/viz'

const emit = defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 使用 FA Store
const faStore = useFAStore()

// 答案显示控制
const showAnswer = ref(false)

// 用户画图相关
const userCanvasRef = ref<InstanceType<typeof FACanvas>>()
const answerSvgContainer = ref<HTMLElement>()

// 从store获取NFA数据
const nfaDotString = computed(() => faStore.nfaDotString)
const hasNFAData = computed(() => faStore.hasResult())

// 组件挂载时检查数据
onMounted(() => {
  if (!hasNFAData.value) {
    console.warn('No FA data found, please complete step 1 first')
  } else {
    console.log('Step 2 loaded FA data from store')
    console.log('NFA DOT string:', nfaDotString.value)
  }
})

// 答案控制
const toggleAnswer = async () => {
  console.log('toggleAnswer called, current showAnswer:', showAnswer.value)
  showAnswer.value = !showAnswer.value
  console.log('New showAnswer value:', showAnswer.value)

  if (showAnswer.value && nfaDotString.value) {
    // 等待DOM更新
    await nextTick()
    console.log('After nextTick, container exists:', !!answerSvgContainer.value)

    if (answerSvgContainer.value) {
      console.log('开始渲染，条件检查：', {
        showAnswer: showAnswer.value,
        hasDotString: !!nfaDotString.value,
        hasContainer: !!answerSvgContainer.value
      })
      // 使用 viz.js 渲染 DOT 图
      await renderDotToSvg()
    } else {
      console.error('answerSvgContainer ref is null after nextTick')
    }
  } else {
    console.log('跳过渲染，条件不满足：', {
      showAnswer: showAnswer.value,
      hasDotString: !!nfaDotString.value
    })
  }
}

// 渲染DOT字符串为SVG
const renderDotToSvg = async () => {
  if (!answerSvgContainer.value || !nfaDotString.value) {
    console.warn('renderDotToSvg: 缺少必要条件', {
      hasContainer: !!answerSvgContainer.value,
      hasDotString: !!nfaDotString.value
    })
    return
  }

  try {
    console.log('开始渲染DOT...')
    console.log('Container:', answerSvgContainer.value)
    console.log('DOT String:', nfaDotString.value)

    // 清除之前的内容
    answerSvgContainer.value.innerHTML = ''

    // 显示加载状态
    answerSvgContainer.value.innerHTML = '<div class="text-center text-blue-600">正在渲染图形...</div>'

    // 使用 viz.js 渲染 DOT 字符串
    console.log('正在初始化 viz.js...')
    const viz = await instance()
    console.log('viz.js 初始化成功:', viz)

    console.log('正在渲染 SVG...')
    const svg = viz.renderSVGElement(nfaDotString.value)
    console.log('SVG 渲染成功:', svg)

    // 清除加载状态
    answerSvgContainer.value.innerHTML = ''

    // 添加样式使 SVG 适应容器
    svg.style.maxWidth = '100%'
    svg.style.maxHeight = '100%'
    svg.style.height = 'auto'
    svg.style.width = 'auto'

    // 将 SVG 添加到容器
    answerSvgContainer.value.appendChild(svg)

    console.log('DOT rendered successfully, SVG added to container')
    console.log('Container children count:', answerSvgContainer.value.children.length)
  } catch (error) {
    console.error('渲染DOT图失败：', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    answerSvgContainer.value.innerHTML = `
      <div class="text-center text-red-500">
        <p>渲染失败: ${errorMessage}</p>
        <div class="mt-4 text-xs bg-gray-100 p-2 rounded text-left">
          <pre class="whitespace-pre-wrap">${nfaDotString.value}</pre>
        </div>
      </div>
    `
  }
}

// 是否构造完成（用户查看答案后就可以进行下一步）
const isConstructionComplete = computed(() => {
  // 用户查看答案后就认为构造完成，可以进行下一步
  return showAnswer.value || (userCanvasRef.value?.getNodes && userCanvasRef.value.getNodes().length > 0)
})

// 进入下一步
const proceedToNext = () => {
  console.log('proceedToNext called')
  console.log('isConstructionComplete:', isConstructionComplete.value)

  if (isConstructionComplete.value) {
    const stepData = {
      nfa: {
        userDraw: {
          nodes: userCanvasRef.value?.getNodes() || [],
          edges: userCanvasRef.value?.getEdges() || []
        },
        timestamp: new Date().toISOString()
      }
    }

    console.log('Step 2 completed with data:', stepData)

    // 正确使用 Vue emit
    emit('complete', stepData)
    emit('next-step')
  } else {
    console.warn('Construction not complete, cannot proceed')
  }
}
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
