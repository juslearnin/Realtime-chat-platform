require("dotenv").config();

const express = require("express");
const http = require("http");

const { initializeSocket } = require("./socket/socket");

const app = express();

app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize socket
initializeSocket(server);

server.listen(PORT, () => {
  console.log(
    `WebSocket server running on port ${PORT}`
  );
});