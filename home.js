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
const searchClear = document.getElementById("searchClear");
const searchResults = document.getElementById("searchResults");
const slidesContainer = document.querySelector(".slides");
const dotsContainer = document.querySelector(".dots");
const loader = document.getElementById("loader");

// Game popup
const gamePopup = document.getElementById("gamePopup");
const popupContent = document.querySelector(".popup-content");
const popupClose = document.querySelector(".popup-content .close");
const popupTitle = document.getElementById("popupTitle");
const popupDesc = document.getElementById("popupDesc");
const popupImg = document.getElementById("popupImg");
const popupTrailer = document.getElementById("popupTrailer");
const popupScreens = document.getElementById("popupScreens");
const popupDownload = document.getElementById("popupDownload");
const popupRating = document.getElementById("popupRating");
const popupRelease = document.getElementById("popupRelease");
const popupPlatforms = document.getElementById("popupPlatforms");

// Sidebar
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const menuTheme = document.getElementById("menuTheme");
const themeLabel = document.getElementById("themeLabel");
const sidebarOverlay = document.querySelector(".sidebar-overlay");

// Profile
const profileDropdown = document.getElementById("profileDropdown");
const profilePopup = document.getElementById("profilePopup");
const googleProfilePic = document.getElementById("googleProfilePic");
const popupProfilePic = document.getElementById("popupProfilePic");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const logoutBtn = document.getElementById("logoutBtn");

// Notification
const notificationBell = document.getElementById("notificationBell");
const notificationPopup = document.getElementById("notificationPopup");
const notificationCount = document.getElementById("notificationCount");
const notificationList = document.getElementById("notificationList");
const markAllRead = document.getElementById("markAllRead");

// ===============================
// NOTIFICATION SYSTEM
// ===============================
let notifications = [
    {
        id: 1,
        title: "New Games Added",
        message: "Check out the latest games!",
        time: "5 min ago",
        read: false,
        icon: "🎮"
    },
    {
        id: 2,
        title: "Special Offer",
        message: "50% off on premium games",
        time: "1 hour ago",
        read: false,
        icon: "🏷️"
    },
    {
        id: 3,
        title: "Update Available",
        message: "New features are here!",
        time: "2 hours ago",
        read: true,
        icon: "🔄"
    }
];

function updateNotificationBell() {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        notificationCount.textContent = unreadCount;
        notificationCount.style.display = "flex";
        notificationBell.style.animation = "ring 0.5s ease";
        setTimeout(() => {
            notificationBell.style.animation = "none";
        }, 500);
    } else {
        notificationCount.style.display = "none";
    }
}

function renderNotifications() {
    notificationList.innerHTML = "";
    notifications.slice(0, 5).forEach(notif => {
        const item = document.createElement("div");
        item.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
        item.innerHTML = `
            <div class="notification-icon">${notif.icon}</div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${notif.time}</div>
            </div>
            ${!notif.read ? '<span class="notification-badge"></span>' : ''}
        `;
        item.onclick = () => markNotificationRead(notif.id);
        notificationList.appendChild(item);
    });
}

function markNotificationRead(id) {
    notifications = notifications.map(n => 
        n.id === id ? {...n, read: true} : n
    );
    renderNotifications();
    updateNotificationBell();
}

markAllRead.addEventListener("click", () => {
    notifications = notifications.map(n => ({...n, read: true}));
    renderNotifications();
    updateNotificationBell();
});

// Notification toggle
notificationBell.addEventListener("click", (e) => {
    e.stopPropagation();
    notificationPopup.classList.toggle("active");
});

// ===============================
// ENHANCED SEARCH WITH DROPDOWN
// ===============================
let searchTimeout;
let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

function saveSearchHistory(query) {
    if (!query || query.length < 2) return;
    searchHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 5);
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
}

function showSearchDropdown(games, query) {
    if (!games.length && !searchHistory.length) {
        searchResults.classList.remove("active");
        return;
    }

    searchResults.innerHTML = "";

    // Show search history if no query or query is short
    if ((!query || query.length < 2) && searchHistory.length > 0) {
        const historyHeader = document.createElement("div");
        historyHeader.className = "search-header";
        historyHeader.innerHTML = '<span>Recent Searches</span><button class="clear-history">Clear</button>';
        searchResults.appendChild(historyHeader);

        searchHistory.forEach(term => {
            const item = document.createElement("div");
            item.className = "search-item";
            item.innerHTML = `
                <i class="fas fa-history"></i>
                <span>${term}</span>
            `;
            item.onclick = () => {
                searchInput.value = term;
                fetchGames(term);
                searchResults.classList.remove("active");
            };
            searchResults.appendChild(item);
        });

        document.querySelector(".clear-history")?.addEventListener("click", (e) => {
            e.stopPropagation();
            searchHistory = [];
            localStorage.removeItem("searchHistory");
            showSearchDropdown([], query);
        });
    }

    // Show search results
    if (games.length > 0) {
        if (searchHistory.length > 0) {
            const divider = document.createElement("div");
            divider.className = "search-divider";
            divider.textContent = "Games";
            searchResults.appendChild(divider);
        }

        games.slice(0, 5).forEach(game => {
            const item = document.createElement("div");
            item.className = "search-item";
            item.innerHTML = `
                <img src="${game.background_image || 'placeholder.png'}" alt="${game.name}">
                <div class="search-item-info">
                    <div class="search-item-title">${game.name}</div>
                    <div class="search-item-meta">${game.released || 'N/A'} • ⭐ ${game.rating || 'N/A'}</div>
                </div>
            `;
            item.onclick = () => {
                openGame(game.id);
                saveSearchHistory(game.name);
                searchResults.classList.remove("active");
                searchInput.value = "";
            };
            searchResults.appendChild(item);
        });

        if (games.length > 5) {
            const viewAll = document.createElement("div");
            viewAll.className = "search-view-all";
            viewAll.innerHTML = `View all ${games.length} results <i class="fas fa-arrow-right"></i>`;
            viewAll.onclick = () => {
                renderGames(games);
                searchResults.classList.remove("active");
            };
            searchResults.appendChild(viewAll);
        }
    }

    searchResults.classList.add("active");
}

// Enhanced search input
searchInput.addEventListener("input", async () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();

    // Show/hide clear button
    if (searchClear) {
        searchClear.style.display = query.length > 0 ? "flex" : "none";
    }

    if (query.length < 2) {
        showSearchDropdown([], query);
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&search=${query}&page_size=10`);
            const data = await res.json();
            showSearchDropdown(data.results || [], query);
        } catch (err) {
            console.error("Search error:", err);
        }
    }, 300);
});

// Clear search
if (searchClear) {
    searchClear.addEventListener("click", () => {
        searchInput.value = "";
        searchClear.style.display = "none";
        searchResults.classList.remove("active");
        searchInput.focus();
    });
}

// Close search dropdown on click outside
document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove("active");
    }
});

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
// SIDEBAR EVENTS WITH SMOOTH NAVIGATION
// ===============================
menuBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    if (sidebarOverlay) sidebarOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
});

function closeSidebarFunc() {
    sidebar.classList.remove("open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

closeSidebar.addEventListener("click", closeSidebarFunc);

if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebarFunc);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
        closeSidebarFunc();
    }
});

// Sidebar menu items with smooth navigation
function navigateTo(url) {
    closeSidebarFunc();
    setTimeout(() => {
        window.location.href = url;
    }, 200);
}

document.getElementById("menuHome").onclick = () => navigateTo("games.html");
document.getElementById("menuSettings").onclick = () => navigateTo("settings.html");
document.getElementById("menuPrivacy").onclick = () => navigateTo("privacy.html");
document.getElementById("menuHelp").onclick = () => navigateTo("help.html");
document.getElementById("menuAbout").onclick = () => navigateTo("about.html");
document.getElementById("menuRate").onclick = () => navigateTo("rate.html");
document.getElementById("menuFavorites").onclick = () => navigateTo("favorites.html");
document.getElementById("menuLibrary").onclick = () => navigateTo("library.html");

document.getElementById("menuShare").onclick = () => {
    closeSidebarFunc();
    if (navigator.share) {
        navigator.share({
            title: "Crunk Games",
            text: "Check out these awesome games!",
            url: window.location.href
        }).catch(() => {
            navigator.clipboard.writeText(window.location.href);
            showToast("Link copied to clipboard!");
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!");
    }
};

// Toast notification function
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 100);
}

// ===============================
// THEME TOGGLE
// ===============================
function toggleTheme() {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    themeLabel.innerText = isLight ? "Light" : "Dark";
    localStorage.setItem("theme", isLight ? "light" : "dark");
    
    // Update icons
    const sunIcon = menuTheme.querySelector(".fa-sun");
    const moonIcon = menuTheme.querySelector(".fa-moon");
    if (sunIcon && moonIcon) {
        sunIcon.style.display = isLight ? "inline-block" : "none";
        moonIcon.style.display = isLight ? "none" : "inline-block";
    }
}

menuTheme.addEventListener("click", toggleTheme);

// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    themeLabel.innerText = "Light";
    const sunIcon = menuTheme.querySelector(".fa-sun");
    const moonIcon = menuTheme.querySelector(".fa-moon");
    if (sunIcon && moonIcon) {
        sunIcon.style.display = "inline-block";
        moonIcon.style.display = "none";
    }
}

// ===============================
// PROFILE POPUP
// ===============================
profileDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
    profilePopup.classList.toggle("active");
});

window.addEventListener("click", () => profilePopup.classList.remove("active"));
profilePopup.addEventListener("click", (e) => e.stopPropagation());

// ===============================
// LOGOUT
// ===============================
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("crunkUser");
    window.location.href = "index.html";
});

// ===============================
// LOADER
// ===============================
function showLoader() {
    loader.style.display = "flex";
}

function hideLoader() {
    loader.style.display = "none";
}

// ===============================
// FETCH GAMES
// ===============================
let sliderGames = [];
let currentSlide = 0;

async function fetchGames(query = "") {
    showLoader();
    try {
        const url = query.length > 0
            ? `${BASE_URL}/games?key=${API_KEY}&search=${query}&page_size=24`
            : `${BASE_URL}/games?key=${API_KEY}&platforms=4,187&page_size=24&ordering=-added`;
        
        const res = await fetch(url);
        const data = await res.json();
        const games = data.results || [];
        
        renderGames(games);
        
        if (!query) {
            createSlider(games.slice(0, 5));
        }
        
        // Initialize notifications
        renderNotifications();
        updateNotificationBell();
        
    } catch (err) {
        console.error(err);
        gamesContainer.innerHTML = "<div class='error-message'><i class='fas fa-exclamation-circle'></i> Failed to load games. Please try again.</div>";
    } finally {
        hideLoader();
    }
}

fetchGames();

// ===============================
// RENDER GAMES WITH ANIMATION
// ===============================
function renderGames(games) {
    gamesContainer.innerHTML = "";
    if (!games.length) {
        gamesContainer.innerHTML = "<div class='error-message'><i class='fas fa-search'></i> No games found</div>";
        return;
    }
    
    games.forEach((game, index) => {
        const stars = "⭐".repeat(Math.floor(game.rating || 0));
        const card = document.createElement("div");
        card.className = "game-card";
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="game-card-inner">
                <img src="${game.background_image || 'placeholder.png'}" alt="${game.name}" loading="lazy">
                <div class="game-overlay">
                    <span class="game-rating-badge">⭐ ${game.rating || 'N/A'}</span>
                    ${game.metacritic ? `<span class="game-metacritic">${game.metacritic}</span>` : ''}
                </div>
                <div class="game-info">
                    <div class="game-title">${game.name}</div>
                    <div class="game-date">${game.released ? new Date(game.released).getFullYear() : 'TBA'}</div>
                    <div class="game-rating">${stars}</div>
                </div>
            </div>
        `;
        card.onclick = () => openGame(game.id);
        gamesContainer.appendChild(card);
    });
}

// ===============================
// SLIDER WITH TOUCH SUPPORT
// ===============================
function createSlider(games) {
    sliderGames = games;
    slidesContainer.innerHTML = "";
    dotsContainer.innerHTML = "";
    
    games.forEach((game, i) => {
        const slideDiv = document.createElement("div");
        slideDiv.className = "slide";
        slideDiv.style.backgroundImage = `url(${game.background_image})`;
        slideDiv.onclick = () => openGame(game.id);
        
        const overlay = document.createElement("div");
        overlay.className = "slide-overlay";
        overlay.innerHTML = `
            <h3>${game.name}</h3>
            <p>⭐ ${game.rating || 'N/A'} • ${game.released ? new Date(game.released).getFullYear() : 'TBA'}</p>
        `;
        slideDiv.appendChild(overlay);
        slidesContainer.appendChild(slideDiv);

        const dot = document.createElement("span");
        dot.className = "dot";
        dot.onclick = () => goSlide(i);
        dotsContainer.appendChild(dot);
    });
    
    goSlide(0);
    
    // Auto slide
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
    dotsContainer.querySelectorAll(".dot").forEach((dot, i) => 
        dot.classList.toggle("active", i === index)
    );
}

// ===============================
// GAME POPUP WITH ENHANCED INFO
// ===============================
async function openGame(id) {
    showLoader();
    try {
        const res = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);
        const game = await res.json();

        popupTitle.innerText = game.name;
        const desc = game.description_raw || "No description available.";
        popupDesc.innerText = desc;
        popupImg.src = game.background_image || "placeholder.png";
        popupRating.textContent = `⭐ ${game.rating || 'N/A'}`;
        popupRelease.textContent = game.released ? new Date(game.released).toLocaleDateString() : 'TBA';
        
        // Platforms
        const platforms = game.platforms?.map(p => p.platform.name).join(', ') || 'Various';
        popupPlatforms.textContent = platforms;

        // Screenshots
        const shotRes = await fetch(`${BASE_URL}/games/${id}/screenshots?key=${API_KEY}`);
        const shots = await shotRes.json();
        popupScreens.innerHTML = "";
        
        if (shots.results?.length > 0) {
            shots.results.slice(0, 6).forEach(s => {
                const img = document.createElement("img");
                img.src = s.image;
                img.loading = "lazy";
                img.onclick = () => window.open(s.image, '_blank');
                popupScreens.appendChild(img);
            });
        } else {
            popupScreens.innerHTML = "<p style='color: var(--text-secondary)'>No screenshots available</p>";
        }

        // Trailer
        const trailerRes = await fetch(`${BASE_URL}/games/${id}/movies?key=${API_KEY}`);
        const trailerData = await trailerRes.json();
        const trailer = trailerData.results?.[0]?.data?.max || "";
        
        popupTrailer.innerHTML = trailer
            ? `<video controls width="100%" style="border-radius:12px;background:#000">
                <source src="${trailer}" type="video/mp4">
               </video>`
            : "<div style='color: var(--text-secondary); text-align:center; padding:20px;'><i class='fas fa-video-slash'></i> No trailer available</div>";

        popupDownload.onclick = () => window.open(game.website || `https://rawg.io/games/${game.slug}`, '_blank');
        
        gamePopup.style.display = "flex";
        document.body.style.overflow = "hidden";
        
    } catch (err) {
        console.error(err);
        showToast("Failed to load game details");
    } finally {
        hideLoader();
    }
}

// ===============================
// CLOSE POPUP
// ===============================
popupClose.addEventListener("click", () => {
    gamePopup.style.display = "none";
    document.body.style.overflow = "";
});

gamePopup.addEventListener("click", (e) => {
    if (e.target === gamePopup) {
        gamePopup.style.display = "none";
        document.body.style.overflow = "";
    }
});

popupContent.addEventListener("click", (e) => e.stopPropagation());

// ===============================
// KEYBOARD SHORTCUTS
// ===============================
document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to close popups
    if (e.key === 'Escape') {
        if (gamePopup.style.display === 'flex') {
            gamePopup.style.display = 'none';
            document.body.style.overflow = '';
        }
        if (notificationPopup.classList.contains('active')) {
            notificationPopup.classList.remove('active');
        }
    }
});

// ===============================
// LAZY LOADING FOR SCROLL
// ===============================
let page = 1;
let loading = false;
let hasMore = true;

window.addEventListener("scroll", async () => {
    if (loading || !hasMore) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 1000;
    
    if (scrollPosition >= threshold) {
        loading = true;
        page++;
        
        try {
            const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&page=${page}&page_size=12`);
            const data = await res.json();
            
            if (data.results?.length > 0) {
                renderGames([...document.querySelectorAll('.game-card')].length, data.results);
            } else {
                hasMore = false;
            }
        } catch (err) {
            console.error(err);
        } finally {
            loading = false;
        }
    }
});

// ===============================
// INITIALIZE
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    // Show welcome notification
    setTimeout(() => {
        showToast("Welcome to Crunk Games! 🎮");
    }, 1000);
});
