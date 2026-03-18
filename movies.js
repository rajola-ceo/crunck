let page = 1;
const moviesSections = document.getElementById("moviesSections");
const categoryBtns = document.querySelectorAll(".nav-item");
const loading = document.getElementById("loading");
const hero = document.getElementById("heroSection");
const heroBadge = document.getElementById("heroBadge");
const heroTitle = document.getElementById("heroTitle");
const heroMeta = document.getElementById("heroMeta");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchClear = document.getElementById("searchClear");
const backToTopBtn = document.getElementById("backToTop");

// ================= PROFILE ELEMENTS =================
const profileAvatar = document.getElementById("profileAvatar");
const profileMenu = document.getElementById("profileMenu");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");

// ================= TMDB CONFIG =================
const TMDB_KEY = "2a48fa3779af50f428b6d5f73d4d8ba7"; 
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const IMG_BASE_LARGE = "https://image.tmdb.org/t/p/w1280";

// Cache for movie data
const movieCache = new Map();

// State management
let currentCategory = "for-you";
let currentGenreId = "";
let heroData = [];
let heroIndex = 0;
let heroInterval;

// ================= PROFILE MANAGEMENT =================
function initializeProfile() {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem("crunkUser"));
    
    if (user) {
        // User is logged in - show profile
        updateProfileUI(user);
        if (logoutBtn) logoutBtn.style.display = "flex";
        if (loginBtn) loginBtn.style.display = "none";
    } else {
        // No user - show login option
        showLoginOption();
        if (logoutBtn) logoutBtn.style.display = "none";
        if (loginBtn) loginBtn.style.display = "flex";
    }
    
    // Setup profile dropdown
    if (profileAvatar) {
        profileAvatar.addEventListener("click", (e) => {
            e.stopPropagation();
            if (profileMenu) profileMenu.classList.toggle("active");
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (profileMenu && profileAvatar && 
            !profileAvatar.contains(e.target) && 
            !profileMenu.contains(e.target)) {
            profileMenu.classList.remove("active");
        }
    });
    
    // Setup logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("crunkUser");
            window.location.href = "index.html";
        });
    }
    
    // Setup login
    if (loginBtn) {
        loginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "index.html";
        });
    }
}

function updateProfileUI(user) {
    if (profileAvatar) {
        // Set profile picture
        if (user.picture) {
            profileAvatar.innerHTML = `<img src="${user.picture}" alt="Profile" class="profile-img">`;
        } else {
            // Generate avatar from initials
            const initials = (user.username || user.name || 'U').charAt(0).toUpperCase();
            profileAvatar.innerHTML = `<div class="profile-initials">${initials}</div>`;
        }
    }
    
    if (profileName) {
        profileName.textContent = user.username || user.name || 'User';
    }
    
    if (profileEmail) {
        profileEmail.textContent = user.email || '';
    }
}

function showLoginOption() {
    if (profileAvatar) {
        profileAvatar.innerHTML = `<i class="fas fa-user-circle"></i>`;
    }
}

// ================= UTILITY FUNCTIONS =================
function showLoading() { 
    if (loading) loading.classList.add("active"); 
}

function hideLoading() { 
    if (loading) loading.classList.remove("active"); 
}

// Fetch with retry logic
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
        } catch(err) {
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}

// Cache wrapper
async function fetchWithCache(url, cacheKey) {
    if (movieCache.has(cacheKey)) {
        return movieCache.get(cacheKey);
    }
    
    const data = await fetchWithRetry(url);
    movieCache.set(cacheKey, data);
    return data;
}

// ================= NAVIGATION =================
function goToVideo(id) {
    window.location.href = `video.html?id=${id}`;
}

// Update URL params for deep linking
function updateUrlParams(category, genreId) {
    const url = new URL(window.location);
    if (category) url.searchParams.set('category', category);
    if (genreId) url.searchParams.set('genre', genreId);
    window.history.pushState({}, '', url);
}

// ================= GENRE MAPPING =================
const genreMap = {
    "for-you": { id: "", name: "For You" },
    "trending": { id: "", name: "Trending" },
    "action": { id: 28, name: "Action" },
    "horror": { id: 27, name: "Horror" },
    "adventure": { id: 12, name: "Adventure" },
    "comedy": { id: 35, name: "Comedy" },
    "drama": { id: 18, name: "Drama" },
    "top-rating": { id: "", name: "Top Rated" }
};

// ================= FETCH TRENDING =================
async function fetchTrending() {
    try {
        showLoading();
        const cacheKey = 'trending-week';
        const data = await fetchWithCache(
            `${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`,
            cacheKey
        );
        hideLoading();
        heroData = data.results.slice(0, 3);
        startHeroSlider();
        renderMovies("for-you", data.results);
        
        // Also fetch other categories
        fetchCategoryMovies("action", 28);
        fetchCategoryMovies("horror", 27);
        fetchCategoryMovies("comedy", 35);
        fetchCategoryMovies("top-rating", "");
        
    } catch(err) {
        console.error(err);
        hideLoading();
        moviesSections.innerHTML = "<p style='margin:20px;color:#888;'>Error fetching movies. Please try again later.</p>";
    }
}

// ================= FETCH CATEGORY MOVIES =================
async function fetchCategoryMovies(category, genreId) {
    try {
        let url;
        if (genreId) {
            url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}&sort_by=popularity.desc`;
        } else if (category === "top-rating") {
            url = `${TMDB_BASE}/movie/top_rated?api_key=${TMDB_KEY}`;
        } else {
            return;
        }
        
        const cacheKey = `${category}`;
        const data = await fetchWithCache(url, cacheKey);
        renderMovies(category, data.results.slice(0, 10));
    } catch(err) {
        console.error(`Error fetching ${category}:`, err);
    }
}

// ================= HERO SLIDER =================
function startHeroSlider() {
    if (heroData.length === 0) return;
    
    // Clear existing interval
    if (heroInterval) clearInterval(heroInterval);
    
    updateHero(heroData[heroIndex]);
    
    // Create hero indicators
    const heroIndicators = document.getElementById("heroIndicators");
    if (heroIndicators) {
        heroIndicators.innerHTML = "";
        heroData.forEach((_, i) => {
            const dot = document.createElement("span");
            dot.className = `hero-dot ${i === heroIndex ? 'active' : ''}`;
            dot.onclick = () => {
                heroIndex = i;
                updateHero(heroData[heroIndex]);
                updateHeroIndicators();
            };
            heroIndicators.appendChild(dot);
        });
    }
    
    heroInterval = setInterval(() => {
        heroIndex = (heroIndex + 1) % heroData.length;
        updateHero(heroData[heroIndex]);
        updateHeroIndicators();
    }, 5000);
}

function updateHeroIndicators() {
    const heroIndicators = document.getElementById("heroIndicators");
    if (heroIndicators) {
        const dots = heroIndicators.querySelectorAll(".hero-dot");
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === heroIndex);
        });
    }
}

// ================= BADGE GENERATOR =================
function getMovieBadge(movie) {
    let badge = "HD";
    const year = movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : 0;
    const currentYear = new Date().getFullYear();

    if (movie.vote_average >= 8.5) badge = "Top";
    else if (year === currentYear) badge = "New";
    
    return badge;
}

// ================= CREATE CARD =================
function createMovieCard(movie) {
    const card = document.createElement("div");
    card.classList.add("movie-card");

    const badge = getMovieBadge(movie);
    const posterUrl = movie.poster_path ? IMG_BASE + movie.poster_path : 'https://via.placeholder.com/300x450?text=🎬';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const year = movie.release_date ? movie.release_date.slice(0, 4) : 'N/A';

    card.innerHTML = `
        <img src="${posterUrl}" 
             alt="${movie.title}"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x450?text=🎬'">
        <div class="overlay">${badge}</div>
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-sub">${year} • ⭐ ${rating}</div>
        </div>
    `;

    card.addEventListener("click", () => goToVideo(movie.id));
    return card;
}

// ================= UPDATE HERO =================
function updateHero(movie) {
    if (!movie) return;
    
    // Use backdrop for better hero display
    const backdropUrl = movie.backdrop_path 
        ? IMG_BASE_LARGE + movie.backdrop_path 
        : IMG_BASE_LARGE + movie.poster_path;
    
    hero.style.backgroundImage = `url(${backdropUrl})`;

    const badge = getMovieBadge(movie);
    const year = movie.release_date?.slice(0, 4) || "N/A";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const adult = movie.adult ? "18+" : "All";

    heroBadge.innerText = badge;
    heroTitle.innerText = movie.title;
    heroMeta.innerHTML = `<i class="fas fa-star"></i> ${rating} | ${year} | ${adult} | Movie`;
}

// ================= RENDER MOVIES (HORIZONTAL CAROUSEL) =================
function renderMovies(category, movies) {
    // Check if section already exists
    let section = document.querySelector(`.carousel[data-category="${category}"]`);
    
    if (!section) {
        // Create new section
        section = document.createElement("div");
        section.classList.add("carousel");
        section.dataset.category = category;

        // Add title
        const title = document.createElement("h2");
        title.classList.add("carousel-title");
        title.textContent = genreMap[category]?.name || category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        section.appendChild(title);

        // Create horizontal scroll container
        const container = document.createElement("div");
        container.classList.add("carousel-container");
        section.appendChild(container);
        
        moviesSections.appendChild(section);
    }

    const container = section.querySelector(".carousel-container");
    container.innerHTML = ""; // Clear existing
    
    // Add movies
    movies.forEach(movie => {
        const card = createMovieCard(movie);
        container.appendChild(card);
    });
}

// ================= CATEGORY BUTTONS =================
function initializeCategoryButtons() {
    categoryBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
            // Update active state
            categoryBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            // Update category
            currentCategory = btn.dataset.category;
            currentGenreId = genreMap[currentCategory]?.id || "";
            
            // Update URL for deep linking
            updateUrlParams(currentCategory, currentGenreId);
            
            try {
                showLoading();
                
                let url;
                if (currentGenreId) {
                    url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${currentGenreId}&sort_by=popularity.desc`;
                } else if (currentCategory === "top-rating") {
                    url = `${TMDB_BASE}/movie/top_rated?api_key=${TMDB_KEY}`;
                } else if (currentCategory === "trending") {
                    url = `${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`;
                } else {
                    url = `${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`;
                }
                
                const cacheKey = `${currentCategory}`;
                const data = await fetchWithCache(url, cacheKey);
                
                // Scroll to top smoothly
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Clear and render only this category
                moviesSections.innerHTML = "";
                renderMovies(currentCategory, data.results);
                
            } catch(err) {
                console.error(err);
            } finally {
                hideLoading();
            }
        });
    });
}

// ================= SEARCH =================
let searchTimeout;

function initializeSearch() {
    if (!searchInput) return;
    
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        
        const query = searchInput.value.trim();
        
        // Show/hide clear button
        if (searchClear) {
            searchClear.style.display = query.length > 0 ? "flex" : "none";
        }
        
        if (query.length < 2) {
            searchResults.classList.remove("active");
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                const data = await fetchWithRetry(
                    `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
                );
                
                searchResults.innerHTML = "";
                
                if (data.results.length === 0) {
                    const noResults = document.createElement("div");
                    noResults.classList.add("search-item");
                    noResults.innerHTML = "<span>No movies found</span>";
                    searchResults.appendChild(noResults);
                } else {
                    data.results.slice(0, 6).forEach(movie => {
                        const item = document.createElement("div");
                        item.classList.add("search-item");
                        
                        const posterUrl = movie.poster_path 
                            ? IMG_BASE + movie.poster_path 
                            : 'https://via.placeholder.com/50?text=🎬';
                        
                        item.innerHTML = `
                            <img src="${posterUrl}" 
                                 alt="${movie.title}"
                                 loading="lazy"
                                 onerror="this.src='https://via.placeholder.com/50?text=🎬'">
                            <div class="search-item-info">
                                <div class="search-item-title">${movie.title}</div>
                                <div class="search-item-meta">${movie.release_date?.slice(0, 4) || 'N/A'} • ⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</div>
                            </div>
                        `;
                        
                        item.onclick = () => {
                            window.location.href = `video.html?id=${movie.id}`;
                            searchResults.classList.remove("active");
                            searchInput.value = "";
                            if (searchClear) searchClear.style.display = "none";
                        };
                        
                        searchResults.appendChild(item);
                    });
                }
                
                searchResults.classList.add("active");
                
            } catch(err) {
                console.error("Search error:", err);
            }
        }, 300);
    });
    
    // Clear search button
    if (searchClear) {
        searchClear.addEventListener("click", () => {
            searchInput.value = "";
            searchClear.style.display = "none";
            searchResults.classList.remove("active");
            searchInput.focus();
        });
    }
}

// ================= CLICK OUTSIDE HANDLER =================
function initializeClickOutsideHandler() {
    document.addEventListener("click", (e) => {
        if (searchInput && searchResults && 
            !searchInput.contains(e.target) && 
            !searchResults.contains(e.target)) {
            searchResults.classList.remove("active");
        }
        
        // Close profile menu when clicking outside
        if (profileMenu && profileAvatar && 
            !profileAvatar.contains(e.target) && 
            !profileMenu.contains(e.target)) {
            profileMenu.classList.remove("active");
        }
    });
}

// ================= DEEP LINKING =================
function handleDeepLinking() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
        const btn = document.querySelector(`[data-category="${category}"]`);
        if (btn) {
            setTimeout(() => btn.click(), 100);
        }
    }
}

// ================= BACK TO TOP BUTTON =================
function initializeBackToTop() {
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ================= KEYBOARD NAVIGATION =================
function initializeKeyboardNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Keyboard shortcut: Ctrl/Cmd + K to focus search
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k' && searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// ================= TOAST NOTIFICATION =================
function showToast(message) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }, 100);
}

// ================= INITIALIZE =================
function initializeApp() {
    // Initialize profile
    initializeProfile();
    
    // Initialize features
    initializeCategoryButtons();
    initializeSearch();
    initializeClickOutsideHandler();
    initializeBackToTop();
    initializeKeyboardNav();
    
    // Fetch initial data
    fetchTrending();
    
    // Handle deep linking
    handleDeepLinking();
    
    // Handle back/forward buttons
    window.addEventListener('popstate', handleDeepLinking);
    
    // Show welcome toast
    setTimeout(() => {
        showToast("Welcome to Crunk Movies! 🎬");
    }, 2000);
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// ================= CLEANUP =================
window.addEventListener('beforeunload', () => {
    if (heroInterval) clearInterval(heroInterval);
});

// ================= EXPOSE GLOBALLY =================
window.goToVideo = goToVideo;
window.showToast = showToast;
