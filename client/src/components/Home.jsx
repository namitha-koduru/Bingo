import React from "react";
import { motion } from "framer-motion";
import "../styles/home.css";

export default function Home({ onCreate, onJoin }) {
  return (
    <div className="screen">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="home-hero"
      >
        <h1 className="chalk-title home-title">🎯 BINGO</h1>
        <p className="home-subtitle">the classic classroom game — now online</p>
      </motion.div>

      <motion.div
        className="mode-preview"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="mode-preview-card">
          <span className="mode-preview-emoji">🎯</span>
          <strong>Classic</strong>
          <span>5×5 · 5 lines to win</span>
        </div>
        <div className="mode-preview-card">
          <span className="mode-preview-emoji">🔥</span>
          <strong>Super Bingo</strong>
          <span>10×10 · 10 lines to win</span>
        </div>
      </motion.div>

      <motion.div
        className="home-actions"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <button className="btn btn-primary" onClick={onCreate}>
          Create Room
        </button>
        <button className="btn" onClick={onJoin}>
          Join Room
        </button>
      </motion.div>

      <p className="home-footnote">Grab a friend, share a room code, and play the notebook game you remember.</p>
    </div>
  );
}
