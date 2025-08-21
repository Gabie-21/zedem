// firebase-config.js
// Firebase configuration for Zambia Emergency Response System

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyATFnJ_nufdoN4QAcYLjXsZd-eANz988h8",
  authDomain: "zambia-emergency-response.firebaseapp.com",
  projectId: "zambia-emergency-response",
  storageBucket: "zambia-emergency-response.firebasestorage.app",
  messagingSenderId: "745207632001",
  appId: "1:745207632001:web:11754eaed394e960708b80",
  measurementId: "G-BLS7RYQKVB"
};

// Import Firebase SDK modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics only if supported
let analytics = null;
try {
  if (await isSupported()) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn('Analytics not supported:', error);
}
export { analytics };

// Initialize Messaging only if supported
let messaging = null;
try {
  if (await isMessagingSupported()) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Messaging not supported:', error);
}
export { messaging };

// Collection names for consistency
export const COLLECTIONS = {
  EMERGENCIES: 'emergencies',
  RESPONDERS: 'responders',
  USERS: 'users',
  MESSAGES: 'emergency_messages',
  NOTIFICATIONS: 'notifications',
  EMERGENCY_CONTACTS: 'emergency_contacts',
  LOCATIONS: 'emergency_locations'
};

// Emergency types with additional metadata
export const EMERGENCY_TYPES = {
  MEDICAL: {
    id: 'medical',
    name: 'Medical Emergency',
    priority: 'P1',
    icon: '🏥',
    color: '#dc2626',
    description: 'Life-threatening medical situation requiring immediate response',
    requiredResponders: ['medical', 'first_aid', 'paramedic']
  },
  FIRE: {
    id: 'fire',
    name: 'Fire Emergency',
    priority: 'P1',
    icon: '🔥',
    color: '#ea580c',
    description: 'Fire or dangerous situation requiring immediate fire service response',
    requiredResponders: ['fire', 'rescue']
  },
  POLICE: {
    id: 'police',
    name: 'Police Required',
    priority: 'P2',
    icon: '👮',
    color: '#2563eb',
    description: 'Security incident or crime requiring police response',
    requiredResponders: ['police', 'security']
  },
  GENERAL: {
    id: 'general',
    name: 'General Emergency',
    priority: 'P3',
    icon: '⚠️',
    color: '#ca8a04',
    description: 'Other emergency situations requiring assistance',
    requiredResponders: ['general', 'community']
  }
};

// Emergency priorities with response times
export const EMERGENCY_PRIORITIES = {
  P1: {
    name: 'CRITICAL',
    description: 'Life-threatening emergency',
    targetResponseTime: 5, // minutes
    color: '#dc2626',
    notificationSound: 'critical',
    autoDispatch: true
  },
  P2: {
    name: 'URGENT',
    description: 'Urgent response needed',
    targetResponseTime: 10,
    color: '#ea580c',
    notificationSound: 'urgent',
    autoDispatch: true
  },
  P3: {
    name: 'IMPORTANT',
    description: 'Important but not critical',
    targetResponseTime: 20,
    color: '#ca8a04',
    notificationSound: 'normal',
    autoDispatch: false
  }
};

// Responder types and capabilities
export const RESPONDER_TYPES = {
  MEDICAL: {
    id: 'medical',
    name: 'Medical Professional',
    capabilities: ['medical_treatment', 'first_aid', 'emergency_medicine'],
    equipment: ['medical_bag', 'defibrillator', 'oxygen'],
    certification_required: true
  },
  FIRST_AID: {
    id: 'first_aid',
    name: 'First Aid Responder',
    capabilities: ['basic_first_aid', 'cpr', 'basic_life_support'],
    equipment: ['first_aid_kit', 'aed'],
    certification_required: true
  },
  FIRE: {
    id: 'fire',
    name: 'Fire & Rescue',
    capabilities: ['fire_suppression', 'rescue', 'hazmat'],
    equipment: ['fire_truck', 'rescue_equipment', 'protective_gear'],
    certification_required: true
  },
  POLICE: {
    id: 'police',
    name: 'Police Officer',
    capabilities: ['law_enforcement', 'traffic_control', 'crowd_control'],
    equipment: ['patrol_vehicle', 'communication_radio'],
    certification_required: true
  },
  COMMUNITY: {
    id: 'community',
    name: 'Community Volunteer',
    capabilities: ['basic_assistance', 'local_knowledge', 'coordination'],
    equipment: ['mobile_phone', 'transportation'],
    certification_required: false
  }
};

// Zambia-specific emergency contacts
export const ZAMBIA_EMERGENCY_CONTACTS = {
  NATIONAL: {
    EMERGENCY_SERVICES: '911',
    POLICE: '999',
    FIRE_BRIGADE: '993',
    AMBULANCE: '992',
    DISASTER_MANAGEMENT: '991'
  },
  LUSAKA: {
    UTH_EMERGENCY: '+260211256067',
    LUSAKA_CENTRAL_POLICE: '+260211228794',
    FIRE_STATION: '+260211228844',
    DISASTER_MANAGEMENT: '+260211254509'
  },
  COPPERBELT: {
    KITWE_CENTRAL_HOSPITAL: '+260212221355',
    NDOLA_CENTRAL_HOSPITAL: '+260212612100',
    COPPERBELT_POLICE: '+260212210025'
  },
  SOUTHERN: {
    LIVINGSTONE_HOSPITAL: '+260213320946',
    CHOMA_HOSPITAL: '+260213220251'
  }
};

// Application settings
export const APP_SETTINGS = {
  DEFAULT_LOCATION: {
    lat: -15.3875,
    lng: 28.3228,
    name: 'Lusaka, Zambia'
  },
  GEOLOCATION_OPTIONS: {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000
  },
  RESPONDER_SEARCH_RADIUS: 10, // kilometers
  MAX_RESPONDERS_TO_NOTIFY: 5,
  EMERGENCY_TIMEOUT: 30, // minutes before auto-cancellation check
  OFFLINE_SYNC_RETRY_INTERVAL: 30000, // 30 seconds
  NOTIFICATION_SETTINGS: {
    vibration: true,
    sound: true,
    badge: true
  }
};

// Initialize Push Messaging if supported
export async function initializePushMessaging() {
  if (!messaging) {
    console.warn('Push messaging not supported');
    return null;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY_HERE' // Replace with your VAPID key
    });

    if (token) {
      console.log('FCM registration token:', token);
      return token;
    } else {
      console.warn('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Handle foreground messages
export function handleForegroundMessages(callback) {
  if (!messaging) {
    console.warn('Messaging not available');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Call the provided callback
    if (callback && typeof callback === 'function') {
      callback(payload);
    }
    
    // Show notification if the app is in focus
    if (payload.notification) {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'emergency-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200]
      });
    }
  });
}

// Firestore security rules helper
export const FIRESTORE_RULES = {
  // These are the security rules that should be applied in Firebase console
  rules: `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow authenticated users to read and write their own emergencies
        match /emergencies/{emergencyId} {
          allow read, write: if request.auth != null && 
            (resource == null || resource.data.userId == request.auth.uid);
        }
        
        // Allow authenticated responders to read emergencies in their area
        match /emergencies/{emergencyId} {
          allow read: if request.auth != null && 
            exists(/databases/$(database)/documents/responders/$(request.auth.uid));
        }
        
        // Allow authenticated users to manage their responder profile
        match /responders/{responderId} {
          allow read, write: if request.auth != null && 
            (resource == null || resource.data.userId == request.auth.uid);
        }
        
        // Allow reading public emergency contacts and locations
        match /emergency_contacts/{contactId} {
          allow read: if true;
        }
        
        match /emergency_locations/{locationId} {
          allow read: if true;
        }
        
        // Emergency messages - allow read/write for emergency participants
        match /emergency_messages/{messageId} {
          allow read, write: if request.auth != null;
        }
        
        // User profiles
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  `
};

// Database initialization functions
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // In development, you might want to connect to emulator
    if (location.hostname === 'localhost' && !window.FIREBASE_EMULATOR_INITIALIZED) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      window.FIREBASE_EMULATOR_INITIALIZED = true;
      console.log('Connected to Firebase emulator');
    }
    
    console.log('Database initialization complete');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Utility function to get emergency type info
export function getEmergencyTypeInfo(typeId) {
  return EMERGENCY_TYPES[typeId.toUpperCase()] || EMERGENCY_TYPES.GENERAL;
}

// Utility function to get priority info
export function getPriorityInfo(priorityId) {
  return EMERGENCY_PRIORITIES[priorityId] || EMERGENCY_PRIORITIES.P3;
}

// Utility function to format emergency contacts for display
export function getEmergencyContactsForLocation(location = 'NATIONAL') {
  return ZAMBIA_EMERGENCY_CONTACTS[location.toUpperCase()] || ZAMBIA_EMERGENCY_CONTACTS.NATIONAL;
}

// Error handling for Firebase operations
export function handleFirebaseError(error) {
  console.error('Firebase error:', error);
  
  const errorMessages = {
    'auth/user-not-found': 'User not found. Please check your credentials.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'permission-denied': 'Access denied. Please check your permissions.',
    'unavailable': 'Service temporarily unavailable. Please try again later.',
    'deadline-exceeded': 'Request timed out. Please try again.',
  };
  
  return errorMessages[error.code] || error.message || 'An unknown error occurred.';
}

console.log('Firebase configuration loaded successfully for Zambia Emergency Response System');

// Export the initialized app instance
export default app;