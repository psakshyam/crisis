<script setup>
import { questionColor } from "./palette.js";

// The folder with Q1…Qn tabs that sits at the bottom of the decision screen.
defineProps({
  total: { type: Number, required: true },
  current: { type: Number, required: true },
  owner: { type: String, default: "" },
});
</script>

<template>
  <div class="solution-file" aria-hidden="true">
    <div class="solution-file-tabs">
      <span
        v-for="n in total"
        :key="n"
        class="solution-file-tab"
        :class="{ 'is-active': n === current }"
        :style="{ '--tab-color': questionColor(n) }"
        >Q{{ n }}</span
      >
    </div>
    <div class="solution-file-body">
      <div class="solution-file-label">
        <span v-if="owner" class="solution-file-owner">{{ owner }}'s</span>
        <span class="solution-file-name">SOLUTION FILE</span>
      </div>
    </div>
  </div>
</template>
