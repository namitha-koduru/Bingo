/**
 * Central configuration for every game mode.
 * Adding a brand new mode later is just adding a new entry here —
 * no other game logic needs to change since everything is driven
 * off boardSize / maxNumber / requiredLines.
 */
const GAME_MODES = {
  classic: {
    id: "classic",
    name: "Classic Bingo",
    emoji: "🎯",
    boardSize: 5,
    maxNumber: 25,
    requiredLines: 5,
  },
  super: {
    id: "super",
    name: "Super Bingo",
    emoji: "🔥",
    boardSize: 10,
    maxNumber: 100,
    requiredLines: 10,
  },
};

function isValidMode(modeId) {
  return Object.prototype.hasOwnProperty.call(GAME_MODES, modeId);
}

module.exports = { GAME_MODES, isValidMode };
