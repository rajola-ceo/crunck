// ================= SESSION CHECK =================
const savedUser = localStorage.getItem("crunkUser");
if (savedUser) {
    window.location.href = "home.html";
}

// ================= LABEL ANIMATION =================
window.addEventListener('load', () => {
    const container = document.querySelector('.container');
    if (container) container.style.opacity = 1;

    const labels = document.querySelectorAll('.form-control label');
    labels.forEach(label => {
        label.innerHTML = label.innerText
            .split('')
            .map((letter, idx) => `<span style="transition-delay:${idx * 30}ms">${letter}</span>`)
            .join('');
    });
});

// ================= FIREBASE MODULAR SETUP =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    isSignInWithEmailLink,
    sendSignInLinkToEmail
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    query,
    where,
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

window.auth = auth; // make auth globally accessible if needed

// ================= COUNTRY CODES =================
const countryCodes = [
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+91", country: "India" },
    { code: "+61", country: "Australia" },
    { code: "+86", country: "China" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+39", country: "Italy" },
    { code: "+34", country: "Spain" },
    { code: "+55", country: "Brazil" },
    { code: "+7", country: "Russia" },
    { code: "+82", country: "South Korea" },
    { code: "+52", country: "Mexico" },
    { code: "+27", country: "South Africa" },
    { code: "+20", country: "Egypt" },
    { code: "+234", country: "Nigeria" },
    { code: "+254", country: "Kenya" },
    { code: "+233", country: "Ghana" },
    { code: "+971", country: "UAE" },
    { code: "+966", country: "Saudi Arabia" },
    { code: "+972", country: "Israel" },
    { code: "+90", country: "Turkey" },
    { code: "+48", country: "Poland" },
    { code: "+31", country: "Netherlands" },
    { code: "+46", country: "Sweden" },
    { code: "+47", country: "Norway" },
    { code: "+45", country: "Denmark" },
    { code: "+358", country: "Finland" },
    { code: "+41", country: "Switzerland" },
    { code: "+43", country: "Austria" },
    { code: "+32", country: "Belgium" },
    { code: "+351", country: "Portugal" },
    { code: "+30", country: "Greece" },
    { code: "+54", country: "Argentina" },
    { code: "+56", country: "Chile" },
    { code: "+57", country: "Colombia" },
    { code: "+51", country: "Peru" },
    { code: "+58", country: "Venezuela" },
    { code: "+60", country: "Malaysia" },
    { code: "+65", country: "Singapore" },
    { code: "+66", country: "Thailand" },
    { code: "+84", country: "Vietnam" },
    { code: "+63", country: "Philippines" },
    { code: "+62", country: "Indonesia" }
];

// ================= POPULATE COUNTRY CODE SELECT =================
function populateCountryCodes() {
    const countryCodeSelect = document.getElementById("countryCode");
    if (!countryCodeSelect) return;
    
    countryCodes.forEach(country => {
        const option = document.createElement("option");
        option.value = country.code;
        option.textContent = `${country.country} ${country.code}`;
        countryCodeSelect.appendChild(option);
    });
}

// Call on load
document.addEventListener('DOMContentLoaded', populateCountryCodes);

// ================= FORM LOGIN =================
const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const countryCode = document.getElementById("countryCode")?.value || "+1";
    const phoneNumber = document.getElementById("phone").value.trim();
    const fullPhoneNumber = countryCode + phoneNumber;

    if (!username || !email || !phoneNumber) {
        showMessage("Please fill all fields.", "error");
        return;
    }

    // Username validation
    if (username.length < 3) {
        showMessage("Username must be at least 3 characters.", "error");
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showMessage("Username can only contain letters, numbers, and underscores.", "error");
        return;
    }

    // Email validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showMessage("Enter a valid email address.", "error");
        return;
    }

    // Phone validation (after country code)
    if (!/^\d{7,15}$/.test(phoneNumber)) {
        showMessage("Enter a valid phone number (7-15 digits).", "error");
        return;
    }

    try {
        showLoader(true);
        
        // Check if user already exists with this email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // User exists - log them in
            const existingUser = querySnapshot.docs[0].data();
            localStorage.setItem("crunkUser", JSON.stringify({
                username: existingUser.username,
                email: existingUser.email,
                phone: existingUser.phone,
                userId: querySnapshot.docs[0].id
            }));
            
            showMessage("Login successful! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1000);
            return;
        }

        // Create new user
        const userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

        // Save user to Firestore
        await setDoc(doc(db, "users", userId), {
            username,
            email,
            phone: fullPhoneNumber,
            countryCode,
            phoneNumber: phoneNumber,
            loginMethod: "form",
            createdAt: new Date().toISOString(),
            userId: userId,
            lastLogin: new Date().toISOString()
        });

        // Save session locally
        localStorage.setItem("crunkUser", JSON.stringify({ 
            username, 
            email, 
            phone: fullPhoneNumber,
            userId 
        }));

        showMessage("Registration successful! Redirecting...", "success");
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1000);

    } catch (err) {
        console.error("Login error:", err);
        showMessage("Error processing login. Please try again.", "error");
    } finally {
        showLoader(false);
    }
});

// ================= GOOGLE LOGIN =================
async function handleGoogleLogin() {
    try {
        showLoader(true);
        
        // Sign in with Google popup
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            // Existing user - log them in
            const userData = userDoc.data();
            localStorage.setItem("crunkUser", JSON.stringify({
                username: userData.username || user.displayName,
                email: user.email,
                picture: user.photoURL,
                userId: user.uid
            }));
        } else {
            // New Google user - save to Firestore
            const newUser = {
                username: user.displayName,
                email: user.email,
                picture: user.photoURL,
                loginMethod: "google",
                createdAt: new Date().toISOString(),
                userId: user.uid,
                lastLogin: new Date().toISOString(),
                emailVerified: user.emailVerified
            };
            
            await setDoc(userDocRef, newUser);
            
            localStorage.setItem("crunkUser", JSON.stringify({
                username: user.displayName,
                email: user.email,
                picture: user.photoURL,
                userId: user.uid
            }));
        }
        
        showMessage("Google login successful! Redirecting...", "success");
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1000);
        
    } catch (error) {
        console.error("Google login error:", error);
        
        // Handle specific errors
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                showMessage("Login cancelled. Please try again.", "info");
                break;
            case 'auth/popup-blocked':
                showMessage("Popup was blocked by your browser. Please allow popups.", "error");
                break;
            case 'auth/account-exists-with-different-credential':
                showMessage("An account already exists with the same email but different sign-in method.", "error");
                break;
            default:
                showMessage("Error with Google login. Please try again.", "error");
        }
    } finally {
        showLoader(false);
    }
}

// Handle redirect result (for mobile)
async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            handleGoogleLogin();
        }
    } catch (error) {
        console.error("Redirect error:", error);
    }
}

// Call on page load
handleRedirectResult();

// ================= HELPER FUNCTIONS =================
function showMessage(text, type = "info") {
    if (!message) return;
    
    message.innerText = text;
    message.className = `message ${type}`;
    
    // Auto hide after 3 seconds for success messages
    if (type === "success") {
        setTimeout(() => {
            message.innerText = "";
            message.className = "message";
        }, 3000);
    }
}

function showLoader(show) {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = show ? "flex" : "none";
    }
}

// ================= ALTERNATIVE LOGIN METHODS =================
// Email link login (passwordless)
async function sendEmailLink(email) {
    const actionCodeSettings = {
        url: window.location.origin + '/finish-signup',
        handleCodeInApp: true
    };
    
    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        showMessage("Login link sent to your email!", "success");
    } catch (error) {
        console.error("Email link error:", error);
        showMessage("Error sending login link.", "error");
    }
}

// Phone number login (if needed)
async function handlePhoneLogin(phoneNumber) {
    // This would require additional setup with Firebase Phone Auth
    // and is more complex - you can implement if needed
    showMessage("Phone login coming soon!", "info");
}

// ================= EXPOSE FUNCTIONS GLOBALLY =================
window.handleGoogleLogin = handleGoogleLogin;
window.sendEmailLink = sendEmailLink;

// ================= JWT PARSER (keeping for backward compatibility) =================
function parseJwt(token) {
    try {
        let base64Url = token.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        let jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error parsing JWT:", e);
        return {};
    }
}

// ================= ADDITIONAL VALIDATION =================
// Real-time validation for username
const usernameInput = document.getElementById("username");
if (usernameInput) {
    usernameInput.addEventListener("input", (e) => {
        const value = e.target.value;
        const errorSpan = document.getElementById("usernameError");
        if (errorSpan) {
            if (value.length < 3) {
                errorSpan.textContent = "Username too short";
            } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                errorSpan.textContent = "Only letters, numbers, _";
            } else {
                errorSpan.textContent = "";
            }
        }
    });
}

// Real-time validation for email
const emailInput = document.getElementById("email");
if (emailInput) {
    emailInput.addEventListener("input", (e) => {
        const value = e.target.value;
        const errorSpan = document.getElementById("emailError");
        if (errorSpan) {
            if (!/^\S+@\S+\.\S+$/.test(value) && value.length > 0) {
                errorSpan.textContent = "Invalid email format";
            } else {
                errorSpan.textContent = "";
            }
        }
    });
}

// Real-time validation for phone
const phoneInput = document.getElementById("phone");
if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
        const value = e.target.value;
        const errorSpan = document.getElementById("phoneError");
        if (errorSpan) {
            if (!/^\d+$/.test(value) && value.length > 0) {
                errorSpan.textContent = "Only numbers allowed";
            } else if (value.length > 0 && (value.length < 7 || value.length > 15)) {
                errorSpan.textContent = "Phone must be 7-15 digits";
            } else {
                errorSpan.textContent = "";
            }
        }
    });
}

console.log("Login system initialized with Google OAuth and country codes!");
