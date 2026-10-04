<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import BeatSequence from "../scene/BeatSequence.vue";
import RichText from "../scene/RichText.vue";
import SolutionFile from "../scene/SolutionFile.vue";
import { questionColor } from "../scene/palette.js";
import { prefersReducedMotion, useTypewriter } from "../scene/useTypewriter.js";

const props = defineProps({
  question: { type: Object, required: true },
  stage: { type: Object, default: null },
  questionNumber: { type: Number, default: 1 },
  totalQuestions: { type: Number, default: 1 },
  character: { type: Object, default: null },
  scenario: { type: Object, default: null },
  getOptionImage: { type: Function, required: true },
  roomMode: { type: String, default: null },
  waitingForTeacher: { type: Boolean, default: false },
  characterId: { type: String, default: null },
});

const emit = defineEmits(["choose"]);

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

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

// The character voices the situation first (scene N), unless the question
// opts out or we're in plain-text room mode.
const speaker = computed(() => (props.characterId && props.character?.art ? props.character : null));
const speechBeats = computed(() => [
  {
    layout: "desk",
    expression: props.question.expression || "neutral",
    bubble: { style: "oval", tail: "left", text: questionText.value, highlights: props.question.highlights },
  },
]);
const phase = ref(speaker.value && props.question.speech !== false ? "speech" : "choose");

const heading = computed(() => props.stage?.title || props.stage?.description || "");
const period = computed(() => props.stage?.period || "");
const promptText = computed(() => props.question.prompt || questionText.value);
const accent = computed(() => questionColor(props.questionNumber));
const fileOwner = computed(() => {
  if (!speaker.value) return "";
  return speaker.value.profile?.name || speaker.value.name.replace(/^Dr\.?\s*/i, "");
});

const prompt = useTypewriter();
const questionStartTime = ref(Date.now());

// ── Option introductions (storyboard frames N.2–N.5 → N.6) ─────────────────
// Every option is shown large in the centre, then shrinks into its grid slot,
// one after another. A tap only cuts the current option's pause short; the
// Skip button places them all.
const optionCount = computed(() => props.question.options?.length || 0);
const placed = ref(0);
const introIndex = ref(-1);
const introEl = ref(null);
const slotEls = [];
const allPlaced = computed(() => placed.value >= optionCount.value);
let skipped = false;
let wake = null;

const INTRO_IN_MS = 280;
const INTRO_HOLD_MS = 1000;
const LAND_MS = 560;
const LAND_EASING = "cubic-bezier(0.65, 0, 0.35, 1)";

function pause(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    wake = () => {
      clearTimeout(timer);
      resolve();
    };
  });
}

function placeAll() {
  skipped = true;
  introEl.value?.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  wake?.();
  introIndex.value = -1;
  placed.value = optionCount.value;
}

function boxOf(el) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    padding: cs.padding,
    rowGap: cs.rowGap,
    borderRadius: cs.borderRadius,
  };
}

function fontOf(el) {
  return { fontSize: getComputedStyle(el).fontSize };
}

// Resize the big card's real geometry (position, size, padding, type) onto
// the slot, fully opaque, so it visibly shrinks into place.
async function landOn(card, slot) {
  slot.scrollIntoView({ block: "nearest" });
  const from = boxOf(card);
  const to = boxOf(slot);
  Object.assign(card.style, { inset: "auto", margin: "0", overflow: "hidden", ...from });

  const pairs = [
    [card.querySelector(".choose-option-label"), slot.querySelector(".choose-option-label")],
    [card.querySelector(".choose-intro-text"), slot.querySelector(".choose-option-text")],
  ];
  const animations = [
    card.animate([from, to], { duration: LAND_MS, easing: LAND_EASING, fill: "forwards" }),
    card.animate([{ boxShadow: getComputedStyle(card).boxShadow }, { boxShadow: "none" }], {
      duration: LAND_MS,
      fill: "forwards",
    }),
    ...pairs
      .filter(([a, b]) => a && b)
      .map(([a, b]) =>
        a.animate([fontOf(a), fontOf(b)], { duration: LAND_MS, easing: LAND_EASING, fill: "forwards" })
      ),
  ];
  await Promise.all(animations.map((a) => a.finished.catch(() => {})));
}

async function introduceOptions() {
  const reduced = prefersReducedMotion();
  for (let i = 0; i < optionCount.value && !skipped; i += 1) {
    introIndex.value = i;
    await nextTick();
    const card = introEl.value;
    const slot = slotEls[i];
    if (!card || !slot) break;

    if (!reduced) {
      await card
        .animate(
          [
            { opacity: 0, transform: "scale(0.92)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: INTRO_IN_MS, easing: "ease-out" }
        )
        .finished.catch(() => {});
    }
    if (skipped) break;
    await pause(INTRO_HOLD_MS);
    if (skipped) break;

    if (reduced) {
      // No movement: cross-fade from the big card to the slot.
      placed.value = i + 1;
      await card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })
        .finished.catch(() => {});
    } else {
      await landOn(card, slot);
      placed.value = i + 1;
    }
    introIndex.value = -1;
    await nextTick();
  }
  if (!skipped) placeAll();
}

// A tap during the intro only shortens the current option's pause.
function onChooseClick() {
  if (!prompt.done.value) prompt.finish();
  else if (!allPlaced.value) wake?.();
}

function onKeyDown(event) {
  if (event.repeat || phase.value !== "choose") return;
  if (event.key !== "Enter" && event.key !== " ") return;
  if (prompt.done.value && allPlaced.value) return; // let focused buttons work
  event.preventDefault();
  onChooseClick();
}

function startChoosing() {
  phase.value = "choose";
  questionStartTime.value = Date.now();
  prompt.start(promptText.value.length, introduceOptions);
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  if (phase.value === "choose") startChoosing();
});

onBeforeUnmount(() => {
  skipped = true;
  wake?.();
  window.removeEventListener("keydown", onKeyDown);
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
  <BeatSequence
    v-if="phase === 'speech'"
    :beats="speechBeats"
    :character="speaker"
    :scenario="scenario"
    @complete="startChoosing"
  />

  <section v-else class="choose-stage" :style="{ '--q-color': accent }" @click="onChooseClick">
    <!-- Teacher-paced: waiting overlay -->
    <div v-if="waitingForTeacher" class="waiting-overlay">
      <p class="waiting-text">Waiting for teacher…</p>
    </div>

    <header class="choose-head">
      <h2 class="choose-title">{{ heading }}</h2>
      <p v-if="period" class="choose-period">{{ period }}</p>
    </header>

    <p class="choose-prompt">
      <RichText :text="promptText" :highlights="question.highlights" :visible="prompt.shown.value" />
    </p>

    <div class="choose-body" :class="{ 'is-revealed': allPlaced }">
      <p class="choose-hint">Choose your answer.</p>

      <div class="choose-options">
        <button
          class="choose-option"
          v-for="(opt, idx) in question.options"
          :key="`${question.id}-${idx}`"
          :ref="(el) => (slotEls[idx] = el)"
          :class="{ 'is-placed': idx < placed }"
          :disabled="waitingForTeacher || !allPlaced"
          @click.stop="handleChoice(opt)"
        >
          <img
            v-if="getOptionImage(idx)"
            :src="getOptionImage(idx)"
            :alt="`Option ${idx + 1}`"
          />
          <span class="choose-option-label">Option {{ OPTION_LETTERS[idx] || idx + 1 }}</span>
          <span class="choose-option-text">{{ resolveText(opt, 'text', 'character_text') }}</span>
        </button>
      </div>
    </div>

    <SolutionFile :total="totalQuestions" :current="questionNumber" :owner="fileOwner" />

    <button
      v-if="prompt.done.value && !allPlaced"
      class="beat-control choose-skip"
      @click.stop="placeAll"
    >
      Skip
    </button>

    <div v-if="introIndex >= 0" ref="introEl" class="choose-intro" aria-hidden="true">
      <span class="choose-option-label">Option {{ OPTION_LETTERS[introIndex] || introIndex + 1 }}</span>
      <span class="choose-intro-text">{{
        resolveText(question.options[introIndex], 'text', 'character_text')
      }}</span>
    </div>
  </section>
</template>
