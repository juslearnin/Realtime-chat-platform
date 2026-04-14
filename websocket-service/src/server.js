require("dotenv").config();
const logger = require("./utils/logger");
const express = require("express");
const http = require("http");
const { initializeSocket } = require("./socket/socket");
const connectDB = require("./config/db");

// DEBUG: Check if .env is actually loading
if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not defined in .env file!");
  console.log("Current working directory:", process.cwd());
  process.exit(1); // Stop the app before it crashes Mongoose
}

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initializeSocket(server);

server.listen(PORT, () => {
  logger.info(`WebSocket server running on port ${PORT}`);
});
//Browser → HTTP Server → Socket.io → Persistent Connection
/*What We Achieved

We created a Socket.io WebSocket server attached to Express.

How It Works Internally

Flow:

Browser → HTTP Server → Socket.io → Persistent Connection

When this runs:

initializeSocket(server);

Internally:

HTTP server starts
Socket.io attaches to it
Client connects
Persistent WebSocket opens

This line:

io.on("connection", socket => {})

means:

"Whenever a user connects, create a new socket session."

Each connected user gets:

Unique socket.id

Example:

User connected: kf83hdf93

How It Works

Instead of:

HTTP request → response

We now use:

emit(eventName, data)

Example:

socket.emit("send_message", data);

Server listens:

socket.on("send_message", handler);

*/