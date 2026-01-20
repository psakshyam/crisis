import { Application, Assets } from "pixi.js";
import { gameManager } from "./managers/GameManager.js";
import { uiManager } from "./ui/UIManager.js";

async function init() {
  const app = new Application();
  await app.init({
    background: "#EBE9DE", 
    resizeTo: window,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  document.body.appendChild(app.canvas);

  const success = await gameManager.init();
  if (!success) return;

  const response = await fetch("/assets/manifest.json");
  const manifest = await response.json();

  const loadPromises = []; 

  manifest.archetypes.forEach((item) => {
    Assets.add({ alias: item.alias, src: item.src });
    loadPromises.push(Assets.load(item.alias));
  });


  if (manifest.backgrounds) {
    manifest.backgrounds.forEach((item) => {
      Assets.add({ alias: item.alias, src: item.src });
      loadPromises.push(Assets.load(item.alias));
    });
  }

  await Promise.all(loadPromises);

  uiManager.init(app);

  // 4. Start Flow
  uiManager.showStartScreen(() => {
    showArchetypeSelection();
  });
}

function showArchetypeSelection() {
  uiManager.showGlobalArchetypeSelection(gameManager.globalArchetypes, (id) => {
    gameManager.setArchetype(id);
    showCrisisSelection();
  });
}

function showCrisisSelection() {
  const available = gameManager.getAvailableCrises();
  uiManager.showCompatibleCrisisSelection(available, async (id) => {
    const data = await gameManager.loadCrisis(id);
    if (data) startGame();
  });
}

function startGame() {
  uiManager.setupGameUI();
  uiManager.updateHUD(gameManager.score, gameManager.currentStageIndex + 1);
  renderTurn();
}

function renderTurn() {
  const q = gameManager.getCurrentQuestion();

  if (!q) {
    handleGameOver();
    return;
  }

  uiManager.displayQuestion(q, (option) => {
    const res = gameManager.handleAnswer(option.points);
    uiManager.updateHUD(gameManager.score, gameManager.currentStageIndex + 1);

    if (res.action === "GAME_OVER") {
      handleGameOver(res.result);
    } else {
      renderTurn();
    }
  });
}

function handleGameOver(specificResult = null) {
  const finalFeedback = specificResult || gameManager.calculateResult();

  let currentArchetypeId = gameManager.archetype;



  uiManager.showEndScreen(
    gameManager.score,
    finalFeedback,
    currentArchetypeId,
    () => location.reload()
  );
}
init();
