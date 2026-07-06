<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose, Clock, Plus, RefreshRight, Search, UploadFilled, View } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '../stores/knowledge'
import type { ImportTask } from '../types/knowledge'
import StatusTag from '../components/StatusTag.vue'

const store = useKnowledgeStore()
const dialogVisible = ref(false)
const detailVisible = ref(false)
const current = ref<ImportTask | null>(null)
const selectedType = ref<'Excel' | 'Word' | 'PDF'>('Excel')
const stages = ['上传文件', '保存文件', '解析内容', '数据校验', '写入数据库', '生成向量', '发布知识库']
function openDetail(task: ImportTask) { current.value = task; detailVisible.value = true }
function createImportTask() { ElMessage.info(`create${selectedType.value}ImportTask 方法已预留，当前不会上传文件`); dialogVisible.value = false }
function retryTask(task: ImportTask) { ElMessage.info(`retryImportTask('${task.id}') 方法已预留`) }
function stageState(index: number) {
  if (!current.value) return 'wait'
  const active = Math.min(Math.floor(current.value.progress / (100 / stages.length)), stages.length - 1)
  if (current.value.status === '失败' && index === active) return 'error'
  return index < active ? 'finish' : index === active ? 'process' : 'wait'
}
</script>

<template>
  <div>
    <div class="import-summary">
      <article><el-icon class="blue"><Clock /></el-icon><div><span>进行中</span><strong>1</strong></div></article>
      <article><el-icon class="orange"><UploadFilled /></el-icon><div><span>等待确认</span><strong>1</strong></div></article>
      <article><el-icon class="green"><CircleCheck /></el-icon><div><span>本周完成</span><strong>18</strong></div></article>
      <article><el-icon class="red"><CircleClose /></el-icon><div><span>处理失败</span><strong>1</strong></div></article>
    </div>
    <section class="panel toolbar-panel">
      <div class="toolbar-row"><el-button type="primary" :icon="Plus" @click="dialogVisible = true">创建导入任务</el-button><div class="filter-actions"><el-input :prefix-icon="Search" placeholder="搜索任务 ID 或文件名" /><el-select placeholder="全部状态" clearable><el-option label="解析中" value="解析中" /><el-option label="等待确认" value="等待确认" /><el-option label="失败" value="失败" /></el-select></div></div>
    </section>
    <section class="panel table-panel">
      <el-table :data="store.tasks" stripe>
        <el-table-column label="任务 / 文件" min-width="270"><template #default="{ row }"><div class="task-file-cell"><span class="file-type" :class="row.type.toLowerCase()">{{ row.type.slice(0,1) }}</span><div><strong>{{ row.fileName }}</strong><span>{{ row.id }} · {{ row.createdAt }}</span></div></div></template></el-table-column>
        <el-table-column label="类型" width="82" prop="type" />
        <el-table-column label="当前阶段" width="128"><template #default="{ row }"><strong class="stage-name">{{ row.stage }}</strong></template></el-table-column>
        <el-table-column label="处理进度" min-width="180"><template #default="{ row }"><el-progress :percentage="row.progress" :status="row.status === '失败' ? 'exception' : row.status === '已完成' ? 'success' : undefined" :stroke-width="7" /></template></el-table-column>
        <el-table-column label="数据变化" min-width="195"><template #default="{ row }"><div class="change-counts"><span class="add">+{{ row.added }}</span><span class="update">改 {{ row.updated }}</span><span>未变 {{ row.unchanged }}</span></div></template></el-table-column>
        <el-table-column label="问题" width="105"><template #default="{ row }"><span class="issue warning">{{ row.warnings }} 警告</span><span v-if="row.errors" class="issue error">{{ row.errors }} 错误</span></template></el-table-column>
        <el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :value="row.status" dot /></template></el-table-column>
        <el-table-column label="操作" width="150" fixed="right"><template #default="{ row }"><el-button link type="primary" :icon="View" @click="openDetail(row)">详情</el-button><el-button v-if="row.status === '失败'" link type="danger" :icon="RefreshRight" @click="retryTask(row)">重试</el-button></template></el-table-column>
      </el-table>
    </section>
    <el-dialog v-model="dialogVisible" title="创建导入任务" width="600px">
      <p class="dialog-lead">选择知识类型并上传原始文件。文件解析完成后需要人工预览确认。</p>
      <div class="type-picker"><button v-for="type in (['Excel','Word','PDF'] as const)" :key="type" :class="{ active: selectedType === type }" @click="selectedType = type"><span :class="type.toLowerCase()">{{ type.slice(0,1) }}</span><strong>{{ type }}</strong><small>{{ type === 'Excel' ? '结构化 FAQ' : type === 'Word' ? '专业术语' : '文档知识' }}</small></button></div>
      <el-upload drag action="#" :auto-upload="false" :limit="1"><el-icon class="el-icon--upload"><UploadFilled /></el-icon><div class="el-upload__text">拖拽文件到这里，或 <em>点击选择</em></div><template #tip><div class="el-upload__tip">支持 .xlsx、.docx、.pdf，单个文件不超过 100 MB</div></template></el-upload>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="createImportTask">创建任务</el-button></template>
    </el-dialog>
    <el-drawer v-model="detailVisible" size="620px" class="faq-drawer">
      <template #header><div><h3>导入任务详情</h3><p>{{ current?.id }} · {{ current?.fileName }}</p></div></template>
      <div v-if="current" class="task-detail">
        <div class="detail-overview"><div><span>当前状态</span><StatusTag :value="current.status" dot /></div><div><span>整体进度</span><strong>{{ current.progress }}%</strong></div><div><span>创建时间</span><strong>{{ current.createdAt }}</strong></div></div>
        <h4>处理阶段</h4>
        <div class="stage-list"><div v-for="(stage, index) in stages" :key="stage" class="stage-item" :class="stageState(index)"><i><el-icon v-if="stageState(index) === 'finish'"><CircleCheck /></el-icon><span v-else>{{ index + 1 }}</span></i><div><strong>{{ stage }}</strong><p>{{ stageState(index) === 'finish' ? '处理完成' : stageState(index) === 'process' ? `正在${stage}…` : stageState(index) === 'error' ? '此阶段处理失败' : '等待处理' }}</p></div><b v-if="stageState(index) === 'finish'">100%</b></div></div>
        <h4>数据预览</h4>
        <div class="preview-counts"><div><strong>{{ current.added }}</strong><span>新增</span></div><div><strong>{{ current.updated }}</strong><span>修改</span></div><div><strong>{{ current.unchanged }}</strong><span>未变化</span></div><div><strong>{{ current.warnings }}</strong><span>警告</span></div><div><strong>{{ current.errors }}</strong><span>错误</span></div></div>
        <el-alert v-if="current.status === '失败'" title="PDF 文件已加密，无法提取正文。请解除密码后重试解析。" type="error" :closable="false" show-icon />
      </div>
      <template #footer><el-button @click="detailVisible = false">关闭</el-button><el-button v-if="current?.status === '等待确认'" type="primary" @click="ElMessage.info('confirmImportTask 方法已预留')">确认入库</el-button><el-button v-if="current?.status === '失败'" type="danger" @click="current && retryTask(current)">从失败阶段重试</el-button></template>
    </el-drawer>
  </div>
</template>
