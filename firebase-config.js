/**
 * firebase-config.js — Firebase configuration keys
 * 
 * Replace the placeholders below with the keys you copy from:
 * Firebase Console → Project Settings (Gear icon) → Your Apps → Web App config.
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
} else {
  console.error("Firebase SDK not loaded. Make sure script tags are included in index.html");
}
