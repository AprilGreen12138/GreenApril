<template>
  <button
    class="absolute top-1/2 left-1/2 -translate-1/2 text-2xl size-75 rounded-full bg-green-500"
    @mouseenter="change(true)"
    @mouseleave="change(false)"
    @click="handleClick">
    {{ buttonText }}
  </button>
</template>

<script setup>
import { ref } from 'vue';
// import { router } from 'vue-router';

const defaultText = '欢迎来到四月的小屋';
const hoverText = '进入魔幻世界';

const buttonText = ref(defaultText);

const change = (isEnter) => {
  buttonText.value = isEnter ? hoverText : defaultText;
};
</script>
