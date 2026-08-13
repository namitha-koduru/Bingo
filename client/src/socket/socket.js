import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

// Single shared socket for the whole app lifetime; connects lazily.
export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

/** Promise-wrapped emit with ack callback, since the server acks every request. */
export function emitAsync(event, payload = {}) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response) => resolve(response || { ok: false, error: "No response from server." }));
  });
}
