<script setup>
import { ref } from "vue";

defineProps({
  isLoading: { type: Boolean, default: false },
  errorMsg: { type: String, default: "" },
});

const emit = defineEmits(["create", "back"]);

const pin = ref("");
const mode = ref("self-paced");

function submit() {
  if (!pin.value.trim()) return;
  emit("create", { pin: pin.value.trim(), mode: mode.value });
}
</script>

<template>
  <section class="room-setup-stage">
    <div class="panel room-setup-panel">
      <button class="ghost back-btn" @click="emit('back')">← Back</button>
      <h2>Host a Room</h2>

      <label class="field-label">
        Session PIN
        <input
          v-model="pin"
          class="field-input"
          type="text"
          maxlength="12"
          placeholder="e.g. sunshine42"
          autocomplete="off"
        />
      </label>

      <fieldset class="mode-fieldset">
        <legend class="field-label" style="border: none; padding: 0; margin: 0">Play mode</legend>
        <label class="radio-label">
          <input v-model="mode" type="radio" value="self-paced" />
          Self-paced — each student progresses independently
        </label>
        <label class="radio-label">
          <input v-model="mode" type="radio" value="teacher-paced" />
          Teacher-paced — you control which questions students can access
        </label>
      </fieldset>

      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

      <button
        class="cta"
        :disabled="!pin.trim() || isLoading"
        @click="submit"
      >
        Create Room
      </button>
    </div>
  </section>
</template>
