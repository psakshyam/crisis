<script setup>
import { computed } from "vue";

// Renders text with highlighted words (e.g. { "rising": "bad" }). For the
// typewriter effect only the first `visible` characters are shown; the rest is
// laid out but hidden, so the surrounding box is full size from the start.
const props = defineProps({
  text: { type: String, default: "" },
  highlights: { type: Object, default: () => ({}) },
  visible: { type: Number, default: Infinity },
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const segments = computed(() => {
  const words = Object.keys(props.highlights || {});
  if (!words.length) return [{ text: props.text, tone: null }];

  const lookup = Object.fromEntries(words.map((w) => [w.toLowerCase(), props.highlights[w]]));
  const pattern = new RegExp(`\\b(${words.map(escapeRegExp).join("|")})\\b`, "gi");
  return props.text
    .split(pattern)
    .filter(Boolean)
    .map((part) => ({ text: part, tone: lookup[part.toLowerCase()] || null }));
});

const pieces = computed(() => {
  let remaining = props.visible;
  const out = [];
  for (const seg of segments.value) {
    const shown = Math.max(0, Math.min(seg.text.length, remaining));
    if (shown > 0) out.push({ text: seg.text.slice(0, shown), tone: seg.tone, hidden: false });
    if (shown < seg.text.length) out.push({ text: seg.text.slice(shown), tone: seg.tone, hidden: true });
    remaining -= seg.text.length;
  }
  return out;
});
</script>

<template>
  <span class="rich-text">
    <span aria-hidden="true">
      <span
        v-for="(seg, idx) in pieces"
        :key="idx"
        :class="[seg.tone && `rich-text-hl rich-text-hl--${seg.tone}`, seg.hidden && 'rich-text-pending']"
        >{{ seg.text }}</span
      >
    </span>
    <span class="visually-hidden">{{ text }}</span>
  </span>
</template>
