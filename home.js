/**
 * Crunk Games — home.js
 * Complete rewrite: all bugs fixed, all features preserved + enhanced.
 */

// ============================================================
// CONFIG
// ============================================================
const API_KEY  = 'b6eb9c2e474d41e3bcc8550e873623de';
const BASE_URL = 'https://api.rawg.io/api';

// Fallback placeholder images (placehold.co — no sign-up needed)
const PH_CARD   = 'https://placehold.co/300x450/0b1020/34d399?text=No+Image';
const PH_SCREEN = 'https://placehold.co/320x180/0b1020/34d399?text=Screenshot';
const PH_SEARCH = 'https://placehold.co/40x40/0b1020/34d399?text=?';

// ============================================================
// STATE
// ============================================================
let currentPage    = 'home';
let currentGenre   = null;
let cachedGenres   = [];
let sliderGames    = [];
let currentSlide   = 0;
let slideTimer     = null;
let searchHistory  = safeJsonParse('searchHistory', []);
let searchTimer    = null;

// ============================================================
// DOM REFERENCES — gathered once after DOMContentLoaded
// ============================================================
let $;  // populated in init()

// ============================================================
// UTILITIES
// ============================================================

function safeJsonParse(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

function futureStr(days = 90) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function fmtRating(r) { return r ? Number(r).toFixed(1) : 'N/A'; }

function fmtYear(dateStr) {
    if (!dateStr) return 'TBA';
    const y = new Date(dateStr).getFullYear();
    return isNaN(y) ? 'TBA' : String(y);
}

// ============================================================
// TOAST
// ============================================================
export function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    const icon = type === 'error' ? 'bx bx-error-circle' : 'bx bx-check-circle';
    t.innerHTML = `<i class="${icon}"></i> ${msg}`;
    container.appendChild(t);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => t.classList.add('visible'));
    });
    setTimeout(() => {
        t.classList.remove('visible');
        setTimeout(() => t.remove(), 350);
    }, 2800);
}
window.showToast = showToast;

// ============================================================
// LOADER
// ============================================================
let loaderCount = 0;
function showLoader() {
    loaderCount++;
    const el = document.getElementById('loader');
    if (el) el.style.display = 'flex';
}
function hideLoader() {
    loaderCount = Math.max(0, loaderCount - 1);
    if (loaderCount === 0) {
        const el = document.getElementById('loader');
        if (el) el.style.display = 'none';
    }
}

// ============================================================
// API HELPERS
// ============================================================
const cache = new Map();

async function apiFetch(path, params = {}) {
    const p = new URLSearchParams({ key: API_KEY, ...params });
    const url = `${BASE_URL}/${path}?${p}`;
    if (cache.has(url)) return cache.get(url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    const data = await res.json();
    cache.set(url, data);
    return data;
}

async function fetchGames(params = {}) {
    const data = await apiFetch('games', { page_size: 20, ...params });
    return data.results || [];
}

// ============================================================
// BADGE HELPER
// ============================================================
function getBadgeHTML(game) {
    if (!game) return '';
    const now = Date.now();
    if (game.tba) return '<span class="badge badge-soon">SOON</span>';
    if (game.released) {
        const rel  = new Date(game.released).getTime();
        const diff = now - rel;
        if (rel > now)            return '<span class="badge badge-soon">COMING SOON</span>';
        if (diff < 7  * 864e5)    return '<span class="badge badge-new">NEW</span>';
        if (diff < 30 * 864e5)    return '<span class="badge badge-updated">UPDATED</span>';
    }
    return '';
}

// ============================================================
// SKELETON CARDS
// ============================================================
function renderSkeletons(container, count = 8) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count },
        () => '<div class="skeleton"><div class="skeleton-img"></div></div>'
    ).join('');
}

// ============================================================
// CREATE GAME CARD
// ============================================================
function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';

    const img    = game.background_image || PH_CARD;
    const rating = fmtRating(game.rating);
    const year   = fmtYear(game.released);
    const badge  = getBadgeHTML(game);

    card.innerHTML = `
        <div class="game-card-img">
            <img src="${img}" alt="${escHtml(game.name)}" loading="lazy"
                 onerror="this.onerror=null;this.src='${PH_CARD}'">
            <div class="card-chips">
                <span class="chip-rating">${rating}</span>
                ${badge}
            </div>
            <div class="card-info">
                <div class="card-title">${escHtml(game.name)}</div>
                <div class="card-footer">
                    <span class="card-year">${year}</span>
                    <span class="card-rating">${rating}</span>
                </div>
            </div>
        </div>
    `;
    card.addEventListener('click', () => openGame(game.id));
    return card;
}

function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ============================================================
// RENDER GAMES INTO CONTAINER
// ============================================================
function renderGames(games, container) {
    if (!container) return;
    container.innerHTML = '';
    if (!games?.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bx bx-search-alt-2"></i>
                <p>No games found</p>
            </div>`;
        return;
    }
    const frag = document.createDocumentFragment();
    games.forEach(g => frag.appendChild(createGameCard(g)));
    container.appendChild(frag);
}

// ============================================================
// GENRE BAR
// ============================================================
async function loadGenres() {
    const scroll = document.getElementById('genresScroll');
    if (!scroll) return;
    try {
        const data = await apiFetch('genres');
        cachedGenres = data.results || [];
    } catch {
        cachedGenres = ['Action','Adventure','RPG','Simulation','Sports','Racing','Horror','Puzzle','Strategy','Indie','Casual']
            .map((name, i) => ({ id: i + 1, name }));
    }

    scroll.innerHTML = '';
    addGenreTag(scroll, 'All', 'all', true, () => setGenre(null));
    cachedGenres.forEach(g => {
        addGenreTag(scroll, g.name, String(g.id), false, () => setGenre(g.id));
    });
}

function addGenreTag(container, name, id, active, onClick) {
    const tag = document.createElement('span');
    tag.className = `genre-tag${active ? ' active' : ''}`;
    tag.textContent = name;
    tag.dataset.id  = id;
    tag.addEventListener('click', onClick);
    container.appendChild(tag);
}

function setGenre(id) {
    currentGenre = id;
    document.querySelectorAll('#genresScroll .genre-tag').forEach(t => {
        t.classList.toggle('active',
            id === null ? t.dataset.id === 'all' : t.dataset.id == id);
    });
    loadPageContent(currentPage);
}

// ============================================================
// PAGE TAB NAVIGATION
// ============================================================
function initTabs() {
    const nav = document.getElementById('topNav');
    if (!nav) return;
    nav.addEventListener('click', e => {
        const tab = e.target.closest('.nav-tab');
        if (!tab) return;
        e.preventDefault();
        navigateToPage(tab.dataset.page);
    });
}

function navigateToPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.page === page));
    loadPageContent(page);
}

function loadPageContent(page) {
    // Hide all dynamic sections
    document.querySelectorAll('.games-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('[id$="Section"]').forEach(s => s.style.display = 'none');

    const hero = document.getElementById('heroSection');

    switch (page) {
        case 'home':
            if (hero) hero.style.display = '';
            ['trendingSection','newReleasesSection','recentlyUpdatedSection',
             'upcomingSection','popularPcSection','popularMobileSection','html5Section']
                .forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = '';
                });
            break;
        case 'pc-games':
            if (hero) hero.style.display = 'none';
            showPcGamesPage(); break;
        case 'mobile-games':
            if (hero) hero.style.display = 'none';
            showMobileGamesPage(); break;
        case 'apk-games':
            if (hero) hero.style.display = 'none';
            showApkGamesPage(); break;
        case 'html5-games':
            if (hero) hero.style.display = 'none';
            showHtml5GamesPage(); break;
    }
}

// ============================================================
// PAGE HELPERS
// ============================================================
function ensureSection(id, htmlFn) {
    let section = document.getElementById(id);
    if (section) {
        section.style.display = '';
        return { section, fresh: false };
    }
    section = document.createElement('section');
    section.id = id;
    section.className = 'games-section';
    section.innerHTML = htmlFn();
    document.getElementById('mainContent').appendChild(section);
    return { section, fresh: true };
}

function buildPageGenreBar(section, onSelect) {
    if (!cachedGenres.length) return;
    const bar   = document.createElement('div');
    bar.className = 'page-genre-bar';
    const scroll = document.createElement('div');
    scroll.className = 'page-genre-scroll';
    bar.appendChild(scroll);

    const allTag = document.createElement('span');
    allTag.className = 'page-genre-tag active';
    allTag.textContent = 'All';
    allTag.dataset.gid = '';
    allTag.addEventListener('click', () => { activatePageGenre(scroll, ''); onSelect(null); });
    scroll.appendChild(allTag);

    cachedGenres.forEach(g => {
        const tag = document.createElement('span');
        tag.className = 'page-genre-tag';
        tag.textContent = g.name;
        tag.dataset.gid = String(g.id);
        tag.addEventListener('click', () => { activatePageGenre(scroll, String(g.id)); onSelect(g.id); });
        scroll.appendChild(tag);
    });

    // Insert after the first section-head child
    const head = section.querySelector('.section-head');
    if (head) head.insertAdjacentElement('afterend', bar);
    else section.prepend(bar);
}

function activatePageGenre(scroll, gid) {
    scroll.querySelectorAll('.page-genre-tag').forEach(t =>
        t.classList.toggle('active', t.dataset.gid === gid));
}

function activePageGenre(section) {
    return section.querySelector('.page-genre-tag.active')?.dataset.gid || '';
}

// ============================================================
// PC GAMES PAGE
// ============================================================
function showPcGamesPage() {
    const { section, fresh } = ensureSection('pcGamesSection', () => `
        <div class="section-head">
            <h2><span class="section-icon">🖥</span> PC Games</h2>
            <select id="pcFilter" class="filter-select">
                <option value="newest">Newest</option>
                <option value="updated">Updated</option>
                <option value="trending">Trending</option>
                <option value="top-rated">Top Rated</option>
                <option value="upcoming">Upcoming</option>
            </select>
        </div>
        <h3 class="sub-heading">New Releases</h3>
        <div class="games-grid" id="pcNewGrid"></div>
        <h3 class="sub-heading">Upcoming</h3>
        <div class="games-grid" id="pcUpcomingGrid"></div>
        <h3 class="sub-heading">All PC Games</h3>
        <div class="games-grid" id="pcMainGrid"></div>
    `);
    if (!fresh) return;

    buildPageGenreBar(section, gid => {
        const extra = gid ? { genres: gid } : {};
        loadPcSubSections(extra);
        loadPcMain(document.getElementById('pcFilter')?.value || 'newest', extra);
    });

    document.getElementById('pcFilter')?.addEventListener('change', e => {
        const gid = activePageGenre(section);
        const extra = gid ? { genres: gid } : {};
        loadPcMain(e.target.value, extra);
    });

    loadPcSubSections({});
    loadPcMain('newest', {});
}

async function loadPcSubSections(extra = {}) {
    const [newGames, upcoming] = await Promise.allSettled([
        fetchGames({ platforms: 4, ordering: '-released', page_size: 8, ...extra }),
        fetchGames({ platforms: 4, dates: `${todayStr()},${futureStr(90)}`, ordering: 'released', page_size: 8, ...extra })
    ]);
    renderGames(newGames.value  || [], document.getElementById('pcNewGrid'));
    renderGames(upcoming.value || [], document.getElementById('pcUpcomingGrid'));
}

async function loadPcMain(filter = 'newest', extra = {}) {
    const grid = document.getElementById('pcMainGrid');
    if (!grid) return;
    renderSkeletons(grid);
    showLoader();
    try {
        const p = { platforms: 4, page_size: 24, ...extra };
        if (filter === 'newest')    p.ordering = '-released';
        if (filter === 'updated')   p.ordering = '-updated';
        if (filter === 'trending')  p.ordering = '-added';
        if (filter === 'top-rated') p.ordering = '-rating';
        if (filter === 'upcoming') { p.ordering = 'released'; p.dates = `${todayStr()},${futureStr(90)}`; }
        renderGames(await fetchGames(p), grid);
    } catch { grid.innerHTML = '<div class="empty-state"><i class="bx bx-error"></i><p>Failed to load PC games</p></div>'; }
    finally { hideLoader(); }
}

// ============================================================
// MOBILE GAMES PAGE
// ============================================================
function showMobileGamesPage() {
    const { section, fresh } = ensureSection('mobileGamesSection', () => `
        <div class="section-head">
            <h2><span class="section-icon">📱</span> Mobile Games</h2>
            <select id="mobileFilter" class="filter-select">
                <option value="newest">Newest</option>
                <option value="updated">Updated</option>
                <option value="trending">Trending</option>
                <option value="top-rated">Top Rated</option>
            </select>
        </div>
        <h3 class="sub-heading">New Releases</h3>
        <div class="games-grid" id="mobileNewGrid"></div>
        <h3 class="sub-heading">Recently Updated</h3>
        <div class="games-grid" id="mobileRecentGrid"></div>
        <h3 class="sub-heading">All Mobile Games</h3>
        <div class="games-grid" id="mobileMainGrid"></div>
        <h3 class="sub-heading">Instant Play (HTML5)</h3>
        <div class="games-grid" id="mobileHtml5Grid"></div>
    `);
    if (!fresh) return;

    buildPageGenreBar(section, gid => {
        const extra = gid ? { genres: gid } : {};
        loadMobileSubSections(extra);
        loadMobileMain(document.getElementById('mobileFilter')?.value || 'newest', extra);
    });

    document.getElementById('mobileFilter')?.addEventListener('change', e => {
        const gid = activePageGenre(section);
        const extra = gid ? { genres: gid } : {};
        loadMobileMain(e.target.value, extra);
    });

    loadMobileSubSections({});
    loadMobileMain('newest', {});
    loadHtml5IntoGrid('mobileHtml5Grid');
}

async function loadMobileSubSections(extra = {}) {
    const [newG, recent] = await Promise.allSettled([
        fetchGames({ platforms: 187, ordering: '-released', page_size: 8, ...extra }),
        fetchGames({ platforms: 187, ordering: '-updated',  page_size: 8, ...extra })
    ]);
    renderGames(newG.value   || [], document.getElementById('mobileNewGrid'));
    renderGames(recent.value || [], document.getElementById('mobileRecentGrid'));
}

async function loadMobileMain(filter = 'newest', extra = {}) {
    const grid = document.getElementById('mobileMainGrid');
    if (!grid) return;
    renderSkeletons(grid);
    showLoader();
    try {
        const p = { platforms: 187, page_size: 24, ...extra };
        if (filter === 'newest')    p.ordering = '-released';
        if (filter === 'updated')   p.ordering = '-updated';
        if (filter === 'trending')  p.ordering = '-added';
        if (filter === 'top-rated') p.ordering = '-rating';
        renderGames(await fetchGames(p), grid);
    } catch { grid.innerHTML = '<div class="empty-state"><i class="bx bx-error"></i><p>Failed to load mobile games</p></div>'; }
    finally { hideLoader(); }
}

// ============================================================
// HTML5 GAMES PAGE
// ============================================================
function showHtml5GamesPage() {
    const { section, fresh } = ensureSection('html5PageSection', () => `
        <div class="section-head">
            <h2><span class="section-icon">⚡</span> HTML5 Games</h2>
            <span class="badge badge-new">No Download</span>
        </div>
        <h3 class="sub-heading">New Releases</h3>
        <div class="games-grid" id="html5NewGrid"></div>
        <h3 class="sub-heading">Recently Updated</h3>
        <div class="games-grid" id="html5RecentGrid"></div>
        <h3 class="sub-heading">All Instant Play</h3>
        <div class="games-grid" id="html5MainGrid"></div>
    `);
    if (!fresh) return;

    buildPageGenreBar(section, gid => {
        const extra = gid ? { genres: gid } : {};
        loadHtml5SubSections(extra);
        loadHtml5Main(extra);
    });

    loadHtml5SubSections({});
    loadHtml5Main({});
}

async function loadHtml5SubSections(extra = {}) {
    const [newG, recent] = await Promise.allSettled([
        fetchGames({ tags: 'browser', ordering: '-released', page_size: 8, ...extra }),
        fetchGames({ tags: 'browser', ordering: '-updated',  page_size: 8, ...extra })
    ]);
    renderGames(newG.value   || [], document.getElementById('html5NewGrid'));
    renderGames(recent.value || [], document.getElementById('html5RecentGrid'));
}

async function loadHtml5Main(extra = {}) {
    const grid = document.getElementById('html5MainGrid');
    if (!grid) return;
    renderSkeletons(grid);
    showLoader();
    try {
        renderGames(await fetchGames({ tags: 'browser', page_size: 24, ...extra }), grid);
    } catch { grid.innerHTML = '<div class="empty-state"><i class="bx bx-error"></i><p>Failed to load HTML5 games</p></div>'; }
    finally { hideLoader(); }
}

async function loadHtml5IntoGrid(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    try {
        renderGames(await fetchGames({ tags: 'browser', page_size: 8 }), grid);
    } catch { /* silent */ }
}

// ============================================================
// APK PAGE
// ============================================================
function showApkGamesPage() {
    const { fresh } = ensureSection('apkGamesSection', () => `
        <div class="section-head">
            <h2><span class="section-icon">📦</span> APK Games</h2>
            <span class="badge badge-soon">Coming Soon</span>
        </div>
        <div class="games-grid">
            <div class="apk-placeholder">
                <i class="bx bx-download"></i>
                <h3>APK Games Coming Soon</h3>
                <p>We're working on integrating APK APIs for direct downloads. Stay tuned for Android game APKs!</p>
            </div>
        </div>
    `);
    // no data to load
}

// ============================================================
// HOME PAGE
// ============================================================
async function loadHomePage() {
    showLoader();
    try {
        await Promise.allSettled([
            loadFeaturedSlider(),
            loadSection('trendingGames',       { ordering: '-added',    page_size: 8 }),
            loadSection('newReleasesGames',     { ordering: '-released', page_size: 8 }),
            loadSection('recentlyUpdatedGames', { ordering: '-updated',  page_size: 8 }),
            loadSection('upcomingGames', {
                dates: `${todayStr()},${futureStr(90)}`,
                ordering: 'released', page_size: 8
            }),
            loadSection('popularPcGames',     { platforms: 4,   ordering: '-rating', page_size: 8 }),
            loadSection('popularMobileGames', { platforms: 187, ordering: '-rating', page_size: 8 }),
            loadSection('html5Games', { tags: 'browser', page_size: 8 })
        ]);
    } catch (e) {
        console.error('Home page load error:', e);
    } finally {
        hideLoader();
    }
}

async function loadSection(containerId, params) {
    const el = document.getElementById(containerId);
    if (!el) return;
    renderSkeletons(el, 8);
    try {
        renderGames(await fetchGames(params), el);
    } catch {
        el.innerHTML = '<div class="empty-state"><i class="bx bx-error"></i><p>Failed to load</p></div>';
    }
}

// ============================================================
// HERO SLIDER
// ============================================================
async function loadFeaturedSlider() {
    try {
        const games = await fetchGames({ ordering: '-added', page_size: 6 });
        buildSlider(games);
    } catch { /* slider stays empty — non-critical */ }
}

function buildSlider(games) {
    const track = document.getElementById('slides');
    const dotsEl = document.getElementById('dots');
    if (!track || !dotsEl) return;

    sliderGames  = games;
    currentSlide = 0;

    track.innerHTML = '';
    dotsEl.innerHTML = '';

    games.forEach((g, i) => {
        const slide = document.createElement('div');
        slide.className = `hero-slide${i === 0 ? ' active' : ''}`;
        slide.style.backgroundImage = `url(${g.background_image || PH_CARD})`;
        slide.innerHTML = `
            <div class="hero-caption">
                <h3>${escHtml(g.name)}</h3>
                <p>${fmtRating(g.rating)} ★ &bull; ${fmtYear(g.released)}</p>
            </div>`;
        slide.addEventListener('click', () => openGame(g.id));
        track.appendChild(slide);

        const dot = document.createElement('span');
        dot.className = `hero-dot${i === 0 ? ' active' : ''}`;
        dot.addEventListener('click', e => { e.stopPropagation(); goSlide(i); });
        dotsEl.appendChild(dot);
    });

    restartSlideTimer();
}

function goSlide(idx) {
    const track  = document.getElementById('slides');
    const dotsEl = document.getElementById('dots');
    if (!track || !sliderGames.length) return;
    currentSlide = (idx + sliderGames.length) % sliderGames.length;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    track.querySelectorAll('.hero-slide').forEach((s, i) =>
        s.classList.toggle('active', i === currentSlide));
    dotsEl.querySelectorAll('.hero-dot').forEach((d, i) =>
        d.classList.toggle('active', i === currentSlide));
}

function restartSlideTimer() {
    clearInterval(slideTimer);
    if (sliderGames.length > 1) {
        slideTimer = setInterval(() => goSlide(currentSlide + 1), 5000);
    }
}

// ============================================================
// GAME POPUP
// ============================================================
async function openGame(id) {
    const overlay = document.getElementById('gamePopup');
    if (!overlay) return;
    showLoader();
    try {
        const [game, screensData, moviesData] = await Promise.all([
            apiFetch(`games/${id}`),
            apiFetch(`games/${id}/screenshots`).catch(() => ({ results: [] })),
            apiFetch(`games/${id}/movies`).catch(() => ({ results: [] }))
        ]);

        // Title & hero
        document.getElementById('popupTitle').textContent   = game.name || '';
        document.getElementById('popupRating').textContent  = fmtRating(game.rating);
        document.getElementById('popupRelease').textContent = game.released
            ? new Date(game.released).toLocaleDateString() : 'TBA';

        const img = document.getElementById('popupImg');
        if (img) {
            img.src = game.background_image || PH_CARD;
            img.onerror = () => { img.onerror = null; img.src = PH_CARD; };
        }

        // Badges
        const badgesEl = document.getElementById('popupBadges');
        if (badgesEl) badgesEl.innerHTML = getBadgeHTML(game) || '';

        // Description
        document.getElementById('popupDesc').textContent =
            game.description_raw || 'No description available.';

        // Meta
        const meta = {
            popupPlatforms: game.platforms?.map(p => p.platform.name).join(', ') || '—',
            popupGenre:     game.genres?.map(g => g.name).join(', ')          || '—',
            popupDeveloper: game.developers?.map(d => d.name).join(', ')      || '—',
            popupPublisher: game.publishers?.map(p => p.name).join(', ')      || '—',
            popupStores:    game.stores?.map(s => s.store.name).join(', ')    || '—',
        };
        Object.entries(meta).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });

        // Screenshots
        const screensEl = document.getElementById('popupScreens');
        if (screensEl) {
            screensEl.innerHTML = '';
            const shots = screensData.results?.slice(0, 6) || [];
            if (shots.length) {
                shots.forEach(s => {
                    const img = document.createElement('img');
                    img.src = s.image; img.loading = 'lazy';
                    img.onerror = () => { img.onerror = null; img.src = PH_SCREEN; };
                    img.addEventListener('click', () => window.open(s.image, '_blank'));
                    screensEl.appendChild(img);
                });
            } else {
                screensEl.innerHTML = '<p style="color:var(--text2);font-size:12px">No screenshots</p>';
            }
        }

        // Trailer
        const trailerEl = document.getElementById('popupTrailer');
        if (trailerEl) {
            const mp4 = moviesData.results?.[0]?.data?.max;
            if (mp4) {
                trailerEl.innerHTML = `
                    <video controls width="100%" style="border-radius:10px;background:#000;max-height:260px">
                        <source src="${mp4}" type="video/mp4">
                    </video>`;
            } else {
                const q = encodeURIComponent(`${game.name} trailer`);
                trailerEl.innerHTML = `
                    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px">
                        <iframe
                            src="https://www.youtube.com/embed?listType=search&list=${q}"
                            style="position:absolute;inset:0;width:100%;height:100%;border:0"
                            allowfullscreen loading="lazy"
                            allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture">
                        </iframe>
                    </div>
                    <p style="font-size:11px;color:var(--text3);text-align:center;margin-top:5px">
                        YouTube — "${escHtml(game.name)}"
                    </p>`;
            }
        }

        // Buttons
        const dlBtn = document.getElementById('popupDownload');
        if (dlBtn) dlBtn.onclick = () =>
            window.open(game.website || `https://rawg.io/games/${game.slug}`, '_blank');

        const favBtn = document.getElementById('popupFavorite');
        if (favBtn) favBtn.onclick = () => showToast(`❤️ ${game.name} saved to favorites!`);

        // Show
        overlay.style.display = 'flex';
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

    } catch (e) {
        console.error('openGame error:', e);
        showToast('Failed to load game details', 'error');
    } finally {
        hideLoader();
    }
}

function closePopup() {
    const overlay = document.getElementById('gamePopup');
    if (overlay) { overlay.style.display = 'none'; overlay.classList.remove('open'); }
    document.body.style.overflow = '';
}

// ============================================================
// SEARCH
// ============================================================
function initSearch() {
    const input    = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    const dropdown = document.getElementById('searchResults');
    if (!input) return;

    input.addEventListener('input', () => {
        const q = input.value.trim();
        clearBtn.style.display = q.length ? 'flex' : 'none';
        clearTimeout(searchTimer);
        if (q.length < 2) {
            showSearchHistory(dropdown);
            return;
        }
        searchTimer = setTimeout(async () => {
            try {
                const games = await fetchGames({ search: q, page_size: 10 });
                renderSearchDropdown(dropdown, games, q);
            } catch { /* silent */ }
        }, 280);
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const q = input.value.trim();
            if (q.length >= 2) {
                dropdown.classList.remove('active');
                performSearch(q);
            }
        }
        if (e.key === 'Escape') dropdown.classList.remove('active');
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length < 2) showSearchHistory(dropdown);
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        dropdown.classList.remove('active');
        input.focus();
        navigateToPage('home');
        loadHomePage();
    });

    document.addEventListener('click', e => {
        if (!document.querySelector('.search-wrap')?.contains(e.target))
            dropdown.classList.remove('active');
    });
}

function showSearchHistory(dropdown) {
    if (!searchHistory.length) { dropdown.classList.remove('active'); return; }
    dropdown.innerHTML = `
        <div class="search-history-header">
            <span>Recent</span>
            <button class="clear-history-btn">Clear</button>
        </div>`;
    dropdown.querySelector('.clear-history-btn').addEventListener('click', e => {
        e.stopPropagation();
        searchHistory = [];
        localStorage.removeItem('searchHistory');
        dropdown.classList.remove('active');
    });
    searchHistory.slice(0, 5).forEach(term => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
            <div class="search-thumb"><i class="bx bx-history"></i></div>
            <div class="search-item-info">
                <div class="search-item-title">${escHtml(term)}</div>
            </div>`;
        item.addEventListener('click', () => {
            document.getElementById('searchInput').value = term;
            dropdown.classList.remove('active');
            performSearch(term);
        });
        dropdown.appendChild(item);
    });
    dropdown.classList.add('active');
}

function renderSearchDropdown(dropdown, games, query) {
    dropdown.innerHTML = '';
    if (!games.length) { dropdown.classList.remove('active'); return; }

    const label = document.createElement('div');
    label.className = 'search-section-label';
    label.textContent = 'Games';
    dropdown.appendChild(label);

    games.slice(0, 5).forEach(g => {
        const item = document.createElement('div');
        item.className = 'search-item';
        const thumb = g.background_image || PH_SEARCH;
        item.innerHTML = `
            <img src="${thumb}" alt="${escHtml(g.name)}"
                 onerror="this.onerror=null;this.src='${PH_SEARCH}'">
            <div class="search-item-info">
                <div class="search-item-title">${escHtml(g.name)}</div>
                <div class="search-item-meta">${fmtYear(g.released)} · ${fmtRating(g.rating)}</div>
            </div>`;
        item.addEventListener('click', () => {
            openGame(g.id);
            saveSearch(g.name);
            dropdown.classList.remove('active');
            document.getElementById('searchInput').value = '';
            document.getElementById('searchClear').style.display = 'none';
        });
        dropdown.appendChild(item);
    });

    if (games.length > 5) {
        const all = document.createElement('div');
        all.className = 'search-view-all';
        all.innerHTML = `View all ${games.length} results <i class="bx bx-chevron-right"></i>`;
        all.addEventListener('click', () => {
            dropdown.classList.remove('active');
            performSearch(query);
        });
        dropdown.appendChild(all);
    }

    dropdown.classList.add('active');
}

function saveSearch(q) {
    if (!q || q.length < 2) return;
    searchHistory = [q, ...searchHistory.filter(x => x !== q)].slice(0, 6);
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

async function performSearch(query) {
    if (!query || query.length < 2) return;
    showLoader();
    try {
        const games = await fetchGames({ search: query, page_size: 24 });
        const mc = document.getElementById('mainContent');
        mc.innerHTML = `
            <section class="games-section" id="searchSection">
                <div class="section-head">
                    <h2>Results: "${escHtml(query)}"</h2>
                    <span style="color:var(--text2);font-size:12px">${games.length} found</span>
                </div>
                <div class="games-grid" id="searchGrid"></div>
            </section>`;
        renderGames(games, document.getElementById('searchGrid'));
        saveSearch(query);
    } catch {
        showToast('Search failed', 'error');
    } finally {
        hideLoader();
    }
}

// ============================================================
// VENO COINS
// ============================================================
const COINS_KEY = 'venoCoins';
const CLAIM_KEY = 'lastVenoClaim';

function getCoins()        { return parseInt(localStorage.getItem(COINS_KEY) || '0', 10); }
function updateCoinsUI()   { const el = document.getElementById('venoCoinsAmount'); if (el) el.textContent = getCoins(); }
function canClaim()        { const lc = localStorage.getItem(CLAIM_KEY); return !lc || Date.now() - parseInt(lc, 10) >= 864e5; }

function remainingTime() {
    const lc = localStorage.getItem(CLAIM_KEY);
    if (!lc) return null;
    const diff = parseInt(lc, 10) + 864e5 - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    return `${h}h ${m}m`;
}

function claimCoins() {
    if (!canClaim()) { showToast(`Next claim in ${remainingTime()}`, 'error'); return; }
    localStorage.setItem(COINS_KEY, getCoins() + 10);
    localStorage.setItem(CLAIM_KEY, String(Date.now()));
    updateCoinsUI();
    updateClaimBtn();
    showToast('🎉 You claimed 10 Veno Coins!');
}

function updateClaimBtn() {
    const btn = document.getElementById('claimVenoCoinsBtn');
    if (!btn) return;
    if (canClaim()) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-gift"></i> <span class="claim-label">Claim 10</span>';
    } else {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-clock"></i> <span class="claim-label">${remainingTime()}</span>`;
    }
}

// ============================================================
// NOTIFICATIONS
// ============================================================
let notifications = [
    { id: 1, title: 'New Games Added',  msg: 'Check out the latest releases!', time: '5 min ago',  read: false, icon: '🎮' },
    { id: 2, title: 'Special Offer',    msg: '50% off on premium games',        time: '1 hour ago', read: false, icon: '🏷️' },
    { id: 3, title: 'Update Available', msg: 'New features are live!',          time: '2 hours ago',read: true,  icon: '🔄' }
];

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    list.innerHTML = '';
    notifications.forEach(n => {
        const item = document.createElement('div');
        item.className = `notif-item${n.read ? '' : ' unread'}`;
        item.innerHTML = `
            <div class="notif-emoji">${n.icon}</div>
            <div class="notif-body">
                <div class="notif-title">${escHtml(n.title)}</div>
                <div class="notif-msg">${escHtml(n.msg)}</div>
                <div class="notif-time">${n.time}</div>
            </div>
            ${n.read ? '' : '<span class="notif-dot"></span>'}`;
        item.addEventListener('click', () => {
            notifications = notifications.map(x => x.id === n.id ? { ...x, read: true } : x);
            renderNotifications();
            updateNotifBadge();
        });
        list.appendChild(item);
    });
}

function updateNotifBadge() {
    const badge = document.getElementById('notificationCount');
    if (!badge) return;
    const unread = notifications.filter(n => !n.read).length;
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
}

// ============================================================
// SIDEBAR
// ============================================================
function initSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebarOverlay');
    const openBtn  = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeSidebar');

    function open()  { sidebar?.classList.add('open'); overlay?.classList.add('active'); document.body.style.overflow = 'hidden'; sidebar?.setAttribute('aria-hidden','false'); }
    function close() { sidebar?.classList.remove('open'); overlay?.classList.remove('active'); document.body.style.overflow = ''; sidebar?.setAttribute('aria-hidden','true'); }

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && sidebar?.classList.contains('open')) close(); });

    function nav(url) { close(); setTimeout(() => { window.location.href = url; }, 220); }

    document.getElementById('menuHome')     ?.addEventListener('click', () => { close(); navigateToPage('home'); loadHomePage(); });
    document.getElementById('menuLibrary')  ?.addEventListener('click', () => nav('library.html'));
    document.getElementById('menuFavorites')?.addEventListener('click', () => nav('favorites.html'));
    document.getElementById('menuSettings') ?.addEventListener('click', () => nav('settings.html'));
    document.getElementById('menuPrivacy')  ?.addEventListener('click', () => nav('privacy.html'));
    document.getElementById('menuHelp')     ?.addEventListener('click', () => nav('help.html'));
    document.getElementById('menuAbout')    ?.addEventListener('click', () => nav('about.html'));
    document.getElementById('menuRate')     ?.addEventListener('click', () => nav('rate.html'));
    document.getElementById('menuShare')    ?.addEventListener('click', () => {
        close();
        if (navigator.share) {
            navigator.share({ title: 'Crunk Games', text: 'Discover awesome games!', url: location.href })
                .catch(() => copyLink());
        } else { copyLink(); }
    });

    // Venaura
    document.getElementById('venauraIcon')?.addEventListener('click', () => {
        window.open('https://your-venaura-app-url.com', '_blank');
    });
}

function copyLink() {
    navigator.clipboard.writeText(location.href).then(() => showToast('Link copied!'));
}

// ============================================================
// THEME
// ============================================================
function initTheme() {
    const themeRow = document.getElementById('menuTheme');
    const themeLabel = document.getElementById('themeLabel');

    function apply(isLight) {
        document.body.classList.toggle('light-theme', isLight);
        if (themeLabel) themeLabel.textContent = isLight ? 'Light' : 'Dark';
        const sun  = themeRow?.querySelector('.bx-sun');
        const moon = themeRow?.querySelector('.bx-moon');
        if (sun)  sun.style.display  = isLight ? '' : 'none';
        if (moon) moon.style.display = isLight ? 'none' : '';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    themeRow?.addEventListener('click', () => apply(!document.body.classList.contains('light-theme')));

    if (localStorage.getItem('theme') === 'light') apply(true);
}

// ============================================================
// PROFILE / LOGOUT
// ============================================================
function initProfile() {
    const dropdown = document.getElementById('profileDropdown');
    const popup    = document.getElementById('profilePopup');

    dropdown?.addEventListener('click', e => {
        e.stopPropagation();
        popup?.classList.toggle('active');
    });

    document.addEventListener('click', () => popup?.classList.remove('active'));
    popup?.addEventListener('click', e => e.stopPropagation());

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('crunkUser');
        localStorage.removeItem(COINS_KEY);
        localStorage.removeItem(CLAIM_KEY);
        window.location.href = 'index.html';
    });
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
function initKeyboard() {
    document.addEventListener('keydown', e => {
        // Ctrl/Cmd+K → focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput')?.focus();
        }
        // Escape
        if (e.key === 'Escape') {
            closePopup();
            document.getElementById('notificationPopup')?.classList.remove('active');
            document.getElementById('profilePopup')?.classList.remove('active');
            document.getElementById('searchResults')?.classList.remove('active');
        }
        // Arrow keys for slider
        if (e.key === 'ArrowLeft')  goSlide(currentSlide - 1);
        if (e.key === 'ArrowRight') goSlide(currentSlide + 1);
    });
}

// ============================================================
// POPUP CLOSE
// ============================================================
function initPopupClose() {
    const overlay = document.getElementById('gamePopup');
    document.getElementById('popupClose')?.addEventListener('click', closePopup);
    overlay?.addEventListener('click', e => { if (e.target === overlay) closePopup(); });

    // Hero slider arrows
    document.getElementById('heroPrev')?.addEventListener('click', e => { e.stopPropagation(); goSlide(currentSlide - 1); restartSlideTimer(); });
    document.getElementById('heroNext')?.addEventListener('click', e => { e.stopPropagation(); goSlide(currentSlide + 1); restartSlideTimer(); });
}

// ============================================================
// NOTIFICATION POPUP TOGGLE
// ============================================================
function initNotifications() {
    const bell  = document.getElementById('notificationBtn');
    const popup = document.getElementById('notificationPopup');

    bell?.addEventListener('click', e => {
        e.stopPropagation();
        popup?.classList.toggle('active');
    });
    document.addEventListener('click', () => popup?.classList.remove('active'));
    popup?.addEventListener('click', e => e.stopPropagation());

    document.getElementById('markAllRead')?.addEventListener('click', () => {
        notifications = notifications.map(n => ({ ...n, read: true }));
        renderNotifications();
        updateNotifBadge();
    });
}

// ============================================================
// SESSION CHECK
// ============================================================
function initSession() {
    const user = safeJsonParse('crunkUser', null);
    if (!user) { window.location.href = 'index.html'; return false; }

    const avatarUrl = u =>
        u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || 'User')}&background=34d399&color=fff&size=128`;
    const av = avatarUrl(user);

    const g = document.getElementById('googleProfilePic');
    const p = document.getElementById('popupProfilePic');
    if (g) g.src = av;
    if (p) p.src = av;

    const nameEl  = document.getElementById('accountName');
    const emailEl = document.getElementById('accountEmail');
    if (nameEl)  nameEl.textContent  = user.displayName || user.username || 'User';
    if (emailEl) emailEl.textContent = user.email || '';
    return true;
}

// ============================================================
// INIT — entry point
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    if (!initSession()) return;

    // Welcome banner
    const wb = document.createElement('div');
    wb.className = 'welcome-banner';
    wb.innerHTML = '<span>🎮</span> Welcome to Crunk Games!';
    document.body.appendChild(wb);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => wb.classList.add('show'));
    });
    setTimeout(() => { wb.classList.remove('show'); setTimeout(() => wb.remove(), 500); }, 3200);

    initTheme();
    initSidebar();
    initProfile();
    initNotifications();
    initPopupClose();
    initKeyboard();
    initTabs();
    initSearch();

    // Coins
    document.getElementById('claimVenoCoinsBtn')?.addEventListener('click', claimCoins);
    updateCoinsUI();
    updateClaimBtn();
    setInterval(updateClaimBtn, 60_000);

    // Notifications
    renderNotifications();
    updateNotifBadge();

    // Load genres then homepage
    await loadGenres();
    await loadHomePage();

    // Sub-heading styling (injected dynamically)
    const style = document.createElement('style');
    style.textContent = `.sub-heading{font-size:13px;font-weight:700;color:var(--text2);padding:14px 14px 6px;letter-spacing:.2px;}`;
    document.head.appendChild(style);
});
