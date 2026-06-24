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
let sliderGames = [];
let currentSlide = 0;
let slideInterval;

// ===============================
// ELEMENTS
// ===============================
const mainContent        = document.getElementById("mainContent");
const searchInput        = document.getElementById("searchInput");
const searchClear        = document.getElementById("searchClear");
const searchResults      = document.getElementById("searchResults");
const slidesContainer    = document.querySelector(".slides");
const dotsContainer      = document.querySelector(".dots");
const loader             = document.getElementById("loader");
const genresScroll       = document.getElementById("genresScroll");
const topNav             = document.getElementById("topNav");

// Section containers
const trendingGames        = document.getElementById("trendingGames");
const newReleasesGames     = document.getElementById("newReleasesGames");
const recentlyUpdatedGames = document.getElementById("recentlyUpdatedGames");
const upcomingGames        = document.getElementById("upcomingGames");
const popularPcGames       = document.getElementById("popularPcGames");
const popularMobileGames   = document.getElementById("popularMobileGames");
const html5Games           = document.getElementById("html5Games");

// Game popup
const gamePopup      = document.getElementById("gamePopup");
const popupContent   = document.querySelector(".popup-content");
const popupClose     = document.querySelector(".popup-content .close");
const popupTitle     = document.getElementById("popupTitle");
const popupDesc      = document.getElementById("popupDesc");
const popupImg       = document.getElementById("popupImg");
const popupTrailer   = document.getElementById("popupTrailer");
const popupScreens   = document.getElementById("popupScreens");
const popupDownload  = document.getElementById("popupDownload");
const popupFavorite  = document.getElementById("popupFavorite");
const popupRating    = document.getElementById("popupRating");
const popupRelease   = document.getElementById("popupRelease");
const popupPlatforms = document.getElementById("popupPlatforms");
const popupGenre     = document.getElementById("popupGenre");
const popupDeveloper = document.getElementById("popupDeveloper");
const popupPublisher = document.getElementById("popupPublisher");
const popupStores    = document.getElementById("popupStores");
const popupBadges    = document.getElementById("popupBadges");

// Sidebar
const menuBtn        = document.getElementById("menuBtn");
const sidebar        = document.getElementById("sidebar");
const closeSidebar   = document.getElementById("closeSidebar");
const menuTheme      = document.getElementById("menuTheme");
const themeLabel     = document.getElementById("themeLabel");
const sidebarOverlay = document.querySelector(".sidebar-overlay");

// Profile
const profileDropdown  = document.getElementById("profileDropdown");
const profilePopup     = document.getElementById("profilePopup");
const googleProfilePic = document.getElementById("googleProfilePic");
const popupProfilePic  = document.getElementById("popupProfilePic");
const accountName      = document.getElementById("accountName");
const accountEmail     = document.getElementById("accountEmail");
const logoutBtn        = document.getElementById("logoutBtn");

// Venaura App Icon
const venauraIcon = document.getElementById("venauraIcon");

// Veno Coins
const venoCoinsAmount   = document.getElementById("venoCoinsAmount");
const claimVenoCoinsBtn = document.getElementById("claimVenoCoinsBtn");

// Notifications
const notificationBell  = document.getElementById("notificationBtn") || document.getElementById("notificationBell");
const notificationPopup = document.getElementById("notificationPopup");
const notificationCount = document.getElementById("notificationCount");
const notificationList  = document.getElementById("notificationList");
const markAllReadBtn    = document.getElementById("markAllRead");

// Sidebar menu items
const menuHome      = document.getElementById("menuHome");
const menuLibrary   = document.getElementById("menuLibrary");
const menuFavorites = document.getElementById("menuFavorites");
const menuSettings  = document.getElementById("menuSettings");
const menuPrivacy   = document.getElementById("menuPrivacy");
const menuShare     = document.getElementById("menuShare");
const menuHelp      = document.getElementById("menuHelp");
const menuRate      = document.getElementById("menuRate");
const menuAbout     = document.getElementById("menuAbout");

// Toast container
let toastContainer = document.getElementById("toastContainer");
if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
}

// ===============================
// CACHED GENRES
// ===============================
let cachedGenres = [];

// ===============================
// FALLBACK IMAGE GENERATOR
// ===============================
function getFallbackImage(seed = '🎮', width = 300, height = 450) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Dark gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add border
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, width - 20, height - 20);
        
        // Draw emoji
        const fontSize = Math.min(width, height) * 0.4;
        ctx.font = `${fontSize}px Arial, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(seed, width/2, height/2 - 20);
        
        // Draw "NO IMAGE" text
        ctx.font = `bold ${Math.min(width, height) * 0.08}px Arial, sans-serif`;
        ctx.fillStyle = '#888';
        ctx.fillText('NO IMAGE', width/2, height/2 + fontSize/2 + 30);
        
        return canvas.toDataURL('image/png');
    } catch (e) {
        console.warn('Fallback image generation failed:', e);
        return 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <rect width="${width}" height="${height}" fill="#1a1a2e"/>
                <rect x="10" y="10" width="${width-20}" height="${height-20}" stroke="#34d399" stroke-width="3" fill="none"/>
                <text x="${width/2}" y="${height/2-20}" font-size="${Math.min(width,height)*0.4}px" text-anchor="middle" fill="white">${seed}</text>
                <text x="${width/2}" y="${height/2+60}" font-size="${Math.min(width,height)*0.08}px" text-anchor="middle" fill="#888">NO IMAGE</text>
            </svg>
        `);
    }
}

const fallbackCache = {};

function getCachedFallback(seed = '🎮', width = 300, height = 450) {
    const key = `${seed}_${width}_${height}`;
    if (!fallbackCache[key]) {
        fallbackCache[key] = getFallbackImage(seed, width, height);
    }
    return fallbackCache[key];
}

// ===============================
// VENO COINS SYSTEM
// ===============================
const VENO_COINS_KEY = "venoCoins";
const LAST_CLAIM_KEY = "lastVenoClaim";

function getVenoCoins() {
    return parseInt(localStorage.getItem(VENO_COINS_KEY) || '0', 10);
}

function updateVenoCoinsDisplay() {
    if (venoCoinsAmount) venoCoinsAmount.textContent = getVenoCoins();
}

function canClaimVenoCoins() {
    const lastClaim = localStorage.getItem(LAST_CLAIM_KEY);
    if (!lastClaim) return true;
    const diff = Date.now() - parseInt(lastClaim, 10);
    return diff >= 24 * 60 * 60 * 1000;
}

function getRemainingTime() {
    const lastClaim = localStorage.getItem(LAST_CLAIM_KEY);
    if (!lastClaim) return null;
    const diff = (parseInt(lastClaim, 10) + 24 * 60 * 60 * 1000) - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
}

function claimVenoCoins() {
    if (!canClaimVenoCoins()) {
        showToast(`Already claimed! Next in ${getRemainingTime()}`, "error");
        return;
    }
    localStorage.setItem(VENO_COINS_KEY, getVenoCoins() + 10);
    localStorage.setItem(LAST_CLAIM_KEY, Date.now().toString());
    updateVenoCoinsDisplay();
    showToast("🎉 You claimed 10 Veno Coins!");
    updateClaimButton();
}

function updateClaimButton() {
    if (!claimVenoCoinsBtn) return;
    if (canClaimVenoCoins()) {
        claimVenoCoinsBtn.disabled = false;
        claimVenoCoinsBtn.innerHTML = '<i class="fas fa-gift"></i> Claim 10';
    } else {
        claimVenoCoinsBtn.disabled = true;
        claimVenoCoinsBtn.innerHTML = `<i class="fas fa-clock"></i> ${getRemainingTime()}`;
    }
}

setInterval(updateClaimButton, 60000);

// ===============================
// NOTIFICATION SYSTEM
// ===============================
let notifications = [
    { id: 1, title: "New Games Added",  message: "Check out the latest games!", time: "5 min ago",  read: false, icon: "🎮" },
    { id: 2, title: "Special Offer",    message: "50% off on premium games",     time: "1 hour ago", read: false, icon: "🏷️" },
    { id: 3, title: "Update Available", message: "New features are here!",       time: "2 hours ago",read: true,  icon: "🔄" }
];

function updateNotificationBell() {
    if (!notificationCount) return;
    const unread = notifications.filter(n => !n.read).length;
    notificationCount.textContent = unread;
    notificationCount.style.display = unread > 0 ? "flex" : "none";
}

function renderNotifications() {
    if (!notificationList) return;
    notificationList.innerHTML = "";
    notifications.slice(0, 5).forEach(n => {
        const item = document.createElement("div");
        item.className = `notification-item ${n.read ? '' : 'unread'}`;
        item.innerHTML = `
            <div class="notification-icon">${n.icon}</div>
            <div class="notification-content">
                <div class="notification-title">${n.title}</div>
                <div class="notification-message">${n.message}</div>
                <div class="notification-time">${n.time}</div>
            </div>
            ${!n.read ? '<span class="notification-badge"></span>' : ''}
        `;
        item.onclick = () => {
            notifications = notifications.map(x => x.id === n.id ? {...x, read: true} : x);
            renderNotifications();
            updateNotificationBell();
        };
        notificationList.appendChild(item);
    });
}

if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", () => {
        notifications = notifications.map(n => ({...n, read: true}));
        renderNotifications();
        updateNotificationBell();
    });
}

if (notificationBell) {
    notificationBell.addEventListener("click", e => {
        e.stopPropagation();
        if (notificationPopup) notificationPopup.classList.toggle("active");
    });
}

// ===============================
// TOAST
// ===============================
function showToast(message, type = 'success') {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
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

window.showToast = showToast;

// ===============================
// LOADER
// ===============================
function showLoader() { if (loader) loader.style.display = "flex"; }
function hideLoader() { if (loader) loader.style.display = "none"; }

// ===============================
// BADGE HELPER
// ===============================
function getBadgeHTML(game) {
    if (!game) return '';
    const now = new Date();
    if (game.released) {
        const rel = new Date(game.released);
        if (rel > now) return '<span class="badge coming-soon">COMING SOON</span>';
        const days = (now - rel) / 86400000;
        if (days <= 7)  return '<span class="badge new">NEW</span>';
        if (days <= 30) return '<span class="badge updated">UPDATED</span>';
    }
    if (game.tba) return '<span class="badge coming-soon">COMING SOON</span>';
    return '';
}

// ===============================
// CREATE GAME CARD - DEBUG VERSION
// ===============================
function createGameCard(game) {
    if (!game || !game.id) {
        console.warn('Invalid game data:', game);
        const emptyCard = document.createElement("div");
        emptyCard.className = "game-card";
        emptyCard.innerHTML = `<div class="game-card-inner"><div class="game-card-img-wrap"><div class="game-info"><div class="game-title">Invalid Game</div></div></div></div>`;
        return emptyCard;
    }

    const card = document.createElement("div");
    card.className = "game-card";

    const rating = game.rating ? game.rating.toFixed(1) : 'N/A';
    const year   = game.released ? new Date(game.released).getFullYear() : 'TBA';
    const badge  = getBadgeHTML(game);
    
    // Generate fallback using game name first letter or emoji
    const seed = game.name ? game.name.charAt(0).toUpperCase() : '🎮';
    const fallbackImg = getCachedFallback(seed);
    
    // Use game image or fallback
    let imgSrc = game.background_image || fallbackImg;

    card.innerHTML = `
        <div class="game-card-inner">
            <div class="game-card-img-wrap">
                <img src="${imgSrc}" alt="${game.name || 'Game'}" loading="lazy"
                     onerror="this.onerror=null; this.src='${fallbackImg}';">
                <div class="game-overlay">
                    <span class="game-rating-badge">${rating}</span>
                    ${badge}
                </div>
                <div class="game-info">
                    <div class="game-title">${game.name || 'Unknown Game'}</div>
                    <div class="game-footer">
                        <span class="game-year">${year}</span>
                        <span class="game-rating">${rating}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    card.onclick = () => openGame(game.id);
    return card;
}

// ===============================
// RENDER INTO CONTAINER - DEBUG VERSION
// ===============================
function renderGamesIntoContainer(games, container) {
    if (!container) {
        console.warn('❌ Container not found for rendering');
        return;
    }
    
    console.log(`📦 Rendering ${games ? games.length : 0} games into container:`, container.id || 'unnamed');
    
    container.innerHTML = "";
    
    if (!games || games.length === 0) {
        console.warn('⚠️ No games to render');
        container.innerHTML = "<div class='error-message'><i class='bx bx-search'></i><br>No games found</div>";
        return;
    }
    
    let renderedCount = 0;
    games.forEach(g => {
        if (g && g.id) {
            container.appendChild(createGameCard(g));
            renderedCount++;
        } else {
            console.warn('⚠️ Skipping invalid game:', g);
        }
    });
    
    console.log(`✅ Rendered ${renderedCount} game cards`);
}

// ===============================
// GENERIC API FETCH HELPER - DEBUG VERSION
// ===============================
async function fetchGames(params = {}) {
    try {
        const defaults = { key: API_KEY, page_size: 24 };
        const query = new URLSearchParams({...defaults, ...params}).toString();
        const url = `${BASE_URL}/games?${query}`;
        console.log('🌐 Fetching:', url);
        
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`✅ Fetched ${data.results ? data.results.length : 0} games`);
        return data.results || [];
    } catch (error) {
        console.error('❌ API Error:', error);
        return [];
    }
}

// ===============================
// DATE UTILITIES
// ===============================
function todayStr() { return new Date().toISOString().split('T')[0]; }
function futureStr(days = 90) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

// ===============================
// GLOBAL GENRE FILTER BAR
// ===============================
async function loadGenres() {
    if (!genresScroll) return;
    try {
        const res  = await fetch(`${BASE_URL}/genres?key=${API_KEY}`);
        const data = await res.json();
        cachedGenres = data.results || [];
        console.log(`✅ Loaded ${cachedGenres.length} genres`);
    } catch (_) {
        cachedGenres = ['Action','Adventure','FPS','RPG','Simulation','Sports','Racing','Horror','Puzzle','Fighting','Indie','Casual','Strategy']
            .map((name, id) => ({ id: name, name }));
        console.log('⚠️ Using fallback genres');
    }

    genresScroll.innerHTML = '';
    appendGenreTag(genresScroll, 'All', 'all', () => filterByGenre(null), true);
    cachedGenres.forEach(genre => {
        appendGenreTag(genresScroll, genre.name, genre.id, () => filterByGenre(genre.id));
    });
}

function appendGenreTag(container, name, id, onClick, active = false) {
    const tag = document.createElement('span');
    tag.className = `genre-tag${active ? ' active' : ''}`;
    tag.textContent = name;
    tag.dataset.id  = id;
    tag.onclick     = onClick;
    container.appendChild(tag);
}

function filterByGenre(genreId) {
    currentGenre = genreId;
    document.querySelectorAll('#genresScroll .genre-tag').forEach(t => {
        t.classList.toggle('active', t.dataset.id == genreId || (genreId === null && t.dataset.id === 'all'));
    });
    loadPageContent(currentPage);
}

// ===============================
// PER-PAGE GENRE BAR BUILDER
// ===============================
function buildPageGenresBar(container, onSelect) {
    if (!cachedGenres.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'page-genres-bar';
    const scroll = document.createElement('div');
    scroll.className = 'page-genres-scroll';
    wrap.appendChild(scroll);

    const allTag = document.createElement('span');
    allTag.className = 'page-genre-tag active';
    allTag.textContent = 'All';
    allTag.dataset.gid = '';
    allTag.onclick = () => { setActivePageGenre(scroll, ''); onSelect(null); };
    scroll.appendChild(allTag);

    cachedGenres.forEach(genre => {
        const tag = document.createElement('span');
        tag.className = 'page-genre-tag';
        tag.textContent = genre.name;
        tag.dataset.gid = genre.id;
        tag.onclick = () => { setActivePageGenre(scroll, genre.id); onSelect(genre.id); };
        scroll.appendChild(tag);
    });

    container.insertBefore(wrap, container.firstChild.nextSibling);
}

function setActivePageGenre(scroll, gid) {
    scroll.querySelectorAll('.page-genre-tag').forEach(t => {
        t.classList.toggle('active', t.dataset.gid == gid);
    });
}

// ===============================
// TOP NAVIGATION
// ===============================
if (topNav) {
    topNav.addEventListener('click', e => {
        const tab = e.target.closest('.nav-tab');
        if (!tab) return;
        e.preventDefault();
        navigateToPage(tab.dataset.page);
    });
}

function navigateToPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.page === page);
    });
    loadPageContent(page);
}

function loadPageContent(page) {
    document.querySelectorAll('.games-section').forEach(s => s.style.display = 'none');
    const sliderSection = document.querySelector('.featured-slider-section');
    if (sliderSection) sliderSection.style.display = 'none';

    switch (page) {
        case 'home':
            if (sliderSection) sliderSection.style.display = 'block';
            ['trendingSection','newReleasesSection','recentlyUpdatedSection','upcomingSection',
             'popularPcSection','popularMobileSection','html5Section'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'block';
            });
            break;
        case 'pc-games':     showPcGamesPage();     break;
        case 'mobile-games': showMobileGamesPage(); break;
        case 'apk-games':    showApkGamesPage();    break;
        case 'html5-games':  showHtml5GamesPage();  break;
    }
}

// ===============================
// PC GAMES PAGE
// ===============================
function showPcGamesPage() {
    document.querySelectorAll('.games-section, .featured-slider-section').forEach(s => s.style.display = 'none');
    let section = document.getElementById('pcGamesSection');
    if (section) { section.style.display = 'block'; return; }

    section = document.createElement('section');
    section.id = 'pcGamesSection';
    section.className = 'games-section';
    section.innerHTML = `
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
        <div class="section-header" style="padding-top:0;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">New PC Releases</h2></div>
        <div class="games" id="pcNewReleasesGrid" style="margin-bottom:20px;"></div>
        <div class="section-header" style="padding-top:0;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">Upcoming PC Games</h2></div>
        <div class="games" id="pcUpcomingGrid" style="margin-bottom:20px;"></div>
        <div class="section-header" style="padding-top:0;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">All PC Games</h2></div>
        <div class="games" id="pcGamesGrid"></div>
    `;
    mainContent.appendChild(section);
    buildPageGenresBar(section, gid => {
        const genreQ = gid ? { genres: gid } : {};
        loadPcSubSections(genreQ);
        loadPcGames(document.getElementById('pcFilter')?.value || 'newest', genreQ);
    });

    document.getElementById('pcFilter')?.addEventListener('change', e => {
        const gid = getActivePageGenre(section);
        const genreQ = gid ? { genres: gid } : {};
        loadPcGames(e.target.value, genreQ);
    });

    loadPcSubSections({});
    loadPcGames('newest', {});
}

function getActivePageGenre(section) {
    const active = section.querySelector('.page-genre-tag.active');
    return active ? active.dataset.gid : '';
}

async function loadPcSubSections(genreExtra = {}) {
    const [newGames, upcoming] = await Promise.all([
        fetchGames({ platforms: 4, ordering: '-released', page_size: 8, ...genreExtra }),
        fetchGames({ platforms: 4, dates: `${todayStr()},${futureStr(90)}`, ordering: 'released', page_size: 8, ...genreExtra })
    ]);
    renderGamesIntoContainer(newGames, document.getElementById('pcNewReleasesGrid'));
    renderGamesIntoContainer(upcoming, document.getElementById('pcUpcomingGrid'));
}

async function loadPcGames(filter = 'newest', genreExtra = {}) {
    const grid = document.getElementById('pcGamesGrid');
    if (!grid) return;
    showLoader();
    try {
        const params = { platforms: 4, page_size: 24, ...genreExtra };
        if (filter === 'newest')    params.ordering = '-released';
        if (filter === 'updated')   params.ordering = '-updated';
        if (filter === 'trending')  params.ordering = '-added';
        if (filter === 'top-rated') params.ordering = '-rating';
        if (filter === 'upcoming') {
            params.ordering = 'released';
            params.dates = `${todayStr()},${futureStr(90)}`;
        }
        renderGamesIntoContainer(await fetchGames(params), grid);
    } catch (e) {
        console.error('PC games error:', e);
        grid.innerHTML = '<div class="error-message"><i class="bx bx-error"></i><br>Failed to load PC games</div>';
    } finally {
        hideLoader();
    }
}

// ===============================
// MOBILE GAMES PAGE
// ===============================
function showMobileGamesPage() {
    document.querySelectorAll('.games-section, .featured-slider-section').forEach(s => s.style.display = 'none');
    let section = document.getElementById('mobileGamesSection');
    if (section) { section.style.display = 'block'; return; }

    section = document.createElement('section');
    section.id = 'mobileGamesSection';
    section.className = 'games-section';
    section.innerHTML = `
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
        <div class="section-header" style="padding-top:0;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">New Mobile Releases</h2></div>
        <div class="games" id="mobileNewGrid" style="margin-bottom:20px;"></div>
        <div class="section-header" style="padding-top:0;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">Recently Updated</h2></div>
        <div class="games" id="mobileRecentGrid" style="margin-bottom:20px;"></div>
        <div class="section-header" style="padding-top:0;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">All Mobile Games</h2></div>
        <div class="games" id="mobileGamesGrid"></div>
        <div class="section-header" style="padding-top:20px;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">HTML5 — Instant Play</h2></div>
        <div class="games" id="html5GamesGrid"></div>
    `;
    mainContent.appendChild(section);
    buildPageGenresBar(section, gid => {
        const genreQ = gid ? { genres: gid } : {};
        loadMobileSubSections(genreQ);
        loadMobileGames(document.getElementById('mobileFilter')?.value || 'newest', genreQ);
    });

    document.getElementById('mobileFilter')?.addEventListener('change', e => {
        const gid = getActivePageGenre(section);
        const genreQ = gid ? { genres: gid } : {};
        loadMobileGames(e.target.value, genreQ);
    });

    loadMobileSubSections({});
    loadMobileGames('newest', {});
    loadHtml5Games();
}

async function loadMobileSubSections(genreExtra = {}) {
    const [newGames, recent] = await Promise.all([
        fetchGames({ platforms: 187, ordering: '-released', page_size: 8, ...genreExtra }),
        fetchGames({ platforms: 187, ordering: '-updated',  page_size: 8, ...genreExtra })
    ]);
    renderGamesIntoContainer(newGames, document.getElementById('mobileNewGrid'));
    renderGamesIntoContainer(recent,   document.getElementById('mobileRecentGrid'));
}

async function loadMobileGames(filter = 'newest', genreExtra = {}) {
    const grid = document.getElementById('mobileGamesGrid');
    if (!grid) return;
    showLoader();
    try {
        const params = { platforms: 187, page_size: 24, ...genreExtra };
        if (filter === 'newest')    params.ordering = '-released';
        if (filter === 'updated')   params.ordering = '-updated';
        if (filter === 'trending')  params.ordering = '-added';
        if (filter === 'top-rated') params.ordering = '-rating';
        renderGamesIntoContainer(await fetchGames(params), grid);
    } catch (e) {
        console.error('Mobile games error:', e);
        grid.innerHTML = '<div class="error-message"><i class="bx bx-error"></i><br>Failed to load mobile games</div>';
    } finally {
        hideLoader();
    }
}

// ===============================
// HTML5 GAMES
// ===============================
async function loadHtml5Games() {
    const grid = document.getElementById('html5GamesGrid') || document.getElementById('html5Games');
    if (!grid) {
        console.warn('HTML5 grid not found');
        return;
    }
    try {
        renderGamesIntoContainer(await fetchGames({ tags: 'browser', page_size: 12 }), grid);
    } catch (e) {
        console.error('HTML5 error:', e);
        grid.innerHTML = '<div class="error-message">Failed to load HTML5 games</div>';
    }
}

// ===============================
// APK GAMES PAGE
// ===============================
function showApkGamesPage() {
    document.querySelectorAll('.games-section, .featured-slider-section').forEach(s => s.style.display = 'none');
    let section = document.getElementById('apkGamesSection');
    if (section) { section.style.display = 'block'; return; }

    section = document.createElement('section');
    section.id = 'apkGamesSection';
    section.className = 'games-section';
    section.innerHTML = `
        <div class="section-header">
            <h2>APK Games</h2>
            <span class="badge">Coming Soon</span>
        </div>
        <div class="games">
            <div class="apk-placeholder">
                <i class="bx bx-download"></i>
                <h3>APK Games Coming Soon</h3>
                <p>We're working on integrating APK APIs for direct downloads.<br>Stay tuned for Android game APKs!</p>
            </div>
        </div>
    `;
    mainContent.appendChild(section);
}

// ===============================
// HTML5 PAGE
// ===============================
function showHtml5GamesPage() {
    document.querySelectorAll('.games-section, .featured-slider-section').forEach(s => s.style.display = 'none');
    let section = document.getElementById('html5PageSection');
    if (section) { section.style.display = 'block'; return; }

    section = document.createElement('section');
    section.id = 'html5PageSection';
    section.className = 'games-section';
    section.innerHTML = `
        <div class="section-header">
            <h2>HTML5 Games</h2>
            <span class="badge">No Download</span>
        </div>
        <div class="section-header" style="padding-top:0;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">New Releases</h2></div>
        <div class="games" id="html5NewGrid" style="margin-bottom:20px;"></div>
        <div class="section-header" style="padding-top:0;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">Recently Updated</h2></div>
        <div class="games" id="html5RecentGrid" style="margin-bottom:20px;"></div>
        <div class="section-header" style="padding-top:0;padding-bottom:0;"><h2 style="font-size:15px;color:var(--text-secondary);">All Instant Play Games</h2></div>
        <div class="games" id="html5PageGrid"></div>
    `;
    mainContent.appendChild(section);
    buildPageGenresBar(section, gid => {
        const genreQ = gid ? { genres: gid } : {};
        loadHtml5SubSections(genreQ);
        loadHtml5GamesForPage(genreQ);
    });

    loadHtml5SubSections({});
    loadHtml5GamesForPage({});
}

async function loadHtml5SubSections(genreExtra = {}) {
    const [newGames, recent] = await Promise.all([
        fetchGames({ tags: 'browser', ordering: '-released', page_size: 8, ...genreExtra }),
        fetchGames({ tags: 'browser', ordering: '-updated',  page_size: 8, ...genreExtra })
    ]);
    renderGamesIntoContainer(newGames, document.getElementById('html5NewGrid'));
    renderGamesIntoContainer(recent,   document.getElementById('html5RecentGrid'));
}

async function loadHtml5GamesForPage(genreExtra = {}) {
    const grid = document.getElementById('html5PageGrid');
    if (!grid) return;
    showLoader();
    try {
        renderGamesIntoContainer(await fetchGames({ tags: 'browser', page_size: 24, ...genreExtra }), grid);
    } catch (e) {
        console.error('HTML5 page error:', e);
        grid.innerHTML = '<div class="error-message">Failed to load HTML5 games</div>';
    } finally {
        hideLoader();
    }
}

// ===============================
// SESSION CHECK - FIXED
// ===============================
try {
    const userData = localStorage.getItem("crunkUser");
    let user = null;
    if (userData) {
        try {
            user = JSON.parse(userData);
        } catch (e) {
            console.warn('Invalid user data');
            user = null;
        }
    }
    
    if (!user) {
        window.location.href = "index.html";
    } else {
        const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username || 'User')}&background=34d399&color=fff&size=128`;
        if (googleProfilePic) googleProfilePic.src = avatar;
        if (popupProfilePic)  popupProfilePic.src  = avatar;
        if (accountName)  accountName.innerText  = user.displayName || user.username || "User";
        if (accountEmail) accountEmail.innerText = user.email || "";
        updateVenoCoinsDisplay();
        updateClaimButton();
    }
} catch (e) {
    console.error('Session error:', e);
    window.location.href = "index.html";
}

// ===============================
// VENAURA APP ICON
// ===============================
if (venauraIcon) {
    venauraIcon.addEventListener("click", () => {
        window.open("https://your-venaura-app-url.com", "_blank");
    });
}

// ===============================
// SIDEBAR
// ===============================
if (menuBtn) menuBtn.addEventListener("click", () => {
    sidebar?.classList.add("open");
    sidebarOverlay?.classList.add("active");
    document.body.style.overflow = "hidden";
});

function closeSidebarFunc() {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("active");
    document.body.style.overflow = "";
}

closeSidebar?.addEventListener("click", closeSidebarFunc);
sidebarOverlay?.addEventListener("click", closeSidebarFunc);

document.addEventListener("keydown", e => {
    if (e.key === "Escape" && sidebar?.classList.contains("open")) closeSidebarFunc();
});

function navigateTo(url) {
    closeSidebarFunc();
    setTimeout(() => { window.location.href = url; }, 200);
}

menuHome     ?.addEventListener("click", () => navigateTo("games.html"));
menuLibrary  ?.addEventListener("click", () => navigateTo("library.html"));
menuFavorites?.addEventListener("click", () => navigateTo("favorites.html"));
menuSettings ?.addEventListener("click", () => navigateTo("settings.html"));
menuPrivacy  ?.addEventListener("click", () => navigateTo("privacy.html"));
menuHelp     ?.addEventListener("click", () => navigateTo("help.html"));
menuAbout    ?.addEventListener("click", () => navigateTo("about.html"));
menuRate     ?.addEventListener("click", () => navigateTo("rate.html"));

menuShare?.addEventListener("click", () => {
    closeSidebarFunc();
    if (navigator.share) {
        navigator.share({ title: "Crunk Games", text: "Check out these awesome games!", url: window.location.href })
            .catch(() => { navigator.clipboard.writeText(window.location.href); showToast("Link copied!"); });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast("Link copied!");
    }
});

// ===============================
// THEME TOGGLE
// ===============================
function toggleTheme() {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    if (themeLabel) themeLabel.innerText = isLight ? "Light" : "Dark";
    localStorage.setItem("theme", isLight ? "light" : "dark");
    if (menuTheme) {
        const sun  = menuTheme.querySelector(".bx-sun");
        const moon = menuTheme.querySelector(".bx-moon");
        if (sun && moon) {
            sun.style.display  = isLight ? "inline-block" : "none";
            moon.style.display = isLight ? "none" : "inline-block";
        }
    }
}

menuTheme?.addEventListener("click", toggleTheme);

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-theme");
    if (themeLabel) themeLabel.innerText = "Light";
    const sun  = menuTheme?.querySelector(".bx-sun");
    const moon = menuTheme?.querySelector(".bx-moon");
    if (sun && moon) { sun.style.display = "inline-block"; moon.style.display = "none"; }
}

// ===============================
// PROFILE POPUP
// ===============================
profileDropdown?.addEventListener("click", e => {
    e.stopPropagation();
    profilePopup?.classList.toggle("active");
});

window.addEventListener("click", () => {
    profilePopup?.classList.remove("active");
    notificationPopup?.classList.remove("active");
    if (searchResults) searchResults.classList.remove("active");
});

profilePopup?.addEventListener("click", e => e.stopPropagation());

// ===============================
// LOGOUT
// ===============================
logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("crunkUser");
    localStorage.removeItem(VENO_COINS_KEY);
    localStorage.removeItem(LAST_CLAIM_KEY);
    window.location.href = "index.html";
});

// ===============================
// ENHANCED SEARCH
// ===============================
let searchTimeout;
let searchHistory = JSON.parse(localStorage.getItem("searchHistory") || '[]');

function saveSearchHistory(query) {
    if (!query || query.length < 2) return;
    searchHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 5);
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
}

function showSearchDropdown(games, query) {
    if (!searchResults) return;
    if (!games?.length && !searchHistory?.length) {
        searchResults.classList.remove("active");
        return;
    }

    searchResults.innerHTML = "";

    if ((!query || query.length < 2) && searchHistory.length > 0) {
        const header = document.createElement("div");
        header.className = "search-header";
        header.innerHTML = '<span>Recent Searches</span><button class="clear-history">Clear</button>';
        searchResults.appendChild(header);

        searchHistory.forEach(term => {
            const item = document.createElement("div");
            item.className = "search-item";
            item.innerHTML = `<i class="bx bx-history"></i><span>${term}</span>`;
            item.onclick = () => {
                if (searchInput) searchInput.value = term;
                performSearch(term);
                searchResults.classList.remove("active");
            };
            searchResults.appendChild(item);
        });

        header.querySelector(".clear-history")?.addEventListener("click", e => {
            e.stopPropagation();
            searchHistory = [];
            localStorage.removeItem("searchHistory");
            showSearchDropdown([], query);
        });
    }

    if (games?.length > 0) {
        if (searchHistory.length > 0) {
            const div = document.createElement("div");
            div.className = "search-divider";
            div.textContent = "Games";
            searchResults.appendChild(div);
        }

        games.slice(0, 5).forEach(game => {
            if (!game || !game.id) return;
            const item = document.createElement("div");
            item.className = "search-item";
            const rating = game.rating ? game.rating.toFixed(1) : 'N/A';
            
            const seed = game.name ? game.name.charAt(0).toUpperCase() : '🔍';
            const fallbackImg = getCachedFallback(seed, 40, 40);
            const imgSrc = game.background_image || fallbackImg;
            
            item.innerHTML = `
                <img src="${imgSrc}" alt="${game.name || 'Game'}"
                     onerror="this.onerror=null; this.src='${fallbackImg}';">
                <div class="search-item-info">
                    <div class="search-item-title">${game.name || 'Unknown'}</div>
                    <div class="search-item-meta">${game.released ? game.released.split('-')[0] : 'N/A'} · ${rating}</div>
                </div>
            `;
            item.onclick = () => {
                openGame(game.id);
                saveSearchHistory(game.name);
                searchResults.classList.remove("active");
                if (searchInput) searchInput.value = "";
                if (searchClear) searchClear.style.display = "none";
            };
            searchResults.appendChild(item);
        });

        if (games.length > 5) {
            const viewAll = document.createElement("div");
            viewAll.className = "search-view-all";
            viewAll.innerHTML = `View all ${games.length} results <i class="bx bx-chevron-right"></i>`;
            viewAll.onclick = () => {
                searchResults.classList.remove("active");
                if (searchInput) searchInput.value = "";
                if (searchClear) searchClear.style.display = "none";
                performSearch(searchInput?.value || '');
            };
            searchResults.appendChild(viewAll);
        }
    }

    searchResults.classList.add("active");
}

async function performSearch(query) {
    if (!query || query.length < 2) { loadHomePage(); return; }
    showLoader();
    try {
        const games = await fetchGames({ search: query, page_size: 24 });
        mainContent.innerHTML = `
            <section class="games-section">
                <div class="section-header">
                    <h2>Results: "${query}"</h2>
                    <span class="result-count">${games.length} games</span>
                </div>
                <div class="games" id="searchResultsGrid"></div>
            </section>
        `;
        renderGamesIntoContainer(games, document.getElementById('searchResultsGrid'));
        saveSearchHistory(query);
    } catch (e) {
        console.error('Search error:', e);
        showToast("Search failed", "error");
    } finally {
        hideLoader();
    }
}

searchInput?.addEventListener("input", async () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    if (searchClear) searchClear.style.display = q.length > 0 ? "flex" : "none";
    if (q.length < 2) { showSearchDropdown([], q); return; }
    searchTimeout = setTimeout(async () => {
        try {
            const games = await fetchGames({ search: q, page_size: 10 });
            showSearchDropdown(games, q);
        } catch (e) {
            console.error('Search suggestion error:', e);
        }
    }, 300);
});

searchInput?.addEventListener("keydown", e => {
    if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q.length >= 2) {
            performSearch(q);
            searchResults?.classList.remove("active");
        }
    }
});

searchClear?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (searchClear) searchClear.style.display = "none";
    searchResults?.classList.remove("active");
    searchInput?.focus();
    loadHomePage();
});

// ===============================
// HOME PAGE DATA LOADING
// ===============================
async function loadHomePage() {
    console.log('🏠 Loading home page...');
    showLoader();
    try {
        await Promise.all([
            loadFeaturedSlider(),
            loadSection('trendingGames',       { ordering: '-added',    page_size: 8 }),
            loadSection('newReleasesGames',     { ordering: '-released', page_size: 8 }),
            loadSection('recentlyUpdatedGames', { ordering: '-updated',  page_size: 8 }),
            loadSection('upcomingGames', {
                dates: `${todayStr()},${futureStr(90)}`,
                ordering: 'released',
                page_size: 8
            }),
            loadSection('popularPcGames',     { platforms: 4,   ordering: '-rating', page_size: 8 }),
            loadSection('popularMobileGames', { platforms: 187, ordering: '-rating', page_size: 8 }),
            loadHtml5Games()
        ]);
        console.log('✅ Home page loaded successfully');
    } catch (e) {
        console.error("❌ Error loading home page:", e);
        showToast("Error loading some games", "error");
    } finally {
        hideLoader();
    }
}

async function loadSection(containerId, params) {
    const el = document.getElementById(containerId);
    if (!el) {
        console.warn(`⚠️ Container #${containerId} not found`);
        return;
    }
    try {
        const games = await fetchGames(params);
        renderGamesIntoContainer(games, el);
    } catch (e) {
        console.error(`❌ Error loading section ${containerId}:`, e);
        el.innerHTML = '<div class="error-message">Failed to load</div>';
    }
}

async function loadFeaturedSlider() {
    try {
        const games = await fetchGames({ ordering: '-added', page_size: 5 });
        createSlider(games);
    } catch (e) {
        console.error('❌ Error loading featured slider:', e);
    }
}

// ===============================
// SLIDER
// ===============================
function createSlider(games) {
    if (!slidesContainer || !dotsContainer) {
        console.warn('⚠️ Slider containers not found');
        return;
    }
    sliderGames = games;
    slidesContainer.innerHTML = "";
    dotsContainer.innerHTML   = "";

    games.forEach((game, i) => {
        const slide = document.createElement("div");
        slide.className = "slide";
        
        const seed = game.name ? game.name.charAt(0).toUpperCase() : '🎬';
        const fallbackImg = getCachedFallback(seed, 800, 400);
        const imgSrc = game.background_image || fallbackImg;
        
        slide.style.backgroundImage = `url(${imgSrc})`;
        slide.onclick = () => openGame(game.id);

        const overlay = document.createElement("div");
        overlay.className = "slide-overlay";
        overlay.innerHTML = `<h3>${game.name || 'Unknown'}</h3><p>${game.rating ? game.rating.toFixed(1) : 'N/A'} &bull; ${game.released ? new Date(game.released).getFullYear() : 'TBA'}</p>`;
        slide.appendChild(overlay);
        slidesContainer.appendChild(slide);

        const dot = document.createElement("span");
        dot.className = "dot";
        dot.onclick = e => { e.stopPropagation(); goSlide(i); };
        dotsContainer.appendChild(dot);
    });

    goSlide(0);
    if (slideInterval) clearInterval(slideInterval);
    if (sliderGames.length > 1) {
        slideInterval = setInterval(() => goSlide((currentSlide + 1) % sliderGames.length), 5000);
    }
}

function goSlide(index) {
    if (!slidesContainer || !dotsContainer) return;
    currentSlide = index;
    slidesContainer.style.transform = `translateX(-${index * 100}%)`;
    dotsContainer.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === index));
}

// ===============================
// GAME POPUP
// ===============================
async function openGame(id) {
    if (!gamePopup) return;
    showLoader();
    try {
        const res  = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);
        if (!res.ok) throw new Error('Fetch failed');
        const game = await res.json();

        if (popupTitle)     popupTitle.innerText     = game.name || 'Unknown Game';
        if (popupDesc)      popupDesc.innerText       = game.description_raw || "No description available.";
        if (popupImg) {
            const seed = game.name ? game.name.charAt(0).toUpperCase() : '🎮';
            const fallbackImg = getCachedFallback(seed, 300, 450);
            popupImg.src = game.background_image || fallbackImg;
            popupImg.onerror = function() { this.onerror=null; this.src=fallbackImg; };
        }
        if (popupRating)    popupRating.textContent   = game.rating ? game.rating.toFixed(1) : 'N/A';
        if (popupRelease)   popupRelease.textContent   = game.released ? new Date(game.released).toLocaleDateString() : 'TBA';
        if (popupPlatforms) popupPlatforms.textContent = game.platforms?.map(p => p.platform.name).join(', ') || 'Various';
        if (popupGenre)     popupGenre.textContent     = game.genres?.map(g => g.name).join(', ') || 'N/A';
        if (popupDeveloper) popupDeveloper.textContent = game.developers?.map(d => d.name).join(', ') || 'N/A';
        if (popupPublisher) popupPublisher.textContent = game.publishers?.map(p => p.name).join(', ') || 'N/A';
        if (popupStores)    popupStores.textContent    = game.stores?.map(s => s.store.name).join(', ') || 'N/A';

        if (popupBadges) {
            const badge = getBadgeHTML(game);
            popupBadges.innerHTML = badge || '<span style="color:var(--text-secondary);font-size:12px;">—</span>';
        }

        if (popupScreens) {
            try {
                const shotRes = await fetch(`${BASE_URL}/games/${id}/screenshots?key=${API_KEY}`);
                const shots   = await shotRes.json();
                popupScreens.innerHTML = "";
                if (shots.results?.length) {
                    shots.results.slice(0, 6).forEach(s => {
                        const img = document.createElement("img");
                        img.src = s.image;
                        img.loading = "lazy";
                        img.onerror = function() { this.onerror=null; this.src=getCachedFallback('📷', 200, 150); };
                        img.onclick = () => window.open(s.image, '_blank');
                        popupScreens.appendChild(img);
                    });
                } else {
                    popupScreens.innerHTML = "<p style='color:var(--text-secondary);font-size:13px;'>No screenshots available</p>";
                }
            } catch (e) {
                console.error('Screenshot error:', e);
                popupScreens.innerHTML = "<p style='color:var(--text-secondary);font-size:13px;'>Failed to load screenshots</p>";
            }
        }

        if (popupTrailer) {
            popupTrailer.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-secondary);font-size:13px;">Loading trailer…</div>';
            try {
                const trailerRes  = await fetch(`${BASE_URL}/games/${id}/movies?key=${API_KEY}`);
                const trailerData = await trailerRes.json();
                const trailer     = trailerData.results?.[0]?.data?.max || "";

                if (trailer) {
                    popupTrailer.innerHTML = `
                        <video controls width="100%" style="border-radius:12px;background:#000;max-height:280px;">
                            <source src="${trailer}" type="video/mp4">
                        </video>
                    `;
                } else {
                    const q = encodeURIComponent(`${game.name} trailer gameplay`);
                    popupTrailer.innerHTML = `
                        <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;">
                            <iframe src="https://www.youtube.com/embed?listType=search&list=${q}"
                                style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
                                allowfullscreen loading="lazy"
                                allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture">
                            </iframe>
                        </div>
                        <p style="font-size:11px;color:var(--text-secondary);text-align:center;margin-top:5px;">
                            <i class="bx bxl-youtube" style="color:#ff0000;"></i> YouTube: "${game.name}"
                        </p>
                    `;
                }
            } catch (e) {
                console.error('Trailer error:', e);
                popupTrailer.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;">Trailer not available</p>';
            }
        }

        if (popupDownload) popupDownload.onclick = () => window.open(game.website || `https://rawg.io/games/${game.slug}`, '_blank');
        if (popupFavorite) popupFavorite.onclick = () => showToast(`❤️ ${game.name} added to favorites!`);

        gamePopup.style.display = "flex";
        document.body.style.overflow = "hidden";

    } catch (e) {
        console.error('Open game error:', e);
        showToast("Failed to load game details", "error");
    } finally {
        hideLoader();
    }
}

popupClose?.addEventListener("click", () => {
    if (gamePopup) { gamePopup.style.display = "none"; document.body.style.overflow = ""; }
});

gamePopup?.addEventListener("click", e => {
    if (e.target === gamePopup) { gamePopup.style.display = "none"; document.body.style.overflow = ""; }
});

popupContent?.addEventListener("click", e => e.stopPropagation());

// ===============================
// KEYBOARD SHORTCUTS
// ===============================
document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
    if (e.key === 'Escape') {
        if (gamePopup?.style.display === 'flex') { gamePopup.style.display = 'none'; document.body.style.overflow = ''; }
        notificationPopup?.classList.remove('active');
        profilePopup?.classList.remove('active');
        searchResults?.classList.remove('active');
    }
});

// ===============================
// VIEW ALL LINKS
// ===============================
document.addEventListener('click', e => {
    const link = e.target.closest('.view-all-link');
    if (link) {
        e.preventDefault();
        showToast(`Viewing all ${link.dataset.section?.replace(/-/g, ' ')} games`);
    }
});

// ===============================
// CLEANUP
// ===============================
window.addEventListener('beforeunload', () => {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
});

// ===============================
// INITIALIZE
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Initializing Crunk Games...');
        
        // Welcome toast
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

        claimVenoCoinsBtn?.addEventListener("click", claimVenoCoins);
        updateClaimButton();

        await loadGenres();
        await loadHomePage();

        renderNotifications();
        updateNotificationBell();
        
        console.log("✅ Crunk Games initialized successfully");
    } catch (e) {
        console.error("❌ Initialization error:", e);
        showToast("Error initializing app", "error");
    }
});

console.log("✅ Crunk Games loaded");
