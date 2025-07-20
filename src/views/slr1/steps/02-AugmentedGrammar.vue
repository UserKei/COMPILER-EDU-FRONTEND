<template>
  <div class="augmented-grammar-step">
    <div class="step-content">
      <!-- 步骤标题 -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
            2
          </div>
          <h2 class="text-2xl font-bold text-gray-800">写出增广文法</h2>
        </div>
        <p class="text-gray-600">
          将文法G[{{ startSymbol }}]拓广为G'[{{ startSymbol }}']，每个产生式右侧只有一个候选式
        </p>
      </div>

      <!-- 说明区域 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 class="text-lg font-semibold text-blue-800 mb-3">操作说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-gray-200 rounded"></div>
              <span class="text-sm text-gray-700">已知信息</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-yellow-200 rounded"></div>
              <span class="text-sm text-gray-700">待校验</span>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-200 rounded"></div>
              <span class="text-sm text-gray-700">校验正确</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-200 rounded"></div>
              <span class="text-sm text-gray-700">校验错误</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 增广文法输入区域 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">增广文法产生式</h3>

        <div class="space-y-3">
          <div
            v-for="(formula, index) in augmentedFormulas"
            :key="formula.id"
            class="flex items-center gap-3"
          >
            <!-- 产生式输入框 -->
            <div class="flex-1">
              <input
                v-model="formula.text"
                type="text"
                :placeholder="`产生式 ${index + 1}`"
                :class="[
                  'w-full px-3 py-2 border rounded-lg transition-colors',
                  getInputClass(formula.status)
                ]"
                @focus="onFormulaFocus(index)"
                @blur="onFormulaBlur(index)"
                :readonly="formula.readonly"
              />
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center gap-1">
              <button
                @click="removeFormula(index)"
                :disabled="index === 0 || formula.readonly"
                class="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                title="删除产生式"
              >
                ×
              </button>
              <button
                @click="addFormula(index)"
                class="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                title="添加产生式"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- 校验按钮 -->
        <div class="mt-6 flex gap-3">
          <button
            @click="validateFormulas"
            :disabled="isValidating"
            class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            <Icon
              :icon="isValidating ? 'lucide:loader-2' : 'lucide:check-circle'"
              :class="['w-4 h-4 inline mr-2', isValidating ? 'animate-spin' : '']"
            />
            {{ isValidating ? '校验中...' : '校验' }}
          </button>

          <button
            @click="resetFormulas"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icon icon="lucide:rotate-ccw" class="w-4 h-4 inline mr-2" />
            重置
          </button>
        </div>
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
              <p class="font-medium">{{ validationSuccess ? '校验成功' : '校验失败' }}</p>
              <p class="text-sm mt-1">{{ validationMessage }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 导航按钮 -->
      <div class="flex justify-between mt-8">
        <button
          @click="$emit('prev-step')"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Icon icon="lucide:arrow-left" class="w-4 h-4 inline mr-2" />
          上一步
        </button>

        <button
          @click="nextStep"
          :disabled="!isStepComplete"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            isStepComplete
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          下一步
          <Icon icon="lucide:arrow-right" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

// Props
defineProps<{
  // 可以接收从父组件传来的初始数据
}>()

// Emits
const emit = defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': []
}>()

// 响应式数据
const startSymbol = ref('S') // 开始符号，应该从前一步获取
const isValidating = ref(false)
const validationMessage = ref('')
const validationSuccess = ref(false)

// 增广文法产生式
const augmentedFormulas = ref([
  {
    id: 'formula_0',
    text: "S' -> S",
    status: 'readonly',
    readonly: true
  },
  {
    id: 'formula_1',
    text: '',
    status: 'normal',
    readonly: false
  }
])

let formulaCounter = 2

// 计算属性
const isStepComplete = computed(() => {
  return augmentedFormulas.value.every(formula =>
    formula.readonly || (formula.text.trim() && formula.status === 'correct')
  )
})

// 方法
const getInputClass = (status: string) => {
  switch (status) {
    case 'readonly':
      return 'bg-gray-100 border-gray-300 cursor-not-allowed'
    case 'correct':
      return 'bg-green-50 border-green-300'
    case 'error':
      return 'bg-red-50 border-red-300'
    case 'pending':
      return 'bg-yellow-50 border-yellow-300'
    default:
      return 'bg-white border-gray-300'
  }
}

const onFormulaFocus = (index: number) => {
  if (!augmentedFormulas.value[index].readonly && augmentedFormulas.value[index].status !== 'correct') {
    augmentedFormulas.value[index].status = 'normal'
  }
}

const onFormulaBlur = (index: number) => {
  if (!augmentedFormulas.value[index].readonly && augmentedFormulas.value[index].text.trim()) {
    augmentedFormulas.value[index].status = 'pending'
  }
}

const addFormula = (index: number) => {
  const newFormula = {
    id: `formula_${formulaCounter++}`,
    text: '',
    status: 'normal',
    readonly: false
  }
  augmentedFormulas.value.splice(index + 1, 0, newFormula)
}

const removeFormula = (index: number) => {
  if (index > 0 && !augmentedFormulas.value[index].readonly) {
    augmentedFormulas.value.splice(index, 1)
  }
}

const validateFormulas = async () => {
  isValidating.value = true
  validationMessage.value = ''

  try {
    // 模拟验证过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 这里应该调用后端API进行验证
    // 暂时使用模拟验证逻辑
    let allValid = true
    let errorMessage = ''

    for (let i = 0; i < augmentedFormulas.value.length; i++) {
      const formula = augmentedFormulas.value[i]
      if (!formula.readonly) {
        if (!formula.text.trim()) {
          formula.status = 'error'
          allValid = false
          errorMessage = '存在空的产生式'
        } else if (!isValidProduction(formula.text)) {
          formula.status = 'error'
          allValid = false
          errorMessage = '产生式格式不正确，应为 A -> α 的形式'
        } else {
          formula.status = 'correct'
        }
      }
    }

    if (allValid) {
      validationSuccess.value = true
      validationMessage.value = '所有产生式格式正确！'
    } else {
      validationSuccess.value = false
      validationMessage.value = errorMessage
    }

  } catch (error) {
    validationSuccess.value = false
    validationMessage.value = '验证过程中发生错误'
  } finally {
    isValidating.value = false
  }
}

const isValidProduction = (text: string): boolean => {
  // 简单的产生式格式验证：A -> α
  const pattern = /^[A-Z][']?\s*->\s*.+$/
  return pattern.test(text.trim())
}

const resetFormulas = () => {
  augmentedFormulas.value = [
    {
      id: 'formula_0',
      text: "S' -> S",
      status: 'readonly',
      readonly: true
    },
    {
      id: 'formula_1',
      text: '',
      status: 'normal',
      readonly: false
    }
  ]
  formulaCounter = 2
  validationMessage.value = ''
  validationSuccess.value = false
}

const nextStep = () => {
  if (isStepComplete.value) {
    emit('next-step')
  }
}

// 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.step-content {
  padding: 2rem;
  max-width: 4xl;
  margin: 0 auto;
}
</style>
