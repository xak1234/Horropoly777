// Tablet Connection Diagnostic Script
// Run this in the browser console on your tablet to diagnose connection issues

console.log('🔧 Starting Tablet Connection Diagnostics...');

// Test 1: Device Detection
function testDeviceDetection() {
    console.log('\n=== DEVICE DETECTION TEST ===');
    
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const maxDimension = Math.max(screenWidth, screenHeight);
    const minDimension = Math.min(screenWidth, screenHeight);
    
    const isIPad = /iPad|iPad Pro/i.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidTablet = /android/i.test(userAgent) && !/mobile/i.test(userAgent);
    const isSurfaceTablet = /Windows NT.*Touch/i.test(userAgent) && !/Phone/i.test(userAgent);
    const isTabletBySize = (minDimension >= 768 && maxDimension >= 1024) || 
                          (screenWidth > 768 && screenWidth <= 1366 && 'ontouchstart' in window);
    
    const isTablet = isIPad || isAndroidTablet || isSurfaceTablet || isTabletBySize;
    const isMobile = !isTablet && (/android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || screenWidth <= 768);
    
    console.log('User Agent:', userAgent);
    console.log('Screen:', screenWidth + 'x' + screenHeight);
    console.log('Pixel Ratio:', pixelRatio);
    console.log('Platform:', navigator.platform);
    console.log('Max Touch Points:', navigator.maxTouchPoints || 0);
    console.log('Is iPad:', isIPad);
    console.log('Is Android Tablet:', isAndroidTablet);
    console.log('Is Surface Tablet:', isSurfaceTablet);
    console.log('Is Tablet by Size:', isTabletBySize);
    console.log('Final Detection - Is Tablet:', isTablet);
    console.log('Final Detection - Is Mobile:', isMobile);
    
    return { isTablet, isMobile, screenWidth, screenHeight };
}

// Test 2: Touch System
function testTouchSystem() {
    console.log('\n=== TOUCH SYSTEM TEST ===');
    
    const hasTouchSupport = 'ontouchstart' in window;
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const msMaxTouchPoints = navigator.msMaxTouchPoints || 0;
    
    console.log('Has Touch Support:', hasTouchSupport);
    console.log('Max Touch Points:', maxTouchPoints);
    console.log('MS Max Touch Points:', msMaxTouchPoints);
    
    // Check if tablet touch manager exists
    if (window.tabletTouchManager) {
        console.log('✅ Tablet Touch Manager Found');
        console.log('  - Is Active:', window.tabletTouchManager.isActive());
        console.log('  - Last Touch Time:', window.tabletTouchManager.getLastTouchTime());
        
        const info = window.tabletTouchManager.getInfo();
        if (info) {
            console.log('  - Manager Info:', info);
        }
    } else {
        console.log('❌ Tablet Touch Manager NOT Found');
    }
    
    return { hasTouchSupport, maxTouchPoints, hasManager: !!window.tabletTouchManager };
}

// Test 3: Firebase Connection
async function testFirebaseConnection() {
    console.log('\n=== FIREBASE CONNECTION TEST ===');
    
    // Check if Firebase is initialized
    if (!window.db) {
        console.log('❌ Firebase database not found in window.db');
        return false;
    }
    
    console.log('✅ Firebase database found');
    
    try {
        // Try to access a test document
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
        const testDoc = doc(window.db, 'test', 'connection');
        const result = await getDoc(testDoc);
        console.log('✅ Firebase connection test successful');
        return true;
    } catch (error) {
        console.log('❌ Firebase connection test failed:', error.message);
        return false;
    }
}

// Test 4: Room Connection
async function testRoomConnection(roomId = 'KITTENS_REST2', playerName = 'Wednesday') {
    console.log('\n=== ROOM CONNECTION TEST ===');
    console.log('Testing Room:', roomId, 'Player:', playerName);
    
    if (!window.db) {
        console.log('❌ Firebase not available');
        return false;
    }
    
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
        const gameRoomRef = doc(window.db, 'gameRooms', roomId);
        const roomDoc = await getDoc(gameRoomRef);
        
        if (!roomDoc.exists()) {
            console.log('❌ Room not found:', roomId);
            return false;
        }
        
        const gameState = roomDoc.data();
        console.log('✅ Room found');
        console.log('  - Game Started:', gameState.gameStarted || false);
        console.log('  - Max Players:', gameState.maxPlayers || 2);
        console.log('  - Current Players Count:', gameState.players ? gameState.players.length : 0);
        
        // Check player status
        let players = gameState.players || [];
        if (!Array.isArray(players)) {
            players = Object.values(players);
        }
        
        const validPlayers = players.filter(p => p && p.userId);
        const existingPlayer = validPlayers.find(p => p.name === playerName);
        
        if (existingPlayer) {
            console.log('✅ Player found in room:', existingPlayer.name);
            console.log('  - Player ID:', existingPlayer.userId);
            console.log('  - Should be able to reconnect');
            return true;
        } else {
            console.log('⚠️ Player not found in room');
            if (gameState.gameStarted) {
                console.log('❌ Cannot join - game started and player not in room');
            } else {
                console.log('✅ Could join as new player if room not full');
            }
            return false;
        }
        
    } catch (error) {
        console.log('❌ Room connection test failed:', error.message);
        return false;
    }
}

// Test 5: Network Latency
async function testNetworkLatency() {
    console.log('\n=== NETWORK LATENCY TEST ===');
    
    const startTime = performance.now();
    
    try {
        const response = await fetch(window.location.origin + '/favicon.ico?t=' + Date.now());
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        console.log('Network Latency:', latency + 'ms');
        
        if (latency < 100) {
            console.log('✅ Excellent connection');
        } else if (latency < 300) {
            console.log('⚠️ Moderate connection');
        } else {
            console.log('❌ Slow connection - may cause issues');
        }
        
        return latency;
    } catch (error) {
        console.log('❌ Network test failed:', error.message);
        return -1;
    }
}

// Run all tests
async function runAllTests(roomId = 'KITTENS_REST2', playerName = 'Wednesday') {
    console.log('🔧 Running Complete Tablet Connection Diagnostics...');
    console.log('Room ID:', roomId);
    console.log('Player Name:', playerName);
    
    const results = {};
    
    // Run tests
    results.device = testDeviceDetection();
    results.touch = testTouchSystem();
    results.firebase = await testFirebaseConnection();
    results.room = await testRoomConnection(roomId, playerName);
    results.network = await testNetworkLatency();
    
    // Summary
    console.log('\n=== DIAGNOSTIC SUMMARY ===');
    console.log('Device Type:', results.device.isTablet ? 'Tablet' : results.device.isMobile ? 'Mobile' : 'Desktop');
    console.log('Touch Support:', results.touch.hasTouchSupport ? '✅' : '❌');
    console.log('Touch Manager:', results.touch.hasManager ? '✅' : '❌');
    console.log('Firebase Connection:', results.firebase ? '✅' : '❌');
    console.log('Room Access:', results.room ? '✅' : '❌');
    console.log('Network Latency:', results.network > 0 ? results.network + 'ms' : '❌');
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    
    if (!results.device.isTablet) {
        console.log('⚠️ Device not detected as tablet - may use different touch handling');
    }
    
    if (!results.touch.hasTouchSupport) {
        console.log('❌ No touch support detected - this will cause major issues');
    }
    
    if (!results.touch.hasManager) {
        console.log('⚠️ Tablet touch manager not loaded - may affect touch sensitivity');
    }
    
    if (!results.firebase) {
        console.log('❌ Firebase connection failed - check internet and Firebase config');
    }
    
    if (!results.room) {
        console.log('⚠️ Room connection issue - player may need to rejoin or room may be invalid');
    }
    
    if (results.network > 500) {
        console.log('⚠️ High network latency - may cause sync delays');
    }
    
    return results;
}

// Make functions globally available
window.tabletDiagnostics = {
    runAll: runAllTests,
    testDevice: testDeviceDetection,
    testTouch: testTouchSystem,
    testFirebase: testFirebaseConnection,
    testRoom: testRoomConnection,
    testNetwork: testNetworkLatency
};

// Auto-run with default values
console.log('\n🚀 To run diagnostics, use:');
console.log('tabletDiagnostics.runAll("KITTENS_REST2", "Wednesday")');
console.log('\nOr run individual tests:');
console.log('tabletDiagnostics.testDevice()');
console.log('tabletDiagnostics.testTouch()');
console.log('tabletDiagnostics.testFirebase()');
console.log('tabletDiagnostics.testRoom("KITTENS_REST2", "Wednesday")');
console.log('tabletDiagnostics.testNetwork()');

console.log('\n✅ Tablet diagnostics loaded. Ready to test!');
