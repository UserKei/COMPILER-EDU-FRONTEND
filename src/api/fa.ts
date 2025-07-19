import request from '@/lib/request'
import type { ApiResponse, FAResult } from '@/types'

/**
 * 正则表达式转DFAM
 * @param inpRegex 输入的正则表达式
 * @returns 有限自动机分析结果
 */
export const getDFAM = (inpRegex: string) => {
  return request.post<ApiResponse<FAResult>>('/api/Regex_to_DFAM', { inpRegex })
}
