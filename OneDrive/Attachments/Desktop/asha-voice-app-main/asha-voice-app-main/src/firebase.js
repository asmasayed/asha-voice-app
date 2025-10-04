// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9M3AlemXiG-G7abR55O6RiSq5UvIll44",
  authDomain: "asha-voice-app.firebaseapp.com",
  projectId: "asha-voice-app",
  storageBucket: "asha-voice-app.firebasestorage.app",
  messagingSenderId: "561462785007",
  appId: "1:561462785007:web:b48e32fe3386c2b13bbc1a",
  measurementId: "G-KF1HWD1QNM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
// We will use these exports in other parts of our app
export const auth = getAuth(app);
export const db = getFirestore(app);
