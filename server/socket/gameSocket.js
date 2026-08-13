const roomManager = require("../game/roomManager");
const { isValidMode } = require("../game/gameModes");

const MAX_NAME_LENGTH = 20;

function sanitizeName(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, MAX_NAME_LENGTH);
}

function broadcastState(io, room, extraEventName, extraPayload = {}) {
  const state = room.toFullState();
  if (extraEventName) {
    io.to(room.roomId).emit(extraEventName, { ...extraPayload, state });
  }
  io.to(room.roomId).emit("game-state", state);
}

module.exports = function registerGameSocket(io) {
  io.on("connection", (socket) => {
    // Track which room/player this socket represents for cleanup on disconnect.
    socket.data.roomId = null;
    socket.data.playerId = null;

    socket.on("create-room", (payload, ack) => {
      try {
        const name = sanitizeName(payload && payload.name);
        const mode = payload && payload.mode;
        if (!name) return ack && ack({ ok: false, error: "Please enter your name." });
        if (!isValidMode(mode)) return ack && ack({ ok: false, error: "Invalid game mode." });

        const room = roomManager.createRoom(mode);
        const player = room.addPlayer(name, socket.id);

        socket.join(room.roomId);
        socket.data.roomId = room.roomId;
        socket.data.playerId = player.id;

        const response = { ok: true, roomId: room.roomId, playerId: player.id, state: room.toFullState() };
        ack && ack(response);
        socket.emit("room-created", response);
      } catch (err) {
        ack && ack({ ok: false, error: "Could not create room." });
      }
    });

    socket.on("join-room", (payload, ack) => {
      const name = sanitizeName(payload && payload.name);
      const roomId = payload && payload.roomId;
      if (!name) return ack && ack({ ok: false, error: "Please enter your name." });

      const room = roomManager.getRoom(roomId);
      if (!room) return ack && ack({ ok: false, error: "Room Not Found", code: "ROOM_NOT_FOUND" });
      if (room.gameStatus !== "lobby") {
        return ack && ack({ ok: false, error: "Game Already Started", code: "GAME_STARTED" });
      }
      if (room.isFull) return ack && ack({ ok: false, error: "Room Full", code: "ROOM_FULL" });

      const player = room.addPlayer(name, socket.id);
      socket.join(room.roomId);
      socket.data.roomId = room.roomId;
      socket.data.playerId = player.id;

      const response = { ok: true, roomId: room.roomId, playerId: player.id, state: room.toFullState() };
      ack && ack(response);
      io.to(room.roomId).emit("player-joined", { state: room.toFullState() });
    });

    socket.on("rejoin-room", (payload, ack) => {
      const roomId = payload && payload.roomId;
      const playerId = payload && payload.playerId;
      const room = roomManager.getRoom(roomId);
      if (!room) return ack && ack({ ok: false, error: "Room Not Found", code: "ROOM_NOT_FOUND" });

      const player = room.reconnectPlayer(playerId, socket.id);
      if (!player) return ack && ack({ ok: false, error: "Player Not Found", code: "PLAYER_NOT_FOUND" });

      socket.join(room.roomId);
      socket.data.roomId = room.roomId;
      socket.data.playerId = player.id;

      const response = { ok: true, roomId: room.roomId, playerId: player.id, state: room.toFullState() };
      ack && ack(response);
      io.to(room.roomId).emit("player-reconnected", { playerId: player.id, state: room.toFullState() });
    });

    socket.on("start-game", (payload, ack) => {
      const room = roomManager.getRoom(socket.data.roomId);
      if (!room) return ack && ack({ ok: false, error: "Room Not Found" });
      const player = room.getPlayer(socket.data.playerId);
      if (!player || !player.isHost) {
        return ack && ack({ ok: false, error: "Only the host can start the game." });
      }
      if (!room.canStart()) {
        return ack && ack({ ok: false, error: "Need exactly 2 players to start." });
      }

      room.startGame();
      ack && ack({ ok: true });
      broadcastState(io, room, "game-started");
    });

    socket.on("select-number", (payload, ack) => {
      const room = roomManager.getRoom(socket.data.roomId);
      const playerId = socket.data.playerId;
      if (!room) return ack && ack({ ok: false, error: "Room Not Found" });

      const number = Number(payload && payload.number);
      const validationError = room.validateSelection(playerId, number);
      if (validationError) return ack && ack({ ok: false, error: validationError });

      const { winner } = room.selectNumber(number);
      ack && ack({ ok: true });

      broadcastState(io, room, "number-selected", { number, selectedBy: playerId });

      if (winner) {
        io.to(room.roomId).emit("game-over", {
          winnerId: winner.id,
          winnerName: winner.name,
          lineCount: winner.completedLines.length,
          state: room.toFullState(),
        });
      }
    });

    socket.on("play-again", (payload, ack) => {
      const room = roomManager.getRoom(socket.data.roomId);
      if (!room) return ack && ack({ ok: false, error: "Room Not Found" });
      const player = room.getPlayer(socket.data.playerId);
      if (!player || !player.isHost) {
        return ack && ack({ ok: false, error: "Only the host can start a rematch." });
      }
      if (room.players.length < 2) {
        return ack && ack({ ok: false, error: "Waiting for a second player." });
      }

      room.restart();
      ack && ack({ ok: true });
      broadcastState(io, room, "game-restarted");
    });

    socket.on("leave-room", (payload, ack) => {
      const room = roomManager.getRoom(socket.data.roomId);
      if (room) {
        const player = room.getPlayer(socket.data.playerId);
        if (player) {
          room.players = room.players.filter((p) => p.id !== player.id);
          socket.leave(room.roomId);
          if (room.players.length === 0) {
            roomManager.deleteRoom(room.roomId);
          } else {
            io.to(room.roomId).emit("player-disconnected", {
              playerId: player.id,
              permanent: true,
              state: room.toFullState(),
            });
          }
        }
      }
      socket.data.roomId = null;
      socket.data.playerId = null;
      ack && ack({ ok: true });
    });

    socket.on("disconnect", () => {
      const room = roomManager.getRoom(socket.data.roomId);
      if (!room) return;
      const player = room.markDisconnected(socket.id, (expiredPlayerId) => {
        // Grace period elapsed with no reconnect — free the seat permanently.
        const stillThere = room.getPlayer(expiredPlayerId);
        if (!stillThere) return;
        room.players = room.players.filter((p) => p.id !== expiredPlayerId);
        if (room.players.length === 0) {
          roomManager.deleteRoom(room.roomId);
        } else {
          io.to(room.roomId).emit("player-disconnected", {
            playerId: expiredPlayerId,
            permanent: true,
            state: room.toFullState(),
          });
        }
      });
      if (player) {
        io.to(room.roomId).emit("player-disconnected", {
          playerId: player.id,
          permanent: false,
          state: room.toFullState(),
        });
      }
    });
  });
};
