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
          <h3 class="text-lg font-semibold text-gray-900 mb-4">输入产生式</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                文法规则 (每行一个产生式，格式: A->α|β)
              </label>
              <textarea
                v-model="grammarInput"
                placeholder="例如：&#10;S->AB&#10;A->a|ε&#10;B->b"
                class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                @input="validateGrammar"
              />
            </div>

            <!-- 错误提示 -->
            <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-3">
              <div class="flex">
                <Icon icon="lucide:alert-circle" class="w-5 h-5 text-red-400 mr-2 mt-0.5" />
                <p class="text-sm text-red-700">{{ errorMessage }}</p>
              </div>
            </div>

            <!-- 成功提示 -->
            <div v-if="isValid && grammarInput.trim()" class="bg-green-50 border border-green-200 rounded-md p-3">
              <div class="flex">
                <Icon icon="lucide:check-circle" class="w-5 h-5 text-green-400 mr-2 mt-0.5" />
                <p class="text-sm text-green-700">文法格式正确，符合LL1规范</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 示例文法 -->
        <div class="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 class="text-md font-semibold text-gray-900 mb-3">示例文法</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(example, index) in exampleGrammars"
              :key="index"
              class="bg-white rounded-md p-4 border border-gray-200 cursor-pointer hover:border-green-300 transition-colors"
              @click="useExample(example)"
            >
              <h5 class="font-medium text-gray-800 mb-2">{{ example.name }}</h5>
              <pre class="text-sm text-gray-600 font-mono">{{ example.grammar }}</pre>
            </div>
          </div>
        </div>

        <!-- 分析结果 -->
        <div v-if="analysisResult" class="bg-blue-50 rounded-lg p-6">
          <h4 class="text-md font-semibold text-gray-900 mb-3">文法分析结果</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700">起始符号:</span>
              <span class="ml-2 text-blue-600">{{ analysisResult.S }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">非终结符:</span>
              <span class="ml-2 text-blue-600">{{ analysisResult.Vn.join(', ') }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">终结符:</span>
              <span class="ml-2 text-blue-600">{{ analysisResult.Vt.join(', ') }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">产生式数:</span>
              <span class="ml-2 text-blue-600">{{ analysisResult.formulas_dict.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="step-actions">
      <div class="flex justify-between items-center">
        <button disabled class="px-6 py-2 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed">
          <Icon icon="lucide:chevron-left" class="w-4 h-4 inline mr-2" />
          上一步
        </button>
        <div class="text-sm text-gray-500">步骤 1 / 4</div>
        <button
          @click="nextStep"
          :disabled="!canProceed"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            canProceed
              ? 'bg-green-600 text-white hover:bg-green-700'
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
    name: '简单算术表达式',
    grammar: 'E->TE1\nE1->+TE1|ε\nT->FT1\nT1->*FT1|ε\nF->(E)|id'
  },
  {
    name: '条件语句',
    grammar: 'S->if(E)S|if(E)SES1|a\nS1->eS|ε\nE->b'
  },
  {
    name: '基础文法',
    grammar: 'S->AB\nA->a|ε\nB->b'
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
    // 前端验证
    const lines = grammarInput.value.trim().split('\n').filter(line => line.trim())

    // 检查格式
    for (const line of lines) {
      const match = line.match(/^([A-Z])->((?:[^|]+\|)*[^|]+)$/)
      if (!match) {
        errorMessage.value = '产生式格式不正确，请使用格式: A->α|β'
        return
      }
    }

    // 构建文法字典检查逻辑错误
    const checkFormulas: Record<string, string[]> = {}
    for (const pro of lines) {
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
    const checkVn = Array.from(lines.join('').match(/[A-Z]/g) || [])
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
      return false
    }
    for (const vn of checkVn) {
      if (!visited.has(vn)) {
        if (dfs(vn)) {
          errorMessage.value = '存在直接或间接左递归，请输入消除左递归后的文法！'
          return
        }
      }
    }

    // 发送到后端验证
    const response = await getLL1AnalyseAPI(lines)
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

// 监听输入变化
watch(grammarInput, () => {
  if (grammarInput.value.trim()) {
    // 防抖验证
    setTimeout(validateGrammar, 500)
  } else {
    errorMessage.value = ''
    isValid.value = false
    analysisResult.value = null
  }
})
</script>

<style scoped>
.step-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

.step-content {
  margin-bottom: 2rem;
}

.step-actions {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.step-icon {
  width: 3rem;
  height: 3rem;
  background-color: #dcfce7;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
