<template>
  <div class="first-follow-sets-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:layers" class="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">First集和Follow集</h2>
          <p class="text-gray-600 mt-1">第二步：计算文法符号的First集和Follow集</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左：产生式列表 -->
        <div class="sub-card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">产生式列表</h3>
          <div class="grid grid-cols-2 gap-3">
            <template v-for="(rightList, left) in verifiedSnapshot?.ll1Result?.formulas_dict || {}" :key="left">
              <div v-for="right in rightList" :key="left + '->' + right" class="prod-list-item">
                {{ left }} → {{ right }}
              </div>
            </template>
          </div>
        </div>
        <!-- 右：文法快照 -->
        <div>
          <div v-if="verifiedSnapshot" class="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-green-700 mb-4">已验证文法快照</h3>
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
          <div v-else class="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-center h-full text-gray-400 text-sm" style="min-height: 180px;">
            暂无已验证文法，请先输入并点击"验证文法"按钮
          </div>
        </div>
      </div>

      <!-- 下方大框：三列布局 -->
      <div class="mt-8 w-full bg-gray-50 rounded-xl border flex flex-row shadow-sm gap-6 p-6">
        <!-- 符号拖拽区 -->
        <div class="w-1/4 p-0 flex flex-col items-start">
          <div class="sub-card">
            <h4 class="font-bold text-gray-700 mb-3">符号拖拽区</h4>
            <div class="flex flex-col gap-4 w-full items-start">
              <div>
                <div class="text-sm font-medium text-gray-700 mb-2">非终结符</div>
                <div class="flex flex-wrap gap-2 justify-start">
                  <span v-for="vn in verifiedSnapshot?.info?.nonTerminals || []" :key="'vn-'+vn"
                    class="symbol-card" draggable="true"
                    @dragstart="onDragStart(vn, $event)">{{ vn }}</span>
                </div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-700 mb-2">终结符</div>
                <div class="flex flex-wrap gap-2 justify-start">
                  <span v-for="vt in (verifiedSnapshot?.info?.terminals?.filter(t => t !== 'ε') || [])" :key="'vt-'+vt"
                    class="symbol-card" draggable="true"
                    @dragstart="onDragStart(vt, $event)">{{ vt }}</span>
                </div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-700 mb-2">空串</div>
                <div class="flex flex-wrap gap-2 justify-start">
                  <span class="symbol-card" draggable="true" @dragstart="onDragStart('ε', $event)">ε</span>
                </div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-700 mb-2">输入结束符</div>
                <div class="flex flex-wrap gap-2 justify-start">
                  <span class="symbol-card" draggable="true" @dragstart="onDragStart('#', $event)">#</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- First集答题区 -->
        <div class="w-2/5 p-0 flex flex-col">
          <div class="sub-card">
            <h4 class="text-lg font-semibold text-green-700 mb-4">填写 First 集合</h4>
            <div class="flex flex-col gap-4 flex-1">
              <div v-for="symbol in allSymbols" :key="'first-'+symbol" class="first-follow-row">
                <span class="first-follow-label">first(<span class="first-symbol-span">{{ symbol }}</span>)</span>
                <span class="first-follow-eq">=</span>
                <input
                  class="first-input"
                  :class="{
                    'input-correct': checkResult[symbol] === true,
                    'input-wrong': checkResult[symbol] === false
                  }"
                  :placeholder="firstCheckCount >= 3 && checkResult[symbol] === false ? ((verifiedSnapshot?.ll1Result?.first as Record<string, string[]>)?.[symbol] || []).join('') : '拖拽或输入'"
                  v-model="firstAnswers[symbol]"
                  @dragover.prevent
                  @drop="onDrop(symbol, 'first', $event)"
                  @input="onInputChange(symbol, 'first')"
                />
              </div>
            </div>
            <div class="flex justify-end mt-4 flex-col items-end">
              <div class="flex gap-2">
                <button class="px-4 py-1 rounded bg-green-600 text-white hover:bg-green-700 w-24" @click="checkFirstAnswers">
                  校验
                </button>
                <button class="px-4 py-1 rounded border border-green-300 text-green-700 bg-white hover:bg-green-50 w-24" @click="resetFirst">
                  重置
                </button>
              </div>
              <div class="text-xs text-gray-500 mt-1" v-if="firstCheckCount < 3">
                还可校验{{ 3 - firstCheckCount }}次，3次后显示标准答案
              </div>
              <div class="text-xs text-green-600 mt-1" v-else>
                已达最大校验次数，未通过将显示标准答案
              </div>
            </div>
          </div>
        </div>
        <!-- Follow集答题区 -->
        <div class="w-2/5 p-0 flex flex-col">
          <div class="sub-card">
            <h4 class="text-lg font-semibold text-green-700 mb-4">填写 Follow 集合</h4>
            <div class="flex flex-col gap-4 flex-1">
              <div v-for="symbol in (verifiedSnapshot?.info?.nonTerminals || [])" :key="'follow-'+symbol" class="first-follow-row">
                <span class="first-follow-label">follow(<span class="first-symbol-span">{{ symbol }}</span>)</span>
                <span class="first-follow-eq">=</span>
                <input
                  class="follow-input"
                  :class="{
                    'input-correct': checkResultFollow[symbol] === true,
                    'input-wrong': checkResultFollow[symbol] === false
                  }"
                  :placeholder="followCheckCount >= 3 && checkResultFollow[symbol] === false ? ((verifiedSnapshot?.ll1Result?.follow as Record<string, string[]>)?.[symbol] || []).join('') : '拖拽或输入'"
                  v-model="followAnswers[symbol]"
                  @dragover.prevent
                  @drop="onDrop(symbol, 'follow', $event)"
                  @input="onInputChange(symbol, 'follow')"
                />
              </div>
            </div>
            <div class="flex justify-end mt-4 flex-col items-end">
              <div class="flex gap-2">
                <button class="px-4 py-1 rounded bg-green-600 text-white hover:bg-green-700 w-24" @click="checkFollowAnswers">
                  校验
                </button>
                <button class="px-4 py-1 rounded border border-green-300 text-green-700 bg-white hover:bg-green-50 w-24" @click="resetFollow">
                  重置
                </button>
              </div>
              <div class="text-xs text-gray-500 mt-1" v-if="followCheckCount < 3">
                还可校验{{ 3 - followCheckCount }}次，3次后显示标准答案
              </div>
              <div class="text-xs text-green-600 mt-1" v-else>
                已达最大校验次数，未通过将显示标准答案
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
        <div class="text-sm text-gray-500">步骤 2 / 4</div>
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
import { ref, onMounted, computed } from 'vue'

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
  [key: string]: unknown
}
interface GrammarSnapshot {
  rules: GrammarRule[]
  info: GrammarInfo | null
  timestamp: string
  ll1Result?: LL1Result
}

defineEmits<{ 'next-step': []; 'prev-step': []; 'complete': [data: GrammarSnapshot] }>()

// 读取localStorage中的ll1-grammar-snapshot
const verifiedSnapshot = ref<GrammarSnapshot | null>(null)

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

// 拖拽相关
function onDragStart(symbol: string, event: DragEvent) {
  event.dataTransfer?.setData('text/plain', symbol)
}
function onDrop(symbol: string, type: 'first' | 'follow', event: DragEvent) {
  event.preventDefault();
  const dropped = event.dataTransfer?.getData('text/plain');
  if (!dropped) return;
  const target = type === 'first' ? firstAnswers.value : followAnswers.value;
  // 获取终结符集合
  const terminals = (verifiedSnapshot.value?.info?.terminals || []).filter(t => t !== 'ε');
  const arr = (target[symbol] || '').split('').filter(Boolean);
  // 过滤非法符号
  if (type === 'first') {
    if (!(terminals.includes(dropped) || dropped === 'ε')) return;
  } else {
    if (!(terminals.includes(dropped) || dropped === '#')) return;
  }
  if (!arr.includes(dropped)) arr.push(dropped);
  target[symbol] = Array.from(new Set(arr)).join('');
}

function onInputChange(symbol: string, type: 'first' | 'follow') {
  const target = type === 'first' ? firstAnswers.value : followAnswers.value;
  const terminals = (verifiedSnapshot.value?.info?.terminals || []).filter(t => t !== 'ε');
  const raw = target[symbol] || '';
  // 过滤非法符号
  let filtered: string[] = [];
  if (type === 'first') {
    filtered = raw.split('').filter(s => terminals.includes(s) || s === 'ε');
  } else {
    filtered = raw.split('').filter(s => terminals.includes(s) || s === '#');
  }
  target[symbol] = Array.from(new Set(filtered)).join('');
}

// 生成所有符号（非终结符、终结符、ε）
const allSymbols = computed(() => {
  const info = verifiedSnapshot.value?.info
  if (!info) return []
  const vns = info.nonTerminals
  const vts = info.terminals.filter(t => t !== 'ε')
  return [...vns, ...vts, 'ε']
})

// 答案输入
const firstAnswers = ref<Record<string, string>>({})
const followAnswers = ref<Record<string, string>>({})

const checkResult = ref<{ [key: string]: boolean | null }>({});
const checkResultFollow = ref<{ [key: string]: boolean | null }>({});

const firstCheckCount = ref(0);
const followCheckCount = ref(0);

function isSetEqual(a: string[], b: string[]) {
  const sa = Array.from(new Set(a)).sort().join('');
  const sb = Array.from(new Set(b)).sort().join('');
  return sa === sb && sa.length > 0;
}

function checkFirstAnswers() {
  firstCheckCount.value++;
  const stdFirst = (verifiedSnapshot.value?.ll1Result?.first || {}) as Record<string, string[]>;
  for (const symbol of allSymbols.value) {
    const user = (firstAnswers.value[symbol] || '').split('').filter(Boolean);
    const std = (stdFirst[symbol] || []);
    checkResult.value[symbol] = isSetEqual(user, std);
  }
}

function checkFollowAnswers() {
  followCheckCount.value++;
  const stdFollow = (verifiedSnapshot.value?.ll1Result?.follow || {}) as Record<string, string[]>;
  for (const symbol of verifiedSnapshot.value?.info?.nonTerminals || []) {
    const user = (followAnswers.value[symbol] || '').split('').filter(Boolean);
    const std = (stdFollow[symbol] || []);
    checkResultFollow.value[symbol] = isSetEqual(user, std);
  }
}

function resetFirst() {
  firstCheckCount.value = 0;
  for (const k in firstAnswers.value) firstAnswers.value[k] = '';
  for (const k in checkResult.value) checkResult.value[k] = null;
}

function resetFollow() {
  followCheckCount.value = 0;
  for (const k in followAnswers.value) followAnswers.value[k] = '';
  for (const k in checkResultFollow.value) checkResultFollow.value[k] = null;
}
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #dcfce7; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }
.symbol-card {
  display: inline-block;
  background: #ffffff93;
  border-radius: 0.5rem;
  box-shadow: 0 1px 4px 0 rgba(16,30,54,0.08);
  border: 1px solid #e5e7eb;
  padding: 0.25rem 0.75rem;
  font-size: 1.125rem;
  font-weight: 500;
  color: hwb(148 14% 36%);
  cursor: move;
  user-select: none;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.symbol-card:hover {
  box-shadow: 0 2px 8px 0 rgba(16,30,54,0.16);
  border-color: #60a5fa;
}
.first-follow-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1px;
  min-height: 40px;
}
.first-follow-label {
  font-family: monospace;
  font-size: 1.25rem;
  color: #222;
  min-width: 110px;
  text-align: left;
  font-weight: bold;
}
.first-follow-eq {
  margin: 0 8px;
  font-size: 1.2rem;
  color: #444;
  font-weight: bold;
}
.first-symbol-span {
  color: #f10ecb;
  font-weight: bold;
  font-size: 1.25rem;
}
.first-input, .follow-input {
  min-width: 90px;
  max-width: 180px;
  width: 100%;
  display: inline-block;
  padding: 10px 16px;
  font-size: 1rem;
  line-height: 1.5;
  background: #ffffff;
  color: #374151;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease-in-out;
  font-weight: 500;
}
.first-input:focus, .follow-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  outline: none;
  background: #f9fafb;
}
.first-input:hover, .follow-input:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
.first-input::placeholder, .follow-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}
.input-correct {
  border-color: #10b981 !important;
  background: #ecfdf5 !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}
.input-wrong {
  border-color: #ef4444 !important;
  background: #fef2f2 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}
.prod-list-item {
  background: #ffffff93;
  border-radius: 0.5rem;
  box-shadow: 0 1px 4px 0 rgba(16,30,54,0.08);
  border: 1px solid #e5e7eb;
  padding: 0.25rem 0.75rem;
  font-size: 1.125rem;
  font-weight: 500;
  color: hwb(148 14% 36%);
  text-align: center;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.gap-6 {
  gap: 1.5rem;
}
.sub-card {
  background: #f8fafc;
  border-radius: 1rem;
  box-shadow: 0 4px 12px 0 rgba(16,30,54,0.12);
  border: 1px solid #d1d5db;
  padding: 1.5rem 1.2rem 1.2rem 1.2rem;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
