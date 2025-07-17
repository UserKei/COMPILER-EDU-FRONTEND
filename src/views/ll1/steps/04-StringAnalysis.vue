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
      <!-- 上方区域：输入串输入和文法快照 -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <!-- 左侧：输入串输入 (3/4空间) -->
        <div class="lg:col-span-3 sub-card">
          <h3 class="text-lg font-semibold text-purple-700 mb-4">输入串分析</h3>

          <!-- 输入区域 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">输入待分析字符串：</label>
            <div class="flex gap-4">
              <input
                v-model="inputString"
                type="text"
                placeholder="例如：i+i*i"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                @click="startAnalysis"
                :disabled="!inputString.trim()"
                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                开始分析
              </button>
              <button
                @click="resetAnalysis"
                class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                重置
              </button>
            </div>
          </div>

          <!-- 分析结果 -->
          <div v-if="analysisResult" class="p-4 rounded-lg" :class="analysisResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
            <h4 class="text-md font-semibold mb-2" :class="analysisResult.success ? 'text-green-700' : 'text-red-700'">
              分析结果：
            </h4>
            <p :class="analysisResult.success ? 'text-green-600' : 'text-red-600'">
              {{ analysisResult.message }}
            </p>
          </div>
        </div>

        <!-- 右侧：文法快照 (1/4空间) -->
        <div class="lg:col-span-1 sub-card">
          <h3 class="text-lg font-semibold text-green-700 mb-4">文法快照</h3>
          <div v-if="verifiedSnapshot">
            <div class="font-mono text-sm bg-white p-3 rounded border space-y-1">
              <div v-for="(rule, index) in verifiedSnapshot.rules" :key="'snap-'+index" class="text-gray-800">
                {{ rule.left }}->{{ rule.right }}
              </div>
            </div>
            <div v-if="verifiedSnapshot.info" class="mt-4 text-sm text-green-700">
              <p><strong>文法信息：</strong></p>
              <ul class="list-disc list-inside space-y-1 mt-2">
                <li>非终结符：{{ verifiedSnapshot.info.nonTerminals.join(', ') }}</li>
                <li>终结符：{{ verifiedSnapshot.info.terminals.filter(t => t !== 'ε').join(', ') }}</li>
                <li>产生式数量：{{ verifiedSnapshot.info.ruleCount }}</li>
                <li>开始符号：{{ verifiedSnapshot.info.nonTerminals[0] || '未指定' }}</li>
              </ul>
            </div>
            <div v-if="verifiedSnapshot.ll1Result" class="mt-2 text-xs text-green-700">
              <strong>后端分析 isLL1：</strong> {{ verifiedSnapshot.ll1Result.isLL1 ? '是' : '否' }}
            </div>
            <div v-if="stringAnalysisResult && inputString" class="mt-4 text-sm text-blue-700">
              <p><strong>当前输入串：</strong></p>
              <p class="font-mono bg-blue-50 p-2 rounded border">{{ inputString }}</p>
            </div>
          </div>
          <div v-else class="text-gray-400 text-sm py-8 text-center">暂无文法快照</div>
        </div>
      </div>

      <!-- 下方区域：LL1分析表和输入串分析表 -->
      <div v-if="inputString.trim() && stringAnalysisResult" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：LL1分析表 -->
        <div class="sub-card">
          <h3 class="text-lg font-semibold text-blue-700 mb-4">LL1分析表</h3>
          <div v-if="verifiedSnapshot?.ll1Result?.table" class="overflow-x-auto">
            <table class="ll1-table min-w-full text-sm border bg-white">
              <thead>
                <tr>
                  <th class="border px-2 py-1 bg-gray-100"> </th>
                  <th v-for="col in VtAll" :key="col" class="border px-2 py-1 ll1-th">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in Vn" :key="row">
                  <td class="border px-2 py-1 font-bold text-purple-700 bg-gray-100">{{ row }}</td>
                  <td v-for="col in VtAll" :key="row + '|' + col"
                    class="border px-2 py-1 ll1-cell cursor-pointer"
                    @dblclick="onLL1CellDblClick(row, col)"
                    :class="{ 'll1-cell-hint': hintActive && row === hintRow && col === hintCol }">
                    <span v-if="verifiedSnapshot.ll1Result.table[row + '|' + col]" class="ll1-prod-chip">
                      {{ row }}->{{ verifiedSnapshot.ll1Result.table[row + '|' + col] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-gray-400 text-sm py-8 text-center">暂无LL1分析表数据</div>
          <div class="mt-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 font-medium">
            温馨提示：<span class="font-bold">双击</span>表格中的产生式可进行推导操作。
          </div>
        </div>

        <!-- 右侧：输入串分析表答题区 -->
        <div class="sub-card">
          <div class="mb-3">
            <div class="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 flex items-start gap-2 text-yellow-800 text-sm">
              <Icon icon="lucide:info" class="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-500" />
              <div>
                <div class="font-bold mb-1">操作指引：</div>
                <ul class="list-disc list-inside space-y-1">
                  <li>每一步请根据当前"分析栈"和"输入串"判断操作。</li>
                  <li>若栈顶为非终结符，双击左侧 LL1 分析表对应单元格（如 E 行 ( 列）进行推导。</li>
                  <li>若栈顶与输入串首字符相同，点击 <span class="font-bold text-green-700">匹配</span> 按钮。</li>
                  <li>如操作失误可点击 <span class="font-bold text-gray-700">回退</span>，重新开始可点 <span class="font-bold text-gray-700">重做</span>。</li>
                  <li>遇到不会做时可点击 <span class="font-bold text-yellow-700">提示</span>，系统会高亮推荐操作并自动填写下一步。</li>
                  <li>点击 <span class="font-bold text-blue-700">查看答案</span> 可显示完整标准分析过程。</li>
                </ul>
              </div>
            </div>
          </div>
          <h3 class="text-lg font-semibold text-orange-700 mb-4">输入串分析表（答题区）</h3>
          <div class="flex gap-3 mb-3">
            <button class="px-4 py-1 rounded bg-green-600 text-white hover:bg-green-700" @click="onMatch">匹配</button>
            <button class="px-4 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50" @click="onUndo" :disabled="userSteps.length <= 1">回退</button>
            <button class="px-4 py-1 rounded border border-blue-300 text-blue-700 bg-white hover:bg-blue-50" @click="onShowAnswer">查看答案</button>
            <button class="px-4 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50" @click="onResetUserSteps">重做</button>
            <button class="px-4 py-1 rounded border border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100" @click="onHint">提示</button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm border bg-white">
              <thead>
                <tr class="bg-gray-50">
                  <th class="border px-3 py-2">步骤</th>
                  <th class="border px-3 py-2">分析栈</th>
                  <th class="border px-3 py-2">输入串</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="!showAnswer">
                  <tr v-for="(step, idx) in (stringAnalysisResult?.info_step || [])" :key="idx">
                    <td class="border px-3 py-2 text-center">{{ step }}</td>
                    <td class="border px-3 py-2 font-mono">
                      <template v-if="idx === userSteps.length - 1 && hintActive && hintType === 'match'">
                        <span v-for="(ch, i) in (userSteps[idx]?.stack || '')" :key="i" :class="i === (userSteps[idx]?.stack.length || 1) - 1 ? 'hint-highlight' : ''">{{ ch }}</span>
                      </template>
                      <template v-else-if="idx === userSteps.length - 1 && hintActive && hintType === 'll1'">
                        <span v-for="(ch, i) in (userSteps[idx]?.stack || '')" :key="i" :class="i === (userSteps[idx]?.stack.length || 1) - 1 ? 'hint-highlight' : ''">{{ ch }}</span>
                      </template>
                      <template v-else>
                        {{ userSteps[idx]?.stack ?? '' }}
                      </template>
                    </td>
                    <td class="border px-3 py-2 font-mono">
                      <template v-if="idx === userSteps.length - 1 && hintActive && hintType === 'match'">
                        <span v-for="(ch, i) in (userSteps[idx]?.input || '')" :key="i" :class="i === 0 ? 'hint-highlight' : ''">{{ ch }}</span>
                      </template>
                      <template v-else-if="idx === userSteps.length - 1 && hintActive && hintType === 'll1'">
                        <span v-for="(ch, i) in (userSteps[idx]?.input || '')" :key="i" :class="i === 0 ? 'hint-highlight' : ''">{{ ch }}</span>
                      </template>
                      <template v-else>
                        {{ userSteps[idx]?.input ?? '' }}
                      </template>
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr v-for="(step, idx) in stringAnalysisResult?.info_step || []" :key="idx">
                    <td class="border px-3 py-2 text-center">{{ step }}</td>
                    <td class="border px-3 py-2 font-mono">{{ stringAnalysisResult && stringAnalysisResult.info_stack ? stringAnalysisResult.info_stack[idx] : '' }}</td>
                    <td class="border px-3 py-2 font-mono">{{ stringAnalysisResult && stringAnalysisResult.info_str ? stringAnalysisResult.info_str[idx] : '' }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
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
        <div class="text-sm text-gray-500">步骤 4 / 4</div>
        <button @click="complete" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          完成
          <Icon icon="lucide:check" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="message" class="fixed bottom-8 right-8 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
        :class="messageType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'">
        <Icon :icon="messageType === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'" class="w-5 h-5" />
        <span>{{ message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// 类型定义
interface GrammarRule {
  left: string
  right: string
}
interface GrammarInfo {
  nonTerminals: string[]
  terminals: string[]
  ruleCount: number
}
interface LL1Result {
  isLL1: boolean
  first: Record<string, string[]>
  follow: Record<string, string[]>
  formulas_dict: Record<string, string[]>
  Vn: string[]
  Vt: string[]
  table: Record<string, string>
}
interface StringAnalysisResult {
  info_msg: string[]
  info_res: string
  info_stack: string[]
  info_step: number[]
  info_str: string[]
}

interface GrammarSnapshot {
  rules: GrammarRule[]
  info: GrammarInfo | null
  timestamp: string
  ll1Result?: LL1Result
  inputString?: string
  stringAnalysisResult?: StringAnalysisResult
}

interface AnalysisResult {
  success: boolean
  message: string
}

const emit = defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 数据
const verifiedSnapshot = ref<GrammarSnapshot | null>(null)
const inputString = ref('')
const analysisResult = ref<AnalysisResult | null>(null)
const stringAnalysisResult = ref<StringAnalysisResult | null>(null)
const userSteps = ref<{ stack: string; input: string }[]>([])
const showAnswer = ref(false)
const hintActive = ref(false)
const hintRow = ref('')
const hintCol = ref('')
const hintType = ref<'ll1' | 'match' | ''>('')
const message = ref<string | null>(null)
const messageType = ref<'success' | 'error'>('success')
let messageTimer: number | null = null

// 计算属性
const Vn = computed(() => verifiedSnapshot.value?.ll1Result?.Vn || [])
const VtAll = computed(() => {
  const vt = verifiedSnapshot.value?.ll1Result?.Vt || []
  return [...vt, '#'] // 添加结束符
})

// 初始化
onMounted(() => {
  const snap = localStorage.getItem('ll1-grammar-snapshot')
  if (snap) {
    try {
      verifiedSnapshot.value = JSON.parse(snap)
      // 恢复输入串和分析结果
      if (verifiedSnapshot.value?.inputString) {
        inputString.value = verifiedSnapshot.value.inputString
      }
      if (verifiedSnapshot.value?.stringAnalysisResult) {
        stringAnalysisResult.value = verifiedSnapshot.value.stringAnalysisResult
        analysisResult.value = {
          success: verifiedSnapshot.value.stringAnalysisResult.info_res === 'Success!',
          message: verifiedSnapshot.value.stringAnalysisResult.info_res
        }
      }
    } catch {
      verifiedSnapshot.value = null
    }
  }
  initUserSteps()
})

// 分析函数
async function startAnalysis() {
  if (!inputString.value.trim() || !verifiedSnapshot.value?.ll1Result) {
    return
  }

  try {
    // 组装产生式数组
    const inpProductions = verifiedSnapshot.value.rules.map(rule => `${rule.left}->${rule.right}`)

    // 请求后端
    const res = await axios.post('http://127.0.0.1:5000/api/LL1AnalyseInp', {
      inpProductions,
      inpStr: inputString.value.trim()
    })

    if (res.data && res.data.code === 0) {
      // 保存分析结果
      stringAnalysisResult.value = res.data.data
      analysisResult.value = {
        success: res.data.data.info_res === 'Success!',
        message: res.data.data.info_res
      }

      // 更新全局快照
      const updatedSnapshot = {
        ...verifiedSnapshot.value,
        inputString: inputString.value.trim(),
        stringAnalysisResult: res.data.data
      }
      localStorage.setItem('ll1-grammar-snapshot', JSON.stringify(updatedSnapshot))
      verifiedSnapshot.value = updatedSnapshot

      // 显示成功消息
      showMessage('分析完成！', 'success')
      // 自动刷新答题区
      initUserSteps()
    } else {
      analysisResult.value = {
        success: false,
        message: '后端分析失败: ' + (res.data?.msg || '未知错误')
      }
    }
  } catch {
    analysisResult.value = {
      success: false,
      message: '请求后端失败，请检查服务是否启动'
    }
  }
}

function resetAnalysis() {
  inputString.value = ''
  analysisResult.value = null
  stringAnalysisResult.value = null

  // 清除全局快照中的分析数据
  if (verifiedSnapshot.value) {
         const updatedSnapshot = {
       ...verifiedSnapshot.value,
       inputString: '',
       stringAnalysisResult: undefined
     }
    localStorage.setItem('ll1-grammar-snapshot', JSON.stringify(updatedSnapshot))
    verifiedSnapshot.value = updatedSnapshot
  }
}

const complete = () => {
  const stepData = {
    completed: true,
    timestamp: new Date().toISOString()
  }

  localStorage.setItem('ll1-step4-data', JSON.stringify(stepData))
  emit('complete', stepData)

  showMessage('LL1语法分析流程已完成！', 'success')
}

// 初始化userSteps
function initUserSteps() {
  showAnswer.value = false
  if (verifiedSnapshot.value && inputString.value) {
    // 初始分析栈和输入串
    const startSymbol = verifiedSnapshot.value.ll1Result?.Vn[0] || ''
    userSteps.value = [{ stack: '#' + startSymbol, input: inputString.value + '#' }]
  } else {
    userSteps.value = []
  }
}

// LL1表双击
function onLL1CellDblClick(row: string, col: string) {
  if (showAnswer.value) return
  if (hintActive.value) {
    hintActive.value = false
    hintRow.value = ''
    hintCol.value = ''
    hintType.value = ''
  }
  const prod = verifiedSnapshot.value?.ll1Result?.table[row + '|' + col]
  if (!prod) return
  const last = userSteps.value[userSteps.value.length - 1]
  if (!last) return
  // 判断栈顶和当前输入符号
  const stackArr = last.stack.split('')
  const top = stackArr[stackArr.length - 1]
  if (top !== row) {
    showMessage('请先处理栈顶符号: ' + top, 'error')
    return
  }
  // 推导产生式
  stackArr.pop()
  if (prod !== 'ε') {
    for (let i = prod.length - 1; i >= 0; i--) {
      stackArr.push(prod[i])
    }
  }
  userSteps.value.push({ stack: stackArr.join(''), input: last.input })
}

// 匹配按钮
function onMatch() {
  if (showAnswer.value) return
  const last = userSteps.value[userSteps.value.length - 1]
  if (!last) return
  const stackArr = last.stack.split('')
  const inputArr = last.input.split('')
  const top = stackArr[stackArr.length - 1]
  const cur = inputArr[0]
  if (top === cur) {
    stackArr.pop()
    inputArr.shift()
    userSteps.value.push({ stack: stackArr.join(''), input: inputArr.join('') })
  } else {
    showMessage('栈顶符号与输入串首字符不匹配！', 'error')
  }
}

// 回退按钮
function onUndo() {
  if (showAnswer.value) return
  if (userSteps.value.length > 1) {
    userSteps.value.pop()
  }
}

// 查看答案
function onShowAnswer() {
  showAnswer.value = true
}

// 重做
function onResetUserSteps() {
  initUserSteps()
}

// 提示按钮
function onHint() {
  if (showAnswer.value) return
  const last = userSteps.value[userSteps.value.length - 1]
  if (!last) return
  const stackArr = last.stack.split('')
  const inputArr = last.input.split('')
  const top = stackArr[stackArr.length - 1]
  const cur = inputArr[0]
  // 匹配情形
  if (top === cur) {
    hintActive.value = true
    hintType.value = 'match'
    setTimeout(() => {
      onMatch()
      hintActive.value = false
      hintType.value = ''
    }, 800)
    return
  }
  // LL1表推导情形
  const prod = verifiedSnapshot.value?.ll1Result?.table[top + '|' + cur]
  if (prod) {
    hintActive.value = true
    hintRow.value = top
    hintCol.value = cur
    hintType.value = 'll1'
    setTimeout(() => {
      onLL1CellDblClick(top, cur)
      hintActive.value = false
      hintRow.value = ''
      hintCol.value = ''
      hintType.value = ''
    }, 800)
    return
  }
  showMessage('当前无法提示！', 'error')
}

function showMessage(msg: string, type: 'success' | 'error' = 'success') {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => {
    message.value = null
  }, 2000)
}
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #dcfce7; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }

.sub-card {
  background: #f8fafc;
  border-radius: 1rem;
  box-shadow: 0 4px 12px 0 rgba(16,30,54,0.12);
  border: 1px solid #d1d5db;
  padding: 1.5rem 1.2rem 1.2rem 1.2rem;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.ll1-table {
  border-collapse: collapse;
}

.ll1-th {
  background: #f3f4f6;
  font-weight: 600;
  text-align: center;
}

.ll1-cell {
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.ll1-cell:hover {
  background: #bae6fd !important;
  border-color: #2563eb !important;
  box-shadow: 0 2px 8px 0 rgba(37,99,235,0.10);
  z-index: 2;
}

.ll1-prod-chip {
  display: inline-block;
  background: #e0f2fe;
  border: 1px solid #0284c7;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0369a1;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hint-highlight {
  background: #facc15;
  color: #b45309;
  border-radius: 0.25rem;
  padding: 0 2px;
}
.ll1-cell-hint {
  background: #fef08a !important;
  box-shadow: 0 0 0 2px #facc15;
}

.ll1-cell, .ll1-prod-chip {
  user-select: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
