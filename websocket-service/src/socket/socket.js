const { Server } = require("socket.io");
const SOCKET_EVENTS = require("./events/socket.events"); // Fixed Path
const registerMessageHandlers = require("./handlers/message.handler"); // Fixed Path
const logger = require("../utils/logger");

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  logger.info("Socket.io initialized");

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Register handlers - passing both io and socket
    registerMessageHandlers(io, socket);

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = {
  initializeSocket,
  getIO,
};
/* Constants: The Dictionary (No typos allowed).

Socket.js: The Handshake (Welcome to the server).

Message Handler: The Switchboard (Who gets which message?).

Server.js: The Glue (Starting everything together). */