<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download, EditPen, MoreFilled, Plus, Search, Upload } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '../stores/knowledge'
import type { FaqItem, KnowledgeStatus, RiskLevel } from '../types/knowledge'
import StatusTag from '../components/StatusTag.vue'

const store = useKnowledgeStore()
const keyword = ref('')
const category = ref('')
const status = ref('')
const selected = ref<FaqItem[]>([])
const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit'>('create')

const blankFaq = (): FaqItem => ({
  id: 0, knowledgeId: '', categoryL1: '平台服务', categoryL2: '', businessType: '账户',
  question: '', paraphrases: [], answer: '', risk: '低', authRequired: false,
  autoAnswer: true, status: '草稿', updatedAt: '', updatedBy: '客服运营', version: 0,
})
const form = reactive<FaqItem>(blankFaq())
const filteredFaqs = computed(() => store.faqs.filter((item) => {
  const matchesKeyword = !keyword.value || [item.question, item.answer, item.knowledgeId].some((text) => text.includes(keyword.value))
  return matchesKeyword && (!category.value || item.categoryL1 === category.value) && (!status.value || item.status === status.value)
}))

function openCreate() {
  Object.assign(form, blankFaq())
  drawerMode.value = 'create'
  drawerVisible.value = true
}
function openEdit(item: FaqItem) {
  Object.assign(form, JSON.parse(JSON.stringify(item)) as FaqItem)
  drawerMode.value = 'edit'
  drawerVisible.value = true
}
function saveFaq() {
  if (!form.question.trim() || !form.answer.trim()) return ElMessage.warning('请填写标准问题和标准答案')
  store.saveFaq({ ...form, paraphrases: [...form.paraphrases] })
  drawerVisible.value = false
  ElMessage.success(drawerMode.value === 'create' ? 'FAQ 已保存为草稿' : 'FAQ 更新成功')
}
function handleBatch(statusValue: KnowledgeStatus) {
  if (!selected.value.length) return ElMessage.info('请先选择 FAQ')
  store.setFaqStatus(selected.value.map((item) => item.id), statusValue)
  ElMessage.success(`已将 ${selected.value.length} 条 FAQ 更新为${statusValue}`)
}
function disableFaq(item: FaqItem) {
  ElMessageBox.confirm('停用后智能客服将不再召回此知识，历史版本仍会保留。', `确认停用“${item.question}”？`, { type: 'warning', confirmButtonText: '确认停用' })
    .then(() => { store.setFaqStatus([item.id], '已停用'); ElMessage.success('已停用') })
    .catch(() => undefined)
}
function importExcel() { ElMessage.info('importExcel 方法已预留，当前版本暂不上传文件') }
function exportExcel() { ElMessage.info('exportExcel 方法已预留，当前版本暂不生成文件') }
</script>

<template>
  <div>
    <section class="panel toolbar-panel">
      <div class="toolbar-row">
        <div class="primary-actions">
          <el-button type="primary" :icon="Plus" @click="openCreate">新增 FAQ</el-button>
          <el-button :icon="Upload" @click="importExcel">导入 Excel</el-button>
          <el-button :icon="Download" @click="exportExcel">导出 Excel</el-button>
        </div>
        <div class="filter-actions">
          <el-input v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索问题、答案或知识 ID" />
          <el-select v-model="category" clearable placeholder="全部分类">
            <el-option label="平台服务" value="平台服务" /><el-option label="交易服务" value="交易服务" /><el-option label="资金服务" value="资金服务" />
          </el-select>
          <el-select v-model="status" clearable placeholder="全部状态">
            <el-option label="已发布" value="已发布" /><el-option label="草稿" value="草稿" /><el-option label="已停用" value="已停用" />
          </el-select>
        </div>
      </div>
      <div v-if="selected.length" class="selection-bar">
        <span>已选择 <b>{{ selected.length }}</b> 项</span>
        <el-button size="small" @click="handleBatch('已发布')">批量发布</el-button>
        <el-button size="small" @click="handleBatch('已停用')">批量停用</el-button>
        <button @click="selected = []">取消选择</button>
      </div>
    </section>

    <section class="panel table-panel">
      <div class="table-meta">
        <span>共 <b>{{ filteredFaqs.length }}</b> 条 FAQ</span>
        <span>数据更新时间：2026-07-05 16:24</span>
      </div>
      <el-table :data="filteredFaqs" stripe row-key="id" @selection-change="selected = $event">
        <el-table-column type="selection" width="48" />
        <el-table-column label="标准问题" min-width="250">
          <template #default="{ row }">
            <div class="question-cell"><strong>{{ row.question }}</strong><span>{{ row.knowledgeId }} · v{{ row.version }}</span></div>
          </template>
        </el-table-column>
        <el-table-column label="分类" min-width="150">
          <template #default="{ row }"><div class="category-cell"><span>{{ row.categoryL1 }}</span><small>{{ row.categoryL2 }}</small></div></template>
        </el-table-column>
        <el-table-column label="相似问法" width="92" align="center">
          <template #default="{ row }"><el-popover placement="bottom" :width="280" trigger="click"><template #reference><button class="count-link">{{ row.paraphrases.length }} 条</button></template><div class="paraphrase-pop"><p v-for="text in row.paraphrases" :key="text">{{ text }}</p></div></el-popover></template>
        </el-table-column>
        <el-table-column label="标准答案" min-width="250" show-overflow-tooltip prop="answer" />
        <el-table-column label="风险" width="76" align="center"><template #default="{ row }"><StatusTag :value="row.risk" /></template></el-table-column>
        <el-table-column label="鉴权" width="72" align="center"><template #default="{ row }"><span :class="row.authRequired ? 'yes-text' : 'muted-text'">{{ row.authRequired ? '需要' : '无需' }}</span></template></el-table-column>
        <el-table-column label="自动回答" width="90" align="center"><template #default="{ row }"><el-switch v-model="row.autoAnswer" size="small" /></template></el-table-column>
        <el-table-column label="状态" width="96"><template #default="{ row }"><StatusTag :value="row.status" dot /></template></el-table-column>
        <el-table-column label="更新时间" width="150"><template #default="{ row }"><div class="time-cell">{{ row.updatedAt }}<small>{{ row.updatedBy }}</small></div></template></el-table-column>
        <el-table-column label="操作" width="132" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="EditPen" @click="openEdit(row)">编辑</el-button>
            <el-dropdown>
              <button class="more-button"><el-icon><MoreFilled /></el-icon></button>
              <template #dropdown><el-dropdown-menu><el-dropdown-item>复制 FAQ</el-dropdown-item><el-dropdown-item>查看版本</el-dropdown-item><el-dropdown-item :icon="Delete" divided @click="disableFaq(row)">停用知识</el-dropdown-item></el-dropdown-menu></template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row"><span>每页 20 条</span><el-pagination background layout="prev, pager, next" :total="58" :page-size="20" /></div>
    </section>

    <el-drawer v-model="drawerVisible" size="560px" class="faq-drawer">
      <template #header>
        <div><h3>{{ drawerMode === 'create' ? '新增 FAQ' : '编辑 FAQ' }}</h3><p>{{ drawerMode === 'create' ? '创建一条可追溯的标准问答知识' : `${form.knowledgeId} · 当前版本 v${form.version}` }}</p></div>
      </template>
      <el-form label-position="top">
        <div class="form-section"><h4>问答内容</h4>
          <el-form-item label="标准问题" required><el-input v-model="form.question" maxlength="100" show-word-limit placeholder="请输入用户最常见、最标准的问法" /></el-form-item>
          <el-form-item label="相似问法"><el-select v-model="form.paraphrases" multiple filterable allow-create default-first-option placeholder="输入问法后按回车添加" /></el-form-item>
          <el-form-item label="标准答案" required><el-input v-model="form.answer" type="textarea" :rows="7" maxlength="2000" show-word-limit placeholder="请输入准确、可直接回复用户的标准答案" /></el-form-item>
        </div>
        <div class="form-section"><h4>分类与策略</h4>
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
      <template #footer><div class="drawer-footer"><el-button @click="drawerVisible = false">取消</el-button><el-button @click="form.status = '草稿'; saveFaq()">保存草稿</el-button><el-button type="primary" @click="saveFaq">保存并发布</el-button></div></template>
    </el-drawer>
  </div>
</template>
