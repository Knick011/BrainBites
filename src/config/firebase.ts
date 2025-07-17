// src/config/Firebase.ts
// Firebase Analytics App ID: 1:1089165314678:android:bb38e368be58e1e488ad57
// Project ID: brainbites-analytics
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

export const initializeFirebase = async () => {
  try {
    // Enable Analytics collection
    await analytics().setAnalyticsCollectionEnabled(true);
    
    // Enable Crashlytics
    await crashlytics().setCrashlyticsCollectionEnabled(true);
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
};

// Analytics helper functions
export const logEvent = async (eventName: string, params?: any) => {
  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.error('Analytics log error:', error);
  }
};

export const logScreenView = async (screenName: string) => {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.error('Screen view log error:', error);
  }
};

// User properties
export const setUserProperties = async (properties: { [key: string]: string }) => {
  try {
    for (const [key, value] of Object.entries(properties)) {
      await analytics().setUserProperty(key, value);
    }
  } catch (error) {
    console.error('User properties error:', error);
  }
};

// Crashlytics helpers
export const logError = (error: Error, errorInfo?: any) => {
  crashlytics().recordError(error, errorInfo);
};

export const setUserId = async (userId: string) => {
  try {
    await analytics().setUserId(userId);
    await crashlytics().setUserId(userId);
  } catch (error) {
    console.error('Set user ID error:', error);
  }
};