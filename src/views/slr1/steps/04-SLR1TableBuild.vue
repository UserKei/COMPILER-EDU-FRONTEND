<template>
  <div class="slr1-table-build-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:table" class="w-6 h-6 text-cyan-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">SLR1表构建</h2>
          <p class="text-gray-600 mt-1">第四步：构建SLR1分析表</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <!-- 说明区域 -->
      <div class="bg-cyan-50 border border-cyan-200 rounded-lg p-6 mb-6">
        <div class="flex items-start">
          <Icon icon="lucide:info" class="w-5 h-5 text-cyan-600 mt-0.5 mr-3" />
          <div>
            <h3 class="text-lg font-semibold text-cyan-900 mb-2">SLR1分析表构造规则</h3>
            <ul class="space-y-1 text-sm text-cyan-800">
              <li>• <strong>ACTION表：</strong>根据项目集中的项目和FOLLOW集填写移进和规约动作</li>
              <li>• <strong>GOTO表：</strong>根据DFA的转移关系填写状态转移</li>
              <li>
                • <strong>移进动作：</strong>A → α·aβ，则ACTION[i,a] = Sj（状态j包含A → αa·β）
              </li>
              <li>
                • <strong>规约动作：</strong>A → α·且a∈FOLLOW(A)，则ACTION[i,a] = rk（第k个产生式）
              </li>
              <li>• <strong>接受动作：</strong>S' → S·，则ACTION[i,$] = acc</li>
              <li>• <strong>SLR1特点：</strong>使用FOLLOW集解决LR0的规约/规约冲突</li>
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
        <!-- FOLLOW集显示 -->
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">FOLLOW集</h3>
          <p class="text-sm text-gray-600 mb-4">SLR1需要使用FOLLOW集来解决规约冲突</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(followSet, symbol) in followSets"
              :key="symbol"
              class="bg-gray-50 p-3 rounded"
            >
              <div class="font-medium text-gray-900 mb-1">FOLLOW({{ symbol }})</div>
              <div class="text-sm text-gray-700">{{ followSet || '∅' }}</div>
            </div>
            <!-- 如果没有FOLLOW集数据，显示提示 -->
            <div
              v-if="Object.keys(followSets).length === 0"
              class="col-span-full text-center text-gray-500"
            >
              FOLLOW集将在分析过程中自动计算
            </div>
          </div>
        </div>

        <!-- 替换原有分析表区域为ParsingTable组件 -->
        <div v-if="tableProps" class="mt-6">
          <ParsingTable
            v-bind="tableProps"
            @validation-complete="handleValidation"
            @step-complete="handleStepComplete"
          />
        </div>

        <!-- 数据格式异常的后备显示 -->
        <div v-else-if="!tableProps" class="text-center py-12">
          <Icon icon="lucide:alert-triangle" class="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          <p class="text-lg font-medium text-gray-600">数据加载异常</p>
          <p class="text-sm text-gray-500 mt-1">请检查前面的步骤是否正确完成</p>
        </div>
      </div>
    </div>

    <div class="step-actions">
      <div class="flex justify-between items-center">
        <button
          @click="$emit('prev-step')"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
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
              ? 'bg-cyan-600 text-white hover:bg-cyan-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
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
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useSLR1Store } from '@/stores/slr1'
import ParsingTable from '@/components/lr/ParsingTable.vue'

const emit = defineEmits<{
  'next-step': []
  'prev-step': []
}>()

const slr1Store = useSLR1Store()

// 步骤完成状态
const stepCompleteStatus = ref(false)

// 从store获取分析数据
const analysisData = computed(() => slr1Store.analysisResult)

// FOLLOW集数据 - 如果后端提供的话
const followSets = computed(() => {
  // 如果后端提供FOLLOW集数据，在这里获取
  // 目前先返回空对象，可以根据实际后端数据结构调整
  return {}
})

// 计算属性
const terminals = computed(() => {
  if (!analysisData.value?.Vt) return []
  return analysisData.value.Vt.map((item: any) => item.text || item)
})

const nonterminals = computed(() => {
  if (!analysisData.value?.Vn) return []
  return analysisData.value.Vn.filter((item: any) => {
    const text = item.text || item
    return text !== analysisData.value?.S + "'"
  }).map((item: any) => item.text || item)
})

// 数据转换函数 - 将SLR1数据格式转换为ParsingTable组件期望的格式
const convertSLR1CorrectAnswers = () => {
  if (!analysisData.value) return { actions: {}, gotos: {} }

  const actions: Record<string, string> = {}
  const gotos: Record<string, string> = {}

  // 处理actions数据（SLR1 store中actions已经是Record<string, string>格式）
  if (analysisData.value.actions && typeof analysisData.value.actions === 'object') {
    // 处理符号差异（# vs $）
    Object.entries(analysisData.value.actions).forEach(([key, value]) => {
      const convertedKey = key.replace(',#', ',$')
      actions[convertedKey] = value
    })
  }

  // 处理gotos数据
  if (analysisData.value.gotos && typeof analysisData.value.gotos === 'object') {
    Object.assign(gotos, analysisData.value.gotos)
  }

  return { actions, gotos }
}

// 为ParsingTable组件准备数据
const tableProps = computed(() => {
  try {
    if (!analysisData.value) return null

    // 验证必要的数据字段
    if (!analysisData.value.Vt || !analysisData.value.Vn) {
      console.warn('缺少终结符或非终结符数据')
      return null
    }

    return {
      tableType: 'SLR1' as const,
      analysisData: analysisData.value,
      terminals: terminals.value,
      nonterminals: nonterminals.value,
      correctAnswers: convertSLR1CorrectAnswers(),
    }
  } catch (error) {
    console.error('准备表格数据时出错:', error)
    return null
  }
})

// 计算属性 - 步骤完成状态
const isStepComplete = computed(() => {
  return stepCompleteStatus.value && analysisData.value !== null
})

// 处理验证完成事件
const handleValidation = (result: { isValid: boolean; errors: any[] }) => {
  console.log('SLR1验证结果:', result)
  // 可以在这里添加额外的验证逻辑
}

// 处理步骤完成状态
const handleStepComplete = (isComplete: boolean) => {
  stepCompleteStatus.value = isComplete
}

// 下一步
const nextStep = () => {
  if (isStepComplete.value) {
    emit('next-step')
  }
}
</script>

<style scoped>
.step-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.step-icon {
  width: 3rem;
  height: 3rem;
  background: #cffafe;
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
