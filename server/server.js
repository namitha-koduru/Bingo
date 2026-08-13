const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const registerGameSocket = require("./socket/gameSocket");
const roomManager = require("./game/roomManager");

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, rooms: roomManager.rooms.size, uptime: process.uptime() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

registerGameSocket(io);

server.listen(PORT, () => {
  console.log(`🎯 Bingo server running on port ${PORT}`);
});
