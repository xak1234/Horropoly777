// Galaxy S20 Touch Fix for Horropoly
// This script specifically addresses touch simulation issues on Samsung Galaxy S20 devices
// when trying to purchase property in the game

(function() {
    'use strict';
    
    console.log('📱 Initializing Galaxy S20 Touch Fix...');
    
    // Galaxy S20 specific device detection
    function detectGalaxyS20() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Galaxy S20 model detection
        const isGalaxyS20 = /SM-G980|SM-G981|SM-G985|SM-G986|SM-G988/i.test(userAgent) || 
                           (userAgent.includes('Android') && userAgent.includes('Samsung') && 
                            (screenWidth === 360 || screenWidth === 412 || screenHeight === 800 || screenHeight === 915));
        
        // Additional Samsung device detection
        const isSamsungDevice = /Samsung|SM-/i.test(userAgent);
        const isAndroid = /Android/i.test(userAgent);
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return {
            isGalaxyS20,
            isSamsungDevice,
            isAndroid,
            hasTouchSupport,
            screenWidth,
            screenHeight,
            userAgent
        };
    }
    
    // Enhanced touch event handling for Galaxy S20
    function createGalaxyS20TouchHandler() {
        let touchStartTime = 0;
        let touchStartPos = { x: 0, y: 0 };
        let touchMoved = false;
        let isPanning = false;
        
        // Track panzoom state
        if (window.panzoomInstance) {
            window.panzoomInstance.on('panzoomstart', () => {
                isPanning = true;
                console.log('🔄 Panzoom started - touch conflicts possible');
            });
            
            window.panzoomInstance.on('panzoomend', () => {
                isPanning = false;
                console.log('🔄 Panzoom ended');
            });
        }
        
        return function(element, callback) {
            if (!element) return;
            
            // Add Galaxy S20 specific CSS
            element.style.setProperty('touch-action', 'manipulation', 'important');
            element.style.setProperty('-webkit-touch-callout', 'none', 'important');
            element.style.setProperty('-webkit-user-select', 'none', 'important');
            element.style.setProperty('-webkit-tap-highlight-color', 'transparent', 'important');
            element.style.setProperty('user-select', 'none', 'important');
            element.style.setProperty('-ms-user-select', 'none', 'important');
            element.style.setProperty('-moz-user-select', 'none', 'important');
            
            // Enhanced touch start handling
            element.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const touch = e.touches[0];
                touchStartTime = Date.now();
                touchStartPos = { x: touch.clientX, y: touch.clientY };
                touchMoved = false;
                
                // Visual feedback
                this.style.transform = 'scale(0.95)';
                this.style.opacity = '0.8';
                this.style.transition = 'all 0.1s ease';
                
                console.log(`👆 Galaxy S20 touch start at (${touchStartPos.x}, ${touchStartPos.y})`);
            }, { passive: false });
            
            // Track touch movement
            element.addEventListener('touchmove', function(e) {
                const touch = e.touches[0];
                const distance = Math.sqrt(
                    Math.pow(touch.clientX - touchStartPos.x, 2) + 
                    Math.pow(touch.clientY - touchStartPos.y, 2)
                );
                
                if (distance > 10) {
                    touchMoved = true;
                    console.log(`👆 Touch moved ${distance.toFixed(1)}px`);
                }
            }, { passive: false });
            
            // Enhanced touch end handling
            element.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const touchEndTime = Date.now();
                const touchDuration = touchEndTime - touchStartTime;
                
                // Reset visual feedback
                this.style.transform = 'scale(1)';
                this.style.opacity = '1';
                
                console.log(`👆 Galaxy S20 touch end - duration: ${touchDuration}ms, moved: ${touchMoved}, panning: ${isPanning}`);
                
                // Only trigger callback if conditions are met
                if (!isPanning && touchDuration < 300 && !touchMoved) {
                    console.log(`✅ Galaxy S20 touch interpreted as click`);
                    if (callback) callback.call(this, e);
                } else {
                    console.log(`⚠️ Galaxy S20 touch ignored - panning: ${isPanning}, duration: ${touchDuration}ms, moved: ${touchMoved}`);
                }
            }, { passive: false });
            
            // Fallback click handler
            element.addEventListener('click', function(e) {
                console.log(`✅ Galaxy S20 button clicked via click event`);
                if (callback) callback.call(this, e);
            });
        };
    }
    
    // Apply Galaxy S20 fixes to purchase buttons
    function applyGalaxyS20PurchaseButtonFixes() {
        const deviceInfo = detectGalaxyS20();
        
        if (!deviceInfo.isGalaxyS20 && !deviceInfo.isSamsungDevice) {
            console.log('📱 Not a Galaxy S20 or Samsung device - skipping Galaxy S20 fixes');
            return;
        }
        
        console.log('📱 Galaxy S20/Samsung device detected - applying touch fixes');
        
        const touchHandler = createGalaxyS20TouchHandler();
        
        // Function to enhance purchase buttons
        function enhancePurchaseButtons() {
            const buttons = document.querySelectorAll('button[onclick*="handlePropertyPurchase"], button[onclick*="handleDeclinePurchase"], button[onclick*="handlePropertyDevelopment"], button[onclick*="handleMinimizedPropertyPurchase"], button[onclick*="handleMinimizedDeclinePurchase"]');
            
            buttons.forEach(button => {
                // Skip if already enhanced
                if (button.dataset.galaxyS20Enhanced) return;
                
                // Store original onclick
                const originalOnclick = button.getAttribute('onclick');
                
                // Create enhanced click handler
                const enhancedClickHandler = function(e) {
                    console.log(`✅ Galaxy S20 enhanced purchase button clicked`);
                    
                    // Execute original onclick
                    if (originalOnclick) {
                        try {
                            // Extract function name and parameters
                            const match = originalOnclick.match(/^(\w+)\(([^)]+)\)$/);
                            if (match) {
                                const funcName = match[1];
                                const params = match[2];
                                
                                // Call the function
                                if (window[funcName]) {
                                    window[funcName](...params.split(',').map(p => p.trim().replace(/['"]/g, '')));
                                }
                            }
                        } catch (error) {
                            console.error('Error executing original onclick:', error);
                        }
                    }
                };
                
                // Apply Galaxy S20 touch handler
                touchHandler(button, enhancedClickHandler);
                
                // Mark as enhanced
                button.dataset.galaxyS20Enhanced = 'true';
                
                console.log(`✅ Enhanced purchase button: ${button.textContent.trim()}`);
            });
        }
        
        // Apply fixes immediately
        enhancePurchaseButtons();
        
        // Set up observer to catch dynamically created buttons
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node contains purchase buttons
                            const buttons = node.querySelectorAll ? node.querySelectorAll('button[onclick*="handlePropertyPurchase"], button[onclick*="handleDeclinePurchase"], button[onclick*="handlePropertyDevelopment"], button[onclick*="handleMinimizedPropertyPurchase"], button[onclick*="handleMinimizedDeclinePurchase"]') : [];
                            if (buttons.length > 0) {
                                console.log(`🔄 Found ${buttons.length} new purchase buttons, enhancing...`);
                                enhancePurchaseButtons();
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Galaxy S20 purchase button fixes applied');
    }
    
    // Apply Galaxy S20 CSS fixes
    function applyGalaxyS20CSSFixes() {
        const style = document.createElement('style');
        style.textContent = `
            /* Galaxy S20 specific touch optimizations */
            button[onclick*="handlePropertyPurchase"],
            button[onclick*="handleDeclinePurchase"],
            button[onclick*="handlePropertyDevelopment"],
            button[onclick*="handleMinimizedPropertyPurchase"],
            button[onclick*="handleMinimizedDeclinePurchase"] {
                touch-action: manipulation !important;
                -webkit-touch-callout: none !important;
                -webkit-user-select: none !important;
                -webkit-tap-highlight-color: transparent !important;
                user-select: none !important;
                -ms-user-select: none !important;
                -moz-user-select: none !important;
                min-height: 56px !important;
                min-width: 56px !important;
                font-size: 16px !important;
                padding: 16px 20px !important;
                border-radius: 8px !important;
                transition: all 0.1s ease !important;
            }
            
            button[onclick*="handlePropertyPurchase"]:active,
            button[onclick*="handleDeclinePurchase"]:active,
            button[onclick*="handlePropertyDevelopment"]:active,
            button[onclick*="handleMinimizedPropertyPurchase"]:active,
            button[onclick*="handleMinimizedDeclinePurchase"]:active {
                transform: scale(0.95) !important;
                opacity: 0.8 !important;
            }
            
            /* Galaxy S20 specific media queries */
            @media (max-width: 412px) {
                button[onclick*="handlePropertyPurchase"],
                button[onclick*="handleDeclinePurchase"],
                button[onclick*="handlePropertyDevelopment"],
                button[onclick*="handleMinimizedPropertyPurchase"],
                button[onclick*="handleMinimizedDeclinePurchase"] {
                    min-height: 60px !important;
                    min-width: 60px !important;
                    font-size: 18px !important;
                    padding: 18px 24px !important;
                }
            }
            
            /* Special handling for minimized panel buttons */
            #minimized-content button[onclick*="handlePropertyPurchase"],
            #minimized-content button[onclick*="handleDeclinePurchase"],
            #minimized-content button[onclick*="handlePropertyDevelopment"] {
                touch-action: manipulation !important;
                -webkit-touch-callout: none !important;
                -webkit-user-select: none !important;
                -webkit-tap-highlight-color: transparent !important;
                user-select: none !important;
                -ms-user-select: none !important;
                -moz-user-select: none !important;
                min-height: 44px !important;
                min-width: 44px !important;
                font-size: 12px !important;
                padding: 8px 4px !important;
                border-radius: 4px !important;
                transition: all 0.1s ease !important;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Galaxy S20 CSS fixes applied');
    }
    
    // Initialize Galaxy S20 fixes
    function initializeGalaxyS20Fixes() {
        const deviceInfo = detectGalaxyS20();
        
        console.log('📱 Device detection:', deviceInfo);
        
        if (deviceInfo.isGalaxyS20 || deviceInfo.isSamsungDevice) {
            console.log('🚀 Applying Galaxy S20 touch fixes...');
            
            // Apply CSS fixes
            applyGalaxyS20CSSFixes();
            
            // Apply purchase button fixes
            applyGalaxyS20PurchaseButtonFixes();
            
            // Add global touch conflict detection
            document.addEventListener('touchstart', function(e) {
                if (e.target.matches('button[onclick*="handlePropertyPurchase"], button[onclick*="handleDeclinePurchase"], button[onclick*="handlePropertyDevelopment"], button[onclick*="handleMinimizedPropertyPurchase"], button[onclick*="handleMinimizedDeclinePurchase"]')) {
                    console.log('👆 Purchase button touch detected');
                }
            }, { passive: false });
            
            console.log('✅ Galaxy S20 touch fixes initialized successfully');
        } else {
            console.log('📱 Not a Galaxy S20 device - touch fixes not applied');
        }
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGalaxyS20Fixes);
    } else {
        initializeGalaxyS20Fixes();
    }
    
    // Export for manual initialization
    window.galaxyS20TouchFix = {
        initialize: initializeGalaxyS20Fixes,
        detectDevice: detectGalaxyS20,
        applyFixes: applyGalaxyS20PurchaseButtonFixes
    };
    
    console.log('📱 Galaxy S20 Touch Fix loaded');
})(); 