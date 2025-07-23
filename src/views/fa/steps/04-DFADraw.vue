<template>
  <div class="dfa-draw-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:share-2" class="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">绘制 DFA</h2>
          <p class="text-gray-600 mt-1">第四步：根据转换表绘制确定有限自动机</p>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="step-content">
      <div class="space-y-6">
        <!-- 转换表参考区域 -->
        <div class="transition-tables-reference">
          <div class="bg-white border border-gray-200 rounded-lg">
            <div class="border-b border-gray-200 p-4">
              <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                <Icon icon="lucide:table" class="w-5 h-5 text-green-600" />
                转换表参考（来自第三步）
              </h3>
              <p class="text-sm text-gray-600 mt-1">根据这些表格绘制 DFA 图</p>
            </div>
            <div class="p-6">
              <div v-if="conversionTable.length || transitionMatrix.length" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 转换表 -->
                <div v-if="conversionTable.length" class="conversion-table">
                  <h4 class="font-medium text-gray-800 mb-3">NFA → DFA 转换表</h4>
                  <div class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300 text-sm">
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
                          v-for="(row, index) in conversionTable"
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
                            {{ row.transitions?.[symbol] || '-' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 状态转换矩阵 -->
                <div v-if="transitionMatrix.length" class="transition-matrix">
                  <h4 class="font-medium text-gray-800 mb-3">状态转换矩阵</h4>
                  <div class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300 text-sm">
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
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, index) in transitionMatrix"
                          :key="index"
                          :class="index % 2 === 0 ? 'bg-white' : 'bg-purple-50'"
                        >
                          <td class="border border-gray-300 px-3 py-2 font-medium">
                            {{ row.state }}
                          </td>
                          <td
                            v-for="symbol in alphabetSymbols"
                            :key="symbol"
                            class="border border-gray-300 px-3 py-2 text-center"
                          >
                            {{ row.transitions?.[symbol] || '-' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8 text-gray-500">
                <Icon icon="lucide:table-2" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>暂无转换表数据</p>
                <p class="text-sm mt-1">请先完成第三步的子集构造</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 上方：用户画图区域 -->
        <div class="user-draw-area">
          <div class="bg-white border border-gray-200 rounded-lg">
            <!-- 用户画布 -->
            <div class="h-[700px] p-4">
              <FACanvas ref="dfaCanvasRef" mode="dfa" />
            </div>
          </div>

          <!-- DFA 信息面板 -->
          <div class="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="lucide:info" class="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="font-medium text-orange-800">DFA 绘制区域</h4>
                <div class="text-sm text-orange-700 mt-2 space-y-1">
                  <p>• 在上方画布中手动绘制DFA</p>
                  <p>• 根据转换表添加状态和转换</p>
                  <p>• 完成绘制后可进入下一步</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 绘制提示 -->
          <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon icon="lucide:lightbulb" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="font-medium text-blue-800">绘制提示</h4>
                <div class="text-sm text-blue-700 mt-2 space-y-1">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p class="font-medium">正则表达式:</p>
                      <code class="block mt-1 p-2 bg-white rounded border font-mono text-xs">{{ faStore.inputRegex }}</code>
                    </div>
                    <div>
                      <p class="font-medium">DFA 状态数: {{ dfaStates.length }}</p>
                      <p>转换数: {{ totalTransitions }}</p>
                    </div>
                    <div>
                      <p class="font-medium">字母表: {{ alphabetSymbols.join(', ') }}</p>
                    </div>
                  </div>
                  <ul class="mt-3 space-y-1">
                    <li>• 根据第三步的转换表构造 DFA</li>
                    <li>• 确保每个状态都有明确的转换</li>
                    <li>• 标记初始状态和接受状态</li>
                    <li>• 验证 DFA 的确定性</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 下方：答案区域 -->
        <div class="answer-area">
          <div class="bg-white border border-gray-200 rounded-lg">
            <!-- 答案区域头部 -->
            <div class="border-b border-gray-200 p-4">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">标准答案</h3>
                <div class="flex items-center gap-2">
                  <button
                    @click="toggleAnswer"
                    class="px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Icon
                      icon="lucide:refresh-cw"
                      class="w-4 h-4 inline mr-2"
                    />
                    刷新答案
                  </button>
                </div>
              </div>
            </div>

            <!-- 答案内容 -->
            <div class="h-80 p-4">
              <div v-if="!showAnswer" class="h-full flex items-center justify-center">
                <div class="text-center text-gray-500">
                  <Icon icon="lucide:lock" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p class="text-lg font-medium">答案已隐藏</p>
                  <p class="text-sm mt-1">完成你的绘制后点击"查看答案"按钮</p>
                </div>
              </div>

              <div v-else class="h-full overflow-auto">
                <div class="space-y-6">
                  <!-- SVG 渲染的答案 -->
                  <div v-if="faStore.dfaDotString" class="answer-svg">
                    <h4 class="font-medium text-gray-800 mb-3">DFA 图形（标准答案）</h4>
                    <div
                      ref="answerSvgContainer"
                      class="h-64 w-full flex items-center justify-center bg-gray-50 rounded border"
                    >
                      <!-- SVG 内容将通过 JavaScript 渲染到这里 -->
                    </div>
                  </div>
                </div>

                <div v-if="!faStore.dfaDotString" class="h-full flex items-center justify-center text-gray-500">
                  <div class="text-center">
                    <Icon icon="lucide:alert-circle" class="w-8 h-8 mx-auto mb-2" />
                    <p>暂无答案数据</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- DOT 字符串显示 -->
            <div v-if="showAnswer && faStore.dfaDotString" class="border-t border-gray-200 bg-green-50 p-4">
              <div class="flex items-start gap-3">
                <Icon icon="lucide:check-circle" class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h4 class="font-medium text-green-800">DFA 构造分析</h4>
                    <div class="flex items-center gap-2">
                      <button
                        @click="showDotString = !showDotString"
                        class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        <Icon icon="lucide:code" class="w-3 h-3 inline mr-1" />
                        {{ showDotString ? '隐藏' : '显示' }} DOT
                      </button>
                      <button
                        v-if="showDotString"
                        @click="copyDotString"
                        class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Icon icon="lucide:copy" class="w-3 h-3 inline mr-1" />
                        复制
                      </button>
                    </div>
                  </div>
                  <div class="text-sm text-green-700 mt-2 space-y-1">
                    <p>• 正则表达式: <code class="font-mono bg-white px-1 rounded">{{ faStore.inputRegex }}</code></p>
                    <p>• DFA 构造完成</p>
                    <p>• 使用子集构造法生成</p>
                    <p>• 可进行下一步 DFA 最小化</p>
                  </div>
                  <!-- DOT 字符串显示 -->
                  <div v-if="showDotString" class="mt-3 bg-white border border-green-200 rounded p-3">
                    <pre class="text-xs font-mono overflow-auto max-h-32">{{ faStore.dfaDotString }}</pre>
                  </div>
                </div>
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
        <div class="text-sm text-gray-500">步骤 4 / 6</div>
        <button
          @click="proceedToNext"
          :disabled="!isComplete"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            isComplete
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import FACanvas from '@/components/flow/canvas/FACanvas.vue'
import { useFAStore } from '@/stores'
import { instance } from '@viz-js/viz'

const emit = defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 使用 FA Store
const faStore = useFAStore()

// 本地状态
const dfaStates = ref<string[]>([])
const alphabetSymbols = ref<string[]>([])
const totalTransitions = ref(0)
const conversionTable = ref<any[]>([])
const transitionMatrix = ref<any[]>([])
const answerTransitionMatrix = ref<any[]>([]) // 标准答案的状态转换矩阵

// 状态管理
const showDotString = ref(false)
const showAnswer = ref(true) // 默认显示答案

// DFA 画布引用
const dfaCanvasRef = ref<InstanceType<typeof FACanvas>>()
const answerSvgContainer = ref<HTMLElement>()

// 计算属性
const isComplete = computed(() => {
  // 检查画布是否有内容（用户是否手动绘制了DFA）
  if (!dfaCanvasRef.value) return false

  // 检查画布中是否有节点和边
  const hasNodes = dfaCanvasRef.value.getNodes && dfaCanvasRef.value.getNodes().length > 0
  const hasEdges = dfaCanvasRef.value.getEdges && dfaCanvasRef.value.getEdges().length > 0

  return hasNodes && hasEdges
})

// 从localStorage获取数据
onMounted(() => {
  if (!faStore.hasResult()) {
    console.warn('No FA data found, please complete step 1 first')
    return
  }

  try {
    // 直接使用 store 中的数据
    const faResult = faStore.originalData
    if (faResult) {
      console.log('Step 4 loaded data from store')
      console.log('DFA DOT string:', faStore.dfaDotString)

      // 从后端数据中提取字母表符号
      extractAlphabetFromFAData(faResult)

      // 构建转换表（从 table 数据）
      buildConversionTable()

      // 构建状态转换矩阵（从 table_to_num 数据）
      buildAnswerTransitionMatrix()

      // 设置DFA状态
      if (faResult.table_to_num) {
        const allStates = Object.keys(faResult.table_to_num)
        const sKeys = allStates.filter(x => x === 'S')
        const nonSKeys = allStates.filter(x => x !== 'S').sort()
        dfaStates.value = [...sKeys, ...nonSKeys]
      }

      // 计算转换数量
      totalTransitions.value = conversionTable.value.reduce((total, row) => {
        return total + Object.values(row.transitions).filter(t => t && t !== '-').length
      }, 0)
    }

    // 自动渲染答案SVG
    if (faStore.dfaDotString && showAnswer.value) {
      nextTick(() => {
        renderDotToSvg()
      })
    }
  } catch (error) {
    console.error('处理FA数据失败：', error)
  }
})

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

// 从后端数据构建标准答案的状态转换矩阵
const buildAnswerTransitionMatrix = () => {
  if (!faStore.hasResult() || !faStore.originalData?.table_to_num) return

  console.log('Building answer transition matrix from backend data:', faStore.originalData.table_to_num)

  const tableToNum = faStore.originalData.table_to_num

  // 后端数据结构：table_to_num 是一个对象
  // 键是状态名（如 'S', 'S0', 'S1' 等）
  // 值是数组，包含每个输入符号对应的转换结果

  // 获取所有状态名，按照旧前端的逻辑排序：先取'S'状态，然后其他状态排序
  const allStates = Object.keys(tableToNum)
  const sKeys = allStates.filter(x => x === 'S')
  const nonSKeys = allStates.filter(x => x !== 'S').sort()
  const stateKeys = [...sKeys, ...nonSKeys]

  console.log('State keys:', stateKeys)
  console.log('Alphabet symbols:', alphabetSymbols.value)

  // 构建矩阵
  const matrix: any[] = []

  // 对每个状态（行），构建其对应的转换
  stateKeys.forEach((state) => {
    const row: any = {
      state: state,
      transitions: {}
    }

    // 获取该状态的转换数组
    const stateTransitions = tableToNum[state] || []

    // 对每个字母表符号，获取对应的转换
    alphabetSymbols.value.forEach((symbol, symbolIndex) => {
      row.transitions[symbol] = stateTransitions[symbolIndex] || '-'
    })

    matrix.push(row)
  })

  console.log('Built matrix:', matrix)
  answerTransitionMatrix.value = matrix
}

// 从后端数据构建转换表
const buildConversionTable = () => {
  if (!faStore.hasResult() || !faStore.originalData?.table) return

  console.log('Building conversion table from backend data:', faStore.originalData.table)

  const table = faStore.originalData.table
  const newTable: any[] = []

  // 获取所有符号（过滤掉特殊符号）
  const symbols = Object.keys(table).filter(symbol =>
    symbol !== 'I' && symbol !== 'ε' && symbol !== 'epsilon'
  ).sort()

  // 获取状态数量（假设所有符号的转换数组长度相同）
  const stateCount = table[symbols[0]]?.length || 0

  // 为每个状态创建行
  for (let i = 0; i < stateCount; i++) {
    const row = {
      state: `S${i}`,
      transitions: {} as Record<string, string>
    }

    // 为每个符号填入转换信息
    symbols.forEach(symbol => {
      const transition = table[symbol][i]
      if (Array.isArray(transition)) {
        // 如果是数组，用空字符串连接（按旧前端的方式）
        row.transitions[symbol] = transition.join('') || '-'
      } else {
        row.transitions[symbol] = transition || '-'
      }
    })

    newTable.push(row)
  }

  console.log('Built conversion table:', newTable)
  conversionTable.value = newTable
}// 刷新答案显示
const toggleAnswer = async () => {
  console.log('Refreshing answer display')

  // 重新从后端数据构建转换表和矩阵
  if (faStore.hasResult()) {
    buildConversionTable()
    buildAnswerTransitionMatrix()
  }

  // 重新渲染SVG
  if (faStore.dfaDotString) {
    // 等待DOM更新
    await nextTick()
    console.log('Re-rendering SVG on refresh')

    if (answerSvgContainer.value) {
      // 使用 viz.js 渲染 DOT 图
      await renderDotToSvg()
    } else {
      console.error('answerSvgContainer ref is null after nextTick')
    }
  }
}

// 渲染DOT字符串为SVG
const renderDotToSvg = async () => {
  if (!answerSvgContainer.value || !faStore.dfaDotString) {
    console.warn('renderDotToSvg: 缺少必要条件', {
      hasContainer: !!answerSvgContainer.value,
      hasDotString: !!faStore.dfaDotString
    })
    return
  }

  try {
    console.log('开始渲染DFA DOT...')
    console.log('Container:', answerSvgContainer.value)
    console.log('DOT String:', faStore.dfaDotString)

    // 清除之前的内容
    answerSvgContainer.value.innerHTML = ''

    // 显示加载状态
    answerSvgContainer.value.innerHTML = '<div class="text-center text-blue-600">正在渲染图形...</div>'

    // 使用 viz.js 渲染 DOT 字符串
    console.log('正在初始化 viz.js...')
    const viz = await instance()
    console.log('viz.js 初始化成功:', viz)

    console.log('正在渲染 SVG...')
    const svg = viz.renderSVGElement(faStore.dfaDotString)
    console.log('SVG 渲染成功:', svg)

    // 清除加载状态
    answerSvgContainer.value.innerHTML = ''

    // 添加样式使 SVG 适应容器
    svg.style.maxWidth = '100%'
    svg.style.maxHeight = '100%'
    svg.style.height = 'auto'
    svg.style.width = 'auto'

    // 将 SVG 添加到容器
    answerSvgContainer.value.appendChild(svg)

    console.log('DFA DOT rendered successfully, SVG added to container')
    console.log('Container children count:', answerSvgContainer.value.children.length)
  } catch (error) {
    console.error('渲染DOT图失败：', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    answerSvgContainer.value.innerHTML = `
      <div class="text-center text-red-500">
        <p>渲染失败: ${errorMessage}</p>
        <div class="mt-4 text-xs bg-gray-100 p-2 rounded text-left">
          <pre class="whitespace-pre-wrap">${faStore.dfaDotString}</pre>
        </div>
      </div>
    `
  }
}

// 复制DOT字符串
const copyDotString = async () => {
  try {
    await navigator.clipboard.writeText(faStore.dfaDotString || '')
    // 这里可以添加一个提示
    console.log('DOT字符串已复制')
  } catch (error) {
    console.error('复制失败：', error)
  }
}

// 进入下一步
const proceedToNext = () => {
  if (isComplete.value) {
    const stepData = {
      dfaStates: dfaStates.value,
      dfaDotString: faStore.dfaDotString,
      timestamp: new Date().toISOString()
    }

    // 保存数据
    localStorage.setItem('fa-step4-data', JSON.stringify(stepData))

    // 触发下一步事件
    emit('next-step')
  }
}
</script>

<style scoped>
.step-header { padding: 2rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
.step-icon { width: 3rem; height: 3rem; background: #fed7aa; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
.step-content { padding: 2rem; }
.step-actions { padding: 1rem 2rem 2rem; border-top: 1px solid #e5e7eb; background: #f9fafb; }
</style>
