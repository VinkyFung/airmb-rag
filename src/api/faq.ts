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
  embedding_status: number
  embedding_error: string | null
  embedding_input_hash: string | null
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

export interface FaqImportIssue {
  level: 'error' | 'warning'
  sheet: string
  row: number | null
  field: string | null
  message: string
}

export interface FaqImportPreviewItem {
  sheet: string
  row: number
  knowledge_id: string
  category_l1: string | null
  category_l2: string | null
  category_l3: string | null
  business_type: string | null
  standard_question: string
  paraphrases: string[]
  answer: string
  image_url: string | null
  risk_level: number
  auth_required: boolean
  auto_answer: boolean
  human_required: boolean
  status: number
  review_status: number
  blocked: boolean
  blocking_reasons: string[]
  warnings: string[]
}

export interface FaqImportSheetSummary {
  sheet: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
}

export interface FaqImportParseData {
  file_name: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
  warning_rows: number
  preview_limit: number
  sheets: FaqImportSheetSummary[]
  items: FaqImportPreviewItem[]
  issues: FaqImportIssue[]
}

export interface FaqImportConfirmItem {
  sheet: string
  row: number
  knowledge_id: string
  faq_id: number | null
  action: 'created' | 'updated' | 'failed' | 'skipped'
  success: boolean
  message: string
}

export interface FaqImportConfirmData {
  file_name: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
  created: number
  updated: number
  failed: number
  skipped: number
  status: number
  items: FaqImportConfirmItem[]
  issues: FaqImportIssue[]
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

export interface FaqBatchStatusPayload {
  ids: number[]
  updated_by?: string
}

export interface FaqBatchAllStatusPayload {
  updated_by?: string
}

export interface FaqBatchStatusItem {
  id: number
  success: boolean
  status: number | null
  message: string
}

export interface FaqBatchStatusData {
  requested: number
  succeeded: number
  failed: number
  status: number
  items: FaqBatchStatusItem[]
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
  faq_ids?: number[]
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

export type FaqEmbeddingTaskStatus = 'pending' | 'running' | 'succeeded' | 'partial_failed' | 'failed'

export interface FaqEmbeddingTaskData {
  task_id: string
  status: FaqEmbeddingTaskStatus
  limit: number
  only_pending: boolean
  faq_ids: number[] | null
  total: number
  progress: number
  succeeded: number
  failed: number
  message: string
  items: FaqEmbeddingRebuildItem[]
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export interface FaqSearchPayload {
  query: string
  top_k: number
}

export interface FaqSearchItem {
  faq_id: number
  knowledge_id: string | null
  rank: number | null
  score: number
  vector_score: number | null
  reranker_score: number | null
  rank_before_rerank: number | null
  standard_question: string | null
  answer: string | null
  category_l1: string | null
  category_l2: string | null
  category_l3: string | null
  status: number | null
}

export interface FaqSearchDebug {
  embedding_model: string
  embedding_dimension: number
  vector_collection: string
  query_length: number
  embedding_ms: number
  vector_search_ms: number
  reranker_enabled: boolean
  reranker_used: boolean
  reranker_model: string | null
  reranker_ms: number
  reranker_error: string | null
  candidate_top_k: number | null
  total_ms: number
  returned: number
}

export interface FaqSearchData {
  query: string
  top_k: number
  items: FaqSearchItem[]
  debug: FaqSearchDebug | null
}

export type ChatConfidence = 'high' | 'medium' | 'low' | 'none'

export interface ChatAskPayload {
  question: string
  top_k: number
}

export interface ChatAskData {
  question: string
  answer: string
  answerable: boolean
  confidence: ChatConfidence
  score: number | null
  sources: FaqSearchItem[]
  debug: FaqSearchDebug | null
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

export async function publishFaqs(payload: FaqBatchStatusPayload) {
  const response = await http.post<ApiResponse<FaqBatchStatusData>>(
    '/faqs/batch/publish',
    {
      updated_by: '客服运营',
      ...payload,
    },
    { timeout: EMBEDDING_API_TIMEOUT },
  )
  return response.data.data
}

export async function publishAllFaqs(payload: FaqBatchAllStatusPayload = {}) {
  const response = await http.post<ApiResponse<FaqBatchStatusData>>(
    '/faqs/batch/publish-all',
    {
      updated_by: '客服运营',
      ...payload,
    },
    { timeout: EMBEDDING_API_TIMEOUT },
  )
  return response.data.data
}

export async function disableFaqs(payload: FaqBatchStatusPayload) {
  const response = await http.post<ApiResponse<FaqBatchStatusData>>(
    '/faqs/batch/disable',
    {
      updated_by: '客服运营',
      ...payload,
    },
    { timeout: EMBEDDING_API_TIMEOUT },
  )
  return response.data.data
}

export async function parseFaqImport(file: File, previewLimit = 100) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await http.post<ApiResponse<FaqImportParseData>>('/faqs/import/parse', formData, {
    params: { preview_limit: previewLimit },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

export async function confirmFaqImport(file: File, status = 0, updatedBy = '客服运营') {
  const formData = new FormData()
  formData.append('file', file)
  const response = await http.post<ApiResponse<FaqImportConfirmData>>(
    '/faqs/import/confirm',
    formData,
    {
      params: { status, updated_by: updatedBy },
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: EMBEDDING_API_TIMEOUT,
    },
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
  const response = await http.post<ApiResponse<FaqEmbeddingTaskData>>(
    '/faqs/embeddings/rebuild',
    payload,
    { timeout: EMBEDDING_API_TIMEOUT },
  )
  return response.data.data
}

export async function getFaqEmbeddingTask(taskId: string) {
  const response = await http.get<ApiResponse<FaqEmbeddingTaskData>>(
    `/faqs/embeddings/tasks/${taskId}`,
  )
  return response.data.data
}

export async function searchFaqs(payload: FaqSearchPayload) {
  const response = await http.post<ApiResponse<FaqSearchData>>('/search/faqs', payload, {
    timeout: EMBEDDING_API_TIMEOUT,
  })
  return response.data.data
}

export async function askChat(payload: ChatAskPayload) {
  const response = await http.post<ApiResponse<ChatAskData>>('/chat/ask', payload, {
    timeout: EMBEDDING_API_TIMEOUT,
  })
  return response.data.data
}
