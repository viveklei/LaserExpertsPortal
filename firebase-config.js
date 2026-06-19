/**
 * firebase-config.js — Firebase configuration keys
 * 
 * Replace the placeholders below with the keys you copy from:
 * Firebase Console → Project Settings (Gear icon) → Your Apps → Web App config.
 */

const firebaseConfig = {
  apiKey: "AIzaSyBteNVxRR7cMhPtQ8z68zz8y_X-c1umIYY",
  authDomain: "laser-experts-india-portal.firebaseapp.com",
  projectId: "laser-experts-india-portal",
  storageBucket: "laser-experts-india-portal.firebasestorage.app",
  messagingSenderId: "1014113880303",
  appId: "1:1014113880303:web:514ee04f7219daa057731a"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
} else {
  console.error("Firebase SDK not loaded. Make sure script tags are included in index.html");
}
