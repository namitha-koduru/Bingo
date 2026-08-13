import React from "react";
import "../styles/game.css";

export default function GameHeader({ room, me, opponent, isMyTurn, soundOn, onToggleSound, onLeave }) {
  const { modeConfig } = room;
  const gameOver = room.gameStatus === "finished";

  return (
    <header className="game-header">
      <div className="game-header-top">
        <div className="game-mode-badge">
          <span>{modeConfig.emoji}</span>
          <span>{modeConfig.name}</span>
          <span className="game-mode-size">
            {modeConfig.boardSize}×{modeConfig.boardSize}
          </span>
        </div>

        <div className="game-header-controls">
          <button className="icon-btn" onClick={onToggleSound} title="Toggle sound" type="button">
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button className="icon-btn" onClick={onLeave} title="Leave game" type="button">
            🚪
          </button>
        </div>
      </div>

      <div className="game-header-status">
        <div className="lines-progress">
          <span className="lines-progress-label">
            You: {me.lineCount} / {modeConfig.requiredLines}
          </span>
          <div className="lines-progress-bar">
            <div
              className="lines-progress-fill"
              style={{ width: `${Math.min(100, (me.lineCount / modeConfig.requiredLines) * 100)}%` }}
            />
          </div>
        </div>
        <div className="lines-progress">
          <span className="lines-progress-label">
            {opponent ? opponent.name : "Opponent"}: {opponent ? opponent.lineCount : 0} / {modeConfig.requiredLines}
          </span>
          <div className="lines-progress-bar">
            <div
              className="lines-progress-fill lines-progress-fill--opponent"
              style={{
                width: `${Math.min(100, ((opponent ? opponent.lineCount : 0) / modeConfig.requiredLines) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {!gameOver && (
        <div className={`turn-banner ${isMyTurn ? "turn-banner--mine" : "turn-banner--theirs"}`}>
          {isMyTurn ? "YOUR TURN 🎯" : `WAITING FOR ${opponent ? opponent.name.toUpperCase() : "OPPONENT"}…`}
        </div>
      )}
    </header>
  );
}
