const { customAlphabet } = require("nanoid");
const { GameRoom } = require("./GameRoom");
const { isValidMode } = require("./gameModes");

// Uppercase letters + digits, no ambiguous chars (0/O, 1/I) — easy to read aloud/type.
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

const ROOM_TTL_MS = 30 * 60 * 1000; // rooms with no activity for 30 min are swept

class RoomManager {
  constructor() {
    this.rooms = new Map();
    setInterval(() => this.sweep(), 5 * 60 * 1000).unref();
  }

  createRoom(modeId) {
    if (!isValidMode(modeId)) throw new Error("Invalid game mode");
    let roomId;
    do {
      roomId = nanoid();
    } while (this.rooms.has(roomId));
    const room = new GameRoom(roomId, modeId);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId.toUpperCase()) || null;
  }

  deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }

  sweep() {
    const now = Date.now();
    for (const [id, room] of this.rooms.entries()) {
      if (now - room.lastActivity > ROOM_TTL_MS) {
        this.rooms.delete(id);
      }
    }
  }
}

module.exports = new RoomManager();
