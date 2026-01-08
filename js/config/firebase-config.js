/**
 * Firebase Configuration
 * Includes Firebase Auth and Firestore
 */

// Load config from config.json
let firebaseConfig = null;

async function loadFirebaseConfig() {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        firebaseConfig = config.firebase;
        return firebaseConfig;
    } catch (error) {
        console.error('Error loading Firebase config:', error);
        return null;
    }
}

// Initialize Firebase
let app = null;
let auth = null;
let db = null;

async function initializeFirebase() {
    if (app) return { app, auth, db };

    const config = await loadFirebaseConfig();
    if (!config) {
        console.error('Firebase config not found');
        return { app: null, auth: null, db: null };
    }

    try {
        // Kiểm tra Firebase SDK đã được load chưa
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return { app: null, auth: null, db: null };
        }

        app = firebase.initializeApp(config);
        auth = firebase.auth();
        
        // Đợi Firestore SDK được load (nếu chưa có)
        let retries = 0;
        while (typeof firebase.firestore !== 'function' && retries < 20) {
            await new Promise(resolve => setTimeout(resolve, 50));
            retries++;
        }
        
        // Kiểm tra Firestore SDK đã được load chưa
        if (typeof firebase.firestore === 'function') {
            db = firebase.firestore();
            console.log('[DEBUG] Firestore initialized successfully');
        } else {
            console.warn('[WARN] Firestore SDK not loaded after waiting, db will be null');
            console.warn('[WARN] Make sure firebase-firestore-compat.js is loaded before this script');
            db = null;
        }
        
        return { app, auth, db };
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return { app: null, auth: null, db: null };
    }
}

// Không auto-initialize nữa, sẽ được gọi khi cần
// Auto-initialize có thể gây lỗi nếu Firestore SDK chưa load

// Export
if (typeof window !== 'undefined') {
    window.firebaseConfig = { loadFirebaseConfig, initializeFirebase };
}

