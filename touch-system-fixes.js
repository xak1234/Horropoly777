// Touch System Fixes for Horropoly
// This script addresses the most critical touch system issues identified in the analysis

(function() {
    'use strict';
    
    console.log('🔧 Applying touch system fixes...');
    
    // Enhanced device detection with tablet and high-DPI support
    function enhancedDeviceDetection() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;
        
        const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || screenWidth <= 768;
        const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent) || (screenWidth > 768 && screenWidth <= 1024);
        const isHighDPI = pixelRatio > 1;
        const isDesktop = !isMobile && !isTablet;
        
        const deviceInfo = {
            isMobile,
            isTablet,
            isHighDPI,
            isDesktop,
            pixelRatio,
            screenWidth,
            screenHeight,
            deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
            userAgent: userAgent
        };
        
        console.log('📱 Enhanced device detection:', deviceInfo);
        return deviceInfo;
    }
    
    // Consistent coordinate scaling function
    function getScaledTouchCoordinates(touch, element) {
        if (!element) return { x: 0, y: 0 };
        
        const rect = element.getBoundingClientRect();
        const scaleX = element.width / rect.width;
        const scaleY = element.height / rect.height;
        const pixelRatio = window.devicePixelRatio || 1;
        
        const rawX = touch.clientX - rect.left;
        const rawY = touch.clientY - rect.top;
        
        // Apply scaling and pixel ratio correction
        const scaledX = rawX * scaleX / pixelRatio;
        const scaledY = rawY * scaleY / pixelRatio;
        
        return {
            x: scaledX,
            y: scaledY,
            rawX: rawX,
            rawY: rawY,
            scaleX: scaleX,
            scaleY: scaleY,
            pixelRatio: pixelRatio
        };
    }
    
    // Enhanced touch feedback
    function addTouchFeedback(element) {
        if (!element) return;
        
        element.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.classList.add('touch-feedback');
        }, { passive: false });
        
        element.addEventListener('touchend', function(e) {
            e.preventDefault();
            setTimeout(() => {
                this.classList.remove('touch-feedback');
            }, 150);
        }, { passive: false });
        
        element.addEventListener('touchcancel', function(e) {
            this.classList.remove('touch-feedback');
        });
    }
    
    // Enhanced double-tap detection
    function enhancedDoubleTapDetection(element, callback, options = {}) {
        const {
            threshold = 500, // 500ms
            distanceThreshold = 50, // 50px
            preventDefault = true
        } = options;
        
        let lastTapTime = 0;
        let lastTapPosition = { x: 0, y: 0 };
        
        element.addEventListener('touchend', function(e) {
            if (preventDefault) e.preventDefault();
            
            const touch = e.changedTouches[0];
            if (!touch) return;
            
            const rect = element.getBoundingClientRect();
            const currentTime = Date.now();
            
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            const timeSinceLastTap = currentTime - lastTapTime;
            const distanceFromLastTap = Math.sqrt(
                Math.pow(touchX - lastTapPosition.x, 2) + 
                Math.pow(touchY - lastTapPosition.y, 2)
            );
            
            if (timeSinceLastTap < threshold && distanceFromLastTap < distanceThreshold) {
                // Double-tap detected
                const coords = getScaledTouchCoordinates(touch, element);
                callback(coords, {
                    timeSinceLastTap,
                    distanceFromLastTap,
                    isDoubleTap: true
                });
            } else {
                // Single tap
                const coords = getScaledTouchCoordinates(touch, element);
                callback(coords, {
                    timeSinceLastTap,
                    distanceFromLastTap,
                    isDoubleTap: false
                });
            }
            
            lastTapTime = currentTime;
            lastTapPosition = { x: touchX, y: touchY };
        }, { passive: false });
    }
    
    // Fix canvas touch handling
    function fixCanvasTouchHandling() {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            console.warn('🔧 Canvas not found for touch fixes');
            return;
        }
        
        // Remove existing touch listeners to avoid conflicts
        canvas.removeEventListener('touchstart', window.handleTouchStart);
        canvas.removeEventListener('touchend', window.handleTouchEnd);
        
        // Enhanced touch start handler
        window.handleTouchStart = function(e) {
            if (e.touches && e.touches.length > 1) {
                // Allow pinch gestures to pass through
                return;
            }
            e.preventDefault();
            const touch = e.touches[0];
            const coords = getScaledTouchCoordinates(touch, canvas);
            
            // Store touch info for enhanced accuracy
            window.touchStartInfo = {
                x: coords.x,
                y: coords.y,
                rawX: coords.rawX,
                rawY: coords.rawY,
                time: Date.now()
            };
            
            console.log('🔧 Enhanced touch start:', coords);
        };
        
        // Enhanced touch end handler
        window.handleTouchEnd = function(e) {
            if (e.changedTouches && e.changedTouches.length > 1) {
                // Ignore multi-touch end events
                return;
            }
            e.preventDefault();
            
            const touch = e.changedTouches[0];
            if (!touch) return;
            
            const coords = getScaledTouchCoordinates(touch, canvas);
            const currentTime = Date.now();
            
            // Enhanced double-tap detection
            if (window.touchStartInfo) {
                const timeSinceLastTap = currentTime - window.lastTapTime;
                const distanceFromLastTap = Math.sqrt(
                    Math.pow(coords.x - window.lastTapPosition.x, 2) + 
                    Math.pow(coords.y - window.lastTapPosition.y, 2)
                );
                
                const DOUBLE_TAP_THRESHOLD = 500;
                const CLICK_POSITION_THRESHOLD = 50;
                
                if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD && distanceFromLastTap < CLICK_POSITION_THRESHOLD) {
                    console.log('🔧 Enhanced double-tap detected:', coords);
                    if (typeof handlePropertySteal === 'function') {
                        handlePropertySteal(coords.x, coords.y);
                    }
                } else {
                    console.log('🔧 Enhanced single tap detected:', coords);
                    if (typeof handleCanvasTap === 'function') {
                        handleCanvasTap(coords.x, coords.y);
                    }
                }
                
                window.lastTapTime = currentTime;
                window.lastTapPosition = { x: coords.x, y: coords.y };
            }
        };
        
        // Re-add event listeners
        canvas.addEventListener('touchstart', window.handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', window.handleTouchEnd, { passive: false });
        
        console.log('🔧 Enhanced canvas touch handling applied');
    }
    
    // Fix dice section touch handling
    function fixDiceTouchHandling() {
        const diceSection = document.getElementById('dice-section');
        if (!diceSection) {
            console.warn('🔧 Dice section not found for touch fixes');
            return;
        }
        
        // Remove existing listeners
        diceSection.removeEventListener('touchstart', window.handleDiceTouchStart);
        diceSection.removeEventListener('touchend', window.handleDiceTouchEnd);
        
        // Enhanced dice touch handlers
        window.handleDiceTouchStart = function(e) {
            e.preventDefault();
            this.classList.add('touch-feedback');
            console.log('🔧 Enhanced dice touch start');
        };
        
        window.handleDiceTouchEnd = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            setTimeout(() => {
                this.classList.remove('touch-feedback');
            }, 150);
            
            console.log('🔧 Enhanced dice touch end');
            
            // Trigger dice roll if function exists
            if (typeof triggerDiceRoll === 'function') {
                triggerDiceRoll();
            }
        };
        
        // Re-add event listeners
        diceSection.addEventListener('touchstart', window.handleDiceTouchStart, { passive: false });
        diceSection.addEventListener('touchend', window.handleDiceTouchEnd, { passive: false });
        
        console.log('🔧 Enhanced dice touch handling applied');
    }
    
    // Fix button touch handling
    function fixButtonTouchHandling() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            addTouchFeedback(button);
        });
        
        console.log(`🔧 Enhanced touch feedback applied to ${buttons.length} buttons`);
    }
    
    // Fix property steal coordinate accuracy
    function fixPropertyStealAccuracy() {
        if (typeof handlePropertySteal === 'function') {
            const originalHandlePropertySteal = handlePropertySteal;
            
            handlePropertySteal = function(clickX, clickY, isRetry = false) {
                // Apply coordinate scaling if needed
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    const pixelRatio = window.devicePixelRatio || 1;
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    
                    // Adjust coordinates for high-DPI displays
                    const adjustedX = clickX * scaleX / pixelRatio;
                    const adjustedY = clickY * scaleY / pixelRatio;
                    
                    console.log('🔧 Property steal coordinates adjusted:', {
                        original: { x: clickX, y: clickY },
                        adjusted: { x: adjustedX, y: adjustedY },
                        pixelRatio: pixelRatio
                    });
                    
                    return originalHandlePropertySteal.call(this, adjustedX, adjustedY, isRetry);
                }
                
                return originalHandlePropertySteal.call(this, clickX, clickY, isRetry);
            };
            
            console.log('🔧 Enhanced property steal accuracy applied');
        }
    }
    
    // Apply all fixes
    function applyTouchSystemFixes() {
        const deviceInfo = enhancedDeviceDetection();
        
        // Store device info globally
        window.deviceInfo = deviceInfo;
        window.isMobile = deviceInfo.isMobile;
        window.isTablet = deviceInfo.isTablet;
        window.isHighDPI = deviceInfo.isHighDPI;
        window.pixelRatio = deviceInfo.pixelRatio;
        
        // Apply fixes based on device type
        if (deviceInfo.isMobile || deviceInfo.isTablet) {
            fixCanvasTouchHandling();
            fixDiceTouchHandling();
            fixButtonTouchHandling();
            fixPropertyStealAccuracy();
            
            console.log('🔧 Touch system fixes applied for', deviceInfo.deviceType);
        } else {
            console.log('🔧 Desktop device detected, minimal touch fixes applied');
        }
        
        // Add CSS for enhanced touch feedback
        const style = document.createElement('style');
        style.textContent = `
            .touch-feedback {
                background: rgba(255, 255, 255, 0.2) !important;
                transform: scale(0.95) !important;
                transition: all 0.1s ease !important;
            }
            
            .touch-target {
                min-height: 44px !important;
                min-width: 44px !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: rgba(255, 255, 255, 0.3) !important;
                user-select: none !important;
                -webkit-user-select: none !important;
            }
            
            /* Enhanced mobile touch targets */
            @media (max-width: 600px), (max-device-width: 600px) {
                button, .dice-section, .touch-target {
                    min-height: 50px !important;
                    min-width: 50px !important;
                }
            }
            
            /* Enhanced tablet touch targets */
            @media (min-width: 601px) and (max-width: 1024px) {
                button, .dice-section, .touch-target {
                    min-height: 48px !important;
                    min-width: 48px !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        console.log('🔧 Touch system fixes completed');
    }
    
    // Apply fixes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTouchSystemFixes);
    } else {
        applyTouchSystemFixes();
    }
    
    // Export functions for manual use
    window.TouchSystemFixes = {
        enhancedDeviceDetection,
        getScaledTouchCoordinates,
        addTouchFeedback,
        enhancedDoubleTapDetection,
        fixCanvasTouchHandling,
        fixDiceTouchHandling,
        fixButtonTouchHandling,
        fixPropertyStealAccuracy,
        applyTouchSystemFixes
    };
    
})(); 