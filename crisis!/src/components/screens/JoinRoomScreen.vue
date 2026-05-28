<script setup>
import { ref } from "vue";

defineProps({
  isLoading: { type: Boolean, default: false },
  errorMsg: { type: String, default: "" },
});
const emit = defineEmits(["join", "back"]);

const roomCode = ref("");
const playerName = ref("");

function submit() {
  const code = roomCode.value.trim().toUpperCase();
  const name = playerName.value.trim();
  if (!code || !name) return;
  emit("join", { roomCode: code, playerName: name });
}
</script>

<template>
  <section class="room-setup-stage">
    <div class="panel room-setup-panel">
      <button class="ghost back-btn" @click="emit('back')">← Back</button>
      <h2>Join a Room</h2>

      <label class="field-label">
        Room Code
        <input
          v-model="roomCode"
          class="field-input field-input--code"
          type="text"
          maxlength="6"
          placeholder="ABC123"
          autocomplete="off"
          @input="roomCode = roomCode.toUpperCase()"
        />
      </label>

      <label class="field-label">
        Your Name
        <input
          v-model="playerName"
          class="field-input"
          type="text"
          maxlength="30"
          placeholder="Enter your name"
          autocomplete="off"
        />
      </label>

      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

      <button
        class="cta"
        :disabled="!roomCode.trim() || !playerName.trim() || isLoading"
        @click="submit"
      >
        Join
      </button>
    </div>
  </section>
</template>
