const express = require("express");
const path = require("path");
const os = require("os");
const { Server } = require("ws");

const app = express();
const port = 3000;
const localIP = "192.168.1.35";

let currentRange = 0;

app.use(express.static(path.join(__dirname, "../WebPage")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../WebPage/index.html"));
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const server = app.listen(port, "0.0.0.0", () => {
  console.log("=====================================");
  console.log("🚀 Server running on:");
  console.log("   💻 Local:   http://localhost:" + port);
  console.log("   📱 Network: http://" + localIP + ":" + port);
  console.log("=====================================");
  console.log("📋 Use Network URL for phone/Arduino");
  console.log("");
});

const wss = new Server({ server });

function broadcast(data, exclude) {
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on("connection", (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log("✅ Client connected:", clientIP);

  ws.send(JSON.stringify({ type: "rangeUpdate", value: currentRange }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "range") {
        currentRange = data.value;
        console.log("🔄 Range updated to:", currentRange);
        broadcast({ type: "rangeUpdate", value: currentRange }, ws);
      }
    } catch (e) {
      console.log("Received raw message:", msg.toString());
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});
