// SLR1分析结果类型
export interface SLR1AnalysisResult {
  S: string
  Vn: string[]
  Vt: string[]
  formulas_list: string[]
  dot_items: string[]
  all_dfa: any[]
  actions: Record<string, string>
  gotos: Record<string, string>
  isSLR1: boolean
  SLR1_dot_str: string
}

// SLR1校验数据项接口 (与LR0共享类似结构但独立管理)
export interface SLR1ValidationItem {
  id: string
  category: 'action' | 'goto' | 'dfa' | 'item'
  state: string
  check: boolean
  coords?: { x: number; y: number }
  data: any
}

// SLR1校验数据结构
export interface DataSLR1Type {
  actionTable: SLR1ValidationItem[]
  gotoTable: SLR1ValidationItem[]
  dfaStates: SLR1ValidationItem[]
  dotItems: SLR1ValidationItem[]
}

// SLR1输入串分析结果
export interface SLR1AnalysisStepInfo {
  info_res: string
  info_step: number[]
  info_msg: string[]
  info_stack: string[]
  info_str: string[]
  info_action: string[]
}
