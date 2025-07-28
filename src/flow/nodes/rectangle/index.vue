<template>
  <BaseNode
    v-bind="props"
    node-shape="rectangle"
    :handles="rectangleHandles"
    :size="nodeSize"
    @node-click="handleNodeClick"
    @editing-start="onEditingStart"
    @editing-end="onEditingEnd"
  >
    <template #default="{ isEditing, nodeText }">
      <div class="p-3">
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
              v-if="itemList.length > 1"
              class="opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 text-red-500 hover:text-red-700 text-xs font-bold w-4 h-4 flex items-center justify-center"
              @click.stop="removeItem(item.id!)"
              title="Delete item"
            >
              ×
            </button>
          </div>

          <!-- Add New Item Button -->
          <button
            v-if="!hasEditingItem"
            class="flex items-center justify-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-150 border border-dashed border-blue-300 hover:border-blue-400"
            @click.stop="addNewItem"
          >
            <span class="text-sm font-bold">+</span>
            Add Item
          </button>
        </div>
      </div>
    </template>
  </BaseNode>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Position, type NodeProps } from '@vue-flow/core'
import BaseNode from '../base/index.vue'
import { NodeSizeCalculator, LRItemUtils } from '../../utils'
import type { NodeData, LRItem } from '../../types'

interface Props extends NodeProps {
  data: NodeData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:data': [data: NodeData]
  'node-click': [event: MouseEvent]
}>()

const editInputRef = ref<HTMLInputElement>()
const editingItemId = ref<string | null>(null)
const editingText = ref('')
const originalText = ref('')

// 矩形节点的特定handles配置
const rectangleHandles = [
  {
    id: 'top-right',
    type: 'source' as const,
    position: Position.Right,
    class: 'rectangle-handle-interactive',
  },
  {
    id: 'top-right-target',
    type: 'target' as const,
    position: Position.Right,
    class: 'rectangle-handle-interactive',
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
    const updatedData = { ...props.data, items: value, pros: value }
    emit('update:data', updatedData)
  },
})

// 检查是否有正在编辑的项目
const hasEditingItem = computed(() => editingItemId.value !== null)

// 计算动态节点大小
const nodeSize = computed(() => {
  const itemCount = itemList.value.length
  return NodeSizeCalculator.calculateRectangleSize(itemCount)
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

// 项目文本CSS类
const itemTextClasses = (item: LRItem) => ({
  'italic opacity-50': !getDisplayText(item),
  'font-mono': item.production && typeof item.dotPosition === 'number',
})

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
  const newItem = LRItemUtils.create('S', [], 0)
  const newItems = [...itemList.value, newItem]
  itemList.value = newItems

  // 立即开始编辑新项目
  nextTick(() => {
    if (newItem.id) {
      editItem(newItem.id)
    }
  })
}

// 删除项目
const removeItem = (itemId: string) => {
  const newItems = itemList.value.filter((item) => item.id !== itemId)
  if (newItems.length > 0) {
    itemList.value = newItems
  }
}

// 处理节点点击
const handleNodeClick = (event: MouseEvent) => {
  emit('node-click', event)
}

// 编辑开始
const onEditingStart = () => {
  // 矩形节点不使用整体编辑模式，由单个项目管理编辑状态
}

// 编辑结束
const onEditingEnd = (text: string) => {
  // 矩形节点不使用整体编辑模式
}
</script>

<style scoped>
/* 矩形节点特有样式 */
.handle-interactive {
  opacity: 0.6;
  transition: opacity 200ms;
}

.handle-interactive:hover {
  opacity: 1;
}

/* 矩形节点的Handle样式继承base组件的通用样式 */
</style>
