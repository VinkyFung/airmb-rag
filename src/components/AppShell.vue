<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, ChatDotRound, Collection, Document, Files, Fold, House, List, Menu as MenuIcon,
  Setting, Tickets, UploadFilled,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)

const title = computed(() => String(route.meta.title ?? '知识库管理'))
const subtitle = computed(() => String(route.meta.subtitle ?? ''))
const activePath = computed(() => route.path)

const menus = [
  { path: '/dashboard', label: '知识库概览', icon: House },
  { path: '/faq', label: 'FAQ 管理', icon: List },
  { path: '/terms', label: '术语管理', icon: Collection },
  { path: '/documents', label: '文档知识', icon: Document },
  { path: '/imports', label: '导入任务', icon: UploadFilled, badge: 2 },
  { path: '/files', label: '文件归档', icon: Files },
  { path: '/search-test', label: '检索测试', icon: ChatDotRound },
]
</script>

<template>
  <div class="app-shell" :class="{ 'is-collapsed': collapsed }">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark"><Tickets /></div>
        <div v-if="!collapsed" class="brand-copy">
          <strong>爱藏知识库</strong>
          <span>AI Knowledge Hub</span>
        </div>
      </div>

      <div v-if="!collapsed" class="menu-caption">知识管理</div>
      <nav class="nav-list">
        <button
          v-for="menu in menus"
          :key="menu.path"
          class="nav-item"
          :class="{ active: activePath === menu.path }"
          :title="collapsed ? menu.label : undefined"
          @click="router.push(menu.path)"
        >
          <el-icon><component :is="menu.icon" /></el-icon>
          <span v-if="!collapsed">{{ menu.label }}</span>
          <em v-if="menu.badge && !collapsed">{{ menu.badge }}</em>
        </button>
      </nav>

      <div class="sidebar-spacer" />
      <div v-if="!collapsed" class="system-card">
        <div class="system-card__top">
          <span class="status-dot" /> 系统运行正常
        </div>
        <p>知识库版本 v13</p>
        <div><span>向量索引</span><b>98.7%</b></div>
        <el-progress :percentage="98.7" :show-text="false" :stroke-width="5" />
      </div>
      <button class="nav-item" :class="{ active: activePath === '/settings' }" @click="router.push('/settings')">
        <el-icon><Setting /></el-icon><span v-if="!collapsed">系统配置</span>
      </button>
      <button class="collapse-button" @click="collapsed = !collapsed">
        <el-icon><component :is="collapsed ? MenuIcon : Fold" /></el-icon>
        <span v-if="!collapsed">收起导航</span>
      </button>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="page-heading">
          <div class="mobile-back"><el-icon><ArrowLeft /></el-icon></div>
          <div>
            <h1>{{ title }}</h1>
            <p>{{ subtitle }}</p>
          </div>
        </div>
        <div class="top-actions">
          <div class="user">
            <div class="avatar">客</div>
            <div class="user-copy"><strong>客服运营</strong><span>知识库管理员</span></div>
          </div>
        </div>
      </header>
      <section class="page-content">
        <router-view />
      </section>
    </main>
  </div>
</template>
