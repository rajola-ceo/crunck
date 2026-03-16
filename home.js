// ===============================
// CONFIG
// ===============================
const API_KEY = "b6eb9c2e474d41e3bcc8550e873623de";
const BASE_URL = "https://api.rawg.io/api";

// ===============================
// ELEMENTS
// ===============================
const gamesContainer = document.getElementById("gamesContainer");
const searchInput = document.getElementById("searchInput");
const slidesContainer = document.querySelector(".slides");
const dotsContainer = document.querySelector(".dots");

// Loader
const loader = document.getElementById("loader");

// Popup
const gamePopup = document.getElementById("gamePopup");
const popupContent = document.querySelector(".popup-content");
const popupTitle = document.getElementById("popupTitle");
const popupDesc = document.getElementById("popupDesc");
const popupImg = document.getElementById("popupImg");
const popupTrailer = document.getElementById("popupTrailer");
const popupScreens = document.getElementById("popupScreens");
const popupDownload = document.getElementById("popupDownload");
const popupClose = document.querySelector(".popup-content .close");

// Sidebar
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const menuTheme = document.getElementById("menuTheme");
const themeLabel = document.getElementById("themeLabel");

// Profile
const profileDropdown = document.getElementById("profileDropdown");
const profilePopup = document.getElementById("profilePopup");
const googleProfilePic = document.getElementById("googleProfilePic");
const popupProfilePic = document.getElementById("popupProfilePic");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const logoutBtn = document.getElementById("logoutBtn");

// ===============================
// LOCAL SESSION CHECK
// ===============================
const user = JSON.parse(localStorage.getItem("crunkUser"));
if (!user) {
    window.location.href = "index.html";
} else {
    googleProfilePic.src = user.picture || "placeholder.png";
    popupProfilePic.src = user.picture || "placeholder.png";
    accountName.innerText = user.username || "User";
    accountEmail.innerText = user.email || "";
}

// ===============================
// SIDEBAR MENU EVENTS
// ===============================
menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));

document.getElementById("menuSettings").onclick = () => location.href = "settings.html";
document.getElementById("menuPrivacy").onclick = () => location.href = "privacy.html";
document.getElementById("menuHelp").onclick = () => location.href = "help.html";
document.getElementById("menuRate").onclick = () => location.href = "rate.html";
document.getElementById("menuAbout").onclick = () => location.href = "about.html";
document.getElementById("menuShare").onclick = () => {
    if (navigator.share) {
        navigator.share({
            title: "Crunk Games",
            url: window.location.href
        }).catch(console.error);
    } else {
        alert("Sharing not supported on this browser.");
    }
};

// ===============================
// THEME TOGGLE
// ===============================
menuTheme.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    themeLabel.innerText = document.body.classList.contains("light-theme") ? "Light" : "Dark";
});

// ===============================
// PROFILE POPUP
// ===============================
profileDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
    profilePopup.classList.toggle("active");
});

document.addEventListener("click", () => profilePopup.classList.remove("active"));

// ===============================
// LOGOUT
// ===============================
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("crunkUser");
    window.location.href = "index.html";
});

// ===============================
// FETCH GAMES
// ===============================
let sliderGames = [];
let currentSlide = 0;

async function fetchGames(query = "") {
    loader.style.display = "flex";
    try {
        const url = query.length > 0
            ? `${BASE_URL}/games?key=${API_KEY}&search=${query}`
            : `${BASE_URL}/games?key=${API_KEY}&platforms=4,187&page_size=24&ordering=-added`;
        const res = await fetch(url);
        const data = await res.json();
        const games = data.results || [];
        renderGames(games);
        if (!query) createSlider(games.slice(0, 5));
    } catch (err) {
        console.error(err);
        gamesContainer.innerHTML = "<p style='text-align:center;color:#ff6b6b'>Failed to load games</p>";
    } finally {
        loader.style.display = "none";
    }
}

fetchGames();

// ===============================
// SEARCH
// ===============================
let searchTimeout;
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = searchInput.value.trim();
        fetchGames(query);
    }, 500);
});

// ===============================
// RENDER GAMES
// ===============================
function renderGames(games) {
    gamesContainer.innerHTML = "";
    if (!games.length) {
        gamesContainer.innerHTML = "<p style='text-align:center;color:#ff6b6b'>No games found</p>";
        return;
    }
    games.forEach((game) => {
        const stars = "⭐".repeat(Math.round(game.rating || 0));
        const card = document.createElement("div");
        card.className = "game-card";
        card.innerHTML = `
            <img src="${game.background_image || 'placeholder.png'}" alt="${game.name}">
            <div class="game-info">
                <div class="game-title">${game.name}</div>
                <div class="game-date">${game.released || ""}</div>
                <div class="game-rating">${stars}</div>
            </div>
        `;
        card.onclick = () => openGame(game.id);
        gamesContainer.appendChild(card);
    });
}

// ===============================
// SLIDER
// ===============================
function createSlider(games) {
    sliderGames = games;
    slidesContainer.innerHTML = "";
    dotsContainer.innerHTML = "";
    games.forEach((game, i) => {
        const img = document.createElement("img");
        img.src = game.background_image;
        img.className = "slide";
        img.onclick = () => openGame(game.id);
        slidesContainer.appendChild(img);
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.onclick = () => goSlide(i);
        dotsContainer.appendChild(dot);
    });
    goSlide(0);
    if (sliderGames.length > 0) {
        setInterval(() => {
            currentSlide = (currentSlide + 1) % sliderGames.length;
            goSlide(currentSlide);
        }, 5000);
    }
}

function goSlide(index) {
    currentSlide = index;
    slidesContainer.style.transform = `translateX(-${index * 100}%)`;
    dotsContainer.querySelectorAll(".dot").forEach((dot, i) => dot.classList.toggle("active", i === index));
}

// ===============================
// GAME POPUP
// ===============================
async function openGame(id) {
    loader.style.display = "flex";
    try {
        const res = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);
        const game = await res.json();

        popupTitle.innerText = game.name;
        const desc = game.description_raw || "";
        popupDesc.innerText = desc.length > 200 ? desc.substr(0, desc.lastIndexOf(" ", 200)) + "..." : desc;
        popupImg.src = game.background_image || "placeholder.png";

        // Screenshots
        const shotRes = await fetch(`${BASE_URL}/games/${id}/screenshots?key=${API_KEY}`);
        const shots = await shotRes.json();
        popupScreens.innerHTML = "";
        (shots.results || []).slice(0,6).forEach(s => {
            const img = document.createElement("img");
            img.src = s.image;
            popupScreens.appendChild(img);
        });

        // Trailer
        const trailerRes = await fetch(`${BASE_URL}/games/${id}/movies?key=${API_KEY}`);
        const trailerData = await trailerRes.json();
        const trailer = trailerData.results?.[0]?.data?.max || "";
        popupTrailer.innerHTML = trailer
            ? `<video controls width="100%" style="border-radius:12px;background:#000">
                <source src="${trailer}" type="video/mp4">
               </video>`
            : "<div style='color:#ffb400'>No trailer available</div>";

        popupDownload.onclick = () => window.open(game.website || "#", "_blank");

        gamePopup.style.display = "flex";
    } catch(err) {
        console.error(err);
    } finally {
        loader.style.display = "none";
    }
}

// ===============================
// CLOSE POPUP
// ===============================
gamePopup.addEventListener("click", (e) => {
    if (e.target === gamePopup || e.target === popupClose) {
        closeGame();
    }
});

popupContent.addEventListener("click", e => e.stopPropagation());

function closeGame() {
    gamePopup.style.display = "none";
}

// ===============================
// SERVICE WORKER
// ===============================
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
        .then(() => console.log("Service Worker Registered"))
        .catch(err => console.log("SW Error", err));
    });
}
