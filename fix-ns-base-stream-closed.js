// fix-ns-base-stream-closed.js
// Immediate fix for NS_BASE_STREAM_CLOSED Firebase connection errors

console.log('🔧 Applying NS_BASE_STREAM_CLOSED fix...');

// Enhanced connection monitoring
let connectionAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 2000;

// Global connection state
let isPageVisible = true;
let isOnline = true;
let connectionHealthCheck = null;

// Setup connection monitoring
function setupConnectionMonitoring() {
    console.log('📡 Setting up enhanced connection monitoring...');
    
    // Page visibility monitoring
    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
        console.log(`📱 Page visibility changed: ${isPageVisible ? 'visible' : 'hidden'}`);
        
        if (isPageVisible && isOnline) {
            // Check if we need to reconnect when page becomes visible
            if (window.gameRoomRef && !window.unsubscribeGameState) {
                console.log('🔄 Page became visible, checking connection...');
                setTimeout(() => {
                    if (window.gameRoomRef) {
                        console.log('🔄 Reconnecting after page visibility change...');
                        connectionAttempts = 0; // Reset attempts for visibility change
                        window.setupListener && window.setupListener();
                    }
                }, 1000);
            }
        }
    });

    // Network connectivity monitoring
    window.addEventListener('online', () => {
        isOnline = true;
        console.log('🌐 Network connection restored');
        
        // Attempt reconnection when network comes back
        if (window.gameRoomRef && !window.unsubscribeGameState) {
            console.log('🔄 Network restored, attempting reconnection...');
            connectionAttempts = 0; // Reset attempts for network restoration
            setTimeout(() => {
                window.setupListener && window.setupListener();
            }, 2000);
        }
    });

    window.addEventListener('offline', () => {
        isOnline = false;
        console.log('🌐 Network connection lost');
    });

    // Page unload cleanup
    window.addEventListener('beforeunload', () => {
        console.log('🧹 Cleaning up connections before page unload...');
        if (window.unsubscribeGameState) {
            try {
                window.unsubscribeGameState();
            } catch (error) {
                console.warn('⚠️ Error during cleanup:', error);
            }
        }
        if (connectionHealthCheck) {
            clearInterval(connectionHealthCheck);
        }
    });
}

// Enhanced connection health check
function startConnectionHealthCheck() {
    if (connectionHealthCheck) {
        clearInterval(connectionHealthCheck);
    }
    
    connectionHealthCheck = setInterval(() => {
        if (window.gameRoomRef && !window.unsubscribeGameState) {
            // Check if we're still connected by attempting a simple read
            if (window.getDoc && window.gameRoomRef) {
                window.getDoc(window.gameRoomRef).then(() => {
                    console.log('✅ Connection health check passed');
                }).catch((error) => {
                    console.warn('⚠️ Connection health check failed:', error);
                    if (error.message?.includes('NS_BASE_STREAM_CLOSED') || 
                        error.code === 'unavailable') {
                        console.log('🔄 Connection appears to be lost, attempting recovery...');
                        connectionAttempts = 0; // Reset for health check recovery
                        window.setupListener && window.setupListener();
                    }
                });
            }
        }
    }, 30000); // Check every 30 seconds
}

// Enhanced error handling for NS_BASE_STREAM_CLOSED
function enhanceErrorHandling() {
    console.log('🛠️ Enhancing error handling for NS_BASE_STREAM_CLOSED...');
    
    // Override the existing error handling if it exists
    if (window.subscribeToGameState) {
        const originalSubscribe = window.subscribeToGameState;
        
        window.subscribeToGameState = function(onGameStateUpdate) {
            console.log('🔄 Enhanced subscribeToGameState called');
            
            if (!window.gameRoomRef) {
                throw new Error('Not connected to a game room');
            }

            // Unsubscribe from previous listener if exists
            if (window.unsubscribeGameState) {
                window.unsubscribeGameState();
            }

            const setupListener = () => {
                console.log(`🔄 Setting up enhanced Firestore listener (attempt ${connectionAttempts + 1}/${maxReconnectAttempts})`);
                
                try {
                    if (window.onSnapshot && window.gameRoomRef) {
                        window.unsubscribeGameState = window.onSnapshot(window.gameRoomRef, 
                            (doc) => {
                                // Reset connection attempts on successful data
                                connectionAttempts = 0;
                                
                                const gameState = doc.data();
                                onGameStateUpdate(gameState);
                            },
                            (error) => {
                                console.error('❌ Enhanced Firestore listener error:', error);
                                console.error('Error details:', {
                                    code: error.code,
                                    message: error.message,
                                    name: error.name,
                                    stack: error.stack
                                });
                                
                                // Enhanced connection error detection
                                const isConnectionError = 
                                    error.code === 'unavailable' || 
                                    error.message?.includes('NS_BASE_STREAM_CLOSED') ||
                                    error.message?.includes('stream closed') ||
                                    error.message?.includes('connection lost') ||
                                    error.message?.includes('WebChannel') ||
                                    error.message?.includes('transport errored') ||
                                    error.message?.includes('404') ||
                                    error.code === 'failed-precondition' ||
                                    error.message?.includes('channel closed') ||
                                    error.message?.includes('connection reset') ||
                                    error.message?.includes('network error');
                                
                                if (isConnectionError) {
                                    console.warn('🔄 Firestore connection lost, attempting to reconnect...');
                                    console.log('🔍 Connection error type:', {
                                        code: error.code,
                                        message: error.message,
                                        isNS_BASE_STREAM_CLOSED: error.message?.includes('NS_BASE_STREAM_CLOSED'),
                                        isUnavailable: error.code === 'unavailable'
                                    });
                                    
                                    if (connectionAttempts < maxReconnectAttempts) {
                                        connectionAttempts++;
                                        console.log(`🔄 Reconnection attempt ${connectionAttempts}/${maxReconnectAttempts}`);
                                        
                                        // Clean up current listener
                                        if (window.unsubscribeGameState) {
                                            try {
                                                window.unsubscribeGameState();
                                            } catch (cleanupError) {
                                                console.warn('⚠️ Error cleaning up listener:', cleanupError);
                                            }
                                            window.unsubscribeGameState = null;
                                        }
                                        
                                        // Enhanced progressive delay with exponential backoff
                                        const delay = Math.min(reconnectDelay * Math.pow(1.5, connectionAttempts - 1), 10000);
                                        console.log(`⏰ Waiting ${delay}ms before reconnection attempt...`);
                                        
                                        // Wait before reconnecting with enhanced delay
                                        setTimeout(() => {
                                            try {
                                                console.log('🔄 Attempting to re-establish connection...');
                                                
                                                // Start connection health check after reconnection
                                                startConnectionHealthCheck();
                                                
                                                setupListener();
                                            } catch (reconnectError) {
                                                console.error('❌ Reconnection failed:', reconnectError);
                                                
                                                // If this is the last attempt, show error
                                                if (connectionAttempts >= maxReconnectAttempts) {
                                                    console.error('❌ Max reconnection attempts reached');
                                                    if (window.showAdvisory) {
                                                        window.showAdvisory('Connection lost. Please refresh the page to reconnect.', 'error');
                                                    }
                                                }
                                            }
                                        }, delay);
                                    } else {
                                        console.error('❌ Max reconnection attempts reached');
                                        if (window.showAdvisory) {
                                            window.showAdvisory('Connection lost after multiple attempts. Please refresh the page.', 'error');
                                        }
                                        
                                        // Reset connection attempts after a longer delay for potential manual retry
                                        setTimeout(() => {
                                            connectionAttempts = 0;
                                            console.log('🔄 Connection attempts reset - manual retry possible');
                                        }, 30000); // 30 seconds
                                    }
                                } else {
                                    // For other errors, show advisory but don't attempt reconnection
                                    console.error('❌ Non-connection Firestore error:', error);
                                    if (window.showAdvisory) {
                                        window.showAdvisory(`Firestore error: ${error.message}`, 'error');
                                    }
                                }
                            }
                        );
                        
                        console.log('✅ Enhanced Firestore listener setup successful');
                        
                        // Start connection health check after successful setup
                        startConnectionHealthCheck();
                        
                    } else {
                        console.error('❌ Required Firebase functions not available');
                    }
                } catch (setupError) {
                    console.error('❌ Failed to setup enhanced Firestore listener:', setupError);
                    
                    if (connectionAttempts < maxReconnectAttempts) {
                        connectionAttempts++;
                        console.log(`🔄 Retrying listener setup (attempt ${connectionAttempts}/${maxReconnectAttempts})`);
                        
                        setTimeout(() => {
                            setupListener();
                        }, reconnectDelay);
                    } else {
                        console.error('❌ Max listener setup attempts reached');
                        if (window.showAdvisory) {
                            window.showAdvisory('Failed to connect to game state. Please refresh the page.', 'error');
                        }
                    }
                }
            };

            // Store the setup function globally for access
            window.setupListener = setupListener;
            
            // Start the listener
            setupListener();

            return window.unsubscribeGameState;
        };
        
        console.log('✅ Enhanced error handling applied');
    } else {
        console.log('⚠️ subscribeToGameState not found, applying basic monitoring only');
    }
}

// Apply the fixes
function applyNSBaseStreamClosedFix() {
    console.log('🔧 Applying NS_BASE_STREAM_CLOSED fix...');
    
    // Setup connection monitoring
    setupConnectionMonitoring();
    
    // Enhance error handling
    enhanceErrorHandling();
    
    // Start connection health check
    startConnectionHealthCheck();
    
    console.log('✅ NS_BASE_STREAM_CLOSED fix applied successfully');
    console.log('📊 Monitoring active for:');
    console.log('  - Page visibility changes');
    console.log('  - Network connectivity changes');
    console.log('  - Connection health checks (every 30s)');
    console.log('  - Enhanced error recovery with exponential backoff');
}

// Auto-apply the fix when script loads
applyNSBaseStreamClosedFix();

// Export for manual application
window.applyNSBaseStreamClosedFix = applyNSBaseStreamClosedFix;
window.setupConnectionMonitoring = setupConnectionMonitoring;
window.startConnectionHealthCheck = startConnectionHealthCheck;

console.log('🚀 NS_BASE_STREAM_CLOSED fix script loaded and applied'); 