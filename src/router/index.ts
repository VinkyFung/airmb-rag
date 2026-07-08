import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import FaqView from '../views/FaqView.vue'
import TermsView from '../views/TermsView.vue'
import DocumentsView from '../views/DocumentsView.vue'
import ImportsView from '../views/ImportsView.vue'
import FilesView from '../views/FilesView.vue'
import SearchTestView from '../views/SearchTestView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { title: '知识库概览', subtitle: '掌握知识资产与处理任务的整体状态' } },
    { path: '/faq', name: 'faq', component: FaqView, meta: { title: 'FAQ 管理', subtitle: '维护客服标准问答、相似问法与回答策略' } },
    { path: '/terms', name: 'terms', component: TermsView, meta: { title: '术语管理', subtitle: '管理钱币专业术语、别名与定义' } },
    { path: '/documents', name: 'documents', component: DocumentsView, meta: { title: '文档知识', subtitle: '查看 PDF 文档解析结果与知识分块' } },
    { path: '/imports', name: 'imports', component: ImportsView, meta: { title: '导入任务', subtitle: '跟踪上传、解析、校验、入库和向量生成' } },
    { path: '/files', name: 'files', component: FilesView, meta: { title: '文件归档', subtitle: '管理 OSS 原始文件、版本与处理记录' } },
    { path: '/search-test', name: 'search-test', component: SearchTestView, meta: { title: '检索测试', subtitle: '模拟用户提问，验证 FAQ 语义召回与回答效果' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: '系统配置', subtitle: '查看知识库运行策略与预留配置' } },
  ],
})

export default router
