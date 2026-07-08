<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Connection, Promotion, Refresh, Search } from '@element-plus/icons-vue'
import { getApiErrorMessage } from '../api/http'
import { searchFaqs } from '../api/faq'
import type { FaqSearchItem } from '../api/faq'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  time: string
  loading?: boolean
  results?: FaqSearchItem[]
}

const query = ref('')
const topK = ref(5)
const searching = ref(false)
const messages = ref<ChatMessage[]>([
  {
    id: Date.now(),
    role: 'assistant',
    content: '你好，我是知识库检索测试助手。输入一个用户问题，我会用 BGE-M3 向量检索 FAQ，并模拟智能客服的回答过程。',
    time: formatTime(),
  },
])
const chatBodyRef = ref<HTMLElement>()

const hasConversation = computed(() => messages.value.length > 1)
const suggestions = ['实名认证怎么做？', '如何解绑银行卡？', '订单付款失败怎么办？', '怎么联系人工客服？']

function formatTime() {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function scorePercent(score: number) {
  return `${Math.round(score * 100)}%`
}

function scrollToBottom() {
  void nextTick(() => {
    if (!chatBodyRef.value) return
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  })
}

function buildAssistantContent(items: FaqSearchItem[]) {
  if (!items.length) {
    return '没有检索到足够相似的 FAQ。建议补充相似问法，或检查相关 FAQ 是否已发布并生成向量。'
  }
  const best = items[0]
  return `已召回 ${items.length} 条候选 FAQ。当前最相似的是「${best.standard_question || '未命名 FAQ'}」，相似度 ${scorePercent(best.score)}。模拟回答：${best.answer || '该 FAQ 暂无标准答案。'}`
}

async function submitSearch(text?: string) {
  const finalQuery = (text ?? query.value).trim()
  if (!finalQuery) return ElMessage.warning('请输入要测试的用户问题')
  if (searching.value) return

  query.value = ''
  searching.value = true
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: finalQuery,
    time: formatTime(),
  })
  const loadingId = Date.now() + 1
  messages.value.push({
    id: loadingId,
    role: 'assistant',
    content: '正在生成问题向量，并从 Qdrant 检索相似 FAQ……如果后端刚启动，首次加载本地模型可能需要稍等。',
    time: formatTime(),
    loading: true,
  })
  scrollToBottom()

  try {
    const data = await searchFaqs({ query: finalQuery, top_k: topK.value })
    const index = messages.value.findIndex((item) => item.id === loadingId)
    if (index >= 0) {
      messages.value[index] = {
        id: loadingId,
        role: 'assistant',
        content: buildAssistantContent(data.items),
        time: formatTime(),
        results: data.items,
      }
    }
  } catch (error) {
    const index = messages.value.findIndex((item) => item.id === loadingId)
    if (index >= 0) {
      messages.value[index] = {
        id: loadingId,
        role: 'assistant',
        content: getApiErrorMessage(error, '检索失败，请确认后端、BGE-M3 模型和 Qdrant 服务已正常启动。'),
        time: formatTime(),
      }
    }
  } finally {
    searching.value = false
    scrollToBottom()
  }
}

function resetConversation() {
  messages.value = [messages.value[0]]
}
</script>

<template>
  <div class="search-test-page">
    <section class="panel search-hero">
      <div>
        <span class="eyebrow">SEMANTIC RETRIEVAL TEST</span>
        <h2>FAQ 语义检索测试</h2>
        <p>模拟真实用户提问，查看 BGE-M3 embedding + Qdrant 的召回结果。</p>
      </div>
      <div class="search-hero__meta">
        <div><Connection /><span>向量库</span><strong>Qdrant</strong></div>
        <div><ChatDotRound /><span>模型</span><strong>BGE-M3</strong></div>
      </div>
    </section>

    <section class="panel chat-panel">
      <div class="chat-toolbar">
        <div>
          <h3>对话模拟</h3>
          <p>机器人回答基于检索到的最高相似 FAQ，暂未接入大模型生成。</p>
        </div>
        <div class="chat-toolbar__actions">
          <span>Top K</span>
          <el-input-number v-model="topK" :min="1" :max="20" size="small" />
          <el-button :icon="Refresh" :disabled="!hasConversation" @click="resetConversation">清空</el-button>
        </div>
      </div>

      <div ref="chatBodyRef" class="chat-body">
        <div
          v-for="message in messages"
          :key="message.id"
          class="chat-message"
          :class="message.role"
        >
          <div class="chat-avatar">{{ message.role === 'user' ? '客' : 'AI' }}</div>
          <div class="chat-bubble">
            <div class="chat-bubble__head">
              <strong>{{ message.role === 'user' ? '模拟用户' : '知识库助手' }}</strong>
              <span>{{ message.time }}</span>
            </div>
            <p>
              <el-icon v-if="message.loading" class="is-loading"><Refresh /></el-icon>
              {{ message.content }}
            </p>
            <div v-if="message.results?.length" class="retrieval-list">
              <article v-for="item in message.results" :key="item.faq_id">
                <div>
                  <strong>{{ item.standard_question || '未命名 FAQ' }}</strong>
                  <span>{{ item.knowledge_id || `FAQ_${item.faq_id}` }}</span>
                </div>
                <em>{{ scorePercent(item.score) }}</em>
                <p>{{ item.answer || '暂无答案' }}</p>
                <footer>
                  <span>{{ item.category_l1 || '未分类' }}</span>
                  <span v-if="item.category_l2">{{ item.category_l2 }}</span>
                </footer>
              </article>
            </div>
          </div>
        </div>
      </div>

      <div class="suggestion-row">
        <button
          v-for="item in suggestions"
          :key="item"
          :disabled="searching"
          @click="submitSearch(item)"
        >
          {{ item }}
        </button>
      </div>

      <div class="chat-input">
        <el-input
          v-model="query"
          :prefix-icon="Search"
          :disabled="searching"
          placeholder="输入模拟用户问题，例如：实名认证怎么做？"
          @keyup.enter="submitSearch()"
        />
        <el-button type="primary" :icon="Promotion" :loading="searching" @click="submitSearch()">
          发送测试
        </el-button>
      </div>
    </section>
  </div>
</template>
