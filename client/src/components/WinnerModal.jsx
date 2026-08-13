import React, { useMemo } from "react";
import { motion } from "framer-motion";
import "../styles/winner.css";

const CONFETTI_COLORS = ["#f2c14e", "#c1443c", "#2e4a7a", "#4c8c4a", "#edebe0"];

function ConfettiPiece({ index }) {
  const left = useMemo(() => Math.random() * 100, []);
  const delay = useMemo(() => Math.random() * 0.6, []);
  const duration = useMemo(() => 2.2 + Math.random() * 1.4, []);
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const rotate = useMemo(() => Math.random() * 360, []);
  const drift = useMemo(() => (Math.random() - 0.5) * 120, []);

  return (
    <motion.span
      className="confetti-piece"
      style={{ left: `${left}%`, background: color }}
      initial={{ y: -40, opacity: 1, rotate: 0, x: 0 }}
      animate={{ y: "110vh", opacity: [1, 1, 0], rotate, x: drift }}
      transition={{ duration, delay, ease: "easeIn" }}
    />
  );
}

export default function WinnerModal({ room, playerId, me, onPlayAgain, onLeave }) {
  const winner = room.players.find((p) => p.id === room.winnerId);
  const iWon = room.winnerId === playerId;
  const isHost = !!me?.isHost;
  const isSuper = room.mode === "super";

  return (
    <div className="winner-overlay" role="dialog" aria-modal="true">
      <div className="confetti-field" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      <motion.div
        className="paper-card winner-card"
        initial={{ scale: 0.7, opacity: 0, rotate: -4 }}
        animate={{ scale: 1, opacity: 1, rotate: -1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <span className="pushpin" />
        <h2 className="winner-headline">{isSuper ? "🔥🔥 SUPER BINGO! 🔥🔥" : "🎉 BINGO! 🎉"}</h2>
        <p className="winner-name">{winner ? winner.name.toUpperCase() : "SOMEONE"} WINS!</p>
        <p className="winner-detail">
          {winner ? winner.lineCount : room.modeConfig.requiredLines} LINES COMPLETED
        </p>
        <p className="winner-badge">🏆 {isSuper ? "SUPER BINGO CHAMPION" : "CLASSIC BINGO CHAMPION"}</p>
        <p className="winner-personal">{iWon ? "Nicely played! 🙌" : "So close — get them next round!"}</p>

        <div className="winner-actions">
          {isHost ? (
            <button className="btn btn-primary" onClick={onPlayAgain}>
              Play Again
            </button>
          ) : (
            <p className="winner-waiting">Waiting for the host to start a rematch…</p>
          )}
          <button className="btn btn-ghost-dark" onClick={onLeave}>
            Return to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
