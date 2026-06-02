<template>
  <button class="frontPageButton" @mouseenter="change(true)" @mouseleave="change(false)">
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

<style scoped>
.frontPageButton {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  height: 300px;
  width: 300px;
  border-radius: 50%;
}
</style>
