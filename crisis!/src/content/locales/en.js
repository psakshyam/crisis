import scenarios from "./scenarios.en.json";

export const en = {
  ui: {
    appTitle: "Crisis Command",
    appTagline: "Decide under pressure. Every choice changes the global outcome.",
    startup: {
      loadingTitle: "Preparing simulation...",
      loadingBody: "Loading scenarios and assets.",
      errorTitle: "Startup Error",
      reload: "Reload",
    },
    start: {
      cta: "Start Round",
    },
    archetype: {
      title: "Select Your Archetype",
      choose: "Choose",
    },
    crisis: {
      title: "Select a Crisis Scenario",
      play: "Play",
      loading: "Loading...",
    },
    gameplay: {
      score: "Score",
      stage: "Stage",
      archetype: "Archetype",
      none: "none",
    },
    end: {
      title: "Round Result",
      finalScore: "Final Score",
      replay: "Play Again",
    },
  },
  game: {
    outcomes: {
      legendary:
        "LEGENDARY SUCCESS: Your swift actions saved the economy and boosted global trust.",
      stable:
        "STABLE RECOVERY: You avoided disaster, though public debt has increased.",
      strained:
        "STRAINED VICTORY: The crisis was averted, but recovery will be painful and slow.",
      failure:
        "CRITICAL FAILURE: Measures were too little, too late. The economy is in freefall.",
    },
  },
  crisisIndex: {
    financial_2008: {
      title: "Global Financial Meltdown",
      summary: "Navigate the collapse of the banking sector.",
    },
    asian_1997: {
      title: "Lorem ipsum",
      summary:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quis erat malesuada, viverra sem id, venenatis magna. Donec vestibulum quam sit amet sapien convallis porta. ",
    },
  },
  scenarios,
};
