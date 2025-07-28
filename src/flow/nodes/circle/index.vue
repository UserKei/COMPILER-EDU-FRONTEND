<template>
  <BaseNode
    v-bind="props"
    node-shape="circle"
    :handles="circleHandles"
    @node-click="handleNodeClick"
    @editing-start="onEditingStart"
    @editing-end="onEditingEnd"
  >
    <template #default="{ isEditing, nodeText, finishEditing, cancelEditing, inputRef }">
      <!-- Node Content -->
      <div
        class="relative z-10 flex items-center justify-center"
        :class="{ 'pointer-events-none': !isEditing }"
      >
        <div class="flex items-center justify-center text-sm font-medium text-gray-700">
          <div class="text-center relative">
            <input
              v-if="isEditing"
              ref="inputRef"
              v-model="nodeText"
              class="text-center bg-transparent border-none outline-none w-full text-xs"
              @blur="finishEditing"
              @keyup.enter="finishEditing"
              @keyup.escape="cancelEditing"
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
import { ref, computed } from 'vue'
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

// 编辑开始
const onEditingStart = () => {
  // 由base组件管理编辑状态
}

// 编辑结束
const onEditingEnd = (text: string) => {
  emit('update:data', { ...props.data, text })
}
</script>

<style scoped>
/* 圆形节点特有样式 */
</style>
