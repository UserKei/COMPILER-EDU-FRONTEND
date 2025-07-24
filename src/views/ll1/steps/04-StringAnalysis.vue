<template>
  <div class="string-analysis-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:play-circle" class="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">字符串分析</h2>
          <p class="text-gray-600 mt-1">第四步：使用LL1分析表分析输入字符串</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="max-w-6xl mx-auto">
        <!-- 输入字符串区域 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">输入待分析字符串</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> 字符串输入 </label>
              <div class="flex gap-4">
                <input
                  v-model="inputString"
                  type="text"
                  placeholder="例如: id+id*id"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  @keyup.enter="analyzeString"
                />
                <button
                  @click="analyzeString"
                  :disabled="!inputString.trim() || analyzing"
                  class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Icon v-if="analyzing" icon="lucide:loader-2" class="w-4 h-4 animate-spin mr-2" />
                  {{ analyzing ? '分析中...' : '开始分析' }}
                </button>
              </div>
            </div>

            <!-- 示例字符串 -->
            <div class="flex flex-wrap gap-2">
              <span class="text-sm text-gray-600">示例:</span>
              <button
                v-for="example in exampleStrings"
                :key="example"
                @click="inputString = example"
                class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                {{ example }}
              </button>
            </div>
          </div>
        </div>

        <!-- 分析过程 -->
        <div
          v-if="inputAnalysisResult || analysisSteps.length > 0"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">分析过程</h3>

          <!-- 真实分析结果显示 -->
          <div v-if="inputAnalysisResult" class="mb-6">
            <div class="overflow-x-auto">
              <table class="min-w-full border border-gray-300 text-sm">
                <thead class="bg-green-50">
                  <tr>
                    <th
                      class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700"
                    >
                      步骤
                    </th>
                    <th
                      class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700"
                    >
                      栈
                    </th>
                    <th
                      class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700"
                    >
                      输入
                    </th>
                    <th
                      class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700"
                    >
                      动作
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white">
                  <tr v-for="(step, index) in inputAnalysisResult.info_step" :key="index">
                    <td class="border border-gray-300 px-3 py-2 text-center">{{ step }}</td>
                    <td class="border border-gray-300 px-3 py-2 font-mono text-center">
                      {{ getStackDisplay(index) }}
                    </td>
                    <td class="border border-gray-300 px-3 py-2 font-mono text-center">
                      {{ getInputDisplay(index) }}
                    </td>
                    <td class="border border-gray-300 px-3 py-2 text-center">
                      {{ inputAnalysisResult.info_msg[index] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 模拟分析结果显示（向后兼容） -->
          <div v-else-if="analysisSteps.length > 0" class="overflow-x-auto">
            <table class="min-w-full border border-gray-300 text-sm">
              <thead class="bg-green-50">
                <tr>
                  <th
                    class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700"
                  >
                    步骤
                  </th>
                  <th
                    class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700"
                  >
                    栈
                  </th>
                  <th
                    class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700"
                  >
                    输入
                  </th>
                  <th
                    class="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700"
                  >
                    动作
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr
                  v-for="(step, index) in analysisSteps"
                  :key="index"
                  :class="{ 'bg-red-50': step.error }"
                >
                  <td class="border border-gray-300 px-3 py-2 text-center">{{ index + 1 }}</td>
                  <td class="border border-gray-300 px-3 py-2 font-mono text-center">
                    {{ step.stack }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 font-mono text-center">
                    {{ step.input }}
                  </td>
                  <td
                    class="border border-gray-300 px-3 py-2 text-center"
                    :class="{ 'text-red-600': step.error }"
                  >
                    {{ step.action }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 分析结果 -->
        <div
          v-if="computedAnalysisResult"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div class="flex items-center space-x-3 mb-4">
            <div class="flex-shrink-0">
              <Icon
                :icon="computedAnalysisResult.success ? 'lucide:check-circle' : 'lucide:x-circle'"
                class="w-6 h-6"
                :class="computedAnalysisResult.success ? 'text-green-600' : 'text-red-600'"
              />
            </div>
            <div>
              <h3
                class="text-lg font-semibold"
                :class="computedAnalysisResult.success ? 'text-green-900' : 'text-red-900'"
              >
                {{ computedAnalysisResult.message }}
              </h3>
            </div>
          </div>

          <!-- 详细信息 -->
          <div
            v-if="computedAnalysisResult.details && computedAnalysisResult.details.length > 0"
            class="text-sm text-gray-600"
          >
            <div
              v-for="(detail, index) in computedAnalysisResult.details"
              :key="index"
              class="mb-1"
            >
              • {{ detail }}
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
        <div class="text-sm text-gray-500">步骤 4 / 4</div>
        <button
          @click="complete"
          class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          完成
          <Icon icon="lucide:check" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLL1Store } from '@/stores/ll1'
import { useCommonStore } from '@/stores/common'
import { Icon } from '@iconify/vue'

interface AnalysisStep {
  stack: string
  input: string
  action: string
  error?: boolean
}

interface AnalysisResult {
  success: boolean
  message: string
  details?: string[]
}

// 组件事件
const emit = defineEmits<{ 'next-step': []; 'prev-step': []; complete: [data: any] }>()

// 使用 Store
const ll1Store = useLL1Store()
const commonStore = useCommonStore()

// 从 Store 获取数据
const { inputString, inputAnalysisResult } = storeToRefs(ll1Store)
const { loading } = storeToRefs(commonStore)

// 本地状态 - 用于向后兼容和临时显示
const analysisSteps = ref<AnalysisStep[]>([])
const analysisResult = ref<AnalysisResult | null>(null)

// 分析状态
const analyzing = computed(() => loading.value)

// 示例字符串
const exampleStrings = ['i+i*i', 'i*i+i', '(i+i)*i', 'i', '(i)']

// 监听输入字符串变化，自动触发分析
watch(
  () => inputString.value,
  (newValue) => {
    if (newValue && newValue.trim()) {
      handleAnalyze()
    }
  },
  { immediate: false },
)

// 计算分析结果状态
const computedAnalysisResult = computed(() => {
  if (inputAnalysisResult.value) {
    return {
      success: inputAnalysisResult.value.result,
      message: inputAnalysisResult.value.result ? '字符串分析成功！' : '字符串分析失败！',
      details: inputAnalysisResult.value.info_msg || [],
    }
  }

  // 向后兼容模拟分析结果
  if (analysisResult.value) {
    return analysisResult.value
  }

  return null
})

// 从真实分析结果获取栈状态显示
const getStackDisplay = (index: number) => {
  if (!inputAnalysisResult.value?.info_stack) return ''

  // 如果有专门的栈信息数组，直接使用
  if (inputAnalysisResult.value.info_stack[index]) {
    return Array.isArray(inputAnalysisResult.value.info_stack[index])
      ? inputAnalysisResult.value.info_stack[index].join('')
      : String(inputAnalysisResult.value.info_stack[index])
  }

  return '栈状态未知'
}

// 从真实分析结果获取输入状态显示
const getInputDisplay = (index: number) => {
  if (!inputAnalysisResult.value?.info_str) return ''

  // 如果有专门的输入信息数组，直接使用
  if (inputAnalysisResult.value.info_str[index]) {
    return String(inputAnalysisResult.value.info_str[index])
  }

  return '输入状态未知'
}

// 执行分析 - 使用 Store 的真实分析功能
const analyzeString = async () => {
  if (!inputString.value?.trim()) {
    commonStore.setError('请输入要分析的字符串')
    return
  }

  try {
    const success = await ll1Store.analyzeInputString()

    if (success && inputAnalysisResult.value?.result) {
      analysisResult.value = {
        success: true,
        message: '字符串分析成功！',
        details: inputAnalysisResult.value.info_msg || [],
      }
    } else {
      analysisResult.value = {
        success: false,
        message: '字符串分析失败！',
        details: inputAnalysisResult.value?.info_msg || ['分析未通过'],
      }
    }
  } catch (error) {
    console.error('分析失败:', error)
    commonStore.setError('分析过程中发生错误')
    analysisResult.value = {
      success: false,
      message: '分析过程中发生错误',
      details: [String(error)],
    }
  }
}

// 简化版分析函数（向后兼容）
const handleAnalyze = () => {
  analyzeString()
}

// 清除分析结果
const clearAnalysis = () => {
  inputAnalysisResult.value = null
  analysisSteps.value = []
  analysisResult.value = null
  inputString.value = ''
}

// 完成步骤
const complete = () => {
  const data = {
    inputString: inputString.value,
    analysisResult: inputAnalysisResult.value,
    success: inputAnalysisResult.value?.result || false,
    steps: inputAnalysisResult.value?.info_step || [],
    messages: inputAnalysisResult.value?.info_msg || [],
  }

  emit('complete', data)
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
  background: #dcfce7;
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
