<script setup>
import { computed } from "vue";
import BeatSequence from "../scene/BeatSequence.vue";
import { expressionForPoints } from "../scene/palette.js";

// After a choice: the character tells the outcome in a speech bubble, then the
// fun fact is announced on the gradient banner.
const props = defineProps({
  feedback: { type: String, required: true },
  funFact: { type: String, default: "" },
  points: { type: Number, default: 0 },
  maxPoints: { type: Number, default: 4 },
  character: { type: Object, default: null },
  scenario: { type: Object, default: null },
});

const emit = defineEmits(["continue"]);

const beats = computed(() => {
  const outcome = props.character?.art
    ? {
        layout: "desk",
        expression: expressionForPoints(props.points, props.maxPoints),
        bubble: { style: "oval", tail: "left", text: props.feedback },
      }
    : { layout: "office", bubble: { style: "oval", tail: "none", text: props.feedback } };

  const list = [outcome];
  if (props.funFact) list.push({ layout: "announce", title: "Fun fact", body: props.funFact });
  return list;
});
</script>

<template>
  <BeatSequence :beats="beats" :character="character" :scenario="scenario" @complete="emit('continue')" />
</template>
