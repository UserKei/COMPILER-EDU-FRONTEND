import request from '@/lib/request'
import type { ApiResponse, LRAnalysisResult, AnalysisStepInfo } from '@/types'

/**
 * LR0语法分析
 * @param inpProductions 产生式数组
 * @returns LR0分析结果
 */
export const getLR0AnalyseAPI = (inpProductions: string[]) => {
  return request.post<ApiResponse<LRAnalysisResult>>('/api/LR0Analyse', { inpProductions })
}

/**
 * LR0语法分析输入串
 * @param inpProductions 产生式数组
 * @param inpStr 输入串
 * @returns LR0分析输入串结果
 */
export const LR0AnalyseInpStrAPI = (inpProductions: string[], inpStr: string) => {
  return request.post<ApiResponse<AnalysisStepInfo>>('/api/LR0AnalyseInp', { inpProductions, inpStr })
}
