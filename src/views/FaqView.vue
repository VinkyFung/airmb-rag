<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadUserFile } from 'element-plus'
import { Connection, Delete, Download, EditPen, MoreFilled, Plus, Search, Upload } from '@element-plus/icons-vue'
import {
  confirmFaqImport,
  deleteFaq as deleteFaqApi,
  generateFaqEmbedding,
  getFaqEmbeddingTask,
  getFaqList,
  parseFaqImport,
  rebuildFaqEmbeddings,
  updateFaq,
} from '../api/faq'
import type { FaqApiItem, FaqEmbeddingTaskData, FaqImportConfirmData, FaqImportParseData, FaqListParams, FaqUpdatePayload } from '../api/faq'
import { getApiErrorCode, getApiErrorMessage } from '../api/http'
import type { EmbeddingStatus, FaqItem, KnowledgeStatus, RiskLevel } from '../types/knowledge'
import StatusTag from '../components/StatusTag.vue'

const keyword = ref('')
const category = ref('')
const status = ref('')
const selected = ref<FaqItem[]>([])
const faqItems = ref<FaqItem[]>([])
const loading = ref(false)
const saving = ref(false)
const embeddingIds = ref<number[]>([])
const faqImportVisible = ref(false)
const faqImportParsing = ref(false)
const faqImportConfirming = ref(false)
const faqImportFile = ref<File | null>(null)
const faqImportFileList = ref<UploadUserFile[]>([])
const faqImportResult = ref<FaqImportParseData | null>(null)
const faqImportConfirmResult = ref<FaqImportConfirmData | null>(null)
const batchEmbeddingVisible = ref(false)
const batchEmbeddingLoading = ref(false)
const batchEmbeddingTask = ref<FaqEmbeddingTaskData | null>(null)
const loadError = ref('')
const lastUpdated = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit'>('edit')
const batchEmbeddingForm = reactive({
  limit: 100,
  onlyPending: true,
})
let batchEmbeddingPollTimer: number | undefined

const blankFaq = (): FaqItem => ({
  id: 0,
  knowledgeId: '',
  categoryL1: '平台服务',
  categoryL2: '',
  categoryL3: '',
  businessType: '账户',
  question: '',
  paraphrases: [],
  answer: '',
  risk: '低',
  authRequired: false,
  autoAnswer: true,
  humanRequired: false,
  userRole: 'common',
  reviewStatus: 0,
  status: '草稿',
  embeddingStatus: '未生成',
  embeddingError: '',
  embeddingInputHash: '',
  updatedAt: '',
  updatedBy: '客服运营',
  version: 0,
})
const form = reactive<FaqItem>(blankFaq())

const batchEmbeddingProgress = computed(() => {
  const task = batchEmbeddingTask.value
  if (!task?.total) return 0
  return Math.round((task.progress / task.total) * 100)
})

const batchEmbeddingTaskRunning = computed(() => {
  const status = batchEmbeddingTask.value?.status
  return status === 'pending' || status === 'running'
})

const faqImportBlockedRows = computed(() => {
  return faqImportResult.value?.items.filter((item) => item.blocked).length || 0
})

function statusLabel(value: number): KnowledgeStatus {
  if (value === 1) return '已发布'
  if (value === 2) return '已停用'
  return '草稿'
}

function statusValue(value: KnowledgeStatus) {
  if (value === '已发布') return 1
  if (value === '已停用') return 2
  return 0
}

function riskLabel(value: number): RiskLevel {
  if (value === 1) return '中'
  if (value === 2) return '高'
  return '低'
}

function riskValue(value: RiskLevel) {
  if (value === '中') return 1
  if (value === '高') return 2
  return 0
}

function embeddingStatusLabel(value: number): EmbeddingStatus {
  if (value === 1) return '已生成'
  if (value === 2) return '生成失败'
  if (value === 3) return '生成中'
  return '未生成'
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-')
}

function toFaqItem(item: FaqApiItem): FaqItem {
  return {
    id: item.id,
    knowledgeId: item.knowledge_id,
    version: item.version,
    categoryL1: item.category_l1 || '',
    categoryL2: item.category_l2 || '',
    categoryL3: item.category_l3 || '',
    businessType: item.business_type || '',
    question: item.standard_question,
    paraphrases: item.paraphrases,
    answer: item.answer,
    risk: riskLabel(item.risk_level),
    authRequired: item.auth_required,
    autoAnswer: item.auto_answer,
    humanRequired: item.human_required,
    userRole: item.user_role,
    reviewStatus: item.review_status,
    status: statusLabel(item.status),
    embeddingStatus: embeddingStatusLabel(item.embedding_status),
    embeddingError: item.embedding_error || '',
    embeddingInputHash: item.embedding_input_hash || '',
    updatedAt: formatDate(item.updated_at),
    updatedBy: item.updated_by || '系统',
  }
}

function toUpdatePayload(item: FaqItem): FaqUpdatePayload {
  return {
    version: item.version,
    category_l1: item.categoryL1 || null,
    category_l2: item.categoryL2 || null,
    category_l3: item.categoryL3 || null,
    standard_question: item.question,
    paraphrases: [...item.paraphrases],
    answer: item.answer,
    user_role: item.userRole || 'common',
    business_type: item.businessType || null,
    risk_level: riskValue(item.risk),
    auth_required: item.authRequired,
    auto_answer: item.autoAnswer,
    human_required: item.humanRequired || false,
    status: statusValue(item.status),
    review_status: item.reviewStatus || 0,
    updated_by: '客服运营',
  }
}

async function loadFaqs() {
  loading.value = true
  loadError.value = ''
  const params: FaqListParams = {
    page: page.value,
    page_size: pageSize.value,
  }
  if (keyword.value.trim()) params.keyword = keyword.value.trim()
  if (category.value) params.category_l1 = category.value
  if (status.value) params.status = statusValue(status.value as KnowledgeStatus)

  try {
    const data = await getFaqList(params)
    faqItems.value = data.items.map(toFaqItem)
    total.value = data.pagination.total
    lastUpdated.value = new Date().toLocaleString('zh-CN', { hour12: false })
  } catch (error) {
    loadError.value = getApiErrorMessage(error, 'FAQ 数据加载失败，请确认后端和数据库配置')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  void loadFaqs()
}

function handleFilterChange() {
  page.value = 1
  void loadFaqs()
}

function openCreate() {
  ElMessage.info('本轮暂未开放新增 FAQ 接口')
}

function openEdit(item: FaqItem) {
  Object.assign(form, JSON.parse(JSON.stringify(item)) as FaqItem)
  drawerMode.value = 'edit'
  drawerVisible.value = true
}

async function saveFaq(targetStatus?: KnowledgeStatus) {
  if (!form.question.trim() || !form.answer.trim()) {
    return ElMessage.warning('请填写标准问题和标准答案')
  }
  if (targetStatus) form.status = targetStatus
  saving.value = true
  try {
    const updated = toFaqItem(await updateFaq(form.id, toUpdatePayload(form)))
    const index = faqItems.value.findIndex((item) => item.id === updated.id)
    if (index >= 0) faqItems.value[index] = updated
    drawerVisible.value = false
    ElMessage.success('FAQ 更新成功')
  } catch (error) {
    if (getApiErrorCode(error) === 'FAQ_VERSION_CONFLICT') {
      drawerVisible.value = false
      await loadFaqs()
    }
    ElMessage.error(getApiErrorMessage(error, 'FAQ 保存失败'))
  } finally {
    saving.value = false
  }
}

function handleBatch() {
  if (!selected.value.length) return ElMessage.info('请先选择 FAQ')
  ElMessage.info('批量状态接口暂未开放')
}

async function handleSelectedEmbeddingBatch() {
  if (!selected.value.length) return ElMessage.info('请先选择 FAQ')
  const ids = selected.value.map((item) => item.id)
  const submitted = await startBatchEmbeddingTask({
    limit: ids.length,
    only_pending: false,
    faq_ids: ids,
  })
  if (!submitted) return
  selected.value.forEach((item) => {
    item.embeddingStatus = '生成中'
    item.embeddingError = ''
  })
}

async function disableFaq(item: FaqItem) {
  try {
    await ElMessageBox.confirm(
      '该操作采用软删除，智能客服将不再召回此知识，历史记录仍会保留。',
      `确认删除“${item.question}”？`,
      { type: 'warning', confirmButtonText: '确认删除' },
    )
    await deleteFaqApi(item.id)
    ElMessage.success('FAQ 已软删除')
    if (faqItems.value.length === 1 && page.value > 1) page.value -= 1
    await loadFaqs()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(getApiErrorMessage(error, 'FAQ 删除失败'))
  }
}

async function handleGenerateEmbedding(item: FaqItem) {
  if (embeddingIds.value.includes(item.id)) return
  embeddingIds.value = [...embeddingIds.value, item.id]
  try {
    const data = await generateFaqEmbedding(item.id)
    item.embeddingStatus = '已生成'
    item.embeddingInputHash = data.embedding_input_hash || ''
    item.embeddingError = ''
    ElMessage.success(
      `向量生成成功：${data.embedding_model} / ${data.embedding_dimension} 维`,
    )
  } catch (error) {
    item.embeddingStatus = '生成失败'
    ElMessage.error(getApiErrorMessage(error, 'FAQ 向量生成失败，请检查后端模型和 Qdrant 服务'))
  } finally {
    embeddingIds.value = embeddingIds.value.filter((id) => id !== item.id)
  }
}

function openBatchEmbeddingDialog() {
  batchEmbeddingVisible.value = true
}

async function submitBatchEmbedding() {
  await startBatchEmbeddingTask({
    limit: batchEmbeddingForm.limit,
    only_pending: batchEmbeddingForm.onlyPending,
  })
}

async function startBatchEmbeddingTask(payload: {
  limit: number
  only_pending: boolean
  faq_ids?: number[]
}): Promise<boolean> {
  batchEmbeddingLoading.value = true
  clearBatchEmbeddingPoll()
  try {
    const data = await rebuildFaqEmbeddings(payload)
    batchEmbeddingTask.value = data
    batchEmbeddingVisible.value = false
    ElMessage.success('批量生成向量任务已提交，页面将自动刷新进度')
    scheduleBatchEmbeddingPoll(data.task_id)
    return true
  } catch (error) {
    batchEmbeddingLoading.value = false
    ElMessage.error(getApiErrorMessage(error, '批量生成向量任务提交失败，请检查后端服务'))
    return false
  }
}

async function pollBatchEmbeddingTask(taskId: string) {
  try {
    const data = await getFaqEmbeddingTask(taskId)
    batchEmbeddingTask.value = data
    if (data.status === 'pending' || data.status === 'running') {
      scheduleBatchEmbeddingPoll(taskId)
      return
    }
    batchEmbeddingLoading.value = false
    await loadFaqs()
    if (data.status === 'succeeded') {
      ElMessage.success(`批量生成完成：成功 ${data.succeeded} 条`)
    } else if (data.status === 'partial_failed') {
      ElMessage.warning(`批量生成完成：成功 ${data.succeeded} 条，失败 ${data.failed} 条`)
    } else {
      ElMessage.error(data.message || '批量生成向量任务失败')
    }
  } catch (error) {
    batchEmbeddingLoading.value = false
    ElMessage.error(getApiErrorMessage(error, '批量生成向量任务状态查询失败'))
  }
}

function scheduleBatchEmbeddingPoll(taskId: string) {
  clearBatchEmbeddingPoll()
  batchEmbeddingPollTimer = window.setTimeout(() => {
    void pollBatchEmbeddingTask(taskId)
  }, 1600)
}

function clearBatchEmbeddingPoll() {
  if (batchEmbeddingPollTimer) {
    window.clearTimeout(batchEmbeddingPollTimer)
    batchEmbeddingPollTimer = undefined
  }
}

function importExcel() {
  faqImportVisible.value = true
}

async function handleFaqImportFileChange(uploadFile: UploadFile) {
  const rawFile = uploadFile.raw
  if (!rawFile) return
  if (!rawFile.name.toLowerCase().endsWith('.xlsx')) {
    faqImportFileList.value = []
    return ElMessage.warning('请上传 .xlsx 格式的 FAQ 文件')
  }

  faqImportParsing.value = true
  faqImportResult.value = null
  faqImportConfirmResult.value = null
  faqImportFile.value = rawFile
  try {
    faqImportResult.value = await parseFaqImport(rawFile, 100)
    ElMessage.success(
      `解析完成：有效 ${faqImportResult.value.valid_rows} 行，异常 ${faqImportResult.value.invalid_rows} 行`,
    )
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, 'FAQ 文件解析失败，请确认文件格式和表头'))
  } finally {
    faqImportParsing.value = false
  }
}

async function confirmFaqImportToKnowledgeBase() {
  if (!faqImportFile.value || !faqImportResult.value) {
    return ElMessage.warning('请先选择并解析 FAQ Excel')
  }
  if (!faqImportResult.value.valid_rows) {
    return ElMessage.warning('当前文件没有可入库的有效 FAQ')
  }

  try {
    await ElMessageBox.confirm(
      `将把 ${faqImportResult.value.valid_rows} 条有效 FAQ 写入知识库，异常行和冲突行会跳过。重复导入同一文件行会更新已有 FAQ。`,
      '确认入库？',
      { type: 'warning', confirmButtonText: '确认入库', cancelButtonText: '取消' },
    )
  } catch {
    return
  }

  faqImportConfirming.value = true
  try {
    const data = await confirmFaqImport(faqImportFile.value, 0)
    faqImportConfirmResult.value = data
    const message = `入库完成：新增 ${data.created} 条，更新 ${data.updated} 条，跳过 ${data.skipped} 条，失败 ${data.failed} 条`
    if (data.failed) ElMessage.warning(message)
    else ElMessage.success(message)
    page.value = 1
    await loadFaqs()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, 'FAQ 确认入库失败，请检查后端和数据库'))
  } finally {
    faqImportConfirming.value = false
  }
}

function resetFaqImportDialog() {
  faqImportFile.value = null
  faqImportFileList.value = []
  faqImportResult.value = null
  faqImportConfirmResult.value = null
}

function exportExcel() { ElMessage.info('exportExcel 方法已预留，当前版本暂不生成文件') }

onMounted(loadFaqs)
onBeforeUnmount(clearBatchEmbeddingPoll)
</script>

<template>
  <div class="fag-container">
    <section class="panel toolbar-panel">
      <div class="toolbar-row">
        <div class="primary-actions">
          <el-button type="primary" :icon="Plus" @click="openCreate">新增 FAQ</el-button>
          <el-button :icon="Upload" @click="importExcel">导入 Excel</el-button>
          <el-button :icon="Download" @click="exportExcel">导出 Excel</el-button>
          <el-button
            type="success"
            :icon="Connection"
            :loading="batchEmbeddingLoading"
            @click="openBatchEmbeddingDialog"
          >
            批量生成向量
          </el-button>
        </div>
        <div class="filter-actions">
          <el-input
            v-model="keyword"
            :prefix-icon="Search"
            clearable
            placeholder="搜索问题、答案或知识 ID"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select v-model="category" clearable placeholder="全部分类" @change="handleFilterChange">
            <el-option label="平台服务" value="平台服务" />
            <el-option label="交易服务" value="交易服务" />
            <el-option label="资金服务" value="资金服务" />
          </el-select>
          <el-select v-model="status" clearable placeholder="全部状态" @change="handleFilterChange">
            <el-option label="已发布" value="已发布" />
            <el-option label="草稿" value="草稿" />
            <el-option label="已停用" value="已停用" />
          </el-select>
        </div>
      </div>
      <div v-if="selected.length" class="selection-bar">
        <span>已选择 <b>{{ selected.length }}</b> 项</span>
        <el-button size="small" @click="handleBatch">批量发布</el-button>
        <el-button size="small" @click="handleBatch">批量停用</el-button>
        <el-button
          size="small"
          type="success"
          :icon="Connection"
          :loading="batchEmbeddingLoading"
          @click="handleSelectedEmbeddingBatch"
        >
          为选中项生成向量
        </el-button>
        <button @click="selected = []">取消选择</button>
      </div>
    </section>

    <el-alert
      v-if="batchEmbeddingTask"
      class="archive-tip"
      :type="batchEmbeddingTask.status === 'failed' ? 'error' : batchEmbeddingTask.status === 'partial_failed' ? 'warning' : 'info'"
      :closable="false"
      show-icon
    >
      <template #title>
        <div class="embedding-task-title">
          <span>{{ batchEmbeddingTask.message }}</span>
          <small>
            成功 {{ batchEmbeddingTask.succeeded }} / 失败 {{ batchEmbeddingTask.failed }}
            <template v-if="batchEmbeddingTask.total"> / 总计 {{ batchEmbeddingTask.total }}</template>
          </small>
        </div>
      </template>
      <el-progress
        :percentage="batchEmbeddingProgress"
        :status="batchEmbeddingTask.status === 'failed' ? 'exception' : batchEmbeddingTask.status === 'succeeded' ? 'success' : undefined"
        :indeterminate="batchEmbeddingTaskRunning && !batchEmbeddingTask.total"
      />
    </el-alert>

    <el-alert
      v-if="loadError"
      class="archive-tip"
      :title="loadError"
      type="error"
      :closable="false"
      show-icon
    />

    <section v-loading="loading" class="panel table-panel">
      <div class="table-meta">
        <span>共 <b>{{ total }}</b> 条 FAQ</span>
        <span>{{ lastUpdated ? `数据更新时间：${lastUpdated}` : '正在获取最新数据' }}</span>
      </div>
      <el-table :data="faqItems" stripe row-key="id" @selection-change="selected = $event">
        <el-table-column type="selection" width="48" />
        <el-table-column label="标准问题" min-width="150">
          <template #default="{ row }">
            <div class="question-cell">
              <strong>{{ row.question }}</strong>
              <span>{{ row.knowledgeId }} · v{{ row.version }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" min-width="50">
          <template #default="{ row }">
            <div class="category-cell"><span>{{ row.categoryL1 || '-' }}</span><small>{{ row.categoryL2 || '-' }}</small></div>
          </template>
        </el-table-column>
        <el-table-column label="相似问法" width="80" align="center">
          <template #default="{ row }">
            <el-popover placement="bottom" :width="280" trigger="click">
              <template #reference><button class="count-link">{{ row.paraphrases.length }} 条</button></template>
              <div class="paraphrase-pop">
                <p v-for="text in row.paraphrases" :key="text">{{ text }}</p>
                <p v-if="!row.paraphrases.length">暂无相似问法</p>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="标准答案" min-width="250" show-overflow-tooltip prop="answer" />
        <el-table-column label="风险" width="76" align="center"><template #default="{ row }"><StatusTag :value="row.risk" /></template></el-table-column>
        <el-table-column label="鉴权" width="72" align="center"><template #default="{ row }"><span :class="row.authRequired ? 'yes-text' : 'muted-text'">{{ row.authRequired ? '需要' : '无需' }}</span></template></el-table-column>
        <el-table-column label="自动回答" width="90" align="center"><template #default="{ row }"><el-switch :model-value="row.autoAnswer" size="small" disabled /></template></el-table-column>
        <el-table-column label="状态" width="96"><template #default="{ row }"><StatusTag :value="row.status" dot /></template></el-table-column>
        <el-table-column label="向量状态" width="112">
          <template #default="{ row }">
            <el-popover
              v-if="row.embeddingError"
              placement="top"
              :width="320"
              trigger="click"
            >
              <template #reference>
                <button class="embedding-status-button">
                  <StatusTag :value="row.embeddingStatus" dot />
                </button>
              </template>
              <div class="embedding-pop">
                <strong>生成失败原因</strong>
                <p>{{ row.embeddingError }}</p>
              </div>
            </el-popover>
            <StatusTag v-else :value="row.embeddingStatus" dot />
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="150"><template #default="{ row }"><div class="time-cell">{{ row.updatedAt }}<small>{{ row.updatedBy }}</small></div></template></el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="EditPen" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              type="success"
              :icon="Connection"
              :loading="embeddingIds.includes(row.id)"
              @click="handleGenerateEmbedding(row)"
            >
              生成向量
            </el-button>
            <el-dropdown>
              <button class="more-button"><el-icon><MoreFilled /></el-icon></button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>查看版本</el-dropdown-item>
                  <el-dropdown-item :icon="Delete" divided @click="disableFaq(row)">删除 FAQ</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <span>每页 {{ pageSize }} 条</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          layout="prev, pager, next"
          :total="total"
          @current-change="loadFaqs"
        />
      </div>
    </section>

    <el-drawer v-model="drawerVisible" size="560px" class="faq-drawer">
      <template #header>
        <div>
          <h3>编辑 FAQ</h3>
          <p>{{ form.knowledgeId }} · 当前版本 v{{ form.version }}</p>
        </div>
      </template>
      <el-form label-position="top">
        <div class="form-section">
          <h4>问答内容</h4>
          <el-form-item label="标准问题" required>
            <el-input v-model="form.question" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="相似问法">
            <el-select v-model="form.paraphrases" multiple filterable allow-create default-first-option placeholder="输入问法后按回车添加" />
          </el-form-item>
          <el-form-item label="标准答案" required>
            <el-input v-model="form.answer" type="textarea" :rows="7" maxlength="2000" show-word-limit />
          </el-form-item>
        </div>
        <div class="form-section">
          <h4>分类与策略</h4>
          <div class="form-grid">
            <el-form-item label="一级分类"><el-select v-model="form.categoryL1"><el-option label="平台服务" value="平台服务" /><el-option label="交易服务" value="交易服务" /><el-option label="资金服务" value="资金服务" /></el-select></el-form-item>
            <el-form-item label="二级分类"><el-input v-model="form.categoryL2" /></el-form-item>
            <el-form-item label="业务分类"><el-select v-model="form.businessType"><el-option v-for="item in ['账户','订单','钱包','售后','发布']" :key="item" :label="item" :value="item" /></el-select></el-form-item>
            <el-form-item label="风险等级"><el-select v-model="form.risk"><el-option v-for="item in (['低','中','高'] as RiskLevel[])" :key="item" :label="item" :value="item" /></el-select></el-form-item>
          </div>
          <div class="switch-row"><div><strong>需要用户鉴权</strong><p>回答前必须确认当前用户登录状态</p></div><el-switch v-model="form.authRequired" /></div>
          <div class="switch-row"><div><strong>允许自动回答</strong><p>关闭后命中该知识时转接人工客服</p></div><el-switch v-model="form.autoAnswer" /></div>
          <el-form-item label="发布状态"><el-radio-group v-model="form.status"><el-radio-button value="草稿">草稿</el-radio-button><el-radio-button value="已发布">已发布</el-radio-button><el-radio-button value="已停用">已停用</el-radio-button></el-radio-group></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button :loading="saving" @click="saveFaq('草稿')">保存草稿</el-button>
          <el-button type="primary" :loading="saving" @click="saveFaq('已发布')">保存并发布</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog
      v-model="faqImportVisible"
      title="导入 FAQ Excel"
      width="920px"
      @closed="resetFaqImportDialog"
    >
      <p class="dialog-lead">
        上传 Excel 后会先解析预览；确认入库时会写入 FAQ 知识库。重复导入同一 Sheet 行会更新已有 FAQ，并重置向量状态。
      </p>
      <el-upload
        v-model:file-list="faqImportFileList"
        drag
        action="#"
        accept=".xlsx"
        :auto-upload="false"
        :limit="1"
        :disabled="faqImportParsing"
        :on-change="handleFaqImportFileChange"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">拖拽 FAQ Excel 到这里，或 <em>点击选择</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 .xlsx；需要包含“提问示例”和“解答”列。</div>
        </template>
      </el-upload>

      <div v-if="faqImportParsing" class="import-parse-loading">
        <el-icon class="is-loading"><Connection /></el-icon>
        正在解析 Excel，请稍候……
      </div>

      <div v-if="faqImportResult" class="faq-import-result">
        <div class="import-summary import-summary--compact">
          <article>
            <span>总行数</span>
            <strong>{{ faqImportResult.total_rows }}</strong>
          </article>
          <article>
            <span>有效 FAQ</span>
            <strong>{{ faqImportResult.valid_rows }}</strong>
          </article>
          <article>
            <span>异常行</span>
            <strong>{{ faqImportResult.invalid_rows }}</strong>
          </article>
          <article>
            <span>警告行</span>
            <strong>{{ faqImportResult.warning_rows }}</strong>
          </article>
          <article>
            <span>冲突行</span>
            <strong>{{ faqImportBlockedRows }}</strong>
          </article>
        </div>

        <el-alert
          v-if="faqImportConfirmResult"
          class="archive-tip"
          type="success"
          :closable="false"
          show-icon
        >
          <template #title>
            入库完成：新增 {{ faqImportConfirmResult.created }} 条，更新 {{ faqImportConfirmResult.updated }} 条，
            跳过 {{ faqImportConfirmResult.skipped }} 条，失败 {{ faqImportConfirmResult.failed }} 条
          </template>
        </el-alert>

        <el-tabs>
          <el-tab-pane label="解析预览">
            <el-table :data="faqImportResult.items" height="320" stripe>
              <el-table-column prop="sheet" label="Sheet" width="110" />
              <el-table-column prop="row" label="行" width="58" align="center" />
              <el-table-column label="分类" width="150">
                <template #default="{ row }">
                  <div class="category-cell">
                    <span>{{ row.category_l1 || '-' }}</span>
                    <small>{{ row.category_l2 || '-' }}</small>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="standard_question" label="标准问题" min-width="180" show-overflow-tooltip />
              <el-table-column label="入库状态" width="96">
                <template #default="{ row }">
                  <StatusTag :value="row.blocked ? '失败' : '等待确认'" />
                </template>
              </el-table-column>
              <el-table-column label="相似问法" width="88" align="center">
                <template #default="{ row }">{{ row.paraphrases.length }} 条</template>
              </el-table-column>
              <el-table-column label="冲突原因" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.blocked">{{ row.blocking_reasons.join('；') }}</span>
                  <span v-else class="muted-text">无</span>
                </template>
              </el-table-column>
              <el-table-column prop="answer" label="答案" min-width="260" show-overflow-tooltip />
              <el-table-column label="指引图" width="78" align="center">
                <template #default="{ row }">
                  <a v-if="row.image_url" :href="row.image_url" target="_blank">查看</a>
                  <span v-else class="muted-text">无</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane :label="`校验问题 ${faqImportResult.issues.length}`">
            <el-table :data="faqImportResult.issues" height="320" stripe>
              <el-table-column label="级别" width="80">
                <template #default="{ row }">
                  <StatusTag :value="row.level === 'error' ? '失败' : '等待确认'" />
                </template>
              </el-table-column>
              <el-table-column prop="sheet" label="Sheet" width="120" />
              <el-table-column prop="row" label="行" width="70" />
              <el-table-column prop="field" label="字段" width="120" />
              <el-table-column prop="message" label="说明" min-width="280" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="Sheet 统计">
            <el-table :data="faqImportResult.sheets" height="320" stripe>
              <el-table-column prop="sheet" label="Sheet" />
              <el-table-column prop="total_rows" label="总行数" width="120" />
              <el-table-column prop="valid_rows" label="有效行" width="120" />
              <el-table-column prop="invalid_rows" label="异常行" width="120" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="faqImportVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :disabled="!faqImportResult || faqImportConfirming"
          :loading="faqImportConfirming"
          @click="confirmFaqImportToKnowledgeBase"
        >
          确认入库
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchEmbeddingVisible" title="批量生成 FAQ 向量" width="460px">
      <p class="dialog-lead">
        调用后端批量重建接口，将符合条件的草稿/已发布 FAQ 生成 BGE-M3 向量并写入 Qdrant。
        如果后端刚启动，首次加载本地模型可能需要几十秒到数分钟。
      </p>
      <el-form label-position="top">
        <el-form-item label="本次处理上限">
          <el-input-number v-model="batchEmbeddingForm.limit" :min="1" :max="1000" />
        </el-form-item>
        <div class="switch-row">
          <div>
            <strong>仅处理待生成/失败数据</strong>
            <p>开启后会跳过已经成功生成向量的 FAQ</p>
          </div>
          <el-switch v-model="batchEmbeddingForm.onlyPending" />
        </div>
      </el-form>
      <template #footer>
        <el-button @click="batchEmbeddingVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchEmbeddingLoading" @click="submitBatchEmbedding">
          提交后台任务
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.fag-container {
  :deep(.el-dialog) {
    margin-top: 5vh;
  }
  :deep(.el-dialog__headerbtn) {
    top: 0;
  }
  :deep(.el-dialog__header) {
    padding-bottom: 0;
    margin-top: -0.6rem;
  }
}
</style>
