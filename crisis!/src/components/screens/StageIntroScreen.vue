<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import BeatSequence from "../scene/BeatSequence.vue";

const props = defineProps({
  stageDescription: {
    type: String,
    required: true,
  },
  stage: { type: Object, default: null },
  // The mission frame is shown once, before the first question.
  isFirstStage: { type: Boolean, default: false },
  // Character with scene art: show the mission frame instead of the text card.
  character: { type: Object, default: null },
  scenario: { type: Object, default: null },
});

// The stage's own story frames (e.g. Angela's kitchen), then the mission.
const beats = [
  ...(props.stage?.intro_beats || []),
  ...(props.isFirstStage && props.character?.art ? [{ layout: "mission" }] : []),
];

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
  if (!beats.length) window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <BeatSequence
    v-if="beats.length"
    :beats="beats"
    :character="character"
    :scenario="scenario"
    @complete="continueStage"
  />

  <section v-else class="stage-intro-stage">
    <article class="stage-intro-card">
      <h2>{{ stageDescription }}</h2>
      <button class="cta" @click="continueStage">&rarr;</button>
    </article>
  </section>
</template>
