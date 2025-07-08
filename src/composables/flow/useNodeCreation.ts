import { ref, watch, type Ref } from 'vue'
import { type Node, type Edge, useVueFlow } from '@vue-flow/core'

export interface NodeCreationOptions {
  nodeType: 'circle' | 'rectangle'
  defaultLabel?: string
  generateId?: () => string
  generateLabel?: (id: string) => string
}

export function useNodeCreation(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
  options: NodeCreationOptions
) {
  const { screenToFlowCoordinate, vueFlowRef } = useVueFlow()

  // 默认 ID 生成器
  const defaultGenerateId = (): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${options.nodeType}-${timestamp}-${random}`
  }

  // 默认标签生成器
  const defaultGenerateLabel = (id: string): string => {
    if (options.nodeType === 'circle') {
      // 为圆形节点生成状态编号
      const existingLabels = nodes.value
        .filter(node => node.type === 'circle')
        .map(node => node.data?.label || node.data?.text || '')
        .filter(label => /^q?\d+$/.test(label))
        .map(label => parseInt(label.replace('q', '')))
        .filter(num => !isNaN(num))

      let newNumber = 0
      while (existingLabels.includes(newNumber)) {
        newNumber++
      }
      return `q${newNumber}`
    } else {
      // 为矩形节点生成项目集编号
      const existingLabels = nodes.value
        .filter(node => node.type === 'rectangle')
        .map(node => node.data?.label || node.data?.text || '')
        .filter(label => /^I\d+$/.test(label))
        .map(label => parseInt(label.replace('I', '')))
        .filter(num => !isNaN(num))

      let newNumber = 0
      while (existingLabels.includes(newNumber)) {
        newNumber++
      }
      return `I${newNumber}`
    }
  }

  // 创建节点的辅助函数
  const createNodeAtPosition = (position: { x: number; y: number }) => {
    const id = options.generateId ? options.generateId() : defaultGenerateId()
    const label = options.generateLabel ? options.generateLabel(id) : defaultGenerateLabel(id)

    const newNode: Node = {
      id,
      type: options.nodeType,
      position: { x: position.x - 30, y: position.y - 30 },
      data: {
        label,
        text: label,
        ...(options.nodeType === 'circle' ? {
          isInitial: false,
          isFinal: false
        } : {
          pros: []
        })
      }
    }

    nodes.value.push(newNode)
    console.log(`Created new ${options.nodeType} node:`, newNode)
  }

  // 双击事件处理器
  const handlePaneDoubleClick = (event: Event) => {
    const mouseEvent = event as MouseEvent
    console.log('handlePaneDoubleClick 被调用', mouseEvent)

    // 阻止事件冒泡
    event.preventDefault()
    event.stopPropagation()

    // 获取点击位置相对于画布的坐标
    const flowContainer = (event.target as HTMLElement).closest('.vue-flow')
    if (!flowContainer) {
      console.warn('未找到 .vue-flow 容器')
      return
    }

    // 检查是否点击在节点或边上，如果是则不创建新节点
    const clickedElement = event.target as HTMLElement
    if (clickedElement.closest('.vue-flow__node') || clickedElement.closest('.vue-flow__edge')) {
      console.log('点击在节点或边上，不创建新节点')
      return
    }

    try {
      // 使用 screenToFlowCoordinate 转换坐标
      const position = screenToFlowCoordinate({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY
      })

      console.log('转换后的坐标:', position)
      createNodeAtPosition(position)
    } catch (error) {
      console.error('坐标转换失败:', error)

      // 备用方案：使用相对坐标
      const rect = flowContainer.getBoundingClientRect()
      const position = {
        x: mouseEvent.clientX - rect.left - 30,
        y: mouseEvent.clientY - rect.top - 30
      }

      console.log('使用备用坐标:', position)
      createNodeAtPosition(position)
    }
  }

  // 使用 watch 监听 VueFlow 实例，自动绑定双击事件
  watch(
    () => vueFlowRef.value,
    (vueFlowInstance) => {
      if (!vueFlowInstance) return

      console.log('VueFlow 实例已准备，绑定双击事件')

      // 查找 pane 元素
      const paneElement = vueFlowInstance.querySelector('.vue-flow__pane')
      if (paneElement) {
        // 移除可能存在的旧事件监听器
        paneElement.removeEventListener('dblclick', handlePaneDoubleClick)

        // 添加新的双击事件监听器
        paneElement.addEventListener('dblclick', handlePaneDoubleClick)

        console.log('双击事件监听器已通过 watch 绑定')
      } else {
        console.warn('未找到 .vue-flow__pane 元素')
      }
    },
    {
      immediate: true,  // 立即执行一次
      flush: 'post'     // 在 DOM 更新后执行
    }
  )

  // 批量创建节点（可选功能）
  const createNode = (position: { x: number; y: number }, customData?: any) => {
    const id = options.generateId ? options.generateId() : defaultGenerateId()
    const label = options.generateLabel ? options.generateLabel(id) : defaultGenerateLabel(id)

    const newNode: Node = {
      id,
      type: options.nodeType,
      position,
      data: {
        label,
        text: label,
        ...customData,
        ...(options.nodeType === 'circle' ? {
          isInitial: false,
          isFinal: false
        } : {
          pros: []
        })
      }
    }

    nodes.value.push(newNode)
    return newNode
  }

  // 清空所有节点和边
  const clearAll = () => {
    nodes.value = []
    edges.value = []
  }

  // 节点状态管理
  const setNodeAsInitial = (nodeId: string) => {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node && node.data) {
      node.data.isInitial = true
    }
  }

  const setNodeAsFinal = (nodeId: string) => {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node && node.data) {
      node.data.isFinal = true
    }
  }

  const resetNodeState = (nodeId: string) => {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node && node.data) {
      node.data.isInitial = false
      node.data.isFinal = false
    }
  }

  // 返回所有功能
  return {
    handlePaneDoubleClick,
    createNode,
    clearAll,
    setNodeAsInitial,
    setNodeAsFinal,
    resetNodeState
  }
}
