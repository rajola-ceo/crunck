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

// ================= TMDB CONFIG =================
// In production, move this to a backend proxy or environment variable
const TMDB_KEY = "2a48fa3779af50f428b6d5f73d4d8ba7"; 
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const IMG_BASE_LARGE = "https://image.tmdb.org/t/p/w1280";

// Cache for movie data
const movieCache = new Map();
const genreCache = new Map();

// State management
let currentPage = 1;
let isLoading = false;
let currentCategory = "trending";
let currentGenreId = "";
let heroData = [];
let heroIndex = 0;
let heroInterval;

// ================= UTILITY FUNCTIONS =================
function showLoading() { 
    loading.classList.add("active"); 
}

function hideLoading() { 
    loading.classList.remove("active"); 
}

// Exponential backoff retry logic
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
    "action": { id: 28, name: "Action" },
    "horror": { id: 27, name: "Horror" },
    "adventure": { id: 12, name: "Adventure" },
    "comedy": { id: 35, name: "Comedy" },
    "drama": { id: 18, name: "Drama" },
    "top-rating": { id: "", name: "Top Rated" }
};

// Update button text with genre names
function updateCategoryButtons() {
    categoryBtns.forEach(btn => {
        const category = btn.dataset.category;
        if (genreMap[category]?.name) {
            btn.textContent = genreMap[category].name;
        }
    });
}

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
    } catch(err) {
        console.error(err);
        hideLoading();
        moviesSections.innerHTML = "<p style='margin:20px;color:#888;'>Error fetching movies. Please try again later.</p>";
    }
}

// ================= HERO SLIDER =================
function startHeroSlider() {
    if (heroData.length === 0) return;
    
    // Clear existing interval
    if (heroInterval) clearInterval(heroInterval);
    
    updateHero(heroData[heroIndex]);
    heroInterval = setInterval(() => {
        heroIndex = (heroIndex + 1) % heroData.length;
        updateHero(heroData[heroIndex]);
    }, 5000); // Increased to 5 seconds for better UX
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

// ================= CREATE CARD WITH BADGES =================
function createMovieCard(movie) {
    const card = document.createElement("div");
    card.classList.add("movie-card");

    const badge = getMovieBadge(movie);
    const posterUrl = movie.poster_path ? IMG_BASE + movie.poster_path : 'https://via.placeholder.com/140x200';

    // Create image with lazy loading
    const img = new Image();
    img.dataset.src = posterUrl;
    img.classList.add('lazy-load');
    img.alt = movie.title;
    
    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    card.innerHTML = `
        <img src="https://via.placeholder.com/140x200?text=Loading..." 
             data-src="${posterUrl}" 
             alt="${movie.title}"
             class="lazy-load">
        <div class="overlay">${badge}</div>
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-sub">${movie.release_date || "N/A"}</div>
        </div>
    `;

    // Setup lazy loading
    const cardImg = card.querySelector('img');
    observer.observe(cardImg);

    card.addEventListener("click", () => goToVideo(movie.id));
    return card;
}

// ================= UPDATE HERO =================
function updateHero(movie) {
    // Use backdrop for better hero display
    const backdropUrl = movie.backdrop_path 
        ? IMG_BASE_LARGE + movie.backdrop_path 
        : IMG_BASE_LARGE + movie.poster_path;
    
    hero.style.backgroundImage = `url(${backdropUrl})`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';

    const badge = getMovieBadge(movie);
    const year = movie.release_date?.slice(0, 4) || "N/A";
    const rating = movie.vote_average.toFixed(1);
    const adult = movie.adult ? "18+" : "All";

    heroBadge.innerText = badge;
    heroTitle.innerText = movie.title;
    heroMeta.innerText = `★ ${rating} | ${year} | ${adult} | Movie`;
}

// ================= RENDER MOVIES =================
function renderMovies(category, movies, append = false) {
    showLoading();

    setTimeout(() => {
        if (!append) {
            moviesSections.innerHTML = "";
        }

        let section = document.querySelector(`.carousel[data-category="${category}"]`);
        
        if (!section) {
            section = document.createElement("div");
            section.classList.add("carousel");
            section.dataset.category = category;
            
            const title = document.createElement("h2");
            title.classList.add("carousel-title");
            title.textContent = category.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            section.appendChild(title);
            
            const container = document.createElement("div");
            container.classList.add("carousel-container");
            section.appendChild(container);
            
            if (!append) {
                moviesSections.appendChild(section);
            }
        }

        const container = section.querySelector(".carousel-container");
        
        movies.forEach(movie => {
            const card = createMovieCard(movie);
            container.appendChild(card);
        });

        hideLoading();
    }, 300);
}

// ================= APPEND MOVIES FOR INFINITE SCROLL =================
function appendMovies(movies) {
    renderMovies(currentCategory, movies, true);
}

// ================= LOAD MORE MOVIES (INFINITE SCROLL) =================
async function loadMoreMovies() {
    if (isLoading) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 1000;
    
    if (scrollPosition >= threshold) {
        isLoading = true;
        currentPage++;
        
        try {
            let url;
            if (currentGenreId) {
                url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${currentGenreId}&page=${currentPage}`;
            } else {
                url = `${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}&page=${currentPage}`;
            }
            
            const data = await fetchWithRetry(url);
            appendMovies(data.results);
        } catch(err) {
            console.error("Error loading more movies:", err);
        } finally {
            isLoading = false;
        }
    }
}

// ================= CATEGORY BUTTONS =================
function initializeCategoryButtons() {
    categoryBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
            // Update active state
            categoryBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            // Reset pagination
            currentPage = 1;
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
                } else {
                    url = `${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`;
                }
                
                const cacheKey = `${currentCategory}-page1`;
                const data = await fetchWithCache(url, cacheKey);
                renderMovies(currentCategory, data.results);
            } catch(err) {
                console.error(err);
                moviesSections.innerHTML = "<p style='margin:20px;color:#888;'>Error fetching movies</p>";
            } finally {
                hideLoading();
            }
        });
    });
}

// ================= SEARCH =================
let searchTimeout;

function initializeSearch() {
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        
        const query = searchInput.value.trim();
        
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
                            : 'https://via.placeholder.com/50';
                        
                        item.innerHTML = `
                            <img src="${posterUrl}" 
                                 style="width:40px;border-radius:6px;" 
                                 alt="${movie.title}"
                                 loading="lazy">
                            <span>${movie.title} (${movie.release_date?.slice(0, 4) || 'N/A'})</span>
                        `;
                        
                        item.onclick = () => {
                            window.location.href = `video.html?id=${movie.id}`;
                        };
                        
                        searchResults.appendChild(item);
                    });
                }
                
                searchResults.classList.add("active");
                
            } catch(err) {
                console.error("Search error:", err);
            }
        }, 300); // Debounce delay
    });
}

// ================= CLICK OUTSIDE HANDLER =================
function initializeClickOutsideHandler() {
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove("active");
        }
    });
}

// ================= DEEP LINKING =================
function handleDeepLinking() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const genre = urlParams.get('genre');
    
    if (category) {
        const btn = document.querySelector(`[data-category="${category}"]`);
        if (btn) {
            setTimeout(() => btn.click(), 100); // Delay to ensure DOM is ready
        }
    }
}

// ================= INITIALIZE =================
function initializeApp() {
    // Update button names
    updateCategoryButtons();
    
    // Initialize features
    initializeCategoryButtons();
    initializeSearch();
    initializeClickOutsideHandler();
    
    // Fetch initial data
    fetchTrending();
    
    // Setup infinite scroll
    window.addEventListener('scroll', loadMoreMovies);
    
    // Handle deep linking
    handleDeepLinking();
    
    // Handle back/forward buttons
    window.addEventListener('popstate', handleDeepLinking);
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// ================= CLEANUP =================
// Clean up intervals on page unload
window.addEventListener('beforeunload', () => {
    if (heroInterval) clearInterval(heroInterval);
});
    // Immediate functionality that doesn't depend on API
    document.addEventListener('DOMContentLoaded', function() {
        // Back to top button functionality
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
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
        
        // Clear search button
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');
        
        if (searchInput && searchClear) {
            searchInput.addEventListener('input', function() {
                searchClear.style.display = this.value.length > 0 ? 'flex' : 'none';
            });
            
            searchClear.addEventListener('click', function() {
                searchInput.value = '';
                searchInput.focus();
                searchClear.style.display = 'none';
                document.getElementById('searchResults').classList.remove('active');
            });
        }
        
        // Keyboard navigation for category items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    });
