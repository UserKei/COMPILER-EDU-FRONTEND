/**
 * Pinia Store 持久化 Composable
 * 提供简单易用的 store 持久化集成
 */

import { watch, onMounted } from 'vue'
import { type Ref } from 'vue'
import { persistenceManager, type PersistenceConfig } from '@/lib/persistence'

interface StoreData {
  [key: string]: any
}

interface UsePersistenceOptions extends Omit<PersistenceConfig, 'key'> {
  /** 存储键名 */
  key: string
  /** Store 引用 */
  store: StoreData
  /** 存储键名前缀（可选） */
  keyPrefix?: string
  /** 是否在挂载时自动加载 */
  autoLoad?: boolean
  /** 自定义过滤函数（可选） */
  filter?: (key: string, value: any) => boolean
}

/**
 * 持久化 Hook
 * 为 Pinia store 提供自动持久化功能
 */
export function usePersistence(options: UsePersistenceOptions) {
  const {
    store,
    keyPrefix = 'store',
    version,
    include,
    exclude = [],
    autoSave = true,
    compress = false,
    ttl,
    saveDelay = 500,
    autoLoad = true,
    filter,
  } = options

  // 生成完整的存储键名
  const storageKey = `${keyPrefix}_${options.key || 'default'}`

  /**
   * 过滤需要持久化的数据
   */
  const filterData = (data: StoreData): StoreData => {
    const filtered: StoreData = {}

    // 只包含指定的字段
    const fieldsToCheck = include?.length ? include : Object.keys(data)

    fieldsToCheck.forEach((key) => {
      // 排除指定字段
      if (exclude.includes(key)) {
        return
      }

      // 排除函数和 Symbol
      const value = data[key]
      if (typeof value === 'function' || typeof value === 'symbol') {
        return
      }

      // 排除以 $ 开头的字段（Pinia 内部字段）
      if (key.startsWith('$')) {
        return
      }

      // 自定义过滤器
      if (filter && !filter(key, value)) {
        return
      }

      // 处理 ref 对象
      if (value && typeof value === 'object' && 'value' in value) {
        filtered[key] = value.value
      } else {
        filtered[key] = value
      }
    })

    return filtered
  }

  /**
   * 保存数据到本地存储
   */
  const saveData = () => {
    try {
      const dataToSave = filterData(store)

      const config: Partial<PersistenceConfig> = {
        version,
        compress,
        ttl,
        saveDelay,
      }

      if (autoSave && saveDelay) {
        persistenceManager.saveWithDelay(storageKey, dataToSave, config as PersistenceConfig)
      } else {
        persistenceManager.save(storageKey, dataToSave, config)
      }
    } catch (error) {
      console.error('[usePersistence] Failed to save data:', error)
    }
  }

  /**
   * 从本地存储加载数据
   */
  const loadData = (): boolean => {
    try {
      const loadedData = persistenceManager.load(storageKey, version)

      if (loadedData && typeof loadedData === 'object') {
        // 恢复数据到 store
        Object.entries(loadedData).forEach(([key, value]) => {
          if (key in store) {
            // 如果是 ref 对象
            if (store[key] && typeof store[key] === 'object' && 'value' in store[key]) {
              ;(store[key] as Ref).value = value
            } else {
              store[key] = value
            }
          }
        })

        console.log(`[usePersistence] Loaded data for ${storageKey}`)
        return true
      }

      return false
    } catch (error) {
      console.error('[usePersistence] Failed to load data:', error)
      return false
    }
  }

  /**
   * 清除持久化数据
   */
  const clearData = () => {
    persistenceManager.remove(storageKey)
  }

  /**
   * 手动保存（立即保存，不延迟）
   */
  const forceSave = () => {
    try {
      const dataToSave = filterData(store)
      persistenceManager.save(storageKey, dataToSave, {
        version,
        compress,
        ttl,
      })
    } catch (error) {
      console.error('[usePersistence] Failed to force save:', error)
    }
  }

  // 设置监听器（如果启用自动保存）
  if (autoSave && include?.length) {
    const watchTargets = include
      .map((key) => {
        const target = store[key]
        if (target && typeof target === 'object' && 'value' in target) {
          return target as Ref
        }
        return () => store[key]
      })
      .filter(Boolean)

    if (watchTargets.length > 0) {
      watch(
        watchTargets,
        () => {
          saveData()
        },
        { deep: true, flush: 'post' },
      )
    }
  }

  // 挂载时自动加载数据
  if (autoLoad) {
    onMounted(() => {
      loadData()
    })
  }

  return {
    /** 手动保存数据 */
    save: forceSave,
    /** 手动加载数据 */
    load: loadData,
    /** 清除持久化数据 */
    clear: clearData,
    /** 存储键名 */
    storageKey,
  }
}

/**
 * 多配置管理 Hook
 * 支持保存和切换多套配置
 */
export function useMultiConfig<T extends StoreData>(options: {
  store: T
  configKey: string
  maxConfigs?: number
}) {
  const { store, configKey, maxConfigs = 10 } = options
  const storageKey = `multi_config_${configKey}`

  /**
   * 保存当前配置
   */
  const saveConfig = (name: string, description?: string): boolean => {
    try {
      const configs =
        persistenceManager.load<
          Array<{
            name: string
            description?: string
            timestamp: number
            data: T
          }>
        >(storageKey) || []

      // 移除同名配置
      const filtered = configs.filter((c) => c.name !== name)

      // 添加新配置
      filtered.unshift({
        name,
        description,
        timestamp: Date.now(),
        data: { ...store },
      })

      // 限制配置数量
      if (filtered.length > maxConfigs) {
        filtered.splice(maxConfigs)
      }

      persistenceManager.save(storageKey, filtered)
      return true
    } catch (error) {
      console.error('[useMultiConfig] Failed to save config:', error)
      return false
    }
  }

  /**
   * 加载指定配置
   */
  const loadConfig = (name: string): boolean => {
    try {
      const configs =
        persistenceManager.load<
          Array<{
            name: string
            description?: string
            timestamp: number
            data: T
          }>
        >(storageKey) || []

      const config = configs.find((c) => c.name === name)
      if (!config) {
        return false
      }

      // 恢复配置到 store
      Object.entries(config.data).forEach(([key, value]) => {
        if (key in store) {
          if (store[key] && typeof store[key] === 'object' && 'value' in store[key]) {
            ;(store[key] as Ref).value = value
          } else {
            ;(store as any)[key] = value
          }
        }
      })

      return true
    } catch (error) {
      console.error('[useMultiConfig] Failed to load config:', error)
      return false
    }
  }

  /**
   * 获取所有配置列表
   */
  const getConfigs = (): Array<{
    name: string
    description?: string
    timestamp: number
  }> => {
    try {
      const configs =
        persistenceManager.load<
          Array<{
            name: string
            description?: string
            timestamp: number
            data: T
          }>
        >(storageKey) || []

      return configs.map((config) => ({
        name: config.name,
        description: config.description,
        timestamp: config.timestamp,
      }))
    } catch (error) {
      console.error('[useMultiConfig] Failed to get configs:', error)
      return []
    }
  }

  /**
   * 删除指定配置
   */
  const deleteConfig = (name: string): boolean => {
    try {
      const configs =
        persistenceManager.load<
          Array<{
            name: string
            description?: string
            timestamp: number
            data: T
          }>
        >(storageKey) || []

      const filtered = configs.filter((c) => c.name !== name)
      persistenceManager.save(storageKey, filtered)
      return true
    } catch (error) {
      console.error('[useMultiConfig] Failed to delete config:', error)
      return false
    }
  }

  /**
   * 清空所有配置
   */
  const clearConfigs = () => {
    persistenceManager.remove(storageKey)
  }

  return {
    saveConfig,
    loadConfig,
    getConfigs,
    deleteConfig,
    clearConfigs,
  }
}

/**
 * 历史记录 Hook
 * 记录最近使用的配置
 */
export function useHistory<T extends StoreData>(options: {
  store: T
  historyKey: string
  maxHistory?: number
  autoSave?: boolean
}) {
  const { store, historyKey, maxHistory = 20, autoSave = true } = options
  const storageKey = `history_${historyKey}`

  interface HistoryItem {
    id: string
    timestamp: number
    data: T
    description?: string
  }

  /**
   * 提取响应式对象的纯数据
   */
  const extractPlainData = (data: any): any => {
    if (data === null || data === undefined) return data

    // 如果是Vue响应式对象（ref），提取其值
    if (data && typeof data === 'object' && 'value' in data) {
      return extractPlainData(data.value)
    }

    // 如果是数组
    if (Array.isArray(data)) {
      return data.map((item) => extractPlainData(item))
    }

    // 如果是普通对象
    if (typeof data === 'object') {
      const plain: any = {}
      for (const [key, value] of Object.entries(data)) {
        // 跳过函数、Symbol和Vue内部属性
        if (
          !key.startsWith('_') &&
          !key.startsWith('$') &&
          typeof value !== 'function' &&
          typeof value !== 'symbol'
        ) {
          plain[key] = extractPlainData(value)
        }
      }
      return plain
    }

    return data
  }

  /**
   * 添加到历史记录
   */
  const addToHistory = (description?: string): void => {
    if (!autoSave) return

    try {
      const history = persistenceManager.load<HistoryItem[]>(storageKey) || []

      // 提取纯数据，避免循环引用
      const plainData = extractPlainData(store)

      const newItem: HistoryItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        timestamp: Date.now(),
        data: plainData,
        description,
      }

      history.unshift(newItem)

      // 限制历史记录数量
      if (history.length > maxHistory) {
        history.splice(maxHistory)
      }

      persistenceManager.save(storageKey, history)
    } catch (error) {
      console.error('[useHistory] Failed to add to history:', error)
    }
  }

  /**
   * 获取历史记录列表
   */
  const getHistory = (): Array<Omit<HistoryItem, 'data'>> => {
    try {
      const history = persistenceManager.load<HistoryItem[]>(storageKey) || []
      return history.map((item) => ({
        id: item.id,
        timestamp: item.timestamp,
        description: item.description,
      }))
    } catch (error) {
      console.error('[useHistory] Failed to get history:', error)
      return []
    }
  }

  /**
   * 从历史记录恢复
   */
  const restoreFromHistory = (id: string): boolean => {
    try {
      const history = persistenceManager.load<HistoryItem[]>(storageKey) || []
      const item = history.find((h) => h.id === id)

      if (!item) {
        return false
      }

      // 恢复数据到 store
      Object.entries(item.data).forEach(([key, value]) => {
        if (key in store) {
          if (store[key] && typeof store[key] === 'object' && 'value' in store[key]) {
            ;(store[key] as Ref).value = value
          } else {
            ;(store as any)[key] = value
          }
        }
      })

      return true
    } catch (error) {
      console.error('[useHistory] Failed to restore from history:', error)
      return false
    }
  }

  /**
   * 清空历史记录
   */
  const clearHistory = (): void => {
    persistenceManager.remove(storageKey)
  }

  return {
    addToHistory,
    getHistory,
    restoreFromHistory,
    clearHistory,
  }
}
