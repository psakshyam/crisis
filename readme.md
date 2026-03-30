# Crisis!

Interactive crisis-decision game built with Vue 3 and Vite.

## Overview

This project is a single-page Vue app that guides players through historical crisis scenarios.

Core flow:
Start -> Archetype selection -> Crisis selection -> Crisis intro -> Stage intro -> Gameplay questions -> Outcome slides -> End screen

The app uses JSON scenario data and a lightweight game state manager.

## Tech Stack

- Vue 3
- Vite
- ESLint + Prettier

## Project Structure

```text
crisis!/
├── public/
│   ├── assets/
│   │   ├── manifest.json
│   │   ├── archetypes/
│   │   ├── audio/
│   │   └── backgrounds/
│   ├── data/
│   │   ├── crises_index.json
│   │   └── scenarios/
│   └── style.css
├── scripts/
│   └── extract-scenario-text.cjs
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── styles.css
│   ├── audio/
│   │   └── cues.js
│   ├── components/
│   │   └── screens/
│   │       ├── ArchetypeScreen.vue
│   │       ├── CrisisIntroScreen.vue
│   │       ├── CrisisScreen.vue
│   │       ├── EndScreen.vue
│   │       ├── GameplayScreen.vue
│   │       ├── OutcomeSlideScreen.vue
│   │       ├── StageIntroScreen.vue
│   │       └── StartScreen.vue
│   ├── content/
│   │   ├── i18n.js
│   │   ├── uiText.js
│   │   └── locales/
│   └── managers/
│       └── GameManager.js
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.mjs
```

## Setup

1. Install dependencies:

```bash
cd crisis!
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

## Architecture Notes

- `src/App.vue` owns screen state and game flow transitions.
- `src/managers/GameManager.js` loads scenario data and handles score/stage progression.
- `src/components/screens/*` contains focused screen-level UI components.
- `src/styles.css` controls visual layout and animation across all screens.

## Scenario Data

To add a new scenario:

1. Add a JSON file in `public/data/scenarios/`.
2. Register it in `public/data/crises_index.json`.
3. Add any needed images/audio under `public/assets/`.

## Dev Notes

- Use feature branches for changes.
- Run lint/build locally before opening a PR.

## Recent UI Updates

- Removed score display from the gameplay top bar.
- Stage and archetype pills are pinned to opposite top corners.
- Gameplay question text is positioned lower.
- Intro, stage, and outcome popups are fully opaque.
- Gameplay option text size is increased for readability.
- Start button is larger and uses the exact label Start.

## Component Guidelines

- Keep screen components focused and single-purpose.
- Keep business/game rules in GameManager, not in presentation components.
- Prefer props and emitted events for parent-child communication.
- Remove global listeners in onBeforeUnmount where used.

## Debugging

- Use browser DevTools and Vue DevTools for component and state inspection.
- Run npm run lint before opening PRs.
- Validate scenario JSON files before committing.

## Guardrails

- Do not modify node_modules.
- Do not hard-code viewport assumptions.
- Keep assets registered in public/assets/manifest.json.
- Test with multiple screen sizes.
