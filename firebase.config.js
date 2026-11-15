import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDjGfXBUbpOkICXTDA2V2MJNGlI8Jui8qQ",
    authDomain: "fire-base-auth-59dc4.firebaseapp.com",
    projectId: "fire-base-auth-59dc4",
    storageBucket: "fire-base-auth-59dc4.firebasestorage.app",
    messagingSenderId: "1033255833252",
    appId: "1:1033255833252:web:8044a24b865aef8fbe2031",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);