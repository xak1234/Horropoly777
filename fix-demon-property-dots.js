// Fix for demon property dots visibility
function updatePropertyDotStyle() {
    // Add CSS to the document
    const style = document.createElement('style');
    style.textContent = `
        /* Add white ring around demon property dots */
        .property-dot[data-group="demon"] {
            box-shadow: 0 0 0 2px white !important;
            border-radius: 50% !important;
        }
        
        /* Ensure demon dots are visible on dark backgrounds */
        .property-dot[data-group="demon"] {
            position: relative !important;
            z-index: 1 !important;
        }
        
        /* Add glow effect for better visibility */
        .property-dot[data-group="demon"]:after {
            content: '' !important;
            position: absolute !important;
            top: -1px !important;
            left: -1px !important;
            right: -1px !important;
            bottom: -1px !important;
            border-radius: 50% !important;
            box-shadow: 0 0 2px 1px rgba(255, 255, 255, 0.5) !important;
            z-index: -1 !important;
        }
        
        /* Ensure consistent size */
        .property-dot {
            width: 8px !important;
            height: 8px !important;
            min-width: 8px !important;
            min-height: 8px !important;
            border-radius: 50% !important;
            margin: 0 2px !important;
        }
        
        /* Mobile adjustments */
        @media (max-width: 768px) {
            .property-dot {
                width: 6px !important;
                height: 6px !important;
                min-width: 6px !important;
                min-height: 6px !important;
                margin: 0 1px !important;
            }
            
            .property-dot[data-group="demon"] {
                box-shadow: 0 0 0 1px white !important;
            }
            
            .property-dot[data-group="demon"]:after {
                box-shadow: 0 0 1px 0.5px rgba(255, 255, 255, 0.5) !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // Update existing property dots
    function updateExistingDots() {
        const propertyDots = document.querySelectorAll('.property-dot');
        propertyDots.forEach(dot => {
            // Get the group from the dot's color or data attribute
            const color = dot.style.backgroundColor;
            if (color === 'rgb(0, 0, 0)' || color === '#000000' || dot.dataset.group === 'demon') {
                dot.dataset.group = 'demon';
            }
        });
    }
    
    // Update dots now
    updateExistingDots();
    
    // Watch for new property dots being added
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                updateExistingDots();
            }
        });
    });
    
    // Start observing the document for added nodes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Demon property dots updated with white ring for better visibility!');
}

// Apply the fix
console.log('🔧 Applying demon property dot fix...');
updatePropertyDotStyle();
console.log('✅ Property dot styles updated!');
