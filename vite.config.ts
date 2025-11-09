import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { Server } from "socket.io";

export default defineConfig({
 server: {
  host: true,
  port: 8080,
  allowedHosts: true,
 },
  plugins: [
    tailwindcss(), 
    reactRouter(), 
    tsconfigPaths(),
    {
      name: "socket.io",
      configureServer(server) {
        if (!server.httpServer) return;
        const io = new Server(server.httpServer, {
          cors: {
            origin: "*",
            methods: ["GET", "POST"]
          }
        });

        io.on("connection", (socket) => {
          console.log("Socket connected:", socket.id);

          socket.on("join", (conversationId) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} joined room ${conversationId}`);
          });

          socket.on("message", (data) => {
            const { conversationId, message } = data || {};
            if (!conversationId) return;
            io.to(conversationId).emit("message", { conversationId, message });
            console.log(`Message sent to room ${conversationId}`);
          });

          socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
          });
        });
      }
    }
  ],
});
