/**
 * Pinia Store 持久化系统测试用例
 * 测试持久化管理器、Composable 和 Store 集成
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, ref } from 'vue'
import { PersistenceManager, persistenceManager } from '@/lib/persistence'
import { usePersistence, useMultiConfig, useHistory } from '@/composables/persistence'
import { useLL1Store } from '@/stores/ll1'

describe('PersistenceManager', () => {
  let manager: PersistenceManager

  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear()
    manager = PersistenceManager.getInstance()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('基本存储功能', () => {
    it('应该能够保存和加载数据', () => {
      const testData = { name: 'test', value: 123 }
      const key = 'test_key'

      // 保存数据
      const saved = manager.save(key, testData, { version: '1.0.0' })
      expect(saved).toBe(true)

      // 加载数据
      const loaded = manager.load(key, '1.0.0')
      expect(loaded).toEqual(testData)
    })

    it('应该能够删除数据', () => {
      const testData = { name: 'test' }
      const key = 'test_key'

      manager.save(key, testData)
      manager.remove(key)

      const loaded = manager.load(key)
      expect(loaded).toBeNull()
    })

    it('应该处理不存在的键', () => {
      const loaded = manager.load('non_existent_key')
      expect(loaded).toBeNull()
    })
  })

  describe('版本控制和迁移', () => {
    it('应该检测版本不匹配', () => {
      const testData = { name: 'test' }
      const key = 'test_key'

      // 保存旧版本数据
      manager.save(key, testData, { version: '1.0.0' })

      // 尝试加载新版本
      const loaded = manager.load(key, '2.0.0')
      expect(loaded).toBeNull() // 没有迁移处理器时应该返回 null
    })

    it('应该执行数据迁移', () => {
      const oldData = { name: 'test' }
      const key = 'test_key'

      // 注册迁移处理器
      manager.registerMigration(key, {
        from: '1.0.0',
        to: '2.0.0',
        migrate: (data) => ({
          ...data,
          migrated: true,
          version: '2.0.0',
        }),
      })

      // 保存旧版本数据
      manager.save(key, oldData, { version: '1.0.0' })

      // 加载新版本（应该触发迁移）
      const loaded = manager.load(key, '2.0.0')
      expect(loaded).toEqual({
        name: 'test',
        migrated: true,
        version: '2.0.0',
      })
    })
  })

  describe('数据过期处理', () => {
    it('应该处理过期数据', async () => {
      const testData = { name: 'test' }
      const key = 'test_key'

      // 保存即将过期的数据
      manager.save(key, testData, {
        version: '1.0.0',
        ttl: 100, // 100ms 后过期
      })

      // 立即加载应该成功
      let loaded = manager.load(key, '1.0.0')
      expect(loaded).toEqual(testData)

      // 等待过期
      await new Promise((resolve) => setTimeout(resolve, 150))

      // 过期后加载应该返回 null
      loaded = manager.load(key, '1.0.0')
      expect(loaded).toBeNull()
    })
  })

  describe('数据完整性验证', () => {
    it('应该检测数据损坏', () => {
      const key = 'test_key'

      // 手动写入损坏的数据
      localStorage.setItem(key, '{"invalid": json}')

      const loaded = manager.load(key)
      expect(loaded).toBeNull()

      // 损坏的数据应该被删除
      expect(localStorage.getItem(key)).toBeNull()
    })

    it('应该验证数据校验和', () => {
      const testData = { name: 'test' }
      const key = 'test_key'

      // 保存数据
      manager.save(key, testData, { version: '1.0.0' })

      // 获取存储的原始数据
      const storedRaw = localStorage.getItem(key)
      expect(storedRaw).toBeTruthy()

      // 修改存储的数据（模拟损坏）
      const stored = JSON.parse(storedRaw!)
      stored.data.name = 'modified'
      localStorage.setItem(key, JSON.stringify(stored))

      // 加载时应该检测到损坏
      const loaded = manager.load(key, '1.0.0')
      expect(loaded).toBeNull()
    })
  })

  describe('存储空间管理', () => {
    it('应该提供存储统计信息', () => {
      const testData = { name: 'test', data: 'x'.repeat(1000) }

      manager.save('key1', testData)
      manager.save('key2', testData)

      const stats = manager.getStorageStats()
      expect(stats.totalKeys).toBeGreaterThan(0)
      expect(stats.usedSpace).toBeGreaterThan(0)
      expect(stats.items).toHaveLength(stats.totalKeys)
    })

    it('应该能够导出和导入数据', () => {
      const testData1 = { name: 'test1' }
      const testData2 = { name: 'test2' }

      manager.save('key1', testData1)
      manager.save('key2', testData2)

      // 导出数据
      const exported = manager.exportData(['key1', 'key2'])
      expect(exported).toBeTruthy()

      // 清空并导入
      localStorage.clear()
      const imported = manager.importData(exported)
      expect(imported).toBe(true)

      // 验证导入的数据
      const loaded1 = manager.load('key1')
      const loaded2 = manager.load('key2')
      expect(loaded1).toEqual(testData1)
      expect(loaded2).toEqual(testData2)
    })
  })
})

describe('usePersistence Composable', () => {
  let pinia: any

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('应该自动保存响应式数据', async () => {
    const testRef = ref('initial')

    const _persistence = usePersistence({
      key: 'test_store',
      version: '1.0.0',
      include: ['testRef'],
      autoSave: true,
      saveDelay: 100,
      store: { testRef },
    })

    // 修改数据
    testRef.value = 'modified'

    // 等待防抖延迟
    await new Promise((resolve) => setTimeout(resolve, 150))

    // 检查是否已保存
    const loaded = persistenceManager.load('store_test_store', '1.0.0')
    expect(loaded).toEqual({ testRef: 'modified' })
  })

  it('应该在挂载时自动加载数据', async () => {
    // 预先保存数据
    persistenceManager.save('store_test_store', { testRef: 'saved_value' }, { version: '1.0.0' })

    const testRef = ref('initial')

    // 创建持久化实例（模拟组件挂载）
    const _persistence = usePersistence({
      key: 'test_store',
      version: '1.0.0',
      include: ['testRef'],
      autoSave: false,
      autoLoad: true,
      store: { testRef },
    })

    // 手动触发加载（在真实环境中由 onMounted 触发）
    _persistence.load()

    expect(testRef.value).toBe('saved_value')
  })

  it('应该支持手动保存和清除', () => {
    const testRef = ref('test_value')

    const persistence = usePersistence({
      key: 'test_store',
      version: '1.0.0',
      include: ['testRef'],
      autoSave: false,
      store: { testRef },
    })

    // 手动保存
    persistence.save()

    // 验证保存
    const loaded = persistenceManager.load('store_test_store', '1.0.0')
    expect(loaded).toEqual({ testRef: 'test_value' })

    // 手动清除
    persistence.clear()

    // 验证清除
    const afterClear = persistenceManager.load('store_test_store', '1.0.0')
    expect(afterClear).toBeNull()
  })
})

describe('useMultiConfig Composable', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('应该能够保存和加载多个配置', () => {
    const testData = ref('config1_data')

    const multiConfig = useMultiConfig({
      store: { testData },
      configKey: 'test_configs',
    })

    // 保存配置
    const saved = multiConfig.saveConfig('配置1', '这是第一个配置')
    expect(saved).toBe(true)

    // 修改数据
    testData.value = 'config2_data'

    // 保存另一个配置
    multiConfig.saveConfig('配置2', '这是第二个配置')

    // 获取配置列表
    const configs = multiConfig.getConfigs()
    expect(configs).toHaveLength(2)
    expect(configs[0].name).toBe('配置2') // 最新的在前面
    expect(configs[1].name).toBe('配置1')

    // 加载第一个配置
    const loaded = multiConfig.loadConfig('配置1')
    expect(loaded).toBe(true)
    expect(testData.value).toBe('config1_data')
  })

  it('应该限制配置数量', () => {
    const testData = ref('data')

    const multiConfig = useMultiConfig({
      store: { testData },
      configKey: 'test_configs',
      maxConfigs: 2,
    })

    // 保存超过限制的配置
    multiConfig.saveConfig('配置1')
    multiConfig.saveConfig('配置2')
    multiConfig.saveConfig('配置3')

    const configs = multiConfig.getConfigs()
    expect(configs).toHaveLength(2)
    expect(configs.map((c) => c.name)).toEqual(['配置3', '配置2'])
  })

  it('应该能够删除配置', () => {
    const testData = ref('data')

    const multiConfig = useMultiConfig({
      store: { testData },
      configKey: 'test_configs',
    })

    multiConfig.saveConfig('配置1')
    multiConfig.saveConfig('配置2')

    // 删除配置
    const deleted = multiConfig.deleteConfig('配置1')
    expect(deleted).toBe(true)

    const configs = multiConfig.getConfigs()
    expect(configs).toHaveLength(1)
    expect(configs[0].name).toBe('配置2')
  })
})

describe('useHistory Composable', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('应该记录历史并支持恢复', () => {
    const testData = ref('initial')

    const history = useHistory({
      store: { testData },
      historyKey: 'test_history',
      maxHistory: 10,
    })

    // 添加历史记录
    testData.value = 'state1'
    history.addToHistory('第一次修改')

    testData.value = 'state2'
    history.addToHistory('第二次修改')

    // 获取历史列表
    const historyList = history.getHistory()
    expect(historyList).toHaveLength(2)
    expect(historyList[0].description).toBe('第二次修改')
    expect(historyList[1].description).toBe('第一次修改')

    // 恢复历史
    const restored = history.restoreFromHistory(historyList[1].id)
    expect(restored).toBe(true)
    expect(testData.value).toBe('state1')
  })

  it('应该限制历史记录数量', () => {
    const testData = ref('data')

    const history = useHistory({
      store: { testData },
      historyKey: 'test_history',
      maxHistory: 2,
    })

    // 添加超过限制的历史记录
    history.addToHistory('记录1')
    history.addToHistory('记录2')
    history.addToHistory('记录3')

    const historyList = history.getHistory()
    expect(historyList).toHaveLength(2)
    expect(historyList.map((h) => h.description)).toEqual(['记录3', '记录2'])
  })
})

describe('LL1 Store 持久化集成', () => {
  let pinia: any

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)

    // Mock API 调用
    vi.mock('@/api', () => ({
      getLL1AnalyseAPI: vi.fn().mockResolvedValue({
        data: {
          code: 200,
          data: {
            S: 'E',
            Vn: ['E', 'T', 'F'],
            Vt: ['+', '*', '(', ')', 'id'],
            first: { E: ['+', 'id'], T: ['*', 'id'] },
            follow: { E: ['$'], T: ['+', '$'] },
            formulas_dict: { E: ['E+T', 'T'], T: ['T*F', 'F'] },
            table: {},
            isLL1: true,
          },
        },
      }),
    }))
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('应该持久化用户输入的产生式', async () => {
    const ll1Store = useLL1Store()

    // 添加产生式
    ll1Store.addProduction('E -> E + T')
    ll1Store.addProduction('E -> T')

    // 等待自动保存
    await new Promise((resolve) => setTimeout(resolve, 600))

    // 创建新的 store 实例模拟页面刷新
    const newLL1Store = useLL1Store()
    newLL1Store.persistence.load()

    expect(newLL1Store.productions).toEqual(['E -> E + T', 'E -> T'])
  })

  it('应该保存和加载多个配置', () => {
    const ll1Store = useLL1Store()

    // 设置第一个配置
    ll1Store.addProduction('E -> E + T')
    ll1Store.setInputString('id + id')

    // 保存配置
    const saved = ll1Store.configs.save('算术表达式', 'LL1算术表达式文法')
    expect(saved).toBe(true)

    // 清空并设置第二个配置
    ll1Store.clearProductions()
    ll1Store.setInputString('')
    ll1Store.addProduction('S -> a')

    // 加载第一个配置
    const loaded = ll1Store.configs.load('算术表达式')
    expect(loaded).toBe(true)
    expect(ll1Store.productions).toEqual(['E -> E + T'])
    expect(ll1Store.inputString).toBe('id + id')
  })

  it('应该记录操作历史', async () => {
    const ll1Store = useLL1Store()

    // 设置产生式
    ll1Store.addProduction('E -> E + T')
    ll1Store.addProduction('E -> T')

    // 执行分析（这会触发历史记录）
    await ll1Store.performLL1Analysis()

    // 检查历史记录
    const history = ll1Store.history.list()
    expect(history).toHaveLength(1)
    expect(history[0].description).toContain('LL1分析')
  })
})

describe('错误处理和边界情况', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('应该处理 localStorage 不可用的情况', () => {
    // Mock localStorage 抛出异常
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem')
    mockSetItem.mockImplementation(() => {
      throw new Error('Storage not available')
    })

    const manager = PersistenceManager.getInstance()
    const saved = manager.save('test_key', { data: 'test' })

    expect(saved).toBe(false)
  })

  it('应该处理存储空间不足的情况', () => {
    // Mock localStorage 抛出 QuotaExceededError
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem')
    mockSetItem.mockImplementation(() => {
      const error = new Error('Storage quota exceeded')
      error.name = 'QuotaExceededError'
      throw error
    })

    const manager = PersistenceManager.getInstance()
    const saved = manager.save('test_key', { data: 'test' })

    expect(saved).toBe(false)
  })

  it('应该处理无效的 JSON 数据', () => {
    // 手动设置无效的 JSON
    localStorage.setItem('invalid_key', 'invalid json {')

    const manager = PersistenceManager.getInstance()
    const loaded = manager.load('invalid_key')

    expect(loaded).toBeNull()
    // 无效数据应该被删除
    expect(localStorage.getItem('invalid_key')).toBeNull()
  })
})

describe('性能测试', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('应该在合理时间内保存大量数据', () => {
    const manager = PersistenceManager.getInstance()
    const largeData = {
      items: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `item_${i}`,
        data: 'x'.repeat(100),
      })),
    }

    const startTime = performance.now()
    const saved = manager.save('large_data', largeData)
    const endTime = performance.now()

    expect(saved).toBe(true)
    expect(endTime - startTime).toBeLessThan(100) // 应该在 100ms 内完成
  })

  it('应该高效处理频繁的防抖保存', async () => {
    const testRef = ref('initial')

    const _persistence = usePersistence({
      key: 'debounce_test',
      version: '1.0.0',
      include: ['testRef'],
      autoSave: true,
      saveDelay: 100,
      store: { testRef },
    })

    // 快速连续修改数据
    for (let i = 0; i < 10; i++) {
      testRef.value = `value_${i}`
      await nextTick()
    }

    // 等待防抖完成
    await new Promise((resolve) => setTimeout(resolve, 150))

    // 应该只保存最后一次的值
    const loaded = persistenceManager.load('store_debounce_test', '1.0.0')
    expect(loaded).toEqual({ testRef: 'value_9' })
  })
})
