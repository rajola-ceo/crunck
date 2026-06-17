// ===============================
// CONFIG
// ===============================
const API_KEY = "b6eb9c2e474d41e3bcc8550e873623de";
const BASE_URL = "https://api.rawg.io/api";

// ===============================
// STATE
// ===============================
let currentPage = 'home';
let currentGenre = null;
let currentGames = [];
let sliderGames = [];
let currentSlide = 0;
let slideInterval;
let page = 1;
let loading = false;
let hasMore = true;
let allGames = [];

// ===============================
// ELEMENTS
// ===============================
const mainContent = document.getElementById("mainContent");
const gamesContainer = document.getElementById("gamesContainer");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const searchResults = document.getElementById("searchResults");
const slidesContainer = document.querySelector(".slides");
const dotsContainer = document.querySelector(".dots");
const loader = document.getElementById("loader");
const genresScroll = document.getElementById("genresScroll");
const topNav = document.getElementById("topNav");

// Section containers
const trendingGames = document.getElementById("trendingGames");
const newReleasesGames = document.getElementById("newReleasesGames");
const recentlyUpdatedGames = document.getElementById("recentlyUpdatedGames");
const upcomingGames = document.getElementById("upcomingGames");
const popularPcGames = document.getElementById("popularPcGames");
const popularMobileGames = document.getElementById("popularMobileGames");
const html5Games = document.getElementById("html5Games");

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
const popupFavorite = document.getElementById("popupFavorite");
const popupRating = document.getElementById("popupRating");
const popupRelease = document.getElementById("popupRelease");
const popupPlatforms = document.getElementById("popupPlatforms");
const popupGenre = document.getElementById("popupGenre");
const popupDeveloper = document.getElementById("popupDeveloper");
const popupPublisher = document.getElementById("popupPublisher");
const popupStores = document.getElementById("popupStores");
const popupBadges = document.getElementById("popupBadges");

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
                performSearch(term);
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
                    <div class="search-item-meta">${game.released ? game.released.split('-')[0] : 'N/A'} • ${game.rating || 'N/A'}</div>
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

async function performSearch(query) {
    if (!query || query.length < 2) {
        loadHomePage();
        return;
    }
    
    showLoader();
    try {
        const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=24`);
        const data = await res.json();
        const games = data.results || [];
        
        // Show in main content
        const section = document.createElement('section');
        section.className = 'games-section';
        section.innerHTML = `
            <div class="section-header">
                <h2>Search Results: "${query}"</h2>
                <span class="result-count">${games.length} games found</span>
            </div>
            <div class="games" id="searchResultsGrid"></div>
        `;
        
        // Clear main content
        mainContent.innerHTML = '';
        mainContent.appendChild(section);
        
        const grid = document.getElementById('searchResultsGrid');
        renderGamesIntoContainer(games, grid);
        
        saveSearchHistory(query);
    } catch (err) {
        console.error("Search error:", err);
        showToast("Error performing search");
    } finally {
        hideLoader();
    }
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
    
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                performSearch(query);
                if (searchResults) searchResults.classList.remove("active");
            }
        }
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
        loadHomePage();
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
// GENRES SYSTEM
// ===============================
async function loadGenres() {
    if (!genresScroll) return;
    
    try {
        const res = await fetch(`${BASE_URL}/genres?key=${API_KEY}`);
        const data = await res.json();
        const genres = data.results || [];
        
        genresScroll.innerHTML = '';
        
        // Add "All" genre
        const allGenre = document.createElement('span');
        allGenre.className = 'genre-tag active';
        allGenre.textContent = 'All';
        allGenre.dataset.id = 'all';
        allGenre.onclick = () => filterByGenre(null);
        genresScroll.appendChild(allGenre);
        
        genres.forEach(genre => {
            const tag = document.createElement('span');
            tag.className = 'genre-tag';
            tag.textContent = genre.name;
            tag.dataset.id = genre.id;
            tag.onclick = () => filterByGenre(genre.id);
            genresScroll.appendChild(tag);
        });
        
        // Also load genres for PC and Mobile pages
        loadGenresForPages(genres);
        
    } catch (err) {
        console.error("Error loading genres:", err);
        // Fallback genres
        const fallbackGenres = ['Action', 'Adventure', 'FPS', 'RPG', 'Simulation', 'Sports', 'Racing', 'Horror', 'Puzzle', 'Fighting', 'Indie', 'Casual', 'Strategy'];
        genresScroll.innerHTML = '';
        
        const allGenre = document.createElement('span');
        allGenre.className = 'genre-tag active';
        allGenre.textContent = 'All';
        allGenre.dataset.id = 'all';
        allGenre.onclick = () => filterByGenre(null);
        genresScroll.appendChild(allGenre);
        
        fallbackGenres.forEach(name => {
            const tag = document.createElement('span');
            tag.className = 'genre-tag';
            tag.textContent = name;
            tag.dataset.id = name;
            tag.onclick = () => filterByGenre(name);
            genresScroll.appendChild(tag);
        });
    }
}

function filterByGenre(genreId) {
    currentGenre = genreId;
    
    // Update active genre tag
    document.querySelectorAll('.genre-tag').forEach(tag => {
        tag.classList.toggle('active', tag.dataset.id == genreId || (genreId === null && tag.dataset.id === 'all'));
    });
    
    // Reload games based on current page
    loadPageContent(currentPage);
}

function loadGenresForPages(genres) {
    // Store genres for later use
    window.allGenres = genres;
}

// ===============================
// TOP NAVIGATION
// ===============================
if (topNav) {
    topNav.addEventListener('click', (e) => {
        const tab = e.target.closest('.nav-tab');
        if (!tab) return;
        
        e.preventDefault();
        const page = tab.dataset.page;
        navigateToPage(page);
    });
}

function navigateToPage(page) {
    currentPage = page;
    
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === page);
    });
    
    // Show/hide sections based on page
    loadPageContent(page);
}

function loadPageContent(page) {
    // Hide all sections first
    document.querySelectorAll('.games-section').forEach(section => {
        section.style.display = 'none';
    });
    document.querySelector('.featured-slider-section').style.display = 'none';
    
    // Show the appropriate sections based on page
    switch(page) {
        case 'home':
            document.querySelector('.featured-slider-section').style.display = 'block';
            document.getElementById('trendingSection').style.display = 'block';
            document.getElementById('newReleasesSection').style.display = 'block';
            document.getElementById('recentlyUpdatedSection').style.display = 'block';
            document.getElementById('upcomingSection').style.display = 'block';
            document.getElementById('popularPcSection').style.display = 'block';
            document.getElementById('popularMobileSection').style.display = 'block';
            document.getElementById('html5Section').style.display = 'block';
            break;
            
        case 'pc-games':
            showPcGamesPage();
            break;
            
        case 'mobile-games':
            showMobileGamesPage();
            break;
            
        case 'apk-games':
            showApkGamesPage();
            break;
            
        case 'html5-games':
            showHtml5GamesPage();
            break;
    }
}

// ===============================
// PC GAMES PAGE
// ===============================
function showPcGamesPage() {
    // Hide all existing sections and create PC page
    const existingSections = document.querySelectorAll('.games-section, .featured-slider-section');
    existingSections.forEach(s => s.style.display = 'none');
    
    // Check if PC page already exists
    let pcSection = document.getElementById('pcGamesSection');
    if (pcSection) {
        pcSection.style.display = 'block';
        return;
    }
    
    pcSection = document.createElement('section');
    pcSection.id = 'pcGamesSection';
    pcSection.className = 'games-section';
    pcSection.innerHTML = `
        <div class="section-header">
            <h2>PC Games</h2>
            <div class="filter-options">
                <select id="pcFilter" class="filter-select">
                    <option value="newest">Newest</option>
                    <option value="updated">Updated</option>
                    <option value="trending">Trending</option>
                    <option value="top-rated">Top Rated</option>
                    <option value="upcoming">Upcoming</option>
                </select>
            </div>
        </div>
        <div class="games" id="pcGamesGrid"></div>
    `;
    
    mainContent.appendChild(pcSection);
    
    // Load PC games
    loadPcGames('newest');
    
    // Filter change handler
    document.getElementById('pcFilter')?.addEventListener('change', (e) => {
        loadPcGames(e.target.value);
    });
}

async function loadPcGames(filter = 'newest') {
    const grid = document.getElementById('pcGamesGrid');
    if (!grid) return;
    
    showLoader();
    try {
        let ordering = '-added';
        let dates = '';
        
        switch(filter) {
            case 'newest': ordering = '-released'; break;
            case 'updated': ordering = '-updated'; break;
            case 'trending': ordering = '-added'; break;
            case 'top-rated': ordering = '-rating'; break;
            case 'upcoming': 
                ordering = '-released';
                const today = new Date();
                const future = new Date();
                future.setDate(today.getDate() + 90);
                dates = `&dates=${today.toISOString().split('T')[0]},${future.toISOString().split('T')[0]}`;
                break;
        }
        
        const genreQuery = currentGenre ? `&genres=${currentGenre}` : '';
        const url = `${BASE_URL}/games?key=${API_KEY}&platforms=4&ordering=${ordering}${dates}${genreQuery}&page_size=24`;
        
        const res = await fetch(url);
        const data = await res.json();
        const games = data.results || [];
        
        renderGamesIntoContainer(games, grid);
    } catch (err) {
        console.error("Error loading PC games:", err);
        grid.innerHTML = '<div class="error-message">Failed to load PC games</div>';
    } finally {
        hideLoader();
    }
}

// ===============================
// MOBILE GAMES PAGE
// ===============================
function showMobileGamesPage() {
    const existingSections = document.querySelectorAll('.games-section, .featured-slider-section');
    existingSections.forEach(s => s.style.display = 'none');
    
    let mobileSection = document.getElementById('mobileGamesSection');
    if (mobileSection) {
        mobileSection.style.display = 'block';
        return;
    }
    
    mobileSection = document.createElement('section');
    mobileSection.id = 'mobileGamesSection';
    mobileSection.className = 'games-section';
    mobileSection.innerHTML = `
        <div class="section-header">
            <h2>Mobile Games</h2>
            <div class="filter-options">
                <select id="mobileFilter" class="filter-select">
                    <option value="newest">Newest</option>
                    <option value="updated">Updated</option>
                    <option value="trending">Trending</option>
                    <option value="top-rated">Top Rated</option>
                </select>
            </div>
        </div>
        <div class="games" id="mobileGamesGrid"></div>
        <div class="section-header" style="margin-top: 30px;">
            <h2>HTML5 Games - Instant Play</h2>
        </div>
        <div class="games" id="html5GamesGrid"></div>
    `;
    
    mainContent.appendChild(mobileSection);
    
    // Load mobile games
    loadMobileGames('newest');
    loadHtml5Games();
    
    document.getElementById('mobileFilter')?.addEventListener('change', (e) => {
        loadMobileGames(e.target.value);
    });
}

async function loadMobileGames(filter = 'newest') {
    const grid = document.getElementById('mobileGamesGrid');
    if (!grid) return;
    
    showLoader();
    try {
        let ordering = '-added';
        
        switch(filter) {
            case 'newest': ordering = '-released'; break;
            case 'updated': ordering = '-updated'; break;
            case 'trending': ordering = '-added'; break;
            case 'top-rated': ordering = '-rating'; break;
        }
        
        const genreQuery = currentGenre ? `&genres=${currentGenre}` : '';
        const url = `${BASE_URL}/games?key=${API_KEY}&platforms=187&ordering=${ordering}${genreQuery}&page_size=24`;
        
        const res = await fetch(url);
        const data = await res.json();
        const games = data.results || [];
        
        renderGamesIntoContainer(games, grid);
    } catch (err) {
        console.error("Error loading mobile games:", err);
        grid.innerHTML = '<div class="error-message">Failed to load mobile games</div>';
    } finally {
        hideLoader();
    }
}

// ===============================
// HTML5 GAMES
// ===============================
async function loadHtml5Games() {
    const grid = document.getElementById('html5GamesGrid') || document.getElementById('html5Games');
    if (!grid) return;
    
    try {
        // Using tags to find HTML5 games
        const url = `${BASE_URL}/games?key=${API_KEY}&tags=browser&page_size=12`;
        const res = await fetch(url);
        const data = await res.json();
        const games = data.results || [];
        
        renderGamesIntoContainer(games, grid);
    } catch (err) {
        console.error("Error loading HTML5 games:", err);
        grid.innerHTML = '<div class="error-message">Failed to load HTML5 games</div>';
    }
}

// ===============================
// APK GAMES PAGE
// ===============================
function showApkGamesPage() {
    const existingSections = document.querySelectorAll('.games-section, .featured-slider-section');
    existingSections.forEach(s => s.style.display = 'none');
    
    let apkSection = document.getElementById('apkGamesSection');
    if (apkSection) {
        apkSection.style.display = 'block';
        return;
    }
    
    apkSection = document.createElement('section');
    apkSection.id = 'apkGamesSection';
    apkSection.className = 'games-section';
    apkSection.innerHTML = `
        <div class="section-header">
            <h2>APK Games</h2>
            <span class="badge">Coming Soon</span>
        </div>
        <div class="games" id="apkGamesGrid">
            <div class="apk-placeholder">
                <i class="bx bx-download" style="font-size: 60px; color: var(--primary);"></i>
                <h3>APK Games Coming Soon</h3>
                <p>We're working on integrating APK APIs for direct downloads.</p>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 10px;">Stay tuned for Android game APKs!</p>
            </div>
        </div>
    `;
    
    mainContent.appendChild(apkSection);
}

// ===============================
// SHOW HTML5 GAMES PAGE
// ===============================
function showHtml5GamesPage() {
    const existingSections = document.querySelectorAll('.games-section, .featured-slider-section');
    existingSections.forEach(s => s.style.display = 'none');
    
    let html5Page = document.getElementById('html5PageSection');
    if (html5Page) {
        html5Page.style.display = 'block';
        return;
    }
    
    html5Page = document.createElement('section');
    html5Page.id = 'html5PageSection';
    html5Page.className = 'games-section';
    html5Page.innerHTML = `
        <div class="section-header">
            <h2>HTML5 Games - Play Instantly</h2>
            <span class="badge">No Download Required</span>
        </div>
        <div class="games" id="html5PageGrid"></div>
    `;
    
    mainContent.appendChild(html5Page);
    
    // Load HTML5 games
    loadHtml5GamesForPage();
}

async function loadHtml5GamesForPage() {
    const grid = document.getElementById('html5PageGrid');
    if (!grid) return;
    
    showLoader();
    try {
        const url = `${BASE_URL}/games?key=${API_KEY}&tags=browser&page_size=24`;
        const res = await fetch(url);
        const data = await res.json();
        const games = data.results || [];
        
        renderGamesIntoContainer(games, grid);
    } catch (err) {
        console.error("Error loading HTML5 games:", err);
        grid.innerHTML = '<div class="error-message">Failed to load HTML5 games</div>';
    } finally {
        hideLoader();
    }
}

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
function showToast(message, type = 'success') {
    if (!toastContainer) return;
    
    const toast = document.createElement("div");
    toast.className = "toast";
    const icon = type === 'success' ? 'bx bx-check-circle' : 'bx bx-error-circle';
    toast.innerHTML = `<i class="${icon}"></i> ${message}`;
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
// FETCH GAMES FOR HOME PAGE
// ===============================
async function loadHomePage() {
    showLoader();
    try {
        // Load all sections
        await Promise.all([
            loadFeaturedSlider(),
            loadTrendingGames(),
            loadNewReleases(),
            loadRecentlyUpdated(),
            loadUpcomingGames(),
            loadPopularPcGames(),
            loadPopularMobileGames(),
            loadHtml5Games()
        ]);
    } catch (err) {
        console.error("Error loading home page:", err);
    } finally {
        hideLoader();
    }
}

async function loadFeaturedSlider() {
    try {
        const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&ordering=-added&page_size=5`);
        const data = await res.json();
        const games = data.results || [];
        createSlider(games);
    } catch (err) {
        console.error("Error loading featured slider:", err);
    }
}

async function loadTrendingGames() {
    const container = document.getElementById('trendingGames');
    if (!container) return;
    
    try {
        const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&ordering=-added&page_size=8`);
        const data = await res.json();
        renderGamesIntoContainer(data.results || [], container);
    } catch (err) {
        console.error("Error loading trending games:", err);
        container.innerHTML = '<div class="error-message">Failed to load trending games</div>';
    }
}

async function loadNewReleases() {
    const container = document.getElementById('newReleasesGames');
    if (!container) return;
    
    try {
        const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&ordering=-released&page_size=8`);
        const data = await res.json();
        renderGamesIntoContainer(data.results || [], container);
    } catch (err) {
        console.error("Error loading new releases:", err);
        container.innerHTML = '<div class="error-message">Failed to load new releases</div>';
    }
}

async function loadRecentlyUpdated() {
    const container = document.getElementById('recentlyUpdatedGames');
    if (!container) return;
    
    try {
        const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&ordering=-updated&page_size=8`);
        const data = await res.json();
        renderGamesIntoContainer(data.results || [], container);
    } catch (err) {
        console.error("Error loading recently updated:", err);
        container.innerHTML = '<div class="error-message">Failed to load recently updated</div>';
    }
}

async function loadUpcomingGames() {
    const container = document.getElementById('upcomingGames');
    if (!container) return;
    
    try {
        const today = new Date();
        const future = new Date();
        future.setDate(today.getDate() + 90);
        const url = `${BASE_URL}/games?key=${API_KEY}&dates=${today.toISOString().split('T')[0]},${future.toISOString().split('T')[0]}&ordering=released&page_size=8`;
        const res = await fetch(url);
        const data = await res.json();
        renderGamesIntoContainer(data.results || [], container);
    } catch (err) {
        console.error("Error loading upcoming games:", err);
        container.innerHTML = '<div class="error-message">Failed to load upcoming games</div>';
    }
}

async function loadPopularPcGames() {
    const container = document.getElementById('popularPcGames');
    if (!container) return;
    
    try {
        const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&platforms=4&ordering=-rating&page_size=8`);
        const data = await res.json();
        renderGamesIntoContainer(data.results || [], container);
    } catch (err) {
        console.error("Error loading popular PC games:", err);
        container.innerHTML = '<div class="error-message">Failed to load PC games</div>';
    }
}

async function loadPopularMobileGames() {
    const container = document.getElementById('popularMobileGames');
    if (!container) return;
    
    try {
        const res = await fetch(`${BASE_URL}/games?key=${API_KEY}&platforms=187&ordering=-rating&page_size=8`);
        const data = await res.json();
        renderGamesIntoContainer(data.results || [], container);
    } catch (err) {
        console.error("Error loading popular mobile games:", err);
        container.innerHTML = '<div class="error-message">Failed to load mobile games</div>';
    }
}

// ===============================
// RENDER GAMES INTO CONTAINER
// ===============================
function renderGamesIntoContainer(games, container) {
    if (!container) return;
    
    container.innerHTML = "";
    if (!games || games.length === 0) {
        container.innerHTML = "<div class='error-message'><i class='bx bx-search'></i> No games found</div>";
        return;
    }
    
    games.forEach((game) => {
        const card = createGameCard(game);
        container.appendChild(card);
    });
}

// ===============================
// CREATE GAME CARD
// ===============================
function createGameCard(game) {
    const card = document.createElement("div");
    card.className = "game-card";
    card.style.animation = "fadeIn 0.5s ease forwards";
    
    const rating = game.rating ? game.rating.toFixed(1) : 'N/A';
    const year = game.released ? new Date(game.released).getFullYear() : 'TBA';
    const platforms = game.platforms ? game.platforms.map(p => p.platform.name).slice(0, 2).join(', ') : 'Various';
    const genres = game.genres ? game.genres.map(g => g.name).slice(0, 2).join(', ') : 'N/A';
    
    // Determine badge
    let badge = '';
    if (game.released) {
        const releaseDate = new Date(game.released);
        const now = new Date();
        const daysDiff = (now - releaseDate) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 7) {
            badge = '<span class="badge new">NEW</span>';
        } else if (daysDiff <= 30) {
            badge = '<span class="badge updated">UPDATED</span>';
        }
    }
    if (game.tba || (game.released && new Date(game.released) > new Date())) {
        badge = '<span class="badge coming-soon">COMING SOON</span>';
    }
    
    // Check if game is from upcoming query
    if (game.released && new Date(game.released) > new Date()) {
        badge = '<span class="badge coming-soon">COMING SOON</span>';
    }
    
    card.innerHTML = `
        <div class="game-card-inner">
            <img src="${game.background_image || 'https://via.placeholder.com/300x200?text=🎮'}" 
                 alt="${game.name}" 
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200?text=🎮'">
            <div class="game-overlay">
                <span class="game-rating-badge">${rating}</span>
                ${badge}
            </div>
            <div class="game-info">
                <div class="game-title">${game.name}</div>
                <div class="game-meta">
                    <span class="game-platform">${platforms}</span>
                    <span class="game-genre">${genres}</span>
                </div>
                <div class="game-footer">
                    <span class="game-year">${year}</span>
                    <span class="game-rating">${rating}</span>
                </div>
            </div>
        </div>
    `;
    card.onclick = () => openGame(game.id);
    return card;
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
        const rating = game.rating ? game.rating.toFixed(1) : 'N/A';
        const year = game.released ? new Date(game.released).getFullYear() : 'TBA';
        overlay.innerHTML = `
            <h3>${game.name}</h3>
            <p>${rating} • ${year}</p>
        `;
        slideDiv.appendChild(overlay);
        slidesContainer.appendChild(slideDiv);

        const dot = document.createElement("span");
        dot.className = "dot";
        dot.onclick = (e) => {
            e.stopPropagation();
            goSlide(i);
        };
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

        // Basic info
        if (popupTitle) popupTitle.innerText = game.name;
        const desc = game.description_raw || "No description available.";
        if (popupDesc) popupDesc.innerText = desc;
        if (popupImg) {
            popupImg.src = game.background_image || 'https://via.placeholder.com/300x450?text=🎮';
            popupImg.onerror = () => { popupImg.src = 'https://via.placeholder.com/300x450?text=🎮'; };
        }
        
        // Rating (numeric only)
        const rating = game.rating ? game.rating.toFixed(1) : 'N/A';
        if (popupRating) popupRating.textContent = rating;
        if (popupRelease) popupRelease.textContent = game.released ? new Date(game.released).toLocaleDateString() : 'TBA';
        
        // Platforms
        const platforms = game.platforms?.map(p => p.platform.name).join(', ') || 'Various';
        if (popupPlatforms) popupPlatforms.textContent = platforms;
        
        // Genres
        const genres = game.genres?.map(g => g.name).join(', ') || 'N/A';
        if (popupGenre) popupGenre.textContent = genres;
        
        // Developer
        if (popupDeveloper) popupDeveloper.textContent = game.developers?.map(d => d.name).join(', ') || 'N/A';
        
        // Publisher
        if (popupPublisher) popupPublisher.textContent = game.publishers?.map(p => p.name).join(', ') || 'N/A';
        
        // Stores
        if (popupStores) {
            const stores = game.stores?.map(s => s.store.name).join(', ') || 'N/A';
            popupStores.textContent = stores;
        }
        
        // Badges
        if (popupBadges) {
            popupBadges.innerHTML = '';
            let hasBadge = false;
            
            if (game.released) {
                const releaseDate = new Date(game.released);
                const now = new Date();
                const daysDiff = (now - releaseDate) / (1000 * 60 * 60 * 24);
                if (daysDiff <= 7) {
                    popupBadges.innerHTML += '<span class="badge new">NEW</span>';
                    hasBadge = true;
                } else if (daysDiff <= 30) {
                    popupBadges.innerHTML += '<span class="badge updated">UPDATED</span>';
                    hasBadge = true;
                }
            }
            if (game.tba || (game.released && new Date(game.released) > new Date())) {
                popupBadges.innerHTML += '<span class="badge coming-soon">COMING SOON</span>';
                hasBadge = true;
            }
            if (!hasBadge) {
                popupBadges.innerHTML = '<span style="color: var(--text-secondary); font-size: 12px;">No badges</span>';
            }
        }

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

        // Trailer - Try RAWG first, then YouTube
        if (popupTrailer) {
            popupTrailer.innerHTML = '<div style="text-align:center; padding:20px; color: var(--text-secondary);">Loading trailer...</div>';
            
            // Try RAWG trailer
            const trailerRes = await fetch(`${BASE_URL}/games/${id}/movies?key=${API_KEY}`);
            const trailerData = await trailerRes.json();
            const trailer = trailerData.results?.[0]?.data?.max || "";
            
            if (trailer) {
                popupTrailer.innerHTML = `
                    <video controls width="100%" style="border-radius:12px;background:#000;max-height:300px;">
                        <source src="${trailer}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                `;
            } else {
                // Fallback to YouTube search
                const searchQuery = encodeURIComponent(`${game.name} trailer gameplay`);
                popupTrailer.innerHTML = `
                    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;">
                        <iframe 
                            src="https://www.youtube.com/embed?listType=search&list=${searchQuery}" 
                            style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
                            allowfullscreen
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    </div>
                    <p style="font-size:11px;color:var(--text-secondary);text-align:center;margin-top:5px;">
                        <i class="bx bxl-youtube" style="color:#ff0000;"></i> YouTube Search: "${game.name}"
                    </p>
                `;
            }
        }

        // Download button
        if (popupDownload) {
            popupDownload.onclick = () => {
                if (game.website) {
                    window.open(game.website, '_blank');
                } else {
                    window.open(`https://rawg.io/games/${game.slug}`, '_blank');
                }
            };
        }
        
        // Favorite button
        if (popupFavorite) {
            popupFavorite.onclick = () => {
                showToast(`❤️ ${game.name} added to favorites!`);
            };
        }
        
        gamePopup.style.display = "flex";
        document.body.style.overflow = "hidden";
        
    } catch (err) {
        console.error(err);
        showToast("Failed to load game details", "error");
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
        if (searchResults && searchResults.classList.contains('active')) {
            searchResults.classList.remove('active');
        }
    }
});

// ===============================
// VIEW ALL LINKS
// ===============================
document.addEventListener('click', (e) => {
    const viewAll = e.target.closest('.view-all-link');
    if (viewAll) {
        e.preventDefault();
        const section = viewAll.dataset.section;
        showToast(`Viewing all ${section.replace('-', ' ')} games`);
    }
});

// ===============================
// INITIALIZE
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
    // Welcome message    const welcomeToast = document.createElement("div");
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
    
    // Load genres
    await loadGenres();
    
    // Load home page
    await loadHomePage();
    
    // Initialize notifications
    renderNotifications();
    updateNotificationBell();
});

console.log("✅ Games page loaded with all features");
