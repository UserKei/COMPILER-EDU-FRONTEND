<template>
  <div class="subset-construction-step">
    <!-- 步骤头部 -->
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:table" class="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">子集构造法</h2>
          <p class="text-gray-600 mt-1">第三步：使用子集构造法生成转换表和状态转换矩阵</p>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="step-content">
      <div class="space-y-6">
        <!-- NFA 参考图 -->
        <div class="nfa-reference">
          <div class="bg-white border border-gray-200 rounded-lg">
            <div class="border-b border-gray-200 p-4">
              <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                <Icon icon="lucide:share-2" class="w-5 h-5 text-blue-600" />
                NFA 图（参考）
              </h3>
              <p class="text-sm text-gray-600 mt-1">根据此 NFA 图填写下方的转换表和状态转换矩阵</p>
            </div>
            <div class="p-6">
              <div v-if="faStore.nfaDotString" class="nfa-svg-container bg-gray-50 rounded-lg p-4 overflow-auto">
                <div v-html="nfaSvg" class="flex justify-center"></div>
              </div>
              <div v-else class="text-center py-8 text-gray-500">
                <Icon icon="lucide:image-off" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>暂无 NFA 图数据</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 转换表区域 -->
        <div class="conversion-table-section">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 左侧：用户填写转换表 -->
            <div class="user-table-section">
              <div class="bg-white border border-gray-200 rounded-lg">
                <div class="border-b border-gray-200 p-4">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">NFA → DFA 转换表（用户填写）</h3>
                    <div class="flex items-center gap-2">
                      <button
                        @click="addTableRow"
                        class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Icon icon="lucide:plus" class="w-4 h-4 inline mr-1" />
                        添加行
                      </button>
                      <button
                        @click="clearUserTable"
                        class="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Icon icon="lucide:eraser" class="w-4 h-4 inline mr-1" />
                        清空
                      </button>
                      <button
                        @click="handleValidateTable"
                        class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        <Icon icon="lucide:check-circle" class="w-4 h-4 inline mr-1" />
                        检验答案
                      </button>
                    </div>
                  </div>
                </div>

                <div class="p-4">
                  <div v-if="!userConversionTable.length" class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:edit" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>点击"添加行"开始填写转换表</p>
                  </div>

                  <div v-else class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr class="bg-gray-50">
                          <th class="border border-gray-300 px-3 py-2 text-left font-semibold">新状态</th>
                          <th
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2 text-center font-semibold"
                          >
                            {{ symbol }}
                          </th>
                          <th class="border border-gray-300 px-3 py-2 text-center font-semibold">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, index) in userConversionTable"
                          :key="index"
                          :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                        >
                          <td class="border border-gray-300 px-3 py-2">
                            <input
                              v-model="row.state"
                              type="text"
                              placeholder="状态名"
                              :class="getFieldClass(index, 'state', 'table')"
                              @blur="() => validateField(row.state, index, 'state', 'table')"
                            />
                          </td>
                          <td
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2"
                          >
                            <input
                              v-model="row.transitions[symbol]"
                              type="text"
                              placeholder="-"
                              :class="getFieldClass(index, symbol, 'table') + ' text-center'"
                              @blur="() => validateField(row.transitions[symbol], index, symbol, 'table')"
                            />
                          </td>
                          <td class="border border-gray-300 px-3 py-2 text-center">
                            <button
                              @click="removeTableRow(index)"
                              class="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Icon icon="lucide:trash-2" class="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 转换表错误信息显示 -->
                  <div v-if="showTableErrors && Object.keys(tableValidationErrors).length > 0" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div class="flex items-start gap-2">
                      <Icon icon="lucide:alert-circle" class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 class="font-medium text-red-800 mb-2">转换表填写错误</h4>
                        <ul class="text-sm text-red-700 space-y-1">
                          <li v-for="(errors, fieldKey) in tableValidationErrors" :key="fieldKey">
                            <strong>{{ formatFieldKey(fieldKey, 'table') }}：</strong>
                            <span v-for="(error, index) in errors" :key="index">
                              {{ error }}{{ index < errors.length - 1 ? '，' : '' }}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧：答案区域 -->
            <div class="answer-table-section">
              <div class="bg-white border border-gray-200 rounded-lg">
                <div class="border-b border-gray-200 p-4">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">标准答案</h3>
                    <button
                      @click="toggleTableAnswer"
                      :class="[
                        'px-4 py-2 rounded-lg transition-colors',
                        showTableAnswer
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      ]"
                    >
                      <Icon
                        :icon="showTableAnswer ? 'lucide:eye-off' : 'lucide:eye'"
                        class="w-4 h-4 inline mr-2"
                      />
                      {{ showTableAnswer ? '隐藏答案' : '查看答案' }}
                    </button>
                  </div>
                </div>

                <div class="p-4">
                  <div v-if="!showTableAnswer" class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:lock" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p class="text-lg font-medium">答案已隐藏</p>
                    <p class="text-sm mt-1">完成填写后点击"查看答案"按钮</p>
                  </div>

                  <div v-else-if="answerConversionTable.length" class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr class="bg-green-50">
                          <th class="border border-gray-300 px-3 py-2 text-left font-semibold">新状态</th>
                          <th
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2 text-center font-semibold"
                          >
                            {{ symbol }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, index) in answerConversionTable"
                          :key="index"
                          :class="index % 2 === 0 ? 'bg-white' : 'bg-green-50'"
                        >
                          <td class="border border-gray-300 px-3 py-2 font-medium">
                            {{ row.state }}
                          </td>
                          <td
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2 text-center"
                          >
                            {{ row.transitions[symbol] || '-' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div v-else class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:alert-circle" class="w-8 h-8 mx-auto mb-2" />
                    <p>暂无答案数据</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 状态转换矩阵区域 -->
        <div class="transition-matrix-section">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 左侧：用户填写状态转换矩阵 -->
            <div class="user-matrix-section">
              <div class="bg-white border border-gray-200 rounded-lg">
                <div class="border-b border-gray-200 p-4">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">状态转换矩阵（用户填写）</h3>
                    <div class="flex items-center gap-2">
                      <button
                        @click="addMatrixRow"
                        class="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      >
                        <Icon icon="lucide:plus" class="w-4 h-4 inline mr-1" />
                        添加行
                      </button>
                      <button
                        @click="clearUserMatrix"
                        class="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Icon icon="lucide:eraser" class="w-4 h-4 inline mr-1" />
                        清空
                      </button>
                      <button
                        @click="handleValidateMatrix"
                        class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        <Icon icon="lucide:check-circle" class="w-4 h-4 inline mr-1" />
                        检验答案
                      </button>
                    </div>
                  </div>
                </div>

                <div class="p-4">
                  <div v-if="!userTransitionMatrix.length" class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:grid-3x3" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>点击"添加行"开始填写状态转换矩阵</p>
                  </div>

                  <div v-else class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr class="bg-purple-50">
                          <th class="border border-gray-300 px-3 py-2 text-left font-semibold">状态</th>
                          <th
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2 text-center font-semibold"
                          >
                            {{ symbol }}
                          </th>
                          <th class="border border-gray-300 px-3 py-2 text-center font-semibold">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, index) in userTransitionMatrix"
                          :key="index"
                          :class="index % 2 === 0 ? 'bg-white' : 'bg-purple-50'"
                        >
                          <td class="border border-gray-300 px-3 py-2">
                            <input
                              v-model="row.state"
                              type="text"
                              placeholder="状态编号"
                              :class="getFieldClass(index, 'state', 'matrix')"
                              @blur="() => validateField(row.state, index, 'state', 'matrix')"
                            />
                          </td>
                          <td
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2"
                          >
                            <input
                              v-model="row.transitions[symbol]"
                              type="text"
                              placeholder="-"
                              :class="getFieldClass(index, symbol, 'matrix') + ' text-center'"
                              @blur="() => validateField(row.transitions[symbol], index, symbol, 'matrix')"
                            />
                          </td>
                          <td class="border border-gray-300 px-3 py-2 text-center">
                            <button
                              @click="removeMatrixRow(index)"
                              class="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Icon icon="lucide:trash-2" class="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 矩阵错误信息显示 -->
                  <div v-if="showMatrixErrors && Object.keys(matrixValidationErrors).length > 0" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div class="flex items-start gap-2">
                      <Icon icon="lucide:alert-circle" class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 class="font-medium text-red-800 mb-2">状态转换矩阵填写错误</h4>
                        <ul class="text-sm text-red-700 space-y-1">
                          <li v-for="(errors, fieldKey) in matrixValidationErrors" :key="fieldKey">
                            <strong>{{ formatFieldKey(fieldKey, 'matrix') }}：</strong>
                            <span v-for="(error, index) in errors" :key="index">
                              {{ error }}{{ index < errors.length - 1 ? '，' : '' }}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧：答案区域 -->
            <div class="answer-matrix-section">
              <div class="bg-white border border-gray-200 rounded-lg">
                <div class="border-b border-gray-200 p-4">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">标准答案</h3>
                    <button
                      @click="toggleMatrixAnswer"
                      :class="[
                        'px-4 py-2 rounded-lg transition-colors',
                        showMatrixAnswer
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      ]"
                    >
                      <Icon
                        :icon="showMatrixAnswer ? 'lucide:eye-off' : 'lucide:eye'"
                        class="w-4 h-4 inline mr-2"
                      />
                      {{ showMatrixAnswer ? '隐藏答案' : '查看答案' }}
                    </button>
                  </div>
                </div>

                <div class="p-4">
                  <div v-if="!showMatrixAnswer" class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:lock" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p class="text-lg font-medium">答案已隐藏</p>
                    <p class="text-sm mt-1">完成填写后点击"查看答案"按钮</p>
                  </div>

                  <div v-else-if="answerTransitionMatrix.length" class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr class="bg-green-50">
                          <th class="border border-gray-300 px-3 py-2 text-left font-semibold">状态</th>
                          <th
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2 text-center font-semibold"
                          >
                            {{ symbol }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, index) in answerTransitionMatrix"
                          :key="index"
                          :class="index % 2 === 0 ? 'bg-white' : 'bg-green-50'"
                        >
                          <td class="border border-gray-300 px-3 py-2 font-medium">
                            {{ row.state }}
                          </td>
                          <td
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2 text-center"
                          >
                            {{ row.transitions[symbol] || '-' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div v-else class="text-center py-8 text-gray-500">
                    <Icon icon="lucide:alert-circle" class="w-8 h-8 mx-auto mb-2" />
                    <p>暂无答案数据</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 填写提示 -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <Icon icon="lucide:lightbulb" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 class="font-medium text-blue-800">填写提示</h4>
              <ul class="text-sm text-blue-700 mt-2 space-y-1">
                <li>• 转换表：记录从NFA状态集合到新DFA状态的映射关系</li>
                <li>• 状态转换矩阵：用数字编号表示状态间的转换关系</li>
                <li>• 无转换的格子可以填写"-"或留空</li>
                <li>• 完成填写后可以查看标准答案进行对比</li>
              </ul>
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
          步骤 3 / 6
        </div>

        <button
          @click="proceedToNext"
          :disabled="!constructionComplete"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            constructionComplete
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
import { ref, computed, onMounted, type Ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useFAStore } from '@/stores'
import { instance } from '@viz-js/viz'

// 类型定义
interface TableRow {
  state: string
  transitions: Record<string, string>
}

type TableType = 'table' | 'matrix'

defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 使用 FA Store
const faStore = useFAStore()

// NFA SVG 渲染
const nfaSvg = ref('')

// 用户填写的表格
const userConversionTable = ref<TableRow[]>([])
const userTransitionMatrix = ref<TableRow[]>([])

// 答案数据
const answerConversionTable = ref<TableRow[]>([])
const answerTransitionMatrix = ref<TableRow[]>([])

// 答案显示控制
const showTableAnswer = ref(false)
const showMatrixAnswer = ref(false)

// 字母表符号和DFA状态
const alphabetSymbols = ref<string[]>([])
const dfaStates = ref<string[]>([])

// 验证状态管理
const tableValidationErrors = ref<Record<string, string[]>>({}) // 每个字段的错误信息
const matrixValidationErrors = ref<Record<string, string[]>>({})
const tableFieldValidation = ref<Record<string, 'valid' | 'invalid' | 'normal'>>({}) // 字段验证状态
const matrixFieldValidation = ref<Record<string, 'valid' | 'invalid' | 'normal'>>({})
const showTableErrors = ref(false) // 是否显示转换表错误
const showMatrixErrors = ref(false) // 是否显示矩阵错误

// 计算属性
const constructionComplete = computed(() => {
  const hasContent = userConversionTable.value.length > 0 && userTransitionMatrix.value.length > 0
  const hasNoErrors = Object.keys(tableValidationErrors.value).length === 0 &&
                     Object.keys(matrixValidationErrors.value).length === 0
  return hasContent && hasNoErrors
})

const totalTransitions = computed(() => {
  return answerConversionTable.value.reduce((total, row) => {
    return total + Object.values(row.transitions).filter(t => t && t !== '-').length
  }, 0)
})

// 通用表格操作函数
const createTableOperations = (tableRef: Ref<TableRow[]>) => ({
  addRow: () => {
    const newRow: TableRow = {
      state: '',
      transitions: {}
    }

    // 为每个字母表符号初始化空的转换
    alphabetSymbols.value.forEach(symbol => {
      newRow.transitions[symbol] = ''
    })

    tableRef.value.push(newRow)
  },

  removeRow: (index: number) => {
    tableRef.value.splice(index, 1)
  },

  clear: () => {
    tableRef.value = []
  }
})

// 表格操作
const tableOps = createTableOperations(userConversionTable)
const matrixOps = createTableOperations(userTransitionMatrix)

// 表格操作方法（重写以包含验证状态清理）
const addTableRow = tableOps.addRow
const removeTableRow = tableOps.removeRow
const clearUserTable = () => {
  tableOps.clear()
  tableValidationErrors.value = {}
  tableFieldValidation.value = {}
  showTableErrors.value = false
}

const addMatrixRow = matrixOps.addRow
const removeMatrixRow = matrixOps.removeRow
const clearUserMatrix = () => {
  matrixOps.clear()
  matrixValidationErrors.value = {}
  matrixFieldValidation.value = {}
  showMatrixErrors.value = false
}

// 验证功能
const validateField = (value: string | undefined, rowIndex: number, field: string, tableType: 'table' | 'matrix') => {
  const fieldKey = `${tableType}-${rowIndex}-${field}`
  const errors: string[] = []

  // 确保value是字符串
  const fieldValue = value || ''

  console.log('Validating field:', { fieldKey, fieldValue, rowIndex, field, tableType })

  // 1. 检查是否为空
  if (!fieldValue || fieldValue.trim() === '') {
    if (field === 'state') {
      errors.push('状态名称不能为空')
    } else {
      errors.push('转换关系不能为空')
    }
  }

  // 2. 如果是状态字段，检查状态来源合法性
  if (field === 'state' && fieldValue && fieldValue.trim() !== '') {
    const isValidState = validateStateSource(fieldValue.trim(), rowIndex, tableType)
    if (!isValidState) {
      errors.push('新状态必须来源于之前行的转换结果')
    }
  }

  // 3. 如果是转换字段，检查转换正确性
  if (field !== 'state' && fieldValue && fieldValue.trim() !== '') {
    const isValidTransition = validateTransition(rowIndex, field, fieldValue.trim(), tableType)
    if (!isValidTransition) {
      errors.push('转换结果与标准答案不符')
    }
  }

  // 更新验证状态
  const validationRef = tableType === 'table' ? tableValidationErrors : matrixValidationErrors
  const fieldValidationRef = tableType === 'table' ? tableFieldValidation : matrixFieldValidation

  if (errors.length > 0) {
    console.log('Setting errors for field:', fieldKey, errors)
    validationRef.value[fieldKey] = errors
    fieldValidationRef.value[fieldKey] = 'invalid'
    // 失焦验证时也要显示错误信息
    if (tableType === 'table') {
      showTableErrors.value = true
      console.log('Table errors after setting:', tableValidationErrors.value)
      console.log('showTableErrors:', showTableErrors.value)
    } else {
      showMatrixErrors.value = true
      console.log('Matrix errors after setting:', matrixValidationErrors.value)
      console.log('showMatrixErrors:', showMatrixErrors.value)
    }
  } else {
    console.log('Clearing errors for field:', fieldKey)
    delete validationRef.value[fieldKey]
    fieldValidationRef.value[fieldKey] = 'valid'
    // 检查是否还有其他错误，如果没有则隐藏错误面板
    if (Object.keys(validationRef.value).length === 0) {
      if (tableType === 'table') {
        showTableErrors.value = false
      } else {
        showMatrixErrors.value = false
      }
    }
  }

  console.log('Validation complete for field:', fieldKey, 'Errors count:', errors.length)
}

// 验证状态来源合法性
const validateStateSource = (stateName: string, currentRowIndex: number, tableType: 'table' | 'matrix'): boolean => {
  // 第一行的状态（通常是初始状态）总是合法的
  if (currentRowIndex === 0) return true

  const tableData = tableType === 'table' ? userConversionTable.value : userTransitionMatrix.value

  // 检查该状态是否在之前的行中作为转换结果出现过
  for (let i = 0; i < currentRowIndex; i++) {
    const row = tableData[i]
    for (const symbol of alphabetSymbols.value) {
      const transition = row.transitions[symbol]?.trim()
      if (transition && transition !== '-' && transition.includes(stateName)) {
        return true
      }
    }
  }

  return false
}

// 验证转换正确性
const validateTransition = (rowIndex: number, symbol: string, userValue: string, tableType: 'table' | 'matrix'): boolean => {
  const answerData = tableType === 'table' ? answerConversionTable.value : answerTransitionMatrix.value
  const userData = tableType === 'table' ? userConversionTable.value : userTransitionMatrix.value

  // 根据用户输入的状态名找到对应的答案行
  const userState = userData[rowIndex]?.state?.trim()
  if (!userState) return false

  const answerRow = answerData.find(row => row.state === userState)
  if (!answerRow) return false

  const correctValue = answerRow.transitions[symbol] || '-'
  return userValue === correctValue
}

// 验证整个表格
const validateTable = (tableType: 'table' | 'matrix') => {
  const tableData = tableType === 'table' ? userConversionTable.value : userTransitionMatrix.value

  tableData.forEach((row, rowIndex) => {
    // 验证状态字段
    validateField(row.state, rowIndex, 'state', tableType)

    // 验证每个转换字段
    alphabetSymbols.value.forEach(symbol => {
      const value = row.transitions[symbol] || ''
      validateField(value, rowIndex, symbol, tableType)
    })
  })

  // 显示错误信息
  if (tableType === 'table') {
    showTableErrors.value = Object.keys(tableValidationErrors.value).length > 0
  } else {
    showMatrixErrors.value = Object.keys(matrixValidationErrors.value).length > 0
  }
}

// 获取字段的CSS类
const getFieldClass = (rowIndex: number, field: string, tableType: 'table' | 'matrix') => {
  const fieldKey = `${tableType}-${rowIndex}-${field}`
  const fieldValidationRef = tableType === 'table' ? tableFieldValidation : matrixFieldValidation
  const validationStatus = fieldValidationRef.value[fieldKey]

  const baseClass = 'w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1'

  if (validationStatus === 'valid') {
    return `${baseClass} border-green-500 bg-green-50 focus:ring-green-500`
  } else if (validationStatus === 'invalid') {
    return `${baseClass} border-red-500 bg-red-50 focus:ring-red-500`
  } else {
    const ringColor = tableType === 'table' ? 'focus:ring-blue-500' : 'focus:ring-purple-500'
    return `${baseClass} border-gray-300 ${ringColor}`
  }
}

// 手动验证按钮处理
const handleValidateTable = () => {
  validateTable('table')
}

const handleValidateMatrix = () => {
  validateTable('matrix')
}

// 格式化错误信息的辅助函数
const formatFieldKey = (fieldKey: string, tableType: 'table' | 'matrix') => {
  const parts = fieldKey.split('-')
  if (parts.length >= 3) {
    const rowIndex = parseInt(parts[1]) + 1 // 转换为1-based索引
    const fieldName = parts[2]

    if (fieldName === 'state') {
      return `第${rowIndex}行状态字段`
    } else {
      return `第${rowIndex}行符号"${fieldName}"`
    }
  }
  return fieldKey
}

// 渲染 NFA SVG
const renderNFASvg = async () => {
  if (faStore.nfaDotString) {
    try {
      const viz = await instance()
      const svg = viz.renderSVGElement(faStore.nfaDotString)
      nfaSvg.value = svg.outerHTML
    } catch (error) {
      console.error('渲染 NFA SVG 失败：', error)
      nfaSvg.value = ''
    }
  }
}

// 从FA数据中提取字母表符号
const extractAlphabetFromFAData = (data: any) => {
  const symbols = new Set<string>()

  // 从转换表中提取符号
  if (data.table) {
    Object.keys(data.table).forEach(symbol => {
      if (symbol !== 'I' && symbol !== 'ε' && symbol !== 'epsilon') {
        symbols.add(symbol)
      }
    })
  }

  alphabetSymbols.value = Array.from(symbols).sort()
}

// 通用数据处理函数
const processTableData = (table: any, symbols: string[]): TableRow[] => {
  if (!table) return []

  const result: TableRow[] = []
  const stateCount = table[symbols[0]]?.length || 0

  for (let i = 0; i < stateCount; i++) {
    const row: TableRow = {
      state: `S${i}`,
      transitions: {}
    }

    symbols.forEach(symbol => {
      const transition = table[symbol][i]
      if (Array.isArray(transition)) {
        row.transitions[symbol] = transition.join('') || '-'
      } else {
        row.transitions[symbol] = transition || '-'
      }
    })

    result.push(row)
  }

  return result
}

const processMatrixData = (tableToNum: any, symbols: string[]): TableRow[] => {
  if (!tableToNum) return []

  const result: TableRow[] = []
  const allStates = Object.keys(tableToNum)
  const sKeys = allStates.filter(x => x === 'S')
  const nonSKeys = allStates.filter(x => x !== 'S').sort()
  const stateKeys = [...sKeys, ...nonSKeys]

  stateKeys.forEach((state) => {
    const row: TableRow = {
      state: state,
      transitions: {}
    }

    const stateTransitions = tableToNum[state] || []
    symbols.forEach((symbol, symbolIndex) => {
      row.transitions[symbol] = stateTransitions[symbolIndex] || '-'
    })

    result.push(row)
  })

  return result
}

// 生成答案数据（同步处理）
const generateAnswerData = (data: any) => {
  const symbols = Object.keys(data.table || {}).filter(symbol =>
    symbol !== 'I' && symbol !== 'ε' && symbol !== 'epsilon'
  ).sort()

  // 生成转换表答案
  answerConversionTable.value = processTableData(data.table, symbols)

  // 生成状态转换矩阵答案
  answerTransitionMatrix.value = processMatrixData(data.table_to_num, symbols)

  // 更新DFA状态
  dfaStates.value = answerConversionTable.value.map(row => row.state)
}

// 答案显示控制
const toggleTableAnswer = () => {
  showTableAnswer.value = !showTableAnswer.value
}

const toggleMatrixAnswer = () => {
  showMatrixAnswer.value = !showMatrixAnswer.value
}

// 进入下一步
const proceedToNext = () => {
  if (constructionComplete.value) {
    const stepData = {
      conversionTable: answerConversionTable.value,
      transitionMatrix: answerTransitionMatrix.value,
      dfaStates: dfaStates.value,
      alphabetSymbols: alphabetSymbols.value,
      totalTransitions: totalTransitions.value,
      userConversionTable: userConversionTable.value,
      userTransitionMatrix: userTransitionMatrix.value,
      timestamp: new Date().toISOString()
    }

    localStorage.setItem('fa-step3-data', JSON.stringify(stepData))
    document.dispatchEvent(new CustomEvent('next-step'))
  }
}

// 组件挂载时的初始化
onMounted(() => {
  if (!faStore.hasResult()) {
    console.warn('No FA data found, please complete step 1 first')
    return
  }

  try {
    const faResult = faStore.originalData
    if (faResult) {
      extractAlphabetFromFAData(faResult)
      generateAnswerData(faResult)
      renderNFASvg()
    }
  } catch (error) {
    console.error('处理FA数据失败：', error)
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
