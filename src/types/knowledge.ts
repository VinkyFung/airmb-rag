export type KnowledgeStatus = '已发布' | '草稿' | '已停用'
export type RiskLevel = '低' | '中' | '高'
export type TaskStatus = '已完成' | '解析中' | '等待确认' | '失败'
export type EmbeddingStatus = '未生成' | '已生成' | '生成失败' | '生成中'

export interface FaqItem {
  id: number
  knowledgeId: string
  categoryL1: string
  categoryL2: string
  businessType: string
  question: string
  paraphrases: string[]
  answer: string
  risk: RiskLevel
  authRequired: boolean
  autoAnswer: boolean
  status: KnowledgeStatus
  embeddingStatus: EmbeddingStatus
  embeddingError?: string
  embeddingInputHash?: string
  updatedAt: string
  updatedBy: string
  version: number
  categoryL3?: string
  userRole?: string
  humanRequired?: boolean
  reviewStatus?: number
}

export interface TermItem {
  id: number
  term: string
  aliases: string[]
  category: string
  definition: string
  source: string
  chapter: string
  status: KnowledgeStatus
  updatedAt: string
}

export interface DocumentItem {
  id: number
  name: string
  category: string
  pages: number
  chunks: number
  vectorized: number
  status: KnowledgeStatus
  parseStatus: string
  updatedAt: string
  version: string
}

export interface ImportTask {
  id: string
  fileName: string
  type: 'Excel' | 'Word' | 'PDF'
  status: TaskStatus
  stage: string
  progress: number
  added: number
  updated: number
  unchanged: number
  warnings: number
  errors: number
  createdAt: string
}

export interface SourceFile {
  id: string
  name: string
  type: 'Excel' | 'Word' | 'PDF'
  size: string
  uploadedAt: string
  parseStatus: '解析成功' | '解析中' | '解析失败' | '等待解析'
  knowledgeCount: number
  version: string
  hash: string
}
