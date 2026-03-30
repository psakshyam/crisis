<script setup>
import { computed, onMounted, ref } from "vue";
import { gameManager } from "./managers/GameManager.js";
import { uiText } from "./content/i18n.js";
import StartScreen from "./components/screens/StartScreen.vue";
import ArchetypeScreen from "./components/screens/ArchetypeScreen.vue";
import CrisisScreen from "./components/screens/CrisisScreen.vue";
import CrisisIntroScreen from "./components/screens/CrisisIntroScreen.vue";
import StageIntroScreen from "./components/screens/StageIntroScreen.vue";
import GameplayScreen from "./components/screens/GameplayScreen.vue";
import OutcomeSlideScreen from "./components/screens/OutcomeSlideScreen.vue";
import EndScreen from "./components/screens/EndScreen.vue";
import { playCrisisCue, playSceneTransitionCue } from "./audio/cues.js";

const screen = ref("loading");
const appError = ref("");
const isBusy = ref(false);
const currentQuestion = ref(null);
const availableCrises = ref([]);
const manifestByAlias = ref({});
const selectedCrisis = ref(null);
const finalResult = ref({
  title: "",
  summary: "",
  bandLabel: "",
  simpleSummary: [],
});
const finalScore = ref(0);
const currentStageIndex = ref(0);
const currentScore = ref(0);
const outcomeSlide = ref({
  feedback: "",
  animation: "default",
});
const pendingAction = ref(null);

const archetypes = computed(() => gameManager.globalArchetypes);
const selectedArchetype = computed(() => gameManager.archetype);
const stageNumber = computed(() => currentStageIndex.value + 1);
const startPage = computed(() => manifestByAlias.value.startPage || "");
const activeStage = computed(() => {
  return gameManager.stages[currentStageIndex.value] || null;
});
const stageIntroKey = computed(() => `stage-${currentStageIndex.value}`);
const gameplayKey = computed(() => {
  const id = currentQuestion.value?.id ?? "none";
  return `q-${currentStageIndex.value}-${id}`;
});

function syncGameState() {
  currentStageIndex.value = gameManager.currentStageIndex;
  currentScore.value = gameManager.score;
}

function toAliasMap(items = []) {
  return items.reduce((acc, item) => {
    acc[item.alias] = item.src;
    return acc;
  }, {});
}

function getArchetypeImage(alias) {
  return manifestByAlias.value[alias] || `/assets/archetypes/${alias}.png`;
}

function getOptionImage(index) {
  return manifestByAlias.value[`icon_${index}`] || "";
}

async function loadManifest() {
  const response = await fetch("/assets/manifest.json");
  if (!response.ok) {
    throw new Error(`Failed to load manifest (${response.status})`);
  }

  const manifest = await response.json();
  manifestByAlias.value = {
    ...toAliasMap(manifest.archetypes),
    ...toAliasMap(manifest.backgrounds),
    ...toAliasMap(manifest.optionIcons),
  };
}

function advanceTurn() {
  syncGameState();
  const q = gameManager.getCurrentQuestion();
  if (!q) {
    endGame();
    return;
  }

  currentQuestion.value = q;
}

function endGame(result = null) {
  syncGameState();
  finalScore.value = currentScore.value;

  const resolved = result || gameManager.calculateResult();
  if (typeof resolved === "string") {
    finalResult.value = {
      title: "Outcome",
      summary: resolved,
      bandLabel: "",
      simpleSummary: [],
    };
  } else {
    finalResult.value = resolved;
  }

  screen.value = "end";
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

function beginFlow() {
  screen.value = "archetype";
}

function selectArchetype(archetypeId) {
  gameManager.setArchetype(archetypeId);
  availableCrises.value = gameManager.getAvailableCrises();
  screen.value = "crisis";
}

async function selectCrisis(crisisId) {
  isBusy.value = true;
  appError.value = "";

  try {
    const data = await gameManager.loadCrisis(crisisId);
    if (!data) {
      appError.value = "Unable to load that scenario. Please choose another one.";
      return;
    }

    selectedCrisis.value = data;
    currentQuestion.value = null;
    syncGameState();
    playCrisisCue(crisisId);
    screen.value = "crisis-intro";
  } finally {
    isBusy.value = false;
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
  const result = gameManager.handleAnswer(option.points);
  syncGameState();

  pendingAction.value = result;
  outcomeSlide.value = {
    feedback: option.feedback || "Decision recorded.",
    animation: current?.animation || current?.visual?.animation || "default",
  };

  screen.value = "outcome-slide";
}

function continueAfterOutcome() {
  const result = pendingAction.value;
  pendingAction.value = null;

  if (!result) {
    advanceTurn();
    return;
  }

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

function restartGame() {
  location.reload();
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
</script>

<template>
  <main class="app-shell" :class="`screen-${screen}`">
    <header class="top-bar" v-if="screen === 'gameplay'">
      <div class="top-pill">{{ uiText.gameplay.stage }} {{ stageNumber }}</div>
      <div class="top-pill">
        {{ uiText.gameplay.archetype }}: {{ selectedArchetype || uiText.gameplay.none }}
      </div>
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

    <ArchetypeScreen
      v-else-if="screen === 'archetype'"
      :title="uiText.archetype.title"
      :choose-label="uiText.archetype.choose"
      :archetypes="archetypes"
      :get-archetype-image="getArchetypeImage"
      @choose="selectArchetype"
    />

    <CrisisScreen
      v-else-if="screen === 'crisis'"
      :title="uiText.crisis.title"
      :play-label="uiText.crisis.play"
      :loading-label="uiText.crisis.loading"
      :is-busy="isBusy"
      :app-error="appError"
      :crises="availableCrises"
      @select="selectCrisis"
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
      @replay="restartGame"
    />
  </main>
</template>
