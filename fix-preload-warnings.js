/**
 * 🔧 PRELOAD WARNINGS FIX
 * Fixes browser warnings about preload resources not being used within seconds
 * 
 * Common causes:
 * 1. Audio elements with preload="auto" that aren't played immediately
 * 2. Link preload tags for scripts that load later
 * 3. Resource hints that aren't used quickly enough
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading Preload Warnings Fix...');
    
    function fixPreloadWarnings() {
        // 1. Fix audio preload warnings by changing to "metadata" instead of "auto"
        const audioElements = document.querySelectorAll('audio[preload="auto"]');
        audioElements.forEach(audio => {
            const originalPreload = audio.preload;
            audio.preload = 'metadata'; // Load only metadata, not full audio
            console.log(`🔧 Changed audio preload from "${originalPreload}" to "metadata":`, audio.src);
            
            // Add event listener to preload full audio on first user interaction
            const preloadOnInteraction = () => {
                audio.preload = 'auto';
                console.log(`🔊 Enabled full audio preload after user interaction:`, audio.src);
                
                // Remove listeners after first use
                document.removeEventListener('click', preloadOnInteraction);
                document.removeEventListener('touchstart', preloadOnInteraction);
                document.removeEventListener('keydown', preloadOnInteraction);
            };
            
            // Listen for any user interaction
            document.addEventListener('click', preloadOnInteraction, { once: true });
            document.addEventListener('touchstart', preloadOnInteraction, { once: true });
            document.addEventListener('keydown', preloadOnInteraction, { once: true });
        });
        
        // 2. Remove any problematic link preload tags
        const preloadLinks = document.querySelectorAll('link[rel="preload"]');
        preloadLinks.forEach(link => {
            const href = link.getAttribute('href');
            const as = link.getAttribute('as');
            
            // Remove preload links for scripts that might not be used immediately
            if (as === 'script' && href) {
                if (href.includes('game.js') || href.includes('lobby.js') || href.includes('gamestart.js')) {
                    console.log(`🔧 Removing preload link that may cause warnings:`, href);
                    link.remove();
                }
            }
            
            // Remove preload links for stylesheets that might not be used immediately
            if (as === 'style' && href) {
                console.log(`🔧 Removing stylesheet preload that may cause warnings:`, href);
                link.remove();
            }
        });
        
        // 3. Add resource hints that are actually useful
        const head = document.head;
        
        // Preconnect to common domains (if not already present)
        if (!document.querySelector('link[rel="preconnect"][href*="firebase"]')) {
            const firebasePreconnect = document.createElement('link');
            firebasePreconnect.rel = 'preconnect';
            firebasePreconnect.href = 'https://firestore.googleapis.com';
            head.appendChild(firebasePreconnect);
            console.log('🔧 Added Firebase preconnect hint');
        }
        
        // 4. Optimize image loading to prevent preload warnings
        const images = document.querySelectorAll('img[loading="eager"]');
        images.forEach(img => {
            // Change eager loading to lazy for non-critical images
            if (!img.src.includes('front.jpg') && !img.src.includes('backdrop.png')) {
                img.loading = 'lazy';
                console.log('🔧 Changed image loading to lazy:', img.src);
            }
        });
        
        console.log('✅ Preload warnings fix applied');
    }
    
    // Apply fix when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixPreloadWarnings);
    } else {
        fixPreloadWarnings();
    }
    
    // Also apply after a short delay to catch dynamically added elements
    setTimeout(fixPreloadWarnings, 1000);
    
    // Make function globally available for debugging
    window.fixPreloadWarnings = fixPreloadWarnings;
    
})();
