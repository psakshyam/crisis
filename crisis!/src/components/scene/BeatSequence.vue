<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import SceneBeat from "./SceneBeat.vue";
import { preloadScene } from "./sceneArt.js";
import { prefersReducedMotion, useTypewriter } from "./useTypewriter.js";

// Plays a list of story beats. Tap / Enter / Space / → advances (first press
// finishes the typewriter), ← goes back. Emits `complete` after the last beat.
//
// Consecutive beats with the character in the same shot (desk / close) form a
// group: the scene stays on screen and only the expression and bubble text
// change. Everything else fades between frames.
const props = defineProps({
  beats: { type: Array, required: true },
  character: { type: Object, default: null },
  scenario: { type: Object, default: null },
});

const emit = defineEmits(["complete"]);

const CONTINUOUS_LAYOUTS = ["desk", "close"];
const FADE_MS = 380;

const index = ref(0);
const ready = ref(false);
const leaving = ref(false);
const { shown, done, start, finish } = useTypewriter();
let didComplete = false;
let unmounted = false;

const beat = computed(() => props.beats[index.value] || null);

const groupIds = computed(() => {
  const ids = [];
  props.beats.forEach((b, i) => {
    const prev = props.beats[i - 1];
    const continues = prev && CONTINUOUS_LAYOUTS.includes(b.layout) && prev.layout === b.layout;
    ids.push(continues ? ids[i - 1] : i);
  });
  return ids;
});

const reserveText = computed(() => {
  const group = groupIds.value[index.value];
  return props.beats
    .filter((_, i) => groupIds.value[i] === group)
    .map((b) => b.bubble?.text || "")
    .reduce((longest, text) => (text.length > longest.length ? text : longest), "");
});

function typedText(b) {
  if (!b) return "";
  if (b.bubble?.text) return b.bubble.text;
  return b.body ?? props.scenario?.[b.body_from] ?? "";
}

function play(newIndex, oldIndex) {
  const text = typedText(beat.value);
  // A line that continues the previous bubble in the same shot keeps what was
  // already typed and only types the new part.
  let from = 0;
  if (oldIndex !== undefined && groupIds.value[newIndex] === groupIds.value[oldIndex]) {
    const previous = typedText(props.beats[oldIndex]);
    if (previous && text.startsWith(previous)) from = previous.length;
  }
  start(text.length, null, from);
}

function complete() {
  if (didComplete) return;
  didComplete = true;
  if (prefersReducedMotion()) {
    emit("complete");
    return;
  }
  leaving.value = true;
  setTimeout(() => emit("complete"), FADE_MS);
}

function next() {
  if (leaving.value || !ready.value) return;
  if (!done.value) {
    finish();
    return;
  }
  if (index.value < props.beats.length - 1) {
    index.value += 1;
    return;
  }
  complete();
}

function back() {
  if (index.value > 0 && !leaving.value) index.value -= 1;
}

function onKeyDown(event) {
  if (event.repeat) return;
  if (["Enter", " ", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    next();
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    back();
  }
}

watch(index, play);

onMounted(async () => {
  if (!props.beats.length) {
    didComplete = true;
    emit("complete");
    return;
  }
  window.addEventListener("keydown", onKeyDown);
  // Wait for every image these beats use (background, character, desk props),
  // so each scene appears as one piece instead of props popping in later.
  await preloadScene(props.beats, props.character, props.scenario);
  if (unmounted) return;
  ready.value = true;
  play(0);
});

onBeforeUnmount(() => {
  unmounted = true;
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <div class="beat-sequence" :class="{ 'is-ready': ready, 'is-leaving': leaving }" @click="next">
    <transition name="beat-fade" mode="out-in">
      <SceneBeat
        v-if="ready && beat"
        :key="groupIds[index]"
        :beat="beat"
        :character="character"
        :scenario="scenario"
        :visible="shown"
        :reserve-text="reserveText"
      />
    </transition>

    <div class="beat-controls">
      <button
        v-if="index > 0"
        class="beat-control beat-control--back"
        aria-label="Previous"
        @click.stop="back"
      >
        &larr;
      </button>
      <button class="beat-control" aria-label="Continue" @click.stop="next">&rarr;</button>
    </div>
  </div>
</template>
