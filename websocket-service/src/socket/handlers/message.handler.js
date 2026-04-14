const SOCKET_EVENTS =
  require("../events/socket.events");

const {
  registerUser,
  joinRoom,
  removeUser,
  getUsersInRoom,
  leaveRoom,
  leaveAllRooms
} = require("../../services/userRegistry");

const logger =
  require("../../utils/logger");

const {
  messageSchema
} = require("../../validators/message.validator");

function registerMessageHandlers(io, socket) {

  // Register User
  socket.on(SOCKET_EVENTS.REGISTER_USER, (username) => {
    registerUser(socket.id, username);
    logger.info(`User registered: ${username}`);
  });

  // Join Room
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId) => {
    if (!roomId || typeof roomId !== "string") {
      logger.warn(`Invalid room join attempt`);
      socket.emit("error", { message: "Invalid room ID" });
      return;
    }

    socket.join(roomId);
    joinRoom(socket.id, roomId);

    const users = getUsersInRoom(roomId);
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_USERS, users);

    logger.info(`Socket ${socket.id} joined ${roomId}`);
  });

  // Send Message
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) => {
    try {
      const { error } = messageSchema.validate(data);

      if (error) {
        logger.warn(`Invalid message from ${socket.id}`);
        socket.emit("error", { message: error.details[0].message });
        return;
      }

      const { roomId, message } = data;

      io.to(roomId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        socketId: socket.id,
        message
      });

      logger.info(`Message sent to ${roomId}`);
    } catch (err) {
      logger.error(`Send message error: ${err.message}`);
      socket.emit("error", { message: "Server error" });
    }
  });

  // Leave Room
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomId) => {
    leaveRoom(socket.id, roomId);
    socket.leave(roomId);

    const users = getUsersInRoom(roomId);
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_USERS, users);
    io.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, socket.id);
  });

  // Disconnect
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    logger.info(`Socket disconnecting: ${socket.id}`);
    const rooms = leaveAllRooms(socket.id);

    rooms.forEach(roomId => {
      const users = getUsersInRoom(roomId);
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_USERS, users);
    });

    removeUser(socket.id);
    logger.info(`Socket disconnected ${socket.id}`);
  });
}

module.exports = registerMessageHandlers;

  /*Conceptual: Why not use console.log in production?
In a local environment, console.log is fine. In a production system (like Slack or Discord), it is dangerous for three reasons:

Synchronous Performance (Blocking): On many systems, console.log is "blocking." This means the server pauses for a microsecond to finish writing to the screen before moving to the next task. With 10,000 users, these pauses add up and make the chat feel laggy.

No Persistence: Once the terminal buffer fills up or the server restarts, your history is gone. You can't prove what happened 5 hours ago.

Lack of Structure: You can’t "filter" console logs. You get a messy wall of text instead of searchable data*/