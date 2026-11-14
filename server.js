const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res, parse(req.url, true)));
  const wss = new WebSocketServer({ noServer: true });
  
  // Track connections by conversationId
  const connections = new Map();
  
  server.on("upgrade", (req, socket, head) => {
    const { pathname, query } = parse(req.url, true);
    const m = pathname.match(/^\/ws\/chat\/([^/]+)$/);
    if (!m) {
      socket.destroy();
      return;
    }
    const conversationId = m[1];
    req.conversationId = conversationId;
    req.token = query.token;
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });
  
  wss.on("connection", async (ws, req) => {
    const conversationId = req.conversationId;
    const token = req.token;
    
    try {
      // Verify JWT
      const { verifyAccessToken } = require("./src/modules/auth/token.service");
      const payload = await verifyAccessToken(token);
      const userId = payload.sub;
      
      // Check participant membership
      const { prisma } = require("./src/shared/db/client");
      const participant = await prisma.chatParticipant.findFirst({
        where: { conversationId, userId }
      });
      if (!participant) {
        ws.close(1008, "Not a participant");
        return;
      }
      
      ws.userId = userId;
      ws.conversationId = conversationId;
      
      // Add to connections map
      if (!connections.has(conversationId)) {
        connections.set(conversationId, new Set());
      }
      connections.get(conversationId).add(ws);
      
      ws.on("message", async (data) => {
        try {
          const { body, attachments } = JSON.parse(data.toString());
          // Save message to DB
          const { sendMessage } = require("./src/modules/chat/chat.service");
          const message = await sendMessage(conversationId, ws.userId, body || "", attachments);
          // Broadcast to all participants in conversation
          const conns = connections.get(conversationId);
          if (conns) {
            const msgJson = JSON.stringify({
              type: "message",
              data: message
            });
            conns.forEach((client) => {
              if (client.readyState === 1) { // OPEN
                client.send(msgJson);
              }
            });
          }
        } catch (err) {
          ws.send(JSON.stringify({ type: "error", message: "Failed to send message" }));
        }
      });
      
      ws.on("close", () => {
        const conns = connections.get(conversationId);
        if (conns) {
          conns.delete(ws);
          if (conns.size === 0) {
            connections.delete(conversationId);
          }
        }
      });
      
      ws.send(JSON.stringify({ type: "connected", conversationId }));
    } catch (err) {
      ws.close(1008, "Authentication failed");
    }
  });
  
  const PORT = parseInt(process.env.PORT || "3000", 10);
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> WebSocket on ws://localhost:${PORT}/ws/chat/:conversationId`);
  });
});
