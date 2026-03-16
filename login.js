// ================= SESSION CHECK =================

const savedUser = localStorage.getItem("crunkUser");

if(savedUser){
window.location.href = "home.html";
}

// ================= LABEL ANIMATION =================

window.addEventListener('load', () => {

const container = document.querySelector('.container');

container.style.opacity = 1;

const labels = document.querySelectorAll('.form-control label');

labels.forEach(label => {

label.innerHTML = label.innerText
.split('')
.map((letter, idx)=>
`<span style="transition-delay:${idx*30}ms">${letter}</span>`
)
.join('');

});

});

// ================= FIREBASE MODULAR SETUP =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBWW5kT1GqpIGou84aOfmo3y0osUd7rRQ",
    authDomain: "zchat-7b59a.firebaseapp.com",
    projectId: "zchat-7b59a",
    storageBucket: "zchat-7b59a.firebasestorage.app",
    messagingSenderId: "391204652656",
    appId: "1:391204652656:web:7c88d2bfb7ca2261ecd6b5",
    measurementId: "G-YB4MSXJ6QC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
window.auth = auth; // make auth globally accessible if needed

// ================= FORM LOGIN =================
const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!username || !email || !phone) {
        message.innerText = "Please fill all fields.";
        return;
    }

    // Basic email & phone validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        message.innerText = "Enter a valid email.";
        return;
    }
    if (!/^\+?\d{8,15}$/.test(phone)) {
        message.innerText = "Enter a valid phone number.";
        return;
    }

    try {
        const userId = "user_" + Date.now();

        // Save user to Firestore
        await setDoc(doc(db, "users", userId), {
            username,
            email,
            phone,
            loginMethod: "form",
            createdAt: new Date()
        });

        // Save session locally
        localStorage.setItem("crunkUser", JSON.stringify({ username, email, phone }));

        message.innerText = "Login successful!";
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1000);

    } catch (err) {
        console.error(err);
        message.innerText = "Error saving user.";
    }
});

// ================= GOOGLE LOGIN =================
window.handleCredentialResponse = async function(response) {
    const data = parseJwt(response.credential);

    const user = {
        username: data.name,
        email: data.email,
        picture: data.picture
    };

    try {
        // Save session locally
        localStorage.setItem("crunkUser", JSON.stringify(user));

        // Save user to Firestore
        await setDoc(doc(db, "users", data.sub), {
            username: data.name,
            email: data.email,
            picture: data.picture,
            loginMethod: "google",
            createdAt: new Date()
        });

        // Redirect to home
        window.location.href = "home.html";

    } catch (err) {
        console.error(err);
        message.innerText = "Error saving Google user.";
    }
}

// ================= JWT PARSER =================
function parseJwt(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}
