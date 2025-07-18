<template>
  <div class="regex-input-step">
    <!-- 步骤头部 -->
    <div class="step-header">
      <div class="flex items-center gap-4">
        <div class="step-icon">
          <Icon icon="lucide:edit-3" class="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">输入正则表达式</h2>
          <p class="text-gray-600 mt-1">第一步：定义要转换为有限自动机的正则表达式</p>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="step-content">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：输入区域 -->
        <div class="input-section">
          <div class="bg-gray-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">正则表达式输入</h3>

            <!-- 输入框 -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                正则表达式
              </label>
              <input
                v-model="regexInput"
                type="text"
                placeholder="例如: (a|b)*abb"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                @keyup.enter="validateRegex"
              />
            </div>

            <!-- 快速示例 -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                快速示例
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="example in examples"
                  :key="example.pattern"
                  @click="regexInput = example.pattern"
                  class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {{ example.pattern }}
                </button>
              </div>
            </div>

            <!-- 验证和操作 -->
            <div class="flex gap-3">
              <button
                @click="validateRegex"
                :disabled="!regexInput.trim()"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Icon icon="lucide:check-circle" class="w-4 h-4 inline mr-2" />
                验证正则
              </button>
              <button
                @click="clearInput"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon icon="lucide:x" class="w-4 h-4 inline mr-2" />
                清空
              </button>
            </div>

            <!-- 验证结果 -->
            <div v-if="validationResult" class="mt-4">
              <div
                :class="[
                  'p-3 rounded-lg',
                  validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                ]"
              >
                <div class="flex items-start gap-2">
                  <Icon
                    :icon="validationResult.valid ? 'lucide:check-circle' : 'lucide:alert-circle'"
                    :class="[
                      'w-5 h-5 flex-shrink-0 mt-0.5',
                      validationResult.valid ? 'text-green-600' : 'text-red-600'
                    ]"
                  />
                  <div>
                    <p
                      :class="[
                        'font-medium',
                        validationResult.valid ? 'text-green-800' : 'text-red-800'
                      ]"
                    >
                      {{ validationResult.valid ? '正则表达式有效' : '正则表达式无效' }}
                    </p>
                    <p
                      :class="[
                        'text-sm mt-1',
                        validationResult.valid ? 'text-green-600' : 'text-red-600'
                      ]"
                    >
                      {{ validationResult.message }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：说明和预览 -->
        <div class="info-section">
          <div class="bg-blue-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">支持的语法</h3>

            <div class="space-y-3 text-sm">
              <div class="flex items-start gap-3">
                <code class="px-2 py-1 bg-white rounded text-blue-600 font-mono">a|b</code>
                <span class="text-gray-700">选择：匹配 a 或 b</span>
              </div>
              <div class="flex items-start gap-3">
                <code class="px-2 py-1 bg-white rounded text-blue-600 font-mono">ab</code>
                <span class="text-gray-700">连接：匹配 a 后跟 b</span>
              </div>
              <div class="flex items-start gap-3">
                <code class="px-2 py-1 bg-white rounded text-blue-600 font-mono">a*</code>
                <span class="text-gray-700">克林闭包：匹配零个或多个 a</span>
              </div>
              <div class="flex items-start gap-3">
                <code class="px-2 py-1 bg-white rounded text-blue-600 font-mono">a+</code>
                <span class="text-gray-700">正闭包：匹配一个或多个 a</span>
              </div>
              <div class="flex items-start gap-3">
                <code class="px-2 py-1 bg-white rounded text-blue-600 font-mono">(ab)</code>
                <span class="text-gray-700">分组：将 ab 作为一个整体</span>
              </div>
            </div>
          </div>

          <!-- 当前输入预览 -->
          <div v-if="regexInput" class="mt-6 bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">当前输入</h3>
            <div class="font-mono text-lg bg-gray-100 p-3 rounded border">
              {{ regexInput }}
            </div>
            <div v-if="parsedInfo" class="mt-4 text-sm text-gray-600">
              <p><strong>解析信息：</strong></p>
              <ul class="list-disc list-inside space-y-1 mt-2">
                <li>字符数：{{ parsedInfo.charCount }}</li>
                <li>操作符数：{{ parsedInfo.operatorCount }}</li>
                <li>最大嵌套深度：{{ parsedInfo.nestingDepth }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤操作栏 -->
    <div class="step-actions">
      <div class="flex justify-between items-center">
        <button
          @click="$emit('prev-step')"
          disabled
          class="px-6 py-2 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed"
        >
          <Icon icon="lucide:chevron-left" class="w-4 h-4 inline mr-2" />
          上一步
        </button>

        <div class="text-sm text-gray-500">
          步骤 1 / 6
        </div>

        <button
          @click="proceedToNext"
          :disabled="!isValidAndReady"
          :class="[
            'px-6 py-2 rounded-lg transition-colors',
            isValidAndReady
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          下一步
          <Icon icon="lucide:chevron-right" class="w-4 h-4 inline ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'

defineEmits<{
  'next-step': []
  'prev-step': []
  'complete': [data: any]
}>()

// 正则表达式输入
const regexInput = ref('')

// 验证结果
const validationResult = ref<{
  valid: boolean
  message: string
} | null>(null)

// 示例正则表达式
const examples = [
  { pattern: '(a|b)*abb', description: '以 abb 结尾的字符串' },
  { pattern: 'a*b+', description: '零个或多个 a 后跟一个或多个 b' },
  { pattern: '(a|b)*a(a|b)', description: '倒数第二个字符是 a' },
  { pattern: '(0|1)*101', description: '二进制数以 101 结尾' },
  { pattern: 'ab*c', description: 'a 后跟零个或多个 b 再跟 c' }
]

// 解析信息
const parsedInfo = computed(() => {
  if (!regexInput.value) return null

  const charCount = regexInput.value.length
  const operatorCount = (regexInput.value.match(/[|*+()]/g) || []).length

  // 计算嵌套深度
  let depth = 0
  let maxDepth = 0
  for (const char of regexInput.value) {
    if (char === '(') {
      depth++
      maxDepth = Math.max(maxDepth, depth)
    } else if (char === ')') {
      depth--
    }
  }

  return {
    charCount,
    operatorCount,
    nestingDepth: maxDepth
  }
})

// 是否验证通过且准备就绪
const isValidAndReady = computed(() => {
  return validationResult.value?.valid === true
})

// 验证正则表达式
const validateRegex = () => {
  if (!regexInput.value.trim()) {
    validationResult.value = {
      valid: false,
      message: '请输入正则表达式'
    }
    return
  }

  try {
    // 基本语法检查
    const pattern = regexInput.value

    // 检查括号匹配
    let openCount = 0
    for (const char of pattern) {
      if (char === '(') openCount++
      else if (char === ')') openCount--
      if (openCount < 0) {
        throw new Error('括号不匹配：右括号多于左括号')
      }
    }
    if (openCount > 0) {
      throw new Error('括号不匹配：左括号多于右括号')
    }

    // 检查空操作符
    if (pattern.includes('||') || pattern.includes('**') || pattern.includes('++')) {
      throw new Error('不允许连续的操作符')
    }

    // 检查开头结尾的操作符
    if (/^[|*+]/.test(pattern)) {
      throw new Error('正则表达式不能以操作符开头')
    }
    if (/[|]$/.test(pattern)) {
      throw new Error('正则表达式不能以 | 结尾')
    }

    validationResult.value = {
      valid: true,
      message: '正则表达式语法正确，可以转换为 NFA'
    }
  } catch (error) {
    validationResult.value = {
      valid: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 清空输入
const clearInput = () => {
  regexInput.value = ''
  validationResult.value = null
}

// 进入下一步
const proceedToNext = () => {
  if (isValidAndReady.value) {
    // 发送完成事件，传递正则表达式数据
    const stepData = {
      regex: regexInput.value,
      parsedInfo: parsedInfo.value,
      timestamp: new Date().toISOString()
    }

    // 触发完成事件
    setTimeout(() => {
      // 模拟一些处理时间
      console.log('Step 1 completed with data:', stepData)

      // 进入下一步
      if (confirm('确认使用此正则表达式进行 Thompson 构造生成 NFA？')) {
        // 这里可以保存数据到状态管理
        localStorage.setItem('fa-step1-data', JSON.stringify(stepData))

        // 进入下一步
        document.dispatchEvent(new CustomEvent('next-step'))
      }
    }, 100)
  }
}

// 监听输入变化，自动验证
watch(regexInput, (newValue) => {
  if (newValue && validationResult.value) {
    // 清空之前的验证结果，用户修改时重新验证
    validationResult.value = null
  }
})
</script>

<style scoped>
.step-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.step-icon {
  width: 3rem;
  height: 3rem;
  background: #dbeafe;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  padding: 2rem;
}

.step-actions {
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 输入框焦点样式 */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 代码样式 */
code {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

/* 动画效果 */
.step-content {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
