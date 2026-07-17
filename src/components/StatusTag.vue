<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: string; dot?: boolean }>()
const className = computed(() => {
  if (['已发布', '已完成', '解析成功', '低'].includes(props.value)) return 'success'
  if (['已生成'].includes(props.value)) return 'success'
  if (['草稿', '等待确认', '等待解析', '中', '未生成'].includes(props.value)) return 'warning'
  if (['已停用', '已删除', '失败', '解析失败', '高', '生成失败'].includes(props.value)) return 'danger'
  if (['解析中', '向量生成中', '生成中'].includes(props.value)) return 'primary'
  return 'info'
})
</script>

<template>
  <span class="status-tag" :class="className"><i v-if="dot" />{{ value }}</span>
</template>
