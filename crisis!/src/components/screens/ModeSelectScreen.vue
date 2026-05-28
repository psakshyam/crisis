<script setup>
defineProps({
  startPage: { type: String, default: "" },
});
const emit = defineEmits(["solo", "host", "join"]);
</script>

<template>
  <section class="start-stage">
    <img v-if="startPage" class="start-bg" :src="startPage" alt="Start background" />
    <div class="mode-select-overlay">
      <div class="mode-card-grid">
        <button class="mode-card" @click="emit('solo')">
          <span class="mode-icon">▶</span>
          <span class="mode-label">Play Solo</span>
          <span class="mode-desc">Jump in and play through a crisis on your own.</span>
        </button>
        <button class="mode-card mode-card--primary" @click="emit('host')">
          <span class="mode-icon">⊕</span>
          <span class="mode-label">Host a Room</span>
          <span class="mode-desc">Create a classroom session and track your students.</span>
        </button>
        <button class="mode-card" @click="emit('join')">
          <span class="mode-icon">→</span>
          <span class="mode-label">Join a Room</span>
          <span class="mode-desc">Enter a room code to join your teacher's session.</span>
        </button>
      </div>
    </div>
  </section>
</template>
