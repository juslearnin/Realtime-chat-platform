// Stores socketId → user data
const socketToUserMap = new Map();

// Stores roomId → users
const roomToUsersMap = new Map();


// Register user
function registerUser(socketId, username) {

  socketToUserMap.set(socketId, {
    username,
    rooms: new Set() //no duplicates
  });

}


// Join room
function joinRoom(socketId, roomId) {

  const user = socketToUserMap.get(socketId);

  if (!user) return;

  // Add room to user's rooms
  user.rooms.add(roomId);

  // Add user to room
  if (!roomToUsersMap.has(roomId)) {
    roomToUsersMap.set(roomId, new Set());
  }

  roomToUsersMap
    .get(roomId)
    .add(user.username);

}


// Leave room
function leaveRoom(socketId, roomId) {

  const user = socketToUserMap.get(socketId);

  if (!user) return;

  user.rooms.delete(roomId);

  const roomUsers = roomToUsersMap.get(roomId);

  if (roomUsers) {

    roomUsers.delete(user.username);

    if (roomUsers.size === 0) {
      roomToUsersMap.delete(roomId);
    }

  }

}


// Remove user completely
function removeUser(socketId) {

  const user = socketToUserMap.get(socketId);

  if (!user) return;

  // Remove user from all rooms
  user.rooms.forEach(roomId => {
    leaveRoom(socketId, roomId);
  });

  socketToUserMap.delete(socketId);

}


// Get users in room
function getUsersInRoom(roomId) {

  return roomToUsersMap.has(roomId)
    ? Array.from(roomToUsersMap.get(roomId))
    : [];

}


// Get user by socket
function getUser(socketId) {

  return socketToUserMap.get(socketId);

}


module.exports = {
  registerUser,
  joinRoom,
  leaveRoom,
  removeUser,
  getUsersInRoom,
  getUser
};