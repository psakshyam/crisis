<script setup>
import { onBeforeUnmount, onMounted } from "vue";

defineProps({
  feedback: {
    type: String,
    required: true,
  },
  animation: {
    type: String,
    default: "default",
  },
});

const emit = defineEmits(["continue"]);

let didDismiss = false;

function dismiss() {
  if (didDismiss) return;
  didDismiss = true;
  emit("continue");
}

function onKeyDown() {
  dismiss();
}

onMounted(() => {
  didDismiss = false;
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <section class="outcome-stage" :class="`anim-${animation}`">
    <div class="scene-overlay" aria-hidden="true">
      <span class="scene-shape scene-shape-a"></span>
      <span class="scene-shape scene-shape-b"></span>
      <span class="scene-shape scene-shape-c"></span>
    </div>

    <article class="outcome-card">
      <p class="outcome-feedback">{{ feedback }}</p>
      <button class="cta" @click="dismiss">&rarr;</button>
    </article>
  </section>
</template>
