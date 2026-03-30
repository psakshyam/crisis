<script setup>
import { onBeforeUnmount, onMounted } from "vue";

defineProps({
  stageDescription: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["continue"]);

let didContinue = false;

function continueStage() {
  if (didContinue) return;
  didContinue = true;
  emit("continue");
}

function onKeyDown(event) {
  if (event.repeat) return;
  continueStage();
}

onMounted(() => {
  didContinue = false;
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <section class="stage-intro-stage">
    <article class="stage-intro-card">
      <h2>{{ stageDescription }}</h2>
      <button class="cta" @click="continueStage">&rarr;</button>
    </article>
  </section>
</template>
