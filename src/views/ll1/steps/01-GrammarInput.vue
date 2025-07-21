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
            <div class="flex items-center gap-1.5">
              <Icon icon="lucide:info" class="w-4 h-4 text-blue-500" />
              <span class="text-sm text-gray-600">支持格式：A->α|β</span>
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
                @input="validateGrammar"
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
                </div>
              </div>
            </div>

            <!-- 加载状态 -->
            <div v-if="loading" class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div class="flex items-center gap-2">
                <Icon icon="lucide:loader-2" class="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0" />
                <p class="text-sm text-yellow-700">正在分析文法...</p>
              </div>
            </div>

            <!-- 错误提示 -->
            <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-3">
              <div class="flex gap-2">
                <Icon icon="lucide:alert-circle" class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p class="text-sm text-red-700 font-medium">输入错误</p>
                  <p class="text-sm text-red-600 mt-1">{{ errorMessage }}</p>
                </div>
              </div>
            </div>

            <!-- 成功提示 -->
            <div v-else-if="isValid && grammarInput.trim()" class="bg-green-50 border border-green-200 rounded-md p-3">
              <div class="flex gap-2">
                <Icon icon="lucide:check-circle" class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
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
                <h5 class="font-medium text-gray-800 group-hover:text-green-700">{{ example.name }}</h5>
                <Icon icon="lucide:copy" class="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
              <pre class="text-sm text-gray-600 font-mono leading-relaxed">{{ example.grammar }}</pre>
              <div class="mt-3 pt-3 border-t border-gray-100">
                <span class="text-xs text-gray-500">{{ example.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分析结果 -->
        <div v-if="analysisResult" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div class="flex items-center mb-4">
            <div class="flex items-center gap-2">
              <Icon icon="lucide:zap" class="w-5 h-5 text-blue-600" />
              <h4 class="text-lg font-semibold text-gray-900">文法分析结果</h4>
            </div>
            <span class="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">LL(1)文法</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div class="bg-white rounded-lg p-4 border border-blue-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="lucide:play" class="w-4 h-4 text-blue-500" />
                <span class="text-sm font-medium text-gray-700">起始符号</span>
              </div>
              <p class="text-lg font-bold text-blue-600">{{ analysisResult.S }}</p>
            </div>

            <div class="bg-white rounded-lg p-4 border border-blue-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="lucide:tag" class="w-4 h-4 text-purple-500" />
                <span class="text-sm font-medium text-gray-700">非终结符</span>
              </div>
              <p class="text-lg font-bold text-purple-600">{{ analysisResult.Vn.length }} 个</p>
              <p class="text-xs text-gray-500 mt-1">{{ analysisResult.Vn.join(', ') }}</p>
            </div>

            <div class="bg-white rounded-lg p-4 border border-blue-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="lucide:hash" class="w-4 h-4 text-green-500" />
                <span class="text-sm font-medium text-gray-700">终结符</span>
              </div>
              <p class="text-lg font-bold text-green-600">{{ analysisResult.Vt.length }} 个</p>
              <p class="text-xs text-gray-500 mt-1">{{ analysisResult.Vt.join(', ') }}</p>
            </div>

            <div class="bg-white rounded-lg p-4 border border-blue-100">
              <div class="flex items-center gap-2 mb-2">
                <Icon icon="lucide:list" class="w-4 h-4 text-orange-500" />
                <span class="text-sm font-medium text-gray-700">产生式数</span>
              </div>
              <p class="text-lg font-bold text-orange-600">{{ Object.keys(analysisResult.formulas_dict).length }}</p>
            </div>
          </div>

          <!-- 产生式详情 -->
          <div class="bg-white rounded-lg border border-blue-100 p-4">
            <h5 class="font-medium text-gray-700 mb-2">产生式列表：</h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div v-for="(productions, nonTerminal) in analysisResult.formulas_dict" :key="nonTerminal">
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
        <button disabled class="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed">
          <Icon icon="lucide:chevron-left" class="w-4 h-4" />
          <span>上一步</span>
        </button>
        <div class="text-sm text-gray-500">步骤 1 / 4</div>
        <button
          @click="nextStep"
          :disabled="!canProceed"
          :class="[
            'flex items-center gap-2 px-6 py-2 rounded-lg transition-colors',
            canProceed
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { getLL1AnalyseAPI } from '@/api/ll1'
import type { LL1AnalysisResult } from '@/types'

const emit = defineEmits<{
  'next-step': [data: LL1AnalysisResult]
  'prev-step': []
}>()

const grammarInput = ref('')
const errorMessage = ref('')
const isValid = ref(false)
const analysisResult = ref<LL1AnalysisResult | null>(null)
const loading = ref(false)

const exampleGrammars = [
  {
    name: '基础文法1',
    grammar: 'S->AB\nA->a|ε\nB->b',
    description: '最简单的LL(1)文法示例，适合初学者'
  },
  {
    name: '基础文法2',
    grammar: 'S->aS|b',
    description: '简单的递归文法，生成a*b形式的字符串'
  },
  {
    name: '基础文法3',
    grammar: 'S->AB\nA->aA|ε\nB->bB|c',
    description: '生成a*bc+形式字符串的文法'
  }
]

const canProceed = computed(() => {
  return isValid.value && analysisResult.value && grammarInput.value.trim()
})

const validateGrammar = async () => {
  errorMessage.value = ''
  isValid.value = false
  analysisResult.value = null

  if (!grammarInput.value.trim()) {
    return
  }

  try {
    loading.value = true

    let text = grammarInput.value
    let textList: string[] = []

    // 检查是否只包含空白字符
    let pattern = /^\s*$/
    if (pattern.test(text)) {
      errorMessage.value = '请输入产生式！'
      return
    }

    // 检查是否包含中文
    let chinesePattern = /[\u4e00-\u9fa5]/
    if (chinesePattern.test(text)) {
      errorMessage.value = '输入不能包含中文！'
      return
    }

    // 根据换行分割每个产生式，移除空格但保留换行
    text = text.replace(/ +/g, '')
    textList = text.split('\n').filter(item => item.trim() !== '')

    // 检查是否有重复的产生式
    let textSet = new Set(textList)
    if (textList.length !== textSet.size) {
      errorMessage.value = '产生式含重复项，请重新输入！'
      return
    }

    // 检查产生式格式是否正确
    let isValidProduction = textList.every(production => {
      // 检查是否包含多个 ->
      let cnt = (production.match(/->/g) || []).length
      if (cnt > 1) return false

      // 检查格式：X->Y，其中 X 是大写字母，Y 是由任意字符（除了'|'）和 '|' 分隔的序列
      let match = production.match(/^([A-Z])->((?:[^|]+\|)*[^|]+)$/)
      return !!match
    })

    if (!isValidProduction) {
      errorMessage.value = '产生式不符合文法规范，请重新输入！'
      return
    }

    // 构建文法字典检查逻辑错误
    const checkFormulas: Record<string, string[]> = {}
    for (const pro of textList) {
      const [left, right] = pro.split('->')
      if (right.includes('|')) {
        const rList = right.split('|')
        if (!checkFormulas[left]) {
          checkFormulas[left] = []
        }
        for (const r of rList) {
          if (!checkFormulas[left].includes(r)) {
            checkFormulas[left].push(r)
          }
        }
      } else {
        if (!checkFormulas[left]) {
          checkFormulas[left] = []
        }
        checkFormulas[left].push(right)
      }
    }

    // 获取所有非终结符
    const checkVn = Array.from(textList.join('').match(/[A-Z]/g) || [])

    // 检查是否所有非终结符都有产生式
    for (const vn of checkVn) {
      if (!checkFormulas[vn]) {
        errorMessage.value = `非终结符 ${vn} 没有定义产生式！`
        return
      }
    }

    // 检查左递归
    const visited = new Set<string>()
    function dfs(vn: string): boolean {
      visited.add(vn)
      for (const str of checkFormulas[vn]) {
        const symbol = str[0]
        if (visited.has(symbol)) return true
        if (/[A-Z]/.test(symbol) && checkFormulas[symbol]) {
          if (dfs(symbol)) return true
        }
      }
      visited.delete(vn) // 回溯时移除，避免误判
      return false
    }

    for (const vn of checkVn) {
      visited.clear() // 每次检查新的非终结符时清空visited
      if (dfs(vn)) {
        errorMessage.value = '存在直接或间接左递归，请输入消除左递归后的文法！'
        return
      }
    }

    // 发送到后端验证
    const response = await getLL1AnalyseAPI(textList)
    const result = response.data?.data

    if (result && result.isLL1) {
      isValid.value = true
      analysisResult.value = result
    } else {
      errorMessage.value = '不符合LL1文法，请重新输入'
    }
  } catch (error) {
    console.error('Grammar analysis error:', error)
    errorMessage.value = '文法分析失败，请检查输入格式'
  } finally {
    loading.value = false
  }
}

const useExample = (example: any) => {
  grammarInput.value = example.grammar
  validateGrammar()
}

const nextStep = () => {
  if (canProceed.value && analysisResult.value) {
    // 传递分析结果到下一步
    emit('next-step', analysisResult.value)
  }
}

// 监听输入变化，使用防抖
let debounceTimer: number | null = null

watch(grammarInput, () => {
  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // 清除之前的结果
  errorMessage.value = ''
  isValid.value = false
  analysisResult.value = null

  if (grammarInput.value.trim()) {
    // 设置新的防抖定时器
    debounceTimer = setTimeout(() => {
      validateGrammar()
    }, 800) // 800ms防抖
  }
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
