<template>
  <div class="first-follow-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:shuffle" class="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">求First集和Follow集</h2>
          <p class="text-gray-600 mt-1">第二步：计算文法中所有非终结符的First集和Follow集</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <div class="max-w-6xl mx-auto">
        <!-- First集计算 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Icon icon="lucide:arrow-right" class="w-5 h-5 mr-2 text-blue-600" />
            First集计算
          </h3>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- First集表格 -->
            <div>
              <h4 class="text-md font-medium text-gray-800 mb-3">用户输入</h4>
              <div class="space-y-2">
                <div
                  v-for="symbol in nonTerminals"
                  :key="'first-' + symbol"
                  class="flex items-center gap-3"
                >
                  <span class="w-12 text-center font-mono font-semibold">{{ symbol }}:</span>
                  <input
                    v-model="userFirstSets[symbol]"
                    type="text"
                    placeholder="输入First集，用逗号分隔"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    @input="validateFirstSet(symbol)"
                  />
                  <div class="w-6 h-6 flex items-center justify-center">
                    <Icon
                      v-if="firstValidation[symbol] === 'correct'"
                      icon="lucide:check"
                      class="w-5 h-5 text-green-500"
                    />
                    <Icon
                      v-else-if="firstValidation[symbol] === 'incorrect'"
                      icon="lucide:x"
                      class="w-5 h-5 text-red-500"
                    />
                  </div>
                </div>
              </div>

              <button
                @click="checkFirstSets"
                :disabled="!canCheckFirst"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                验证First集
              </button>
            </div>

            <!-- First集答案（仅在验证后显示） -->
            <div v-if="showFirstAnswer" class="bg-blue-50 rounded-lg p-4">
              <h4 class="text-md font-medium text-gray-800 mb-3">正确答案</h4>
              <div class="space-y-2">
                <div
                  v-for="symbol in nonTerminals"
                  :key="'answer-first-' + symbol"
                  class="flex items-center gap-3"
                >
                  <span class="w-12 text-center font-mono font-semibold">{{ symbol }}:</span>
                  <span class="text-blue-700 font-mono">{{ correctFirstSets[symbol]?.join(', ') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Follow集 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Icon icon="lucide:arrow-left" class="w-5 h-5 mr-2 text-green-600" />
            Follow集计算
          </h3>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Follow集表格 -->
            <div>
              <h4 class="text-md font-medium text-gray-800 mb-3">用户输入</h4>
              <div class="space-y-2">
                <div
                  v-for="symbol in nonTerminals"
                  :key="'follow-' + symbol"
                  class="flex items-center gap-3"
                >
                  <span class="w-12 text-center font-mono font-semibold">{{ symbol }}:</span>
                  <input
                    v-model="userFollowSets[symbol]"
                    type="text"
                    placeholder="输入Follow集，用逗号分隔"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    @input="validateFollowSet(symbol)"
                  />
                  <div class="w-6 h-6 flex items-center justify-center">
                    <Icon
                      v-if="followValidation[symbol] === 'correct'"
                      icon="lucide:check"
                      class="w-5 h-5 text-green-500"
                    />
                    <Icon
                      v-else-if="followValidation[symbol] === 'incorrect'"
                      icon="lucide:x"
                      class="w-5 h-5 text-red-500"
                    />
                  </div>
                </div>
              </div>

              <button
                @click="checkFollowSets"
                :disabled="!canCheckFollow"
                class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                验证Follow集
              </button>
            </div>

            <!-- Follow集答案（仅在验证后显示） -->
            <div v-if="showFollowAnswer" class="bg-green-50 rounded-lg p-4">
              <h4 class="text-md font-medium text-gray-800 mb-3">正确答案</h4>
              <div class="space-y-2">
                <div
                  v-for="symbol in nonTerminals"
                  :key="'answer-follow-' + symbol"
                  class="flex items-center gap-3"
                >
                  <span class="w-12 text-center font-mono font-semibold">{{ symbol }}:</span>
                  <span class="text-green-700 font-mono">{{ correctFollowSets[symbol]?.join(', ') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 计算提示 -->
        <div class="bg-yellow-50 rounded-lg p-6">
          <h4 class="text-md font-semibold text-gray-900 mb-3">计算提示</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h5 class="font-medium text-gray-800 mb-2">First集计算规则:</h5>
              <ul class="space-y-1 text-gray-600">
                <li>• 若 X 是终结符，First(X) = {X}</li>
                <li>• 若 X→ε 是产生式，则 ε ∈ First(X)</li>
                <li>• 若 X→Y₁Y₂...Yₖ，则将 First(Y₁) 中非 ε 符号加入 First(X)</li>
                <li>• 若 ε ∈ First(Yi)，继续处理 Yi+1</li>
              </ul>
            </div>
            <div>
              <h5 class="font-medium text-gray-800 mb-2">Follow集计算规则:</h5>
              <ul class="space-y-1 text-gray-600">
                <li>• $ ∈ Follow(S)，S 为开始符号</li>
                <li>• 若 A→αBβ，将 First(β) 中非 ε 符号加入 Follow(B)</li>
                <li>• 若 A→αB 或 A→αBβ 且 ε ∈ First(β)，将 Follow(A) 加入 Follow(B)</li>
              </ul>
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
        <button
          @click="$emit('next-step')"
          :disabled="!canProceed"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            canProceed
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
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useLL1API } from '@/composables/api/useLL1API'

defineEmits<{
  'next-step': []
  'prev-step': []
}>()

const { analysisResult } = useLL1API()

// 从分析结果中获取数据
const nonTerminals = computed(() => analysisResult.value?.Vn || [])
const correctFirstSets = computed(() => analysisResult.value?.first || {})
const correctFollowSets = computed(() => analysisResult.value?.follow || {})

// 用户输入
const userFirstSets = ref<Record<string, string>>({})
const userFollowSets = ref<Record<string, string>>({})

// 验证状态
const firstValidation = ref<Record<string, 'correct' | 'incorrect' | ''>>({})
const followValidation = ref<Record<string, 'correct' | 'incorrect' | ''>>({})

// 显示答案
const showFirstAnswer = ref(false)
const showFollowAnswer = ref(false)

// 计算条件
const canCheckFirst = computed(() => {
  return nonTerminals.value.every(symbol => userFirstSets.value[symbol]?.trim())
})

const canCheckFollow = computed(() => {
  return nonTerminals.value.every(symbol => userFollowSets.value[symbol]?.trim())
})

const allFirstCorrect = computed(() => {
  return nonTerminals.value.every(symbol => firstValidation.value[symbol] === 'correct')
})

const allFollowCorrect = computed(() => {
  return nonTerminals.value.every(symbol => followValidation.value[symbol] === 'correct')
})

const canProceed = computed(() => {
  return allFirstCorrect.value && allFollowCorrect.value
})

// 验证函数
const validateFirstSet = (symbol: string) => {
  firstValidation.value[symbol] = ''
}

const validateFollowSet = (symbol: string) => {
  followValidation.value[symbol] = ''
}

const checkFirstSets = () => {
  nonTerminals.value.forEach(symbol => {
    const userSet = userFirstSets.value[symbol]?.split(',').map(s => s.trim()).filter(s => s)
    const correctSet = correctFirstSets.value[symbol] || []

    if (userSet && arraysEqual(userSet.sort(), correctSet.sort())) {
      firstValidation.value[symbol] = 'correct'
    } else {
      firstValidation.value[symbol] = 'incorrect'
    }
  })

  showFirstAnswer.value = true
}

const checkFollowSets = () => {
  nonTerminals.value.forEach(symbol => {
    const userSet = userFollowSets.value[symbol]?.split(',').map(s => s.trim()).filter(s => s)
    const correctSet = correctFollowSets.value[symbol] || []

    if (userSet && arraysEqual(userSet.sort(), correctSet.sort())) {
      followValidation.value[symbol] = 'correct'
    } else {
      followValidation.value[symbol] = 'incorrect'
    }
  })

  showFollowAnswer.value = true
}

const arraysEqual = (a: string[], b: string[]) => {
  return a.length === b.length && a.every((val, i) => val === b[i])
}

// 初始化
onMounted(() => {
  nonTerminals.value.forEach(symbol => {
    userFirstSets.value[symbol] = ''
    userFollowSets.value[symbol] = ''
    firstValidation.value[symbol] = ''
    followValidation.value[symbol] = ''
  })
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
  background-color: #dbeafe;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
