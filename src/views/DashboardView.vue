<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Collection, Document, List, MoreFilled, RefreshRight, TrendCharts, UploadFilled, Warning } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '../stores/knowledge'
import StatusTag from '../components/StatusTag.vue'

const store = useKnowledgeStore()
const router = useRouter()
const failedTasks = computed(() => store.tasks.filter((item) => item.status === '失败').length)

const activities = [
  { color: '#3076f5', title: 'FAQ 批量导入完成', detail: '账户与交易FAQ_202607.xlsx · 新增 18 条，更新 7 条', time: '今天 16:26' },
  { color: '#16a085', title: '文档知识发布成功', detail: '《爱藏交易服务规则（2026年版）》已发布 126 个知识分块', time: '今天 11:26' },
  { color: '#e4a21a', title: '术语解析等待确认', detail: '钱币收藏专业术语手册.docx · 4 条警告待处理', time: '昨天 09:32' },
]
</script>

<template>
  <div class="dashboard">
    <div class="welcome-banner">
      <div>
        <span class="eyebrow">KNOWLEDGE OVERVIEW</span>
        <h2>下午好，知识库今天也很健康。</h2>
        <p>共有 2 个任务需要关注，建议优先确认术语解析结果。</p>
      </div>
      <el-button type="primary" :icon="UploadFilled" @click="router.push('/imports')">导入知识</el-button>
      <div class="banner-decoration"><span /><span /><span /></div>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon blue"><el-icon><List /></el-icon></div>
        <div><span>FAQ 总数</span><strong>1,248</strong><p><b>+25</b> 本周新增</p></div>
        <el-icon class="stat-more"><MoreFilled /></el-icon>
      </article>
      <article class="stat-card">
        <div class="stat-icon teal"><el-icon><Collection /></el-icon></div>
        <div><span>专业术语</span><strong>386</strong><p><b>+42</b> 等待确认</p></div>
        <el-icon class="stat-more"><MoreFilled /></el-icon>
      </article>
      <article class="stat-card">
        <div class="stat-icon purple"><el-icon><Document /></el-icon></div>
        <div><span>文档知识</span><strong>28</strong><p>共 1,846 个知识分块</p></div>
        <el-icon class="stat-more"><MoreFilled /></el-icon>
      </article>
      <article class="stat-card alert">
        <div class="stat-icon orange"><el-icon><Warning /></el-icon></div>
        <div><span>待处理任务</span><strong>{{ failedTasks + 1 }}</strong><p><b>1 个失败</b> 需要处理</p></div>
        <el-icon class="stat-more"><MoreFilled /></el-icon>
      </article>
    </div>

    <div class="dashboard-grid">
      <section class="panel task-panel">
        <div class="panel-heading">
          <div><h3>处理中任务</h3><p>解析与向量任务实时进度</p></div>
          <el-button text type="primary" @click="router.push('/imports')">查看全部 <el-icon><ArrowRight /></el-icon></el-button>
        </div>
        <div v-for="task in store.tasks.slice(1, 4)" :key="task.id" class="mini-task">
          <div class="file-type" :class="task.type.toLowerCase()">{{ task.type.slice(0, 1) }}</div>
          <div class="mini-task__main">
            <div><strong>{{ task.fileName }}</strong><StatusTag :value="task.status" /></div>
            <p>{{ task.id }} · {{ task.stage }}</p>
            <el-progress :percentage="task.progress" :status="task.status === '失败' ? 'exception' : undefined" :stroke-width="6" />
          </div>
          <button class="task-action"><el-icon><RefreshRight /></el-icon></button>
        </div>
      </section>

      <section class="panel health-panel">
        <div class="panel-heading">
          <div><h3>知识健康度</h3><p>已发布知识质量概况</p></div>
          <el-icon class="heading-icon"><TrendCharts /></el-icon>
        </div>
        <div class="health-score">
          <el-progress type="circle" :percentage="94" :width="126" :stroke-width="10" color="#3076f5">
            <template #default><strong>94</strong><span>健康分</span></template>
          </el-progress>
          <div class="health-legend">
            <div><i class="green" /><span>已发布知识</span><b>1,521</b></div>
            <div><i class="yellow" /><span>待向量化</span><b>63</b></div>
            <div><i class="red" /><span>处理失败</span><b>4</b></div>
          </div>
        </div>
        <div class="health-tip"><span>!</span><p><strong>有 6 条知识超过 180 天未更新</strong><br>建议定期核对规则与业务时效。</p></div>
      </section>
    </div>

    <section class="panel recent-panel">
      <div class="panel-heading">
        <div><h3>最近动态</h3><p>知识导入、更新和发布记录</p></div>
        <el-button text>查看审计日志</el-button>
      </div>
      <div class="activity-list">
        <div v-for="activity in activities" :key="activity.title" class="activity">
          <div class="activity-dot" :style="{ background: activity.color }" />
          <div><strong>{{ activity.title }}</strong><p>{{ activity.detail }}</p></div>
          <time>{{ activity.time }}</time>
        </div>
      </div>
    </section>
  </div>
</template>
