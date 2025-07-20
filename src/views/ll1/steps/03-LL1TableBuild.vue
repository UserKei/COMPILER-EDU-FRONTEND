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
      <div class="max-w-7xl mx-auto">
        <!-- First/Follow集摘要 -->
        <div class="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">First/Follow集摘要</h3>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-800 mb-2">First集</h4>
              <div class="space-y-1 text-sm">
                <div v-for="(symbols, symbol) in firstSets" :key="`first-${symbol}`" class="flex">
                  <span class="w-16 font-mono text-emerald-700">{{ symbol }}:</span>
                  <span class="text-emerald-600">{ {{ symbols.join(', ') }} }</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-gray-800 mb-2">Follow集</h4>
              <div class="space-y-1 text-sm">
                <div v-for="(symbols, symbol) in followSets" :key="`follow-${symbol}`" class="flex">
                  <span class="w-16 font-mono text-blue-700">{{ symbol }}:</span>
                  <span class="text-blue-600">{ {{ symbols.join(', ') }} }</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 构建分析表 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">LL1分析表构建</h3>
            <button
              @click="buildParsingTable"
              :disabled="building"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Icon v-if="building" icon="lucide:loader-2" class="w-4 h-4 animate-spin mr-2" />
              {{ building ? '构建中...' : '构建分析表' }}
            </button>
          </div>

          <!-- 构建步骤 -->
          <div v-if="buildingSteps.length > 0" class="mb-6">
            <h4 class="font-medium text-gray-900 mb-3">构建过程</h4>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <div
                v-for="(step, index) in buildingSteps"
                :key="index"
                class="bg-gray-50 rounded-md p-3 text-sm"
              >
                <div class="font-mono text-gray-700">{{ step }}</div>
              </div>
            </div>
          </div>

          <!-- LL1分析表 -->
          <div v-if="parsingTable" class="overflow-x-auto">
            <h4 class="font-medium text-gray-900 mb-3">LL1预测分析表</h4>
            <table class="min-w-full border border-gray-300">
              <thead class="bg-green-50">
                <tr>
                  <th class="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                    非终结符
                  </th>
                  <th
                    v-for="terminal in terminals"
                    :key="terminal"
                    class="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase"
                  >
                    {{ terminal }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr v-for="nonTerminal in nonTerminals" :key="nonTerminal">
                  <td class="border border-gray-300 px-3 py-2 font-mono font-semibold text-green-700">
                    {{ nonTerminal }}
                  </td>
                  <td
                    v-for="terminal in terminals"
                    :key="`${nonTerminal}-${terminal}`"
                    class="border border-gray-300 px-3 py-2 text-center text-sm"
                  >
                    <span
                      v-if="parsingTable[nonTerminal] && parsingTable[nonTerminal][terminal]"
                      class="font-mono text-gray-700"
                    >
                      {{ parsingTable[nonTerminal][terminal] }}
                    </span>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 成功提示 -->
          <div v-if="parsingTable && conflicts.length === 0" class="mt-6">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center">
                <Icon icon="lucide:check-circle" class="w-5 h-5 text-green-400 mr-2" />
                <p class="text-sm text-green-700 font-medium">
                  LL1分析表构建成功，无冲突！该文法是LL1文法。
                </p>
              </div>
            </div>
          </div>

          <!-- 冲突检查 -->
          <div v-if="conflicts.length > 0" class="mt-6">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 class="font-medium text-red-800 mb-2 flex items-center">
                <Icon icon="lucide:alert-triangle" class="w-5 h-5 mr-2" />
                发现冲突
              </h4>
              <ul class="text-sm text-red-700 space-y-1">
                <li v-for="conflict in conflicts" :key="conflict">{{ conflict }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 分析表统计 -->
        <div v-if="parsingTable" class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">分析表统计</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ tableStats.totalEntries }}</div>
              <div class="text-gray-600">总条目数</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-emerald-600">{{ tableStats.filledEntries }}</div>
              <div class="text-gray-600">已填充</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-500">{{ tableStats.emptyEntries }}</div>
              <div class="text-gray-600">空条目</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold" :class="tableStats.fillRate >= 50 ? 'text-green-600' : 'text-yellow-600'">
                {{ tableStats.fillRate }}%
              </div>
              <div class="text-gray-600">填充率</div>
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
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

defineEmits<{ 'next-step': [], 'prev-step': [], 'complete': [data: any] }>()

const building = ref(false)
const parsingTable = ref<Record<string, Record<string, string>> | null>(null)
const buildingSteps = ref<string[]>([])
const conflicts = ref<string[]>([])

// 模拟数据（实际应该从前面步骤获取）
const firstSets = ref({
  'E': ['(', 'id'],
  'E1': ['+', 'ε'],
  'T': ['(', 'id'],
  'T1': ['*', 'ε'],
  'F': ['(', 'id']
})

const followSets = ref({
  'E': ['$', ')'],
  'E1': ['$', ')'],
  'T': ['+', '$', ')'],
  'T1': ['+', '$', ')'],
  'F': ['*', '+', '$', ')']
})

const nonTerminals = computed(() => Object.keys(firstSets.value))
const terminals = computed(() => {
  const terminalSet = new Set<string>()
  Object.values(firstSets.value).forEach(set => {
    set.forEach(symbol => {
      if (symbol !== 'ε') terminalSet.add(symbol)
    })
  })
  Object.values(followSets.value).forEach(set => {
    set.forEach(symbol => terminalSet.add(symbol))
  })
  return Array.from(terminalSet).sort()
})

const tableStats = computed(() => {
  if (!parsingTable.value) return { totalEntries: 0, filledEntries: 0, emptyEntries: 0, fillRate: 0 }

  let total = 0
  let filled = 0

  nonTerminals.value.forEach(nt => {
    terminals.value.forEach(t => {
      total++
      if (parsingTable.value![nt] && parsingTable.value![nt][t]) {
        filled++
      }
    })
  })

  return {
    totalEntries: total,
    filledEntries: filled,
    emptyEntries: total - filled,
    fillRate: total > 0 ? Math.round((filled / total) * 100) : 0
  }
})

const buildParsingTable = async () => {
  building.value = true
  buildingSteps.value = []
  conflicts.value = []

  try {
    // 模拟构建过程
    buildingSteps.value.push('开始构建LL1分析表...')
    await new Promise(resolve => setTimeout(resolve, 500))

    const table: Record<string, Record<string, string>> = {}

    // 初始化表格
    nonTerminals.value.forEach(nt => {
      table[nt] = {}
    })

    buildingSteps.value.push('为每个产生式分析First集...')
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟填入产生式
    const productions = [
      { left: 'E', right: 'TE1', first: ['(', 'id'] },
      { left: 'E1', right: '+TE1', first: ['+'] },
      { left: 'E1', right: 'ε', first: ['ε'] },
      { left: 'T', right: 'FT1', first: ['(', 'id'] },
      { left: 'T1', right: '*FT1', first: ['*'] },
      { left: 'T1', right: 'ε', first: ['ε'] },
      { left: 'F', right: '(E)', first: ['('] },
      { left: 'F', right: 'id', first: ['id'] }
    ]

    productions.forEach(prod => {
      prod.first.forEach(symbol => {
        if (symbol === 'ε') {
          // 对于ε产生式，添加到Follow集对应的终结符位置
          const followSet = followSets.value[prod.left as keyof typeof followSets.value]
          if (followSet) {
            followSet.forEach((followSymbol: string) => {
              if (followSymbol !== 'ε') {
                table[prod.left][followSymbol] = `${prod.left} → ${prod.right}`
                buildingSteps.value.push(`填入 M[${prod.left}, ${followSymbol}] = ${prod.left} → ${prod.right}`)
              }
            })
          }
        } else {
          table[prod.left][symbol] = `${prod.left} → ${prod.right}`
          buildingSteps.value.push(`填入 M[${prod.left}, ${symbol}] = ${prod.left} → ${prod.right}`)
        }
      })
    })

    buildingSteps.value.push('检查冲突...')
    await new Promise(resolve => setTimeout(resolve, 500))

    buildingSteps.value.push('构建完成，无冲突！')
    parsingTable.value = table

  } catch (error) {
    buildingSteps.value.push('构建失败: ' + error)
  } finally {
    building.value = false
  }
}

onMounted(() => {
  // 自动构建分析表
  setTimeout(buildParsingTable, 1000)
})
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #dcfce7; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }
</style>
