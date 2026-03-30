let context;

function getContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  if (!context) {
    context = new AudioContextCtor();
  }

  if (context.state === "suspended") {
    context.resume();
  }

  return context;
}

function playTone({
  frequency,
  duration,
  type = "sine",
  gain = 0.035,
  delay = 0,
}) {
  const ctx = getContext();
  if (!ctx) {
    return;
  }

  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  const start = ctx.currentTime + delay;
  const end = start + duration;

  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(amp);
  amp.connect(ctx.destination);

  osc.start(start);
  osc.stop(end + 0.015);
}

function playSequence(notes, type = "triangle", gain = 0.035) {
  let offset = 0;
  notes.forEach((n) => {
    playTone({
      frequency: n.frequency,
      duration: n.duration,
      type,
      gain,
      delay: offset,
    });
    offset += n.duration + 0.03;
  });
}

export function playCrisisCue(crisisId) {
  const map = {
    financial_2008: {
      type: "sawtooth",
      gain: 0.028,
      notes: [
        { frequency: 246.94, duration: 0.18 },
        { frequency: 220.0, duration: 0.16 },
        { frequency: 196.0, duration: 0.2 },
      ],
    },
    covid_2020: {
      type: "triangle",
      gain: 0.03,
      notes: [
        { frequency: 293.66, duration: 0.13 },
        { frequency: 329.63, duration: 0.13 },
        { frequency: 349.23, duration: 0.2 },
      ],
    },
    default: {
      type: "triangle",
      gain: 0.03,
      notes: [
        { frequency: 261.63, duration: 0.12 },
        { frequency: 311.13, duration: 0.12 },
        { frequency: 392.0, duration: 0.16 },
      ],
    },
  };

  const preset = map[crisisId] || map.default;
  playSequence(preset.notes, preset.type, preset.gain);
}

export function playSceneTransitionCue(stageNumber) {
  const isMajorShift = stageNumber >= 4;

  const notes = isMajorShift
    ? [
        { frequency: 392.0, duration: 0.09 },
        { frequency: 493.88, duration: 0.09 },
        { frequency: 587.33, duration: 0.12 },
      ]
    : [
        { frequency: 329.63, duration: 0.08 },
        { frequency: 392.0, duration: 0.1 },
      ];

  playSequence(notes, "sine", 0.032);
}
