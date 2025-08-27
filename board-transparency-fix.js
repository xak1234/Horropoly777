// Board Transparency Consistency Fix
// Ensures the game board background canvas has the same transparency regardless of game mode

class BoardTransparencyManager {
  constructor() {
    this.defaultTransparency = 0.9; // 90% opacity - consistent across all game modes
    this.initialized = false;
    this.init();
  }

  init() {
    console.log('🎨 Initializing board transparency manager...');
    
    // Set the default transparency immediately
    this.setConsistentTransparency();
    
    // Override the global setBoardTransparency function to ensure consistency
    this.overrideBoardTransparencyFunction();
    
    // Monitor for game mode changes and canvas updates
    this.setupGameModeMonitoring();
    
    this.initialized = true;
    console.log('✅ Board transparency manager initialized');
  }

  setConsistentTransparency() {
    // Ensure the global boardTransparency variable is set consistently
    if (typeof window.boardTransparency !== 'undefined') {
      window.boardTransparency = this.defaultTransparency;
      console.log(`🎨 Board transparency set to consistent value: ${this.defaultTransparency} (${Math.round(this.defaultTransparency * 100)}% opacity)`);
    }

    // Also set it directly if the variable exists in the global scope
    if (typeof boardTransparency !== 'undefined') {
      boardTransparency = this.defaultTransparency;
    }
  }

  overrideBoardTransparencyFunction() {
    // Store the original function if it exists
    const originalSetBoardTransparency = window.setBoardTransparency;
    
    // Override with our consistent version
    window.setBoardTransparency = (opacity) => {
      // Always use our default transparency regardless of what's requested
      const consistentOpacity = this.defaultTransparency;
      
      console.log(`🎨 setBoardTransparency called with ${opacity}, enforcing consistent value: ${consistentOpacity}`);
      
      // Update the global variable
      if (typeof window.boardTransparency !== 'undefined') {
        window.boardTransparency = consistentOpacity;
      }
      if (typeof boardTransparency !== 'undefined') {
        boardTransparency = consistentOpacity;
      }
      
      // Force redraw if the updateGameFrame function exists
      if (typeof window.updateGameFrame === 'function') {
        window.updateGameFrame();
      }
      
      // Show advisory with the consistent value
      if (typeof window.showAdvisory === 'function') {
        window.showAdvisory(`Board transparency: ${Math.round(consistentOpacity * 100)}% (consistent)`, 'info');
      }
    };
    
    console.log('🎨 setBoardTransparency function overridden for consistency');
  }

  setupGameModeMonitoring() {
    // Monitor for game initialization to ensure transparency is set correctly
    const checkAndSetTransparency = () => {
      this.setConsistentTransparency();
      
      // Force a redraw if possible
      if (typeof window.updateGameFrame === 'function') {
        setTimeout(() => {
          window.updateGameFrame();
        }, 100);
      }
    };

    // Monitor for AI game starts
    if (typeof window.startAIGame === 'function') {
      const originalStartAIGame = window.startAIGame;
      window.startAIGame = async (...args) => {
        console.log('🎨 AI game starting - ensuring consistent board transparency');
        checkAndSetTransparency();
        
        const result = await originalStartAIGame.apply(this, args);
        
        // Set transparency again after game initialization
        setTimeout(() => {
          checkAndSetTransparency();
        }, 500);
        
        return result;
      };
    }

    // Monitor for multiplayer game initialization
    const originalIsMultiplayerGame = window.isMultiplayerGame;
    let lastMultiplayerState = false;
    
    // Check for multiplayer state changes
    setInterval(() => {
      const currentMultiplayerState = window.isMultiplayerGame || false;
      if (currentMultiplayerState !== lastMultiplayerState) {
        console.log(`🎨 Game mode changed to ${currentMultiplayerState ? 'multiplayer' : 'single-player'} - ensuring consistent board transparency`);
        checkAndSetTransparency();
        lastMultiplayerState = currentMultiplayerState;
      }
    }, 1000);

    // Monitor for canvas updates
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CANVAS') {
            console.log('🎨 Canvas added to DOM - ensuring consistent board transparency');
            setTimeout(() => {
              checkAndSetTransparency();
            }, 100);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Method to manually enforce consistency (can be called externally)
  enforceConsistency() {
    console.log('🎨 Manually enforcing board transparency consistency');
    this.setConsistentTransparency();
    
    if (typeof window.updateGameFrame === 'function') {
      window.updateGameFrame();
    }
  }

  // Method to change the default transparency (if needed)
  setDefaultTransparency(opacity) {
    if (opacity < 0 || opacity > 1) {
      console.error('🎨 Invalid opacity value. Must be between 0 and 1');
      return;
    }
    
    console.log(`🎨 Changing default board transparency from ${this.defaultTransparency} to ${opacity}`);
    this.defaultTransparency = opacity;
    this.setConsistentTransparency();
    
    if (typeof window.updateGameFrame === 'function') {
      window.updateGameFrame();
    }
  }

  // Debug method to check current state
  debugTransparencyState() {
    console.log('🎨 === BOARD TRANSPARENCY DEBUG ===');
    console.log('Default transparency:', this.defaultTransparency);
    console.log('window.boardTransparency:', window.boardTransparency);
    console.log('global boardTransparency:', typeof boardTransparency !== 'undefined' ? boardTransparency : 'undefined');
    console.log('isMultiplayerGame:', window.isMultiplayerGame);
    console.log('Game mode:', window.gameMode);
    console.log('Canvas elements:', document.querySelectorAll('canvas').length);
    console.log('=================================');
  }
}

// Create global instance
const boardTransparencyManager = new BoardTransparencyManager();

// Make it globally accessible
window.boardTransparencyManager = boardTransparencyManager;

// Add debug function to window
window.debugBoardTransparency = () => boardTransparencyManager.debugTransparencyState();

// Add manual enforcement function
window.fixBoardTransparency = () => boardTransparencyManager.enforceConsistency();

export default boardTransparencyManager;
