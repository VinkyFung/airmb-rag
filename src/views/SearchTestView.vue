<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Connection, Promotion, Refresh, Search } from '@element-plus/icons-vue'
import { getApiErrorMessage } from '../api/http'
import { askChat } from '../api/faq'
import type { ChatConfidence, FaqSearchDebug, FaqSearchItem } from '../api/faq'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  time: string
  loading?: boolean
  answerable?: boolean
  confidence?: ChatConfidence
  score?: number | null
  sources?: FaqSearchItem[]
  debug?: FaqSearchDebug | null
}

const query = ref('')
const topK = ref(5)
const searching = ref(false)
const messages = ref<ChatMessage[]>([
  {
    id: Date.now(),
    role: 'assistant',
    content:
      '你好，我是知识库问答测试助手。输入一个用户问题，我会先用 BGE-M3 向量召回 FAQ，再用 reranker 重排，最后基于命中的 FAQ 生成规则回答。',
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

function scorePercent(score: number | null | undefined) {
  if (score === null || score === undefined) return '-'
  return `${Math.round(score * 100)}%`
}

function confidenceLabel(confidence?: ChatConfidence) {
  const labels: Record<ChatConfidence, string> = {
    high: '高置信',
    medium: '中置信',
    low: '低置信',
    none: '未命中',
  }
  return confidence ? labels[confidence] : '待判断'
}

function confidenceTagType(confidence?: ChatConfidence) {
  if (confidence === 'high') return 'success'
  if (confidence === 'medium') return 'warning'
  if (confidence === 'low') return 'danger'
  if (confidence === 'none') return 'info'
  return 'info'
}

function scrollToBottom() {
  void nextTick(() => {
    if (!chatBodyRef.value) return
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  })
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
    content:
      '正在生成问题向量、从 Qdrant 召回候选 FAQ，并使用 reranker 重排后生成规则回答……如果后端刚启动，首次加载本地模型可能需要稍等。',
    time: formatTime(),
    loading: true,
  })
  scrollToBottom()

  try {
    const data = await askChat({ question: finalQuery, top_k: topK.value })
    const index = messages.value.findIndex((item) => item.id === loadingId)
    if (index >= 0) {
      messages.value[index] = {
        id: loadingId,
        role: 'assistant',
        content: data.answer,
        time: formatTime(),
        answerable: data.answerable,
        confidence: data.confidence,
        score: data.score,
        sources: data.sources,
        debug: data.debug,
      }
    }
  } catch (error) {
    const index = messages.value.findIndex((item) => item.id === loadingId)
    if (index >= 0) {
      messages.value[index] = {
        id: loadingId,
        role: 'assistant',
        content: getApiErrorMessage(
          error,
          '问答测试失败，请确认后端、BGE-M3 模型、reranker 模型和 Qdrant 服务已正常启动。',
        ),
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
        <span class="eyebrow">RAG CHAT TEST</span>
        <h2>FAQ 问答测试</h2>
        <p>模拟真实用户提问，验证 BGE-M3 embedding + Qdrant 召回 + reranker 重排 + 规则回答闭环。</p>
      </div>
      <div class="search-hero__meta">
        <div><Connection /><span>向量库</span><strong>Qdrant</strong></div>
        <div><ChatDotRound /><span>模型</span><strong>BGE-M3 + reranker</strong></div>
      </div>
    </section>

    <section class="panel chat-panel">
      <div class="chat-toolbar">
        <div>
          <h3>对话模拟</h3>
          <p>当前回答由后端 /chat/ask 生成：先检索 FAQ，再根据置信度决定直接回答、谨慎回答或提示未命中。</p>
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

            <div v-if="message.confidence" class="answer-meta">
              <el-tag :type="confidenceTagType(message.confidence)" size="small">
                {{ confidenceLabel(message.confidence) }}
              </el-tag>
              <span>最终分数：{{ scorePercent(message.score) }}</span>
              <span>{{ message.answerable ? '可回答' : '建议转人工/补充知识' }}</span>
            </div>

            <div v-if="message.sources?.length" class="retrieval-list">
              <div class="source-title">引用来源</div>
              <article v-for="item in message.sources" :key="item.faq_id">
                <div>
                  <strong>
                    <template v-if="item.rank">#{{ item.rank }} · </template>
                    {{ item.standard_question || '未命名 FAQ' }}
                  </strong>
                  <span>{{ item.knowledge_id || `FAQ_${item.faq_id}` }}</span>
                </div>
                <em>{{ scorePercent(item.score) }}</em>
                <div class="score-breakdown">
                  <span v-if="item.reranker_score !== null">
                    reranker {{ scorePercent(item.reranker_score) }}
                  </span>
                  <span v-if="item.vector_score !== null">
                    vector {{ scorePercent(item.vector_score) }}
                  </span>
                  <span v-if="item.rank_before_rerank && item.rank_before_rerank !== item.rank">
                    原排序 #{{ item.rank_before_rerank }}
                  </span>
                </div>
                <p>{{ item.answer || '暂无答案' }}</p>
                <footer>
                  <span>{{ item.category_l1 || '未分类' }}</span>
                  <span v-if="item.category_l2">{{ item.category_l2 }}</span>
                  <span v-if="item.category_l3">{{ item.category_l3 }}</span>
                </footer>
              </article>
            </div>

            <div v-if="message.debug" class="retrieval-debug">
              <div>
                <span>总耗时</span>
                <strong>{{ message.debug.total_ms }}ms</strong>
              </div>
              <div>
                <span>Embedding</span>
                <strong>{{ message.debug.embedding_ms }}ms</strong>
              </div>
              <div>
                <span>Qdrant</span>
                <strong>{{ message.debug.vector_search_ms }}ms</strong>
              </div>
              <div>
                <span>Reranker</span>
                <strong>{{ message.debug.reranker_used ? `${message.debug.reranker_ms}ms` : '降级' }}</strong>
              </div>
              <div>
                <span>召回</span>
                <strong>{{ message.debug.returned }}/{{ message.debug.candidate_top_k || topK }}</strong>
              </div>
              <p>
                {{ message.debug.embedding_model }} · {{ message.debug.embedding_dimension }} 维 ·
                collection: {{ message.debug.vector_collection }} · query length: {{ message.debug.query_length }}
              </p>
              <p v-if="message.debug.reranker_enabled">
                reranker: {{ message.debug.reranker_model }}
                <template v-if="message.debug.reranker_used"> · 已启用重排</template>
                <template v-else> · 未使用，已降级为向量排序</template>
              </p>
              <p v-if="message.debug.reranker_error" class="debug-error">
                reranker error: {{ message.debug.reranker_error }}
              </p>
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
