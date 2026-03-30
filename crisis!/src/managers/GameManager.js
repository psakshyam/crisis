import { localizeScenarioData, t } from "../content/i18n.js";

class GameManager {
  constructor() {
    this.crisisIndex = []; 
    this.currentCrisisData = null;
    
    // Game State
    this.score = 0;
    this.currentStageIndex = 0;
    this.currentQuestionIndex = 0; 
    this.totalQuestionsAnswered = 0;
    this.archetype = null;

    // Data Containers
    this.stages = []; 
    this.isLoaded = false;

    // Hardcoded Archetypes
    this.globalArchetypes = [
      { 
        id: 'peacemaker', 
        title: 'The Peacemaker', 
        desc: 'Skilled in negotiation and alliance-building.',
        image: 'peacemaker'
      },
      { 
        id: 'analyst', 
        title: 'The Analyst', 
        desc: 'Specializes in data analysis and resource management.',
        image: 'analyst'
      },
      { 
        id: 'campaigner', 
        title: 'The Campaigner', 
        desc: 'Expert in rallying public and media support.',
        image: 'campaigner'
      }
    ];
  }

  async init() {
    try {
      console.log("Fetching crisis index...");
      const response = await fetch('/data/crises_index.json');
      
      if (!response.ok) throw new Error(`Failed to load index: ${response.status}`);
      
      const crisisIndexRaw = await response.json();
      this.crisisIndex = localizeScenarioData(crisisIndexRaw);
      this.isLoaded = true;
      console.log("Crisis Index Loaded:", this.crisisIndex);
      return true;
    } catch (error) {
      console.error("GameManager Init Error:", error);
      return false;
    }
  }

  setArchetype(id) {
    this.archetype = id;
    console.log("Archetype set to:", id);
  }

  getAvailableCrises() {
    if (!this.archetype) return [];
    
    return this.crisisIndex.filter(crisis => 
      crisis.compatible_archetypes.includes(this.archetype)
    );
  }

  async loadCrisis(crisisId) {
    const entry = this.crisisIndex.find(c => c.id === crisisId);
    
    if (!entry) {
      console.error(`Crisis ID '${crisisId}' not found in index.`);
      return null;
    }

    try {
      console.log(`Loading crisis file: ${entry.file_path}`);
      const response = await fetch(entry.file_path);
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const raw = await response.json();
      const data = localizeScenarioData(raw);

      this.currentCrisisData = data;
      this.stages = data.stages;

      this.score = 0;
      this.currentStageIndex = 0;
      this.currentQuestionIndex = 0;
      this.totalQuestionsAnswered = 0;

      console.log("Crisis Loaded Successfully. Stages:", this.stages.length);
      return data;
    } catch (e) {
      console.error("Error loading crisis JSON:", e);
      return null;
    }
  }

  handleAnswer(optionPoints) {
    this.score += optionPoints;
    this.currentQuestionIndex++;
    this.totalQuestionsAnswered++;

    console.log(`Answered. Score: ${this.score} | Total Qs: ${this.totalQuestionsAnswered}`);

    if (this.totalQuestionsAnswered >= 20) {
      return { action: "GAME_OVER", result: this.calculateResult() };
    }


    const currentStage = this.stages[this.currentStageIndex];
    
    if (currentStage && this.currentQuestionIndex >= currentStage.questions.length) {
      
      if (this.currentStageIndex < this.stages.length - 1) {
        this.currentStageIndex++;
        this.currentQuestionIndex = 0; 
        
        return {
          action: "STAGE_CHANGE",
          newStageData: this.stages[this.currentStageIndex],
        };
      } else {
        return { action: "GAME_OVER", result: this.calculateResult() };
      }
    }

    return {
      action: "NEXT_QUESTION",
      data: this.getCurrentQuestion(),
    };
  }

  getCurrentQuestion() {
    if (!this.stages || this.stages.length === 0) return null;

    const stage = this.stages[this.currentStageIndex];
    if (!stage) return null;

    const question = stage.questions[this.currentQuestionIndex];
    if (!question) return null;

    return question;
  }

  calculateResult() {
    const s = this.score;

    const bands = this.currentCrisisData?.result_bands;
    if (Array.isArray(bands) && bands.length > 0) {
      const matchedBand = bands.find((band) => s >= band.min && s <= band.max);
      if (matchedBand) {
        return {
          title: matchedBand.title || "Outcome",
          summary: matchedBand.summary || t("game.outcomes.failure"),
          simpleSummary: Array.isArray(matchedBand.simple_summary)
            ? matchedBand.simple_summary
            : [],
          bandLabel:
            typeof matchedBand.min === "number" && typeof matchedBand.max === "number"
              ? `${matchedBand.min}-${matchedBand.max}`
              : "",
        };
      }
    }

    if (s >= 65) {
      return {
        title: "Legendary Success",
        summary: t("game.outcomes.legendary"),
        simpleSummary: [],
        bandLabel: "",
      };
    } else if (s >= 45) {
      return {
        title: "Stable Recovery",
        summary: t("game.outcomes.stable"),
        simpleSummary: [],
        bandLabel: "",
      };
    } else if (s >= 25) {
      return {
        title: "Strained Victory",
        summary: t("game.outcomes.strained"),
        simpleSummary: [],
        bandLabel: "",
      };
    } else {
      return {
        title: "Critical Failure",
        summary: t("game.outcomes.failure"),
        simpleSummary: [],
        bandLabel: "",
      };
    }
  }
}

export const gameManager = new GameManager();