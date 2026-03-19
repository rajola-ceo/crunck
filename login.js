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
    getRedirectResult
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

// ================= FIREBASE CONFIG (SAME AS CHAT APP) =================
const firebaseConfig = {
    apiKey: "AIzaSyBW0Sz7TODfa8tQJTfNUaLhfK9qJhdA1yE",
    authDomain: "crunck-app.firebaseapp.com",
    projectId: "crunck-app",
    storageBucket: "crunck-app.firebasestorage.app",
    messagingSenderId: "475953302982",
    appId: "1:475953302982:web:607e08379adb12f985f6c7",
    measurementId: "G-7ZQ20HK4SD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

window.auth = auth;
window.db = db;

// ================= COUNTRY CODES API =================
async function fetchCountryCodes() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags');
        const countries = await response.json();
        
        return countries
            .filter(country => country.idd?.root && country.idd?.suffixes?.[0])
            .map(country => {
                const root = country.idd.root;
                const suffix = country.idd.suffixes[0];
                const code = root + suffix;
                const flagUrl = country.flags?.png || country.flags?.svg;
                
                return {
                    code: code,
                    country: country.name.common,
                    flag: flagUrl,
                    cca2: country.cca2.toLowerCase()
                };
            })
            .sort((a, b) => a.country.localeCompare(b.country));
    } catch (error) {
        console.error('Error fetching countries:', error);
        return getFallbackCountryCodes();
    }
}

// ================= FALLBACK COUNTRY CODES =================
function getFallbackCountryCodes() {
    return [
        { code: "+93", country: "Afghanistan", flag: "https://flagcdn.com/af.png" },
        { code: "+355", country: "Albania", flag: "https://flagcdn.com/al.png" },
        { code: "+213", country: "Algeria", flag: "https://flagcdn.com/dz.png" },
        { code: "+376", country: "Andorra", flag: "https://flagcdn.com/ad.png" },
        { code: "+244", country: "Angola", flag: "https://flagcdn.com/ao.png" },
        { code: "+54", country: "Argentina", flag: "https://flagcdn.com/ar.png" },
        { code: "+374", country: "Armenia", flag: "https://flagcdn.com/am.png" },
        { code: "+61", country: "Australia", flag: "https://flagcdn.com/au.png" },
        { code: "+43", country: "Austria", flag: "https://flagcdn.com/at.png" },
        { code: "+994", country: "Azerbaijan", flag: "https://flagcdn.com/az.png" },
        { code: "+973", country: "Bahrain", flag: "https://flagcdn.com/bh.png" },
        { code: "+880", country: "Bangladesh", flag: "https://flagcdn.com/bd.png" },
        { code: "+375", country: "Belarus", flag: "https://flagcdn.com/by.png" },
        { code: "+32", country: "Belgium", flag: "https://flagcdn.com/be.png" },
        { code: "+501", country: "Belize", flag: "https://flagcdn.com/bz.png" },
        { code: "+229", country: "Benin", flag: "https://flagcdn.com/bj.png" },
        { code: "+975", country: "Bhutan", flag: "https://flagcdn.com/bt.png" },
        { code: "+591", country: "Bolivia", flag: "https://flagcdn.com/bo.png" },
        { code: "+387", country: "Bosnia and Herzegovina", flag: "https://flagcdn.com/ba.png" },
        { code: "+267", country: "Botswana", flag: "https://flagcdn.com/bw.png" },
        { code: "+55", country: "Brazil", flag: "https://flagcdn.com/br.png" },
        { code: "+673", country: "Brunei", flag: "https://flagcdn.com/bn.png" },
        { code: "+359", country: "Bulgaria", flag: "https://flagcdn.com/bg.png" },
        { code: "+226", country: "Burkina Faso", flag: "https://flagcdn.com/bf.png" },
        { code: "+257", country: "Burundi", flag: "https://flagcdn.com/bi.png" },
        { code: "+855", country: "Cambodia", flag: "https://flagcdn.com/kh.png" },
        { code: "+237", country: "Cameroon", flag: "https://flagcdn.com/cm.png" },
        { code: "+1", country: "Canada", flag: "https://flagcdn.com/ca.png" },
        { code: "+238", country: "Cape Verde", flag: "https://flagcdn.com/cv.png" },
        { code: "+236", country: "Central African Republic", flag: "https://flagcdn.com/cf.png" },
        { code: "+235", country: "Chad", flag: "https://flagcdn.com/td.png" },
        { code: "+56", country: "Chile", flag: "https://flagcdn.com/cl.png" },
        { code: "+86", country: "China", flag: "https://flagcdn.com/cn.png" },
        { code: "+57", country: "Colombia", flag: "https://flagcdn.com/co.png" },
        { code: "+269", country: "Comoros", flag: "https://flagcdn.com/km.png" },
        { code: "+242", country: "Congo", flag: "https://flagcdn.com/cg.png" },
        { code: "+506", country: "Costa Rica", flag: "https://flagcdn.com/cr.png" },
        { code: "+385", country: "Croatia", flag: "https://flagcdn.com/hr.png" },
        { code: "+53", country: "Cuba", flag: "https://flagcdn.com/cu.png" },
        { code: "+357", country: "Cyprus", flag: "https://flagcdn.com/cy.png" },
        { code: "+420", country: "Czech Republic", flag: "https://flagcdn.com/cz.png" },
        { code: "+45", country: "Denmark", flag: "https://flagcdn.com/dk.png" },
        { code: "+253", country: "Djibouti", flag: "https://flagcdn.com/dj.png" },
        { code: "+593", country: "Ecuador", flag: "https://flagcdn.com/ec.png" },
        { code: "+20", country: "Egypt", flag: "https://flagcdn.com/eg.png" },
        { code: "+503", country: "El Salvador", flag: "https://flagcdn.com/sv.png" },
        { code: "+240", country: "Equatorial Guinea", flag: "https://flagcdn.com/gq.png" },
        { code: "+291", country: "Eritrea", flag: "https://flagcdn.com/er.png" },
        { code: "+372", country: "Estonia", flag: "https://flagcdn.com/ee.png" },
        { code: "+251", country: "Ethiopia", flag: "https://flagcdn.com/et.png" },
        { code: "+679", country: "Fiji", flag: "https://flagcdn.com/fj.png" },
        { code: "+358", country: "Finland", flag: "https://flagcdn.com/fi.png" },
        { code: "+33", country: "France", flag: "https://flagcdn.com/fr.png" },
        { code: "+241", country: "Gabon", flag: "https://flagcdn.com/ga.png" },
        { code: "+220", country: "Gambia", flag: "https://flagcdn.com/gm.png" },
        { code: "+995", country: "Georgia", flag: "https://flagcdn.com/ge.png" },
        { code: "+49", country: "Germany", flag: "https://flagcdn.com/de.png" },
        { code: "+233", country: "Ghana", flag: "https://flagcdn.com/gh.png" },
        { code: "+30", country: "Greece", flag: "https://flagcdn.com/gr.png" },
        { code: "+299", country: "Greenland", flag: "https://flagcdn.com/gl.png" },
        { code: "+502", country: "Guatemala", flag: "https://flagcdn.com/gt.png" },
        { code: "+224", country: "Guinea", flag: "https://flagcdn.com/gn.png" },
        { code: "+245", country: "Guinea-Bissau", flag: "https://flagcdn.com/gw.png" },
        { code: "+592", country: "Guyana", flag: "https://flagcdn.com/gy.png" },
        { code: "+509", country: "Haiti", flag: "https://flagcdn.com/ht.png" },
        { code: "+504", country: "Honduras", flag: "https://flagcdn.com/hn.png" },
        { code: "+852", country: "Hong Kong", flag: "https://flagcdn.com/hk.png" },
        { code: "+36", country: "Hungary", flag: "https://flagcdn.com/hu.png" },
        { code: "+354", country: "Iceland", flag: "https://flagcdn.com/is.png" },
        { code: "+91", country: "India", flag: "https://flagcdn.com/in.png" },
        { code: "+62", country: "Indonesia", flag: "https://flagcdn.com/id.png" },
        { code: "+98", country: "Iran", flag: "https://flagcdn.com/ir.png" },
        { code: "+964", country: "Iraq", flag: "https://flagcdn.com/iq.png" },
        { code: "+353", country: "Ireland", flag: "https://flagcdn.com/ie.png" },
        { code: "+972", country: "Israel", flag: "https://flagcdn.com/il.png" },
        { code: "+39", country: "Italy", flag: "https://flagcdn.com/it.png" },
        { code: "+225", country: "Ivory Coast", flag: "https://flagcdn.com/ci.png" },
        { code: "+81", country: "Japan", flag: "https://flagcdn.com/jp.png" },
        { code: "+962", country: "Jordan", flag: "https://flagcdn.com/jo.png" },
        { code: "+7", country: "Kazakhstan", flag: "https://flagcdn.com/kz.png" },
        { code: "+254", country: "Kenya", flag: "https://flagcdn.com/ke.png" },
        { code: "+686", country: "Kiribati", flag: "https://flagcdn.com/ki.png" },
        { code: "+965", country: "Kuwait", flag: "https://flagcdn.com/kw.png" },
        { code: "+996", country: "Kyrgyzstan", flag: "https://flagcdn.com/kg.png" },
        { code: "+856", country: "Laos", flag: "https://flagcdn.com/la.png" },
        { code: "+371", country: "Latvia", flag: "https://flagcdn.com/lv.png" },
        { code: "+961", country: "Lebanon", flag: "https://flagcdn.com/lb.png" },
        { code: "+266", country: "Lesotho", flag: "https://flagcdn.com/ls.png" },
        { code: "+231", country: "Liberia", flag: "https://flagcdn.com/lr.png" },
        { code: "+218", country: "Libya", flag: "https://flagcdn.com/ly.png" },
        { code: "+423", country: "Liechtenstein", flag: "https://flagcdn.com/li.png" },
        { code: "+370", country: "Lithuania", flag: "https://flagcdn.com/lt.png" },
        { code: "+352", country: "Luxembourg", flag: "https://flagcdn.com/lu.png" },
        { code: "+853", country: "Macau", flag: "https://flagcdn.com/mo.png" },
        { code: "+389", country: "North Macedonia", flag: "https://flagcdn.com/mk.png" },
        { code: "+261", country: "Madagascar", flag: "https://flagcdn.com/mg.png" },
        { code: "+265", country: "Malawi", flag: "https://flagcdn.com/mw.png" },
        { code: "+60", country: "Malaysia", flag: "https://flagcdn.com/my.png" },
        { code: "+960", country: "Maldives", flag: "https://flagcdn.com/mv.png" },
        { code: "+223", country: "Mali", flag: "https://flagcdn.com/ml.png" },
        { code: "+356", country: "Malta", flag: "https://flagcdn.com/mt.png" },
        { code: "+692", country: "Marshall Islands", flag: "https://flagcdn.com/mh.png" },
        { code: "+222", country: "Mauritania", flag: "https://flagcdn.com/mr.png" },
        { code: "+230", country: "Mauritius", flag: "https://flagcdn.com/mu.png" },
        { code: "+52", country: "Mexico", flag: "https://flagcdn.com/mx.png" },
        { code: "+691", country: "Micronesia", flag: "https://flagcdn.com/fm.png" },
        { code: "+373", country: "Moldova", flag: "https://flagcdn.com/md.png" },
        { code: "+377", country: "Monaco", flag: "https://flagcdn.com/mc.png" },
        { code: "+976", country: "Mongolia", flag: "https://flagcdn.com/mn.png" },
        { code: "+382", country: "Montenegro", flag: "https://flagcdn.com/me.png" },
        { code: "+212", country: "Morocco", flag: "https://flagcdn.com/ma.png" },
        { code: "+258", country: "Mozambique", flag: "https://flagcdn.com/mz.png" },
        { code: "+95", country: "Myanmar", flag: "https://flagcdn.com/mm.png" },
        { code: "+264", country: "Namibia", flag: "https://flagcdn.com/na.png" },
        { code: "+674", country: "Nauru", flag: "https://flagcdn.com/nr.png" },
        { code: "+977", country: "Nepal", flag: "https://flagcdn.com/np.png" },
        { code: "+31", country: "Netherlands", flag: "https://flagcdn.com/nl.png" },
        { code: "+64", country: "New Zealand", flag: "https://flagcdn.com/nz.png" },
        { code: "+505", country: "Nicaragua", flag: "https://flagcdn.com/ni.png" },
        { code: "+227", country: "Niger", flag: "https://flagcdn.com/ne.png" },
        { code: "+234", country: "Nigeria", flag: "https://flagcdn.com/ng.png" },
        { code: "+850", country: "North Korea", flag: "https://flagcdn.com/kp.png" },
        { code: "+47", country: "Norway", flag: "https://flagcdn.com/no.png" },
        { code: "+968", country: "Oman", flag: "https://flagcdn.com/om.png" },
        { code: "+92", country: "Pakistan", flag: "https://flagcdn.com/pk.png" },
        { code: "+680", country: "Palau", flag: "https://flagcdn.com/pw.png" },
        { code: "+970", country: "Palestine", flag: "https://flagcdn.com/ps.png" },
        { code: "+507", country: "Panama", flag: "https://flagcdn.com/pa.png" },
        { code: "+675", country: "Papua New Guinea", flag: "https://flagcdn.com/pg.png" },
        { code: "+595", country: "Paraguay", flag: "https://flagcdn.com/py.png" },
        { code: "+51", country: "Peru", flag: "https://flagcdn.com/pe.png" },
        { code: "+63", country: "Philippines", flag: "https://flagcdn.com/ph.png" },
        { code: "+48", country: "Poland", flag: "https://flagcdn.com/pl.png" },
        { code: "+351", country: "Portugal", flag: "https://flagcdn.com/pt.png" },
        { code: "+974", country: "Qatar", flag: "https://flagcdn.com/qa.png" },
        { code: "+40", country: "Romania", flag: "https://flagcdn.com/ro.png" },
        { code: "+7", country: "Russia", flag: "https://flagcdn.com/ru.png" },
        { code: "+250", country: "Rwanda", flag: "https://flagcdn.com/rw.png" },
        { code: "+685", country: "Samoa", flag: "https://flagcdn.com/ws.png" },
        { code: "+378", country: "San Marino", flag: "https://flagcdn.com/sm.png" },
        { code: "+239", country: "Sao Tome and Principe", flag: "https://flagcdn.com/st.png" },
        { code: "+966", country: "Saudi Arabia", flag: "https://flagcdn.com/sa.png" },
        { code: "+221", country: "Senegal", flag: "https://flagcdn.com/sn.png" },
        { code: "+381", country: "Serbia", flag: "https://flagcdn.com/rs.png" },
        { code: "+248", country: "Seychelles", flag: "https://flagcdn.com/sc.png" },
        { code: "+232", country: "Sierra Leone", flag: "https://flagcdn.com/sl.png" },
        { code: "+65", country: "Singapore", flag: "https://flagcdn.com/sg.png" },
        { code: "+421", country: "Slovakia", flag: "https://flagcdn.com/sk.png" },
        { code: "+386", country: "Slovenia", flag: "https://flagcdn.com/si.png" },
        { code: "+677", country: "Solomon Islands", flag: "https://flagcdn.com/sb.png" },
        { code: "+252", country: "Somalia", flag: "https://flagcdn.com/so.png" },
        { code: "+27", country: "South Africa", flag: "https://flagcdn.com/za.png" },
        { code: "+82", country: "South Korea", flag: "https://flagcdn.com/kr.png" },
        { code: "+211", country: "South Sudan", flag: "https://flagcdn.com/ss.png" },
        { code: "+34", country: "Spain", flag: "https://flagcdn.com/es.png" },
        { code: "+94", country: "Sri Lanka", flag: "https://flagcdn.com/lk.png" },
        { code: "+249", country: "Sudan", flag: "https://flagcdn.com/sd.png" },
        { code: "+597", country: "Suriname", flag: "https://flagcdn.com/sr.png" },
        { code: "+268", country: "Eswatini", flag: "https://flagcdn.com/sz.png" },
        { code: "+46", country: "Sweden", flag: "https://flagcdn.com/se.png" },
        { code: "+41", country: "Switzerland", flag: "https://flagcdn.com/ch.png" },
        { code: "+963", country: "Syria", flag: "https://flagcdn.com/sy.png" },
        { code: "+886", country: "Taiwan", flag: "https://flagcdn.com/tw.png" },
        { code: "+992", country: "Tajikistan", flag: "https://flagcdn.com/tj.png" },
        { code: "+255", country: "Tanzania", flag: "https://flagcdn.com/tz.png" },
        { code: "+66", country: "Thailand", flag: "https://flagcdn.com/th.png" },
        { code: "+670", country: "Timor-Leste", flag: "https://flagcdn.com/tl.png" },
        { code: "+228", country: "Togo", flag: "https://flagcdn.com/tg.png" },
        { code: "+690", country: "Tokelau", flag: "https://flagcdn.com/tk.png" },
        { code: "+676", country: "Tonga", flag: "https://flagcdn.com/to.png" },
        { code: "+216", country: "Tunisia", flag: "https://flagcdn.com/tn.png" },
        { code: "+90", country: "Turkey", flag: "https://flagcdn.com/tr.png" },
        { code: "+993", country: "Turkmenistan", flag: "https://flagcdn.com/tm.png" },
        { code: "+688", country: "Tuvalu", flag: "https://flagcdn.com/tv.png" },
        { code: "+256", country: "Uganda", flag: "https://flagcdn.com/ug.png" },
        { code: "+380", country: "Ukraine", flag: "https://flagcdn.com/ua.png" },
        { code: "+971", country: "United Arab Emirates", flag: "https://flagcdn.com/ae.png" },
        { code: "+44", country: "United Kingdom", flag: "https://flagcdn.com/gb.png" },
        { code: "+1", country: "United States", flag: "https://flagcdn.com/us.png" },
        { code: "+598", country: "Uruguay", flag: "https://flagcdn.com/uy.png" },
        { code: "+998", country: "Uzbekistan", flag: "https://flagcdn.com/uz.png" },
        { code: "+678", country: "Vanuatu", flag: "https://flagcdn.com/vu.png" },
        { code: "+379", country: "Vatican City", flag: "https://flagcdn.com/va.png" },
        { code: "+58", country: "Venezuela", flag: "https://flagcdn.com/ve.png" },
        { code: "+84", country: "Vietnam", flag: "https://flagcdn.com/vn.png" },
        { code: "+681", country: "Wallis and Futuna", flag: "https://flagcdn.com/wf.png" },
        { code: "+967", country: "Yemen", flag: "https://flagcdn.com/ye.png" },
        { code: "+260", country: "Zambia", flag: "https://flagcdn.com/zm.png" },
        { code: "+263", country: "Zimbabwe", flag: "https://flagcdn.com/zw.png" }
    ];
}

// ================= POPULATE COUNTRY CODE SELECT =================
async function populateCountryCodes() {
    const countryCodeSelect = document.getElementById("countryCode");
    if (!countryCodeSelect) return;
    
    // Clear existing options
    countryCodeSelect.innerHTML = '<option value="" disabled selected>🌍 Select Country</option>';
    
    try {
        showLoader(true);
        const countries = await fetchCountryCodes();
        
        countries.forEach(country => {
            const option = document.createElement("option");
            option.value = country.code;
            
            // Create option with flag image
            const flagImg = country.flag ? `<img src="${country.flag}" style="width:20px; height:15px; margin-right:8px; vertical-align:middle;">` : '🌐';
            option.innerHTML = `${flagImg} ${country.country} (${country.code})`;
            
            countryCodeSelect.appendChild(option);
        });
        
        showLoader(false);
    } catch (error) {
        console.error('Error populating countries:', error);
        // Use fallback
        const fallbackCountries = getFallbackCountryCodes();
        fallbackCountries.forEach(country => {
            const option = document.createElement("option");
            option.value = country.code;
            option.innerHTML = `<img src="${country.flag}" style="width:20px; height:15px; margin-right:8px; vertical-align:middle;"> ${country.country} (${country.code})`;
            countryCodeSelect.appendChild(option);
        });
        showLoader(false);
    }
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
    const countryCodeSelect = document.getElementById("countryCode");
    const countryCode = countryCodeSelect?.value || "+1";
    const phoneNumber = document.getElementById("phone").value.trim();
    const fullPhoneNumber = countryCode + phoneNumber;

    if (!username || !email || !phoneNumber) {
        showMessage("Please fill all fields.", "error");
        return;
    }

    if (!countryCodeSelect?.value) {
        showMessage("Please select your country code.", "error");
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

    // Phone validation
    if (!/^\d{7,15}$/.test(phoneNumber)) {
        showMessage("Enter a valid phone number (7-15 digits).", "error");
        return;
    }

    try {
        showLoader(true);
        
        // Check if user exists
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // User exists - log them in
            const existingUser = querySnapshot.docs[0].data();
            localStorage.setItem("crunkUser", JSON.stringify({
                username: existingUser.displayName || existingUser.username,
                displayName: existingUser.displayName || existingUser.username,
                email: existingUser.email,
                phone: existingUser.phone,
                photoURL: existingUser.photoURL || null,
                userId: querySnapshot.docs[0].id
            }));
            
            showMessage("Login successful! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1000);
            return;
        }

        // Create new user with Firebase UID format matching chat app
        const userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

        const newUser = {
            uid: userId,
            username: username,
            displayName: username,
            email: email,
            phone: fullPhoneNumber,
            countryCode: countryCode,
            phoneNumber: phoneNumber,
            photoURL: null,
            loginMethod: "form",
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            status: 'online',
            userId: userId
        };

        await setDoc(doc(db, "users", userId), newUser);

        localStorage.setItem("crunkUser", JSON.stringify({ 
            username: username,
            displayName: username,
            email: email, 
            phone: fullPhoneNumber,
            photoURL: null,
            userId: userId 
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
        
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            localStorage.setItem("crunkUser", JSON.stringify({
                username: userData.displayName || user.displayName,
                displayName: userData.displayName || user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                userId: user.uid
            }));
        } else {
            const newUser = {
                uid: user.uid,
                username: user.displayName,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                loginMethod: "google",
                createdAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                status: 'online',
                userId: user.uid,
                emailVerified: user.emailVerified
            };
            
            await setDoc(userDocRef, newUser);
            
            localStorage.setItem("crunkUser", JSON.stringify({
                username: user.displayName,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                userId: user.uid
            }));
        }
        
        showMessage("Google login successful! Redirecting...", "success");
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1000);
        
    } catch (error) {
        console.error("Google login error:", error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            showMessage("Login cancelled. Please try again.", "info");
        } else if (error.code === 'auth/popup-blocked') {
            showMessage("Popup was blocked. Please allow popups.", "error");
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            showMessage("Account exists with different sign-in method.", "error");
        } else {
            showMessage("Error with Google login. Please try again.", "error");
        }
    } finally {
        showLoader(false);
    }
}

// Handle redirect result
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

handleRedirectResult();

// ================= HELPER FUNCTIONS =================
function showMessage(text, type = "info") {
    if (!message) return;
    
    message.innerText = text;
    message.className = `message ${type}`;
    
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

// ================= EXPOSE FUNCTIONS GLOBALLY =================
window.handleGoogleLogin = handleGoogleLogin;

// ================= VALIDATION =================
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

console.log("✅ Login system initialized with correct Firebase project");
