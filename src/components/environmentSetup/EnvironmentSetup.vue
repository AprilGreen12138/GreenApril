<template>
  <a-input v-model:value="node.dataDirectory" placeholder="请输入数据挂载目录" />
  <a-input v-model:value="node.server" placeholder="请输入server节点" />
  <a-input v-model:value="node.agent" placeholder="请输入agent节点" />
</template>

<script setup>
import { reactive } from 'vue';
import { Input as AInput } from 'ant-design-vue';

const node = reactive({
  server: '',
  agent: '',
  dataDirectory: '',
});
</script>
