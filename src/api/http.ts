import axios, { AxiosError } from 'axios'

export interface ApiErrorBody {
  code?: string
  message?: string
  details?: unknown
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getApiErrorMessage(error: unknown, fallback = '请求失败，请稍后重试') {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorBody | undefined)?.message || fallback
  }
  return fallback
}

export function getApiErrorCode(error: unknown) {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorBody | undefined)?.code
  }
  return undefined
}

