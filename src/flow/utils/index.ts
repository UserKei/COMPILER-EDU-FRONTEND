/**
 * Vue Flow 工具函数
 * 统一管理所有 Flow 相关的工具函数
 */

import type { Position, NodeSize, NodeData, EdgeData, LRItem } from '../types'

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

/**
 * LR 项目工具类
 */
class LRItemUtils {
  /**
   * 创建 LR 项目
   */
  static create(
    left: string,
    right: string[],
    dotPosition: number = 0,
    lookahead?: string,
  ): LRItem {
    const item: LRItem = {
      production: { left, right },
      dotPosition,
    }
    if (lookahead) {
      item.lookahead = lookahead
    }
    item.id = this.generateId(item)
    item.text = this.getText(item)
    return item
  }

  /**
   * 生成项目的唯一标识符
   */
  static generateId(item: LRItem): string {
    const prodStr = `${item.production.left}->${item.production.right.join('')}`
    const lookaheadStr = item.lookahead ? `/${item.lookahead}` : ''
    return `${prodStr}@${item.dotPosition}${lookaheadStr}`
  }

  /**
   * 生成项目的文本表示
   */
  static getText(item: LRItem): string {
    const left = item.production.left
    const right = [...item.production.right]
    right.splice(item.dotPosition, 0, '•')
    const lookaheadStr = item.lookahead ? `, ${item.lookahead}` : ''
    return `${left} → ${right.join(' ')}${lookaheadStr}`
  }

  /**
   * 检查项目是否可归约 (点在最后)
   */
  static isReducible(item: LRItem): boolean {
    return item.dotPosition >= item.production.right.length
  }

  /**
   * 获取点后面的符号
   */
  static getNextSymbol(item: LRItem): string | null {
    if (item.dotPosition < item.production.right.length) {
      return item.production.right[item.dotPosition]
    }
    return null
  }

  /**
   * 移动点的位置 (创建新项目)
   */
  static moveDot(item: LRItem): LRItem {
    if (item.dotPosition >= item.production.right.length) {
      return item // 已经在末尾，无法移动
    }
    return this.create(
      item.production.left,
      item.production.right,
      item.dotPosition + 1,
      item.lookahead,
    )
  }

  /**
   * 比较两个项目是否相等 (核心相等，不包括 lookahead)
   */
  static isEqual(item1: LRItem, item2: LRItem): boolean {
    return (
      item1.production.left === item2.production.left &&
      item1.production.right.length === item2.production.right.length &&
      item1.production.right.every((symbol, index) => symbol === item2.production.right[index]) &&
      item1.dotPosition === item2.dotPosition
    )
  }

  /**
   * 比较两个项目是否完全相等 (包括 lookahead)
   */
  static isEqualWithLookahead(item1: LRItem, item2: LRItem): boolean {
    return this.isEqual(item1, item2) && item1.lookahead === item2.lookahead
  }

  /**
   * 从字符串解析项目 (如 "E → E • + T")
   */
  static fromString(str: string): LRItem {
    const [left, rightPart] = str.split(/\s*→\s*/)
    const rightSymbols = rightPart.trim().split(/\s+/)
    const dotIndex = rightSymbols.indexOf('•')

    if (dotIndex === -1) {
      throw new Error('Invalid LR item string: missing dot (•)')
    }

    rightSymbols.splice(dotIndex, 1) // 移除点符号
    return this.create(left.trim(), rightSymbols, dotIndex)
  }

  /**
   * 计算项目集的闭包
   */
  static computeClosure(
    items: LRItem[],
    grammarRules: Array<{ left: string; right: string[] }>,
  ): LRItem[] {
    const closure = [...items]
    let changed = true

    while (changed) {
      changed = false

      for (const item of closure) {
        const nextSymbol = this.getNextSymbol(item)

        if (nextSymbol && this.isNonTerminal(nextSymbol)) {
          const productions = grammarRules.filter((rule) => rule.left === nextSymbol)

          for (const production of productions) {
            const newItem = this.create(production.left, production.right, 0, item.lookahead)

            const exists = closure.some((existingItem) => this.isEqual(existingItem, newItem))

            if (!exists) {
              closure.push(newItem)
              changed = true
            }
          }
        }
      }
    }

    return closure
  }

  /**
   * 计算 GOTO 函数
   */
  static computeGoto(
    items: LRItem[],
    symbol: string,
    grammarRules: Array<{ left: string; right: string[] }>,
  ): LRItem[] {
    const gotoItems: LRItem[] = []

    for (const item of items) {
      const nextSymbol = this.getNextSymbol(item)
      if (nextSymbol === symbol) {
        const movedItem = this.moveDot(item)
        gotoItems.push(movedItem)
      }
    }

    return this.computeClosure(gotoItems, grammarRules)
  }

  /**
   * 检查符号是否为非终结符
   */
  static isNonTerminal(symbol: string): boolean {
    // 通常非终结符是大写字母开头
    return /^[A-Z]/.test(symbol) && symbol !== symbol.toLowerCase()
  }

  /**
   * 生成项目集的状态键
   */
  static getStateKey(items: LRItem[]): string {
    return items
      .map((item) => this.generateId(item))
      .sort()
      .join('|')
  }

  /**
   * 查找可归约的项目
   */
  static getReducibleItems(items: LRItem[]): LRItem[] {
    return items.filter((item) => this.isReducible(item))
  }

  /**
   * 获取项目的产生式字符串
   */
  static getProductionString(item: LRItem): string {
    return `${item.production.left} → ${item.production.right.join(' ')}`
  }

  /**
   * 批量创建项目
   */
  static createFromProductions(
    productions: Array<{ left: string; right: string[] }>,
    dotPosition: number = 0,
  ): LRItem[] {
    return productions.map((prod) => this.create(prod.left, prod.right, dotPosition))
  }
}

/**
 * 文法分析工具类
 */
class GrammarUtils {
  /**
   * 检查符号是否为非终结符
   */
  static isNonTerminal(symbol: string): boolean {
    // 通常非终结符是大写字母开头
    return /^[A-Z]/.test(symbol) && symbol !== symbol.toLowerCase()
  }

  /**
   * 检查符号是否为终结符
   */
  static isTerminal(symbol: string): boolean {
    return !this.isNonTerminal(symbol) && symbol !== 'ε' && symbol !== 'λ'
  }

  /**
   * 检查是否为空符号
   */
  static isEpsilon(symbol: string): boolean {
    return symbol === 'ε' || symbol === 'λ' || symbol === 'epsilon'
  }

  /**
   * 获取文法的所有非终结符
   */
  static getNonTerminals(rules: Array<{ left: string; right: string[] }>): string[] {
    const nonTerminals = new Set<string>()

    rules.forEach((rule) => {
      nonTerminals.add(rule.left)
      rule.right.forEach((symbol) => {
        if (this.isNonTerminal(symbol)) {
          nonTerminals.add(symbol)
        }
      })
    })

    return Array.from(nonTerminals).sort()
  }

  /**
   * 获取文法的所有终结符
   */
  static getTerminals(rules: Array<{ left: string; right: string[] }>): string[] {
    const terminals = new Set<string>()

    rules.forEach((rule) => {
      rule.right.forEach((symbol) => {
        if (this.isTerminal(symbol)) {
          terminals.add(symbol)
        }
      })
    })

    return Array.from(terminals).sort()
  }

  /**
   * 获取文法的所有符号
   */
  static getAllSymbols(rules: Array<{ left: string; right: string[] }>): {
    nonTerminals: string[]
    terminals: string[]
    all: string[]
  } {
    const nonTerminals = this.getNonTerminals(rules)
    const terminals = this.getTerminals(rules)

    return {
      nonTerminals,
      terminals,
      all: [...nonTerminals, ...terminals].sort(),
    }
  }

  /**
   * 验证文法规则格式
   */
  static validateRule(rule: { left: string; right: string[] }): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!rule.left || rule.left.trim() === '') {
      errors.push('产生式左部不能为空')
    } else if (!this.isNonTerminal(rule.left)) {
      errors.push('产生式左部必须为非终结符（大写字母开头）')
    }

    if (!rule.right || rule.right.length === 0) {
      errors.push('产生式右部不能为空')
    } else if (rule.right.some((symbol) => !symbol || symbol.trim() === '')) {
      errors.push('产生式右部不能包含空符号')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * 创建增广文法
   */
  static createAugmentedGrammar(
    rules: Array<{ left: string; right: string[] }>,
    startSymbol?: string,
  ): Array<{ left: string; right: string[] }> {
    if (rules.length === 0) {
      return []
    }

    const start = startSymbol || rules[0].left
    const augmentedStart = `${start}'`

    return [{ left: augmentedStart, right: [start] }, ...rules]
  }

  /**
   * 格式化产生式为字符串
   */
  static formatProduction(rule: { left: string; right: string[] }): string {
    return `${rule.left} → ${rule.right.join(' ')}`
  }

  /**
   * 从字符串解析产生式
   */
  static parseProduction(str: string): { left: string; right: string[] } | null {
    const match = str.match(/^([A-Za-z][A-Za-z0-9']*)\s*→\s*(.+)$/)
    if (!match) {
      return null
    }

    const left = match[1].trim()
    const right = match[2]
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0)

    return { left, right }
  }

  /**
   * 检查文法是否为 LL(1)
   */
  static isLL1Grammar(_rules: Array<{ left: string; right: string[] }>): {
    isLL1: boolean
    conflicts: Array<{
      nonTerminal: string
      conflictType: 'first-first' | 'first-follow'
      details: string
    }>
  } {
    // 简化实现，实际需要计算 FIRST 和 FOLLOW 集合
    return {
      isLL1: true,
      conflicts: [],
    }
  }

  /**
   * 检查文法是否为 LR(0)
   */
  static isLR0Grammar(_rules: Array<{ left: string; right: string[] }>): {
    isLR0: boolean
    conflicts: Array<{
      state: string
      conflictType: 'shift-reduce' | 'reduce-reduce'
      details: string
    }>
  } {
    // 简化实现，实际需要构造 LR(0) 自动机
    return {
      isLR0: true,
      conflicts: [],
    }
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
  LRItemUtils,
  GrammarUtils,
}
