// FORCE clearLobbyRooms - This script ensures clearLobbyRooms is always available
// This runs before any other scripts to prevent import errors

(function() {
  'use strict';
  
  // Force create clearLobbyRooms function globally
  window.clearLobbyRooms = window.clearLobbyRooms || async function() {
    console.log('FORCED clearLobbyRooms called - skipping room clearing');
    return Promise.resolve();
  };
  
  // Override any existing clearLobbyRooms to ensure it's always available
  Object.defineProperty(window, 'clearLobbyRooms', {
    value: async function() {
      console.log('FORCED clearLobbyRooms called - skipping room clearing');
      return Promise.resolve();
    },
    writable: false,
    configurable: false
  });
  
  console.log('FORCED clearLobbyRooms function created globally');
})(); 