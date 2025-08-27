// @ts-check

/**
 * Enables audio after user gesture to comply with browser autoplay policies
 * @param {HTMLAudioElement} audioEl
 */
export function enableAudioAfterGesture(audioEl) {
  try {
    audioEl.muted = true; // prevent autoplay exception
    // On first user gesture, unmute and play once if needed
    const handler = async () => {
      try {
        audioEl.muted = false;
        console.log("🔊 Audio enabled after user gesture");
        // only play if you actually need background audio
        // await audioEl.play();  // uncomment if you must start immediately after gesture
      } catch (error) {
        console.warn("Audio enable failed:", error);
      }
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
    };
    
    // Listen for multiple types of user interactions
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    
    console.log("🔇 Audio muted until user gesture");
  } catch (error) {
    console.warn("Audio gesture setup failed:", error);
  }
}

/**
 * Enables multiple audio elements after user gesture
 * @param {HTMLAudioElement[]} audioElements
 */
export function enableMultipleAudioAfterGesture(audioElements) {
  audioElements.forEach(audioEl => {
    if (audioEl instanceof HTMLAudioElement) {
      enableAudioAfterGesture(audioEl);
    }
  });
}

/**
 * Creates and enables an audio element with gesture handling
 * @param {string} src - Audio file source
 * @param {object} options - Audio options (volume, loop, etc.)
 * @returns {HTMLAudioElement}
 */
export function createAudioWithGesture(src, options = {}) {
  const audio = new Audio(src);
  
  // Apply options
  if (options.volume !== undefined) audio.volume = options.volume;
  if (options.loop !== undefined) audio.loop = options.loop;
  if (options.preload !== undefined) audio.preload = options.preload;
  
  // Enable after gesture
  enableAudioAfterGesture(audio);
  
  return audio;
}
