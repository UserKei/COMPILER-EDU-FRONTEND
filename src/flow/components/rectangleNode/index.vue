<template>
  <div
    ref="nodeRef"
    class="bg-white border-2 rounded-lg p-3 transition-all duration-200 relative cursor-default group hover:shadow-lg"
    :class="nodeClasses"
    @click="handleNodeClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    :style="nodeStyle"
  >
    <!-- Node Title (可选) -->
    <div
      v-if="props.data.title"
      class="text-center text-xs font-semibold text-gray-600 mb-2 border-b border-gray-200 pb-1"
    >
      {{ props.data.title }}
    </div>

    <!-- LR Items Container -->
    <div class="flex flex-col gap-1">
      <div
        v-for="(item, index) in itemList"
        :key="item.id || `item-${index}`"
        class="flex items-center gap-2 min-h-6 px-2 py-1 rounded transition-colors duration-150 hover:bg-gray-50 group/item"
        @click.stop="item.id && editItem(item.id)"
      >
        <!-- Item Content -->
        <div class="flex-1 min-w-0">
          <input
            v-if="editingItemId === item.id"
            ref="editInputRef"
            v-model="editingText"
            class="w-full bg-transparent border-none outline-none text-xs text-gray-700 cursor-text font-normal placeholder-gray-400"
            placeholder="Enter LR item (e.g., E → E • + T)"
            @blur="finishEditingItem"
            @keyup.enter="finishEditingItem"
            @keyup.escape="cancelEditingItem"
            @keydown="handleInputKeydown"
          />
          <span
            v-else
            class="text-xs text-gray-700 cursor-text block truncate"
            :class="itemTextClasses(item)"
          >
            {{ getDisplayText(item) || 'Click to edit...' }}
          </span>
        </div>

        <!-- Delete Button (hover时显示) -->
        <button
          v-if="itemList.length > 1 && editingItemId !== item.id && item.id"
          @click.stop="deleteItem(item.id)"
          class="opacity-0 group-hover/item:opacity-100 w-4 h-4 rounded-full bg-red-100 hover:bg-red-200 text-red-600 text-xs flex items-center justify-center transition-all duration-150"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Add Button (节点悬停时显示) -->
    <button
      v-if="isHovered && !hasEditingItem"
      @click.stop="addNewItem"
      class="w-full mt-2 py-1 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 flex items-center justify-center gap-1"
    >
      <span class="text-sm">+</span>
      Add Item
    </button>

    <!-- Interactive Handles -->
    <Handle
      id="top-right"
      type="source"
      :position="Position.Right"
      class="rectangle-handle-interactive"
      data-handleid="top-right"
    />

    <Handle
      id="top-right-target"
      type="target"
      :position="Position.Right"
      class="rectangle-handle-interactive"
      data-handleid="top-right-target"
    />

    <!-- Hidden Central Handles -->
    <Handle id="center-source" type="source" :position="Position.Top" class="center-handle" />
    <Handle id="center-target" type="target" :position="Position.Top" class="center-handle" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { useNodeState, useNodeAnimation } from '../../composables'
import { NodeSizeCalculator, IdGenerator, LRItemUtils } from '../../utils'
import type { NodeData, LRItem } from '../../types'

// 直接使用SVG字符串作为data URI
const arrowIconDataUri =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
      '<path fill="white" d="m11.93 5l2.83 2.83L5 17.59L6.42 19l9.76-9.75L19 12.07V5z"/>' +
      '</svg>',
  )

interface Props extends NodeProps {
  data: NodeData
}

const props = defineProps<Props>()

const nodeRef = ref<HTMLElement>()
const editInputRef = ref<HTMLInputElement>()
const isHovered = ref(false)
const editingItemId = ref<string | null>(null)
const editingText = ref('')
const originalText = ref('')

// 使用组合函数
const nodes = ref([]) // 这里需要从父组件或store获取
const { nodeData, isSelected, updateNodeData } = useNodeState(props.id, nodes)
const { animateNodeSelection } = useNodeAnimation()

// 初始化项目列表
const itemList = computed({
  get: (): LRItem[] => {
    const items = (props.data.items || props.data.pros || []) as LRItem[]
    // 如果没有项目，创建一个默认项目
    if (items.length === 0) {
      const defaultItem = LRItemUtils.create('S', ['E'], 0)
      return [defaultItem]
    }
    return items
  },
  set: (value: LRItem[]) => {
    updateNodeData({ items: value, pros: value })
  },
})

// 检查是否有正在编辑的项目
const hasEditingItem = computed(() => editingItemId.value !== null)

// 计算动态节点大小
const nodeSize = computed(() => {
  const itemCount = itemList.value.length
  return NodeSizeCalculator.calculateRectangleSize(itemCount)
})

// 节点样式
const nodeStyle = computed(() => ({
  '--arrow-icon': `url(${arrowIconDataUri})`,
  width: `${nodeSize.value.width}px`,
  minHeight: `${nodeSize.value.height}px`,
}))

// 节点CSS类
const nodeClasses = computed(() => ({
  'border-blue-500 ring-2 ring-blue-200': isSelected.value && !hasEditingItem.value,
  'border-purple-500 ring-2 ring-purple-200 bg-purple-50': hasEditingItem.value,
  'border-gray-300 hover:border-blue-400': !isSelected.value && !hasEditingItem.value,
}))

// 项目文本CSS类
const itemTextClasses = (item: LRItem) => ({
  'italic opacity-50': !getDisplayText(item),
  'opacity-100': getDisplayText(item),
})

// 获取项目的显示文本
const getDisplayText = (item: LRItem): string => {
  // 如果有自定义文本，优先使用
  if (item.text) {
    return item.text
  }

  // 如果有 production 和 dotPosition，自动生成文本
  if (item.production && typeof item.dotPosition === 'number') {
    return LRItemUtils.getText(item)
  }

  return ''
}

// 处理节点点击事件
const handleNodeClick = (event: MouseEvent) => {
  if (hasEditingItem.value) {
    event.stopPropagation()
    return
  }

  if (isSelected.value) {
    event.stopPropagation()
    addNewItem()
  } else {
    animateNodeSelection(props.id)
  }
}

// 编辑项目
const editItem = async (itemId: string) => {
  const item = itemList.value.find((i) => i.id === itemId)
  if (!item) return

  editingItemId.value = itemId
  const displayText = getDisplayText(item)
  editingText.value = displayText
  originalText.value = displayText

  await nextTick()
  if (editInputRef.value) {
    editInputRef.value.focus()
    editInputRef.value.select()
  }
}

// 完成编辑项目
const finishEditingItem = () => {
  if (editingItemId.value) {
    const newItems = itemList.value.map((item) => {
      if (item.id === editingItemId.value) {
        // 尝试从文本解析 LR 项目
        try {
          if (editingText.value.includes('→') && editingText.value.includes('•')) {
            // 如果包含 LR 项目格式，解析它
            const parsedItem = LRItemUtils.fromString(editingText.value)
            return {
              ...item,
              ...parsedItem,
              text: editingText.value, // 保留原始文本
            }
          } else {
            // 否则只更新文本
            return { ...item, text: editingText.value }
          }
        } catch (error) {
          // 解析失败，只更新文本
          return { ...item, text: editingText.value }
        }
      }
      return item
    })
    itemList.value = newItems
  }

  editingItemId.value = null
  editingText.value = ''
}

// 取消编辑项目
const cancelEditingItem = () => {
  editingText.value = originalText.value
  editingItemId.value = null
  editingText.value = ''
}

// 添加键盘快捷键支持
const handleInputKeydown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault()
    const currentText = editingText.value.trim()
    if (currentText && !currentText.includes('•')) {
      // 自动在第一个符号后添加点
      const arrowIndex = currentText.indexOf('→')
      if (arrowIndex > -1) {
        const left = currentText.substring(0, arrowIndex + 1).trim()
        const right = currentText.substring(arrowIndex + 1).trim()
        editingText.value = `${left} • ${right}`
      }
    }
  }
}

// 添加新项目
const addNewItem = () => {
  // 创建一个新的 LR 项目
  const newItem = LRItemUtils.create('A', ['α'], 0)

  const newItems = [...itemList.value, newItem]
  itemList.value = newItems

  // 立即编辑新项目
  nextTick(() => {
    if (newItem.id) {
      editItem(newItem.id)
    }
  })
}

// 删除项目
const deleteItem = (itemId: string) => {
  if (itemList.value.length <= 1) return // 至少保留一个项目

  const newItems = itemList.value.filter((item) => item.id !== itemId)
  itemList.value = newItems
}
</script>

<style scoped>
/* Hidden Central Handle 样式 */
.center-handle {
  position: absolute !important;
  width: 4px !important;
  height: 4px !important;
  background: transparent !important;
  border: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
}

/* 矩形节点Handle样式 */
.rectangle-handle-interactive {
  position: absolute !important;
  top: 50% !important;
  right: -8px !important;
  transform: translateY(-50%) !important;
  width: 16px !important;
  height: 16px !important;
  background: transparent !important;
  border: none !important;
  pointer-events: auto !important;
}

/* 矩形Handle样式 - 未选中状态 */
:deep(.vue-flow__handle[data-handleid='top-right'])::before,
:deep(.vue-flow__handle[data-handleid='top-right-target'])::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #6b7280;
  border: 2px solid white;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: crosshair;
}

/* 选中状态下的Handle样式 */
.ring-2:deep(.vue-flow__handle[data-handleid='top-right'])::before {
  width: 16px;
  height: 16px;
  background: #374151;
}

/* 选中状态下显示箭头图标 */
.ring-2:deep(.vue-flow__handle[data-handleid='top-right'])::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background-image: var(--arrow-icon);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 1;
}

/* Target Handle 样式 */
:deep(.vue-flow__handle[data-handleid='top-right-target'])::before {
  background: #9ca3af;
}

.ring-2:deep(.vue-flow__handle[data-handleid='top-right-target'])::before {
  width: 16px;
  height: 16px;
  background: #6b7280;
}

.ring-2:deep(.vue-flow__handle[data-handleid='top-right-target'])::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background-image: var(--arrow-icon);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 1;
}

/* Hover效果 */
:deep(.vue-flow__handle[data-handleid='top-right']:hover)::before,
:deep(.vue-flow__handle[data-handleid='top-right-target']:hover)::before {
  transform: translate(-50%, -50%) scale(1.1);
}

/* 输入框选中样式 */
input::selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

input::-moz-selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}
</style>
