import { customAlphabet } from "nanoid";

const genCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

const rooms = new Map();

export function createRoom({ pin, mode, teacherSocketId }) {
  const id = genCode();
  const room = {
    id,
    pin,
    mode, // "self-paced" | "teacher-paced"
    scenarioId: null, // set when teacher starts a crisis
    status: "lobby", // "lobby" | "playing" | "between-crises" | "ended"
    teacherSocketId,
    currentStageIndex: 0,
    currentQuestionIndex: 0,
    unlockedUpTo: null, // null = lobby; Infinity = self-paced; number = teacher-paced gate
    characterMode: false,
    players: {},
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(roomCode) {
  return rooms.get(roomCode.toUpperCase()) ?? null;
}

export function destroyRoom(roomCode) {
  rooms.delete(roomCode.toUpperCase());
}

export function addPlayer(roomCode, socketId, playerName) {
  const room = getRoom(roomCode);
  if (!room) return null;
  room.players[socketId] = _freshPlayerState(playerName);
  return room;
}

export function removePlayer(roomCode, socketId) {
  const room = getRoom(roomCode);
  if (!room) return;
  delete room.players[socketId];
}

export function startCrisis(roomCode, scenarioId) {
  const room = getRoom(roomCode);
  if (!room) return null;
  room.scenarioId = scenarioId;
  room.status = "playing";
  room.currentStageIndex = 0;
  room.currentQuestionIndex = 0;
  room.unlockedUpTo = room.mode === "teacher-paced" ? 1 : Infinity;
  return room;
}

export function resetAllPlayers(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;
  for (const socketId of Object.keys(room.players)) {
    const name = room.players[socketId].name;
    room.players[socketId] = _freshPlayerState(name);
  }
  room.status = "lobby";
  room.scenarioId = null;
  room.currentStageIndex = 0;
  room.currentQuestionIndex = 0;
  room.unlockedUpTo = null;
  return room;
}

export function unlockTo(roomCode, questionNumber) {
  const room = getRoom(roomCode);
  if (!room) return null;
  room.unlockedUpTo = questionNumber;
  return room;
}

export function updatePlayerProgress(roomCode, socketId, payload) {
  const room = getRoom(roomCode);
  if (!room) return null;
  const player = room.players[socketId];
  if (!player) return null;

  player.stageIndex = payload.stageIndex;
  player.questionIndex = payload.questionIndex;
  player.score = payload.score;
  player.totalAnswered = payload.totalAnswered;
  player.lastChoice = {
    optionIndex: payload.optionIndex,
    points: payload.points,
  };
  player.history.push({
    questionNumber: payload.totalAnswered,
    stageIndex: payload.stageIndex,
    questionIndex: payload.questionIndex,
    questionText: payload.questionText,
    optionIndex: payload.optionIndex,
    points: payload.points,
    maxPoints: payload.maxPoints,
    timeSpentSeconds: payload.timeSpentSeconds,
  });

  return room;
}

export function markPlayerComplete(roomCode, socketId, finalScore, resultBand) {
  const room = getRoom(roomCode);
  if (!room) return null;
  const player = room.players[socketId];
  if (!player) return null;
  player.completed = true;
  player.score = finalScore;
  player.resultBand = resultBand;
  return room;
}

export function getRoomByTeacherSocket(socketId) {
  for (const room of rooms.values()) {
    if (room.teacherSocketId === socketId) return room;
  }
  return null;
}

export function getRoomByPlayerSocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players[socketId]) return room;
  }
  return null;
}

export function serializePlayers(room) {
  return Object.entries(room.players).map(([id, p]) => ({ id, ...p }));
}

function _freshPlayerState(name) {
  return {
    name,
    stageIndex: 0,
    questionIndex: 0,
    score: 0,
    totalAnswered: 0,
    completed: false,
    lastChoice: null,
    history: [],
  };
}
