// Import only the functions we need
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, setLogLevel, doc, setDoc, onSnapshot } from "firebase/firestore";

// --- !! IMPORTANT !! ---
// PASTE YOUR FIREBASE CONFIG OBJECT FROM STEP 1 HERE
const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.FIREBASE_SENDER_ID,
  appId: import.meta.env.FIREBASE_APP_ID,
  measurementId: import.meta.env.FIREBASE_MEASUREMENT_ID
};
// --- !! END OF CONFIG !! ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setLogLevel('debug'); // Enable detailed Firestore logs

// Define the simple, public path for the graph document
const graphDocPath = "graph/mainGraph";
const graphDocRef = doc(db, graphDocPath);

// Sign in anonymously right away
signInAnonymously(auth).catch((error) => {
  console.error("Anonymous sign-in failed:", error);
});

// Export the functions and refs we'll need in other files
export { db, auth, graphDocRef, setDoc, onSnapshot };
