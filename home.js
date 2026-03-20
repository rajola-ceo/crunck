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

// Venaura App Icon
const venauraIcon = document.getElementById("venauraIcon");

// Veno Coins Elements
const venoCoinsAmount = document.getElementById("venoCoinsAmount");
const claimVenoCoinsBtn = document.getElementById("claimVenoCoinsBtn");

// Notification
const notificationBell = document.getElementById("notificationBell");
const notificationPopup = document.getElementById("notificationPopup");
const notificationCount = document.getElementById("notificationCount");
const notificationList = document.getElementById("notificationList");
const markAllRead = document.getElementById("markAllRead");

// Additional elements for sidebar menu items
const menuHome = document.getElementById("menuHome");
const menuLibrary = document.getElementById("menuLibrary");
const menuFavorites = document.getElementById("menuFavorites");
const menuSettings = document.getElementById("menuSettings");
const menuPrivacy = document.getElementById("menuPrivacy");
const menuShare = document.getElementById("menuShare");
const menuHelp = document.getElementById("menuHelp");
const menuRate = document.getElementById("menuRate");
const menuAbout = document.getElementById("menuAbout");

// Toast container
const toastContainer = document.getElementById("toastContainer") || (() => {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
})();

// ===============================
// VENO COINS SYSTEM
// ===============================
const VENO_COINS_KEY = "venoCoins";
const LAST_CLAIM_KEY = "lastVenoClaim";

function getVenoCoins() {
    const coins = localStorage.getItem(VENO_COINS_KEY);
    return coins ? parseInt(coins) : 0;
}

function updateVenoCoinsDisplay() {
    if (venoCoinsAmount) {
        venoCoinsAmount.textContent = getVenoCoins();
    }
}

function canClaimVenoCoins() {
    const lastClaim = localStorage.getItem(LAST_CLAIM_KEY);
    if (!lastClaim) return true;
    
    const lastClaimDate = new Date(parseInt(lastClaim));
    const now = new Date();
    const hoursSinceClaim = (now - lastClaimDate) / (1000 * 60 * 60);
    
    return hoursSinceClaim >= 24;
}

function getRemainingTime() {
    const lastClaim = localStorage.getItem(LAST_CLAIM_KEY);
    if (!lastClaim) return null;
    
    const lastClaimDate = new Date(parseInt(lastClaim));
    const nextClaimDate = new Date(lastClaimDate.getTime() + (24 * 60 * 60 * 1000));
    const now = new Date();
    
    if (now >= nextClaimDate) return null;
    
    const diff = nextClaimDate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

function claimVenoCoins() {
    if (!canClaimVenoCoins()) {
        const remaining = getRemainingTime();
        showToast(`Already claimed! Next claim in ${remaining}`, "error");
        return false;
    }
    
    const currentCoins = getVenoCoins();
    const newCoins = currentCoins + 10;
    localStorage.setItem(VENO_COINS_KEY, newCoins);
    localStorage.setItem(LAST_CLAIM_KEY, Date.now().toString());
    
    updateVenoCoinsDisplay();
    showToast("🎉 You claimed 10 Veno Coins!", "success");
    
    // Update claim button
    if (claimVenoCoinsBtn) {
        claimVenoCoinsBtn.disabled = true;
        claimVenoCoinsBtn.innerHTML = '<i class="fas fa-clock"></i> Claimed - Wait 24h';
    }
    
    return true;
}

function updateClaimButton() {
    if (!claimVenoCoinsBtn) return;
    
    if (canClaimVenoCoins()) {
        claimVenoCoinsBtn.disabled = false;
        claimVenoCoinsBtn.innerHTML = '<i class="fas fa-gift"></i> Claim 10 Veno Coins';
        claimVenoCoinsBtn.style.opacity = "1";
    } else {
        claimVenoCoinsBtn.disabled = true;
        const remaining = getRemainingTime();
        claimVenoCoinsBtn.innerHTML = `<i class="fas fa-clock"></i> Claim in ${remaining}`;
        claimVenoCoinsBtn.style.opacity = "0.6";
    }
}

// Update claim button every minute
setInterval(updateClaimButton, 60000);

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
    if (!notificationCount) return;
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        notificationCount.textContent = unreadCount;
        notificationCount.style.display = "flex";
        if (notificationBell) {
            notificationBell.style.animation = "ring 0.5s ease";
            setTimeout(() => {
                notificationBell.style.animation = "none";
            }, 500);
        }
    } else {
        notificationCount.style.display = "none";
    }
}

function renderNotifications() {
    if (!notificationList) return;
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

if (markAllRead) {
    markAllRead.addEventListener("click", () => {
        notifications = notifications.map(n => ({...n, read: true}));
        renderNotifications();
        updateNotificationBell();
    });
}

// Notification toggle
if (notificationBell) {
    notificationBell.addEventListener("click", (e) => {
        e.stopPropagation();
        if (notificationPopup) notificationPopup.classList.toggle("active");
    });
}

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
    if (!searchResults) return;
    
    if ((!games || games.length === 0) && (!searchHistory || searchHistory.length === 0)) {
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
                <i class="bx bx-history"></i>
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
    if (games && games.length > 0) {
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
                <img src="${game.background_image || 'https://via.placeholder.com/40x40?text=🎮'}" alt="${game.name}" onerror="this.src='https://via.placeholder.com/40x40?text=🎮'">
                <div class="search-item-info">
                    <div class="search-item-title">${game.name}</div>
                    <div class="search-item-meta">${game.released ? game.released.split('-')[0] : 'N/A'} • ⭐ ${game.rating || 'N/A'}</div>
                </div>
            `;
            item.onclick = () => {
                openGame(game.id);
                saveSearchHistory(game.name);
                searchResults.classList.remove("active");
                searchInput.value = "";
                if (searchClear) searchClear.style.display = "none";
            };
            searchResults.appendChild(item);
        });

        if (games.length > 5) {
            const viewAll = document.createElement("div");
            viewAll.className = "search-view-all";
            viewAll.innerHTML = `View all ${games.length} results <i class="bx bx-chevron-right"></i>`;
            viewAll.onclick = () => {
                renderGames(games);
                searchResults.classList.remove("active");
                searchInput.value = "";
                if (searchClear) searchClear.style.display = "none";
            };
            searchResults.appendChild(viewAll);
        }
    }

    searchResults.classList.add("active");
}

// Enhanced search input
if (searchInput) {
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
                const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=10`);
                const data = await res.json();
                showSearchDropdown(data.results || [], query);
            } catch (err) {
                console.error("Search error:", err);
            }
        }, 300);
    });
}

// Clear search
if (searchClear) {
    searchClear.addEventListener("click", () => {
        if (searchInput) {
            searchInput.value = "";
            searchClear.style.display = "none";
        }
        if (searchResults) searchResults.classList.remove("active");
        if (searchInput) searchInput.focus();
    });
}

// Close search dropdown on click outside
document.addEventListener("click", (e) => {
    if (searchInput && searchResults && 
        !searchInput.contains(e.target) && 
        !searchResults.contains(e.target)) {
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
    if (googleProfilePic) googleProfilePic.src = user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || user.username || "User") + "&background=34d399&color=fff&size=128";
    if (popupProfilePic) popupProfilePic.src = user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || user.username || "User") + "&background=34d399&color=fff&size=128";
    if (accountName) accountName.innerText = user.displayName || user.username || "User";
    if (accountEmail) accountEmail.innerText = user.email || "";
    
    // Initialize Veno Coins display
    updateVenoCoinsDisplay();
    updateClaimButton();
}

// ===============================
// VENAURA APP ICON
// ===============================
if (venauraIcon) {
    venauraIcon.addEventListener("click", () => {
        // Replace this URL with your Venaura app URL
        window.open("https://your-venaura-app-url.com", "_blank");
    });
}

// ===============================
// SIDEBAR EVENTS WITH SMOOTH NAVIGATION
// ===============================
if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        if (sidebar) sidebar.classList.add("open");
        if (sidebarOverlay) sidebarOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    });
}

function closeSidebarFunc() {
    if (sidebar) sidebar.classList.remove("open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

if (closeSidebar) {
    closeSidebar.addEventListener("click", closeSidebarFunc);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebarFunc);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar && sidebar.classList.contains("open")) {
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

// Add navigation to sidebar items
if (menuHome) menuHome.addEventListener("click", () => navigateTo("games.html"));
if (menuLibrary) menuLibrary.addEventListener("click", () => navigateTo("library.html"));
if (menuFavorites) menuFavorites.addEventListener("click", () => navigateTo("favorites.html"));
if (menuSettings) menuSettings.addEventListener("click", () => navigateTo("settings.html"));
if (menuPrivacy) menuPrivacy.addEventListener("click", () => navigateTo("privacy.html"));
if (menuHelp) menuHelp.addEventListener("click", () => navigateTo("help.html"));
if (menuAbout) menuAbout.addEventListener("click", () => navigateTo("about.html"));
if (menuRate) menuRate.addEventListener("click", () => navigateTo("rate.html"));

if (menuShare) {
    menuShare.addEventListener("click", () => {
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
    });
}

// Toast notification function
function showToast(message) {
    if (!toastContainer) return;
    
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="bx bx-check-circle"></i> ${message}`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }, 100);
}

// ===============================
// THEME TOGGLE
// ===============================
function toggleTheme() {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    if (themeLabel) themeLabel.innerText = isLight ? "Light" : "Dark";
    localStorage.setItem("theme", isLight ? "light" : "dark");
    
    // Update icons if they exist
    if (menuTheme) {
        const sunIcon = menuTheme.querySelector(".bx-sun");
        const moonIcon = menuTheme.querySelector(".bx-moon");
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isLight ? "inline-block" : "none";
            moonIcon.style.display = isLight ? "none" : "inline-block";
        }
    }
}

if (menuTheme) {
    menuTheme.addEventListener("click", toggleTheme);
}

// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    if (themeLabel) themeLabel.innerText = "Light";
    if (menuTheme) {
        const sunIcon = menuTheme.querySelector(".bx-sun");
        const moonIcon = menuTheme.querySelector(".bx-moon");
        if (sunIcon && moonIcon) {
            sunIcon.style.display = "inline-block";
            moonIcon.style.display = "none";
        }
    }
}

// ===============================
// PROFILE POPUP
// ===============================
if (profileDropdown) {
    profileDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
        if (profilePopup) profilePopup.classList.toggle("active");
    });
}

window.addEventListener("click", () => {
    if (profilePopup) profilePopup.classList.remove("active");
});

if (profilePopup) {
    profilePopup.addEventListener("click", (e) => e.stopPropagation());
}

// ===============================
// LOGOUT
// ===============================
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("crunkUser");
        localStorage.removeItem(VENO_COINS_KEY);
        localStorage.removeItem(LAST_CLAIM_KEY);
        window.location.href = "index.html";
    });
}

// ===============================
// LOADER
// ===============================
function showLoader() {
    if (loader) loader.style.display = "flex";
}

function hideLoader() {
    if (loader) loader.style.display = "none";
}

// ===============================
// FETCH GAMES
// ===============================
let sliderGames = [];
let currentSlide = 0;
let slideInterval;

async function fetchGames(query = "") {
    showLoader();
    try {
        const url = query.length > 0
            ? `${BASE_URL}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=24`
            : `${BASE_URL}/games?key=${API_KEY}&platforms=4,187&page_size=24&ordering=-added`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const games = data.results || [];
        
        renderGames(games);
        
        if (!query && games.length > 0) {
            createSlider(games.slice(0, 5));
        }
        
        // Initialize notifications
        renderNotifications();
        updateNotificationBell();
        
    } catch (err) {
        console.error(err);
        if (gamesContainer) {
            gamesContainer.innerHTML = "<div class='error-message'><i class='bx bx-error-circle'></i> Failed to load games. Please try again.</div>";
        }
    } finally {
        hideLoader();
    }
}

fetchGames();

// ===============================
// RENDER GAMES WITH ANIMATION
// ===============================
function renderGames(games) {
    if (!gamesContainer) return;
    
    gamesContainer.innerHTML = "";
    if (!games || games.length === 0) {
        gamesContainer.innerHTML = "<div class='error-message'><i class='bx bx-search'></i> No games found</div>";
        return;
    }
    
    games.forEach((game, index) => {
        const stars = "⭐".repeat(Math.floor(game.rating || 0));
        const card = document.createElement("div");
        card.className = "game-card";
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="game-card-inner">
                <img src="${game.background_image || 'https://via.placeholder.com/300x200?text=🎮'}" 
                     alt="${game.name}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200?text=🎮'">
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
    if (!slidesContainer || !dotsContainer) return;
    
    sliderGames = games;
    slidesContainer.innerHTML = "";
    dotsContainer.innerHTML = "";
    
    games.forEach((game, i) => {
        const slideDiv = document.createElement("div");
        slideDiv.className = "slide";
        slideDiv.style.backgroundImage = `url(${game.background_image || 'https://via.placeholder.com/800x400?text=🎮'})`;
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
    
    // Clear existing interval
    if (slideInterval) clearInterval(slideInterval);
    
    // Auto slide
    if (sliderGames.length > 0) {
        slideInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % sliderGames.length;
            goSlide(currentSlide);
        }, 5000);
    }
}

function goSlide(index) {
    if (!slidesContainer || !dotsContainer) return;
    
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
    if (!gamePopup) return;
    
    showLoader();
    try {
        const res = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);
        if (!res.ok) throw new Error('Failed to fetch game details');
        const game = await res.json();

        if (popupTitle) popupTitle.innerText = game.name;
        const desc = game.description_raw || "No description available.";
        if (popupDesc) popupDesc.innerText = desc;
        if (popupImg) {
            popupImg.src = game.background_image || 'https://via.placeholder.com/300x450?text=🎮';
            popupImg.onerror = () => { popupImg.src = 'https://via.placeholder.com/300x450?text=🎮'; };
        }
        if (popupRating) popupRating.textContent = `⭐ ${game.rating || 'N/A'}`;
        if (popupRelease) popupRelease.textContent = game.released ? new Date(game.released).toLocaleDateString() : 'TBA';
        
        // Platforms
        const platforms = game.platforms?.map(p => p.platform.name).join(', ') || 'Various';
        if (popupPlatforms) popupPlatforms.textContent = platforms;

        // Screenshots
        if (popupScreens) {
            const shotRes = await fetch(`${BASE_URL}/games/${id}/screenshots?key=${API_KEY}`);
            const shots = await shotRes.json();
            popupScreens.innerHTML = "";
            
            if (shots.results?.length > 0) {
                shots.results.slice(0, 6).forEach(s => {
                    const img = document.createElement("img");
                    img.src = s.image;
                    img.loading = "lazy";
                    img.onerror = () => { img.src = 'https://via.placeholder.com/200x150?text=📷'; };
                    img.onclick = () => window.open(s.image, '_blank');
                    popupScreens.appendChild(img);
                });
            } else {
                popupScreens.innerHTML = "<p style='color: var(--text-secondary)'>No screenshots available</p>";
            }
        }

        // Trailer
        if (popupTrailer) {
            const trailerRes = await fetch(`${BASE_URL}/games/${id}/movies?key=${API_KEY}`);
            const trailerData = await trailerRes.json();
            const trailer = trailerData.results?.[0]?.data?.max || "";
            
            popupTrailer.innerHTML = trailer
                ? `<video controls width="100%" style="border-radius:12px;background:#000">
                    <source src="${trailer}" type="video/mp4">
                   </video>`
                : "<div style='color: var(--text-secondary); text-align:center; padding:20px;'><i class='bx bx-video-off'></i> No trailer available</div>";
        }

        if (popupDownload) {
            popupDownload.onclick = () => window.open(game.website || `https://rawg.io/games/${game.slug}`, '_blank');
        }
        
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
if (popupClose) {
    popupClose.addEventListener("click", () => {
        if (gamePopup) {
            gamePopup.style.display = "none";
            document.body.style.overflow = "";
        }
    });
}

if (gamePopup) {
    gamePopup.addEventListener("click", (e) => {
        if (e.target === gamePopup) {
            gamePopup.style.display = "none";
            document.body.style.overflow = "";
        }
    });
}

if (popupContent) {
    popupContent.addEventListener("click", (e) => e.stopPropagation());
}

// ===============================
// KEYBOARD SHORTCUTS
// ===============================
document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to close popups
    if (e.key === 'Escape') {
        if (gamePopup && gamePopup.style.display === 'flex') {
            gamePopup.style.display = 'none';
            document.body.style.overflow = '';
        }
        if (notificationPopup && notificationPopup.classList.contains('active')) {
            notificationPopup.classList.remove('active');
        }
        if (profilePopup && profilePopup.classList.contains('active')) {
            profilePopup.classList.remove('active');
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
    if (loading || !hasMore || !gamesContainer) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 1000;
    
    if (scrollPosition >= threshold) {
        loading = true;
        page++;
        
        try {
            const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&page=${page}&page_size=12`);
            const data = await res.json();
            
            if (data.results?.length > 0) {
                data.results.forEach(game => {
                    const stars = "⭐".repeat(Math.floor(game.rating || 0));
                    const card = document.createElement("div");
                    card.className = "game-card";
                    card.innerHTML = `
                        <div class="game-card-inner">
                            <img src="${game.background_image || 'https://via.placeholder.com/300x200?text=🎮'}" 
                                 alt="${game.name}" 
                                 loading="lazy"
                                 onerror="this.src='https://via.placeholder.com/300x200?text=🎮'">
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
    // Welcome message - will be styled horizontally
    const welcomeToast = document.createElement("div");
    welcomeToast.className = "welcome-toast";
    welcomeToast.innerHTML = `<i class="bx bx-game"></i> Welcome to Crunk Games! 🎮`;
    document.body.appendChild(welcomeToast);
    
    setTimeout(() => {
        welcomeToast.classList.add("show");
        setTimeout(() => {
            welcomeToast.classList.remove("show");
            setTimeout(() => welcomeToast.remove(), 500);
        }, 3000);
    }, 500);
    
    // Initialize Veno Coins claim button
    if (claimVenoCoinsBtn) {
        claimVenoCoinsBtn.addEventListener("click", claimVenoCoins);
    }
    
    // Update claim button every minute
    setInterval(updateClaimButton, 60000);
    updateClaimButton();
});

console.log("✅ Games page loaded with Veno Coins system");
