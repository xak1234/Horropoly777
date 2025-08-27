// Firebase 404 Error Fix Script
// This script addresses WebChannel transport errors and HTTP 404 issues

console.log('🔧 Firebase 404 Error Fix Script Starting...');

// Immediate fixes to try
const fixes = {
    
    // Fix 1: Clear Firebase cache and reset connection
    clearFirebaseCache() {
        console.log('🧹 Clearing Firebase cache...');
        
        // Clear localStorage Firebase entries
        const localStorageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('firebase') || key.includes('firestore'))) {
                localStorageKeys.push(key);
            }
        }
        localStorageKeys.forEach(key => localStorage.removeItem(key));
        
        // Clear sessionStorage Firebase entries
        const sessionStorageKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('firebase') || key.includes('firestore'))) {
                sessionStorageKeys.push(key);
            }
        }
        sessionStorageKeys.forEach(key => sessionStorage.removeItem(key));
        
        console.log(`✅ Cleared ${localStorageKeys.length} localStorage and ${sessionStorageKeys.length} sessionStorage entries`);
    },
    
    // Fix 2: Reset global Firebase instances
    resetGlobalInstances() {
        console.log('🔄 Resetting global Firebase instances...');
        
        if (window.firebaseApp) {
            delete window.firebaseApp;
        }
        if (window.firebaseDb) {
            delete window.firebaseDb;
        }
        
        console.log('✅ Global instances reset');
    },
    
    // Fix 3: Force refresh Firebase initialization
    async forceReinitialize() {
        console.log('🔄 Force reinitializing Firebase...');
        
        try {
            // Import Firebase modules fresh
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
            const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
            
            const firebaseConfig = {
                apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
                authDomain: "horropoly.firebaseapp.com",
                projectId: "horropoly",
                storageBucket: "horropoly.firebasestorage.app",
                messagingSenderId: "582020770053",
                appId: "1:582020770053:web:875b64a83ce557da01ef6c"
            };
            
            // Initialize with unique name to avoid conflicts
            const app = initializeApp(firebaseConfig, 'fix-attempt-' + Date.now());
            const db = getFirestore(app);
            
            // Test the connection
            const testDoc = doc(db, 'connectionTest', 'fix-test');
            await getDoc(testDoc);
            
            // Store globally if successful
            window.firebaseApp = app;
            window.firebaseDb = db;
            
            console.log('✅ Force reinitialization successful');
            return { success: true, app, db };
            
        } catch (error) {
            console.error('❌ Force reinitialization failed:', error);
            return { success: false, error };
        }
    },
    
    // Fix 4: Check network and DNS
    async checkNetworkConnectivity() {
        console.log('🌐 Checking network connectivity...');
        
        const endpoints = [
            'https://www.google.com/favicon.ico',
            'https://firestore.googleapis.com',
            'https://horropoly.firebaseapp.com'
        ];
        
        const results = {};
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, { 
                    mode: 'no-cors',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(5000) // 5 second timeout
                });
                results[endpoint] = 'reachable';
                console.log(`✅ ${endpoint}: Reachable`);
            } catch (error) {
                results[endpoint] = `error: ${error.message}`;
                console.log(`❌ ${endpoint}: ${error.message}`);
            }
        }
        
        return results;
    },
    
    // Fix 5: Validate Firebase project configuration
    async validateFirebaseProject() {
        console.log('🔍 Validating Firebase project configuration...');
        
        const projectId = 'horropoly';
        const apiKey = 'AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg';
        
        try {
            // Test direct REST API access
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents?key=${apiKey}`;
            const response = await fetch(url);
            
            if (response.ok) {
                console.log('✅ Firebase project configuration valid');
                return { valid: true };
            } else {
                const errorText = await response.text();
                console.error('❌ Firebase project validation failed:', response.status, errorText);
                return { valid: false, status: response.status, error: errorText };
            }
        } catch (error) {
            console.error('❌ Firebase project validation error:', error);
            return { valid: false, error: error.message };
        }
    }
};

// Auto-run fixes
async function runAllFixes() {
    console.log('🚀 Running all Firebase fixes...');
    
    // Fix 1: Clear cache
    fixes.clearFirebaseCache();
    
    // Fix 2: Reset global instances
    fixes.resetGlobalInstances();
    
    // Fix 3: Check network
    const networkResults = await fixes.checkNetworkConnectivity();
    
    // Fix 4: Validate project
    const projectValidation = await fixes.validateFirebaseProject();
    
    // Fix 5: Force reinitialize if project is valid
    if (projectValidation.valid) {
        const reinitResult = await fixes.forceReinitialize();
        
        if (reinitResult.success) {
            console.log('🎉 All fixes completed successfully!');
            console.log('🔄 Please refresh the page to use the fixed connection.');
            
            // Show success message
            if (typeof showAdvisory === 'function') {
                showAdvisory('Firebase connection fixed! Please refresh the page.', 'success');
            } else {
                alert('Firebase connection fixed! Please refresh the page.');
            }
        } else {
            console.error('❌ Fixes completed but reinitialization failed');
            console.error('Manual intervention may be required');
        }
    } else {
        console.error('❌ Firebase project validation failed - cannot proceed with reinitialization');
        console.error('Check your Firebase project configuration');
    }
    
    return {
        networkResults,
        projectValidation,
        cacheCleared: true,
        instancesReset: true
    };
}

// Make fixes available globally for manual execution
window.firebaseFixes = fixes;
window.runFirebaseFixes = runAllFixes;

// Auto-run if this script is loaded directly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllFixes);
} else {
    runAllFixes();
}

console.log('🔧 Firebase fix script loaded. Run window.runFirebaseFixes() to execute all fixes manually.');