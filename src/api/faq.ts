import { http } from './http'

export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

export interface FaqApiItem {
  id: number
  knowledge_id: string
  version: number
  category_l1: string | null
  category_l2: string | null
  category_l3: string | null
  standard_question: string
  paraphrases: string[]
  answer: string
  user_role: string
  business_type: string | null
  risk_level: number
  auth_required: boolean
  auto_answer: boolean
  human_required: boolean
  status: number
  review_status: number
  updated_at: string
  updated_by: string | null
}

export interface FaqListParams {
  page: number
  page_size: number
  keyword?: string
  category_l1?: string
  status?: number
}

export interface FaqListData {
  items: FaqApiItem[]
  pagination: {
    page: number
    page_size: number
    total: number
  }
}

export interface FaqUpdatePayload {
  version: number
  category_l1: string | null
  category_l2: string | null
  category_l3: string | null
  standard_question: string
  paraphrases: string[]
  answer: string
  user_role: string
  business_type: string | null
  risk_level: number
  auth_required: boolean
  auto_answer: boolean
  human_required: boolean
  status: number
  review_status: number
  updated_by: string
}

export async function getFaqList(params: FaqListParams) {
  const response = await http.get<ApiResponse<FaqListData>>('/faqs', { params })
  return response.data.data
}

export async function updateFaq(faqId: number, payload: FaqUpdatePayload) {
  const response = await http.put<ApiResponse<FaqApiItem>>(`/faqs/${faqId}`, payload)
  return response.data.data
}

export async function deleteFaq(faqId: number, updatedBy = '客服运营') {
  const response = await http.delete<ApiResponse<{ id: number; status: number }>>(
    `/faqs/${faqId}`,
    { params: { updated_by: updatedBy } },
  )
  return response.data.data
}

