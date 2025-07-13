import { ref, watch, nextTick, type Ref } from 'vue'
import { type Node, type Edge, useVueFlow } from '@vue-flow/core'
import { gsap } from 'gsap'

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

  // 全局计数器，确保标签唯一且递增
  const nodeCounter = ref(0)

  // 默认标签生成器
  const defaultGenerateLabel = (id: string): string => {
    if (options.nodeType === 'circle') {
      // 为圆形节点生成纯数字编号，从1开始
      const existingLabels = nodes.value
        .filter(node => node.type === 'circle')
        .map(node => {
          const label = node.data?.label || node.data?.text || ''
          return parseInt(label)
        })
        .filter(num => !isNaN(num) && num > 0)

      // 找到最大的现有编号
      const maxNumber = existingLabels.length > 0 ? Math.max(...existingLabels) : 0

      // 新编号为最大编号+1，最小为1
      const newNumber = Math.max(maxNumber + 1, 1)
      nodeCounter.value = newNumber

      return newNumber.toString()
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

    // 计算节点中心位置 - 假设圆形节点直径为60px，矩形节点为120x60px
    const nodeSize = options.nodeType === 'circle' ? { width: 60, height: 60 } : { width: 120, height: 60 }
    const centeredPosition = {
      x: position.x - nodeSize.width / 2,
      y: position.y - nodeSize.height / 2
    }

    const newNode: Node = {
      id,
      type: options.nodeType,
      position: centeredPosition,
      data: {
        label,
        text: label,
        ...(options.nodeType === 'circle' ? {
          isInitial: false,
          isFinal: false
        } : {
          pros: []
        })
      },
      draggable: true, // 确保节点可拖拽
      selectable: true, // 确保节点可选择
    }

    nodes.value.push(newNode)
    console.log(`Created new ${options.nodeType} node:`, newNode)

    // 添加出现动画
    nextTick(() => {
      animateNodeAppearance(id)
    })
  }

  // 节点出现动画
  const animateNodeAppearance = (nodeId: string) => {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`)
    if (nodeElement) {
      // 设置初始状态：缩放为0，透明度为0
      gsap.set(nodeElement, {
        scale: 0,
        opacity: 0,
        transformOrigin: 'center center'
      })

      // 执行弹性出现动画
      gsap.to(nodeElement, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: 'back.out(1.7)',
        onComplete: () => {
          console.log(`Node ${nodeId} animation completed`)
        }
      })
    } else {
      console.warn(`Node element with id ${nodeId} not found for animation`)
    }
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
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
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

    // 计算节点中心位置
    const nodeSize = options.nodeType === 'circle' ? { width: 60, height: 60 } : { width: 120, height: 60 }
    const centeredPosition = {
      x: position.x - nodeSize.width / 2,
      y: position.y - nodeSize.height / 2
    }

    const newNode: Node = {
      id,
      type: options.nodeType,
      position: centeredPosition,
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
      },
      draggable: true, // 确保节点可拖拽
      selectable: true, // 确保节点可选择
    }

    nodes.value.push(newNode)

    // 添加出现动画
    nextTick(() => {
      animateNodeAppearance(id)
    })

    return newNode
  }

  // 清空所有节点和边
  const clearAll = () => {
    nodes.value = []
    edges.value = []
    // 重置计数器
    nodeCounter.value = 0
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
    resetNodeState,
    animateNodeAppearance
  }
}
