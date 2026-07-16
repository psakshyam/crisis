<script setup>
import { ref, computed, watch } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const props = defineProps({
  roomCode: { type: String, required: true },
  mode: { type: String, default: "self-paced" },
  players: { type: Array, default: () => [] },
  stages: { type: Array, default: () => [] },
  currentStageIndex: { type: Number, default: 0 },
  currentQuestionIndex: { type: Number, default: 0 },
  unlockedUpTo: { type: Number, default: Infinity },
  characterMode: { type: Boolean, default: false },
  // ID of the active character so the panel can show character-voice text
  characterId: { type: String, default: null },
});

const emit = defineEmits([
  "end-crisis",
  "return-to-room",
  "show-rankings",
  "unlock-to",
  "toggle-character-mode",
]);

// ── Text resolution (mirrors GameplayScreen logic) ────────────────────────
function resolveText(obj, defaultField, charField) {
  const basic = obj[defaultField] || '';
  if (!props.characterMode || !props.characterId) return basic;
  return obj[charField]?.[props.characterId] || basic;
}

// ── Selected player detail ────────────────────────────────────────────────
const selectedPlayer = ref(null);

// ── End crisis / ranking modal ────────────────────────────────────────────
const showRankingModal = ref(false);
const showRankingsToClass = ref(false);

function openRankingModal() {
  openRankingModalFresh();
}

const rankingsShared = ref(false);

function shareRankings() {
  emit("show-rankings", rankings.value);
  rankingsShared.value = true;
}

function confirmEndCrisis() {
  showRankingModal.value = false;
  rankingsShared.value = false;
  emit("return-to-room");
}

function openRankingModalFresh() {
  rankingsShared.value = false;
  showRankingsToClass.value = false;
  showRankingModal.value = true;
}

// ── Rankings computation ──────────────────────────────────────────────────
function totalTime(player) {
  return (player.history || []).reduce((s, h) => s + (h.timeSpentSeconds || 0), 0);
}

const rankings = computed(() =>
  [...props.players]
    .sort((a, b) => {
      if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
      return totalTime(a) - totalTime(b);
    })
    .map((p, i) => ({ ...p, rank: i + 1 }))
);

const MEDALS = ["🥇", "🥈", "🥉"];

function rankLabel(rank) {
  return rank <= 3 ? MEDALS[rank - 1] : String(rank);
}

function formatTime(secs) {
  if (!secs && secs !== 0) return "—";
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ── Answer flash ──────────────────────────────────────────────────────────
const recentlyAnswered = ref(new Set());
const prevTotalAnswered = ref({});

watch(
  () => props.players,
  (newPlayers) => {
    for (const player of newPlayers) {
      const prev = prevTotalAnswered.value[player.id] ?? 0;
      if ((player.totalAnswered ?? 0) > prev) {
        // Flash green
        recentlyAnswered.value = new Set([...recentlyAnswered.value, player.id]);
        setTimeout(() => {
          recentlyAnswered.value = new Set(
            [...recentlyAnswered.value].filter((id) => id !== player.id)
          );
        }, 1500);
      }
      prevTotalAnswered.value[player.id] = player.totalAnswered ?? 0;
    }
  },
  { deep: true }
);

// ── Colour palette ────────────────────────────────────────────────────────
const PALETTE = [
  "#cf5d36", "#285f68", "#e5af61", "#7c4d94",
  "#3a8c58", "#b03060", "#4a6fa5", "#c97a2a",
];

function colorForIndex(i) {
  return PALETTE[i % PALETTE.length];
}

// ── Chart data ────────────────────────────────────────────────────────────
const chartData = computed(() => {
  const maxQ = Math.max(1, ...props.players.map((p) => p.totalAnswered || 0));
  const labels = Array.from({ length: maxQ }, (_, i) => String(i + 1));

  const datasets = props.players.map((player, idx) => {
    const scores = Array(maxQ).fill(null);
    if (Array.isArray(player.history)) {
      let cumulative = 0;
      player.history.forEach((entry) => {
        const qi = entry.questionNumber - 1;
        cumulative += entry.points || 0;
        if (qi < maxQ) scores[qi] = cumulative;
      });
      for (let i = 1; i < maxQ; i++) {
        if (scores[i] === null && scores[i - 1] !== null) scores[i] = scores[i - 1];
      }
    }
    return {
      label: player.name,
      data: scores,
      borderColor: colorForIndex(idx),
      backgroundColor: colorForIndex(idx) + "22",
      tension: 0.35,
      spanGaps: false,
      pointRadius: 3,
      borderWidth: 2,
    };
  });

  return { labels, datasets };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { position: "bottom", labels: { font: { family: "Space Grotesk", size: 12 }, boxWidth: 14 } },
    title: { display: false },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    x: { title: { display: true, text: "Question #", font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
    y: { title: { display: true, text: "Score", font: { size: 11 } }, beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
  },
};

// ── Current question for teacher panel ───────────────────────────────────
const activeQuestion = computed(() => {
  const stage = props.stages[props.currentStageIndex];
  return stage?.questions?.[props.currentQuestionIndex] ?? null;
});

// Global question number of the active question (1-based)
const activeQuestionGlobalNumber = computed(() => {
  let n = 0;
  for (let si = 0; si < props.stages.length; si++) {
    const qs = props.stages[si]?.questions ?? [];
    if (si < props.currentStageIndex) {
      n += qs.length;
    } else if (si === props.currentStageIndex) {
      n += props.currentQuestionIndex + 1;
      break;
    }
  }
  return n;
});

const answeredCurrentQuestion = computed(() => {
  const gn = activeQuestionGlobalNumber.value;
  return props.players.filter((p) => (p.totalAnswered ?? 0) >= gn).length;
});

// ── Question picker (flattened list with global numbers) ─────────────────
const allQuestions = computed(() => {
  const flat = [];
  let globalN = 0;
  for (let si = 0; si < props.stages.length; si++) {
    const qs = props.stages[si]?.questions ?? [];
    for (let qi = 0; qi < qs.length; qi++) {
      globalN++;
      flat.push({
        globalN,
        stageIndex: si,
        questionIndex: qi,
        stageLabel: `Stage ${si + 1}`,
        text: qs[qi]?.text ?? "",
      });
    }
  }
  return flat;
});

// Group by stage label for display
const questionsByStage = computed(() => {
  const map = new Map();
  for (const q of allQuestions.value) {
    if (!map.has(q.stageLabel)) map.set(q.stageLabel, []);
    map.get(q.stageLabel).push(q);
  }
  return [...map.entries()]; // [[stageLabel, [q, ...]], ...]
});

function qPillClass(q) {
  if (q.globalN < props.unlockedUpTo) return "q-pill q-pill--unlocked";
  if (q.globalN === props.unlockedUpTo) return "q-pill q-pill--frontier";
  if (q.globalN === props.unlockedUpTo + 1) return "q-pill q-pill--next";
  return "q-pill q-pill--locked";
}

// ── Progress helpers ─────────────────────────────────────────────────────
function progressPct(player) {
  return Math.round(((player.totalAnswered || 0) / 20) * 100);
}

function isCorrect(entry) {
  return entry.points === entry.maxPoints;
}
</script>

<template>
  <section class="dashboard-stage">
    <!-- Header bar -->
    <header class="dashboard-header">
      <div class="dashboard-meta">
        <span class="room-pill">{{ roomCode }}</span>
        <span class="mode-pill">{{ mode === "teacher-paced" ? "Teacher-paced" : "Self-paced" }}</span>
      </div>
      <div class="dashboard-actions">
        <button
          class="simplify-toggle"
          :class="{ 'simplify-toggle--on': characterMode }"
          @click="emit('toggle-character-mode', !characterMode)"
          title="Switch between character-voice and neutral text for students"
        >{{ characterMode ? "Character Mode" : "Neutral Mode" }}</button>
        <button class="ghost dashboard-btn" @click="openRankingModal">End Crisis</button>
      </div>
    </header>

    <!-- Current question panel (shown when scenario is loaded) -->
    <div v-if="activeQuestion" class="question-panel">
      <div class="question-panel-header">
        <span class="question-panel-label">Q{{ activeQuestionGlobalNumber }}</span>
        <span class="question-panel-answered">{{ answeredCurrentQuestion }} / {{ players.length }} answered</span>
      </div>
      <p class="question-panel-text">{{ resolveText(activeQuestion, 'text', 'character_text') }}</p>
      <div class="option-chips">
        <span
          class="option-chip"
          v-for="(opt, idx) in activeQuestion.options"
          :key="idx"
        >
          <strong>{{ String.fromCharCode(65 + idx) }}</strong> {{ resolveText(opt, 'text', 'character_text') }}
        </span>
      </div>
    </div>

    <!-- Question unlock picker (teacher-paced) -->
    <div v-if="mode === 'teacher-paced' && allQuestions.length" class="question-picker-wrap">
      <div class="question-picker">
        <template v-for="[stageLabel, qs] in questionsByStage" :key="stageLabel">
          <span class="qpicker-stage-label">{{ stageLabel }}</span>
          <button
            v-for="q in qs"
            :key="q.globalN"
            :class="qPillClass(q)"
            :title="q.text.slice(0, 80)"
            @click="emit('unlock-to', q.globalN)"
          >
            Q{{ q.globalN }}
          </button>
        </template>
      </div>
    </div>

    <!-- Progress chart -->
    <div class="chart-wrap" v-if="players.length">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div class="chart-empty" v-else>
      <p class="muted">Waiting for students to join…</p>
    </div>

    <!-- Student card grid -->
    <div class="student-grid">
      <button
        class="student-card"
        v-for="(player, idx) in players"
        :key="player.id"
        :style="`--player-color: ${colorForIndex(idx)}`"
        @click="selectedPlayer = selectedPlayer?.id === player.id ? null : player"
        :class="{
          'student-card--done': player.completed,
          'student-card--selected': selectedPlayer?.id === player.id,
          'student-card--just-answered': recentlyAnswered.has(player.id),
        }"
      >
        <div class="student-name">{{ player.name }}</div>
        <div class="student-meta">
          Stage {{ (player.stageIndex ?? 0) + 1 }} &nbsp;·&nbsp;
          {{ player.completed ? "Done ✓" : `Q ${player.totalAnswered ?? 0}/20` }}
        </div>
        <div class="student-score">Score: {{ player.score ?? 0 }}</div>
        <div class="student-bar-track">
          <div class="student-bar-fill" :style="`width: ${progressPct(player)}%`"></div>
        </div>
      </button>
    </div>

    <!-- Student detail panel (slide-in) -->
    <transition name="slide-panel">
      <aside v-if="selectedPlayer" class="detail-panel">
        <div class="detail-header">
          <h3>{{ selectedPlayer.name }}</h3>
          <span class="detail-score">Score: {{ selectedPlayer.score ?? 0 }} / 20</span>
          <button class="detail-close" @click="selectedPlayer = null">✕</button>
        </div>

        <table class="detail-table" v-if="selectedPlayer.history?.length">
          <thead>
            <tr>
              <th>Q#</th>
              <th>Question</th>
              <th>Result</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in selectedPlayer.history"
              :key="entry.questionNumber"
              :class="isCorrect(entry) ? 'row-correct' : 'row-wrong'"
            >
              <td>{{ entry.questionNumber }}</td>
              <td class="detail-qtext">
                {{ entry.questionText ? entry.questionText.slice(0, 60) + (entry.questionText.length > 60 ? '…' : '') : '—' }}
              </td>
              <td class="detail-result">
                <span v-if="isCorrect(entry)" class="badge-correct">✓ +{{ entry.points }}</span>
                <span v-else class="badge-wrong">✗ +{{ entry.points }}</span>
              </td>
              <td class="detail-time">{{ formatTime(entry.timeSpentSeconds) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted detail-empty">No answers yet.</p>
      </aside>
    </transition>

    <!-- End crisis / ranking modal -->
    <transition name="modal-fade">
      <div v-if="showRankingModal" class="ranking-modal-backdrop" @click.self="showRankingModal = false">
        <div class="ranking-modal">
          <div class="ranking-modal-header">
            <h2>Crisis Results</h2>
            <span class="room-pill">{{ roomCode }}</span>
          </div>

          <ol class="ranking-list">
            <li
              v-for="player in rankings"
              :key="player.id"
              class="ranking-row"
              :class="{ 'ranking-row--top3': player.rank <= 3 }"
            >
              <span class="ranking-medal">{{ rankLabel(player.rank) }}</span>
              <span class="ranking-name">{{ player.name }}</span>
              <span class="ranking-score">Score: {{ player.score ?? 0 }}</span>
              <span class="ranking-time">{{ formatTime(totalTime(player)) }}</span>
              <span v-if="!player.completed" class="ranking-incomplete">(in progress)</span>
            </li>
          </ol>

          <div class="ranking-modal-footer">
            <button
              class="ghost"
              :disabled="rankingsShared"
              @click="shareRankings"
            >
              {{ rankingsShared ? "Rankings shared ✓" : "Share with class" }}
            </button>
            <button class="cta" @click="confirmEndCrisis">Back to Room</button>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>
