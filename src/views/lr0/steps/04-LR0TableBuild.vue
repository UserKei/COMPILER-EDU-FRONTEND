<template>
  <div class="lr0-table-build-step">
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:table" class="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">LR0表构建</h2>
          <p class="text-gray-600 mt-1">第四步：构建LR0分析表</p>
        </div>
      </div>
    </div>

    <div class="step-content">
      <!-- 说明区域 -->
      <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
        <div class="flex items-start">
          <Icon icon="lucide:info" class="w-5 h-5 text-indigo-600 mt-0.5 mr-3" />
          <div>
            <h3 class="text-lg font-semibold text-indigo-900 mb-2">LR0分析表构造规则</h3>
            <ul class="space-y-1 text-sm text-indigo-800">
              <li>• <strong>ACTION表：</strong>根据项目集中的项目填写移进和规约动作</li>
              <li>• <strong>GOTO表：</strong>根据DFA的转移关系填写状态转移</li>
              <li>
                • <strong>移进动作：</strong>A → α·aβ，则ACTION[i,a] = Sj（状态j包含A → αa·β）
              </li>
              <li>
                • <strong>规约动作：</strong>A → α·，则对所有终结符a，ACTION[i,a] =
                rk（第k个产生式）
              </li>
              <li>• <strong>接受动作：</strong>S' → S·，则ACTION[i,$] = acc</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 从前面步骤获取数据 -->
      <div v-if="!lr0Store.analysisResult" class="text-center py-20">
        <Icon icon="lucide:arrow-left" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-600 mb-2">请先完成前面的步骤</h3>
        <p class="text-gray-500">需要先完成文法分析和DFA构造才能建立分析表</p>
      </div>

      <div v-else class="space-y-8">
        <!-- 分析表构建区域 -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">LR0分析表</h3>
            <p class="text-sm text-gray-600 mt-1">ACTION表和GOTO表的组合</p>
          </div>

          <div class="p-6">
            <!-- 表格头部信息 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
              <div class="bg-blue-50 p-3 rounded">
                <span class="font-medium text-blue-900">状态数量：</span>
                <span class="text-blue-700">{{ lr0Store.dfaStates.length }}</span>
              </div>
              <div class="bg-green-50 p-3 rounded">
                <span class="font-medium text-green-900">终结符：</span>
                <span class="text-green-700">{{ lr0Store.analysisResult.Vt.join(', ') }}</span>
              </div>
              <div class="bg-purple-50 p-3 rounded">
                <span class="font-medium text-purple-900">非终结符：</span>
                <span class="text-purple-700">{{ lr0Store.analysisResult.Vn.join(', ') }}</span>
              </div>
            </div>

            <!-- 分析表 -->
            <div class="overflow-x-auto">
              <table class="min-w-full border border-gray-300">
                <!-- 表头 -->
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900">
                      状态
                    </th>
                    <!-- ACTION列 -->
                    <th
                      v-for="terminal in lr0Store.analysisResult.Vt"
                      :key="terminal"
                      class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900 bg-blue-50"
                    >
                      {{ terminal }}
                    </th>
                    <th
                      class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900 bg-blue-50"
                    >
                      $
                    </th>
                    <!-- GOTO列 -->
                    <th
                      v-for="nonterminal in lr0Store.analysisResult.Vn"
                      :key="nonterminal"
                      class="px-3 py-2 border border-gray-300 text-xs font-medium text-gray-900 bg-green-50"
                    >
                      {{ nonterminal }}
                    </th>
                  </tr>
                </thead>

                <!-- 表体 -->
                <tbody>
                  <tr v-for="(state, index) in lr0Store.dfaStates" :key="index">
                    <td class="px-3 py-2 border border-gray-300 text-xs font-bold bg-gray-50">
                      I{{ index }}
                    </td>
                    <!-- ACTION单元格 -->
                    <td
                      v-for="terminal in [...lr0Store.analysisResult.Vt, '$']"
                      :key="`action-${index}-${terminal}`"
                      class="px-3 py-2 border border-gray-300 text-xs text-center"
                    >
                      {{ getActionValue(index, terminal) }}
                    </td>
                    <!-- GOTO单元格 -->
                    <td
                      v-for="nonterminal in lr0Store.analysisResult.Vn"
                      :key="`goto-${index}-${nonterminal}`"
                      class="px-3 py-2 border border-gray-300 text-xs text-center"
                    >
                      {{ getGotoValue(index, nonterminal) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 表格说明 -->
            <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div class="bg-blue-50 p-3 rounded">
                <h4 class="font-medium text-blue-900 mb-1">ACTION动作</h4>
                <ul class="text-xs text-blue-700 space-y-1">
                  <li>• Si: 移进到状态i</li>
                  <li>• rj: 用产生式j规约</li>
                  <li>• acc: 接受</li>
                </ul>
              </div>
              <div class="bg-green-50 p-3 rounded">
                <h4 class="font-medium text-green-900 mb-1">GOTO函数</h4>
                <ul class="text-xs text-green-700 space-y-1">
                  <li>• 数字: 转移到对应状态</li>
                  <li>• 空白: 无转移</li>
                </ul>
              </div>
              <div class="bg-purple-50 p-3 rounded">
                <h4 class="font-medium text-purple-900 mb-1">分析结果</h4>
                <p class="text-xs text-purple-700">
                  {{ lr0Store.isLR0Grammar ? '✓ 符合LR0文法' : '✗ 存在冲突' }}
                </p>
              </div>
            </div>
          </div>
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
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          下一步
          <Icon icon="lucide:chevron-right" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useLR0Store } from '@/stores/lr0'

const emit = defineEmits<{
  'next-step': []
  'prev-step': []
}>()

const lr0Store = useLR0Store()

// 计算属性
const isStepComplete = computed(() => {
  return lr0Store.analysisResult !== null && lr0Store.isLR0Grammar === true
})

// 获取ACTION表的值
const getActionValue = (stateIndex: number, terminal: string) => {
  const key = `${stateIndex},${terminal}`
  return lr0Store.actionTable[key] || ''
}

// 获取GOTO表的值
const getGotoValue = (stateIndex: number, nonterminal: string) => {
  const key = `${stateIndex},${nonterminal}`
  return lr0Store.gotoTable[key] || ''
}

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
  background: #e0e7ff;
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
