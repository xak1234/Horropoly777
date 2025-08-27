// Tablet Touch Manager - Persistent touch handling for tablet devices
// This manager ensures touch sensitivity remains accurate throughout the entire game

(function() {
    'use strict';
    
    console.log('🎯 Initializing Tablet Touch Manager...');
    
    // Touch manager state
    let touchManager = {
        isInitialized: false,
        isTablet: false,
        deviceInfo: null,
        touchHandlers: new Map(),
        activeElements: new Set(),
        recoveryInterval: null,
        lastTouchTime: 0,
        touchHealthCheck: null
    };
    
    // Enhanced device detection specifically for tablets
    function detectTabletDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;
        const maxDimension = Math.max(screenWidth, screenHeight);
        const minDimension = Math.min(screenWidth, screenHeight);
        
        // Comprehensive tablet detection
        const isIPad = /iPad|iPad Pro/i.test(userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroidTablet = /android/i.test(userAgent) && !/mobile/i.test(userAgent);
        const isSurfaceTablet = /Windows NT.*Touch/i.test(userAgent) && !/Phone/i.test(userAgent);
        const isTabletBySize = (minDimension >= 768 && maxDimension >= 1024) || 
                              (screenWidth > 768 && screenWidth <= 1366 && 'ontouchstart' in window);
        
        const isTablet = isIPad || isAndroidTablet || isSurfaceTablet || isTabletBySize;
        const isMobile = !isTablet && (/android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || screenWidth <= 768);
        const isHighDPI = pixelRatio > 1.5;
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        
        return {
            isTablet,
            isMobile,
            isHighDPI,
            isDesktop: !isMobile && !isTablet,
            hasTouchSupport,
            pixelRatio,
            screenWidth,
            screenHeight,
            maxDimension,
            minDimension,
            deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
            userAgent,
            isIPad,
            isAndroidTablet,
            isSurfaceTablet,
            orientation: screenWidth > screenHeight ? 'landscape' : 'portrait'
        };
    }
    
    // Enhanced coordinate scaling for tablets
    function getTabletCoordinates(touch, element) {
        if (!element || !touch) return { x: 0, y: 0 };
        
        const rect = element.getBoundingClientRect();
        const deviceInfo = touchManager.deviceInfo;
        
        // Get element's actual dimensions
        const elementWidth = element.width || element.offsetWidth;
        const elementHeight = element.height || element.offsetHeight;
        
        // Calculate base scaling
        let scaleX = elementWidth / rect.width;
        let scaleY = elementHeight / rect.height;
        
        const rawX = touch.clientX - rect.left;
        const rawY = touch.clientY - rect.top;
        
        let scaledX = rawX * scaleX;
        let scaledY = rawY * scaleY;
        
        // Apply tablet-specific corrections
        if (deviceInfo.isTablet) {
            // High-DPI correction
            if (deviceInfo.isHighDPI) {
                const pixelRatio = deviceInfo.pixelRatio;
                scaledX = scaledX / pixelRatio * 1.08; // Fine-tuned for accuracy
                scaledY = scaledY / pixelRatio * 1.08;
            }
            
            // Tablet accuracy correction based on device type
            let accuracy = 0.985; // Default accuracy
            
            if (deviceInfo.isIPad) {
                accuracy = 0.990; // iPads are generally more accurate
            } else if (deviceInfo.isAndroidTablet) {
                accuracy = 0.982; // Android tablets need slightly more correction
            } else if (deviceInfo.isSurfaceTablet) {
                accuracy = 0.988; // Surface tablets are quite accurate
            }
            
            scaledX *= accuracy;
            scaledY *= accuracy;
            
            // Orientation-based micro-adjustments
            if (deviceInfo.orientation === 'landscape') {
                scaledX *= 0.998; // Slight landscape correction
            }
        }
        
        return {
            x: Math.round(scaledX),
            y: Math.round(scaledY),
            rawX: rawX,
            rawY: rawY,
            scaleX: scaleX,
            scaleY: scaleY,
            corrected: true,
            deviceType: deviceInfo.deviceType
        };
    }
    
    // Create persistent touch handlers
    function createPersistentTouchHandlers() {
        const canvas = document.querySelector('canvas');
        const diceSection = document.getElementById('dice-section');
        
        // Canvas touch handlers
        if (canvas && touchManager.isTablet) {
            const canvasHandlers = {
                touchstart: function(e) {
                    touchManager.lastTouchTime = Date.now();
                    
                    if (e.touches && e.touches.length > 1) {
                        return; // Allow multi-touch gestures
                    }
                    
                    e.preventDefault();
                    const touch = e.touches[0];
                    const coords = getTabletCoordinates(touch, canvas);
                    
                    // Store touch start info
                    window.tabletTouchStart = {
                        x: coords.x,
                        y: coords.y,
                        time: Date.now(),
                        element: 'canvas'
                    };
                    
                    console.log('🎯 Tablet canvas touch start:', coords);
                },
                
                touchend: function(e) {
                    touchManager.lastTouchTime = Date.now();
                    
                    if (e.changedTouches && e.changedTouches.length > 1) {
                        return;
                    }
                    
                    e.preventDefault();
                    
                    if (window.isPanning) {
                        window.isPanning = false;
                        return;
                    }
                    
                    const touch = e.changedTouches[0];
                    if (!touch) return;
                    
                    const coords = getTabletCoordinates(touch, canvas);
                    const currentTime = Date.now();
                    
                    // Enhanced double-tap detection for tablets
                    const timeSinceLastTap = currentTime - (window.lastTabletTapTime || 0);
                    const lastPos = window.lastTabletTapPosition || { x: 0, y: 0 };
                    const distanceFromLastTap = Math.sqrt(
                        Math.pow(coords.x - lastPos.x, 2) + 
                        Math.pow(coords.y - lastPos.y, 2)
                    );
                    
                    const doubleTapThreshold = 750; // Even more forgiving for tablets (increased from 650ms)
                    const positionThreshold = 85; // Larger threshold for tablets (increased from 70px)
                    
                    if (timeSinceLastTap < doubleTapThreshold && distanceFromLastTap < positionThreshold) {
                        console.log('🎯 Tablet double-tap detected:', coords);
                        
                        // Handle property stealing
                        if (typeof handlePropertySteal === 'function') {
                            handlePropertySteal(coords.x, coords.y);
                        }
                    } else {
                        console.log('🎯 Tablet single tap:', coords);
                        
                        // Handle canvas tap (dice roll area check)
                        if (typeof handleCanvasTap === 'function') {
                            handleCanvasTap(coords.x, coords.y);
                        }
                    }
                    
                    // Update last tap info
                    window.lastTabletTapTime = currentTime;
                    window.lastTabletTapPosition = { x: coords.x, y: coords.y };
                }
            };
            
            // Store handlers for cleanup
            touchManager.touchHandlers.set('canvas', canvasHandlers);
            touchManager.activeElements.add(canvas);
            
            // Apply handlers
            canvas.addEventListener('touchstart', canvasHandlers.touchstart, { passive: false });
            canvas.addEventListener('touchend', canvasHandlers.touchend, { passive: false });
            
            console.log('🎯 Persistent canvas touch handlers applied');
        }
        
        // Dice section touch handlers
        if (diceSection && touchManager.isTablet) {
            const diceHandlers = {
                touchstart: function(e) {
                    touchManager.lastTouchTime = Date.now();
                    e.preventDefault();
                    this.classList.add('touch-feedback');
                    console.log('🎯 Tablet dice touch start');
                },
                
                touchend: function(e) {
                    touchManager.lastTouchTime = Date.now();
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const self = this;
                    setTimeout(() => {
                        self.classList.remove('touch-feedback');
                    }, 150);
                    
                    console.log('🎯 Tablet dice touch end - triggering dice roll');
                    
                    // Trigger dice roll
                    if (typeof triggerDiceRoll === 'function') {
                        console.log('🎯 Calling triggerDiceRoll() from tablet touch manager');
                        triggerDiceRoll();
                    } else {
                        console.error('🎯 triggerDiceRoll function not found!');
                    }
                }
            };
            
            // Store handlers for cleanup
            touchManager.touchHandlers.set('dice', diceHandlers);
            touchManager.activeElements.add(diceSection);
            
            // Apply handlers
            diceSection.addEventListener('touchstart', diceHandlers.touchstart, { passive: false });
            diceSection.addEventListener('touchend', diceHandlers.touchend, { passive: false });
            
            console.log('🎯 Persistent dice touch handlers applied');
        }
    }
    
    // Touch health monitoring
    function startTouchHealthMonitoring() {
        if (touchManager.touchHealthCheck) {
            clearInterval(touchManager.touchHealthCheck);
        }
        
        touchManager.touchHealthCheck = setInterval(() => {
            const timeSinceLastTouch = Date.now() - touchManager.lastTouchTime;
            
            // If no touch activity for 30 seconds, check if handlers are still active
            if (timeSinceLastTouch > 30000) {
                console.log('🎯 Touch health check: No recent activity, verifying handlers...');
                verifyTouchHandlers();
            }
            
            // Check if elements still exist and have handlers
            for (const element of touchManager.activeElements) {
                if (!document.contains(element)) {
                    console.log('🎯 Touch health check: Element removed, cleaning up...');
                    touchManager.activeElements.delete(element);
                }
            }
        }, 10000); // Check every 10 seconds
    }
    
    // Verify and restore touch handlers if needed
    function verifyTouchHandlers() {
        const canvas = document.querySelector('canvas');
        const diceSection = document.getElementById('dice-section');
        
        let needsRestore = false;
        
        // Check canvas handlers
        if (canvas && touchManager.isTablet) {
            const hasHandlers = touchManager.touchHandlers.has('canvas');
            if (!hasHandlers || !touchManager.activeElements.has(canvas)) {
                console.log('🎯 Canvas touch handlers missing, restoring...');
                needsRestore = true;
            }
        }
        
        // Check dice handlers
        if (diceSection && touchManager.isTablet) {
            const hasHandlers = touchManager.touchHandlers.has('dice');
            if (!hasHandlers || !touchManager.activeElements.has(diceSection)) {
                console.log('🎯 Dice touch handlers missing, restoring...');
                needsRestore = true;
            }
        }
        
        if (needsRestore) {
            console.log('🎯 Restoring touch handlers...');
            createPersistentTouchHandlers();
        }
    }
    
    // Auto-recovery mechanism
    function startAutoRecovery() {
        if (touchManager.recoveryInterval) {
            clearInterval(touchManager.recoveryInterval);
        }
        
        touchManager.recoveryInterval = setInterval(() => {
            // Check if touch is working by monitoring recent activity
            const timeSinceLastTouch = Date.now() - touchManager.lastTouchTime;
            
            // If tablet and no touch activity for 60 seconds, force a handler refresh
            if (touchManager.isTablet && timeSinceLastTouch > 60000) {
                console.log('🎯 Auto-recovery: Refreshing touch handlers due to inactivity...');
                refreshTouchHandlers();
            }
        }, 30000); // Check every 30 seconds
    }
    
    // Refresh all touch handlers
    function refreshTouchHandlers() {
        console.log('🎯 Refreshing all touch handlers...');
        
        // Clean up existing handlers
        for (const [key, handlers] of touchManager.touchHandlers) {
            const element = key === 'canvas' ? document.querySelector('canvas') : document.getElementById('dice-section');
            if (element && handlers) {
                if (handlers.touchstart) element.removeEventListener('touchstart', handlers.touchstart);
                if (handlers.touchend) element.removeEventListener('touchend', handlers.touchend);
            }
        }
        
        // Clear and recreate
        touchManager.touchHandlers.clear();
        touchManager.activeElements.clear();
        
        // Recreate handlers
        createPersistentTouchHandlers();
        
        console.log('🎯 Touch handlers refreshed successfully');
    }
    
    // Add tablet-specific CSS
    function addTabletCSS() {
        if (!touchManager.isTablet) return;
        
        const style = document.createElement('style');
        style.id = 'tablet-touch-styles';
        style.textContent = `
            /* Tablet-optimized touch targets */
            @media (min-width: 768px) and (max-width: 1366px) and (pointer: coarse) {
                canvas {
                    touch-action: pan-x pan-y pinch-zoom !important;
                    cursor: crosshair !important;
                }
                
                .dice-section {
                    min-height: 85px !important;
                    min-width: 85px !important;
                    border: 3px solid rgba(255, 255, 255, 0.4) !important;
                    transition: all 0.15s ease !important;
                }
                
                .dice-section:hover, .dice-section.touch-feedback {
                    transform: scale(1.05) !important;
                    box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3) !important;
                    border-color: rgba(255, 255, 255, 0.6) !important;
                }
                
                button {
                    min-height: 56px !important;
                    min-width: 56px !important;
                    font-size: 18px !important;
                    padding: 14px 18px !important;
                    margin: 8px !important;
                    border-radius: 8px !important;
                    touch-action: manipulation !important;
                }
                
                button:hover, button.touch-feedback {
                    transform: scale(1.03) !important;
                    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.25) !important;
                }
            }
            
            /* iPad specific optimizations */
            @media only screen and (min-device-width: 768px) and (max-device-width: 1024px) {
                .dice-section {
                    min-height: 90px !important;
                    min-width: 90px !important;
                }
                
                button {
                    min-height: 58px !important;
                    min-width: 58px !important;
                }
            }
        `;
        
        // Remove existing style if present
        const existingStyle = document.getElementById('tablet-touch-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
        console.log('🎯 Tablet-specific CSS applied');
    }
    
    // Initialize the touch manager
    function initializeTouchManager() {
        if (touchManager.isInitialized) {
            console.log('🎯 Touch manager already initialized');
            return;
        }
        
        touchManager.deviceInfo = detectTabletDevice();
        touchManager.isTablet = touchManager.deviceInfo.isTablet;
        
        // Store globally for compatibility
        window.deviceInfo = touchManager.deviceInfo;
        window.isTablet = touchManager.isTablet;
        
        console.log('🎯 Device detected:', touchManager.deviceInfo);
        
        if (touchManager.isTablet) {
            console.log('🎯 Tablet device detected, initializing enhanced touch handling...');
            
            // Add tablet CSS
            addTabletCSS();
            
            // Create persistent handlers
            createPersistentTouchHandlers();
            
            // Start monitoring and recovery
            startTouchHealthMonitoring();
            startAutoRecovery();
            
            // Expose refresh function globally for debugging
            window.refreshTabletTouch = refreshTouchHandlers;
            window.verifyTabletTouch = verifyTouchHandlers;
            
            console.log('🎯 Tablet touch manager fully initialized');
        } else {
            console.log('🎯 Non-tablet device, using standard touch handling');
        }
        
        touchManager.isInitialized = true;
    }
    
    // Handle orientation changes with throttling
    let orientationChangeTimeout = null;
    function handleOrientationChange() {
        if (touchManager.isTablet) {
            // Clear any pending orientation change
            if (orientationChangeTimeout) {
                clearTimeout(orientationChangeTimeout);
            }
            
            console.log('🎯 Orientation change detected, refreshing touch handlers...');
            orientationChangeTimeout = setTimeout(() => {
                touchManager.deviceInfo = detectTabletDevice();
                refreshTouchHandlers();
                orientationChangeTimeout = null;
            }, 1000); // Wait longer for orientation change to complete and throttle
        }
    }
    
    // Clean up function
    function cleanup() {
        if (touchManager.recoveryInterval) {
            clearInterval(touchManager.recoveryInterval);
        }
        if (touchManager.touchHealthCheck) {
            clearInterval(touchManager.touchHealthCheck);
        }
        
        // Remove event listeners
        for (const [key, handlers] of touchManager.touchHandlers) {
            const element = key === 'canvas' ? document.querySelector('canvas') : document.getElementById('dice-section');
            if (element && handlers) {
                if (handlers.touchstart) element.removeEventListener('touchstart', handlers.touchstart);
                if (handlers.touchend) element.removeEventListener('touchend', handlers.touchend);
            }
        }
        
        touchManager.touchHandlers.clear();
        touchManager.activeElements.clear();
        
        console.log('🎯 Touch manager cleaned up');
    }
    
    // Event listeners
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('beforeunload', cleanup);
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTouchManager);
    } else {
        initializeTouchManager();
    }
    
    // Also initialize after a short delay to catch dynamically created elements
    setTimeout(initializeTouchManager, 1000);
    
    // Expose the manager globally for debugging
    window.tabletTouchManager = {
        refresh: refreshTouchHandlers,
        verify: verifyTouchHandlers,
        getInfo: () => touchManager.deviceInfo,
        isActive: () => touchManager.isInitialized,
        getLastTouchTime: () => touchManager.lastTouchTime
    };
    
    console.log('🎯 Tablet Touch Manager loaded successfully');
    
})();