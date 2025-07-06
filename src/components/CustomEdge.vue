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

    <!-- Label on curve - draggable to control shape -->
    <EdgeLabelRenderer>
      <div
        ref="labelRef"
        :style="{
          pointerEvents: 'all',
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelPosition.x}px, ${labelPosition.y}px)`,
          zIndex: 1000,
          cursor: 'move'
        }"
        class="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium shadow-sm select-none"
        :class="{
          'border-blue-500 text-blue-700 shadow-md': selected,
          'text-gray-700': !selected
        }"
        @mousedown="onLabelMouseDown"
      >
        <slot name="label" :data="data">
          <span>{{ data?.label || '' }}</span>
        </slot>
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { BaseEdge, EdgeLabelRenderer, useVueFlow, type EdgeProps } from '@vue-flow/core'

interface EdgeData {
  label?: string
  controlOffset?: { x: number; y: number } // Offset from default control point
  labelT?: number // Position on curve (0-1), default 0.5
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

const { getSelectedEdges, getNode } = useVueFlow()

const labelRef = ref<HTMLElement>()
const isDragging = ref(false)

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

// Label position on curve (at parameter t, default 0.5 = middle)
const labelPosition = computed(() => {
  const t = props.data?.labelT || 0.5
  return getPointOnCurve(t)
})

// Quadratic bezier path using control point
const edgePath = computed(() => {
  const start = startPoint.value
  const end = endPoint.value
  const control = controlPoint.value

  // Create quadratic bezier curve: M start Q control end
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`
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
      ...props.data,
      controlOffset: { ...controlOffset.value }
    }
    emit('update:data', newData)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>
