import React, { useState } from "react";
import { motion } from "framer-motion";
import { emitAsync } from "../socket/socket";
import "../styles/forms.css";

const MODES = [
  { id: "classic", emoji: "🎯", name: "Classic Bingo", size: "5 × 5", numbers: "Numbers 1–25", lines: "5 Lines to Win" },
  { id: "super", emoji: "🔥", name: "Super Bingo", size: "10 × 10", numbers: "Numbers 1–100", lines: "10 Lines to Win" },
];

export default function CreateRoom({ onBack, onEntered, onError }) {
  const [mode, setMode] = useState("classic");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return onError("Enter your name first.");
    setSubmitting(true);
    const res = await emitAsync("create-room", { name: trimmed, mode });
    setSubmitting(false);
    if (!res.ok) return onError(res.error || "Could not create room.");
    onEntered(res);
  };

  return (
    <div className="screen">
      <div className="screen-narrow">
        <button className="btn-ghost btn back-btn" onClick={onBack} type="button">
          ← Back
        </button>

        <h2 className="chalk-title form-heading">Create a Room</h2>

        <div className="mode-select-grid">
          {MODES.map((m) => (
            <motion.button
              type="button"
              key={m.id}
              className={`mode-select-card ${mode === m.id ? "mode-select-card--active" : ""}`}
              onClick={() => setMode(m.id)}
              whileTap={{ scale: 0.97 }}
            >
              <span className="mode-select-emoji">{m.emoji}</span>
              <strong>{m.name}</strong>
              <span>{m.size}</span>
              <span>{m.numbers}</span>
              <span>{m.lines}</span>
            </motion.button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="paper-card form-card">
          <span className="pushpin" />
          <label className="form-label" htmlFor="create-name">
            Your Name
          </label>
          <input
            id="create-name"
            className="text-input"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Namitha"
            autoFocus
          />
          <button className="btn btn-primary form-submit" disabled={submitting} type="submit">
            {submitting ? "Creating…" : "Create Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
