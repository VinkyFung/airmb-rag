<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Connection, Lock, SetUp } from '@element-plus/icons-vue'
</script>

<template>
  <div class="settings-grid">
    <section class="panel setting-section">
      <div class="setting-heading"><span class="stat-icon blue"><SetUp /></span><div><h3>知识发布策略</h3><p>控制知识审核与自动发布行为</p></div></div>
      <div class="setting-row"><div><strong>导入后必须人工确认</strong><p>Excel、Word、PDF 解析结果进入预览区，确认后才写入正式知识库。</p></div><el-switch :model-value="true" /></div>
      <div class="setting-row"><div><strong>高风险知识自动回答</strong><p>涉及资金、实名与账户安全的知识是否允许智能客服直接回答。</p></div><el-switch :model-value="false" /></div>
      <div class="setting-row"><div><strong>知识过期提醒</strong><p>知识超过 180 天未更新时在概览页提示。</p></div><el-switch :model-value="true" /></div>
    </section>
    <section class="panel setting-section">
      <div class="setting-heading"><span class="stat-icon teal"><Connection /></span><div><h3>处理与向量配置</h3><p>当前为界面预览，尚未连接服务</p></div></div>
      <div class="config-box"><div><span>Embedding 模型</span><strong>text-embedding-v3</strong></div><div><span>向量索引版本</span><strong>faq_index_v13</strong></div><div><span>任务进度模式</span><strong>SSE（优先）</strong></div><div><span>文件存储</span><strong>阿里云 OSS · 私有</strong></div></div>
      <el-button @click="ElMessage.info('saveVectorConfig 方法已预留')">编辑配置</el-button>
    </section>
    <section class="panel setting-section full-width">
      <div class="setting-heading"><span class="stat-icon purple"><Lock /></span><div><h3>访问与安全</h3><p>首期不启用登录，生产环境仍需限制网络访问</p></div></div>
      <el-alert title="当前为无登录演示模式" description="正式部署时请通过内网、VPN 或 IP 白名单限制管理后台访问，并在接口层预留 created_by 与 updated_by。" type="warning" :closable="false" show-icon />
    </section>
  </div>
</template>
