import React, { useEffect, useRef } from "react";
import { emitAsync } from "../socket/socket";
import { sounds } from "../utils/sound";
import GameHeader from "./GameHeader.jsx";
import BingoBoard from "./BingoBoard.jsx";
import WinnerModal from "./WinnerModal.jsx";
import DisconnectBanner from "./DisconnectBanner.jsx";
import "../styles/game.css";

export default function GameScreen({
  room,
  playerId,
  onError,
  onLeave,
  soundOn,
  onToggleSound,
  opponentLeftPermanently,
}) {
  const me = room.players.find((p) => p.id === playerId) || null;
  const opponent = room.players.find((p) => p.id !== playerId) || null;
  const isMyTurn = room.gameStatus === "playing" && room.currentTurnPlayerId === playerId;

  const prevSelectedCountRef = useRef(room.selectedNumbers.length);
  const prevMyLinesRef = useRef(me ? me.lineCount : 0);
  const prevOppLinesRef = useRef(opponent ? opponent.lineCount : 0);
  const prevTurnRef = useRef(room.currentTurnPlayerId);

  useEffect(() => {
    const myLines = me ? me.lineCount : 0;
    const oppLines = opponent ? opponent.lineCount : 0;

    if (room.selectedNumbers.length > prevSelectedCountRef.current) {
      // A new number came in from the opponent (our own clicks already played `click`).
      if (room.currentTurnPlayerId !== playerId) sounds.markOpponent();
    }
    if (myLines > prevMyLinesRef.current || oppLines > prevOppLinesRef.current) {
      sounds.lineComplete();
    }
    if (prevTurnRef.current !== room.currentTurnPlayerId && room.gameStatus === "playing") {
      sounds.turnChange();
    }

    prevSelectedCountRef.current = room.selectedNumbers.length;
    prevMyLinesRef.current = myLines;
    prevOppLinesRef.current = oppLines;
    prevTurnRef.current = room.currentTurnPlayerId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.selectedNumbers.length, me?.lineCount, opponent?.lineCount, room.currentTurnPlayerId]);

  const handleSelect = async (number) => {
    if (!isMyTurn) return onError("Wait for your turn!");
    sounds.click();
    const res = await emitAsync("select-number", { number });
    if (!res.ok) onError(res.error || "Could not select that number.");
  };

  const handlePlayAgain = async () => {
    const res = await emitAsync("play-again", {});
    if (!res.ok) onError(res.error || "Could not start a rematch.");
  };

  if (!me) {
    return (
      <div className="center-fill">
        <p className="chalk-title">Loading your board…</p>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <GameHeader
        room={room}
        me={me}
        opponent={opponent}
        isMyTurn={isMyTurn}
        soundOn={soundOn}
        onToggleSound={onToggleSound}
        onLeave={onLeave}
      />

      {opponent && !opponent.connected && room.gameStatus === "playing" && (
        <DisconnectBanner name={opponent.name} />
      )}

      {opponentLeftPermanently && (
        <div className="opponent-left-banner">
          <span>👋 {opponent ? opponent.name : "Your friend"} left the game.</span>
          <button className="btn btn-primary" onClick={onLeave}>
            Return to Home
          </button>
        </div>
      )}

      <div className="boards-wrap">
        <section className="board-column">
          <h3 className="board-heading">Your Board</h3>
          <BingoBoard
            board={me.board}
            markedNumbers={me.markedNumbers}
            completedLines={me.completedLines}
            boardSize={room.modeConfig.boardSize}
            interactive={isMyTurn && room.gameStatus === "playing"}
            onSelect={handleSelect}
          />
        </section>

        <section className="board-column board-column--opponent">
          <h3 className="board-heading">{opponent ? opponent.name : "Opponent"}'s Board</h3>
          <BingoBoard
            board={opponent ? opponent.board : []}
            markedNumbers={opponent ? opponent.markedNumbers : []}
            completedLines={opponent ? opponent.completedLines : []}
            boardSize={room.modeConfig.boardSize}
            interactive={false}
            onSelect={() => {}}
          />
        </section>
      </div>

      {room.gameStatus === "finished" && (
        <WinnerModal room={room} playerId={playerId} me={me} onPlayAgain={handlePlayAgain} onLeave={onLeave} />
      )}
    </div>
  );
}
