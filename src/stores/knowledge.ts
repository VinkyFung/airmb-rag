import { defineStore } from 'pinia'
import type { DocumentItem, FaqItem, ImportTask, SourceFile, TermItem } from '../types/knowledge'

const faqs: FaqItem[] = [
  { id: 1, knowledgeId: 'FAQ-ACCOUNT-001', categoryL1: '平台服务', categoryL2: '账户管理', businessType: '账户', question: '如何修改绑定手机号？', paraphrases: ['手机号怎么换', '原手机号不用了怎么办', '在哪里改手机号'], answer: '进入「我的-设置-账号与安全-手机号」，完成原手机号验证后可绑定新手机号。若原手机号已无法使用，请联系人工客服进行身份核验。', risk: '中', authRequired: true, autoAnswer: true, status: '已发布', updatedAt: '2026-07-05 16:24', updatedBy: '客服运营', version: 3 },
  { id: 2, knowledgeId: 'FAQ-TRADE-018', categoryL1: '交易服务', categoryL2: '订单管理', businessType: '订单', question: '拍下商品后多久需要付款？', paraphrases: ['订单付款时效', '下单后可以多久再付钱'], answer: '订单提交后请在 30 分钟内完成付款，超时未付款订单将自动关闭。具体倒计时以订单详情页展示为准。', risk: '低', authRequired: false, autoAnswer: true, status: '已发布', updatedAt: '2026-07-05 14:08', updatedBy: '李明', version: 5 },
  { id: 3, knowledgeId: 'FAQ-WALLET-006', categoryL1: '资金服务', categoryL2: '钱包提现', businessType: '钱包', question: '提现后多久到账？', paraphrases: ['提现一直没到账', '钱包提现时效'], answer: '提现申请审核通过后，通常在 1–3 个工作日内到账。实际到账时间受银行处理进度影响。', risk: '高', authRequired: true, autoAnswer: false, status: '已发布', updatedAt: '2026-07-04 18:42', updatedBy: '王琪', version: 2 },
  { id: 4, knowledgeId: 'FAQ-AFTERSALE-012', categoryL1: '交易服务', categoryL2: '售后服务', businessType: '售后', question: '收到的商品与描述不符怎么办？', paraphrases: ['实物和图片不一样', '卖家描述不符怎么退'], answer: '请在确认收货前发起售后申请，选择“商品与描述不符”，并上传清晰的商品照片及相关凭证。平台将在材料提交后介入核实。', risk: '中', authRequired: true, autoAnswer: true, status: '草稿', updatedAt: '2026-07-04 10:16', updatedBy: '陈晨', version: 1 },
  { id: 5, knowledgeId: 'FAQ-PUBLISH-009', categoryL1: '平台服务', categoryL2: '商品发布', businessType: '发布', question: '如何发布一件藏品？', paraphrases: ['怎么卖藏品', '发布商品入口在哪'], answer: '点击首页底部“发布”，按页面提示填写藏品名称、分类、品相和价格，并上传清晰图片后提交审核。', risk: '低', authRequired: true, autoAnswer: true, status: '已发布', updatedAt: '2026-07-03 09:31', updatedBy: '客服运营', version: 4 },
  { id: 6, knowledgeId: 'FAQ-ACCOUNT-014', categoryL1: '平台服务', categoryL2: '实名认证', businessType: '账户', question: '实名认证可以修改吗？', paraphrases: ['怎么换实名', '实名信息填错了'], answer: '实名认证信息涉及账户安全，暂不支持用户自行修改。如确需变更，请联系人工客服并按要求提交证明材料。', risk: '高', authRequired: true, autoAnswer: false, status: '已停用', updatedAt: '2026-07-02 15:20', updatedBy: '管理员', version: 2 },
]

const terms: TermItem[] = [
  { id: 1, term: '版别', aliases: ['版式', '品种'], category: '钱币基础', definition: '同一种钱币因制版、模具、铸造批次或细节差异形成的不同形态。', source: '钱币收藏专业术语手册.docx', chapter: '第一章 / 基础概念', status: '已发布', updatedAt: '2026-07-04' },
  { id: 2, term: '包浆', aliases: ['传世包浆'], category: '品相评级', definition: '钱币表面经过长期自然氧化、流通或存放形成的稳定色泽与表层状态。', source: '钱币收藏专业术语手册.docx', chapter: '第二章 / 品相描述', status: '已发布', updatedAt: '2026-07-04' },
  { id: 3, term: '原光', aliases: ['底光', '车轮光'], category: '品相评级', definition: '机制币铸造后表面保留的金属光泽，转动时常呈现放射状流动效果。', source: '评级标准说明 2026.docx', chapter: '光泽与表面', status: '草稿', updatedAt: '2026-07-03' },
  { id: 4, term: '母钱', aliases: ['雕母'], category: '古钱币', definition: '用于翻铸子钱或制作钱范的样钱，通常制作精整，文字和轮廓较深峻。', source: '古钱币名词集.docx', chapter: '铸造工艺', status: '已发布', updatedAt: '2026-07-01' },
]

const documents: DocumentItem[] = [
  { id: 1, name: '爱藏交易服务规则（2026年版）', category: '平台规则', pages: 42, chunks: 126, vectorized: 126, status: '已发布', parseStatus: '解析成功', updatedAt: '2026-07-05 11:26', version: 'v3' },
  { id: 2, name: '买家售后处理指南', category: '售后规则', pages: 18, chunks: 54, vectorized: 54, status: '已发布', parseStatus: '解析成功', updatedAt: '2026-07-04 15:03', version: 'v2' },
  { id: 3, name: '钱币评级入门手册', category: '专业知识', pages: 67, chunks: 184, vectorized: 121, status: '草稿', parseStatus: '向量生成中', updatedAt: '2026-07-05 17:44', version: 'v1' },
  { id: 4, name: '商家违规行为处置规范', category: '平台规则', pages: 25, chunks: 73, vectorized: 0, status: '草稿', parseStatus: '等待确认', updatedAt: '2026-07-03 13:20', version: 'v1' },
]

const tasks: ImportTask[] = [
  { id: 'JOB-20260705-008', fileName: '账户与交易FAQ_202607.xlsx', type: 'Excel', status: '已完成', stage: '发布知识库', progress: 100, added: 18, updated: 7, unchanged: 96, warnings: 2, errors: 0, createdAt: '2026-07-05 16:08' },
  { id: 'JOB-20260705-007', fileName: '钱币评级入门手册.pdf', type: 'PDF', status: '解析中', stage: '生成向量', progress: 72, added: 184, updated: 0, unchanged: 0, warnings: 5, errors: 0, createdAt: '2026-07-05 14:32' },
  { id: 'JOB-20260704-012', fileName: '钱币收藏专业术语手册.docx', type: 'Word', status: '等待确认', stage: '数据校验', progress: 58, added: 42, updated: 3, unchanged: 0, warnings: 4, errors: 0, createdAt: '2026-07-04 09:18' },
  { id: 'JOB-20260703-006', fileName: '历史平台规则.pdf', type: 'PDF', status: '失败', stage: '解析内容', progress: 24, added: 0, updated: 0, unchanged: 0, warnings: 0, errors: 1, createdAt: '2026-07-03 17:05' },
]

const files: SourceFile[] = [
  { id: 'FILE-1048', name: '账户与交易FAQ_202607.xlsx', type: 'Excel', size: '284 KB', uploadedAt: '2026-07-05 16:08', parseStatus: '解析成功', knowledgeCount: 121, version: 'file_v4', hash: 'a87f9c…1e42' },
  { id: 'FILE-1047', name: '钱币评级入门手册.pdf', type: 'PDF', size: '12.6 MB', uploadedAt: '2026-07-05 14:32', parseStatus: '解析中', knowledgeCount: 184, version: 'file_v1', hash: '43bd16…7ca9' },
  { id: 'FILE-1042', name: '钱币收藏专业术语手册.docx', type: 'Word', size: '3.8 MB', uploadedAt: '2026-07-04 09:18', parseStatus: '等待解析', knowledgeCount: 45, version: 'file_v2', hash: 'c091aa…8f11' },
  { id: 'FILE-1039', name: '买家售后处理指南.pdf', type: 'PDF', size: '4.2 MB', uploadedAt: '2026-07-02 11:43', parseStatus: '解析成功', knowledgeCount: 54, version: 'file_v2', hash: '75fc0d…133b' },
  { id: 'FILE-1037', name: '历史平台规则.pdf', type: 'PDF', size: '8.1 MB', uploadedAt: '2026-07-01 17:05', parseStatus: '解析失败', knowledgeCount: 0, version: 'file_v1', hash: '19e4bc…992c' },
]

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({ faqs, terms, documents, tasks, files }),
  actions: {
    saveFaq(item: FaqItem) {
      const index = this.faqs.findIndex((faq) => faq.id === item.id)
      if (index >= 0) this.faqs[index] = { ...item, updatedAt: '刚刚', version: item.version + 1 }
      else this.faqs.unshift({ ...item, id: Date.now(), knowledgeId: `FAQ-MOCK-${Date.now()}`, updatedAt: '刚刚', version: 1 })
    },
    setFaqStatus(ids: number[], status: FaqItem['status']) {
      this.faqs.forEach((faq) => {
        if (ids.includes(faq.id)) faq.status = status
      })
    },
  },
})
