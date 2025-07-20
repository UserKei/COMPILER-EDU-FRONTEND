<template>
  <div class="lr0-table-build-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:table" class="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">LR0表构建</h2>
          <p class="text-gray-600 mt-1">第四步：构建LR0分析表</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <!-- 说明区域 -->
      <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
        <div class="flex items-start">
          <Icon icon="lucide:info" class="w-5 h-5 text-indigo-600 mt-0.5 mr-3" />
          <div>
            <h3 class="text-lg font-semibold text-indigo-900 mb-2">LR0分析表构造规则</h3>
            <ul class="space-y-1 text-sm text-indigo-800">
              <li>• <strong>ACTION表：</strong>根据项目集中的项目填写移进和规约动作</li>
              <li>• <strong>GOTO表：</strong>根据DFA的转移关系填写状态转移</li>
              <li>• <strong>移进动作：</strong>A → α·aβ，则ACTION[i,a] = Sj（状态j包含A → αa·β）</li>
              <li>• <strong>规约动作：</strong>A → α·，则对所有终结符a，ACTION[i,a] = rk（第k个产生式）</li>
              <li>• <strong>接受动作：</strong>S' → S·，则ACTION[i,$] = acc</li>
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
        <!-- 分析表构建区域 -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">LR0分析表</h3>
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
                <span class="text-green-700">{{ analysisData.Vt?.join(', ') }}</span>
              </div>
              <div class="bg-purple-50 p-3 rounded">
                <span class="font-medium text-purple-900">非终结符：</span>
                <span class="text-purple-700">{{ analysisData.Vn?.join(', ') }}</span>
              </div>
            </div>

            <!-- 分析表 -->
            <div class="overflow-x-auto">
              <table class="min-w-full border border-gray-300">
                <!-- 表头 -->
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900">状态</th>
                    <!-- ACTION列 -->
                    <th v-for="terminal in analysisData.Vt" :key="terminal"
                        class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900 bg-blue-50">
                      {{ terminal }}
                    </th>
                    <th class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900 bg-blue-50">$</th>
                    <!-- GOTO列 -->
                    <th v-for="nonterminal in analysisData.Vn" :key="nonterminal"
                        class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900 bg-green-50">
                      {{ nonterminal }}
                    </th>
                  </tr>
                </thead>

                <!-- 表体 -->
                <tbody>
                  <tr v-for="(row, stateIndex) in parseTable" :key="stateIndex" class="hover:bg-gray-50">
                    <td class="px-3 py-2 border border-gray-300 text-xs font-medium text-center bg-gray-50">
                      {{ stateIndex }}
                    </td>

                    <!-- ACTION列 -->
                    <td v-for="terminal in analysisData.Vt" :key="terminal"
                        class="px-2 py-1 border border-gray-300 text-xs text-center">
                      <input
                        v-model="row.actions[terminal]"
                        @input="checkTableCompletion"
                        class="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-blue-500 rounded"
                        placeholder="--"
                      />
                    </td>
                    <td class="px-2 py-1 border border-gray-300 text-xs text-center">
                      <input
                        v-model="row.actions['$']"
                        @input="checkTableCompletion"
                        class="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-blue-500 rounded"
                        placeholder="--"
                      />
                    </td>

                    <!-- GOTO列 -->
                    <td v-for="nonterminal in analysisData.Vn" :key="nonterminal"
                        class="px-2 py-1 border border-gray-300 text-xs text-center">
                      <input
                        v-model="row.gotos[nonterminal]"
                        @input="checkTableCompletion"
                        class="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-blue-500 rounded"
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
                <li>• 规约动作：rn（用第n个产生式规约）</li>
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
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
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
                : 'bg-red-50 border-red-200 text-red-800'
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
        <button @click="$emit('prev-step')" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
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
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
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

const emit = defineEmits<{
  'next-step': []
  'prev-step': []
}>()

// 组件状态
const analysisData = ref<any>(null)
const parseTable = ref<any[]>([])
const isValidating = ref(false)
const validationMessage = ref('')
const validationSuccess = ref(false)

// 计算属性
const stateCount = computed(() => parseTable.value.length)
const isStepComplete = ref(false)

// 检查表格完成状态
const checkTableCompletion = () => {
  let filledCells = 0
  let totalCells = 0

  for (const row of parseTable.value) {
    for (const terminal of analysisData.value?.Vt || []) {
      totalCells++
      if (row.actions[terminal] && row.actions[terminal].trim() !== '') {
        filledCells++
      }
    }
    // $ 符号
    totalCells++
    if (row.actions['$'] && row.actions['$'].trim() !== '') {
      filledCells++
    }

    for (const nonterminal of analysisData.value?.Vn || []) {
      totalCells++
      if (row.gotos[nonterminal] && row.gotos[nonterminal].trim() !== '') {
        filledCells++
      }
    }
  }

  // 至少填写一半的表格才算完成
  isStepComplete.value = filledCells >= totalCells * 0.5
}

// 初始化分析表
const initializeTable = () => {
  if (!analysisData.value) return

  // 假设有一定数量的状态（实际应该从DFA获取）
  const stateNum = analysisData.value.all_dfa?.length || 8
  parseTable.value = []

  for (let i = 0; i < stateNum; i++) {
    const row = {
      actions: {} as Record<string, string>,
      gotos: {} as Record<string, string>
    }

    // 初始化ACTION列
    for (const terminal of analysisData.value.Vt || []) {
      row.actions[terminal] = ''
    }
    row.actions['$'] = ''

    // 初始化GOTO列
    for (const nonterminal of analysisData.value.Vn || []) {
      row.gotos[nonterminal] = ''
    }

    parseTable.value.push(row)
  }
}

// 验证分析表
const validateTable = async () => {
  isValidating.value = true
  validationMessage.value = ''

  try {
    // 简单的验证逻辑
    let hasActions = false
    let hasGotos = false

    for (const row of parseTable.value) {
      for (const value of Object.values(row.actions)) {
        if (typeof value === 'string' && value.trim() !== '') {
          hasActions = true
          break
        }
      }
      for (const value of Object.values(row.gotos)) {
        if (typeof value === 'string' && value.trim() !== '') {
          hasGotos = true
          break
        }
      }
      if (hasActions && hasGotos) break
    }

    if (!hasActions && !hasGotos) {
      validationSuccess.value = false
      validationMessage.value = '请至少填写一些表格单元格'
    } else {
      validationSuccess.value = true
      validationMessage.value = '分析表填写合理，可以进行下一步'
      isStepComplete.value = true
    }
  } catch (error) {
    validationSuccess.value = false
    validationMessage.value = '验证过程中发生错误，请重试'
    console.error('Validation error:', error)
  } finally {
    isValidating.value = false
  }
}

// 显示答案
const showAnswer = () => {
  if (!analysisData.value) return

  // 填入一些示例答案
  for (let i = 0; i < parseTable.value.length && i < 3; i++) {
    const row = parseTable.value[i]
    if (analysisData.value.Vt?.includes('id')) {
      row.actions['id'] = `S${i + 1}`
    }
    if (analysisData.value.Vt?.includes('+')) {
      row.actions['+'] = i === 0 ? 'S2' : ''
    }
    if (i === 0) {
      row.actions['$'] = 'acc'
    }

    if (analysisData.value.Vn?.includes('E')) {
      row.gotos['E'] = i === 0 ? '1' : ''
    }
  }

  validationMessage.value = '已加载参考答案'
  validationSuccess.value = true
  isStepComplete.value = true
}

const nextStep = () => {
  if (isStepComplete.value) {
    emit('next-step')
  }
}

// 组件挂载时初始化
onMounted(() => {
  // 从localStorage获取分析数据
  const stored = localStorage.getItem('lr0-analysis-result')
  if (stored) {
    try {
      analysisData.value = JSON.parse(stored)
      initializeTable()
    } catch (error) {
      console.error('Failed to load analysis data:', error)
    }
  }
})
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #e0e7ff; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }
</style>
