// src/config/Firebase.ts
import { Platform } from 'react-native';

let firebaseApp: any = null;
let analytics: any = null;
let crashlytics: any = null;

// Initialize Firebase with proper error handling
export const initializeFirebase = async () => {
  try {
    console.log('🔥 Initializing Firebase...');
    
    // Import Firebase modules
    const { default: firebase } = await import('@react-native-firebase/app');
    
    // Check if Firebase is already initialized
    if (firebase.apps.length === 0) {
      console.log('⚠️ No Firebase apps found - this might indicate a configuration issue');
      return false;
    }
    
    firebaseApp = firebase.app();
    console.log('✅ Firebase app initialized');
    
    // Initialize Analytics
    try {
      const analyticsModule = await import('@react-native-firebase/analytics');
      analytics = analyticsModule.default();
      await analytics.setAnalyticsCollectionEnabled(true);
      console.log('📊 Firebase Analytics initialized');
    } catch (error) {
      console.log('⚠️ Firebase Analytics not available:', error);
    }
    
    // Initialize Crashlytics
    try {
      const crashlyticsModule = await import('@react-native-firebase/crashlytics');
      crashlytics = crashlyticsModule.default();
      console.log('🔴 Firebase Crashlytics initialized');
    } catch (error) {
      console.log('⚠️ Firebase Crashlytics not available:', error);
    }
    
    console.log('✅ Firebase initialized successfully');
    return true;
  } catch (error) {
    console.log('❌ Firebase initialization failed:', error);
    return false;
  }
};

// Export Firebase instances
export { firebaseApp, analytics, crashlytics };

// Firebase configuration object (for manual initialization if needed)
export const firebaseConfig = {
  // These will be automatically read from google-services.json/GoogleService-Info.plist
  // Only add these if you need manual configuration
  apiKey: __DEV__ ? 'your-dev-api-key' : 'your-prod-api-key',
  authDomain: 'brainbites-app.firebaseapp.com',
  projectId: 'brainbites-app',
  storageBucket: 'brainbites-app.appspot.com',
  messagingSenderId: '123456789',
  appId: Platform.OS === 'ios' ? 'ios-app-id' : 'android-app-id',
  measurementId: 'G-MEASUREMENT-ID',
};