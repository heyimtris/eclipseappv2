import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ulgy32qqx7b6zj3n.l.tunwg.com"
];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"],
    preflightContinue: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ["*"],
  preflightContinue: true,
  optionsSuccessStatus: 200
}));
app.get("/", (req, res) => {
  res.send("Socket.io server running");
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("leave", (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  socket.on("message", (payload) => {
    console.log("[SERVER] Received message event:", payload);
    if (payload?.conversationId) {
      // Check room membership for debugging
      const roomSockets = io.sockets.adapter.rooms.get(payload.conversationId);
      console.log(`[SERVER] Room ${payload.conversationId} sockets:`, roomSockets ? Array.from(roomSockets) : []);
      io.to(payload.conversationId).emit("message", payload);
      console.log(`[SERVER] Relayed message to room ${payload.conversationId}`);
    } else {
      console.log("[SERVER] Message event missing conversationId:", payload);
    }
  });

  // Typing indicator relay
  socket.on("typing", (payload) => {
    console.log(`[SERVER] Received typing event:`, payload);
    if (payload?.conversationId && payload?.userId) {
      // Check room membership for debugging
      const roomSockets = io.sockets.adapter.rooms.get(payload.conversationId);
      console.log(`[SERVER] Room ${payload.conversationId} sockets:`, roomSockets ? Array.from(roomSockets) : []);
      socket.to(payload.conversationId).emit("typing", payload);
      console.log(`[SERVER] Relayed typing event to room ${payload.conversationId}`);
    } else {
      console.log(`[SERVER] Typing event missing conversationId or userId:`, payload);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});


const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
