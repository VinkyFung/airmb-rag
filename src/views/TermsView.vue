<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Plus, Search, Upload } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '../stores/knowledge'
import StatusTag from '../components/StatusTag.vue'

const store = useKnowledgeStore()
const keyword = ref('')
const status = ref('')
const dialogVisible = ref(false)
const filtered = computed(() => store.terms.filter((item) =>
  (!keyword.value || [item.term, item.definition, ...item.aliases].some((text) => text.includes(keyword.value))) &&
  (!status.value || item.status === status.value),
))
function importWord() { ElMessage.info('importWord 方法已预留，当前版本暂不上传文件') }
</script>

<template>
  <div>
    <section class="panel toolbar-panel">
      <div class="toolbar-row">
        <div class="primary-actions"><el-button type="primary" :icon="Plus" @click="dialogVisible = true">新增术语</el-button><el-button :icon="Upload" @click="importWord">导入 Word</el-button></div>
        <div class="filter-actions"><el-input v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索术语、别名或定义" /><el-select v-model="status" clearable placeholder="全部状态"><el-option label="已发布" value="已发布" /><el-option label="草稿" value="草稿" /></el-select></div>
      </div>
    </section>
    <section class="panel table-panel">
      <div class="table-meta"><span>共 <b>{{ filtered.length }}</b> 条专业术语</span><span>术语候选须经人工确认后发布</span></div>
      <el-table :data="filtered" stripe>
        <el-table-column label="术语" min-width="130"><template #default="{ row }"><div class="term-name"><span class="term-avatar">{{ row.term.slice(0, 1) }}</span><strong>{{ row.term }}</strong></div></template></el-table-column>
        <el-table-column label="别名" min-width="160"><template #default="{ row }"><span v-for="alias in row.aliases" :key="alias" class="mini-chip">{{ alias }}</span></template></el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="definition" label="专业定义" min-width="300" show-overflow-tooltip />
        <el-table-column label="来源文档" min-width="230"><template #default="{ row }"><div class="source-cell"><strong>{{ row.source }}</strong><span>{{ row.chapter }}</span></div></template></el-table-column>
        <el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :value="row.status" dot /></template></el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="120" />
        <el-table-column label="操作" width="100" fixed="right"><template #default><el-button link type="primary" :icon="EditPen" @click="dialogVisible = true">编辑</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-row"><span>每页 20 条</span><el-pagination background layout="prev, pager, next" :total="86" :page-size="20" /></div>
    </section>
    <el-dialog v-model="dialogVisible" title="新增专业术语" width="560px">
      <el-form label-position="top"><div class="form-grid"><el-form-item label="标准术语"><el-input placeholder="请输入术语名称" /></el-form-item><el-form-item label="分类"><el-select placeholder="请选择"><el-option label="钱币基础" value="钱币基础" /><el-option label="品相评级" value="品相评级" /></el-select></el-form-item></div><el-form-item label="别名"><el-select multiple filterable allow-create placeholder="输入后按回车添加" /></el-form-item><el-form-item label="专业定义"><el-input type="textarea" :rows="5" placeholder="请输入准确、完整的术语解释" /></el-form-item><el-form-item label="示例（可选）"><el-input type="textarea" :rows="2" /></el-form-item></el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="dialogVisible = false; ElMessage.success('术语已保存为草稿')">保存草稿</el-button></template>
    </el-dialog>
  </div>
</template>
