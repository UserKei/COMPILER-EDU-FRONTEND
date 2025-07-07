<template>
  <g>
    <!-- Main edge path -->
    <BaseEdge
      :id="id"
      :style="edgeStyle"
      :path="edgePath"
      :marker-end="markerEnd"
      class="stroke-2 fill-none transition-all duration-200"
      :class="{
        'stroke-blue-500': selected,
        'stroke-gray-400': !selected
      }"
    />

    <!-- Label on curve - draggable to control shape, clickable to edit -->
    <EdgeLabelRenderer>
      <div
        ref="labelRef"
        :style="{
          pointerEvents: 'all',
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelPosition.x}px, ${labelPosition.y}px)`,
          zIndex: 1000,
          cursor: isDragging ? 'move' : (isEditing ? 'text' : (selected ? 'pointer' : 'pointer'))
        }"
        class="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium shadow-sm select-none transition-all duration-200"
        :class="{
          'border-blue-500 text-blue-700 shadow-md bg-blue-50': selected && !isEditing,
          'border-purple-500 text-purple-700 shadow-md bg-purple-50': isEditing,
          'text-gray-700 hover:border-gray-400': !selected && !isEditing
        }"
        @mousedown="onLabelMouseDown"
        @click="onLabelClick"
      >
        <div class="relative">
          <input
            v-if="isEditing"
            ref="inputRef"
            v-model="labelText"
            class="text-center bg-transparent border-none outline-none text-xs absolute inset-0 w-full"
            @blur="finishEditing"
            @keyup.enter="finishEditing"
            @keyup.escape="cancelEditing"
            @mousedown.stop
          />
          <span
            :class="{ 'opacity-0': isEditing }"
            class="text-xs"
          >
            {{ labelText || (selected ? 'Click to edit' : 'Label') }}
          </span>
        </div>
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted, nextTick } from 'vue'
import { BaseEdge, EdgeLabelRenderer, useVueFlow, type EdgeProps, type Edge } from '@vue-flow/core'

interface EdgeData {
  label?: string
  controlOffset?: { x: number; y: number } // Offset from default control point
  labelT?: number // Position on curve (0-1), default 0.5
  isEditing?: boolean // 新增：是否处于编辑状态
  [key: string]: any
}

interface Props extends EdgeProps<EdgeData> {
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  markerEnd: 'url(#arrow)'
})

const emit = defineEmits<{
  'update:data': [data: EdgeData]
}>()

const { getSelectedEdges, getNode, getEdges, addSelectedElements, removeSelectedElements } = useVueFlow()

const labelRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const isDragging = ref(false)
const isEditing = ref(false)
const originalText = ref('')

// 更新边数据的函数
const updateEdgeData = (newData: Partial<EdgeData>) => {
  const edges = getEdges.value
  const edgeIndex = edges.findIndex(edge => edge.id === props.id)

  if (edgeIndex !== -1) {
    edges[edgeIndex].data = { ...edges[edgeIndex].data, ...newData }
  }
}

// 标签文本，同步到 data.label
const labelText = computed({
  get: () => props.data?.label || '',
  set: (value: string) => {
    updateEdgeData({ label: value })
  }
})

// 进入编辑模式
const enterEditMode = async () => {
  isEditing.value = true
  originalText.value = labelText.value

  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

// 监听 data.isEditing 变化
watch(() => props.data?.isEditing, (newEditing) => {
  if (newEditing && !isEditing.value) {
    enterEditMode()
  }
}, { immediate: true })

// 完成编辑
const finishEditing = () => {
  isEditing.value = false
  // 清除编辑状态标记
  updateEdgeData({ isEditing: false })
}

// 取消编辑
const cancelEditing = () => {
  labelText.value = originalText.value
  isEditing.value = false
  // 清除编辑状态标记
  updateEdgeData({ isEditing: false })
}

// 处理标签点击 - 实现和节点相同的选中/编辑逻辑
const onLabelClick = (event: MouseEvent) => {
  if (isDragging.value) {
    return // 拖拽状态下不处理点击
  }

  if (isEditing.value) {
    event.stopPropagation()
    return // 编辑状态下阻止所有点击事件
  }

  // 阻止事件冒泡，我们手动处理选中逻辑
  event.stopPropagation()

  // 如果边已经被选中，再次点击进入编辑模式
  if (props.selected) {
    enterEditMode()
  } else {
    // 如果边未被选中，手动选中它
    const currentEdge = getEdges.value.find(edge => edge.id === props.id)
    if (currentEdge) {
      // 清除其他选中的元素，只选中当前边
      removeSelectedElements()
      addSelectedElements([currentEdge])
    }
  }
}

// 组件销毁时清理拖拽事件监听器
onUnmounted(() => {
  if (isDragging.value) {
    isDragging.value = false
    document.removeEventListener('mousemove', () => {})
    document.removeEventListener('mouseup', () => {})
  }
})

// Get node dimensions and type (简化版本，只用于自环)
const getNodeInfo = (nodeId: string) => {
  const node = getNode.value(nodeId)
  if (!node) return { type: 'rectangle', width: 92, height: 60, radius: 46 }

  switch (node.type) {
    case 'circle':
      return {
        type: 'circle',
        width: 92,
        height: 92,
        radius: 46
      }
    case 'rectangle':
    case 'custom':
    default:
      return {
        type: 'rectangle',
        width: 92,
        height: 60,
        radius: 0
      }
  }
}

// Check if this edge is selected
const selected = computed(() => {
  const selectedEdges = getSelectedEdges.value
  return selectedEdges.some(edge => edge.id === props.id)
})

// Calculate start point on the edge of source node
const startPoint = computed(() => {
  // For self-loops, create specific start point
  if (props.source === props.target) {
    const sourceNode = getNodeInfo(props.source)
    if (sourceNode.type === 'circle') {
      // Start at top-right of circle
      const angle = -Math.PI / 4 // -45 degrees
      return {
        x: props.sourceX + sourceNode.radius * Math.cos(angle),
        y: props.sourceY + sourceNode.radius * Math.sin(angle)
      }
    } else {
      // Start at right edge of rectangle
      return {
        x: props.sourceX + sourceNode.width / 2,
        y: props.sourceY - 10 // Slightly above center
      }
    }
  }

  // Regular edge: 直接连接到节点中心，让节点遮挡进入的部分
  return {
    x: props.sourceX,
    y: props.sourceY
  }
})

// Calculate end point on the edge of target node
const endPoint = computed(() => {
  // For self-loops, create specific end point
  if (props.source === props.target) {
    const targetNode = getNodeInfo(props.target)
    if (targetNode.type === 'circle') {
      // End at bottom-right of circle
      const angle = Math.PI / 4 // 45 degrees
      return {
        x: props.targetX + targetNode.radius * Math.cos(angle),
        y: props.targetY + targetNode.radius * Math.sin(angle)
      }
    } else {
      // End at right edge of rectangle
      return {
        x: props.targetX + targetNode.width / 2,
        y: props.targetY + 10 // Slightly below center
      }
    }
  }

  // Regular edge: 直接连接到节点中心，让节点遮挡进入的部分
  return {
    x: props.targetX,
    y: props.targetY
  }
})

// Default control point (before any user adjustment)
const defaultControlPoint = computed(() => {
  // For self-loops, create a proper circular arc
  if (props.source === props.target) {
    const nodeInfo = getNodeInfo(props.source)
    const loopRadius = nodeInfo.type === 'circle' ? 80 : 70

    // Position control point to create a nice loop
    return {
      x: props.sourceX + loopRadius,
      y: props.sourceY
    }
  }

  const midX = (startPoint.value.x + endPoint.value.x) / 2
  const midY = (startPoint.value.y + endPoint.value.y) / 2

  // Calculate perpendicular offset for nice curve
  const dx = endPoint.value.x - startPoint.value.x
  const dy = endPoint.value.y - startPoint.value.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) {
    return { x: midX, y: midY }
  }

  // Perpendicular vector
  const perpX = -dy / distance
  const perpY = dx / distance
  const offset = Math.min(30, distance * 0.2) // Adaptive offset

  return {
    x: midX + perpX * offset,
    y: midY + perpY * offset
  }
})

// Control point offset from default position (reactive)
const controlOffset = ref({ x: 0, y: 0 })

// 监听边ID变化，重置控制点偏移
watch(
  () => props.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      // 边ID变化时，重置控制点偏移
      controlOffset.value = props.data?.controlOffset || { x: 0, y: 0 }
      console.log(`Edge ID changed from ${oldId} to ${newId}, reset control offset`)
    }
  },
  { immediate: true }
)

// 监听完整的边数据变化
watch(
  () => props.data,
  (newData) => {
    if (!isDragging.value) {
      // 完全重置本地状态以匹配新数据
      controlOffset.value = newData?.controlOffset ? { ...newData.controlOffset } : { x: 0, y: 0 }
    }
  },
  { deep: true, immediate: true }
)

// Actual control point (default + user offset)
const controlPoint = computed(() => {
  const defaultControl = defaultControlPoint.value
  const offset = controlOffset.value

  return {
    x: defaultControl.x + offset.x,
    y: defaultControl.y + offset.y
  }
})

// Calculate point on quadratic bezier curve at parameter t (0-1)
const getPointOnCurve = (t: number) => {
  const start = startPoint.value
  const end = endPoint.value
  const control = controlPoint.value

  // Quadratic bezier formula: (1-t)²P0 + 2(1-t)tP1 + t²P2
  const oneMinusT = 1 - t
  const oneMinusTSquared = oneMinusT * oneMinusT
  const tSquared = t * t
  const twoOneMinusTt = 2 * oneMinusT * t

  return {
    x: oneMinusTSquared * start.x + twoOneMinusTt * control.x + tSquared * end.x,
    y: oneMinusTSquared * start.y + twoOneMinusTt * control.y + tSquared * end.y
  }
}

// Label position on curve (at parameter t, default 0.5 = middle) - 基于中心计算
const labelPosition = computed(() => {
  const sourceNode = getNode.value(props.source)
  const targetNode = getNode.value(props.target)

  if (!sourceNode || !targetNode) {
    // 降级处理
    const t = props.data?.labelT || 0.5
    return getPointOnCurve(t)
  }

  // 计算节点中心位置
  const sourceRect = sourceNode.computedPosition || sourceNode.position
  const targetRect = targetNode.computedPosition || targetNode.position

  const sourceSize = sourceNode.dimensions || { width: 96, height: 64 }
  const targetSize = targetNode.dimensions || { width: 96, height: 64 }

  const sourceCenterX = sourceRect.x + sourceSize.width / 2
  const sourceCenterY = sourceRect.y + sourceSize.height / 2
  const targetCenterX = targetRect.x + targetSize.width / 2
  const targetCenterY = targetRect.y + targetSize.height / 2

  // 计算控制点
  let controlX = (sourceCenterX + targetCenterX) / 2
  let controlY = (sourceCenterY + targetCenterY) / 2

  const offset = controlOffset.value
  if (offset) {
    controlX += offset.x
    controlY += offset.y
  }

  // 在曲线上的位置（t=0.5为中点）
  const t = props.data?.labelT || 0.5
  const x = (1 - t) * (1 - t) * sourceCenterX + 2 * (1 - t) * t * controlX + t * t * targetCenterX
  const y = (1 - t) * (1 - t) * sourceCenterY + 2 * (1 - t) * t * controlY + t * t * targetCenterY

  return { x, y }
})

// Quadratic bezier path using control point - 强制从节点中心绘制
const edgePath = computed(() => {
  // 获取源和目标节点
  const sourceNode = getNode.value(props.source)
  const targetNode = getNode.value(props.target)

  if (!sourceNode || !targetNode) {
    // 降级处理，使用原始位置
    const start = startPoint.value
    const end = endPoint.value
    const control = controlPoint.value
    return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`
  }

  // 计算节点中心位置
  const sourceRect = sourceNode.computedPosition || sourceNode.position
  const targetRect = targetNode.computedPosition || targetNode.position

  const sourceSize = sourceNode.dimensions || { width: 96, height: 64 }
  const targetSize = targetNode.dimensions || { width: 96, height: 64 }

  const sourceCenterX = sourceRect.x + sourceSize.width / 2
  const sourceCenterY = sourceRect.y + sourceSize.height / 2
  const targetCenterX = targetRect.x + targetSize.width / 2
  const targetCenterY = targetRect.y + targetSize.height / 2

  // 计算控制点（中点 + 偏移）
  let controlX = (sourceCenterX + targetCenterX) / 2
  let controlY = (sourceCenterY + targetCenterY) / 2

  // 应用用户自定义偏移
  const offset = controlOffset.value
  if (offset) {
    controlX += offset.x
    controlY += offset.y
  }

  // 对于自环，特殊处理
  if (props.source === props.target) {
    const nodeInfo = getNodeInfo(props.source)
    if (nodeInfo.type === 'circle') {
      // 圆形自环
      const radius = nodeInfo.radius
      const startAngle = -Math.PI / 4
      const endAngle = Math.PI / 4

      const startX = sourceCenterX + radius * Math.cos(startAngle)
      const startY = sourceCenterY + radius * Math.sin(startAngle)
      const endX = sourceCenterX + radius * Math.cos(endAngle)
      const endY = sourceCenterY + radius * Math.sin(endAngle)

      // 控制点在外侧
      const controlX = sourceCenterX + radius * 2
      const controlY = sourceCenterY

      return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
    } else {
      // 矩形自环
      const halfWidth = nodeInfo.width / 2
      const halfHeight = nodeInfo.height / 2

      const startX = sourceCenterX + halfWidth
      const startY = sourceCenterY - halfHeight / 2
      const endX = sourceCenterX + halfWidth
      const endY = sourceCenterY + halfHeight / 2

      // 控制点在右侧外面
      const controlX = sourceCenterX + halfWidth + 60
      const controlY = sourceCenterY

      return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
    }
  }

  // 普通连线，从中心到中心
  return `M ${sourceCenterX} ${sourceCenterY} Q ${controlX} ${controlY} ${targetCenterX} ${targetCenterY}`
})

// Edge style
const edgeStyle = computed(() => ({
  strokeWidth: selected.value ? 3 : 2,
}))

// Drag functionality
const onLabelMouseDown = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true

  const startX = event.clientX
  const startY = event.clientY
  const initialOffset = { ...controlOffset.value }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    // Update control point offset directly
    controlOffset.value = {
      x: initialOffset.x + deltaX,
      y: initialOffset.y + deltaY
    }
  }

  const onMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)

    // Persist to edge data when drag ends
    const newData = {
      controlOffset: { ...controlOffset.value }
    }
    updateEdgeData(newData)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>
