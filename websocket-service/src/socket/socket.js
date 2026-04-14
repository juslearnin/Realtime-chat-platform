const { Server } = require("socket.io");
/* Creates WebSocket server instance. */
const SOCKET_EVENTS = require("./events/socket.events");
/* Stores global socket instance.*/
const registerMessageHandlers = require("./handlers/message.handler");
const logger = require("../utils/logger");

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
//CORS (Cross-Origin Resource Sharing) is a security guard. Setting it to "*" means "allow any website to connect." In a real "boosted" app, you'd change this to your specific website URL for security.
  logger.info("Socket.io initialized");

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Register message handlers
    registerMessageHandlers(io, socket);
    /*This is the "Pro" move. Instead of writing 500 lines of code inside this one file, we "delegate" the work. We say: "Okay, you're connected! Now go over to the message.handler file to learn how to speak."*/

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