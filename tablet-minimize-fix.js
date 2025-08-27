// Tablet Minimize Fix - Enhanced tap-tap functionality for minimizing window on tablets
// This script adds special tap-tap areas and gestures for tablets to minimize the info panel

(function() {
    'use strict';
    
    console.log('🎯 Initializing Tablet Minimize Fix...');
    
    let minimizeManager = {
        isInitialized: false,
        isTablet: false,
        minimizeAreas: new Map(),
        lastTapTime: 0,
        lastTapPosition: { x: 0, y: 0 },
        doubleTapThreshold: 500, // More responsive for minimize action
        positionThreshold: 80,   // Larger area for easier access
        minimizeZones: []
    };
    
    // Enhanced tablet detection
    function detectTabletDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const maxDimension = Math.max(screenWidth, screenHeight);
        const minDimension = Math.min(screenWidth, screenHeight);
        
        const isIPad = /iPad|iPad Pro/i.test(userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroidTablet = /android/i.test(userAgent) && !/mobile/i.test(userAgent);
        const isSurfaceTablet = /Windows NT.*Touch/i.test(userAgent) && !/Phone/i.test(userAgent);
        const isTabletBySize = (minDimension >= 768 && maxDimension >= 1024) || 
                              (screenWidth > 768 && screenWidth <= 1366 && 'ontouchstart' in window);
        
        return isIPad || isAndroidTablet || isSurfaceTablet || isTabletBySize;
    }
    
    // Define minimize zones on the screen
    function createMinimizeZones() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        minimizeManager.minimizeZones = [
            // Top-right corner (primary minimize zone)
            {
                name: 'top-right',
                x: screenWidth - 150,
                y: 0,
                width: 150,
                height: 100,
                priority: 1
            },
            // Top-left corner (secondary)
            {
                name: 'top-left',
                x: 0,
                y: 0,
                width: 150,
                height: 100,
                priority: 2
            },
            // Info panel header area (if visible)
            {
                name: 'info-panel-header',
                element: 'info-panel-header',
                priority: 3
            },
            // Minimize button area (if visible)
            {
                name: 'minimize-button',
                element: 'minimize-info-panel',
                priority: 4
            }
        ];
        
        console.log('🎯 Created minimize zones:', minimizeManager.minimizeZones.length);
    }
    
    // Check if tap is in a minimize zone
    function isInMinimizeZone(x, y) {
        for (const zone of minimizeManager.minimizeZones) {
            if (zone.element) {
                // Element-based zone
                const element = document.getElementById(zone.element);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                        console.log('🎯 Tap in minimize zone:', zone.name);
                        return { zone, priority: zone.priority };
                    }
                }
            } else {
                // Coordinate-based zone
                if (x >= zone.x && x <= zone.x + zone.width && 
                    y >= zone.y && y <= zone.y + zone.height) {
                    console.log('🎯 Tap in minimize zone:', zone.name);
                    return { zone, priority: zone.priority };
                }
            }
        }
        return null;
    }
    
    // Enhanced double-tap detection for minimize functionality
    function handleMinimizeDoubleTap(x, y) {
        const currentTime = Date.now();
        const timeSinceLastTap = currentTime - minimizeManager.lastTapTime;
        const distanceFromLastTap = Math.sqrt(
            Math.pow(x - minimizeManager.lastTapPosition.x, 2) + 
            Math.pow(y - minimizeManager.lastTapPosition.y, 2)
        );
        
        console.log('🎯 Minimize tap check:', {
            timeSinceLastTap,
            distanceFromLastTap,
            threshold: minimizeManager.doubleTapThreshold,
            positionThreshold: minimizeManager.positionThreshold
        });
        
        const isDoubleTap = timeSinceLastTap < minimizeManager.doubleTapThreshold && 
                           distanceFromLastTap < minimizeManager.positionThreshold;
        
        if (isDoubleTap) {
            const minimizeZone = isInMinimizeZone(x, y);
            if (minimizeZone) {
                console.log('🎯 Double-tap minimize detected in zone:', minimizeZone.zone.name);
                triggerMinimize();
                return true;
            }
        }
        
        // Update last tap info
        minimizeManager.lastTapTime = currentTime;
        minimizeManager.lastTapPosition = { x, y };
        
        return false;
    }
    
    // Trigger the minimize function
    function triggerMinimize() {
        console.log('🎯 Triggering minimize function...');
        
        if (typeof window.toggleInfoPanelMinimize === 'function') {
            console.log('🎯 Calling toggleInfoPanelMinimize');
            window.toggleInfoPanelMinimize();
        } else {
            console.warn('🎯 toggleInfoPanelMinimize function not found');
            
            // Fallback: try to click the minimize button
            const minimizeButton = document.getElementById('minimize-info-panel');
            if (minimizeButton) {
                console.log('🎯 Fallback: clicking minimize button');
                minimizeButton.click();
            } else {
                console.error('🎯 No minimize functionality available');
            }
        }
    }
    
    // Add visual feedback for minimize zones (debug mode)
    function addMinimizeZoneVisuals() {
        if (!window.debugMinimizeZones) return;
        
        minimizeManager.minimizeZones.forEach((zone, index) => {
            if (!zone.element) {
                const zoneDiv = document.createElement('div');
                zoneDiv.id = `minimize-zone-${index}`;
                zoneDiv.style.cssText = `
                    position: fixed;
                    left: ${zone.x}px;
                    top: ${zone.y}px;
                    width: ${zone.width}px;
                    height: ${zone.height}px;
                    background: rgba(255, 0, 0, 0.2);
                    border: 2px dashed red;
                    pointer-events: none;
                    z-index: 9999;
                    display: ${window.debugMinimizeZones ? 'block' : 'none'};
                `;
                document.body.appendChild(zoneDiv);
            }
        });
    }
    
    // Create enhanced touch handlers for minimize functionality
    function createMinimizeTouchHandlers() {
        const infoPanel = document.getElementById('info-panel');
        const canvas = document.querySelector('canvas');
        
        if (!infoPanel && !canvas) {
            console.log('🎯 No target elements found for minimize touch handlers');
            return;
        }
        
        // Global touch handler for minimize zones
        const globalTouchHandler = function(e) {
            if (!minimizeManager.isTablet) return;
            
            const touch = e.changedTouches[0];
            if (!touch) return;
            
            const x = touch.clientX;
            const y = touch.clientY;
            
            // Check if this tap could trigger minimize
            const handled = handleMinimizeDoubleTap(x, y);
            
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // Add global touch listener
        document.addEventListener('touchend', globalTouchHandler, { passive: false });
        
        // Store handler for cleanup
        minimizeManager.minimizeAreas.set('global', globalTouchHandler);
        
        console.log('🎯 Minimize touch handlers created');
    }
    
    // Enhance existing minimize button for tablets
    function enhanceMinimizeButton() {
        const minimizeButton = document.getElementById('minimize-info-panel');
        if (!minimizeButton) return;
        
        // Make button more tablet-friendly
        minimizeButton.style.cssText += `
            min-width: 44px !important;
            min-height: 44px !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.3) !important;
            font-size: 18px !important;
            padding: 8px !important;
        `;
        
        // Add touch feedback
        minimizeButton.addEventListener('touchstart', function() {
            this.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        });
        
        minimizeButton.addEventListener('touchend', function() {
            this.style.backgroundColor = '';
        });
        
        console.log('🎯 Enhanced minimize button for tablets');
    }
    
    // Add floating minimize button for tablets
    function addFloatingMinimizeButton() {
        // Remove existing floating button if present
        const existingButton = document.getElementById('floating-minimize-btn');
        if (existingButton) existingButton.remove();
        
        const floatingButton = document.createElement('button');
        floatingButton.id = 'floating-minimize-btn';
        floatingButton.innerHTML = '⊟';
        floatingButton.title = 'Tap-tap here or top corners to minimize';
        
        floatingButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: 2px solid #444;
            border-radius: 50%;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: manipulation;
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        `;
        
        // Add click handler
        floatingButton.addEventListener('click', triggerMinimize);
        
        // Add touch feedback
        floatingButton.addEventListener('touchstart', function() {
            this.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            this.style.transform = 'scale(0.95)';
        });
        
        floatingButton.addEventListener('touchend', function() {
            this.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(floatingButton);
        console.log('🎯 Added floating minimize button for tablets');
    }
    
    // Initialize the minimize fix
    function initializeMinimizeFix() {
        if (minimizeManager.isInitialized) return;
        
        minimizeManager.isTablet = detectTabletDevice();
        
        if (!minimizeManager.isTablet) {
            console.log('🎯 Not a tablet device, skipping minimize fix');
            return;
        }
        
        console.log('🎯 Tablet detected, initializing minimize fix');
        
        createMinimizeZones();
        createMinimizeTouchHandlers();
        enhanceMinimizeButton();
        addFloatingMinimizeButton();
        addMinimizeZoneVisuals();
        
        minimizeManager.isInitialized = true;
        
        console.log('🎯 Tablet minimize fix initialized successfully');
    }
    
    // Handle orientation changes
    function handleOrientationChange() {
        if (!minimizeManager.isTablet) return;
        
        console.log('🎯 Orientation changed, updating minimize zones');
        setTimeout(() => {
            createMinimizeZones();
            addMinimizeZoneVisuals();
        }, 100);
    }
    
    // Cleanup function
    function cleanup() {
        minimizeManager.minimizeAreas.forEach((handler, key) => {
            if (key === 'global') {
                document.removeEventListener('touchend', handler);
            }
        });
        minimizeManager.minimizeAreas.clear();
        
        const floatingButton = document.getElementById('floating-minimize-btn');
        if (floatingButton) floatingButton.remove();
        
        console.log('🎯 Tablet minimize fix cleaned up');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMinimizeFix);
    } else {
        initializeMinimizeFix();
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Export functions for manual use and debugging
    window.TabletMinimizeFix = {
        initialize: initializeMinimizeFix,
        cleanup: cleanup,
        triggerMinimize: triggerMinimize,
        detectTablet: detectTabletDevice,
        enableDebugZones: () => { window.debugMinimizeZones = true; addMinimizeZoneVisuals(); },
        disableDebugZones: () => { window.debugMinimizeZones = false; }
    };
    
    console.log('🎯 Tablet Minimize Fix loaded');
    
})(); 