import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app: FirebaseApp | undefined;
let auth: any;
let db: any;

const initFirebase = async () => {
  try {
    // Using a more robust way to check for existence without breaking build
    // We'll try to fetch it as a static asset or use a dynamic import that we catch
    // Since it's in the root, it might not be in the src folder.
    const config = await import(/* @vite-ignore */ '../../firebase-applet-config.json').catch(() => null);
    
    if (config && config.default) {
      const firebaseConfig = config.default;
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('Firebase initialized successfully');
    } else {
      console.warn('Firebase config missing. Using local storage mode.');
    }
  } catch (e) {
    console.warn('Firebase initialization failed:', e);
  }
};

// Start initialization
initFirebase();

export { app, auth, db };

// Helper to check if firebase is ready
export const isFirebaseReady = () => !!app && !!db;
