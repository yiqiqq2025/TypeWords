import axios, { AxiosInstance } from 'axios'
import { env } from "@/config/env.ts";
import Toast from "@/components/base/toast/Toast.ts";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: env.api,
  timeout: 15000,
})

axiosInstance.interceptors.request.use(
  (config) => {
    // console.log('config', config)
    // if (config.url === 'https://api.fanyi.baidu.com/api/trans/vip/translate') {
    //   config.url = '/baidu'
    // }
    return config
  },
  error => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
  // 响应正常的处理
  (response) => {
    // console.log(response)
    // console.log(response.data)
    const {data} = response
    if (response.status !== 200) {
      Toast.warning(response.statusText)
      return Promise.reject(data)
    }
    if (data === null) {
      return Promise.resolve({
        code: '009900',
        msg: '系统出现错误',
        data: {},
      })
    }
    return Promise.resolve(data)
  },
  // 请求出错的处理
  (error) => {
    console.log(error)
    if (error.response === undefined && error.status === undefined) {
      return Promise.resolve({
        code: '009900',
        msg: '服务器响应超时',
        data: null,
      })
    }
    if (error.response.status >= 500) {
      return Promise.resolve({
        code: '009900',
        msg: '服务器出现错误',
        data: null,
      })
    }
    if (error.response.status === 401) {
      return Promise.resolve({
        code: '009900',
        msg: '用户名或密码不正确',
        data: null,
      })
    }
    const {data} = error.response
    if (data.code !== undefined) {
      return Promise.resolve({
        code: data.code,
        msg: data.msg,
      })
    }
    return Promise.resolve({
      code: '009900',
      msg: data.msg,
      data: null,
    })
  },
)


async function request(url, data = {}, params = {}, method) {
  return axiosInstance({
    url: '/v1/' + url,
    method,
    data,
    params,
  })
}

export default request
