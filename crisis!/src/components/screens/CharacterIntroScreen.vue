<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import BeatSequence from "../scene/BeatSequence.vue";

const props = defineProps({
  character: { type: Object, required: true },
  crisisTitle: { type: String, default: "" },
  scenario: { type: Object, default: null },
});

// Characters with scene art play their opening as scene frames. Without
// authored `opening_beats`, the opening_scene text is voiced at the desk.
function buildBeats(character) {
  if (character.opening_beats?.length) return character.opening_beats;
  if (!character.art) return null;
  const beats = [{ layout: "desk", expression: "neutral" }];
  if (character.opening_scene) {
    beats.push({
      layout: "desk",
      expression: "frown",
      bubble: { style: "rounded", tail: "none", text: character.opening_scene },
    });
  }
  if (character.profile) beats.push({ layout: "profile" });
  return beats;
}

const beats = buildBeats(props.character);

const emit = defineEmits(["complete"]);

const shownScene = ref("");
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
  shownScene.value = "";
  isTyping.value = true;
  const text = props.character.opening_scene || "";
  let idx = 0;
  typingTimer = setInterval(() => {
    shownScene.value += text[idx];
    idx++;
    if (idx >= text.length) {
      stopTyping();
      isTyping.value = false;
    }
  }, 18);
}

function onAction() {
  if (isTyping.value) {
    stopTyping();
    shownScene.value = props.character.opening_scene || "";
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

  <section v-else class="character-intro-stage">
    <div class="character-intro-inner">
      <div class="character-portrait-wrap">
        <img
          v-if="character.image"
          :src="character.image"
          :alt="character.name"
          class="character-portrait"
        />
      </div>

      <div class="character-details">
        <p class="character-crisis-label">{{ crisisTitle }}</p>
        <h2 class="character-name">{{ character.name }}</h2>
        <p class="character-role">{{ character.role }}</p>

        <div class="character-scene-wrap">
          <p class="character-scene-typewriter">{{ shownScene }}</p>
        </div>

        <button class="cta character-cta" @click="onAction">
          {{ isTyping ? "Skip →" : "Begin →" }}
        </button>
      </div>
    </div>
  </section>
</template>
