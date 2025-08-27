/**
 * 🔊 AUTOPLAY AUDIO ERRORS FIX
 * Fixes browser autoplay policy violations that cause console errors
 * 
 * Issues addressed:
 * 1. Audio objects created without user interaction fail to play
 * 2. NotAllowedError exceptions when trying to play audio before user gesture
 * 3. Unhandled promise rejections from audio.play() calls
 * 4. Multiple audio elements not properly managed for autoplay compliance
 */

(function() {
    'use strict';
    
    console.log('🔊 Loading Autoplay Audio Errors Fix...');
    
    // Track user interaction state
    let userHasInteracted = false;
    let audioContext = null;
    let pendingAudioQueue = [];
    
    // Initialize audio context after user interaction
    function initializeAudioContext() {
        if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('🔊 Audio context initialized');
            } catch (error) {
                console.warn('🔊 Could not initialize audio context:', error);
            }
        }
    }
    
    // Handle user interaction to enable audio
    function handleUserInteraction() {
        if (userHasInteracted) return;
        
        userHasInteracted = true;
        console.log('🔊 User interaction detected - enabling audio');
        
        // Initialize audio context
        initializeAudioContext();
        
        // Resume audio context if suspended
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('🔊 Audio context resumed');
            }).catch(error => {
                console.warn('🔊 Could not resume audio context:', error);
            });
        }
        
        // Enable all existing audio elements
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            if (audio.muted) {
                audio.muted = false;
                console.log('🔊 Unmuted audio element:', audio.src);
            }
        });
        
        // Process pending audio queue
        processPendingAudio();
        
        // Remove event listeners (they're no longer needed)
        removeInteractionListeners();
    }
    
    // Process audio that was queued before user interaction
    function processPendingAudio() {
        while (pendingAudioQueue.length > 0) {
            const audioAction = pendingAudioQueue.shift();
            try {
                audioAction();
                console.log('🔊 Processed queued audio action');
            } catch (error) {
                console.warn('🔊 Error processing queued audio:', error);
            }
        }
    }
    
    // Add interaction event listeners
    function addInteractionListeners() {
        const events = ['click', 'touchstart', 'touchend', 'keydown', 'pointerdown'];
        events.forEach(event => {
            document.addEventListener(event, handleUserInteraction, { once: true, passive: true });
        });
        console.log('🔊 Added user interaction listeners for audio enablement');
    }
    
    // Remove interaction event listeners
    function removeInteractionListeners() {
        const events = ['click', 'touchstart', 'touchend', 'keydown', 'pointerdown'];
        events.forEach(event => {
            document.removeEventListener(event, handleUserInteraction);
        });
    }
    
    // Override HTMLAudioElement.prototype.play to handle autoplay gracefully
    function overrideAudioPlay() {
        const originalPlay = HTMLAudioElement.prototype.play;
        
        HTMLAudioElement.prototype.play = function() {
            // If user hasn't interacted yet, queue the audio or return resolved promise
            if (!userHasInteracted) {
                console.log('🔊 Audio play queued until user interaction:', this.src);
                
                // Queue the play action for later
                pendingAudioQueue.push(() => {
                    originalPlay.call(this).catch(error => {
                        console.warn('🔊 Queued audio play failed:', error.message);
                    });
                });
                
                // Return a resolved promise to prevent unhandled rejections
                return Promise.resolve();
            }
            
            // User has interacted, proceed with normal play
            const playPromise = originalPlay.call(this);
            
            // Handle the promise properly
            if (playPromise && typeof playPromise.catch === 'function') {
                return playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                        console.warn('🔊 Audio autoplay blocked (expected):', this.src);
                        // Queue for next user interaction
                        pendingAudioQueue.push(() => {
                            originalPlay.call(this).catch(e => {
                                console.warn('🔊 Retry audio play failed:', e.message);
                            });
                        });
                    } else if (error.name === 'AbortError') {
                        console.warn('🔊 Audio play interrupted:', this.src);
                    } else {
                        console.error('🔊 Audio play error:', error);
                    }
                    throw error; // Re-throw non-autoplay errors
                });
            }
            
            return playPromise;
        };
        
        console.log('🔊 Audio play method overridden for autoplay compliance');
    }
    
    // Handle unhandled promise rejections from audio
    function handleUnhandledAudioRejections() {
        window.addEventListener('unhandledrejection', function(event) {
            if (event.reason && event.reason.name === 'NotAllowedError') {
                console.warn('🔊 Suppressed unhandled audio autoplay rejection:', event.reason.message);
                event.preventDefault(); // Prevent the error from appearing in console
            } else if (event.reason && event.reason.message && 
                      (event.reason.message.includes('play() request was interrupted') ||
                       event.reason.message.includes('autoplay'))) {
                console.warn('🔊 Suppressed unhandled audio rejection:', event.reason.message);
                event.preventDefault();
            }
        });
        
        console.log('🔊 Unhandled audio rejection handler installed');
    }
    
    // Mute all audio elements initially to prevent autoplay errors
    function muteInitialAudio() {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            if (!audio.muted) {
                audio.muted = true;
                console.log('🔇 Initially muted audio element:', audio.src);
            }
        });
        
        // Also watch for dynamically added audio elements
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'AUDIO' && !userHasInteracted) {
                            node.muted = true;
                            console.log('🔇 Muted dynamically added audio:', node.src);
                        }
                        
                        // Check for audio elements within added nodes
                        const audioElements = node.querySelectorAll && node.querySelectorAll('audio');
                        if (audioElements) {
                            audioElements.forEach(audio => {
                                if (!userHasInteracted) {
                                    audio.muted = true;
                                    console.log('🔇 Muted nested audio element:', audio.src);
                                }
                            });
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('🔊 Audio mutation observer installed');
    }
    
    // Override window.Audio constructor to handle autoplay
    function overrideAudioConstructor() {
        const OriginalAudio = window.Audio;
        
        window.Audio = function(src) {
            const audio = new OriginalAudio(src);
            
            // Mute initially if user hasn't interacted
            if (!userHasInteracted) {
                audio.muted = true;
                console.log('🔇 New Audio object muted until user interaction:', src);
            }
            
            return audio;
        };
        
        // Preserve prototype
        window.Audio.prototype = OriginalAudio.prototype;
        
        console.log('🔊 Audio constructor overridden for autoplay compliance');
    }
    
    // Initialize all fixes
    function initializeAudioFixes() {
        console.log('🚀 Initializing autoplay audio error fixes...');
        
        // Apply all fixes
        overrideAudioPlay();
        overrideAudioConstructor();
        handleUnhandledAudioRejections();
        muteInitialAudio();
        addInteractionListeners();
        
        console.log('✅ Autoplay audio error fixes initialized');
    }
    
    // Start fixes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAudioFixes);
    } else {
        initializeAudioFixes();
    }
    
    // Make functions globally available for debugging
    window.audioAutoplayFix = {
        userHasInteracted: () => userHasInteracted,
        forceEnableAudio: handleUserInteraction,
        pendingAudioCount: () => pendingAudioQueue.length,
        audioContext: () => audioContext
    };
    
})();
