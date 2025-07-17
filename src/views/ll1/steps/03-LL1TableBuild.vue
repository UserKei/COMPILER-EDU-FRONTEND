<template>
  <div class="ll1-table-build-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:table" class="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">构建LL1分析表</h2>
          <p class="text-gray-600 mt-1">第三步：根据First集和Follow集构建LL1分析表</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：First/Follow 集 -->
        <div class="bg-white border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-blue-700 mb-4">First / Follow 集</h3>
          <div v-if="firstMap && followMap && allSymbols.length">
            <table class="min-w-full text-sm border">
              <thead>
                <tr>
                  <th class="border px-2 py-1">符号</th>
                  <th class="border px-2 py-1">First 集</th>
                  <th class="border px-2 py-1">Follow 集</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="symbol in allSymbols" :key="symbol">
                  <td :class="[
                    isNonTerminal(symbol) ? 'symbol-nt' : symbol === 'ε' ? 'symbol-eps' : 'symbol-t',
                  ]">{{ symbol }}</td>
                  <td>{{ (firstMap[symbol] || []).join(', ') }}</td>
                  <td>
                    <span v-if="isNonTerminal(symbol)">{{ (followMap[symbol] || []).join(', ') }}</span>
                    <span v-else class="text-gray-400">-----</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-gray-400 text-sm py-8 text-center">暂无 First/Follow 数据</div>
        </div>
        <!-- 右侧：文法快照 -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
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
                <div class="mt-1 text-xs text-gray-500">ε（空串）不是终结符，也不是非终结符，仅用于表示空串。</div>
              </ul>
            </div>
            <div v-if="verifiedSnapshot.ll1Result" class="mt-2 text-xs text-green-700">
              <strong>后端分析 isLL1：</strong> {{ verifiedSnapshot.ll1Result.isLL1 ? '是' : '否' }}
            </div>
            <div class="mt-2 text-xs text-gray-500">验证时间：{{ verifiedSnapshot.timestamp }}</div>
          </div>
          <div v-else class="text-gray-400 text-sm py-8 text-center">暂无文法快照</div>
        </div>
      </div>
      <!-- 产生式拖拽区 + LL1分析表答题区 -->
      <div class="mt-8 w-full bg-gray-50 rounded-xl border flex flex-row shadow-sm" style="min-height: 260px;">
        <!-- 产生式拖拽区 -->
        <div class="w-1/4 p-4 border-r flex flex-col items-center">
          <h4 class="font-bold text-gray-700 mb-1">产生式列表</h4>
          <div class="text-xs text-gray-500 mb-2">可拖拽卡片到右侧表格</div>
          <div class="flex flex-col gap-2 w-full items-center">
            <template v-for="(rightList, left) in formulasDict" :key="left">
              <div v-for="right in rightList" :key="left + '->' + right" class="prod-card" draggable="true"
                @dragstart="onProdDragStart(left, right, $event)">
                {{ left }} -> {{ right }}
              </div>
            </template>
          </div>
        </div>
        <!-- LL1分析表答题区 -->
        <div class="w-3/4 p-4 flex flex-col items-center justify-start">
          <h4 class="font-bold text-gray-700 mb-1">LL1分析表</h4>
          <div class="text-xs text-gray-500 mb-2">拖拽卡片到表格，双击单元格可删除卡片</div>
          <div class="flex gap-4 mb-2 text-xs items-center">
            <span class="inline-block w-6 h-4 rounded bg-[#6ee7b7] border border-[#bae6fd] align-middle"></span> 填写中
            <span class="inline-block w-6 h-4 rounded bg-[#22d3ee] border border-[#bae6fd] align-middle"></span> 正确
            <span class="inline-block w-6 h-4 rounded bg-[#fee2e2] border border-[#bae6fd] align-middle"></span> 错误
          </div>
          <div class="overflow-x-auto w-full">
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
                    class="border px-2 py-1 ll1-cell"
                    :class="cellClass(row, col, userTable[row]?.[col])"
                    @dragover.prevent
                    @drop="onTableDrop(row, col, $event)"
                    @dblclick="clearCell(row, col)"
                  >
                    <template v-if="checkCount >= 3 && checkResult[row]?.[col] === false && stdTableAnswer(row, col)">
                      <span class="ll1-prod-chip">{{ stdTableAnswer(row, col) }}</span>
                    </template>
                    <template v-else-if="userTable[row]?.[col]">
                      <span class="ll1-prod-chip">{{ userTable[row][col] }}</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex gap-3 mt-4">
            <button class="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" @click="checkTable">校验table</button>
            <button class="px-5 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" @click="resetTable">重置</button>
          </div>
          <div class="text-xs text-gray-500 mt-2" v-if="checkCount < 3">
            还可校验{{ 3 - checkCount }}次，3次后显示标准答案
          </div>
          <div class="text-xs text-green-600 mt-2" v-else>
            已达最大校验次数，未通过将显示标准答案
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
        <div class="text-sm text-gray-500">步骤 3 / 4</div>
        <button @click="$emit('next-step')" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          下一步
          <Icon icon="lucide:chevron-right" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted } from 'vue'

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
  table: Record<string, Record<string, string>>
}
interface GrammarSnapshot {
  rules: GrammarRule[]
  info: GrammarInfo | null
  timestamp: string
  ll1Result?: LL1Result
}

defineEmits<{ 'next-step': [], 'prev-step': [], 'complete': [data: GrammarSnapshot] }>()

const verifiedSnapshot = ref<GrammarSnapshot | null>(null)
const firstMap = computed(() => verifiedSnapshot.value?.ll1Result?.first || {})
const followMap = computed(() => verifiedSnapshot.value?.ll1Result?.follow || {})
const allSymbols = computed(() => {
  const info = verifiedSnapshot.value?.info
  if (!info) return []
  const vns = info.nonTerminals
  const vts = info.terminals.filter(t => t !== 'ε')
  return [...vns, ...vts, 'ε']
})
const formulasDict = computed(() => verifiedSnapshot.value?.ll1Result?.formulas_dict || {})

function isNonTerminal(symbol: string) {
  return verifiedSnapshot.value?.info?.nonTerminals.includes(symbol)
}

function onProdDragStart(left: string, right: string, event: DragEvent) {
  event.dataTransfer?.setData('text/plain', `${left}->${right}`)
}

onMounted(() => {
  const snap = localStorage.getItem('ll1-grammar-snapshot')
  if (snap) {
    try {
      verifiedSnapshot.value = JSON.parse(snap)
    } catch {
      verifiedSnapshot.value = null
    }
  } else {
    verifiedSnapshot.value = null
  }
})

// LL1分析表相关
const Vn = computed(() => verifiedSnapshot.value?.ll1Result?.Vn || [])
const VtAll = computed(() => [...(verifiedSnapshot.value?.ll1Result?.Vt || []), '#'])
const userTable = ref<Record<string, Record<string, string>>>({})
const checkResult = ref<Record<string, Record<string, boolean>>>({})
const checkCount = ref(0)
const stdTable = computed(() => verifiedSnapshot.value?.ll1Result?.table || {})
function onTableDrop(row: string, col: string, event: DragEvent) {
  const prod = event.dataTransfer?.getData('text/plain')
  if (!prod) return
  if (!userTable.value[row]) userTable.value[row] = {}
  userTable.value[row][col] = prod
}
function clearCell(row: string, col: string) {
  if (userTable.value[row]) userTable.value[row][col] = ''
}
function checkTable() {
  checkCount.value++
  for (const row of Vn.value) {
    checkResult.value[row] = {}
    for (const col of VtAll.value) {
      const key = `${row}|${col}`
      const stdRight = stdTable.value[key]
      const stdAns = stdRight ? `${row}->${stdRight}` : ''
      checkResult.value[row][col] = (userTable.value[row]?.[col] || '') === stdAns
    }
  }
}
function stdTableAnswer(row: string, col: string) {
  const key = `${row}|${col}`
  const stdRight = stdTable.value[key]
  return stdRight ? `${row}->${stdRight}` : ''
}
function cellClass(row: string, col: string, val: string|undefined) {
  if (checkCount.value >= 3 && checkResult.value[row]?.[col] === false && stdTableAnswer(row, col)) return 'cell-correct'
  if (checkResult.value[row]?.[col] === true) return 'cell-correct'
  if (checkResult.value[row]?.[col] === false) return 'cell-wrong'
  if (val) return 'cell-filled'
  return 'cell-empty'
}
function resetTable() {
  userTable.value = {}
  checkResult.value = {}
  checkCount.value = 0
}
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #dcfce7; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }
table { border-collapse: collapse; }
th, td { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; line-height: 1.2; }
/* 符号列样式：非终结符（紫色）、ε（绿色）、终结符（深蓝色加粗） */
td.symbol-nt { color: #7c3aed; font-weight: bold; }
td.symbol-eps { color: #16a34a; font-weight: bold; }
td.symbol-t { color: #ec830a; font-weight: bold; }
.prod-card {
  background: #f10ecb;
  border-radius: 1.2rem;
  padding: 0.18rem 0.6rem;
  font-size: 0.98rem;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 1px 4px 0 rgba(16,30,54,0.08);
  border: 1px solid #f10ecb;
  margin-bottom: 0.18rem;
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s, border-color 0.2s;
  text-align: center;
  width: 110px;
  min-width: 110px;
  max-width: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.prod-card:active {
  box-shadow: 0 1px 2px 0 rgba(16,30,54,0.08);
  border-color: #f10ecb;
}
.ll1-table th, .ll1-table td { text-align: center; min-width: 70px; }
.ll1-cell { cursor: pointer; transition: background 0.2s; }
.ll1-cell:hover {
  box-shadow: 0 4px 16px 0 rgba(16,30,54,0.18);
  z-index: 2;
}
.ll1-table th.ll1-th {
  background: #bae6fd;
  color: #2563eb;
  font-weight: bold;
  font-size: 1.08rem;
}
.ll1-cell.cell-empty {
  background: #d1fae5;
  transition: box-shadow 0.2s, background 0.2s;
}
.ll1-cell.cell-filled {
  background: #6ee7b7;
  box-shadow: 0 2px 8px 0 rgba(16,30,54,0.10);
}
.ll1-cell.cell-correct {
  background: #22d3ee !important;
  color: #065f46;
  font-weight: bold;
  box-shadow: 0 2px 8px 0 rgba(16,30,54,0.13);
}
.ll1-cell.cell-wrong {
  background: #fee2e2 !important;
  color: #b91c1c;
  font-weight: bold;
  box-shadow: 0 2px 8px 0 rgba(239,68,68,0.13);
}
.ll1-prod-chip {
  background: #f10ecb;
  border-radius: 1.2rem;
  padding: 0.18rem 0.6rem;
  font-size: 0.98rem;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 1px 4px 0 rgba(16,30,54,0.08);
  border: 1px solid #f10ecb;
  user-select: none;
  text-align: center;
  width: 110px;
  min-width: 110px;
  max-width: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}
</style>
