// 通用API响应格式
export interface ApiResponse<T = any> {
  code: number
  data?: T
  message?: string
  msg?: string
}

// LL1分析结果类型
export interface LL1AnalysisResult {
  S: string
  Vn: string[]
  Vt: string[]
  formulas_dict: Record<string, string[]>
  first: Record<string, string[]>
  follow: Record<string, string[]>
  table: Record<string, string>
  isLL1: boolean
}

// LR0/SLR1分析结果类型
export interface LRAnalysisResult {
  S: string
  Vn: string[]
  Vt: string[]
  formulas_list: string[]
  dot_items: string[]
  all_dfa: any[]
  actions: Record<string, string>
  gotos: Record<string, string>
  isLR0?: boolean
  isSLR1?: boolean
  LR0_dot_str?: string
  SLR1_dot_str?: string
}

// 有限自动机分析结果类型
export interface FAResult {
  table: any
  table_to_num: any
  table_to_num_min: any
  P: any
  P_change: any
  NFA_dot_str: string
  DFA_dot_str: string
  Min_DFA_dot_str: string
}

// 分析步骤信息类型（用于输入串分析）
export interface AnalysisStepInfo {
  [key: string]: any
}
