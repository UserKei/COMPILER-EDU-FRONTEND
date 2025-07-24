/**
 * Pinia Store 持久化管理器
 * 提供自动保存、智能恢复、版本控制等功能
 */

export interface PersistenceConfig {
  /** 存储键名 */
  key: string
  /** 数据版本 */
  version: string
  /** 需要持久化的状态字段 */
  include: string[]
  /** 排除的字段（可选） */
  exclude?: string[]
  /** 是否自动保存 */
  autoSave: boolean
  /** 是否压缩（可选） */
  compress?: boolean
  /** 过期时间，毫秒（可选） */
  ttl?: number
  /** 保存延迟，毫秒（防抖） */
  saveDelay?: number
}

export interface StorageData<T = any> {
  /** 数据版本 */
  version: string
  /** 保存时间戳 */
  timestamp: number
  /** 过期时间戳（可选） */
  expiresAt?: number
  /** 实际数据 */
  data: T
  /** 数据校验和（可选） */
  checksum?: string
}

export interface MigrationHandler {
  /** 源版本 */
  from: string
  /** 目标版本 */
  to: string
  /** 迁移函数 */
  migrate: (data: any) => any
}

/**
 * 持久化管理器
 * 支持版本控制、数据压缩、过期清理等高级功能
 */
export class PersistenceManager {
  private static instance: PersistenceManager
  private migrations: Map<string, MigrationHandler[]> = new Map()
  private saveTimers: Map<string, number> = new Map()

  private constructor() {
    // 页面加载时清理过期数据
    this.cleanExpiredData()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager()
    }
    return PersistenceManager.instance
  }

  /**
   * 检查 localStorage 是否可用
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * 清理数据中的循环引用和Vue响应式对象
   */
  private cleanDataForSerialization(data: any): any {
    if (data === null || data === undefined) return data

    // 如果是Vue响应式对象（ref, reactive等），提取其值
    if (data && typeof data === 'object') {
      // 处理ComputedRef对象
      if ('_value' in data && 'dep' in data) {
        return this.cleanDataForSerialization(data._value)
      }

      // 处理普通ref对象
      if ('value' in data && Object.keys(data).length <= 3) {
        return this.cleanDataForSerialization(data.value)
      }
    }

    // 如果是数组
    if (Array.isArray(data)) {
      return data.map((item) => this.cleanDataForSerialization(item))
    }

    // 如果是普通对象
    if (typeof data === 'object') {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(data)) {
        // 跳过Vue内部属性和函数
        if (
          !key.startsWith('_') &&
          !key.startsWith('$') &&
          key !== 'dep' &&
          typeof value !== 'function' &&
          typeof value !== 'symbol'
        ) {
          cleaned[key] = this.cleanDataForSerialization(value)
        }
      }
      return cleaned
    }

    return data
  }

  /**
   * 生成数据校验和
   */
  private generateChecksum(data: any): string {
    const cleanedData = this.cleanDataForSerialization(data)
    const str = JSON.stringify(cleanedData)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString(36)
  }

  /**
   * 压缩数据（简单的JSON压缩）
   */
  private compress(data: string): string {
    // 简单的压缩：移除不必要的空格
    return data.replace(/\s+/g, ' ').trim()
  }

  /**
   * 解压数据
   */
  private decompress(data: string): string {
    return data
  }

  /**
   * 保存数据到 localStorage
   */
  save<T>(key: string, data: T, config: Partial<PersistenceConfig> = {}): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn('[PersistenceManager] localStorage is not available')
      return false
    }

    try {
      // 清理数据中的循环引用
      const cleanedData = this.cleanDataForSerialization(data)

      const storageData: StorageData<any> = {
        version: config.version || '1.0.0',
        timestamp: Date.now(),
        data: cleanedData,
      }

      // 设置过期时间
      if (config.ttl) {
        storageData.expiresAt = Date.now() + config.ttl
      }

      // 生成校验和（使用清理后的数据）
      storageData.checksum = this.generateChecksum(cleanedData)

      let serialized = JSON.stringify(storageData)

      // 压缩（如果启用）
      if (config.compress) {
        serialized = this.compress(serialized)
      }

      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      console.error('[PersistenceManager] Failed to save data:', error)

      // 如果存储空间不足，尝试清理过期数据后重试
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanExpiredData()
        try {
          // 清理数据中的循环引用
          const cleanedData = this.cleanDataForSerialization(data)

          const storageData: StorageData<any> = {
            version: config.version || '1.0.0',
            timestamp: Date.now(),
            data: cleanedData,
            checksum: this.generateChecksum(cleanedData),
          }

          if (config.ttl) {
            storageData.expiresAt = Date.now() + config.ttl
          }

          let serialized = JSON.stringify(storageData)
          if (config.compress) {
            serialized = this.compress(serialized)
          }

          localStorage.setItem(key, serialized)
          return true
        } catch {
          console.error('[PersistenceManager] Failed to save after cleanup')
          return false
        }
      }
      return false
    }
  }

  /**
   * 从 localStorage 加载数据
   */
  load<T>(key: string, currentVersion?: string): T | null {
    if (!this.isLocalStorageAvailable()) {
      return null
    }

    try {
      const stored = localStorage.getItem(key)
      if (!stored) {
        return null
      }

      // 解压（如果需要）
      const decompressed = this.decompress(stored)
      const storageData: StorageData<T> = JSON.parse(decompressed)

      // 检查过期
      if (storageData.expiresAt && Date.now() > storageData.expiresAt) {
        this.remove(key)
        return null
      }

      // 验证数据完整性
      if (storageData.checksum) {
        const expectedChecksum = this.generateChecksum(storageData.data)
        if (storageData.checksum !== expectedChecksum) {
          console.warn('[PersistenceManager] Data corruption detected for key:', key)
          this.remove(key)
          return null
        }
      }

      // 版本迁移
      if (currentVersion && storageData.version !== currentVersion) {
        const migrated = this.migrate(key, storageData.data, storageData.version, currentVersion)
        if (migrated !== null) {
          // 保存迁移后的数据
          this.save(key, migrated, { version: currentVersion })
          return migrated
        } else {
          // 迁移失败，删除旧数据
          this.remove(key)
          return null
        }
      }

      return storageData.data
    } catch (error) {
      console.error('[PersistenceManager] Failed to load data:', error)
      // 数据损坏时删除
      this.remove(key)
      return null
    }
  }

  /**
   * 删除指定键的数据
   */
  remove(key: string): void {
    if (!this.isLocalStorageAvailable()) {
      return
    }

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('[PersistenceManager] Failed to remove data:', error)
    }
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    if (!this.isLocalStorageAvailable()) {
      return
    }

    try {
      localStorage.clear()
    } catch (error) {
      console.error('[PersistenceManager] Failed to clear data:', error)
    }
  }

  /**
   * 注册数据迁移处理器
   */
  registerMigration(key: string, migration: MigrationHandler): void {
    if (!this.migrations.has(key)) {
      this.migrations.set(key, [])
    }
    this.migrations.get(key)!.push(migration)
  }

  /**
   * 执行数据迁移
   */
  private migrate(key: string, data: any, fromVersion: string, toVersion: string): any {
    const keyMigrations = this.migrations.get(key) || []

    try {
      let currentData = data
      let currentVersion = fromVersion

      // 查找并执行迁移路径
      while (currentVersion !== toVersion) {
        const migration = keyMigrations.find((m) => m.from === currentVersion)
        if (!migration) {
          console.warn(
            `[PersistenceManager] No migration path from ${currentVersion} to ${toVersion}`,
          )
          return null
        }

        currentData = migration.migrate(currentData)
        currentVersion = migration.to
      }

      return currentData
    } catch (error) {
      console.error('[PersistenceManager] Migration failed:', error)
      return null
    }
  }

  /**
   * 延迟保存（防抖）
   */
  saveWithDelay<T>(key: string, data: T, config: PersistenceConfig): void {
    const delay = config.saveDelay || 500

    // 清除之前的定时器
    const existingTimer = this.saveTimers.get(key)
    if (existingTimer) {
      window.clearTimeout(existingTimer)
    }

    // 设置新的定时器
    const timer = window.setTimeout(() => {
      this.save(key, data, config)
      this.saveTimers.delete(key)
    }, delay)

    this.saveTimers.set(key, timer)
  }

  /**
   * 清理过期数据
   */
  private cleanExpiredData(): void {
    if (!this.isLocalStorageAvailable()) {
      return
    }

    try {
      const now = Date.now()
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        try {
          const stored = localStorage.getItem(key)
          if (!stored) continue

          const data: StorageData = JSON.parse(stored)
          if (data.expiresAt && now > data.expiresAt) {
            keysToRemove.push(key)
          }
        } catch {
          // 忽略解析错误的数据
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key))

      if (keysToRemove.length > 0) {
        console.log(`[PersistenceManager] Cleaned ${keysToRemove.length} expired items`)
      }
    } catch (error) {
      console.error('[PersistenceManager] Failed to clean expired data:', error)
    }
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats(): {
    totalKeys: number
    usedSpace: number
    availableSpace: number
    items: Array<{ key: string; size: number; timestamp?: number }>
  } {
    const stats = {
      totalKeys: 0,
      usedSpace: 0,
      availableSpace: 0,
      items: [] as Array<{ key: string; size: number; timestamp?: number }>,
    }

    if (!this.isLocalStorageAvailable()) {
      return stats
    }

    try {
      let totalSize = 0
      const items: Array<{ key: string; size: number; timestamp?: number }> = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        const value = localStorage.getItem(key) || ''
        const size = new Blob([value]).size

        totalSize += size

        let timestamp: number | undefined
        try {
          const data: StorageData = JSON.parse(value)
          timestamp = data.timestamp
        } catch {
          // 忽略解析错误
        }

        items.push({ key, size, timestamp })
      }

      stats.totalKeys = localStorage.length
      stats.usedSpace = totalSize
      stats.availableSpace = 5 * 1024 * 1024 - totalSize // 假设 5MB 限制
      stats.items = items.sort((a, b) => b.size - a.size)

      return stats
    } catch (error) {
      console.error('[PersistenceManager] Failed to get storage stats:', error)
      return stats
    }
  }

  /**
   * 导出数据到 JSON 文件
   */
  exportData(keys?: string[]): string {
    const exportData: Record<string, any> = {}

    if (!this.isLocalStorageAvailable()) {
      return JSON.stringify(exportData)
    }

    try {
      const targetKeys =
        keys ||
        (Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter(
          Boolean,
        ) as string[])

      targetKeys.forEach((key) => {
        const data = localStorage.getItem(key)
        if (data) {
          exportData[key] = data
        }
      })

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('[PersistenceManager] Failed to export data:', error)
      return JSON.stringify(exportData)
    }
  }

  /**
   * 从 JSON 字符串导入数据
   */
  importData(jsonData: string): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false
    }

    try {
      const data = JSON.parse(jsonData)

      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value as string)
      })

      return true
    } catch (error) {
      console.error('[PersistenceManager] Failed to import data:', error)
      return false
    }
  }
}

// 单例实例
export const persistenceManager = PersistenceManager.getInstance()
