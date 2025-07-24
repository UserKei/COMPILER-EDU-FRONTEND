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

// FA校验数据结构（前端处理后的格式）
export interface DataFAType {
  table: FAValidationItem[] // NFA->DFA转换表
  table_to_num: FAValidationItem[] // DFA状态转换表
  table_to_num_min: FAValidationItem[] // 最小化DFA状态转换表
  p_list: FAValidationItem[] // 最小化结果集合
}

// FA专用的校验数据项
export interface FAValidationItem {
  id: string
  category: 'blank' | 'onlyRead' | 'writed'
  state: 'normal' | 'waitWriteIn' | 'isCorrect' | 'isError'
  check: 'normal' | 'isCorrect' | 'isError'
  text: string
  coords?: string[]
}
