<script setup>
defineProps({
  startPage: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    required: true,
  },
  tagline: {
    type: String,
    required: true,
  },
  cta: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["start"]);
</script>

<template>
  <section class="start-stage">
    <img
      v-if="startPage"
      class="start-bg"
      :src="startPage"
      alt="Start background"
    />
    <button class="cta start-cta" @click="emit('start')">{{ cta }}</button>
  </section>
</template>
