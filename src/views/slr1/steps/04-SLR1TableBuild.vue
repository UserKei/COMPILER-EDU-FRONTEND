<template>
  <div class="slr1-table-build-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:table" class="w-6 h-6 text-cyan-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">SLR1表构建</h2>
          <p class="text-gray-600 mt-1">第四步：构建SLR1分析表</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <!-- 说明区域 -->
      <div class="bg-cyan-50 border border-cyan-200 rounded-lg p-6 mb-6">
        <div class="flex items-start">
          <Icon icon="lucide:info" class="w-5 h-5 text-cyan-600 mt-0.5 mr-3" />
          <div>
            <h3 class="text-lg font-semibold text-cyan-900 mb-2">SLR1分析表构造规则</h3>
            <ul class="space-y-1 text-sm text-cyan-800">
              <li>• <strong>ACTION表：</strong>根据项目集中的项目和FOLLOW集填写移进和规约动作</li>
              <li>• <strong>GOTO表：</strong>根据DFA的转移关系填写状态转移</li>
              <li>
                • <strong>移进动作：</strong>A → α·aβ，则ACTION[i,a] = Sj（状态j包含A → αa·β）
              </li>
              <li>
                • <strong>规约动作：</strong>A → α·且a∈FOLLOW(A)，则ACTION[i,a] = rk（第k个产生式）
              </li>
              <li>• <strong>接受动作：</strong>S' → S·，则ACTION[i,$] = acc</li>
              <li>• <strong>SLR1特点：</strong>使用FOLLOW集解决LR0的规约/规约冲突</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 从前面步骤获取数据 -->
      <div v-if="!analysisData" class="text-center py-20">
        <Icon icon="lucide:arrow-left" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-600 mb-2">请先完成前面的步骤</h3>
        <p class="text-gray-500">需要先完成文法分析和DFA构造才能建立分析表</p>
      </div>

      <div v-else class="space-y-8">
        <!-- FOLLOW集显示 -->
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">FOLLOW集</h3>
          <p class="text-sm text-gray-600 mb-4">SLR1需要使用FOLLOW集来解决规约冲突</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(followSet, symbol) in followSets"
              :key="symbol"
              class="bg-gray-50 p-3 rounded"
            >
              <div class="font-medium text-gray-900 mb-1">FOLLOW({{ symbol }})</div>
              <div class="text-sm text-gray-700">{{ followSet || '∅' }}</div>
            </div>
            <!-- 如果没有FOLLOW集数据，显示提示 -->
            <div
              v-if="Object.keys(followSets).length === 0"
              class="col-span-full text-center text-gray-500"
            >
              FOLLOW集将在分析过程中自动计算
            </div>
          </div>
        </div>

        <!-- 分析表构建区域 -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">SLR1分析表</h3>
            <p class="text-sm text-gray-600 mt-1">ACTION表和GOTO表的组合</p>
          </div>

          <div class="p-6">
            <!-- 表格头部信息 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
              <div class="bg-blue-50 p-3 rounded">
                <span class="font-medium text-blue-900">状态数量：</span>
                <span class="text-blue-700">{{ stateCount }}</span>
              </div>
              <div class="bg-green-50 p-3 rounded">
                <span class="font-medium text-green-900">终结符：</span>
                <span class="text-green-700">{{ terminals.join(', ') }}</span>
              </div>
              <div class="bg-purple-50 p-3 rounded">
                <span class="font-medium text-purple-900">非终结符：</span>
                <span class="text-purple-700">{{ nonterminals.join(', ') }}</span>
              </div>
            </div>

            <!-- 分析表 -->
            <div class="overflow-x-auto">
              <table class="min-w-full border border-gray-300">
                <!-- 表头 -->
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900">
                      状态
                    </th>
                    <!-- ACTION列 -->
                    <th
                      v-for="terminal in terminals"
                      :key="terminal"
                      class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900 bg-blue-50"
                    >
                      {{ terminal }}
                    </th>
                    <th
                      class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900 bg-blue-50"
                    >
                      $
                    </th>
                    <!-- GOTO列 -->
                    <th
                      v-for="nonterminal in nonterminals"
                      :key="nonterminal"
                      class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900 bg-green-50"
                    >
                      {{ nonterminal }}
                    </th>
                  </tr>
                </thead>

                <!-- 表体 -->
                <tbody>
                  <tr
                    v-for="(row, stateIndex) in parseTable"
                    :key="stateIndex"
                    class="hover:bg-gray-50"
                  >
                    <td
                      class="px-3 py-2 border border-gray-300 text-xs font-medium text-center bg-gray-50"
                    >
                      {{ stateIndex }}
                    </td>

                    <!-- ACTION列 -->
                    <td
                      v-for="terminal in terminals"
                      :key="terminal"
                      class="px-2 py-1 border border-gray-300 text-xs text-center"
                    >
                      <input
                        v-model="row.actions[terminal]"
                        @input="checkTableCompletion"
                        class="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-cyan-500 rounded"
                        placeholder="--"
                      />
                    </td>
                    <td class="px-2 py-1 border border-gray-300 text-xs text-center">
                      <input
                        v-model="row.actions['$']"
                        @input="checkTableCompletion"
                        class="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-cyan-500 rounded"
                        placeholder="--"
                      />
                    </td>

                    <!-- GOTO列 -->
                    <td
                      v-for="nonterminal in nonterminals"
                      :key="nonterminal"
                      class="px-2 py-1 border border-gray-300 text-xs text-center"
                    >
                      <input
                        v-model="row.gotos[nonterminal]"
                        @input="checkTableCompletion"
                        class="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-cyan-500 rounded"
                        placeholder="--"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 填表提示 -->
            <div class="mt-4 text-xs text-gray-600">
              <p><strong>填表说明：</strong></p>
              <ul class="mt-1 space-y-1">
                <li>• 移进动作：Sn（移进到状态n）</li>
                <li>• 规约动作：rn（用第n个产生式规约，仅对FOLLOW集中的符号）</li>
                <li>• 接受动作：acc（接受输入串）</li>
                <li>• 状态转移：直接填写目标状态号</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 验证按钮 -->
        <div class="flex justify-center gap-4">
          <button
            @click="validateTable"
            :disabled="isValidating"
            class="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 transition-colors"
          >
            <Icon
              :icon="isValidating ? 'lucide:loader-2' : 'lucide:check-circle'"
              :class="['w-4 h-4 inline mr-2', isValidating ? 'animate-spin' : '']"
            />
            {{ isValidating ? '验证中...' : '验证分析表' }}
          </button>

          <button
            @click="showAnswer"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icon icon="lucide:eye" class="w-4 h-4 inline mr-2" />
            显示答案
          </button>
        </div>

        <!-- 验证结果 -->
        <div v-if="validationMessage" class="mt-4">
          <div
            :class="[
              'p-4 rounded-lg border',
              validationSuccess
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800',
            ]"
          >
            <div class="flex items-start gap-2">
              <Icon
                :icon="validationSuccess ? 'lucide:check-circle' : 'lucide:alert-circle'"
                class="w-5 h-5 mt-0.5 flex-shrink-0"
              />
              <div>
                <p class="font-medium">{{ validationSuccess ? '验证成功' : '验证失败' }}</p>
                <p class="text-sm mt-1">{{ validationMessage }}</p>
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
        <div class="text-sm text-gray-500">步骤 4 / 5</div>
        <button
          @click="nextStep"
          :disabled="!isStepComplete"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            isStepComplete
              ? 'bg-cyan-600 text-white hover:bg-cyan-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
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
import { ref, computed, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useSLR1Store } from '@/stores/slr1'

interface ParseTableRow {
  actions: Record<string, string>
  gotos: Record<string, string>
}

const emit = defineEmits<{
  'next-step': []
  'prev-step': []
}>()

const slr1Store = useSLR1Store()

// 响应式数据
const parseTable = ref<ParseTableRow[]>([])
const isValidating = ref(false)
const validationMessage = ref('')
const validationSuccess = ref(false)

// 从store获取分析数据
const analysisData = computed(() => slr1Store.analysisResult)

// FOLLOW集数据 - 如果后端提供的话
const followSets = computed(() => {
  // 如果后端提供FOLLOW集数据，在这里获取
  // 目前先返回空对象，可以根据实际后端数据结构调整
  return {}
})

// 计算属性
const stateCount = computed(() => {
  return slr1Store.dfaStates.length || 0
})

const terminals = computed(() => {
  if (!analysisData.value?.Vt) return []
  return analysisData.value.Vt.map((item: any) => item.text || item)
})

const nonterminals = computed(() => {
  if (!analysisData.value?.Vn) return []
  return analysisData.value.Vn.filter((item: any) => {
    const text = item.text || item
    return text !== analysisData.value?.S + "'"
  }).map((item: any) => item.text || item)
})

const isStepComplete = computed(() => {
  return validationSuccess.value
})

// 检查表格完成度
const checkTableCompletion = () => {
  // 重置验证状态
  validationMessage.value = ''
  validationSuccess.value = false
}

// 获取正确的ACTION表项
const getCorrectAction = (stateIndex: number, symbol: string): string => {
  if (!analysisData.value?.actions || typeof analysisData.value.actions !== 'object') return ''

  // actions是一个Record<string, string>，需要构造正确的key
  const key = `${stateIndex},${symbol}`
  return analysisData.value.actions[key] || ''
}

// 获取正确的GOTO表项
const getCorrectGoto = (stateIndex: number, symbol: string): string => {
  if (!analysisData.value?.gotos || typeof analysisData.value.gotos !== 'object') return ''

  // gotos是一个Record<string, string>，需要构造正确的key
  const key = `${stateIndex},${symbol}`
  return analysisData.value.gotos[key] || ''
}

// 验证分析表
const validateTable = async () => {
  if (!analysisData.value) return

  isValidating.value = true
  validationMessage.value = ''

  try {
    let isAllCorrect = true

    // 验证ACTION表和GOTO表
    for (let stateIndex = 0; stateIndex < parseTable.value.length; stateIndex++) {
      const row = parseTable.value[stateIndex]

      // 检查ACTION列
      for (const terminal of terminals.value) {
        const userInput = row.actions[terminal]?.trim() || ''
        const correctAnswer = getCorrectAction(stateIndex, terminal)

        if (userInput !== correctAnswer) {
          isAllCorrect = false
          break
        }
      }

      // 检查$列
      const userInputDollar = row.actions['$']?.trim() || ''
      const correctAnswerDollar = getCorrectAction(stateIndex, '#') // 后端使用#表示$
      if (userInputDollar !== correctAnswerDollar) {
        isAllCorrect = false
      }

      // 检查GOTO列
      for (const nonterminal of nonterminals.value) {
        const userInput = row.gotos[nonterminal]?.trim() || ''
        const correctAnswer = getCorrectGoto(stateIndex, nonterminal)

        if (userInput !== correctAnswer) {
          isAllCorrect = false
          break
        }
      }

      if (!isAllCorrect) break
    }

    if (isAllCorrect) {
      validationSuccess.value = true
      validationMessage.value = 'SLR1分析表构建正确！'

      // 保存解析表到store（如果需要的话）
      slr1Store.actionTable = Object.fromEntries(
        parseTable.value.flatMap((row, index) =>
          Object.entries(row.actions).map(([symbol, action]) => [`${index},${symbol}`, action]),
        ),
      )
      slr1Store.gotoTable = Object.fromEntries(
        parseTable.value.flatMap((row, index) =>
          Object.entries(row.gotos).map(([symbol, goto]) => [`${index},${symbol}`, goto]),
        ),
      )
    } else {
      validationSuccess.value = false
      validationMessage.value = '分析表存在错误，请检查填写'
    }
  } catch (error) {
    console.error('验证失败:', error)
    validationSuccess.value = false
    validationMessage.value = '验证失败，请检查输入'
  } finally {
    isValidating.value = false
  }
}

// 显示答案
const showAnswer = async () => {
  if (!analysisData.value) return

  try {
    // 填充正确答案到表格
    for (let stateIndex = 0; stateIndex < parseTable.value.length; stateIndex++) {
      const row = parseTable.value[stateIndex]

      // 填充ACTION列
      for (const terminal of terminals.value) {
        row.actions[terminal] = getCorrectAction(stateIndex, terminal)
      }

      // 填充$列
      row.actions['$'] = getCorrectAction(stateIndex, '#') // 后端使用#表示$

      // 填充GOTO列
      for (const nonterminal of nonterminals.value) {
        row.gotos[nonterminal] = getCorrectGoto(stateIndex, nonterminal)
      }
    }

    validationMessage.value = '已显示标准答案'
    validationSuccess.value = true
  } catch (error) {
    console.error('显示答案失败:', error)
    validationMessage.value = '显示答案失败'
  }
}

// 初始化分析表
const initializeParseTable = () => {
  if (!analysisData.value || !slr1Store.dfaStates.length) return

  const stateCount = slr1Store.dfaStates.length

  // 创建空的分析表
  parseTable.value = Array.from({ length: stateCount }, () => ({
    actions: {
      ...terminals.value.reduce(
        (acc: Record<string, string>, t: string) => ({ ...acc, [t]: '' }),
        {},
      ),
      $: '',
    },
    gotos: nonterminals.value.reduce(
      (acc: Record<string, string>, nt: string) => ({ ...acc, [nt]: '' }),
      {},
    ),
  }))
}

// 下一步
const nextStep = () => {
  if (isStepComplete.value) {
    emit('next-step')
  }
}

// 监听分析数据变化
watch(
  () => analysisData.value,
  () => {
    if (analysisData.value) {
      initializeParseTable()
    }
  },
  { immediate: true },
)

watch(
  () => slr1Store.dfaStates,
  () => {
    if (slr1Store.dfaStates.length > 0) {
      initializeParseTable()
    }
  },
  { immediate: true },
)

// 组件挂载时初始化
onMounted(() => {
  if (analysisData.value && slr1Store.dfaStates.length > 0) {
    initializeParseTable()
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
  background: #cffafe;
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
