<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download, MoreFilled, RefreshRight, Search, Upload } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '../stores/knowledge'
import StatusTag from '../components/StatusTag.vue'

const store = useKnowledgeStore()
function uploadFile() { ElMessage.info('uploadSourceFile 方法已预留，当前版本暂不上传 OSS') }
function downloadFile(fileName: string) { ElMessage.info(`getDownloadUrl('${fileName}') 方法已预留`) }
function reparseFile(fileName: string) { ElMessage.info(`reparseFile('${fileName}') 方法已预留`) }
function deleteArchive(fileName: string) {
  ElMessageBox.confirm('删除归档不会自动删除已发布知识。原始文件删除后将无法下载或重新解析。', `确认删除“${fileName}”？`, { type: 'warning', confirmButtonText: '确认删除' }).catch(() => undefined)
}
</script>

<template>
  <div>
    <el-alert class="archive-tip" title="所有原始文件均按版本存档。删除文件归档不会影响已发布知识，关联知识需要单独停用。" type="info" :closable="false" show-icon />
    <section class="panel toolbar-panel">
      <div class="toolbar-row"><el-button type="primary" :icon="Upload" @click="uploadFile">上传文件</el-button><div class="filter-actions"><el-input :prefix-icon="Search" placeholder="搜索文件名或文件 ID" /><el-select clearable placeholder="全部类型"><el-option label="Excel" value="Excel" /><el-option label="Word" value="Word" /><el-option label="PDF" value="PDF" /></el-select><el-select clearable placeholder="全部状态"><el-option label="解析成功" value="解析成功" /><el-option label="解析失败" value="解析失败" /></el-select></div></div>
    </section>
    <section class="panel table-panel">
      <div class="table-meta"><span>共 <b>{{ store.files.length }}</b> 个归档文件</span><span>原始文件存储于私有 OSS</span></div>
      <el-table :data="store.files" stripe>
        <el-table-column label="文件名称" min-width="280"><template #default="{ row }"><div class="task-file-cell"><span class="file-type" :class="row.type.toLowerCase()">{{ row.type.slice(0,1) }}</span><div><strong>{{ row.name }}</strong><span>{{ row.id }}</span></div></div></template></el-table-column>
        <el-table-column prop="type" label="类型" width="78" />
        <el-table-column prop="size" label="大小" width="90" />
        <el-table-column prop="uploadedAt" label="上传时间" width="150" />
        <el-table-column label="解析状态" width="110"><template #default="{ row }"><StatusTag :value="row.parseStatus" dot /></template></el-table-column>
        <el-table-column label="入库知识" width="90" align="center"><template #default="{ row }"><b>{{ row.knowledgeCount }}</b></template></el-table-column>
        <el-table-column label="文件版本" width="100"><template #default="{ row }"><span class="version-chip">{{ row.version }}</span></template></el-table-column>
        <el-table-column prop="hash" label="文件 Hash" width="130" />
        <el-table-column label="操作" width="185" fixed="right"><template #default="{ row }"><el-button link type="primary" :icon="Download" @click="downloadFile(row.name)">下载</el-button><el-button link :icon="RefreshRight" @click="reparseFile(row.name)">重新解析</el-button><el-dropdown><button class="more-button"><el-icon><MoreFilled /></el-icon></button><template #dropdown><el-dropdown-menu><el-dropdown-item>查看导入记录</el-dropdown-item><el-dropdown-item>查看错误报告</el-dropdown-item><el-dropdown-item>停用关联知识</el-dropdown-item><el-dropdown-item :icon="Delete" divided @click="deleteArchive(row.name)">删除归档</el-dropdown-item></el-dropdown-menu></template></el-dropdown></template></el-table-column>
      </el-table>
    </section>
  </div>
</template>
