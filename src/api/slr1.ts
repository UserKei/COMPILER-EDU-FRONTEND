import request from '@/lib/request'
import type { ApiResponse, LRAnalysisResult, AnalysisStepInfo } from '@/types'

/**
 * SLR1语法分析
 * @param inpProductions 产生式数组
 * @returns SLR1分析结果
 */
export const getSLR1AnalyseAPI = (inpProductions: string[]) => {
  return request.post<ApiResponse<LRAnalysisResult>>('/api/SLR1Analyse', { inpProductions })
}

/**
 * SLR1语法分析输入串
 * @param inpProductions 产生式数组
 * @param inpStr 输入串
 * @returns SLR1分析输入串结果
 */
export const SLR1AnalyseInpStrAPI = (inpProductions: string[], inpStr: string) => {
  return request.post<ApiResponse<AnalysisStepInfo>>('/api/SLR1AnalyseInp', { inpProductions, inpStr })
}
