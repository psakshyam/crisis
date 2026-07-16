<script setup>
import { computed, ref, onMounted } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  getOptionImage: { type: Function, required: true },
  roomMode: { type: String, default: null },
  waitingForTeacher: { type: Boolean, default: false },
  characterId: { type: String, default: null },
});

const emit = defineEmits(["choose"]);

const animationPreset = computed(() => {
  return props.question.animation || props.question.visual?.animation || "default";
});

// When a characterId is set (solo mode), use the character-specific variant.
// When null (room mode), use plain text.
function resolveText(obj, defaultField, charField) {
  const basic = obj[defaultField] || '';
  if (!props.characterId) return basic;
  return obj[charField]?.[props.characterId] || basic;
}

const questionText = computed(() =>
  resolveText(props.question, 'text', 'character_text')
);

const questionStartTime = ref(Date.now());
onMounted(() => {
  questionStartTime.value = Date.now();
});

function handleChoice(opt) {
  const timeSpentSeconds = Math.round((Date.now() - questionStartTime.value) / 1000);
  const maxPoints = Math.max(...(props.question.options || []).map(o => o.points ?? 0));
  // Attach resolved feedback so App.vue can use it for the OutcomeSlide
  const feedback = resolveText(opt, 'feedback', 'character_feedback');
  emit("choose", { ...opt, feedback, timeSpentSeconds, maxPoints });
}
</script>

<template>
  <section class="panel gameplay-stage" :class="`anim-${animationPreset}`">
    <div class="scene-overlay" aria-hidden="true">
      <span class="scene-shape scene-shape-a"></span>
      <span class="scene-shape scene-shape-b"></span>
      <span class="scene-shape scene-shape-c"></span>
    </div>

    <!-- Teacher-paced: waiting overlay -->
    <div v-if="waitingForTeacher" class="waiting-overlay">
      <p class="waiting-text">Waiting for teacher…</p>
    </div>

    <div class="gameplay-question-wrap">
      <h2 class="question">{{ questionText }}</h2>
    </div>

    <div class="option-dock" :class="{ 'option-dock--disabled': waitingForTeacher }">
      <div class="option-grid option-grid-docked">
        <button
          class="option-card"
          v-for="(opt, idx) in question.options"
          :key="`${question.id}-${idx}`"
          :disabled="waitingForTeacher"
          @click="handleChoice(opt)"
        >
          <img
            v-if="getOptionImage(idx)"
            :src="getOptionImage(idx)"
            :alt="`Option ${idx + 1}`"
          />
          <p>{{ resolveText(opt, 'text', 'character_text') }}</p>
        </button>
      </div>
    </div>
  </section>
</template>
