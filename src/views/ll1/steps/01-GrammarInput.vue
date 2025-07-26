<template>
  <div class="grammar-input-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:file-text" class="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">输入文法</h2>
          <p class="text-gray-600 mt-1">第一步：定义上下文无关文法规则</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="max-w-4xl mx-auto">
        <!-- 文法输入区域 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">输入产生式</h3>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <Icon icon="lucide:info" class="w-4 h-4 text-blue-500" />
                <span class="text-sm text-gray-600">支持格式：A->α|β</span>
              </div>
              <button
                @click="handleAnalyzeGrammar"
                :disabled="!grammarInput.trim() || loading"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  !grammarInput.trim() || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700',
                ]"
              >
                <Icon
                  :icon="loading ? 'lucide:loader-2' : 'lucide:play'"
                  :class="['w-4 h-4', loading ? 'animate-spin' : '']"
                />
                <span>{{ loading ? '分析中...' : '分析文法' }}</span>
              </button>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                文法规则 <span class="text-red-500">*</span>
                <span class="text-xs text-gray-500 ml-2">(每行一个产生式，使用单字符作为符号)</span>
              </label>
              <textarea
                v-model="grammarInput"
                placeholder="请输入文法产生式，例如：&#10;S->AB&#10;A->a|ε&#10;B->b"
                class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y transition-colors"
                @input="handleGrammarInput"
              />
              <div class="mt-2 text-xs text-gray-500">
                <div class="flex items-center justify-between mb-1">
                  <span>提示：不支持中文字符，不能有重复产生式</span>
                  <span>{{ grammarInput.length }} 字符</span>
                </div>
                <div class="text-blue-600">
                  <p><strong>重要规范：</strong></p>
                  <p>• 开始符：第一个产生式的左侧大写字母为开始符</p>
                  <p>• 字符规定：每个符号必须是单个字符（如A、B、C，而非E1、id等）</p>
                  <p>• 产生式：每行一个产生式，确保文法符合LL1要求（无左递归、无回溯）</p>
                  <p>• 结束符：系统使用 # 作为输入串结束符（会自动添加）</p>
                  <p class="text-green-600 mt-2">
                    • <strong>输入完成后，点击"分析文法"按钮进行验证</strong>
                  </p>
                </div>
              </div>
            </div>

            <!-- 加载状态 -->
            <div v-if="loading" class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div class="flex items-center gap-2">
                <Icon
                  icon="lucide:loader-2"
                  class="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0"
                />
                <p class="text-sm text-yellow-700">正在分析文法...</p>
              </div>
            </div>

            <!-- 错误提示 -->
            <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-3">
              <div class="flex gap-2">
                <Icon
                  icon="lucide:alert-circle"
                  class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p class="text-sm text-red-700 font-medium">输入错误</p>
                  <p class="text-sm text-red-600 mt-1">{{ error }}</p>
                </div>
              </div>
            </div>

            <!-- 成功提示 -->
            <div
              v-else-if="isLL1Grammar && grammarInput.trim()"
              class="bg-green-50 border border-green-200 rounded-md p-3"
            >
              <div class="flex gap-2">
                <Icon
                  icon="lucide:check-circle"
                  class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p class="text-sm text-green-700 font-medium">文法验证成功</p>
                  <p class="text-sm text-green-600 mt-1">符合LL(1)文法规范，可以进入下一步</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 示例文法 -->
        <div class="bg-gray-50 rounded-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Icon icon="lucide:book-open" class="w-5 h-5 text-gray-600" />
              <h4 class="text-md font-semibold text-gray-900">示例文法</h4>
            </div>
            <span class="text-xs text-gray-500">点击使用示例</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="(example, index) in exampleGrammars"
              :key="index"
              class="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-green-300 hover:shadow-md transition-all duration-200 group"
              @click="useExample(example)"
            >
              <div class="flex items-center justify-between mb-3">
                <h5 class="font-medium text-gray-800 group-hover:text-green-700">
                  {{ example.name }}
                </h5>
                <Icon
                  icon="lucide:copy"
                  class="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors"
                />
              </div>
              <pre class="text-sm text-gray-600 font-mono leading-relaxed">{{
                example.grammar
              }}</pre>
              <div class="mt-3 pt-3 border-t border-gray-100">
                <span class="text-xs text-gray-500">{{ example.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分析结果 -->
        <div
          v-if="originalData"
          class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
        >
          <div class="flex items-center mb-4">
            <div class="flex items-center gap-2">
              <Icon icon="lucide:zap" class="w-5 h-5 text-blue-600" />
              <h4 class="text-lg font-semibold text-gray-900">文法分析结果</h4>
            </div>
            <span
              class="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
              >LL(1)文法</span
            >
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div class="bg-white rounded-lg p-4 border border-blue-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="lucide:play" class="w-4 h-4 text-blue-500" />
                <span class="text-sm font-medium text-gray-700">起始符号</span>
              </div>
              <p class="text-lg font-bold text-blue-600">{{ originalData.S }}</p>
            </div>

            <div class="bg-white rounded-lg p-4 border border-blue-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="lucide:tag" class="w-4 h-4 text-purple-500" />
                <span class="text-sm font-medium text-gray-700">非终结符</span>
              </div>
              <p class="text-lg font-bold text-purple-600">{{ originalData.Vn.length }} 个</p>
              <p class="text-xs text-gray-500 mt-1">{{ originalData.Vn.join(', ') }}</p>
            </div>

            <div class="bg-white rounded-lg p-4 border border-blue-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="lucide:hash" class="w-4 h-4 text-green-500" />
                <span class="text-sm font-medium text-gray-700">终结符</span>
              </div>
              <p class="text-lg font-bold text-green-600">{{ originalData.Vt.length }} 个</p>
              <p class="text-xs text-gray-500 mt-1">{{ originalData.Vt.join(', ') }}</p>
            </div>

            <div class="bg-white rounded-lg p-4 border border-blue-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="lucide:list" class="w-4 h-4 text-orange-500" />
                <span class="text-sm font-medium text-gray-700">产生式数</span>
              </div>
              <p class="text-lg font-bold text-orange-600">
                {{ Object.keys(originalData.formulas_dict).length }}
              </p>
            </div>
          </div>

          <!-- 产生式详情 -->
          <div class="bg-white rounded-lg border border-blue-100 p-4">
            <h5 class="font-medium text-gray-700 mb-2">产生式列表：</h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div
                v-for="(productions, nonTerminal) in originalData.formulas_dict"
                :key="nonTerminal"
              >
                <span class="font-mono text-blue-600">{{ nonTerminal }}</span>
                <span class="text-gray-500 mx-1">→</span>
                <span class="font-mono text-gray-700">{{ productions.join(' | ') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="step-actions">
      <div class="flex justify-between items-center">
        <button
          disabled
          class="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed"
        >
          <Icon icon="lucide:chevron-left" class="w-4 h-4" />
          <span>上一步</span>
        </button>
        <div class="text-sm text-gray-500">步骤 1 / 4</div>
        <button
          @click="handleNextStep"
          :disabled="!canProceed"
          :class="[
            'flex items-center gap-2 px-6 py-2 rounded-lg transition-colors',
            canProceed
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
          ]"
        >
          <span>下一步</span>
          <Icon icon="lucide:chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Icon } from '@iconify/vue'
import { useLL1Store } from '@/stores/ll1'
import { useCommonStore } from '@/stores/common'

// 获取 Store 实例
const ll1Store = useLL1Store()
const commonStore = useCommonStore()

// 解构响应式状态（用于模板绑定）
const { productions, originalData, inputString } = storeToRefs(ll1Store)
const { loading, error } = storeToRefs(commonStore)

// 定义 emits
const emit = defineEmits<{
  'next-step': []
  'prev-step': []
}>()

// 将 productions 数组转换为字符串用于显示
const grammarInput = computed({
  get: () => productions.value.join('\n'),
  set: (value: string) => {
    const newProductions = value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    ll1Store.setProductions(newProductions)
  },
})

// 从 Store 计算属性获取状态
const isLL1Grammar = computed(() => ll1Store.isLL1Grammar)

// 示例文法数据
const exampleGrammars = [
  {
    name: '基础文法1',
    grammar: 'S->AB\nA->a|ε\nB->b',
    description: '最简单的LL(1)文法示例，适合初学者，结束符使用#',
  },
  {
    name: '基础文法2',
    grammar: 'S->aS|b',
    description: '简单的递归文法，生成a*b形式的字符串，结束符使用#',
  },
  {
    name: '基础文法3',
    grammar: 'S->AB\nA->aA|ε\nB->bB|c',
    description: '生成a*bc+形式字符串的文法，结束符使用#',
  },
]

// 计算是否可以进入下一步
const canProceed = computed(() => {
  return isLL1Grammar.value === true && productions.value.length > 0 && originalData.value !== null
})

// 处理文法输入变化（现在直接使用 computed setter）
const handleGrammarInput = () => {
  // 输入处理逻辑已经在 computed setter 中处理
  // 移除这里的重复触发，因为 watch 已经会监听 productions 变化
}

// 防抖分析
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let isAnalyzing = false // 添加标志防止重复分析

// 手动分析文法
const handleAnalyzeGrammar = async () => {
  // 如果正在分析，跳过
  if (isAnalyzing) {
    return
  }

  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // 清除之前的错误
  commonStore.clearError()

  if (!grammarInput.value.trim()) {
    commonStore.setError('请输入文法产生式')
    return
  }

  isAnalyzing = true
  try {
    // 使用原始输入文本进行完整的验证和格式化处理
    const inputText = grammarInput.value
    console.log('前端原始输入:', inputText)
    console.log('是否包含空格:', inputText.includes(' '))

    await ll1Store.performLL1AnalysisFromText(inputText)
  } catch (error) {
    console.error('Analysis failed:', error)
  } finally {
    isAnalyzing = false
  }
}

const performAnalysisWithDebounce = () => {
  // 移除自动分析逻辑 - 现在只有手动触发
  return
}

// 使用示例文法
const useExample = (example: any) => {
  grammarInput.value = example.grammar
  // 清除之前的分析结果，等待用户手动分析
  ll1Store.resetAll()
  commonStore.setError('已加载示例文法，请点击"分析文法"按钮进行验证')
}

// 处理下一步
const handleNextStep = () => {
  if (canProceed.value) {
    // 不需要传递数据，Store 中已经有了
    emit('next-step')
  }
}

// 监听 productions 变化，但不自动触发分析
watch(
  () => productions.value,
  (newProductions) => {
    if (newProductions.length === 0) {
      // 只在清空时重置状态
      commonStore.clearError()
      isAnalyzing = false // 重置分析状态
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
      }
    }
    // 移除自动分析 - 现在需要用户手动点击按钮
  },
  { deep: true },
)

// 组件挂载时初始化
onMounted(() => {
  // 移除自动分析 - 现在需要用户手动点击按钮
  console.log('LL1 组件已挂载，等待用户手动分析文法')
})
</script>

<style scoped>
.step-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.step-content {
  padding: 2rem;
  margin-bottom: 2rem;
}

.step-actions {
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.step-icon {
  width: 3rem;
  height: 3rem;
  background-color: #dcfce7;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
