const SOCKET_EVENTS =
  require("../events/socket.events");

const {
  registerUser,
  joinRoom,
  removeUser,
  getUsersInRoom
} = require("../../services/userRegistry");


function registerMessageHandlers(io, socket) {

  // Register user
  socket.on("register_user", (username) => {

    registerUser(socket.id, username);

    console.log(
      `User registered: ${username}`
    );

  });



  // Join Room
  socket.on(
    SOCKET_EVENTS.JOIN_ROOM,
    (roomId) => {

      joinRoom(socket.id, roomId);

      socket.join(roomId);

      const users =
        getUsersInRoom(roomId);

      // Notify users in room
      io.to(roomId).emit(
        "room_users",
        users
      );

      console.log(
        `Socket ${socket.id} joined ${roomId}`
      );

    }
  );



  // Send Message
  socket.on(
    SOCKET_EVENTS.SEND_MESSAGE,
    (data) => {

      const { roomId, message, sender }
        = data;

      io.to(roomId).emit(
        SOCKET_EVENTS.RECEIVE_MESSAGE,
        {
          sender,
          message,
          timestamp: new Date()
        }
      );

    }
  );



  // Disconnect
  socket.on("disconnect", () => {

    removeUser(socket.id);

    console.log(
      `Socket disconnected ${socket.id}`
    );

  });

}

module.exports =
  registerMessageHandlers;