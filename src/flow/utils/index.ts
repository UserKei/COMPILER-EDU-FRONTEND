/**
 * Vue Flow 工具函数
 * 统一管理所有 Flow 相关的工具函数
 */

import type { Position, NodeSize, NodeData, EdgeData } from '../types'

/**
 * 坐标转换工具
 */
class CoordinateUtils {
  /**
   * 计算节点中心位置
   */
  static centerPosition(position: Position, nodeSize: NodeSize): Position {
    return {
      x: position.x - nodeSize.width / 2,
      y: position.y - nodeSize.height / 2,
    }
  }

  /**
   * 计算两点之间的距离
   */
  static distance(point1: Position, point2: Position): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 计算两点之间的角度（弧度）
   */
  static angle(point1: Position, point2: Position): number {
    return Math.atan2(point2.y - point1.y, point2.x - point1.x)
  }

  /**
   * 将角度转换为度数
   */
  static radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI)
  }

  /**
   * 将度数转换为弧度
   */
  static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * 计算圆上某个角度的点
   */
  static pointOnCircle(center: Position, radius: number, angle: number): Position {
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    }
  }

  /**
   * 限制坐标在指定范围内
   */
  static clampPosition(position: Position, bounds: { min: Position; max: Position }): Position {
    return {
      x: Math.max(bounds.min.x, Math.min(bounds.max.x, position.x)),
      y: Math.max(bounds.min.y, Math.min(bounds.max.y, position.y)),
    }
  }
}

/**
 * ID 生成工具
 */
class IdGenerator {
  private static counters = new Map<string, number>()

  /**
   * 生成唯一的节点 ID
   */
  static generateNodeId(type: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${type}-${timestamp}-${random}`
  }

  /**
   * 生成唯一的边 ID
   */
  static generateEdgeId(source: string, target: string): string {
    const timestamp = Date.now()
    return `e${source}-${target}-${timestamp}`
  }

  /**
   * 生成递增的数字标签
   */
  static generateSequentialLabel(prefix: string = ''): string {
    const key = prefix || 'default'
    const current = this.counters.get(key) || 0
    const next = current + 1
    this.counters.set(key, next)
    return prefix ? `${prefix}${next}` : next.toString()
  }

  /**
   * 重置计数器
   */
  static resetCounter(prefix: string): void {
    this.counters.set(prefix, 0)
  }

  /**
   * 获取当前计数值
   */
  static getCurrentCount(prefix: string): number {
    return this.counters.get(prefix) || 0
  }
}

/**
 * 节点大小计算工具
 */
class NodeSizeCalculator {
  /**
   * 根据文本内容计算圆形节点大小
   */
  static calculateCircleSize(text: string, minSize: number = 45, maxSize: number = 80): number {
    if (!text || text.trim() === '') {
      return minSize
    }
    const baseSize = Math.max(minSize, Math.min(maxSize, text.length * 6 + 35))
    return baseSize
  }

  /**
   * 根据项目数量计算矩形节点大小
   */
  static calculateRectangleSize(
    itemCount: number,
    minWidth: number = 120,
    minHeight: number = 60,
  ): NodeSize {
    const width = Math.max(minWidth, itemCount * 15 + 80)
    const height = Math.max(minHeight, itemCount * 20 + 40)
    return { width, height }
  }

  /**
   * 根据内容计算文本尺寸
   */
  static measureText(text: string, fontSize: number = 12, fontFamily: string = 'Arial'): NodeSize {
    // 创建临时画布来测量文本
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) {
      // 降级处理：估算文本尺寸
      return {
        width: text.length * fontSize * 0.6,
        height: fontSize * 1.2,
      }
    }

    context.font = `${fontSize}px ${fontFamily}`
    const metrics = context.measureText(text)

    return {
      width: metrics.width,
      height: fontSize * 1.2, // 近似行高
    }
  }
}

/**
 * 验证工具
 */
class ValidationUtils {
  /**
   * 验证节点标签是否唯一
   */
  static isLabelUnique(
    label: string,
    nodes: Array<{ data?: NodeData }>,
    excludeId?: string,
  ): boolean {
    return !nodes.some(
      (node) =>
        node.data?.label === label && (excludeId === undefined || node.data?.label !== excludeId),
    )
  }

  /**
   * 验证 DFA 转换唯一性
   */
  static isDFATransitionValid(
    sourceId: string,
    symbol: string,
    edges: Array<{ source: string; data?: EdgeData }>,
  ): boolean {
    return !edges.some((edge) => edge.source === sourceId && edge.data?.label === symbol)
  }

  /**
   * 验证状态标识符格式
   */
  static isValidStateId(id: string): boolean {
    // 允许字母、数字、下划线和短横线
    return /^[a-zA-Z0-9_-]+$/.test(id)
  }

  /**
   * 验证转换符号格式
   */
  static isValidTransitionSymbol(symbol: string): boolean {
    // 允许字母、数字和一些特殊符号
    return /^[a-zA-Z0-9εε∈∅λ]+$/.test(symbol)
  }

  /**
   * 检查是否有未连接的节点
   */
  static findIsolatedNodes(
    nodes: Array<{ id: string }>,
    edges: Array<{ source: string; target: string }>,
  ): string[] {
    const connectedNodes = new Set<string>()

    edges.forEach((edge) => {
      connectedNodes.add(edge.source)
      connectedNodes.add(edge.target)
    })

    return nodes.map((node) => node.id).filter((nodeId) => !connectedNodes.has(nodeId))
  }
}

/**
 * 动画工具
 */
class AnimationUtils {
  /**
   * 创建缓动函数
   */
  static easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  static easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  static easeIn(t: number): number {
    return t * t * t
  }

  /**
   * 创建弹性缓动
   */
  static elastic(t: number): number {
    return t === 0 || t === 1 ? t : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI)
  }

  /**
   * 插值函数
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t
  }

  /**
   * 位置插值
   */
  static lerpPosition(start: Position, end: Position, t: number): Position {
    return {
      x: this.lerp(start.x, end.x, t),
      y: this.lerp(start.y, end.y, t),
    }
  }
}

/**
 * 颜色工具
 */
class ColorUtils {
  /**
   * 根据模式获取主题色
   */
  static getThemeColor(mode: string): string {
    const colors: Record<string, string> = {
      nfa: '#059669', // emerald-600
      dfa: '#3b82f6', // blue-500
      lr0: '#8b5cf6', // violet-500
      slr1: '#f59e0b', // amber-500
      ll1: '#ef4444', // red-500
    }
    return colors[mode] || '#6b7280' // gray-500
  }

  /**
   * 获取状态对应的颜色
   */
  static getStateColor(isInitial: boolean, isFinal: boolean): string {
    if (isInitial && isFinal) return '#8b5cf6' // violet-500
    if (isInitial) return '#10b981' // emerald-500
    if (isFinal) return '#f59e0b' // amber-500
    return '#6b7280' // gray-500
  }

  /**
   * 转换十六进制颜色为 RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  /**
   * 添加透明度到颜色
   */
  static addAlpha(hex: string, alpha: number): string {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return hex
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
  }
}

/**
 * 键盘快捷键工具
 */
class KeyboardUtils {
  /**
   * 检查是否按下了修饰键
   */
  static hasModifier(event: KeyboardEvent, modifier: string): boolean {
    switch (modifier) {
      case 'ctrl':
        return event.ctrlKey
      case 'shift':
        return event.shiftKey
      case 'alt':
        return event.altKey
      case 'meta':
        return event.metaKey
      default:
        return false
    }
  }

  /**
   * 创建快捷键字符串
   */
  static getShortcutString(event: KeyboardEvent): string {
    const parts: string[] = []

    if (event.ctrlKey) parts.push('Ctrl')
    if (event.shiftKey) parts.push('Shift')
    if (event.altKey) parts.push('Alt')
    if (event.metaKey) parts.push('Meta')

    parts.push(event.key)

    return parts.join('+')
  }

  /**
   * 检查快捷键是否匹配
   */
  static matchesShortcut(
    event: KeyboardEvent,
    shortcut: { key: string; modifiers?: string[] },
  ): boolean {
    if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
      return false
    }

    const requiredModifiers = shortcut.modifiers || []

    return (
      requiredModifiers.every((modifier) => this.hasModifier(event, modifier)) &&
      requiredModifiers.length === this.getActiveModifiers(event).length
    )
  }

  /**
   * 获取当前活跃的修饰键
   */
  private static getActiveModifiers(event: KeyboardEvent): string[] {
    const modifiers: string[] = []

    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.shiftKey) modifiers.push('shift')
    if (event.altKey) modifiers.push('alt')
    if (event.metaKey) modifiers.push('meta')

    return modifiers
  }
}

// 导出所有工具类
export {
  CoordinateUtils,
  IdGenerator,
  NodeSizeCalculator,
  ValidationUtils,
  AnimationUtils,
  ColorUtils,
  KeyboardUtils,
}
