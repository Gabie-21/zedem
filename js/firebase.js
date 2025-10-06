// Firebase configuration (replace with your project values)
// For security: consider loading these from environment at build time for production
const firebaseConfig = {
  apiKey: "AIzaSyATFnJ_nufdoN4QAcYLjxsZd-eANz988B8",
  authDomain: "zambia-emergency-response.firebaseapp.com",
  projectId: "zambia-emergency-response",
  storageBucket: "zambia-emergency-response.firebasestorage.app",
  messagingSenderId: "746207632001",
  appId: "1:746207632001:web:11754eaed394e960708b80",
  measurementId: "G-BLS7RYQKVB"
};

// Initialize Firebase
window.firebaseApp = firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.storage = firebase.storage();
window.auth = firebase.auth();

// Simple init check
window.isFirebaseReady = function () {
  try {
    return !!window.db && !!window.firebaseApp;
  } catch (e) {
    return false;
  }
};
