<script setup>
import { computed } from "vue";

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  getOptionImage: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(["choose"]);

const animationPreset = computed(() => {
  return props.question.animation || props.question.visual?.animation || "default";
});
</script>

<template>
  <section class="panel gameplay-stage" :class="`anim-${animationPreset}`">
    <div class="scene-overlay" aria-hidden="true">
      <span class="scene-shape scene-shape-a"></span>
      <span class="scene-shape scene-shape-b"></span>
      <span class="scene-shape scene-shape-c"></span>
    </div>

    <div class="gameplay-question-wrap">
      <h2 class="question">{{ question.text }}</h2>
    </div>

    <div class="option-dock">
      <div class="option-grid option-grid-docked">
        <button
          class="option-card"
          v-for="(opt, idx) in question.options"
          :key="`${question.id}-${idx}`"
          @click="emit('choose', opt)"
        >
          <img
            v-if="getOptionImage(idx)"
            :src="getOptionImage(idx)"
            :alt="`Option ${idx + 1}`"
          />
          <p>{{ opt.text }}</p>
        </button>
      </div>
    </div>
  </section>
</template>
