<template>
  <div
    ref="nodeRef"
    class="
      bg-white border-2 rounded-lg p-3
      transition-all duration-200
      relative cursor-default group
      hover:shadow-lg
    "
    :class="{
      'border-blue-500 ring-2 ring-blue-200': isSelected && !hasEditingItem,
      'border-purple-500 ring-2 ring-purple-200 bg-purple-50': hasEditingItem,
      'border-gray-300 hover:border-blue-400': !isSelected && !hasEditingItem
    }"
    @click="handleNodeClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Node Title (可选) -->
    <div v-if="nodeData.title" class="text-center text-xs font-semibold text-gray-600 mb-2 border-b border-gray-200 pb-1">
      {{ nodeData.title }}
    </div>

    <!-- LR Items Container -->
    <div class="flex flex-col gap-1">
      <div
        v-for="(item, index) in itemList"
        :key="item.id"
        class="
          flex items-center gap-2 min-h-6 px-2 py-1
          rounded transition-colors duration-150
          hover:bg-gray-50 group/item
        "
        @click.stop="editItem(item.id)"
      >
        <!-- Item Content -->
        <div class="flex-1 min-w-0">
          <input
            v-if="editingItemId === item.id"
            ref="editInputRef"
            v-model="editingText"
            class="
              w-full bg-transparent border-none outline-none
              text-xs text-gray-700 cursor-text font-normal
              placeholder-gray-400
            "
            placeholder="Enter LR item..."
            @blur="finishEditingItem"
            @keyup.enter="finishEditingItem"
            @keyup.escape="cancelEditingItem"
          />
          <span
            v-else
            class="
              text-xs text-gray-700 cursor-text
              block truncate
            "
            :class="{
              'italic opacity-50': !item.text,
              'opacity-100': item.text
            }"
          >
            {{ item.text || 'Click to edit...' }}
          </span>
        </div>

        <!-- Delete Button (hover时显示) -->
        <button
          v-if="itemList.length > 1 && editingItemId !== item.id"
          @click.stop="deleteItem(item.id)"
          class="
            opacity-0 group-hover/item:opacity-100
            w-4 h-4 rounded-full
            bg-red-100 hover:bg-red-200
            text-red-600 text-xs
            flex items-center justify-center
            transition-all duration-150
          "
        >
          ×
        </button>
      </div>
    </div>

    <!-- Add Button (节点悬停时显示) -->
    <button
      v-if="isHovered"
      @click.stop="addNewItem"
      class="
        w-full mt-2 py-1
        border border-dashed border-gray-300
        rounded text-xs text-gray-500
        hover:border-blue-400 hover:text-blue-600
        hover:bg-blue-50
        transition-all duration-150
        flex items-center justify-center gap-1
      "
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
    <Handle
      id="center-source"
      type="source"
      :position="Position.Top"
      class="center-handle"
    />
    <Handle
      id="center-target"
      type="target"
      :position="Position.Top"
      class="center-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Handle, Position, useVueFlow, type NodeProps } from '@vue-flow/core'

const arrowIconDataUri = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="white" d="m11.93 5l2.83 2.83L5 17.59L6.42 19l9.76-9.75L19 12.07V5z"/></svg>')

interface LRItem {
  id: string
  text: string
}

interface NodeData {
  title?: string
  items?: LRItem[]
  [key: string]: any
}

interface Props extends NodeProps {
  data: NodeData
}

const props = defineProps<Props>()

const { getSelectedNodes, updateNode } = useVueFlow()

const nodeRef = ref<HTMLElement>()
const editInputRef = ref<HTMLInputElement>()
const isHovered = ref(false)
const editingItemId = ref<string | null>(null)
const editingText = ref('')
const originalText = ref('')

// 初始化项目列表
const nodeData = computed(() => props.data)

const itemList = computed({
  get: () => {
    const items = nodeData.value.items || []
    // 如果没有项目，创建一个默认项目
    if (items.length === 0) {
      return [{ id: generateId(), text: '' }]
    }
    return items
  },
  set: (value: LRItem[]) => {
    updateNode(props.id, {
      data: { ...props.data, items: value }
    })
  }
})

// 检查是否有正在编辑的项目
const hasEditingItem = computed(() => editingItemId.value !== null)

// 检查节点是否被选中
const isSelected = computed(() => {
  const selectedNodes = getSelectedNodes.value
  return selectedNodes.some(node => node.id === props.id)
})

// 生成唯一ID
const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// 计算动态宽度
const dynamicWidth = computed(() => {
  const items = itemList.value
  const title = nodeData.value.title || ''

  // 找到最长的文本
  let maxLength = title.length
  items.forEach(item => {
    if (item.text) {
      maxLength = Math.max(maxLength, item.text.length)
    }
  })

  // 基础宽度计算，考虑最小宽度和最大宽度
  const baseWidth = 120
  const charWidth = 8
  const padding = 40

  const calculatedWidth = Math.max(baseWidth, Math.min(300, maxLength * charWidth + padding))
  return calculatedWidth + 'px'
})

// 计算动态高度
const dynamicHeight = computed(() => {
  const items = itemList.value
  const titleHeight = nodeData.value.title ? 30 : 0
  const itemHeight = 28 // 每个项目的高度
  const padding = 24 // 上下内边距
  const addButtonHeight = isHovered.value ? 32 : 0 // 悬停时就显示添加按钮

  return titleHeight + (items.length * itemHeight) + padding + addButtonHeight + 'px'
})

// 处理节点点击
const handleNodeClick = (event: MouseEvent) => {
  if (hasEditingItem.value) {
    event.stopPropagation()
    return
  }

  // 如果节点已选中且只有一个空项目，直接编辑
  if (isSelected.value && itemList.value.length === 1 && !itemList.value[0].text) {
    event.stopPropagation()
    editItem(itemList.value[0].id)
  }
}

// 添加新项目
const addNewItem = () => {
  const newItem: LRItem = {
    id: generateId(),
    text: ''
  }

  const updatedItems = [...itemList.value, newItem]
  itemList.value = updatedItems

  // 立即编辑新项目
  nextTick(() => {
    editItem(newItem.id)
  })
}

// 编辑项目
const editItem = async (itemId: string) => {
  const item = itemList.value.find(i => i.id === itemId)
  if (!item) return

  editingItemId.value = itemId
  editingText.value = item.text
  originalText.value = item.text

  await nextTick()
  if (editInputRef.value) {
    editInputRef.value.focus()
    editInputRef.value.select()
  }
}

// 完成编辑项目
const finishEditingItem = () => {
  if (editingItemId.value) {
    const itemIndex = itemList.value.findIndex(i => i.id === editingItemId.value)
    if (itemIndex !== -1) {
      const updatedItems = [...itemList.value]
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        text: editingText.value.trim()
      }
      itemList.value = updatedItems
    }
  }

  editingItemId.value = null
  editingText.value = ''
  originalText.value = ''
}

// 取消编辑项目
const cancelEditingItem = () => {
  editingText.value = originalText.value
  editingItemId.value = null
  originalText.value = ''
}

// 删除项目
const deleteItem = (itemId: string) => {
  if (itemList.value.length <= 1) return // 至少保留一个项目

  const updatedItems = itemList.value.filter(i => i.id !== itemId)
  itemList.value = updatedItems
}

// 监听选中状态变化
watch(isSelected, (newSelected) => {
  if (!newSelected && hasEditingItem.value) {
    finishEditingItem()
  }
})

// 监听编辑状态变化，更新输入框引用
watch(editingItemId, async () => {
  if (editingItemId.value) {
    await nextTick()
    if (editInputRef.value) {
      editInputRef.value.focus()
      editInputRef.value.select()
    }
  }
})
</script>

<style scoped>
/* 节点容器动态样式 */
.bg-white {
  width: v-bind(dynamicWidth);
  height: v-bind(dynamicHeight);
  --arrow-icon: v-bind('`url(${arrowIconDataUri})`');
}

/* Handle 样式继承原有设计 */
.rectangle-handle-interactive {
  position: absolute !important;
  top: -8px !important;
  right: -8px !important;
  background: transparent !important;
  border: none !important;
  width: 16px !important;
  height: 16px !important;
  pointer-events: auto !important;
  transform: translate(0%, 0%) !important;
}

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

/* 输入框样式 - 更精确的字体继承 */
input {
  font: inherit !important;
  font-size: 0.75rem !important; /* 明确设置为 text-xs */
  font-weight: normal !important;
  line-height: 1rem !important;
  letter-spacing: inherit !important;
}

/* Placeholder 样式 - 确保字体一致 */
input::placeholder {
  font: inherit !important;
  font-size: 0.75rem !important;
  font-weight: normal !important;
  color: rgb(156, 163, 175) !important; /* text-gray-400 */
  opacity: 1 !important;
}

input::-webkit-input-placeholder {
  font: inherit !important;
  font-size: 0.75rem !important;
  font-weight: normal !important;
  color: rgb(156, 163, 175) !important;
  opacity: 1 !important;
}

input::-moz-placeholder {
  font: inherit !important;
  font-size: 0.75rem !important;
  font-weight: normal !important;
  color: rgb(156, 163, 175) !important;
  opacity: 1 !important;
}

input:-ms-input-placeholder {
  font: inherit !important;
  font-size: 0.75rem !important;
  font-weight: normal !important;
  color: rgb(156, 163, 175) !important;
  opacity: 1 !important;
}

input::selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

input::-moz-selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

/* Handle 样式 */
:deep(.vue-flow__handle[data-handleid="top-right"])::before,
:deep(.vue-flow__handle[data-handleid="top-right-target"])::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #6b7280;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: crosshair;
}

.ring-2:deep(.vue-flow__handle[data-handleid="top-right"])::before {
  width: 16px;
  height: 16px;
  background: #374151;
}

.ring-2:deep(.vue-flow__handle[data-handleid="top-right"])::after {
  content: "";
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

:deep(.vue-flow__handle[data-handleid="top-right-target"])::before {
  background: #9ca3af;
}

.ring-2:deep(.vue-flow__handle[data-handleid="top-right-target"])::before {
  width: 16px;
  height: 16px;
  background: #6b7280;
}

.ring-2:deep(.vue-flow__handle[data-handleid="top-right-target"])::after {
  content: "";
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

:deep(.vue-flow__handle[data-handleid="top-right"]:hover)::before,
:deep(.vue-flow__handle[data-handleid="top-right-target"]:hover)::before {
  transform: translate(-50%, -50%) scale(1.1);
}
</style>
