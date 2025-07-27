/**
 * Vue Flow 组合式函数
 * 统一管理所有 Flow 相关的组合式逻辑
 */

import { ref, computed, nextTick, type Ref } from 'vue'
import { type Node, type Edge, type Connection, useVueFlow } from '@vue-flow/core'
import { gsap } from 'gsap'
import type {
  NodeCreationOptions,
  NodeData,
  EdgeData,
  Position,
  NodeSize,
  AnimationConfig,
  ValidationRule,
  CanvasMode,
} from '../types'

/**
 * 节点创建组合函数
 */
export function useNodeCreation(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
  options: NodeCreationOptions,
) {
  const { screenToFlowCoordinate, vueFlowRef } = useVueFlow()

  // 默认 ID 生成器
  const defaultGenerateId = (): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${options.nodeType}-${timestamp}-${random}`
  }

  // 全局计数器，确保标签唯一且递增
  const nodeCounter = ref(0)

  // 默认标签生成器
  const defaultGenerateLabel = (_id: string): string => {
    if (options.nodeType === 'circle') {
      const existingLabels = nodes.value
        .filter((node) => node.type === 'circle')
        .map((node) => {
          const label = node.data?.label || node.data?.text || ''
          return parseInt(label)
        })
        .filter((num) => !isNaN(num) && num > 0)

      const maxNumber = existingLabels.length > 0 ? Math.max(...existingLabels) : 0
      const newNumber = Math.max(maxNumber + 1, 1)
      nodeCounter.value = newNumber

      return newNumber.toString()
    } else {
      const existingLabels = nodes.value
        .filter((node) => node.type === 'rectangle')
        .map((node) => node.data?.label || node.data?.text || '')
        .filter((label) => /^I\d+$/.test(label))
        .map((label) => parseInt(label.replace('I', '')))
        .filter((num) => !isNaN(num))

      let newNumber = 0
      while (existingLabels.includes(newNumber)) {
        newNumber++
      }
      return `I${newNumber}`
    }
  }

  // 创建节点的辅助函数
  const createNodeAtPosition = (position: Position) => {
    const id = options.generateId ? options.generateId() : defaultGenerateId()
    const label = options.generateLabel ? options.generateLabel(id) : defaultGenerateLabel(id)

    const nodeSize: NodeSize =
      options.nodeType === 'circle' ? { width: 60, height: 60 } : { width: 120, height: 60 }

    const centeredPosition = {
      x: position.x - nodeSize.width / 2,
      y: position.y - nodeSize.height / 2,
    }

    const newNode: Node = {
      id,
      type: options.nodeType,
      position: centeredPosition,
      data: {
        label,
        text: label,
        ...(options.nodeType === 'circle'
          ? {
              isInitial: false,
              isFinal: false,
            }
          : {
              pros: [],
            }),
      },
      draggable: true,
      selectable: true,
    }

    nodes.value.push(newNode)
    return newNode
  }

  // 处理画布双击事件
  const handlePaneDoubleClick = (event: MouseEvent) => {
    if (!vueFlowRef.value) return

    const flowCoordinate = screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY,
    })

    const newNode = createNodeAtPosition(flowCoordinate)

    nextTick(() => {
      const { animateNodeAppearance } = useNodeAnimation()
      animateNodeAppearance(newNode.id)
    })
  }

  // 清空所有节点和边
  const clearAll = () => {
    nodes.value = []
    edges.value = []
  }

  // 设置节点为初始状态
  const setNodeAsInitial = (nodeId: string) => {
    nodes.value = nodes.value.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isInitial: node.id === nodeId,
        ...(node.id !== nodeId && { isInitial: false }),
      },
    }))
  }

  // 设置节点为终结状态
  const setNodeAsFinal = (nodeId: string, isFinal: boolean = true) => {
    const nodeIndex = nodes.value.findIndex((node) => node.id === nodeId)
    if (nodeIndex !== -1) {
      nodes.value[nodeIndex] = {
        ...nodes.value[nodeIndex],
        data: {
          ...nodes.value[nodeIndex].data,
          isFinal,
        },
      }
    }
  }

  // 重置节点状态
  const resetNodeState = (nodeId: string) => {
    const nodeIndex = nodes.value.findIndex((node) => node.id === nodeId)
    if (nodeIndex !== -1) {
      nodes.value[nodeIndex] = {
        ...nodes.value[nodeIndex],
        data: {
          ...nodes.value[nodeIndex].data,
          isInitial: false,
          isFinal: false,
        },
      }
    }
  }

  return {
    createNodeAtPosition,
    handlePaneDoubleClick,
    clearAll,
    setNodeAsInitial,
    setNodeAsFinal,
    resetNodeState,
  }
}

/**
 * 节点状态管理组合函数
 */
export function useNodeState(nodeId: string, nodes: Ref<Node[]>) {
  const { getSelectedNodes, updateNode } = useVueFlow()

  const nodeData = computed(() => {
    const node = nodes.value.find((n) => n.id === nodeId)
    return node?.data as NodeData | undefined
  })

  const isSelected = computed(() => {
    return getSelectedNodes.value.some((node) => node.id === nodeId)
  })

  const isInitial = computed(() => nodeData.value?.isInitial || false)
  const isFinal = computed(() => nodeData.value?.isFinal || false)

  const updateNodeData = (data: Partial<NodeData>) => {
    updateNode(nodeId, {
      data: { ...nodeData.value, ...data },
    })
  }

  const toggleInitial = () => {
    if (isInitial.value) {
      updateNodeData({ isInitial: false })
    } else {
      // 清除其他节点的初始状态
      nodes.value.forEach((node) => {
        if (node.id !== nodeId && node.data?.isInitial) {
          updateNode(node.id, {
            data: { ...node.data, isInitial: false },
          })
        }
      })
      updateNodeData({ isInitial: true })
    }
  }

  const toggleFinal = () => {
    updateNodeData({ isFinal: !isFinal.value })
  }

  return {
    nodeData,
    isSelected,
    isInitial,
    isFinal,
    updateNodeData,
    toggleInitial,
    toggleFinal,
  }
}

/**
 * 节点动画组合函数
 */
export function useNodeAnimation() {
  const animateNodeAppearance = (nodeId: string, config?: AnimationConfig) => {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`)
    if (!nodeElement) return

    const defaultConfig: AnimationConfig = {
      duration: 0.3,
      ease: 'back.out(1.7)',
      scale: 1.2,
      opacity: 1,
    }

    const animConfig = { ...defaultConfig, ...config }

    gsap.fromTo(
      nodeElement,
      {
        scale: 0,
        opacity: 0,
        transformOrigin: 'center center',
      },
      {
        scale: animConfig.scale,
        opacity: animConfig.opacity,
        duration: animConfig.duration,
        ease: animConfig.ease,
        onComplete: () => {
          gsap.to(nodeElement, {
            scale: 1,
            duration: 0.2,
            ease: 'power2.out',
          })
        },
      },
    )
  }

  const animateNodeSelection = (nodeId: string) => {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`)
    if (!nodeElement) return

    gsap.to(nodeElement, {
      scale: 1.05,
      duration: 0.15,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    })
  }

  const animateNodeDeletion = (nodeId: string, onComplete?: () => void) => {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`)
    if (!nodeElement) {
      onComplete?.()
      return
    }

    gsap.to(nodeElement, {
      scale: 0,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      transformOrigin: 'center center',
      onComplete,
    })
  }

  return {
    animateNodeAppearance,
    animateNodeSelection,
    animateNodeDeletion,
  }
}

/**
 * 边管理组合函数
 */
export function useEdgeManagement(edges: Ref<Edge[]>) {
  const createEdge = (connection: Connection, data?: Partial<EdgeData>) => {
    const edgeId = `e${connection.source}-${connection.target}-${Date.now()}`

    const newEdge: Edge = {
      id: edgeId,
      type: 'custom',
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle || 'center-source',
      targetHandle: connection.targetHandle || 'center-target',
      data: {
        label: '',
        isEditing: true,
        ...data,
      },
    }

    edges.value.push(newEdge)
    return newEdge
  }

  const updateEdgeData = (edgeId: string, data: Partial<EdgeData>) => {
    const edgeIndex = edges.value.findIndex((e) => e.id === edgeId)
    if (edgeIndex !== -1) {
      edges.value[edgeIndex] = {
        ...edges.value[edgeIndex],
        data: { ...edges.value[edgeIndex].data, ...data },
      }
    }
  }

  const removeEdge = (edgeId: string) => {
    const edgeIndex = edges.value.findIndex((e) => e.id === edgeId)
    if (edgeIndex !== -1) {
      edges.value.splice(edgeIndex, 1)
    }
  }

  const findEdgesByNode = (nodeId: string) => {
    return edges.value.filter((edge) => edge.source === nodeId || edge.target === nodeId)
  }

  return {
    createEdge,
    updateEdgeData,
    removeEdge,
    findEdgesByNode,
  }
}

/**
 * 画布事件处理组合函数
 */
export function useCanvasEvents(nodes: Ref<Node[]>, edges: Ref<Edge[]>, mode: Ref<CanvasMode>) {
  const { getSelectedNodes, getSelectedEdges, removeNodes, removeEdges } = useVueFlow()

  // DFA 连接验证
  const validateDFAConnection = (connection: Connection): boolean => {
    if (mode.value !== 'dfa') return true

    const existingEdges = edges.value.filter(
      (edge) => edge.source === connection.source && edge.sourceHandle === connection.sourceHandle,
    )

    return existingEdges.length === 0
  }

  // 处理连接事件
  const onConnect = (connection: Connection, edgeData?: Partial<EdgeData>) => {
    if (mode.value === 'dfa' && !validateDFAConnection(connection)) {
      console.warn('DFA 约束：每个状态的每个输入只能有一个转换')
      return false
    }

    const { createEdge } = useEdgeManagement(edges)
    createEdge(connection, {
      markerEnd: `url(#${mode.value}-arrow)`,
      ...edgeData,
    })
    return true
  }

  // 删除选中的节点和边
  const deleteSelected = () => {
    const selectedNodes = getSelectedNodes.value
    const selectedEdges = getSelectedEdges.value

    if (selectedNodes.length > 0) {
      removeNodes(selectedNodes.map((node) => node.id))
    }

    if (selectedEdges.length > 0) {
      removeEdges(selectedEdges.map((edge) => edge.id))
    }
  }

  // 清空画布
  const clearCanvas = () => {
    nodes.value = []
    edges.value = []
  }

  return {
    validateDFAConnection,
    onConnect,
    deleteSelected,
    clearCanvas,
  }
}

/**
 * 验证规则组合函数
 */
export function useValidation(mode: Ref<CanvasMode>) {
  const validationRules = computed((): ValidationRule[] => {
    const rules: ValidationRule[] = []

    if (mode.value === 'dfa') {
      rules.push({
        type: 'dfa',
        message: 'DFA 必须有且仅有一个初始状态',
        validator: (nodes) => {
          const initialNodes = nodes.filter((node) => node.data?.isInitial)
          return initialNodes.length === 1
        },
      })

      rules.push({
        type: 'dfa',
        message: 'DFA 中每个状态的每个输入只能有一个转换',
        validator: (nodes, edges) => {
          const transitions = new Map<string, Set<string>>()

          for (const edge of edges) {
            const key = `${edge.source}-${edge.data?.label || ''}`
            if (!transitions.has(key)) {
              transitions.set(key, new Set())
            }
            transitions.get(key)!.add(edge.target)
          }

          return Array.from(transitions.values()).every((targets) => targets.size <= 1)
        },
      })
    }

    return rules
  })

  const validateCanvas = (nodes: Node[], edges: Edge[]) => {
    const errors: string[] = []

    for (const rule of validationRules.value) {
      if (!rule.validator(nodes, edges)) {
        errors.push(rule.message)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  return {
    validationRules,
    validateCanvas,
  }
}
