<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import BeatSequence from "../scene/BeatSequence.vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // Scenario with `intro_beats` plays them as scene frames instead of the card.
  scenario: { type: Object, default: null },
  character: { type: Object, default: null },
});

const beats = props.scenario?.intro_beats || null;

const emit = defineEmits(["complete"]);

const shownText = ref("");
const isTyping = ref(true);
let typingTimer = null;

function stopTyping() {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
}

function startTyping() {
  stopTyping();
  shownText.value = "";
  isTyping.value = true;

  let idx = 0;
  typingTimer = setInterval(() => {
    shownText.value += props.description[idx];
    idx += 1;

    if (idx >= props.description.length) {
      stopTyping();
      isTyping.value = false;
    }
  }, 14);
}

function onAction() {
  if (isTyping.value) {
    stopTyping();
    shownText.value = props.description;
    isTyping.value = false;
    return;
  }

  emit("complete");
}

function onKeyDown(event) {
  if (event.repeat) return;
  onAction();
}

onMounted(() => {
  if (beats) return;
  startTyping();
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  stopTyping();
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <BeatSequence
    v-if="beats"
    :beats="beats"
    :character="character"
    :scenario="scenario"
    @complete="emit('complete')"
  />

  <section v-else class="cutscene-stage">
    <article class="cutscene-panel">
      <h2>{{ title }}</h2>
      <p class="cutscene-typewriter">{{ shownText }}</p>
      <button class="cta" @click="onAction">&rarr;</button>
    </article>
  </section>
</template>
