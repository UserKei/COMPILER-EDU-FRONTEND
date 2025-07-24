// 通用API响应格式
export interface ApiResponse<T = any> {
  code: number
  data?: T
  message?: string
  msg?: string
}

// 校验数据项的通用接口
export interface ValidationItem {
  id: string
  category: 'blank' | 'onlyRead' | 'writed'
  state: 'normal' | 'waitWriteIn' | 'isCorrect' | 'isError'
  check: 'normal' | 'isCorrect' | 'isError'
  text: string
  coords?: string[]
  symbol?: string
}

// 分析步骤信息类型（用于输入串分析）
export interface AnalysisStepInfo {
  info_res: string
  info_step: number[]
  info_msg: string[]
  info_stack: string[]
  info_str: string[]
  [key: string]: any
}
