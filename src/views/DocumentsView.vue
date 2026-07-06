<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentAdd, Search, View } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '../stores/knowledge'
import type { DocumentItem } from '../types/knowledge'
import StatusTag from '../components/StatusTag.vue'

const store = useKnowledgeStore()
const keyword = ref('')
const detailVisible = ref(false)
const current = ref<DocumentItem | null>(null)
const filtered = computed(() => store.documents.filter((item) => !keyword.value || item.name.includes(keyword.value)))
const chunks = [
  { id: 'CHUNK-001', title: '第三章 / 交易订单 / 付款时效', pages: '12–13', content: '买家提交订单后，应当在订单页面展示的付款倒计时内完成支付。超过付款时限，系统将自动关闭订单。', confidence: '高' },
  { id: 'CHUNK-002', title: '第三章 / 交易订单 / 订单取消', pages: '13', content: '订单付款前，买家可主动取消订单；订单付款后如需取消，应根据订单当前状态与卖家协商处理。', confidence: '高' },
  { id: 'CHUNK-003', title: '第四章 / 售后服务 / 举证规则', pages: '18–19', content: '用户提交售后申请时，应提供真实、清晰且与争议事项直接相关的图片、视频或物流凭证。', confidence: '中' },
]
function openDetail(item: DocumentItem) { current.value = item; detailVisible.value = true }
function importPdf() { ElMessage.info('importPdf 方法已预留，当前版本暂不上传文件') }
</script>

<template>
  <div>
    <section class="panel toolbar-panel">
      <div class="toolbar-row">
        <el-button type="primary" :icon="DocumentAdd" @click="importPdf">导入 PDF</el-button>
        <div class="filter-actions"><el-input v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索文档名称" /><el-select clearable placeholder="全部分类"><el-option label="平台规则" value="平台规则" /><el-option label="专业知识" value="专业知识" /></el-select></div>
      </div>
    </section>
    <div class="document-grid">
      <article v-for="doc in filtered" :key="doc.id" class="document-card">
        <div class="document-card__head">
          <div class="pdf-icon">PDF</div>
          <div><StatusTag :value="doc.status" dot /><span class="version-chip">{{ doc.version }}</span></div>
        </div>
        <h3>{{ doc.name }}</h3><p class="document-category">{{ doc.category }} · {{ doc.pages }} 页</p>
        <div class="document-metrics"><div><strong>{{ doc.chunks }}</strong><span>知识分块</span></div><div><strong>{{ doc.vectorized }}</strong><span>已向量化</span></div><div><strong>{{ Math.round(doc.vectorized / doc.chunks * 100) }}%</strong><span>完成度</span></div></div>
        <el-progress :percentage="Math.round(doc.vectorized / doc.chunks * 100)" :show-text="false" :stroke-width="6" />
        <div class="document-card__foot"><StatusTag :value="doc.parseStatus" /><span>{{ doc.updatedAt }}</span><el-button link type="primary" :icon="View" @click="openDetail(doc)">查看分块</el-button></div>
      </article>
    </div>
    <el-drawer v-model="detailVisible" size="680px" class="faq-drawer">
      <template #header><div><h3>{{ current?.name }}</h3><p>{{ current?.version }} · {{ current?.pages }} 页 · {{ current?.chunks }} 个知识分块</p></div></template>
      <el-alert title="分块保留原始页码和章节路径，发布后可作为智能客服回答来源。" type="info" :closable="false" show-icon />
      <div class="chunk-list">
        <article v-for="chunk in chunks" :key="chunk.id" class="chunk-card">
          <div><span>{{ chunk.id }}</span><StatusTag :value="chunk.confidence" /></div><h4>{{ chunk.title }}</h4><p>{{ chunk.content }}</p><footer><span>来源页码：第 {{ chunk.pages }} 页</span><el-button link type="primary">编辑分块</el-button></footer>
        </article>
      </div>
      <template #footer><el-button @click="detailVisible = false">关闭</el-button><el-button type="primary" @click="ElMessage.info('confirmDocument 方法已预留')">确认并发布</el-button></template>
    </el-drawer>
  </div>
</template>
