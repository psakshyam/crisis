<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  character: { type: Object, required: true },
  crisisTitle: { type: String, default: "" },
});

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
  startTyping();
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  stopTyping();
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <section class="character-intro-stage">
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
