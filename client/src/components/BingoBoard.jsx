import React, { useMemo } from "react";
import BingoCell from "./BingoCell.jsx";
import "../styles/board.css";

export default function BingoBoard({ board, markedNumbers, completedLines, boardSize, interactive, onSelect }) {
  const markedSet = useMemo(() => new Set(markedNumbers), [markedNumbers]);

  const { rowSet, colSet, diagMain, diagAnti } = useMemo(() => {
    const rowSet = new Set();
    const colSet = new Set();
    let diagMain = false;
    let diagAnti = false;
    (completedLines || []).forEach((line) => {
      if (line.type === "row") rowSet.add(line.index);
      else if (line.type === "column") colSet.add(line.index);
      else if (line.type === "diagonal" && line.index === 0) diagMain = true;
      else if (line.type === "diagonal" && line.index === 1) diagAnti = true;
    });
    return { rowSet, colSet, diagMain, diagAnti };
  }, [completedLines]);

  if (!board || board.length === 0) {
    return <div className="bingo-board bingo-board--empty">Waiting for board…</div>;
  }

  return (
    <div
      className={`bingo-board bingo-board--${boardSize}`}
      style={{ "--board-size": boardSize }}
      role="grid"
      aria-label="Bingo board"
    >
      {board.map((row, r) =>
        row.map((num, c) => {
          const onLine =
            rowSet.has(r) || colSet.has(c) || (diagMain && r === c) || (diagAnti && r + c === boardSize - 1);
          return (
            <BingoCell
              key={`${r}-${c}`}
              number={num}
              marked={markedSet.has(num)}
              onLine={onLine}
              interactive={interactive}
              onSelect={onSelect}
              boardSize={boardSize}
            />
          );
        })
      )}
    </div>
  );
}
