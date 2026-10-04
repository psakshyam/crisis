<script setup>
import { ref } from "vue";

const props = defineProps({
  src: { type: String, required: true },
});

const emit = defineEmits(["continue"]);

const videoEl = ref(null);
const ended = ref(false);

let didDismiss = false;

function dismiss() {
  if (didDismiss) return;
  didDismiss = true;
  emit("continue");
}

function onEnded() {
  ended.value = true;
  dismiss();
}

function replay(event) {
  event.stopPropagation();
  if (!videoEl.value) return;
  ended.value = false;
  videoEl.value.currentTime = 0;
  videoEl.value.play();
}
</script>

<template>
  <section class="outcome-stage concept-animation-stage" @click="dismiss">
    <div class="scene-overlay" aria-hidden="true">
      <span class="scene-shape scene-shape-a"></span>
      <span class="scene-shape scene-shape-b"></span>
      <span class="scene-shape scene-shape-c"></span>
    </div>

    <article class="outcome-card concept-animation-card">
      <video
        ref="videoEl"
        class="concept-animation-video"
        :src="props.src"
        autoplay
        muted
        playsinline
        @ended="onEnded"
      ></video>
      <button class="concept-animation-replay" @click="replay" aria-label="Replay animation">&#x21bb;</button>
    </article>
  </section>
</template>
