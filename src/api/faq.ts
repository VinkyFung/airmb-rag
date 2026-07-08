import { EMBEDDING_API_TIMEOUT, http } from './http'

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

export interface FaqEmbeddingData {
  faq_id: number
  knowledge_id: string
  embedding_status: number
  embedding_input_hash: string | null
  embedding_model: string
  embedding_dimension: number
}

export interface FaqEmbeddingRebuildPayload {
  limit: number
  only_pending: boolean
}

export interface FaqEmbeddingRebuildItem {
  faq_id: number
  success: boolean
  message: string
}

export interface FaqEmbeddingRebuildData {
  total: number
  succeeded: number
  failed: number
  items: FaqEmbeddingRebuildItem[]
}

export interface FaqSearchPayload {
  query: string
  top_k: number
}

export interface FaqSearchItem {
  faq_id: number
  knowledge_id: string | null
  score: number
  standard_question: string | null
  answer: string | null
  category_l1: string | null
  category_l2: string | null
  category_l3: string | null
  status: number | null
}

export interface FaqSearchData {
  query: string
  top_k: number
  items: FaqSearchItem[]
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

export async function generateFaqEmbedding(faqId: number) {
  const response = await http.post<ApiResponse<FaqEmbeddingData>>(
    `/faqs/${faqId}/embedding`,
    undefined,
    { timeout: EMBEDDING_API_TIMEOUT },
  )
  return response.data.data
}

export async function rebuildFaqEmbeddings(payload: FaqEmbeddingRebuildPayload) {
  const response = await http.post<ApiResponse<FaqEmbeddingRebuildData>>(
    '/faqs/embeddings/rebuild',
    payload,
    { timeout: EMBEDDING_API_TIMEOUT },
  )
  return response.data.data
}

export async function searchFaqs(payload: FaqSearchPayload) {
  const response = await http.post<ApiResponse<FaqSearchData>>('/search/faqs', payload, {
    timeout: EMBEDDING_API_TIMEOUT,
  })
  return response.data.data
}
