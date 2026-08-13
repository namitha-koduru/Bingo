const { GAME_MODES } = require("./gameModes");
const { generateBoard, calculateCompletedLines } = require("./gameLogic");

const RECONNECT_GRACE_MS = 2 * 60 * 1000; // 2 minutes to reconnect before a seat is freed

let playerIdCounter = 0;
function nextPlayerId() {
  playerIdCounter += 1;
  return `p_${Date.now().toString(36)}_${playerIdCounter}`;
}

class Player {
  constructor(name, isHost) {
    this.id = nextPlayerId();
    this.socketId = null;
    this.name = name;
    this.isHost = isHost;
    this.connected = true;
    this.disconnectTimer = null;
    this.board = [];
    this.markedNumbers = new Set();
    this.completedLines = [];
    this.hasWon = false;
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      isHost: this.isHost,
      connected: this.connected,
      markedCount: this.markedNumbers.size,
      lineCount: this.completedLines.length,
      hasWon: this.hasWon,
    };
  }
}

class GameRoom {
  constructor(roomId, modeId) {
    this.roomId = roomId;
    this.modeId = modeId;
    this.mode = GAME_MODES[modeId];
    this.players = []; // max 2
    this.gameStatus = "lobby"; // lobby | playing | finished
    this.currentTurnPlayerId = null;
    this.selectedNumbers = []; // ordered history, shared identifiers
    this.winnerId = null;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.emptyRoomTimer = null;
  }

  touch() {
    this.lastActivity = Date.now();
  }

  get isFull() {
    return this.players.filter((p) => p.connected || p.disconnectTimer).length >= 2;
  }

  getPlayer(playerId) {
    return this.players.find((p) => p.id === playerId) || null;
  }

  getPlayerBySocket(socketId) {
    return this.players.find((p) => p.socketId === socketId) || null;
  }

  getOpponent(playerId) {
    return this.players.find((p) => p.id !== playerId) || null;
  }

  addPlayer(name, socketId) {
    const isHost = this.players.length === 0;
    const player = new Player(name, isHost);
    player.socketId = socketId;
    this.players.push(player);
    this.touch();
    return player;
  }

  reconnectPlayer(playerId, socketId) {
    const player = this.getPlayer(playerId);
    if (!player) return null;
    player.socketId = socketId;
    player.connected = true;
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
    this.touch();
    return player;
  }

  markDisconnected(socketId, onExpire) {
    const player = this.getPlayerBySocket(socketId);
    if (!player) return null;
    player.connected = false;
    player.disconnectTimer = setTimeout(() => {
      onExpire(player.id);
    }, RECONNECT_GRACE_MS);
    this.touch();
    return player;
  }

  canStart() {
    return this.gameStatus === "lobby" && this.players.length === 2;
  }

  startGame() {
    const { boardSize, maxNumber } = this.mode;
    this.players.forEach((p) => {
      p.board = generateBoard(boardSize, maxNumber);
      p.markedNumbers = new Set();
      p.completedLines = [];
      p.hasWon = false;
    });
    this.selectedNumbers = [];
    this.winnerId = null;
    this.gameStatus = "playing";
    // Host always opens the very first round; alternates naturally after that.
    const host = this.players.find((p) => p.isHost) || this.players[0];
    this.currentTurnPlayerId = host.id;
    this.touch();
  }

  restart() {
    this.startGame();
  }

  /**
   * Applies a validated number selection: marks it on BOTH players' boards
   * (the number is the shared identifier, board position does not matter),
   * recalculates lines for both, determines a winner if any, and advances
   * the turn.
   */
  selectNumber(number) {
    this.players.forEach((p) => p.markedNumbers.add(number));
    this.selectedNumbers.push(number);

    let newlyCompletedByPlayer = {};
    this.players.forEach((p) => {
      const result = calculateCompletedLines(p.board, p.markedNumbers);
      const previousCount = p.completedLines.length;
      p.completedLines = result.lines;
      newlyCompletedByPlayer[p.id] = {
        result,
        gainedLine: result.lines.length > previousCount,
      };
      if (result.total >= this.mode.requiredLines) {
        p.hasWon = true;
      }
    });

    let winner = null;
    if (!this.winnerId) {
      // Prefer the player whose turn it currently is if both cross the
      // threshold on the same call (extremely rare edge case).
      const currentTurnPlayer = this.getPlayer(this.currentTurnPlayerId);
      if (currentTurnPlayer && currentTurnPlayer.hasWon) {
        winner = currentTurnPlayer;
      } else {
        winner = this.players.find((p) => p.hasWon) || null;
      }
      if (winner) {
        this.winnerId = winner.id;
        this.gameStatus = "finished";
      }
    }

    if (!this.winnerId) {
      const opponent = this.getOpponent(this.currentTurnPlayerId);
      this.currentTurnPlayerId = opponent ? opponent.id : this.currentTurnPlayerId;
    }

    this.touch();
    return { newlyCompletedByPlayer, winner };
  }

  validateSelection(playerId, number) {
    if (this.gameStatus !== "playing") return "Game is not currently active.";
    if (this.winnerId) return "Game already has a winner.";
    if (this.currentTurnPlayerId !== playerId) return "It is not your turn.";
    if (!Number.isInteger(number) || number < 1 || number > this.mode.maxNumber) {
      return "Invalid number.";
    }
    if (this.selectedNumbers.includes(number)) return "Number already selected.";
    return null;
  }

  /**
   * A single authoritative snapshot of the room. Broadcast to both clients
   * after every mutation so the frontend never has to compute game logic
   * itself — it only ever renders what the server says is true.
   */
  toFullState() {
    return {
      roomId: this.roomId,
      mode: this.modeId,
      modeConfig: this.mode,
      gameStatus: this.gameStatus,
      currentTurnPlayerId: this.currentTurnPlayerId,
      selectedNumbers: this.selectedNumbers,
      winnerId: this.winnerId,
      hostId: (this.players.find((p) => p.isHost) || {}).id || null,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        connected: p.connected,
        board: p.board,
        markedNumbers: Array.from(p.markedNumbers),
        completedLines: p.completedLines,
        lineCount: p.completedLines.length,
        hasWon: p.hasWon,
      })),
    };
  }
}

module.exports = { GameRoom, RECONNECT_GRACE_MS };
