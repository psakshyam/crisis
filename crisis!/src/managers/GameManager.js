import { localizeScenarioData, t } from "../content/i18n.js";

class GameManager {
  constructor() {
    this.crisisIndex = [];
    this.currentCrisisData = null;
    this.selectedCharacterId = null;

    // Game State
    this.score = 0;
    this.currentStageIndex = 0;
    this.currentQuestionIndex = 0;
    this.totalQuestionsAnswered = 0;

    // Data Containers
    this.stages = [];
    this.isLoaded = false;
  }

  async init() {
    try {
      const response = await fetch('/data/crises_index.json');
      if (!response.ok) throw new Error(`Failed to load index: ${response.status}`);
      const raw = await response.json();
      this.crisisIndex = localizeScenarioData(raw);
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error("GameManager Init Error:", error);
      return false;
    }
  }

  // Load a crisis, optionally specifying which character to play as.
  // Falls back to the first defined character if none is specified.
  async loadCrisis(crisisId, characterId = null) {
    const entry = this.crisisIndex.find(c => c.id === crisisId);
    if (!entry) {
      console.error(`Crisis ID '${crisisId}' not found in index.`);
      return null;
    }

    try {
      const response = await fetch(entry.file_path);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const raw = await response.json();
      const data = localizeScenarioData(raw);

      this.currentCrisisData = data;
      this.stages = data.stages;

      // Resolve character: use provided ID, or the index default, or the first in the JSON
      const resolvedId = characterId
        || entry.default_character
        || Object.keys(data.characters || {})[0]
        || null;
      this.selectedCharacterId = resolvedId;

      this.score = 0;
      this.currentStageIndex = 0;
      this.currentQuestionIndex = 0;
      this.totalQuestionsAnswered = 0;

      return data;
    } catch (e) {
      console.error("Error loading crisis JSON:", e);
      return null;
    }
  }

  // Returns the active character's data object, or null.
  getCharacter() {
    if (!this.currentCrisisData || !this.selectedCharacterId) return null;
    return this.currentCrisisData.characters?.[this.selectedCharacterId] || null;
  }

  // Resolve text from a data object.
  // Uses the character-specific variant when available; falls back to the default field.
  // When `simplified` is true, always return the basic (default) text.
  resolveText(obj, defaultField, charField, simplified = false) {
    const basic = obj[defaultField] || '';
    if (simplified || !this.selectedCharacterId) return basic;
    return obj[charField]?.[this.selectedCharacterId] || basic;
  }

  handleAnswer(optionPoints) {
    this.score += optionPoints;
    this.currentQuestionIndex++;
    this.totalQuestionsAnswered++;

    if (this.totalQuestionsAnswered >= 20) {
      return { action: "GAME_OVER", result: this.calculateResult() };
    }

    const currentStage = this.stages[this.currentStageIndex];
    if (currentStage && this.currentQuestionIndex >= currentStage.questions.length) {
      if (this.currentStageIndex < this.stages.length - 1) {
        this.currentStageIndex++;
        this.currentQuestionIndex = 0;
        return { action: "STAGE_CHANGE", newStageData: this.stages[this.currentStageIndex] };
      } else {
        return { action: "GAME_OVER", result: this.calculateResult() };
      }
    }

    return { action: "NEXT_QUESTION", data: this.getCurrentQuestion() };
  }

  getCurrentQuestion() {
    if (!this.stages || this.stages.length === 0) return null;
    const stage = this.stages[this.currentStageIndex];
    if (!stage) return null;
    return stage.questions[this.currentQuestionIndex] || null;
  }

  calculateResult() {
    const s = this.score;
    const bands = this.currentCrisisData?.result_bands;

    if (Array.isArray(bands) && bands.length > 0) {
      const band = bands.find(b => s >= b.min && s <= b.max);
      if (band) {
        const reflection = this.selectedCharacterId
          ? (band.character_reflection?.[this.selectedCharacterId] || "")
          : "";
        return {
          title: band.title || "Outcome",
          summary: band.summary || t("game.outcomes.failure"),
          reflection,
          simpleSummary: Array.isArray(band.simple_summary) ? band.simple_summary : [],
          bandLabel: `${band.min}-${band.max}`,
        };
      }
    }

    // Fallback for out-of-band scores
    if (s >= 65) return { title: "Legendary Success", summary: t("game.outcomes.legendary"), reflection: "", simpleSummary: [], bandLabel: "" };
    if (s >= 45) return { title: "Stable Recovery",  summary: t("game.outcomes.stable"),    reflection: "", simpleSummary: [], bandLabel: "" };
    if (s >= 25) return { title: "Strained Victory",  summary: t("game.outcomes.strained"),  reflection: "", simpleSummary: [], bandLabel: "" };
    return          { title: "Critical Failure",     summary: t("game.outcomes.failure"),   reflection: "", simpleSummary: [], bandLabel: "" };
  }
}

export const gameManager = new GameManager();
