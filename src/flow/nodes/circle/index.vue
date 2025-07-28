<template>
  <BaseNode
    v-bind="props"
    node-shape="circle"
    :handles="circleHandles"
    @node-click="handleNodeClick"
    @editing-start="onEditingStart"
    @editing-end="onEditingEnd"
  >
    <template #default="{ isEditing, nodeText, finishEditing, cancelEditing }">
      <!-- Node Content -->
      <div
        class="relative z-10 flex items-center justify-center"
        :class="{ 'pointer-events-none': !isEditing }"
      >
        <div class="flex items-center justify-center text-sm font-medium text-gray-700">
          <div class="text-center relative">
            <input
              v-if="isEditing"
              ref="localInputRef"
              v-model="localEditingText"
              class="text-center bg-transparent border-none outline-none w-full text-xs"
              @blur="handleFinishEditing(finishEditing)"
              @keyup.enter="handleFinishEditing(finishEditing)"
              @keyup.escape="handleCancelEditing(cancelEditing)"
            />
            <span v-if="!isEditing" :class="textClasses" class="text-gray-700 text-xs text-center">
              {{ nodeText || 'Click' }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </BaseNode>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Position, type NodeProps } from '@vue-flow/core'
import BaseNode from '../base/index.vue'
import type { NodeData } from '../../types'

interface Props extends NodeProps {
  data: NodeData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:data': [data: NodeData]
  'node-click': [event: MouseEvent]
}>()

// 本地状态管理
const localInputRef = ref<HTMLInputElement>()
const localEditingText = ref('')

// 圆形节点的特定handles配置
const circleHandles = [
  {
    id: 'top-right',
    type: 'source' as const,
    position: Position.Right,
    class:
      'handle-interactive handle-top-right !bg-transparent !border-0 !w-4 !h-4 !pointer-events-auto',
  },
  {
    id: 'top-right-target',
    type: 'target' as const,
    position: Position.Right,
    class:
      'handle-interactive handle-top-right !bg-transparent !border-0 !w-4 !h-4 !pointer-events-auto',
  },
  {
    id: 'center-source',
    type: 'source' as const,
    position: Position.Top,
    class: 'center-handle',
  },
  {
    id: 'center-target',
    type: 'target' as const,
    position: Position.Top,
    class: 'center-handle',
  },
]

// 文本CSS类
const textClasses = computed(() => ({
  'italic opacity-50': !props.data.text,
  'opacity-100': props.data.text,
  'font-bold': props.data.isInitial || props.data.isFinal,
}))

// 处理节点点击
const handleNodeClick = (event: MouseEvent) => {
  emit('node-click', event)
}

// 监听编辑开始，同步文本到本地变量
const onEditingStart = () => {
  localEditingText.value = props.data.text || ''
  nextTick(() => {
    if (localInputRef.value) {
      localInputRef.value.focus()
      localInputRef.value.select()
    }
  })
}

// 处理编辑完成
const handleFinishEditing = (finishEditing: Function) => {
  // 更新数据
  emit('update:data', { ...props.data, text: localEditingText.value })
  // 调用base组件的完成方法
  finishEditing()
}

// 处理取消编辑
const handleCancelEditing = (cancelEditing: Function) => {
  // 重置本地文本
  localEditingText.value = props.data.text || ''
  // 调用base组件的取消方法
  cancelEditing()
}

// 编辑结束
const onEditingEnd = (text: string) => {
  // 这个方法由base组件调用，但我们已经在handleFinishEditing中处理了数据更新
}
</script>

<style scoped>
/* 圆形节点特有样式 */
</style>
