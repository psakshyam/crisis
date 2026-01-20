import { Container, Graphics } from "pixi.js";
import { COLORS } from "./theme.js";

// Import All Screens
import { StartScreen } from "./screens/start.js";
import { SelectionScreen } from "./screens/selection.js";
import { GameplayScreen } from "./screens/gameplay.js";
import { EndScreen } from "./screens/end.js";

export class PixiUIManager {
  constructor() {
    this.app = null;
    this.root = null;
    this.currentScreen = null;
  }

  init(app) {
    this.app = app;
    this.root = new Container();
    app.stage.addChild(this.root);

    const bg = new Graphics()
      .rect(0, 0, app.screen.width, app.screen.height)
      .fill(COLORS.bg);
    this.root.addChild(bg);
    
    this.screenLayer = new Container();
    this.root.addChild(this.screenLayer);
  }

  _switchScreen(newScreen) {
    if (this.currentScreen) {
      this.screenLayer.removeChild(this.currentScreen);
      // Important: Destroys children to free GPU memory
      this.currentScreen.destroy({ children: true }); 
    }
    this.currentScreen = newScreen;
    this.screenLayer.addChild(newScreen);
  }


  showStartScreen(onStartClicked) {
    const screen = new StartScreen(
      this.app.screen.width, 
      this.app.screen.height, 
      onStartClicked
    );
    this._switchScreen(screen);
  }

  showGlobalArchetypeSelection(archetypesList, onSelected) {
    const screen = new SelectionScreen(
      this.app.screen.width,
      this.app.screen.height,
      "IDENTIFY ARCHETYPE",
      archetypesList,
      onSelected,
      'grid'
    );
    this._switchScreen(screen);
  }

  showCompatibleCrisisSelection(crisesList, onSelected) {
    const screen = new SelectionScreen(
      this.app.screen.width,
      this.app.screen.height,
      "Select a Crisis",
      crisesList,
      onSelected,
      'list' 
    );
    this._switchScreen(screen);
  }

  setupGameUI() {
    const screen = new GameplayScreen(
      this.app.screen.width, 
      this.app.screen.height
    );
    this._switchScreen(screen);
  }

  updateHUD(score, stage) {
    if (this.currentScreen instanceof GameplayScreen) {
      this.currentScreen.updateHUD(score, stage);
    }
  }

  displayQuestion(qData, onOptionSelected) {
    if (this.currentScreen instanceof GameplayScreen) {
      this.currentScreen.setQuestion(qData, onOptionSelected);
    }
  }

showEndScreen(score, feedbackList, archetypeId, onReplay) {
    const screen = new EndScreen(
      this.app.screen.width,
      this.app.screen.height,
      score,
      feedbackList,
      archetypeId, 
      onReplay
    );
    this._switchScreen(screen);
  }
}

export const uiManager = new PixiUIManager();