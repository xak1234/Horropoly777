// Global Fallback for clearLobbyRooms
// This file provides a global fallback function that can be used anywhere in the application

// Global fallback function for clearLobbyRooms
window.clearLobbyRoomsFallback = async function() {
  console.log('clearLobbyRooms fallback called - skipping room clearing');
  return Promise.resolve();
};

// Global function to ensure clearLobbyRooms is always available
window.ensureClearLobbyRooms = function() {
  if (typeof window.clearLobbyRooms === 'undefined') {
    console.log('clearLobbyRooms not found, using fallback');
    window.clearLobbyRooms = window.clearLobbyRoomsFallback;
  }
  return window.clearLobbyRooms;
};

// Auto-initialize when script loads
window.ensureClearLobbyRooms();

console.log('Global fallback for clearLobbyRooms loaded'); 