<script setup lang="ts">
import { Box } from '@element-plus/icons-vue'
defineProps<{ title: string; description: string }>()
</script>

<template>
  <div class="page-empty">
    <el-icon><Box /></el-icon>
    <strong>{{ title }}</strong>
    <p>{{ description }}</p>
  </div>
</template>
