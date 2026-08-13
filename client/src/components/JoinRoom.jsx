import React, { useState } from "react";
import { emitAsync } from "../socket/socket";
import "../styles/forms.css";

export default function JoinRoom({ onBack, onEntered, onError }) {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = roomCode.trim().toUpperCase();
    if (!trimmedName) return onError("Enter your name first.");
    if (!trimmedCode) return onError("Enter the room code your friend shared.");
    setSubmitting(true);
    const res = await emitAsync("join-room", { name: trimmedName, roomId: trimmedCode });
    setSubmitting(false);
    if (!res.ok) return onError(res.error || "Could not join room.");
    onEntered(res);
  };

  return (
    <div className="screen">
      <div className="screen-narrow">
        <button className="btn-ghost btn back-btn" onClick={onBack} type="button">
          ← Back
        </button>

        <h2 className="chalk-title form-heading">Join a Room</h2>

        <form onSubmit={handleSubmit} className="paper-card form-card">
          <span className="pushpin" />
          <label className="form-label" htmlFor="join-name">
            Your Name
          </label>
          <input
            id="join-name"
            className="text-input"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul"
            autoFocus
          />

          <label className="form-label" htmlFor="join-code">
            Room Code
          </label>
          <input
            id="join-code"
            className="text-input room-code-input"
            value={roomCode}
            maxLength={6}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABX72"
          />

          <button className="btn btn-primary form-submit" disabled={submitting} type="submit">
            {submitting ? "Joining…" : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
