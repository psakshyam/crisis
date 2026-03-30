<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  finalScoreLabel: {
    type: String,
    required: true,
  },
  replayLabel: {
    type: String,
    required: true,
  },
  finalScore: {
    type: Number,
    required: true,
  },
  finalResult: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["replay"]);

const cleanedResultTitle = computed(() => {
  const titleText = props.finalResult?.title || "";
  return titleText.replace(/^Scenario\s+\d+\s*:\s*/i, "").trim();
});
</script>

<template>
  <section class="panel">
    <h2>{{ title }}</h2>
    <p class="score">{{ finalScoreLabel }}: {{ finalScore }}</p>

    <article class="result-panel">
      <h3 class="result-title">{{ cleanedResultTitle }}</h3>
      <p class="feedback">{{ finalResult.summary }}</p>

      <ul
        v-if="Array.isArray(finalResult.simpleSummary) && finalResult.simpleSummary.length"
        class="result-simple-list"
      >
        <li v-for="(line, idx) in finalResult.simpleSummary" :key="idx">{{ line }}</li>
      </ul>
    </article>

    <button class="cta" @click="emit('replay')">{{ replayLabel }}</button>
  </section>
</template>
