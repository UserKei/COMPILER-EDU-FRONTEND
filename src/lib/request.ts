import axios from 'axios'

const baseURL = 'http://127.0.0.1:5000' // 本地调试地址

const instance = axios.create({
  baseURL,
  timeout: 100000, // 超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    return config
  },
  (err) => Promise.reject(err)
)

// 响应拦截器
instance.interceptors.response.use(
  (res) => {
    if (res.data.code === 0) {
      return res
    }
    // 处理业务失败
    console.error(res.data.message || '服务异常')
    return Promise.reject(res.data)
  },
  (err) => {
    // 处理网络错误
    console.error(err.response?.data?.message || '服务异常')
    return Promise.reject(err)
  }
)

export default instance
