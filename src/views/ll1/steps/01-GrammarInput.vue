<template>
  <div class="grammar-input-step-wrapper">
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
        <div class="grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-8">

          <!-- 左上角：文法规则输入 -->
          <div class="row-start-1 col-start-1">
            <div class="input-section bg-white rounded-lg p-6 border">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">文法规则输入</h3>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  产生式规则
                </label>
                <div class="space-y-3">
                  <div
                    v-for="(rule, index) in grammarRules"
                    :key="index"
                    class="flex items-center gap-2"
                  >
                    <input
                      v-model="rule.left"
                      type="text"
                      placeholder="A"
                      maxlength="1"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm font-mono"
                      :class="{
                        'border-red-300 focus:ring-red-500 focus:border-red-500': rule.left && !/^[A-Z]$/.test(rule.left.trim())
                      }"
                    />
                    <span class="text-gray-500 font-medium">-></span>
                    <input
                      v-model="rule.right"
                      type="text"
                      placeholder="aB|ε"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm font-mono"
                    />
                    <button
                      @click="removeRule(index)"
                      class="px-2 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      :disabled="grammarRules.length <= 1"
                    >
                      <Icon icon="lucide:trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  @click="addRule"
                  class="mt-3 px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                >
                  <Icon icon="lucide:plus" class="w-4 h-4 inline mr-2" />
                  添加规则
                </button>
              </div>

              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  快速示例
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="example in examples"
                    :key="example.name"
                    @click="loadExample(example.rules)"
                    class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                  >
                    {{ example.name }}
                  </button>
                </div>
              </div>

              <div class="flex gap-3">
                <button
                  @click="validateGrammar"
                  :disabled="!isGrammarValid"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon icon="lucide:check-circle" class="w-4 h-4 inline mr-2" />
                  验证文法
                </button>
                <button
                  @click="clearGrammar"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon icon="lucide:x" class="w-4 h-4 inline mr-2" />
                  清空
                </button>
              </div>

              <div v-if="validationResult" class="mt-4">
                <div
                  :class="[
                    'p-3 rounded-lg',
                    validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  ]"
                >
                  <div class="flex items-start gap-2">
                    <Icon
                      :icon="validationResult.valid ? 'lucide:check-circle' : 'lucide:alert-circle'"
                      :class="[
                        'w-5 h-5 flex-shrink-0 mt-0.5',
                        validationResult.valid ? 'text-green-600' : 'text-red-600'
                      ]"
                    />
                    <div class="flex-1">
                      <p
                        :class="[
                          'font-medium',
                          validationResult.valid ? 'text-green-800' : 'text-red-800'
                        ]"
                      >
                        {{ validationResult.valid ? '文法有效' : '文法无效' }}
                      </p>
                      <p
                        :class="[
                          'text-sm mt-1',
                          validationResult.valid ? 'text-green-600' : 'text-red-600'
                        ]"
                      >
                        {{ validationResult.message }}
                      </p>
                      <div v-if="!validationResult.valid" class="mt-2 text-xs text-red-600">
                        <p><strong>提示：</strong></p>
                        <ul class="list-disc list-inside space-y-1 mt-1">
                          <li>确保非终结符为单个大写字母</li>
                          <li>检查是否包含中文或特殊字符</li>
                          <li>确保没有重复的产生式</li>
                          <li>检查是否存在左递归</li>
                          <li>确保所有非终结符都有候选式</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右上角：文法格式说明 -->
          <div class="row-start-1 col-start-2">
            <div class="info-section bg-green-50 rounded-lg p-6 border">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">文法格式说明</h3>
              <div class="space-y-2 text-sm">
                <div>1. 每个产生式格式为：<code class="px-1 bg-white rounded text-green-600 font-mono">非终结符->产生式右部</code></div>
                <div>2. 非终结符必须为单个大写字母（如A、B、E、S等）</div>
                <div>3. 终结符为单个小写字母或特殊符号（如a、b、+、*、(、)等）</div>
                <div>4. 右部不同选项用<code class="px-1 bg-white rounded text-green-600 font-mono">|</code>分隔</div>
                <div>5. 空串用<code class="px-1 bg-white rounded text-green-600 font-mono">ε</code>表示，且只能单独作为一个候选式</div>
                <div>6. 不允许包含中文、空格或特殊字符</div>
                <div>7. 不允许重复的产生式</div>
                <div>8. 所有非终结符必须有候选式</div>
                <div>9. 不允许存在左递归（直接或间接）</div>
                <div>10. 第一个产生式的左部为开始符号</div>
                <div class="mt-2">示例：</div>
                <pre class="bg-white border border-green-200 rounded p-2 text-green-700 font-mono text-sm leading-6">
S->aA|bB
A->a|ε
B->b|ε
G->+TG|ε
                </pre>
                <div class="mt-2 text-xs text-gray-500">
                  <strong>注意：</strong>输入前请确保文法已消除左递归，符合LL1文法要求
                </div>
                <div class="mt-2 text-xs text-gray-500">
                  <strong>ε符号说明：</strong>ε只能单独作为一个候选式，如<code class="px-1 bg-gray-100 rounded">G->+TG|ε</code>是正确的，但<code class="px-1 bg-gray-100 rounded">G->+TGε</code>是错误的
                </div>
              </div>
            </div>
          </div>

          <!-- 左下角：当前文法 -->
          <div class="row-start-2 col-start-1">
            <div v-if="grammarText" class="bg-white border rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">当前文法</h3>
              <div class="font-mono text-sm bg-gray-100 p-3 rounded border space-y-1">
                <div v-for="(rule, index) in grammarRules" :key="index" class="text-gray-800">
                  {{ rule.left }}->{{ rule.right }}
                </div>
              </div>
              <div v-if="grammarInfo" class="mt-4 text-sm text-gray-600">
                <p><strong>文法信息：</strong></p>
                <ul class="list-disc list-inside space-y-1 mt-2">
                  <li>非终结符：{{ grammarInfo.nonTerminals.join(', ') }}</li>
                  <li>终结符：{{ grammarInfo.terminals.join(', ') }}</li>
                  <li>产生式数量：{{ grammarInfo.ruleCount }}</li>
                  <li>开始符号：{{ grammarInfo.nonTerminals[0] || '未指定' }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 右下角：已验证文法快照 -->
          <div class="row-start-2 col-start-2">
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
                  <li>终结符：{{ verifiedSnapshot.info.terminals.join(', ') }}</li>
                  <li>产生式数量：{{ verifiedSnapshot.info.ruleCount }}</li>
                  <li>开始符号：{{ verifiedSnapshot.info.nonTerminals[0] || '未指定' }}</li>
                </ul>
              </div>
              <div v-if="verifiedSnapshot.ll1Result" class="mt-2 text-xs text-green-700">
                <strong>后端分析 isLL1：</strong> {{ verifiedSnapshot.ll1Result.isLL1 ? '是' : '否' }}
              </div>
              <div class="mt-2 text-xs text-gray-500">验证时间：{{ verifiedSnapshot.timestamp }}</div>
              <!-- <button
                class="mt-4 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs"
                @click="openJsonDialog"
              >
                查看后端返回JSON
              </button> -->
            </div>
            <div v-else class="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-center h-full text-gray-400 text-sm" style="min-height: 180px;">
              暂无已验证文法，请先输入并点击"验证文法"按钮
            </div>
          </div>
        </div>

      </div>

      <div class="step-actions">
        <div class="flex justify-between items-center">
          <button
            @click="$emit('prev-step')"
            disabled
            class="px-6 py-2 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed"
          >
            <Icon icon="lucide:chevron-left" class="w-4 h-4 inline mr-2" />
            上一步
          </button>

          <div class="text-sm text-gray-500">
            步骤 1 / 4
          </div>

          <button
            @click="proceedToNext"
            :disabled="!isValidAndReady"
            :class="[
              'px-6 py-2 rounded-lg transition-colors',
              isValidAndReady
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

    <!-- 消息提示弹窗 -->
    <transition name="fade">
      <div
        v-if="message"
        class="fixed bottom-8 right-8 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
        :class="messageType === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'"
      >
        <Icon :icon="messageType === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'" class="w-5 h-5" />
        <span>{{ message }}</span>
      </div>
    </transition>
    <!--
      JSON弹窗
      <transition name="fade">
        <div v-if="showJsonDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div class="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full relative">
            <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600" @click="closeJsonDialog">
              <Icon icon="lucide:x" class="w-5 h-5" />
            </button>
            <h3 class="text-lg font-semibold mb-4 text-green-700">后端返回 JSON 数据</h3>
            <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-96">{{ jsonDialogContent }}</pre>
          </div>
        </div>
      </transition> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import axios from 'axios'

// ===================== 变量与类型定义 =====================
// 产生式规则类型
interface GrammarRule {
  left: string
  right: string
}
// 文法信息类型
interface GrammarInfo {
  nonTerminals: string[]
  terminals: string[]
  ruleCount: number
}
// 文法快照类型
interface GrammarData {
  rules: GrammarRule[]
  info: GrammarInfo | null
  timestamp: string
}

// 事件定义
const emit = defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: GrammarData]
}>()

// ===================== 响应式数据 =====================
// 默认填充if语句示例
const grammarRules = ref<GrammarRule[]>([
  { left: 'S', right: 'iE' },
  { left: 'E', right: 'a|b' }
])

// 校验结果（用于报错和按钮禁用）
const validationResult = ref<{
  valid: boolean
  message: string
} | null>(null)

// 消息提示相关 -- 修复点击验证文法后使用系统弹窗
const message = ref<string | null>(null)
const messageType = ref<'success' | 'error'>('success')
let messageTimer: number | null = null

// 显示消息提示
function showMessage(msg: string, type: 'success' | 'error' = 'success') {
  message.value = msg
  messageType.value = type
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => {
    message.value = null
  }, 2000)
}

// 快速示例
const examples = [
  {
    name: '表达式文法',
    rules: [
      { left: 'E', right: 'TG' },
      { left: 'G', right: '+TG|ε' },
      { left: 'T', right: 'FS' },
      { left: 'S', right: '*FS|ε' },
      { left: 'F', right: '(E)|i' }
    ]
  },
  {
    name: '简单算术',
    rules: [
      { left: 'S', right: 'aA|bB' },
      { left: 'A', right: 'a|ε' },
      { left: 'B', right: 'b|ε' }
    ]
  },
  {
    name: 'if语句',
    rules: [
      { left: 'S', right: 'iE' },
      { left: 'E', right: 'a|b' }
    ]
  },
  {
    name: '括号匹配',
    rules: [
      { left: 'S', right: '(S)|ε' }
    ]
  }
]

// ===================== 计算属性 =====================
// 是否有有效输入
const grammarText = computed(() => {
  return grammarRules.value.some(rule => rule.left.trim() && rule.right.trim())
})
// 文法信息统计
const grammarInfo = computed(() => {
  if (!grammarText.value) return null
  const nonTerminals = new Set<string>()
  const terminals = new Set<string>()
  grammarRules.value.forEach(rule => {
    if (rule.left.trim()) {
      nonTerminals.add(rule.left.trim())
    }
    const rightParts = rule.right.split('|').map(part => part.trim())
    rightParts.forEach(part => {
      const symbols = part.split(/\s+/)
      symbols.forEach(symbol => {
        if (symbol && !symbol.startsWith('(') && !symbol.endsWith(')')) {
          if (symbol === 'ε' || symbol === 'id' || symbol === 'true' || symbol === 'false') {
            terminals.add(symbol)
          } else if (symbol.length === 1 && /[a-z]/.test(symbol)) {
            terminals.add(symbol)
          }
        }
      })
    })
  })
  return {
    nonTerminals: Array.from(nonTerminals),
    terminals: Array.from(terminals),
    ruleCount: grammarRules.value.length
  }
})
// 所有规则都填写了内容
const isGrammarValid = computed(() => {
  return grammarRules.value.every(rule =>
    rule.left.trim() && rule.right.trim()
  )
})
// 校验通过且可进入下一步
const isValidAndReady = computed(() => {
  return isGrammarValid.value && validationResult.value?.valid
})

// ===================== 交互方法 =====================
// 添加一条规则
const addRule = () => {
  grammarRules.value.push({ left: '', right: '' })
}
// 删除一条规则
const removeRule = (index: number) => {
  if (grammarRules.value.length > 1) {
    grammarRules.value.splice(index, 1)
  }
}
// 加载快速示例
const loadExample = (rules: GrammarRule[]) => {
  grammarRules.value = [...rules]
  validationResult.value = null
}

// ===================== 快照相关 =====================
// 已验证文法快照（只读localStorage）
const verifiedSnapshot = ref<{ rules: GrammarRule[]; info: GrammarInfo | null; timestamp: string; ll1Result?: any } | null>(null)
// 加载快照
function loadSnapshot() {
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
}

// ===================== 校验逻辑 =====================
// 实时校验函数（只做报错提示，不保存快照、不弹窗）
function realtimeCheckGrammar() {
  // 0. 空格和中文检查
  for (const rule of grammarRules.value) {
    if (/\s/.test(rule.left) || /\s/.test(rule.right)) {
      validationResult.value = { valid: false, message: '请不要在产生式中输入空格。' }
      return
    }
    if (/[\u4e00-\u9fa5]/.test(rule.left) || /[\u4e00-\u9fa5]/.test(rule.right)) {
      validationResult.value = { valid: false, message: '输入不能包含中文字符。' }
      return
    }
  }
  // 1. 输入为空检查
  if (grammarRules.value.length === 0 || grammarRules.value.every(rule => !rule.left.trim() && !rule.right.trim())) {
    validationResult.value = { valid: false, message: '请输入产生式！' }
    return
  }
  // 2. 检查是否有完整的产生式
  const validRules = grammarRules.value.filter(rule => rule.left.trim() && rule.right.trim())
  if (validRules.length === 0) {
    validationResult.value = { valid: false, message: '请输入完整的产生式！' }
    return
  }
  // 3. 左部必须为单个大写字母
  for (const rule of validRules) {
    if (!/^[A-Z]$/.test(rule.left.trim())) {
      validationResult.value = { valid: false, message: '左部必须为单个大写字母。' }
      return
    }
  }
  // 4. 右部不能为空
  for (const rule of validRules) {
    if (!rule.right.trim()) {
      validationResult.value = { valid: false, message: '右部不能为空。' }
      return
    }
  }
  // 5. 重复产生式检查
  const productionStrings = validRules.map(rule => `${rule.left.trim()}->${rule.right.trim()}`)
  const productionSet = new Set(productionStrings)
  if (productionStrings.length !== productionSet.size) {
    validationResult.value = { valid: false, message: '产生式含重复项，请重新输入！' }
    return
  }
  // 6. ε符号检查
  for (const rule of validRules) {
    const rightParts = rule.right.split('|').map(part => part.trim())
    for (const part of rightParts) {
      if (part.includes('ε') && part !== 'ε') {
        validationResult.value = { valid: false, message: 'ε符号只能单独使用，不能与其他符号组合！' }
        return
      }
    }
  }
  // 7. 非终结符候选式检查
  const checkFormulas: { [key: string]: string[] } = {}
  for (const rule of validRules) {
    const left = rule.left.trim()
    const right = rule.right.trim()
    if (!checkFormulas[left]) checkFormulas[left] = []
    if (right.includes('|')) {
      const rightParts = right.split('|').map(part => part.trim()).filter(part => part.length > 0)
      for (const part of rightParts) {
        if (!checkFormulas[left].includes(part)) checkFormulas[left].push(part)
      }
    } else {
      if (!checkFormulas[left].includes(right)) checkFormulas[left].push(right)
    }
  }
  const allNonTerminals = new Set<string>()
  validRules.forEach(rule => {
    allNonTerminals.add(rule.left.trim())
    const rightSymbols = rule.right.match(/[A-Z]/g) || []
    rightSymbols.forEach(symbol => allNonTerminals.add(symbol))
  })
  for (const vn of allNonTerminals) {
    if (!checkFormulas[vn] || checkFormulas[vn].length === 0) {
      validationResult.value = { valid: false, message: `非终结符 ${vn} 没有候选式！` }
      return
    }
  }
  // 8. 左递归检查
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  function hasLeftRecursion(vn: string): boolean {
    if (recursionStack.has(vn)) return true
    if (visited.has(vn)) return false
    visited.add(vn)
    recursionStack.add(vn)
    if (checkFormulas[vn]) {
      for (const production of checkFormulas[vn]) {
        if (production.length > 0) {
          const firstSymbol = production[0]
          if (/[A-Z]/.test(firstSymbol) && checkFormulas[firstSymbol]) {
            if (hasLeftRecursion(firstSymbol)) {
              recursionStack.delete(vn)
              return true
            }
          }
        }
      }
    }
    recursionStack.delete(vn)
    return false
  }
  for (const vn of allNonTerminals) {
    if (!visited.has(vn)) {
      if (hasLeftRecursion(vn)) {
        validationResult.value = { valid: false, message: '存在直接或间接左递归，请输入消除左递归后的文法！' }
        return
      }
    }
  }
  // 9. 检查开始符号
  const startSymbol = validRules[0]?.left.trim()
  if (!startSymbol) {
    validationResult.value = { valid: false, message: '请指定开始符号！' }
    return
  }
  // 通过 修正提示信息
  validationResult.value = { valid: true, message: '文法格式正确，可以进行LL1文法验证' }
}

// 实时校验
watch(grammarRules, (newRules) => {
  newRules.forEach(rule => {
    if (rule.left.includes(' ')) rule.left = rule.left.replace(/\s+/g, '')
    if (rule.right.includes(' ')) rule.right = rule.right.replace(/\s+/g, '')
  })
  realtimeCheckGrammar()
}, { deep: true })

// validateGrammar 只在点击按钮时调用，才保存快照和弹窗
const validateGrammar = async () => {
  if (validationResult.value && validationResult.value.valid) {
    // 组装产生式数组
    const inpProductions = grammarRules.value
      .map(rule => `${rule.left}->${rule.right}`)

    try {
      // 请求后端
      const res = await axios.post('http://127.0.0.1:5000/api/LL1Analyse', {
        inpProductions
      })
      if (res.data && res.data.code === 0) {
        // 保存快照，包含后端返回
        const snapshot = {
          rules: JSON.parse(JSON.stringify(grammarRules.value)),
          info: grammarInfo.value,
          timestamp: new Date().toLocaleString(),
          ll1Result: res.data.data
        }
        localStorage.setItem('ll1-grammar-snapshot', JSON.stringify(snapshot))
        loadSnapshot()
        showMessage('验证成功，文法已保存并分析！', 'success')
      } else {
        showMessage('后端分析失败: ' + (res.data?.msg || '未知错误'), 'error')
      }
    } catch (e) {
      showMessage('请求后端失败，请检查服务是否启动', 'error')
    }
  }
}

const clearGrammar = () => {
  grammarRules.value = [{ left: '', right: '' }]
  validationResult.value = null
}

const proceedToNext = () => {
  if (isValidAndReady.value) {
    emit('next-step')
  }
}

onMounted(() => {
  loadSnapshot()
  realtimeCheckGrammar()
})

// // ===================== 查看后端返回JSON弹窗相关 =====================
// const showJsonDialog = ref(false)
// const jsonDialogContent = ref('')
// function openJsonDialog() {
//   if (verifiedSnapshot.value && verifiedSnapshot.value.ll1Result) {
//     jsonDialogContent.value = JSON.stringify(verifiedSnapshot.value.ll1Result, null, 2)
//     showJsonDialog.value = true
//   } else {
//     showMessage('暂无后端分析数据', 'error')
//   }
// }
// function closeJsonDialog() {
//   showJsonDialog.value = false
// }
</script >

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #dcfce7; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }

/* 验证文法的消息提示动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
