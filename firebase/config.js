import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRm8WobPp2as_YBBiDQ1isp3ySFVCZfo8",
  authDomain: "cro101-1a551.firebaseapp.com",
  projectId: "cro101-1a551",
  storageBucket: "cro101-1a551.firebasestorage.app",
  messagingSenderId: "34923007154",
  appId: "1:34923007154:web:05cdfce3c349d3cc1f0dab",
  measurementId: "G-MVM5BY4E5J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  console.log("Auth already initialized or error:", error);
  auth = getAuth(app);
}

// Initialize Cloud Firestore
const db = getFirestore(app);

// Kiểm tra kết nối Firestore
console.log("🔥 Firestore initialized:", db ? "Success" : "Failed");

export { app, auth, db };

