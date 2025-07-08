<template>
  <g>
    <!-- Main edge path -->
    <BaseEdge
      :id="id"
      :style="edgeStyle"
      :path="edgePath"
      :marker-end="markerEnd"
      class="
        stroke-2 fill-none
        transition-all duration-200
      "
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
          transform: `translate(-50%, -50%) translate(${labelPosition.x}px, ${labelPosition.y}px)`,
          cursor: isDragging ? 'move' : (isEditing ? 'text' : 'pointer')
        }"
        class="
          edge-label
          px-2 py-1
          bg-white border border-gray-300 rounded
          text-xs font-medium
          shadow-sm select-none
          transition-all duration-200
        "
        :class="{
          'border-blue-500 text-blue-700 shadow-md bg-blue-50': selected && !isEditing,
          'border-purple-500 text-purple-700 shadow-md bg-purple-50': isEditing,
          'text-gray-700 hover:border-gray-400': !selected && !isEditing
        }"
        @mousedown="onLabelMouseDown"
        @click="onLabelClick"
      >
        <div class="relative w-8">
          <input
            v-if="isEditing"
            ref="inputRef"
            v-model="labelText"
            class="
              text-center bg-transparent
              border-none outline-none
              w-8 h-4 text-xs
            "
            @blur="finishEditing"
            @keyup.enter="finishEditing"
            @keyup.escape="cancelEditing"
            @mousedown.stop
          />
          <span
            v-if="!isEditing"
            :class="{
              'text-gray-500 italic opacity-50': !labelText, // 占位符样式，和node保持一致
              'text-gray-700 opacity-100': labelText // 有内容时的正常样式
            }"
            class="
              text-xs text-center
              block w-8 h-4 leading-4
              truncate
            "
          >
            {{ labelText || 'Click' }}
          </span>
        </div>
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted, onMounted, nextTick } from 'vue'
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

// 组件初始化时的调试信息
console.log(`Edge ${props.id} component initialized with data:`, props.data)
console.log(`Initial isEditing state:`, props.data?.isEditing)

const labelRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const isDragging = ref(false)
const isEditing = ref(false)
const originalText = ref('')

// 组件唯一标识符，用于防止状态污染
const componentId = ref(`edge-${props.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`)

// 更新边数据的函数 - 使用更安全的方式避免影响其他边
const updateEdgeData = (newData: Partial<EdgeData>) => {
  const edges = getEdges.value
  const edgeIndex = edges.findIndex(edge => edge.id === props.id)

  if (edgeIndex !== -1) {
    // 只更新当前边的数据，避免创建新的引用影响其他边
    const currentEdge = edges[edgeIndex]
    Object.assign(currentEdge.data, newData)
    console.log(`Updated edge ${props.id} data:`, newData)
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
  if (isEditing.value) {
    console.log(`Edge ${props.id} already in edit mode, skipping`)
    return // 如果已经在编辑模式，不要重复进入
  }

  console.log(`Edge ${props.id} entering edit mode`)
  isEditing.value = true
  originalText.value = labelText.value

  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

// 监听 data.isEditing 变化，但只对当前边生效
watch(() => props.data?.isEditing, (newEditing, oldEditing) => {
  console.log(`Edge ${props.id} (${componentId.value}) watch data.isEditing: ${oldEditing} -> ${newEditing}, local isEditing: ${isEditing.value}`)

  // 简化条件：如果 data.isEditing 为 true 且本地不在编辑状态，就进入编辑
  if (newEditing === true && !isEditing.value) {
    console.log(`Edge ${props.id} (${componentId.value}) will enter edit mode`)
    enterEditMode()
  } else if (newEditing === false && isEditing.value) {
    // 如果外部强制设置为 false，也要响应
    console.log(`Edge ${props.id} (${componentId.value}) forced to exit edit mode`)
    isEditing.value = false
  }
}, { immediate: true }) // 改为 immediate: true，确保初始化时也会检查

// 监听本地编辑状态，清理 data.isEditing 标记
watch(isEditing, (newEditing) => {
  if (!newEditing && props.data?.isEditing) {
    // 当本地编辑状态变为 false 时，清除 data 中的 isEditing 标记
    console.log(`Edge ${props.id} clearing isEditing flag`)
    updateEdgeData({ isEditing: false })
  }
})

// 完成编辑
const finishEditing = () => {
  isEditing.value = false
  // isEditing 的清理现在由 watch 处理
}

// 取消编辑
const cancelEditing = () => {
  labelText.value = originalText.value
  isEditing.value = false
  // isEditing 的清理现在由 watch 处理
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

// 组件销毁时清理拖拽事件监听器和编辑状态
onUnmounted(() => {
  console.log(`Edge ${props.id} (${componentId.value}) component unmounting`)

  // 清理拖拽状态
  if (isDragging.value) {
    isDragging.value = false
    document.removeEventListener('mousemove', () => {})
    document.removeEventListener('mouseup', () => {})
  }

  // 清理编辑状态
  if (isEditing.value) {
    isEditing.value = false
  }
})

// 组件挂载后检查是否需要进入编辑模式
onMounted(() => {
  console.log(`Edge ${props.id} mounted. Data:`, props.data)
  console.log(`Should enter edit mode:`, props.data?.isEditing)

  // 如果数据指示应该编辑，但本地状态不是编辑状态，则进入编辑
  if (props.data?.isEditing === true && !isEditing.value) {
    console.log(`Edge ${props.id} entering edit mode on mount`)
    nextTick(() => {
      enterEditMode()
    })
  }
})

// Get node dimensions and type
const getNodeInfo = (nodeId: string) => {
  const node = getNode.value(nodeId)
  if (!node) return { type: 'rectangle', width: 96, height: 64, radius: 45 }

  // 获取实际节点尺寸
  const actualSize = node.dimensions || { width: 96, height: 64 }

  switch (node.type) {
    case 'circle':
      // 圆形节点：使用实际尺寸或计算的尺寸
      const circleSize = node.data?.size || Math.max(actualSize.width, actualSize.height)
      return {
        type: 'circle',
        width: circleSize,
        height: circleSize,
        radius: circleSize / 2
      }
    case 'rectangle':
    case 'custom':
    default:
      // 矩形节点：使用实际尺寸
      return {
        type: 'rectangle',
        width: actualSize.width,
        height: actualSize.height,
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
    if (newId !== oldId && oldId !== undefined) {
      // 只有当oldId不是undefined时才重置（避免组件初始化时的重置）
      controlOffset.value = props.data?.controlOffset || { x: 0, y: 0 }
      // 不重置编辑状态，让其他逻辑处理
      componentId.value = `edge-${newId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      console.log(`Edge ID changed from ${oldId} to ${newId}, reset control offset only`)
    } else if (oldId === undefined) {
      // 初始化时只更新componentId和controlOffset，不影响编辑状态
      controlOffset.value = props.data?.controlOffset || { x: 0, y: 0 }
      componentId.value = `edge-${newId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      console.log(`Edge ID initialized to ${newId}`)
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
  const targetCenterY = targetRect.y + targetSize.height / 2  // 对于自环，特殊处理 label 位置
  if (props.source === props.target) {
    const nodeInfo = getNodeInfo(props.source)
    const offset = controlOffset.value

    if (nodeInfo.type === 'circle') {
      // 圆形自环：label 在右侧弧线中点
      const radius = nodeInfo.radius
      const baseControlX = sourceCenterX + radius * 2
      const baseControlY = sourceCenterY

      // 应用用户偏移 - 与 edgePath 保持一致
      const controlX = baseControlX + (offset?.x || 0)
      const controlY = baseControlY + (offset?.y || 0)

      // 在自环弧线的中点位置
      const t = props.data?.labelT || 0.5
      const startAngle = -Math.PI / 4
      const endAngle = Math.PI / 4

      const startX = sourceCenterX + radius * Math.cos(startAngle)
      const startY = sourceCenterY + radius * Math.sin(startAngle)
      const endX = sourceCenterX + radius * Math.cos(endAngle)
      const endY = sourceCenterY + radius * Math.sin(endAngle)

      // 二次贝塞尔曲线上的点
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY

      return { x, y }
    } else {
      // 矩形自环：label 在右侧弧线中点
      const halfWidth = nodeInfo.width / 2
      const halfHeight = nodeInfo.height / 2

      const baseControlX = sourceCenterX + halfWidth + 60
      const baseControlY = sourceCenterY

      // 应用用户偏移 - 与 edgePath 保持一致
      const controlX = baseControlX + (offset?.x || 0)
      const controlY = baseControlY + (offset?.y || 0)

      const startX = sourceCenterX + halfWidth
      const startY = sourceCenterY - halfHeight / 2
      const endX = sourceCenterX + halfWidth
      const endY = sourceCenterY + halfHeight / 2

      // 在自环弧线的中点位置
      const t = props.data?.labelT || 0.5
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY

      return { x, y }
    }
  }

  // 普通边的 label 位置计算
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

// Quadratic bezier path using control point - 连接到节点边缘
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
      // 圆形自环 - 连接到圆周边缘
      const radius = nodeInfo.radius
      const startAngle = -Math.PI / 4
      const endAngle = Math.PI / 4

      const startX = sourceCenterX + radius * Math.cos(startAngle)
      const startY = sourceCenterY + radius * Math.sin(startAngle)
      const endX = sourceCenterX + radius * Math.cos(endAngle)
      const endY = sourceCenterY + radius * Math.sin(endAngle)

      // 控制点在外侧，应用用户偏移
      const baseControlX = sourceCenterX + radius * 2
      const baseControlY = sourceCenterY
      const finalControlX = baseControlX + (offset?.x || 0)
      const finalControlY = baseControlY + (offset?.y || 0)

      return `M ${startX} ${startY} Q ${finalControlX} ${finalControlY} ${endX} ${endY}`
    } else {
      // 矩形自环 - 连接到矩形边缘
      const halfWidth = nodeInfo.width / 2
      const halfHeight = nodeInfo.height / 2

      const startX = sourceCenterX + halfWidth
      const startY = sourceCenterY - halfHeight / 2
      const endX = sourceCenterX + halfWidth
      const endY = sourceCenterY + halfHeight / 2

      // 控制点在右侧外面，应用用户偏移
      const baseControlX = sourceCenterX + halfWidth + 60
      const baseControlY = sourceCenterY
      const finalControlX = baseControlX + (offset?.x || 0)
      const finalControlY = baseControlY + (offset?.y || 0)

      return `M ${startX} ${startY} Q ${finalControlX} ${finalControlY} ${endX} ${endY}`
    }
  }

  // 普通连线 - 计算连接到节点边缘的点
  const sourceInfo = getNodeInfo(props.source)
  const targetInfo = getNodeInfo(props.target)

  // 计算从中心到中心的方向向量
  const dx = targetCenterX - sourceCenterX
  const dy = targetCenterY - sourceCenterY
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) {
    // 如果两个节点重合，使用中心点
    return `M ${sourceCenterX} ${sourceCenterY} Q ${controlX} ${controlY} ${targetCenterX} ${targetCenterY}`
  }

  // 单位方向向量
  const unitX = dx / distance
  const unitY = dy / distance

  // 计算源节点边缘点
  let sourceEdgeX, sourceEdgeY
  if (sourceInfo.type === 'circle') {
    // 圆形节点：从中心向目标方向的半径距离
    sourceEdgeX = sourceCenterX + unitX * sourceInfo.radius
    sourceEdgeY = sourceCenterY + unitY * sourceInfo.radius
  } else {
    // 矩形节点：计算与矩形边界的交点
    const halfWidth = sourceInfo.width / 2
    const halfHeight = sourceInfo.height / 2

    // 使用射线与矩形边界的交点算法
    const absDx = Math.abs(unitX)
    const absDy = Math.abs(unitY)

    if (halfHeight * absDx > halfWidth * absDy) {
      // 交点在左右边
      sourceEdgeX = sourceCenterX + Math.sign(unitX) * halfWidth
      sourceEdgeY = sourceCenterY + (unitY / absDx) * halfWidth
    } else {
      // 交点在上下边
      sourceEdgeX = sourceCenterX + (unitX / absDy) * halfHeight
      sourceEdgeY = sourceCenterY + Math.sign(unitY) * halfHeight
    }
  }

  // 计算目标节点边缘点（方向相反）
  let targetEdgeX, targetEdgeY
  if (targetInfo.type === 'circle') {
    // 圆形节点：从中心向源方向的反向半径距离
    targetEdgeX = targetCenterX - unitX * targetInfo.radius
    targetEdgeY = targetCenterY - unitY * targetInfo.radius
  } else {
    // 矩形节点：计算与矩形边界的交点
    const halfWidth = targetInfo.width / 2
    const halfHeight = targetInfo.height / 2

    const absDx = Math.abs(unitX)
    const absDy = Math.abs(unitY)

    if (halfHeight * absDx > halfWidth * absDy) {
      // 交点在左右边
      targetEdgeX = targetCenterX - Math.sign(unitX) * halfWidth
      targetEdgeY = targetCenterY - (unitY / absDx) * halfWidth
    } else {
      // 交点在上下边
      targetEdgeX = targetCenterX - (unitX / absDy) * halfHeight
      targetEdgeY = targetCenterY - Math.sign(unitY) * halfHeight
    }
  }

  // 从边缘到边缘的连线
  return `M ${sourceEdgeX} ${sourceEdgeY} Q ${controlX} ${controlY} ${targetEdgeX} ${targetEdgeY}`
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

// 组件初始化时的调试信息
console.log(`Edge ${props.id} component initialized with data:`, props.data)
console.log(`Initial isEditing state:`, props.data?.isEditing)
</script>

<style scoped>
.edge-label {
  pointer-events: all !important;
  position: absolute !important;
  z-index: 1000 !important;
}

/* 输入框文本选中样式优化 */
input::selection {
  background-color: rgba(59, 130, 246, 0.3); /* 蓝色半透明选中背景 */
  color: inherit;
}

input::-moz-selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}
</style>
