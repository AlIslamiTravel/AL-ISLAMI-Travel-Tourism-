import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB3nCRlfr2nUInbB6-q-zNK3CZ2DEtrJRQ",
    authDomain: "al-islami-travel.firebaseapp.com",
    projectId: "al-islami-travel",
    storageBucket: "al-islami-travel.firebasestorage.app",
    messagingSenderId: "1073262189366",
    appId: "1:1073262189366:web:2bca10a7dc378a72a83197",
    measurementId: "G-NG0015C15K"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
