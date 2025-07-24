<template>
  <div class="minimized-dfa-draw-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:check-circle-2" class="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">最小化 DFA 结果</h2>
          <p class="text-gray-600 mt-1">第六步：可视化绘制最小化后的 DFA</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="space-y-6">
        <!-- 上方：最小化DFA画布区域 -->
        <div class="minimized-dfa-draw-area">
          <div class="bg-white border border-gray-200 rounded-lg">
            <!-- 画布主体 -->
            <div class="h-[700px] p-4">
              <FACanvas ref="minimizedDFACanvasRef" mode="dfa" title="最小化 DFA" />
            </div>
          </div>
        </div>

        <!-- 下方：标准答案 -->
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
                      : 'bg-green-600 text-white hover:bg-green-700',
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
              <div v-if="showAnswer" class="w-full h-full flex items-center justify-center">
                <div
                  v-if="faStore.minDfaDotString"
                  ref="answerSvgContainer"
                  class="w-full h-full overflow-auto bg-gray-50 rounded border"
                >
                  <!-- SVG 将在这里渲染 -->
                </div>
                <div v-else class="text-gray-500 text-center">
                  <Icon icon="lucide:image-off" class="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>暂无答案图像</p>
                </div>
              </div>
              <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                <div class="text-center">
                  <Icon icon="lucide:eye-off" class="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>点击"查看答案"显示最小化 DFA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="step-actions">
      <div class="flex justify-between items-center">
        <button
          @click="$emit('prev-step')"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Icon icon="lucide:chevron-left" class="w-4 h-4 inline mr-2" />
          上一步
        </button>
        <div class="text-sm text-gray-500">步骤 6 / 6</div>
        <button
          @click="complete"
          class="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
        >
          完成
          <Icon icon="lucide:check" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import FACanvas from '@/components/flow/canvas/FACanvas.vue'
import { useFAStore } from '@/stores'
import { instance } from '@viz-js/viz'

const emit = defineEmits<{
  'next-step': []
  'prev-step': []
  complete: [data: any]
}>()

// 使用 FA Store
const faStore = useFAStore()

// 本地状态
const dfaStateCount = ref(0)
const minimizedStateCount = ref(0)

// 状态管理
const showAnswer = ref(false)

// 最小化DFA画布引用
const minimizedDFACanvasRef = ref<InstanceType<typeof FACanvas>>()
const answerSvgContainer = ref<HTMLElement>()

// 从localStorage获取数据
onMounted(() => {
  if (!faStore.hasResult()) {
    console.warn('No FA data found, please complete step 1 first')
    return
  }

  try {
    // 直接使用 store 中的数据
    const faResult = faStore.originalData
    if (faResult) {
      console.log('Step 6 loaded data from store')
      console.log('Minimized DFA DOT string:', faStore.minDfaDotString)

      // 从后端数据中获取状态数量
      if (faResult.table_to_num) {
        dfaStateCount.value = Object.keys(faResult.table_to_num).length
      }
      if (faResult.table_to_num_min) {
        const minStates = Math.max(
          ...Object.values(faResult.table_to_num_min).map((arr: any) =>
            Array.isArray(arr) ? arr.length : 0,
          ),
        )
        minimizedStateCount.value = minStates
      }
    }
  } catch (error) {
    console.error('处理FA数据失败：', error)
  }
})

// 切换答案显示
const toggleAnswer = async () => {
  showAnswer.value = !showAnswer.value

  if (showAnswer.value && faStore.minDfaDotString) {
    await nextTick()
    renderSvgAnswer()
  }
}

// 渲染SVG答案
const renderSvgAnswer = async () => {
  if (!answerSvgContainer.value || !faStore.minDfaDotString) return

  try {
    // 使用 viz.js 渲染 DOT 字符串
    const viz = await instance()

    // 渲染DOT为SVG
    const svg = viz.renderSVGElement(faStore.minDfaDotString)

    // 清空容器并添加SVG
    answerSvgContainer.value.innerHTML = ''
    if (svg) {
      answerSvgContainer.value.appendChild(svg)
    }
  } catch (error) {
    console.error('渲染SVG失败：', error)
    if (answerSvgContainer.value) {
      answerSvgContainer.value.innerHTML = `
        <div class="flex items-center justify-center h-full text-gray-500">
          <div class="text-center">
            <p>SVG 渲染失败</p>
            <p class="text-sm mt-1">请检查DOT字符串格式</p>
          </div>
        </div>
      `
    }
  }
}

// 完成整个流程
const complete = () => {
  const stepData = {
    completed: true,
    regexPattern: faStore.inputRegex,
    finalResults: {
      dfaStateCount: dfaStateCount.value,
      minimizedStateCount: minimizedStateCount.value,
    },
    timestamp: new Date().toISOString(),
  }

  // 保存最终数据
  localStorage.setItem('fa-final-results', JSON.stringify(stepData))

  // 触发完成事件
  emit('complete', stepData)

  alert('🎉 有限自动机构造流程已完成！')
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
  background: #e0e7ff;
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
</style>
