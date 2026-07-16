import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import {
  createRoom,
  getRoom,
  destroyRoom,
  addPlayer,
  removePlayer,
  updatePlayerProgress,
  markPlayerComplete,
  startCrisis,
  resetAllPlayers,
  unlockTo,
  getRoomByTeacherSocket,
  getRoomByPlayerSocket,
  serializePlayers,
} from "./roomManager.js";

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

app.get("/health", (_req, res) => res.json({ ok: true }));

io.on("connection", (socket) => {
  // ── Teacher: create a room (no scenario needed at creation time) ──────────
  socket.on("create-room", ({ pin, mode }) => {
    if (!pin || !mode) {
      socket.emit("error-msg", "Missing room configuration.");
      return;
    }
    const room = createRoom({ pin, mode, teacherSocketId: socket.id });
    socket.join(room.id);
    socket.emit("room-created", { roomCode: room.id });
  });

  // ── Teacher: start a crisis ───────────────────────────────────────────────
  socket.on("start-crisis", ({ roomCode, scenarioId }) => {
    const room = getRoom(roomCode);
    if (!room) { socket.emit("error-msg", "Room not found."); return; }
    if (room.teacherSocketId !== socket.id) { socket.emit("error-msg", "Not authorised."); return; }
    if (!scenarioId) { socket.emit("error-msg", "No scenario selected."); return; }

    const updated = startCrisis(roomCode, scenarioId);
    io.to(room.id).emit("crisis-started", {
      scenarioId,
      mode: room.mode,
      unlockedUpTo: updated.unlockedUpTo,
      characterMode: room.characterMode,
    });
  });

  // ── Teacher: end the current crisis ──────────────────────────────────────
  socket.on("end-crisis", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.teacherSocketId !== socket.id) return;
    room.status = "between-crises";
    // Broadcast to students (not to teacher socket itself)
    socket.to(room.id).emit("crisis-ended");
  });

  // ── Teacher: return everyone to lobby for next crisis ─────────────────────
  socket.on("return-to-room", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.teacherSocketId !== socket.id) return;
    resetAllPlayers(roomCode);
    io.to(room.id).emit("returned-to-lobby", {
      players: serializePlayers(room),
    });
  });

  // ── Teacher: broadcast rankings to students ───────────────────────────────
  socket.on("show-rankings", ({ roomCode, rankings }) => {
    const room = getRoom(roomCode);
    if (!room || room.teacherSocketId !== socket.id) return;
    socket.to(room.id).emit("rankings-revealed", { rankings });
  });

  // ── Teacher: unlock questions up to a specific number ────────────────────
  socket.on("unlock-to", ({ roomCode, questionNumber }) => {
    const room = getRoom(roomCode);
    if (!room || room.teacherSocketId !== socket.id) return;
    const updated = unlockTo(roomCode, questionNumber);
    if (!updated) return;
    io.to(room.id).emit("questions-unlocked", { unlockedUpTo: questionNumber });
  });

  // ── Teacher: toggle character / neutral mode ─────────────────────────────
  socket.on("character-mode-toggle", ({ roomCode, characterMode }) => {
    const room = getRoom(roomCode);
    if (!room || room.teacherSocketId !== socket.id) return;
    room.characterMode = characterMode;
    io.to(room.id).emit("character-mode-changed", { characterMode });
  });

  // ── Teacher: permanently end session ─────────────────────────────────────
  socket.on("end-session", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.teacherSocketId !== socket.id) return;
    io.to(room.id).emit("session-ended");
    destroyRoom(roomCode);
  });

  // ── Student: join a room ──────────────────────────────────────────────────
  socket.on("join-room", ({ roomCode, playerName }) => {
    const code = (roomCode || "").toUpperCase().trim();
    const name = (playerName || "").trim();

    if (!code || !name) { socket.emit("error-msg", "Room code and name are required."); return; }

    const room = getRoom(code);
    if (!room) { socket.emit("error-msg", "Room not found. Check your code."); return; }
    if (room.status === "ended") { socket.emit("error-msg", "This session has ended."); return; }

    addPlayer(code, socket.id, name);
    socket.join(code);

    socket.emit("join-ack", {
      roomCode: code,
      mode: room.mode,
      scenarioId: room.scenarioId,
      status: room.status,
      unlockedUpTo: room.unlockedUpTo,
      players: serializePlayers(room),
    });

    const teacherSocket = io.sockets.sockets.get(room.teacherSocketId);
    if (teacherSocket) {
      teacherSocket.emit("player-joined", {
        id: socket.id,
        name,
        players: serializePlayers(room),
      });
    }
  });

  // ── Student: answer submitted ─────────────────────────────────────────────
  socket.on("answer-submitted", (payload) => {
    const room = getRoomByPlayerSocket(socket.id);
    if (!room) return;

    const updated = updatePlayerProgress(room.id, socket.id, payload);
    if (!updated) return;

    const player = updated.players[socket.id];
    const teacherSocket = io.sockets.sockets.get(updated.teacherSocketId);
    if (teacherSocket) {
      teacherSocket.emit("player-progress", {
        id: socket.id,
        name: player.name,
        stageIndex: player.stageIndex,
        questionIndex: player.questionIndex,
        score: player.score,
        totalAnswered: player.totalAnswered,
        lastChoice: player.lastChoice,
        history: player.history,
        completed: player.completed,
      });
    }
  });

  // ── Student: game complete ────────────────────────────────────────────────
  socket.on("game-complete", ({ finalScore, resultBand }) => {
    const room = getRoomByPlayerSocket(socket.id);
    if (!room) return;

    const updated = markPlayerComplete(room.id, socket.id, finalScore, resultBand);
    if (!updated) return;

    const player = updated.players[socket.id];
    const teacherSocket = io.sockets.sockets.get(updated.teacherSocketId);
    if (teacherSocket) {
      teacherSocket.emit("player-completed", {
        id: socket.id,
        name: player.name,
        finalScore,
        resultBand,
        history: player.history,
      });
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const teacherRoom = getRoomByTeacherSocket(socket.id);
    if (teacherRoom) {
      io.to(teacherRoom.id).emit("session-ended");
      destroyRoom(teacherRoom.id);
      return;
    }

    const playerRoom = getRoomByPlayerSocket(socket.id);
    if (playerRoom) {
      const player = playerRoom.players[socket.id];
      removePlayer(playerRoom.id, socket.id);
      const teacherSocket = io.sockets.sockets.get(playerRoom.teacherSocketId);
      if (teacherSocket && player) {
        teacherSocket.emit("player-left", {
          id: socket.id,
          name: player.name,
          players: serializePlayers(playerRoom),
        });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Crisis server running on port ${PORT}`);
});
