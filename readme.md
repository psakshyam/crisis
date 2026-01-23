# Crisis! - 

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Architecture](#architecture)
- [Adding New Features](#adding-new-features)
- [Modifying Existing Features](#modifying-existing-features)
- [Development Guidelines](#development-guidelines)

##  Overview

We are using **PixiJS** for rendering and **Vite** as the build tool.

## 📁 Project Structure

```
crisis!/
├── public/                    # Static assets
│   ├── style.css             # Global styles
│   ├── assets/               # Game assets
│   │   ├── manifest.json     # Asset loader configuration
│   │   ├── archetypes/       # Character images
│   │   ├── audio/            # Sound effects & music
│   │   └── backgrounds/      # Stage background images
│   └── data/                 # Game data
│       ├── crises_index.json # List of available crises
│       └── scenarios/        # Crisis scenario definitions
│           ├── 2008crisis.json
│           └── asianCrisis.json
│
├── src/                      # Source code
│   ├── main.js              # This is where the main logic is 
│   ├── core/                # (I am going to modularize main.js to this soon)
│   ├── managers/            # Game state management
│   │   └── GameManager.js   # Crisis data & game state
│   ├── scenes/              # Game scenes (we will add more scenes here as the game gets more complex)
│   └── ui/                  # User interface
│       ├── theme.js         # Color theme constants
│       ├── UIManager.js     # Screen management
│       ├── components/      # Reusable UI components
│       │   ├── archetypeFigurine.js
│       │   ├── button.js
│       │   ├── glass.js
│       │   └── options.js
│       └── screens/         # Full-screen views
│           ├── start.js
│           ├── selection.js
│           ├── gameplay.js
│           └── end.js
│
├── index.html               # HTML skeleton
├── package.json             # automatically configured by vit
├── vite.config.js           # automatically configured by vit
└── eslint.config.mjs        # automatically configured by vit
```

## Setup

1. **Git Clone or navigate to the project directory:**
   ```bash
   cd /path/to/crisis!
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:8080` (or the URL shown in terminal)

## 🏗️ Architecture

### Game Flow

1. **Initialization** (`main.js`)
   - Create PixiJS application
   - Load asset manifest
   - Initialize managers

2. **Screen Flow**
   - Start Screen → Archetype Selection → Crisis Selection → Gameplay → End Screen

3. **State Management**
   - `GameManager`: Handles crisis data, scoring, and game state
   - `UIManager`: Manages screen transitions and rendering

### Key Classes

#### GameManager (`src/managers/GameManager.js`)

Manages game state and crisis data:

```javascript
class GameManager {
  crisisIndex         // Available crisis scenarios
  currentCrisisData   // Currently loaded crisis
  score              // Player's current score
  currentStageIndex  // Current stage in crisis
  archetype          // Selected player archetype
  globalArchetypes   // Available character types
}
```

**Key Methods:**
- `init()` - Load crisis index
- `loadCrisis(id)` - Load specific crisis scenario
- `setArchetype(id)` - Set player archetype
- `processAnswer(option)` - Handle player choice

#### UIManager (`src/ui/UIManager.js`)

Manages UI screens and transitions:

```javascript
class PixiUIManager {
  app            // PixiJS application
  root           // Root container
  currentScreen  // Active screen instance
}
```

**Key Methods:**
- `init(app)` - Initialize UI system
- `showStartScreen(callback)` - Show start screen
- `showGlobalArchetypeSelection(archetypes, callback)` - Show archetype picker
- `showCrisisSelection(crises, callback)` - Show crisis picker
- `showGameplayScreen(data, callbacks)` - Show main gameplay
- `showEndScreen(score)` - Show final score

## ➕ Adding New Features

### Adding a New Crisis Scenario

1. **Create JSON file** in `public/data/scenarios/`:

```json
{
  "id": "unique_crisis_id",
  "title": "Crisis Name",
  "description": "Crisis background...",
  "stages": [
    {
      "stage_id": 1,
      "description": "Stage description",
      "background_image": "image.png",
      "questions": [
        {
          "id": 1,
          "text": "Question text",
          "fun_fact": "Interesting fact",
          "options": [
            {
              "text": "Option text",
              "points": 3,
              "type": "Decisive",
              "feedback": "Result of this choice"
            }
          ]
        }
      ]
    }
  ]
}
```

2. **Add to crisis index** (`public/data/crises_index.json`):

```json
{
  "id": "unique_crisis_id",
  "title": "Crisis Name",
  "file": "scenarios/your_crisis.json",
  "thumbnail": "crisis_thumb.png"
}
```

3. **Add background image** to `public/assets/backgrounds/`

### Adding a New UI Component

1. **Create component file** in `src/ui/components/`:

```javascript
// myComponent.js
import { Container, Graphics, Text } from 'pixi.js';
import { COLORS } from '../theme.js';

export class MyComponent extends Container {
  constructor(options) {
    super();
    this.options = options;
    this.draw();
  }

  draw() {
    // Create graphics, text, sprites
    const bg = new Graphics()
      .rect(0, 0, 200, 100)
      .fill(COLORS.primary);
    this.addChild(bg);
  }
}
```

2. **Import and use** in screens or other components:

```javascript
import { MyComponent } from '../components/myComponent.js';

const component = new MyComponent({ /* options */ });
this.addChild(component);
```

### Adding a New Screen

1. **Create screen file** in `src/ui/screens/`:

```javascript
import { Container } from 'pixi.js';

export class MyScreen extends Container {
  constructor(width, height, callback) {
    super();
    this.width = width;
    this.height = height;
    this.callback = callback;
    this.build();
  }

  build() {
    //screen ui code goes here
  }
}
```

2. **Add method to UIManager** (`src/ui/UIManager.js`):

```javascript
showMyScreen(data, callback) {
  const screen = new MyScreen(
    this.app.screen.width,
    this.app.screen.height,
    callback
  );
  this._switchScreen(screen);
}
```

3. **Call from main flow** (`src/main.js`):

```javascript
uiManager.showMyScreen(data, () => {
  // Handle callback
});
```

##  Modifying Existing Features

### Changing Theme Colors

Edit `src/ui/theme.js`:

```javascript
export const COLORS = {
  bg: 0xEBE9DE,
  primary: 0x2C3E50,
  // ... modify colors
};
```

### Asset Loading

Edit `public/assets/manifest.json`:

```json
{
  "archetypes": [
    { "alias": "peacemaker", "src": "/assets/archetypes/peacemaker.png" }
  ],
  "backgrounds": [
    { "alias": "background1", "src": "/assets/backgrounds/bg1.png" }
  ]
}
```

Then update loading in `main.js` as we have done for archetypes and backgrounds.

### Modifying Game Flow

Edit `src/main.js` to change screen sequence:

```javascript
function showArchetypeSelection() {
  uiManager.showGlobalArchetypeSelection(gameManager.globalArchetypes, (id) => {
    gameManager.setArchetype(id);
    // Add custom logic here
    showCrisisSelection();
  });
}
```

## Misc

### Code Style

- If you are using VSCode, install prettier to format your code so that it looks nice

### Integration
- Don't push to the main branch PLEASE, Create a branch, and then we will merge it the entire point of modularizing it to this extent was to avoid random bugs

### Component Structure

- Each UI component extends `Container` from PixiJS
- Components should be self-contained
- Clean up resources in destroy methods

### 

1. **Memory Management**: Always destroy PixiJS objects when no longer needed
   ```javascript
   this.currentScreen.destroy({ children: true });
   ```

2. **Asset Loading**: Use Assets API for textures
   ```javascript
   import { Assets } from 'pixi.js';
   const texture = Assets.get('alias');
   ```

3. **Event Handling**: Remove event listeners when destroying
   ```javascript
   button.on('pointerdown', handler);
   // Later...
   button.off('pointerdown', handler);
   ```

4. **State Management**: Keep state in GameManager, not in UI components

5. **Responsive Design**: Use `app.screen.width` and `app.screen.height` for layouts

### Debugging

- PixiJS DevTools extension available for Chrome/Firefox

###

- Don't modify `node_modules/`
- Don't hard-code screen dimensions
- Don't forget to add new assets to manifest.json
- Always test with multiple screen sizes
- Validate JSON files before committing
- Use absolute paths for imports
