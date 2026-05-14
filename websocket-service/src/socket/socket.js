const { Server } = require("socket.io");
const SOCKET_EVENTS = require("./events/socket.events"); // Fixed Path
const registerMessageHandlers = require("./handlers/message.handler"); // Fixed Path
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");


const { createAdapter } =
  require("@socket.io/redis-adapter");

const {
  pubClient,
  subClient
} = require("../config/redis");

const User =
  require("../model/user.model");
let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  logger.info("Socket.io initialized");

  io.use(async (socket, next) => {

  try {

    // Get token
    const token =
      socket.handshake.auth.token;

    if (!token) {

      return next(
        new Error("Authentication error")
      );
console.log("DEBUG: Using JWT_SECRET:", process.env.JWT_SECRET);
const decoded = jwt.verify(token, process.env.JWT_SECRET);
    }

    // Verify token
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    // Find user
    const user =
      await User.findById(
        decoded.userId
      );

    if (!user) {

      return next(
        new Error("User not found")
      );

    }

    // Attach user to socket
    socket.user = user;

    logger.info(
      `Authenticated socket: ${user.email}`
    );

    next();

  }
  catch (err) {

    logger.error(
      `Socket auth error: ${err.message}`
    );

    console.log(err);

next(
  new Error(err.message)
);

  }

});
io.adapter(
  createAdapter(
    pubClient,
    subClient
  )
);
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info(
  `User connected:
   ${socket.user.email}`
);

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