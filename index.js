
import { auth, db } from "./firebase.config.js";

import {
    setDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

// AUTHENTICATION STATE
onAuthStateChanged(auth, (user) => {
    const isDashboard = window.location.pathname.endsWith(
        "/dashboard/dashboard.html"
    );

    if (!user && isDashboard) {
        window.location.replace("../login/login.html");
    }
});

// LOGIN
const login = async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);

        window.location.href = "../dashboard/dashboard.html";

    } catch (error) {
        console.error("Login error:", error.code, error.message);
        alert(error.message);
    }
};

// REGISTER
const register = async (event) => {
    event.preventDefault();

    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;

    if (name.length < 2) {
        alert("Please enter your full name.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        // Save the name and account details in Firestore.
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            username: name,
            fullName: name,
            phone: "",
            uid: user.uid,
        });

        // Registration is complete. Ask the user to log in.
        await signOut(auth);

        alert("Account created successfully! Please log in.");

        window.location.href = "../login/login.html";

    } catch (error) {
        console.error("Registration error:", error.code, error.message);
        alert(error.message);
    }
};

// LOGOUT
const logout = async () => {
    try {
        await signOut(auth);
        window.location.href = "../login/login.html";

    } catch (error) {
        console.error("Logout error:", error.message);
        alert("Could not log out. Please try again.");
    }
};

// EVENT LISTENERS
document.getElementById("login-form")
    ?.addEventListener("submit", login);

document.getElementById("register-form")
    ?.addEventListener("submit", register);

document.getElementById("logout")
    ?.addEventListener("click", logout);
