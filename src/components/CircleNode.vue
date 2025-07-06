<template>
  <div
    ref="nodeRef"
    class="w-24 h-24 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center transition-all duration-200 relative cursor-default group hover:border-blue-400 hover:shadow-lg"
    :class="{
      'ring-2 ring-blue-500': selected
    }"
  >
    <!-- Node Content -->
    <div class="relative z-10 pointer-events-none">
      <div class="flex items-center justify-center text-sm font-medium text-gray-700">
        <slot :data="data">
          <div class="text-center">
            {{ data.text || id }}
          </div>
        </slot>
      </div>
    </div>

    <!-- Multiple handles at center with different positions for proper line routing -->
    <!-- Top position handle -->
    <Handle
      id="node-top"
      type="source"
      :position="Position.Top"
      class="!absolute !w-4 !h-4 !bg-transparent !border-none !opacity-0 !cursor-crosshair"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto'
      }"
    />
    <Handle
      id="node-top-target"
      type="target"
      :position="Position.Top"
      class="!absolute !w-4 !h-4 !bg-transparent !border-none !opacity-0 !cursor-crosshair"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto'
      }"
    />

    <!-- Right position handle -->
    <Handle
      id="node-right"
      type="source"
      :position="Position.Right"
      class="!absolute !w-4 !h-4 !bg-transparent !border-none !opacity-0 !cursor-crosshair"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto'
      }"
    />
    <Handle
      id="node-right-target"
      type="target"
      :position="Position.Right"
      class="!absolute !w-4 !h-4 !bg-transparent !border-none !opacity-0 !cursor-crosshair"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto'
      }"
    />

    <!-- Bottom position handle -->
    <Handle
      id="node-bottom"
      type="source"
      :position="Position.Bottom"
      class="!absolute !w-4 !h-4 !bg-transparent !border-none !opacity-0 !cursor-crosshair"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto'
      }"
    />
    <Handle
      id="node-bottom-target"
      type="target"
      :position="Position.Bottom"
      class="!absolute !w-4 !h-4 !bg-transparent !border-none !opacity-0 !cursor-crosshair"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto'
      }"
    />

    <!-- Left position handle -->
    <Handle
      id="node-left"
      type="source"
      :position="Position.Left"
      class="!absolute !w-4 !h-4 !bg-transparent !border-none !opacity-0 !cursor-crosshair"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto'
      }"
    />
    <Handle
      id="node-left-target"
      type="target"
      :position="Position.Left"
      class="!absolute !w-4 !h-4 !bg-transparent !border-none !opacity-0 !cursor-crosshair"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Handle, Position, useVueFlow, type NodeProps } from '@vue-flow/core'

interface NodeData {
  label?: string
  text?: string
  [key: string]: any
}

interface Props extends NodeProps {
  data: NodeData
}

const props = defineProps<Props>()

const { getSelectedNodes } = useVueFlow()

const nodeRef = ref<HTMLElement>()

// Check if this node is selected
const selected = computed(() => {
  const selectedNodes = getSelectedNodes.value
  return selectedNodes.some(node => node.id === props.id)
})
</script>


