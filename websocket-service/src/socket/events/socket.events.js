const SOCKET_EVENTS = {
  CONNECTION: "connection",

  JOIN_ROOM: "join_room",

  SEND_MESSAGE: "send_message",

  RECEIVE_MESSAGE: "receive_message",

  DISCONNECT: "disconnect",
};

module.exports = SOCKET_EVENTS;
/**
 * 📢 SOCKET EVENT CONSTANTS
 * * WHY THIS FILE? 
 * This is the "Single Source of Truth" for our communication language. 
 * Instead of using "magic strings" (hardcoded text) throughout the app, we use 
 * these constants to ensure the Frontend and Backend are always in sync.
 * * SIGNIFICANCE:
 * 1. Prevents Typos: Catch errors at development time, not runtime.
 * 2. Easy Refactoring: Rename an event once here, and it updates everywhere.
 * 3. Contract: Acts as a dictionary of all possible actions in our chat system.
 */