<script setup>
import { ref } from "vue";

const props = defineProps({
  roomCode: { type: String, required: true },
  mode: { type: String, default: "self-paced" },
  isTeacher: { type: Boolean, default: false },
  players: { type: Array, default: () => [] },
  scenarios: { type: Array, default: () => [] },
  errorMsg: { type: String, default: "" },
  characterMode: { type: Boolean, default: false },
});
const emit = defineEmits(["start-crisis", "end-session", "toggle-character-mode"]);

const selectedScenarioId = ref("");
const confirmingEnd = ref(false);

function startCrisis() {
  if (!selectedScenarioId.value) return;
  emit("start-crisis", selectedScenarioId.value);
}
</script>

<template>
  <section class="room-setup-stage">
    <div class="panel lobby-panel">
      <!-- Header row -->
      <div class="lobby-header">
        <div>
          <h2>Lobby</h2>
          <p class="lobby-code">
            Room: <strong>{{ roomCode }}</strong>
            &nbsp;·&nbsp;
            {{ mode === "teacher-paced" ? "Teacher-paced" : "Self-paced" }}
          </p>
        </div>
      </div>

      <!-- Player list -->
      <div class="lobby-player-list">
        <p class="lobby-hint">
          {{ isTeacher ? "Students joined:" : "Waiting for teacher to select a crisis…" }}
        </p>
        <ul v-if="players.length" class="lobby-names">
          <li v-for="p in players" :key="p.id" class="lobby-name-chip">{{ p.name }}</li>
        </ul>
        <p v-else class="muted">No students yet.</p>
      </div>

      <!-- Teacher controls -->
      <template v-if="isTeacher">
        <div class="lobby-crisis-picker">
          <label class="field-label">
            Select a Crisis to Run
            <select v-model="selectedScenarioId" class="field-select">
              <option value="" disabled>Choose a scenario…</option>
              <option v-for="s in scenarios" :key="s.id" :value="s.id">{{ s.title }}</option>
            </select>
          </label>
          <button
            class="cta"
            :disabled="!selectedScenarioId"
            @click="startCrisis"
          >
            Start Crisis
          </button>
        </div>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <!-- Character mode toggle -->
        <div class="lobby-simplify-row">
          <span class="field-label">Text Mode</span>
          <button
            class="simplify-toggle"
            :class="{ 'simplify-toggle--on': characterMode }"
            @click="emit('toggle-character-mode', !characterMode)"
          >{{ characterMode ? "Character Mode" : "Neutral Mode" }}</button>
          <span class="simplify-hint">Character mode shows first-person scenario text to students.</span>
        </div>

        <!-- End session (with inline confirm) -->
        <div class="lobby-end-zone">
          <template v-if="!confirmingEnd">
            <button class="ghost end-session-btn" @click="confirmingEnd = true">
              End Session
            </button>
          </template>
          <template v-else>
            <p class="end-confirm-text">This will permanently close the room for all students.</p>
            <div class="end-confirm-actions">
              <button class="cta" @click="emit('end-session')">Yes, End Session</button>
              <button class="ghost" @click="confirmingEnd = false">Cancel</button>
            </div>
          </template>
        </div>
      </template>
    </div>
  </section>
</template>
