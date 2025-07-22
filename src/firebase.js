// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage' // Importa getStorage

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvq5lBPYoive5kzKByrGYcGsHYuVol-lQ",
  authDomain: "app-negocio-pos.firebaseapp.com",
  projectId: "app-negocio-pos",
  storageBucket: "app-negocio-pos.firebasestorage.app",
  messagingSenderId: "999289024531",
  appId: "1:999289024531:web:cb3628c3a25dcc05cb8fe6",
  measurementId: "G-72WN6KFG9X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const storage = getStorage(app) // Crea la instancia de storage


export const auth = getAuth(app)
export const db = getFirestore(app)

const analytics = getAnalytics(app);

export { storage }
