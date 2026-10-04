// Scene art paths, and preloading so a scene's background and props appear
// together instead of popping in one by one.

export const SCENE_ROOT = "/assets/scenes";

export const ART = {
  office: `${SCENE_ROOT}/backgrounds/office.webp`,
  kitchen: `${SCENE_ROOT}/backgrounds/kitchen.svg`,
  laptop: `${SCENE_ROOT}/props/laptop.svg`,
  questions: `${SCENE_ROOT}/props/questions_overlay.svg`,
  solutionFile: `${SCENE_ROOT}/props/solution_file.svg`,
  angela: `${SCENE_ROOT}/characters/angela/sitting.svg`,
  assistant: `${SCENE_ROOT}/characters/assistant/shadow.svg`,
};

const OFFICE_LAYOUTS = ["desk", "close", "office", "profile"];

export function propSrc(key) {
  return `${SCENE_ROOT}/props/${key}.svg`;
}

export function backgroundFor(beat, scenario) {
  const layout = beat.layout || "desk";
  if (beat.background) return beat.background;
  if (layout === "kitchen") return ART.kitchen;
  if (OFFICE_LAYOUTS.includes(layout))
    return scenario?.scene?.background || ART.office;
  return "";
}

export function expressionSrc(character, expression) {
  const expressions = character?.art?.expressions;
  if (!expressions) return "";
  return expressions[expression] || expressions.neutral || "";
}

// Every image the given beats will show.
export function sceneSources(beats, character, scenario) {
  const sources = [];
  for (const beat of beats) {
    const layout = beat.layout || "desk";
    sources.push(backgroundFor(beat, scenario));
    if (layout === "desk" || layout === "mission") {
      sources.push(expressionSrc(character, beat.expression), ART.laptop);
    }
    if (layout === "mission") sources.push(ART.questions, ART.solutionFile);
    if (layout === "close")
      sources.push(expressionSrc(character, beat.expression));
    if (layout === "profile") sources.push(character?.art?.standing);
    if (layout === "kitchen") sources.push(beat.figure || ART.angela);
    if (beat.assistant) sources.push(ART.assistant);
    (beat.props || []).forEach((key) => sources.push(propSrc(key)));
  }
  return [...new Set(sources.filter(Boolean))];
}

const cache = new Map();
// Holding the Image objects keeps their decoded data around for the session.
const keep = [];

function load(src) {
  if (!cache.has(src)) {
    const img = new Image();
    img.src = src;
    keep.push(img);
    const ready = img.decode
      ? img.decode()
      : new Promise((r) => (img.onload = r));
    // A broken image must never block the game.
    cache.set(
      src,
      ready.catch(() => {}),
    );
  }
  return cache.get(src);
}

// Starts loading all of a scenario's scene art in the background, right after
// it's chosen, so scenes are usually ready before they're shown.
export function warmScenario(scenario, character) {
  if (!scenario) return;
  const beats = [
    ...(scenario.intro_beats || []),
    ...(character?.opening_beats || []),
    ...(scenario.stages || []).flatMap((s) => s.intro_beats || []),
    ...(character?.art ? [{ layout: "mission" }, { layout: "profile" }] : []),
    ...Object.keys(character?.art?.expressions || {}).map((expression) => ({
      layout: "desk",
      expression,
    })),
  ];
  sceneSources(beats, character, scenario).forEach(load);
}

// Resolves when every image is loaded and decoded, or after `timeoutMs`.
export function preloadScene(beats, character, scenario, timeoutMs = 2500) {
  const all = Promise.all(sceneSources(beats, character, scenario).map(load));
  const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  return Promise.race([all, timeout]);
}
