/**
 * GEOGRAPHY EDU - FIREBASE CONFIGURATION
 * High School Help Kit Project
 * 
 * Firebase Firestore replaces localStorage for cloud-based,
 * real-time data synchronization across all users and devices.
 */

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKTTOdnqXNstS1zDFunLMlx3rlEc5Q1mA",
  authDomain: "hshk-38bf1.firebaseapp.com",
  projectId: "hshk-38bf1",
  storageBucket: "hshk-38bf1.firebasestorage.app",
  messagingSenderId: "96036069171",
  appId: "1:96036069171:web:184bb95989b5d6b99ae846",
  measurementId: "G-J75CMK1DV2"
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Firebase Authentication + Google Provider
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
// Luôn hiển thị popup chọn tài khoản Google
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firebase Cloud Storage
let storage = null;
try {
  if (firebase.storage) {
    storage = firebase.storage();
  }
} catch (storageErr) {
  console.warn("[Firebase Storage] Storage init notice:", storageErr);
}

// Initialize Firebase Analytics
let analytics = null;
try {
  if (firebase.analytics) {
    analytics = firebase.analytics();
  }
} catch (analyticsErr) {
  console.warn("[Firebase Analytics] Analytics init notice:", analyticsErr);
}

// Expose globally
window.firebaseApp = firebaseApp;
window.db = db;
window.auth = auth;
window.googleProvider = googleProvider;
window.storage = storage;
window.analytics = analytics;

console.log("[Firebase] Initialized successfully — Project:", firebaseConfig.projectId);
