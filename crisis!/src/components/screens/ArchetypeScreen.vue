<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  chooseLabel: {
    type: String,
    required: true,
  },
  archetypes: {
    type: Array,
    required: true,
  },
  getArchetypeImage: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(["choose"]);
</script>

<template>
  <section class="archetype-stage">
    <h2 class="archetype-title">{{ title }}</h2>
    <div class="archetype-gallery">
      <button
        class="archetype-card"
        v-for="item in archetypes"
        :key="item.id"
        @click="emit('choose', item.id)"
        :aria-label="`${chooseLabel} ${item.title}`"
      >
        <img
          class="archetype-art"
          :src="getArchetypeImage(item.image)"
          :alt="item.title"
        />
        <h3 class="archetype-name">{{ item.title }}</h3>
      </button>
    </div>
  </section>
</template>
