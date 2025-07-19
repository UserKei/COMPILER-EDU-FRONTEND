import request from '@/lib/request'
import type { ApiResponse } from '@/types'

/**
 * 测试API连接
 * @returns 测试结果
 */
export const testAPI = () => {
  return request.get<ApiResponse>('/api/test')
}
