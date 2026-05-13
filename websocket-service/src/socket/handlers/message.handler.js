const SOCKET_EVENTS = require("../events/socket.events");
const Message = require("../../model/message.model");
const {
  registerUser,
  joinRoom,
  removeUser,
  getUsersInRoom,
  leaveRoom,
  leaveAllRooms,
  getUser 
} = require("../../services/userRegistry");

const logger = require("../../utils/logger");
const { messageSchema } = require("../../validators/message.validator");

function registerMessageHandlers(io, socket) {
  
  // 1. Register User
  socket.on(SOCKET_EVENTS.REGISTER_USER, (username) => {
    registerUser(socket.id, username);
    logger.info(`User registered: ${username}`);
  });

  // 2. Join Room (UPDATED WITH HISTORY LOADING)
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (roomId) => {
    try {
      // Validation
      if (!roomId || typeof roomId !== "string") {
        logger.warn(`Invalid room join attempt`);
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }

      // Check if user exists in registry
      const user = getUser(socket.id);
      if (!user) {
        logger.warn(`Unregistered socket ${socket.id} tried to join ${roomId}`);
        return;
      }

      // Physical Join
      socket.join(roomId);
      joinRoom(socket.id, roomId);

      // --- FETCH HISTORY ---
      // We find messages for this room, sort by newest (-1), and limit to 50
      const history = await Message.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(50);

      // We reverse them so they appear in chronological order (Oldest -> Newest)
      socket.emit("chat_history", history.reverse());

      // Notify others in the room
      const users = getUsersInRoom(roomId);
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_USERS, users);

      logger.info(`${user.username} joined ${roomId} and loaded history`);
    } catch (err) {
      logger.error(`Join room error: ${err.message}`);
      socket.emit("error", { message: "Failed to load chat history" });
    }
  });

  // 3. Send Message
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
    try {
      const { error } = messageSchema.validate(data);
      if (error) {
        logger.warn(`Invalid message from ${socket.id}`);
        socket.emit("error", { message: error.details[0].message });
        return;
      }

      const { roomId, message } = data;
      const user = getUser(socket.id);
      const displayName = user ? user.username : `User-${socket.id.substring(0, 5)}`;

      // Save to MongoDB
      const newMessage = new Message({
        roomId,
        socketId: socket.user._id,
        username: displayName, // Added username to the saved model
        message
      });
      await newMessage.save();

      io.to(roomId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        username: displayName, 
        message: message,
        socketId: socket.id,
        timestamp: newMessage.createdAt
      });

      logger.info(`Message from ${displayName} saved and broadcasted`);
    } catch (err) {
      logger.error(`Message error: ${err.message}`);
      socket.emit("error", { message: "Server error" });
    }
  });

  // 4. Leave Room
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomId) => {
    leaveRoom(socket.id, roomId);
    socket.leave(roomId);
    const users = getUsersInRoom(roomId);
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_USERS, users);
    io.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, socket.id);
  });

  // 5. Disconnect
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
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