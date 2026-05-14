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

const { generateAIResponse } = require("../../services/ai.service");

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

  // 3. Send Message - FINAL CORRECTED VERSION
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
    try {
      // A. VALIDATION
      const { error } = messageSchema.validate(data);
      if (error) {
        logger.warn(`Validation failed for ${socket.id}`);
        return socket.emit("error", { message: error.details[0].message });
      }

      const { roomId, message } = data;

      // B. IDENTITY FIX: Get user from the JWT-authenticated socket object
      // If your middleware works, socket.user contains the real DB data
      const userId = socket.user._id; 
      const username = socket.user.username; // This ensures it uses the real name, not a fallback

      // C. SAVE USER MESSAGE
      const newMessage = new Message({
        roomId,
        userId,       
        username,     
        message
      });
      await newMessage.save();

      // D. BROADCAST USER MESSAGE
      io.to(roomId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        username, 
        message,
        userId,       
        timestamp: newMessage.createdAt
      });

      // E. BOT PIPELINE (The "Silent Bot" Fix)
      if (message.trim().startsWith("@bot")) {
        const cleanMessage = message.replace("@bot", "").trim();

        // 1. Notify UI that bot is thinking
        io.to(roomId).emit("bot_typing", { username: "SynapseBot" });

        try {
          // 2. Call AI Service
          const aiResponse = await generateAIResponse(cleanMessage);

          // 3. SAVE BOT MESSAGE TO DB (So history works!)
          const botMessage = new Message({
            roomId,
            userId: "000000000000000000000000", // Static valid MongoID for Bot
            username: "SynapseBot",
            message: aiResponse
          });
          await botMessage.save();

          // 4. BROADCAST BOT MESSAGE
          io.to(roomId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
            username: "SynapseBot",
            message: aiResponse,
            userId: "AI_BOT_ID",
            isBot: true,
            timestamp: botMessage.createdAt
          });

        } catch (aiErr) {
          logger.error(`AI Failure: ${aiErr.message}`);
          // Send a specific error to the user if the AI fails
          socket.emit("error", { message: "SynapseBot is offline. Check API keys/credits." });
        } finally {
          io.to(roomId).emit("bot_stop_typing");
        }
      }

    } catch (err) {
      logger.error(`System Error: ${err.message}`);
      socket.emit("error", { message: "Message could not be sent." });
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