const SOCKET_EVENTS = require("../events/socket.events");

function registerMessageHandlers(io, socket) {
  // Join Room
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId) => {
    socket.join(roomId);

    console.log(
      `Socket ${socket.id} joined room ${roomId}`
    );
  });

  // Send Message
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) => {
    const { roomId, message, sender } = data;

    console.log(
      `Message from ${sender} in room ${roomId}: ${message}`
    );

    // Broadcast message to room
    io.to(roomId).emit(
      SOCKET_EVENTS.RECEIVE_MESSAGE,
      {
        sender,
        message,
        timestamp: new Date(),
      }
    );
  });
}

module.exports = registerMessageHandlers;