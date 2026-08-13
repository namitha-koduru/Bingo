import React, { useState } from "react";
import { motion } from "framer-motion";
import { emitAsync } from "../socket/socket";
import "../styles/lobby.css";

export default function Lobby({ room, playerId, onError, onLeave }) {
  const [starting, setStarting] = useState(false);
  const me = room.players.find((p) => p.id === playerId);
  const isHost = !!me?.isHost;
  const isFull = room.players.length === 2;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomId);
    } catch {
      /* clipboard may be unavailable — the code is already visible to copy manually */
    }
  };

  const handleStart = async () => {
    setStarting(true);
    const res = await emitAsync("start-game", {});
    setStarting(false);
    if (!res.ok) onError(res.error || "Could not start the game.");
  };

  return (
    <div className="screen">
      <div className="screen-narrow">
        <h2 className="chalk-title form-heading">🎯 Bingo Lobby</h2>

        <div className="paper-card lobby-card">
          <span className="pushpin" />
          <div className="lobby-room-row">
            <span className="lobby-room-label">Room Code</span>
            <button className="stamp lobby-code" onClick={handleCopyCode} title="Click to copy">
              {room.roomId}
            </button>
            <span className="lobby-hint">Share this code with your friend</span>
          </div>

          <div className="lobby-mode-row">
            <span>{room.modeConfig.emoji}</span>
            <strong>{room.modeConfig.name}</strong>
            <span className="lobby-mode-meta">
              {room.modeConfig.boardSize}×{room.modeConfig.boardSize} · {room.modeConfig.requiredLines} lines to win
            </span>
          </div>

          <div className="lobby-players">
            {[0, 1].map((slot) => {
              const p = room.players[slot];
              return (
                <motion.div
                  key={slot}
                  className={`lobby-player ${p ? "lobby-player--filled" : "lobby-player--empty"}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: slot * 0.1 }}
                >
                  {p ? (
                    <>
                      👤 {p.name} {p.isHost && <span className="lobby-host-badge">Host</span>}
                    </>
                  ) : (
                    "Waiting for a player…"
                  )}
                </motion.div>
              );
            })}
          </div>

          {isHost ? (
            <button className="btn btn-primary form-submit" onClick={handleStart} disabled={!isFull || starting}>
              {isFull ? (starting ? "Starting…" : "Start Game") : "Waiting for opponent…"}
            </button>
          ) : (
            <p className="lobby-waiting-text">Waiting for the host to start the game…</p>
          )}
        </div>

        <button className="btn-ghost btn" onClick={onLeave} type="button">
          Leave Room
        </button>
      </div>
    </div>
  );
}
