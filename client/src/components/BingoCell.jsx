import React from "react";
import { motion } from "framer-motion";

export default function BingoCell({ number, marked, onLine, interactive, onSelect, boardSize }) {
  const clickable = interactive && !marked;
  const smallText = boardSize >= 10;

  return (
    <button
      type="button"
      className={[
        "bingo-cell",
        marked ? "bingo-cell--marked" : "",
        onLine ? "bingo-cell--online" : "",
        clickable ? "bingo-cell--clickable" : "",
        smallText ? "bingo-cell--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => clickable && onSelect(number)}
      disabled={!clickable}
      aria-pressed={marked}
      aria-label={marked ? `${number}, marked` : `${number}`}
    >
      <span className="bingo-cell-number">{number}</span>
      {marked && (
        <motion.span
          className="bingo-cell-strike"
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          aria-hidden="true"
        >
          ✕
        </motion.span>
      )}
    </button>
  );
}
