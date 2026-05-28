<script setup>
import { computed, onMounted, ref } from "vue";
import { gameManager } from "./managers/GameManager.js";
import { uiText } from "./content/i18n.js";
import { socket } from "./socket.js";

import StartScreen from "./components/screens/StartScreen.vue";
import ModeSelectScreen from "./components/screens/ModeSelectScreen.vue";
import HostRoomScreen from "./components/screens/HostRoomScreen.vue";
import JoinRoomScreen from "./components/screens/JoinRoomScreen.vue";
import LobbyScreen from "./components/screens/LobbyScreen.vue";
import TeacherDashboardScreen from "./components/screens/TeacherDashboardScreen.vue";
import CharacterIntroScreen from "./components/screens/CharacterIntroScreen.vue";
import CrisisScreen from "./components/screens/CrisisScreen.vue";
import CrisisIntroScreen from "./components/screens/CrisisIntroScreen.vue";
import StageIntroScreen from "./components/screens/StageIntroScreen.vue";
import GameplayScreen from "./components/screens/GameplayScreen.vue";
import OutcomeSlideScreen from "./components/screens/OutcomeSlideScreen.vue";
import EndScreen from "./components/screens/EndScreen.vue";
import { playCrisisCue, playSceneTransitionCue } from "./audio/cues.js";

// ── Core game state ────────────────────────────────────────────────────────
const screen = ref("loading");
const appError = ref("");
const isBusy = ref(false);
const currentQuestion = ref(null);
const manifestByAlias = ref({});
const selectedCrisis = ref(null);
const finalResult = ref({ title: "", summary: "", reflection: "", bandLabel: "", simpleSummary: [] });
const finalScore = ref(0);
const currentStageIndex = ref(0);
const currentScore = ref(0);
const outcomeSlide = ref({ feedback: "", animation: "default" });
const pendingAction = ref(null);

// ── Simplified mode ────────────────────────────────────────────────────────
const isSimplified = ref(false);

// ── Room state ─────────────────────────────────────────────────────────────
const roomCode = ref("");
const roomPin = ref("");
const roomMode = ref("self-paced");
const isTeacher = ref(false);
const roomPlayers = ref([]);
const roomError = ref("");
const roomScenarioId = ref("");

// Teacher-side: question tracking for dashboard
const teacherCurrentStageIdx = ref(0);
const teacherCurrentQIdx = ref(0);

// Student-side: unlock gate and waiting state
const unlockedUpTo = ref(Infinity); // Infinity = all unlocked (self-paced); number = gate
const waitingForTeacher = ref(false);

// Student-side: rankings overlay (when teacher broadcasts rankings)
const roomRankings = ref([]);
const showRankingsOverlay = ref(false);

// ── Computed ───────────────────────────────────────────────────────────────
const stageNumber = computed(() => currentStageIndex.value + 1);
const startPage = computed(() => manifestByAlias.value.startPage || "");
const activeStage = computed(() => gameManager.stages[currentStageIndex.value] || null);
const stageIntroKey = computed(() => `stage-${currentStageIndex.value}`);
const gameplayKey = computed(() => {
  const id = currentQuestion.value?.id ?? "none";
  return `q-${currentStageIndex.value}-${id}`;
});
const inRoom = computed(() => !!roomCode.value);
const allScenarios = computed(() => gameManager.crisisIndex);
const teacherStages = computed(() => (isTeacher.value ? gameManager.stages : []));
// Reactive wrapper so the template re-reads when gameManager state changes
const selectedCharacter = computed(() => gameManager.getCharacter());
const activeCharacterId = computed(() => gameManager.selectedCharacterId);

// ── Asset helpers ──────────────────────────────────────────────────────────
function toAliasMap(items = []) {
  return items.reduce((acc, item) => { acc[item.alias] = item.src; return acc; }, {});
}
function getOptionImage(index) {
  return manifestByAlias.value[`icon_${index}`] || "";
}

// ── Initialise ─────────────────────────────────────────────────────────────
async function loadManifest() {
  const response = await fetch("/assets/manifest.json");
  if (!response.ok) throw new Error(`Failed to load manifest (${response.status})`);
  const manifest = await response.json();
  manifestByAlias.value = {
    ...toAliasMap(manifest.backgrounds),
    ...toAliasMap(manifest.optionIcons),
  };
}

async function initializeGame() {
  appError.value = "";
  const success = await gameManager.init();
  if (!success) {
    appError.value = "Unable to load crisis index. Please refresh and try again.";
    screen.value = "error";
    return;
  }
  await loadManifest();
  screen.value = "start";
}

onMounted(async () => {
  try {
    await initializeGame();
  } catch (error) {
    console.error(error);
    appError.value = "Something went wrong while booting the game.";
    screen.value = "error";
  }
});

// ── Socket helpers ─────────────────────────────────────────────────────────
function connectSocket() {
  if (!socket.connected) socket.connect();
}

function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}

// ── Socket: room lifecycle ─────────────────────────────────────────────────
socket.on("room-created", ({ roomCode: code }) => {
  roomCode.value = code;
  screen.value = "lobby";
});

socket.on("crisis-started", async ({ scenarioId, mode, unlockedUpTo: gate }) => {
  roomMode.value = mode;
  roomScenarioId.value = scenarioId;
  unlockedUpTo.value = gate ?? (mode === "teacher-paced" ? 1 : Infinity);
  teacherCurrentStageIdx.value = 0;
  teacherCurrentQIdx.value = 0;

  if (isTeacher.value) {
    // Load scenario for the question panel — character doesn't matter for teacher view
    const indexEntry = gameManager.crisisIndex.find(c => c.id === scenarioId);
    await gameManager.loadCrisis(scenarioId, indexEntry?.default_character || null);
    screen.value = "teacher-dashboard";
  } else {
    startRoomGame(scenarioId);
  }
});

socket.on("simplified-mode-changed", ({ isSimplified: simplified }) => {
  isSimplified.value = simplified;
});

socket.on("crisis-ended", () => {
  // Student: show their end screen with "waiting" note — already on end screen if they finished,
  // or navigate there if they didn't complete in time.
  if (screen.value !== "end") {
    endGame();
  }
});

socket.on("returned-to-lobby", ({ players }) => {
  roomPlayers.value = players;
  // Do NOT clear showRankingsOverlay — students dismiss it themselves.
  // Reset game state for next round
  selectedCrisis.value = null;
  currentQuestion.value = null;
  waitingForTeacher.value = false;
  unlockedUpTo.value = Infinity;
  screen.value = "lobby";
});

socket.on("rankings-revealed", ({ rankings }) => {
  roomRankings.value = rankings;
  showRankingsOverlay.value = true;
});

socket.on("questions-unlocked", ({ unlockedUpTo: gate }) => {
  unlockedUpTo.value = gate;
  // If student is currently blocked at the gate and can now proceed, unblock
  if (waitingForTeacher.value) {
    const nextQNumber = gameManager.totalQuestionsAnswered + 1;
    if (nextQNumber <= gate) {
      waitingForTeacher.value = false;
    }
  }
});

socket.on("session-ended", () => {
  alert("The teacher has ended this session.");
  restartGame();
});

// Teacher receives player updates
socket.on("player-joined", ({ players }) => {
  roomPlayers.value = players;
});

socket.on("player-progress", (playerData) => {
  const idx = roomPlayers.value.findIndex((p) => p.id === playerData.id);
  if (idx >= 0) roomPlayers.value[idx] = { ...roomPlayers.value[idx], ...playerData };
  else roomPlayers.value.push(playerData);
});

socket.on("player-completed", (playerData) => {
  const idx = roomPlayers.value.findIndex((p) => p.id === playerData.id);
  if (idx >= 0) roomPlayers.value[idx] = { ...roomPlayers.value[idx], ...playerData, completed: true };
});

socket.on("player-left", ({ players }) => {
  roomPlayers.value = players;
});

socket.on("join-ack", ({ roomCode: code, mode, scenarioId, status, unlockedUpTo: gate, players }) => {
  isBusy.value = false;
  roomCode.value = code;
  roomMode.value = mode;
  roomScenarioId.value = scenarioId;
  roomPlayers.value = players;
  unlockedUpTo.value = gate ?? Infinity;

  if (status === "playing" && scenarioId) {
    startRoomGame(scenarioId);
  } else {
    screen.value = "lobby";
  }
});

socket.on("error-msg", (msg) => {
  roomError.value = msg;
  isBusy.value = false;
});

// ── Mode select ────────────────────────────────────────────────────────────
function beginFlow() {
  screen.value = "mode-select";
}

function goSolo() { screen.value = "crisis"; }
function goHostRoom() { roomError.value = ""; screen.value = "host-room"; }
function goJoinRoom() { roomError.value = ""; screen.value = "join-room"; }

// ── Host room ──────────────────────────────────────────────────────────────
function createRoom({ pin, mode }) {
  isBusy.value = true;
  roomError.value = "";
  isTeacher.value = true;
  roomPin.value = pin;
  roomMode.value = mode;
  connectSocket();
  socket.emit("create-room", { pin, mode });
  isBusy.value = false;
}

// ── Join room ──────────────────────────────────────────────────────────────
function joinRoom({ roomCode: code, playerName }) {
  isBusy.value = true;
  roomError.value = "";
  isTeacher.value = false;
  connectSocket();
  socket.emit("join-room", { roomCode: code, playerName });
}

// ── Teacher: start a crisis ────────────────────────────────────────────────
function teacherStartCrisis(scenarioId) {
  roomError.value = "";
  socket.emit("start-crisis", { roomCode: roomCode.value, scenarioId });
}

// ── Teacher: dashboard actions ─────────────────────────────────────────────
function teacherEndCrisis() {
  socket.emit("end-crisis", { roomCode: roomCode.value });
}

function teacherReturnToRoom() {
  socket.emit("return-to-room", { roomCode: roomCode.value });
  // Teacher goes back to lobby too
  roomPlayers.value = roomPlayers.value.map((p) => ({
    ...p,
    score: 0,
    totalAnswered: 0,
    completed: false,
    history: [],
    stageIndex: 0,
    questionIndex: 0,
  }));
  screen.value = "lobby";
}

function teacherShowRankings(rankings) {
  socket.emit("show-rankings", { roomCode: roomCode.value, rankings });
}

function teacherUnlockTo(questionNumber) {
  socket.emit("unlock-to", { roomCode: roomCode.value, questionNumber });
  // Update teacher's current question display to the newly unlocked frontier
  // Find the stageIndex/questionIndex for this globalN
  let n = 0;
  for (let si = 0; si < gameManager.stages.length; si++) {
    const qs = gameManager.stages[si]?.questions ?? [];
    for (let qi = 0; qi < qs.length; qi++) {
      n++;
      if (n === questionNumber) {
        teacherCurrentStageIdx.value = si;
        teacherCurrentQIdx.value = qi;
        return;
      }
    }
  }
}

function teacherToggleSimplify(simplified) {
  isSimplified.value = simplified;
  socket.emit("simplified-mode-toggle", { roomCode: roomCode.value, isSimplified: simplified });
}

function teacherEndSession() {
  socket.emit("end-session", { roomCode: roomCode.value });
  disconnectSocket();
  restartGame();
}

// ── Start room game (student side) ────────────────────────────────────────
async function startRoomGame(scenarioId) {
  isBusy.value = true;
  try {
    const indexEntry = gameManager.crisisIndex.find(c => c.id === scenarioId);
    const data = await gameManager.loadCrisis(scenarioId, indexEntry?.default_character || null);
    if (!data) {
      appError.value = "Unable to load the scenario.";
      screen.value = "error";
      return;
    }
    selectedCrisis.value = data;
    currentQuestion.value = null;
    syncGameState();
    screen.value = "character-intro";
  } finally {
    isBusy.value = false;
  }
}

// ── Solo game flow ─────────────────────────────────────────────────────────
function syncGameState() {
  currentStageIndex.value = gameManager.currentStageIndex;
  currentScore.value = gameManager.score;
}

async function selectCrisis(crisisId) {
  isBusy.value = true;
  appError.value = "";
  try {
    const indexEntry = gameManager.crisisIndex.find(c => c.id === crisisId);
    const data = await gameManager.loadCrisis(crisisId, indexEntry?.default_character || null);
    if (!data) {
      appError.value = "Unable to load that scenario. Please choose another one.";
      return;
    }
    selectedCrisis.value = data;
    currentQuestion.value = null;
    syncGameState();
    playCrisisCue(crisisId);
    screen.value = "character-intro";
  } finally {
    isBusy.value = false;
  }
}

function completeCharacterIntro() {
  screen.value = "crisis-intro";
}

function advanceTurn() {
  syncGameState();
  const q = gameManager.getCurrentQuestion();
  if (!q) { endGame(); return; }
  currentQuestion.value = q;

  // In teacher-paced room mode: check gate before showing question
  if (inRoom.value && roomMode.value === "teacher-paced") {
    const nextQNumber = gameManager.totalQuestionsAnswered + 1;
    if (nextQNumber > unlockedUpTo.value) {
      waitingForTeacher.value = true;
    }
  }
}

function startStage() {
  screen.value = "gameplay";
  advanceTurn();
}

function completeCrisisIntro() {
  screen.value = "gameplay";
  advanceTurn();
}

function chooseOption(option) {
  const current = currentQuestion.value;

  if (inRoom.value) {
    syncGameState();
    socket.emit("answer-submitted", {
      stageIndex: gameManager.currentStageIndex,
      questionIndex: gameManager.currentQuestionIndex,
      optionIndex: current?.options?.findIndex((o) => o.text === option.text) ?? -1,
      points: option.points,
      maxPoints: option.maxPoints,
      questionText: current?.text ?? "",
      timeSpentSeconds: option.timeSpentSeconds ?? 0,
      score: gameManager.score + option.points,
      totalAnswered: gameManager.totalQuestionsAnswered + 1,
    });
  }

  const result = gameManager.handleAnswer(option.points);
  syncGameState();
  pendingAction.value = result;
  // feedback is already resolved by GameplayScreen (character variant + simplified applied)
  outcomeSlide.value = {
    feedback: option.feedback || "Decision recorded.",
    animation: current?.animation || current?.visual?.animation || "default",
  };
  screen.value = "outcome-slide";
}

function continueAfterOutcome() {
  const result = pendingAction.value;
  pendingAction.value = null;

  if (!result) { advanceTurn(); return; }

  if (result.action === "GAME_OVER") {
    endGame(result.result);
    return;
  }

  if (result.action === "STAGE_CHANGE") {
    playSceneTransitionCue(gameManager.currentStageIndex + 1);
    screen.value = "stage-intro";
    return;
  }

  advanceTurn();
}

function endGame(result = null) {
  syncGameState();
  finalScore.value = currentScore.value;
  const resolved = result || gameManager.calculateResult();
  if (typeof resolved === "string") {
    finalResult.value = { title: "Outcome", summary: resolved, bandLabel: "", simpleSummary: [] };
  } else {
    finalResult.value = resolved;
  }

  if (inRoom.value) {
    socket.emit("game-complete", {
      finalScore: finalScore.value,
      resultBand: finalResult.value.title,
    });
  }

  screen.value = "end";
}

function restartGame() {
  if (socket.connected) socket.disconnect();
  location.reload();
}
</script>

<template>
  <main class="app-shell" :class="`screen-${screen}`">
    <header class="top-bar" v-if="screen === 'gameplay'">
      <div class="top-pill">{{ uiText.gameplay.stage }} {{ stageNumber }}</div>
      <div v-if="selectedCharacter" class="top-pill">{{ selectedCharacter.name }}</div>
    </header>

    <section class="panel" v-if="screen === 'loading'">
      <h1>{{ uiText.startup.loadingTitle }}</h1>
      <p>{{ uiText.startup.loadingBody }}</p>
    </section>

    <section class="panel" v-else-if="screen === 'error'">
      <h1>{{ uiText.startup.errorTitle }}</h1>
      <p>{{ appError }}</p>
      <button class="cta" @click="restartGame">{{ uiText.startup.reload }}</button>
    </section>

    <StartScreen
      v-else-if="screen === 'start'"
      :start-page="startPage"
      :title="uiText.appTitle"
      :tagline="uiText.appTagline"
      cta="Start"
      @start="beginFlow"
    />

    <ModeSelectScreen
      v-else-if="screen === 'mode-select'"
      :start-page="startPage"
      @solo="goSolo"
      @host="goHostRoom"
      @join="goJoinRoom"
    />

    <HostRoomScreen
      v-else-if="screen === 'host-room'"
      :is-loading="isBusy"
      :error-msg="roomError"
      @create="createRoom"
      @back="screen = 'mode-select'"
    />

    <JoinRoomScreen
      v-else-if="screen === 'join-room'"
      :is-loading="isBusy"
      :error-msg="roomError"
      @join="joinRoom"
      @back="screen = 'mode-select'"
    />

    <LobbyScreen
      v-else-if="screen === 'lobby'"
      :room-code="roomCode"
      :mode="roomMode"
      :is-teacher="isTeacher"
      :players="roomPlayers"
      :scenarios="allScenarios"
      :error-msg="roomError"
      :is-simplified="isSimplified"
      @start-crisis="teacherStartCrisis"
      @end-session="teacherEndSession"
      @toggle-simplify="teacherToggleSimplify"
    />

    <TeacherDashboardScreen
      v-else-if="screen === 'teacher-dashboard'"
      :room-code="roomCode"
      :mode="roomMode"
      :players="roomPlayers"
      :stages="teacherStages"
      :current-stage-index="teacherCurrentStageIdx"
      :current-question-index="teacherCurrentQIdx"
      :unlocked-up-to="unlockedUpTo"
      :is-simplified="isSimplified"
      @end-crisis="teacherEndCrisis"
      @return-to-room="teacherReturnToRoom"
      @show-rankings="teacherShowRankings"
      @unlock-to="teacherUnlockTo"
      @toggle-simplify="teacherToggleSimplify"
    />

    <CrisisScreen
      v-else-if="screen === 'crisis'"
      :title="uiText.crisis.title"
      :play-label="uiText.crisis.play"
      :loading-label="uiText.crisis.loading"
      :is-busy="isBusy"
      :app-error="appError"
      :crises="allScenarios"
      @select="selectCrisis"
    />

    <CharacterIntroScreen
      v-else-if="screen === 'character-intro' && selectedCharacter"
      :character="selectedCharacter"
      :crisis-title="selectedCrisis?.title ?? ''"
      @complete="completeCharacterIntro"
    />

    <CrisisIntroScreen
      v-else-if="screen === 'crisis-intro' && selectedCrisis"
      :title="selectedCrisis.title"
      :description="selectedCrisis.description"
      @complete="completeCrisisIntro"
    />

    <StageIntroScreen
      v-else-if="screen === 'stage-intro' && activeStage"
      :key="stageIntroKey"
      :stage-description="activeStage.description"
      @continue="startStage"
    />

    <GameplayScreen
      v-else-if="screen === 'gameplay' && currentQuestion"
      :key="gameplayKey"
      :question="currentQuestion"
      :get-option-image="getOptionImage"
      :room-mode="inRoom ? roomMode : null"
      :waiting-for-teacher="waitingForTeacher"
      :is-simplified="isSimplified"
      :character-id="activeCharacterId"
      @choose="chooseOption"
    />

    <OutcomeSlideScreen
      v-else-if="screen === 'outcome-slide'"
      :feedback="outcomeSlide.feedback"
      :animation="outcomeSlide.animation"
      @continue="continueAfterOutcome"
    />

    <EndScreen
      v-else-if="screen === 'end'"
      :title="uiText.end.title"
      :final-score-label="uiText.end.finalScore"
      :replay-label="uiText.end.replay"
      :final-score="finalScore"
      :final-result="finalResult"
      :in-room="inRoom"
      @replay="restartGame"
    />

    <!-- Rankings overlay (shown to students when teacher shares results) -->
    <transition name="modal-fade">
      <div v-if="showRankingsOverlay" class="ranking-modal-backdrop">
        <div class="ranking-modal">
          <div class="ranking-modal-header">
            <h2>Class Results</h2>
          </div>
          <ol class="ranking-list">
            <li
              v-for="p in roomRankings"
              :key="p.id ?? p.name"
              class="ranking-row"
              :class="{ 'ranking-row--top3': p.rank <= 3 }"
            >
              <span class="ranking-medal">{{ p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank-1] : p.rank }}</span>
              <span class="ranking-name">{{ p.name }}</span>
              <span class="ranking-score">Score: {{ p.score ?? 0 }}</span>
            </li>
          </ol>
          <div class="ranking-modal-footer">
            <button class="cta" @click="showRankingsOverlay = false">Dismiss</button>
          </div>
        </div>
      </div>
    </transition>
  </main>
</template>
