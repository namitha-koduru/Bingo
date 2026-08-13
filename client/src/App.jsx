import React, { useCallback, useEffect, useState } from "react";
import { socket, emitAsync } from "./socket/socket";
import { sounds, setSoundEnabled, getSoundEnabled } from "./utils/sound";
import Home from "./components/Home.jsx";
import CreateRoom from "./components/CreateRoom.jsx";
import JoinRoom from "./components/JoinRoom.jsx";
import Lobby from "./components/Lobby.jsx";
import GameScreen from "./components/GameScreen.jsx";
import Toast from "./components/Toast.jsx";
import "./styles/layout.css";

const SESSION_KEY = "bingo-session";

function saveSession(roomId, playerId) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, playerId }));
  } catch {
    /* sessionStorage may be unavailable (e.g. privacy mode) — non-fatal */
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* no-op */
  }
}

export default function App() {
  const [screen, setScreen] = useState("home"); // home | create | join
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [error, setError] = useState(null);
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [reconnecting, setReconnecting] = useState(false);
  const [opponentLeftPermanently, setOpponentLeftPermanently] = useState(false);

  const flashError = useCallback((message) => {
    setError(message);
    sounds.error();
    window.clearTimeout(flashError._t);
    flashError._t = window.setTimeout(() => setError(null), 3200);
  }, []);

  // Attempt to resume a session on first load (page refresh mid-game).
  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    setReconnecting(true);
    const tryRejoin = () => {
      emitAsync("rejoin-room", session).then((res) => {
        setReconnecting(false);
        if (res.ok) {
          setRoom(res.state);
          setPlayerId(res.playerId);
        } else {
          clearSession();
        }
      });
    };
    if (socket.connected) tryRejoin();
    else socket.once("connect", tryRejoin);
  }, []);

  useEffect(() => {
    const onGameState = (state) => {
      setRoom(state);
      if (state.players.length === 2) setOpponentLeftPermanently(false);
    };
    const onNumberSelected = ({ number, state }) => {
      setRoom(state);
    };
    const onGameStarted = () => sounds.turnChange();
    const onGameOver = () => sounds.win();
    const onPlayerJoined = ({ state }) => setRoom(state);
    const onPlayerReconnected = ({ state }) => setRoom(state);
    const onPlayerDisconnected = ({ permanent, state }) => {
      setRoom(state);
      if (permanent && state.players.length < 2 && state.gameStatus !== "lobby") {
        setOpponentLeftPermanently(true);
      }
    };
    const onConnectError = () => flashError("Can't reach the game server. Check your connection.");

    socket.on("game-state", onGameState);
    socket.on("number-selected", onNumberSelected);
    socket.on("game-started", onGameStarted);
    socket.on("game-over", onGameOver);
    socket.on("player-joined", onPlayerJoined);
    socket.on("player-reconnected", onPlayerReconnected);
    socket.on("player-disconnected", onPlayerDisconnected);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("game-state", onGameState);
      socket.off("number-selected", onNumberSelected);
      socket.off("game-started", onGameStarted);
      socket.off("game-over", onGameOver);
      socket.off("player-joined", onPlayerJoined);
      socket.off("player-reconnected", onPlayerReconnected);
      socket.off("player-disconnected", onPlayerDisconnected);
      socket.off("connect_error", onConnectError);
    };
  }, [flashError]);

  const handleRoomEntered = (res) => {
    setRoom(res.state);
    setPlayerId(res.playerId);
    saveSession(res.roomId, res.playerId);
    setScreen("home");
  };

  const handleLeave = async () => {
    await emitAsync("leave-room");
    clearSession();
    setRoom(null);
    setPlayerId(null);
    setOpponentLeftPermanently(false);
    setScreen("home");
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  let body;
  if (reconnecting) {
    body = (
      <div className="center-fill">
        <p className="chalk-title" style={{ fontSize: "1.4rem" }}>
          Reconnecting to your game…
        </p>
      </div>
    );
  } else if (room) {
    if (room.gameStatus === "lobby") {
      body = <Lobby room={room} playerId={playerId} onError={flashError} onLeave={handleLeave} />;
    } else {
      body = (
        <GameScreen
          room={room}
          playerId={playerId}
          onError={flashError}
          onLeave={handleLeave}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          opponentLeftPermanently={opponentLeftPermanently}
        />
      );
    }
  } else if (screen === "create") {
    body = <CreateRoom onBack={() => setScreen("home")} onEntered={handleRoomEntered} onError={flashError} />;
  } else if (screen === "join") {
    body = <JoinRoom onBack={() => setScreen("home")} onEntered={handleRoomEntered} onError={flashError} />;
  } else {
    body = <Home onCreate={() => setScreen("create")} onJoin={() => setScreen("join")} />;
  }

  return (
    <div className="app-shell">
      {body}
      <Toast message={error} />
    </div>
  );
}
