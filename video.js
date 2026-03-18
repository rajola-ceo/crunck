// ================= BACK BUTTON =================
function goBack() {
    window.location.href = "movies.html";
}

// ================= GET MOVIE ID =================
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

// ================= DOM ELEMENTS =================
const videoPlayer = document.getElementById("videoPlayer");
const videoTitle = document.getElementById("videoTitle");
const videoDesc = document.getElementById("videoDesc");
const playBtn = document.getElementById("playBtn");
const trailerBtn = document.getElementById("trailerBtn");
const watchListBtn = document.getElementById("watchListBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadsMenu = document.getElementById("downloadsMenu");
const qualitySelect = document.getElementById("qualitySelect");
const download480Btn = document.getElementById("download480");
const download720Btn = document.getElementById("download720");
const download1080Btn = document.getElementById("download1080");
const watchPopupImage = document.getElementById("watchPopupImage");
const downloadCount = document.getElementById("downloadCount");
const downloadsList = document.getElementById("downloadsList");

// ================= TMDB CONFIG =================
const TMDB_KEY = "2a48fa3779af50f428b6d5f73d4d8ba7";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_BASE = "https://api.themoviedb.org/3";

// ================= DOWNLOADS MANAGEMENT =================
let downloads = JSON.parse(localStorage.getItem("downloads")) || [];

function updateDownloadsBadge() {
    if (downloadCount) {
        const count = downloads.length;
        downloadCount.textContent = count;
        downloadCount.style.display = count > 0 ? "flex" : "none";
    }
}

function renderDownloadsList() {
    if (!downloadsList) return;
    
    downloadsList.innerHTML = "";
    if (downloads.length === 0) {
        downloadsList.innerHTML = '<div class="downloads-empty">No downloads yet</div>';
        return;
    }
    
    downloads.slice(0, 5).forEach((download, index) => {
        const item = document.createElement("div");
        item.className = "downloads-item";
        item.innerHTML = `
            <img src="${download.poster || 'https://via.placeholder.com/40x60'}" alt="${download.title}">
            <div class="downloads-item-info">
                <div class="downloads-item-title">${download.title}</div>
                <div class="downloads-item-meta">${download.quality} • ${download.size}</div>
            </div>
            <button class="downloads-item-play" onclick="playDownloadedMovie('${download.id}')">
                <i class="fas fa-play"></i>
            </button>
        `;
        downloadsList.appendChild(item);
    });
    
    if (downloads.length > 5) {
        const viewAll = document.createElement("div");
        viewAll.className = "downloads-view-all";
        viewAll.innerHTML = 'View all downloads <i class="fas fa-arrow-right"></i>';
        viewAll.onclick = () => window.location.href = "downloads.html";
        downloadsList.appendChild(viewAll);
    }
}

function addToDownloads(movie, quality) {
    const sizeMap = {
        "480": "300MB",
        "720": "700MB",
        "1080": "1.5GB"
    };
    
    const download = {
        id: movie.id || Date.now(),
        title: movie.title || videoTitle.innerText,
        poster: movie.poster_path ? IMG_BASE + movie.poster_path : watchPopupImage.src,
        quality: quality + "p",
        size: sizeMap[quality] || "500MB",
        date: new Date().toLocaleDateString(),
        url: movie.video_links?.[quality] || `https://sample-videos.com/video123/mp4/${quality}/sample_${quality}p.mp4`
    };
    
    downloads = [download, ...downloads.filter(d => d.id !== download.id)].slice(0, 20);
    localStorage.setItem("downloads", JSON.stringify(downloads));
    updateDownloadsBadge();
    renderDownloadsList();
    
    // Show success toast
    showToast(`Downloading ${videoTitle.innerText} (${quality}p)`);
}

function playDownloadedMovie(id) {
    const download = downloads.find(d => d.id == id);
    if (download && download.url) {
        videoPlayer.src = download.url;
        videoPlayer.play();
        closeDownloadsMenu();
        showToast(`Playing: ${download.title}`);
    }
}

function clearAllDownloads() {
    if (confirm("Clear all downloads?")) {
        downloads = [];
        localStorage.setItem("downloads", JSON.stringify(downloads));
        updateDownloadsBadge();
        renderDownloadsList();
        showToast("All downloads cleared");
    }
}

// ================= DOWNLOADS MENU TOGGLE =================
if (downloadBtn) {
    downloadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadsMenu.classList.toggle("active");
        renderDownloadsList();
    });
}

// Close downloads menu when clicking outside
document.addEventListener("click", (e) => {
    if (downloadsMenu && !downloadBtn.contains(e.target) && !downloadsMenu.contains(e.target)) {
        downloadsMenu.classList.remove("active");
    }
});

// ================= TOAST NOTIFICATION =================
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "video-toast";
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }, 100);
}

// ================= FETCH MOVIE DATA =================
let movieData = {};

async function fetchMovieData(id) {
    try {
        // First try to fetch from your local server
        const res = await fetch(`http://localhost:3000/movies/${id}`);
        if (!res.ok) throw new Error("Movie not found in local server");
        const movie = await res.json();
        movieData = movie;

        // Update UI
        updateMovieUI(movie);
        
        // Also fetch additional data from TMDB
        fetchAdditionalMovieData(id);

    } catch (err) {
        console.log("Trying TMDB API...");
        // Fallback to TMDB API
        await fetchFromTMDB(id);
    }
}

async function fetchFromTMDB(id) {
    try {
        const res = await fetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}&append_to_response=videos,credits`);
        const movie = await res.json();
        movieData = movie;
        
        updateMovieUI(movie);
        
    } catch (err) {
        console.error(err);
        videoTitle.innerText = "Movie data not fully available";
        videoDesc.innerText = "Could not load all movie info. Try refreshing.";
        watchPopupImage.src = "https://via.placeholder.com/300x450?text=🎬";
        trailerBtn.disabled = true;
    }
}

function updateMovieUI(movie) {
    videoTitle.innerText = movie.title || movie.name || "No title available";
    videoDesc.innerText = movie.overview || "No description available";
    
    // Poster image
    if (movie.poster_path) {
        watchPopupImage.src = IMG_BASE + movie.poster_path;
    } else if (movie.backdrop_path) {
        watchPopupImage.src = IMG_BASE + movie.backdrop_path;
    } else {
        watchPopupImage.src = "https://via.placeholder.com/300x450?text=🎬";
    }

    // Setup video links (sample videos)
    movieData.video_links = {
        "480": `https://sample-videos.com/video123/mp4/480/big_buck_bunny_480p_1mb.mp4`,
        "720": `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`,
        "1080": `https://sample-videos.com/video123/mp4/1080/big_buck_bunny_1080p_1mb.mp4`
    };
}
async function fetchAdditionalMovieData(id) {
    try {
        // Fetch trailer from TMDB
        const trailerRes = await fetch(`${TMDB_BASE}/movie/${id}/videos?api_key=${TMDB_KEY}`);
        const trailerData = await trailerRes.json();
        
        // Find official YouTube trailer
        const trailer = trailerData.results?.find(v => 
            v.type === "Trailer" && 
            v.site === "YouTube" && 
            v.official === true
        ) || trailerData.results?.find(v => 
            v.type === "Trailer" && 
            v.site === "YouTube"
        );
        
        if (trailer) {
            // Enable trailer button
            trailerBtn.disabled = false;
            trailerBtn.classList.add("active");
            trailerBtn.innerHTML = '<i class="fab fa-youtube"></i> Watch Trailer';
            
            // Set click handler with proper YouTube embed URL
            trailerBtn.onclick = (e) => {
                e.preventDefault();
                playTrailer(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`);
            };
            
            console.log("✅ Trailer found:", trailer.key);
        } else {
            // No trailer available
            trailerBtn.disabled = true;
            trailerBtn.classList.remove("active");
            trailerBtn.innerHTML = '<i class="fab fa-youtube"></i> No Trailer';
            console.log("❌ No trailer found for movie ID:", id);
        }
        
        // Fetch additional movie details
        const detailsRes = await fetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}`);
        const details = await detailsRes.json();
        
        // Update metadata
        updateMovieMetadata(details);
        
    } catch (err) {
        console.error("Error fetching additional data:", err);
        trailerBtn.disabled = true;
        trailerBtn.innerHTML = '<i class="fab fa-youtube"></i> Trailer Error';
    }
}


function updateMovieMetadata(details) {
    const ratingEl = document.getElementById("movieRating");
    const runtimeEl = document.getElementById("movieRuntime");
    const yearEl = document.getElementById("movieYear");
    const genreEl = document.getElementById("movieGenre");
    
    if (ratingEl) ratingEl.innerHTML = `<i class="fas fa-star"></i> ${details.vote_average?.toFixed(1) || 'N/A'}`;
    if (runtimeEl) runtimeEl.innerHTML = `<i class="fas fa-clock"></i> ${details.runtime || 'N/A'} min`;
    if (yearEl) yearEl.innerHTML = `<i class="fas fa-calendar"></i> ${details.release_date?.split('-')[0] || 'N/A'}`;
    if (genreEl) genreEl.innerHTML = `<i class="fas fa-tag"></i> ${details.genres?.map(g => g.name).join(', ') || 'N/A'}`;
}

// ================= PLAY MOVIE =================
playBtn.addEventListener("click", () => {
    if (movieData.video_links) {
        const quality = qualitySelect ? qualitySelect.value : "720";
        videoPlayer.src = movieData.video_links[quality];
        videoPlayer.play();
        showToast(`Playing: ${videoTitle.innerText}`);
    } else {
        showToast("Video link not available");
    }
});

// ================= WATCHLIST =================
watchListBtn.addEventListener("click", () => {
    let list = JSON.parse(localStorage.getItem("watchList") || "[]");
    
    // Check if already in watchlist
    const existing = list.find(item => item.id === movieId || item.title === videoTitle.innerText);
    
    if (!existing) {
        const watchItem = {
            id: movieId || Date.now(),
            title: videoTitle.innerText,
            poster: watchPopupImage.src,
            date: new Date().toLocaleDateString()
        };
        
        list.push(watchItem);
        localStorage.setItem("watchList", JSON.stringify(list));
        
        watchListBtn.innerHTML = '<i class="fas fa-check"></i> Added to List';
        watchListBtn.classList.add("added");
        showToast(videoTitle.innerText + " added to Watchlist!");
        
        setTimeout(() => {
            watchListBtn.innerHTML = '<i class="fas fa-plus"></i> Watch List';
            watchListBtn.classList.remove("added");
        }, 2000);
    } else {
        showToast(videoTitle.innerText + " already in Watchlist");
    }
});

// ================= DOWNLOAD FUNCTION =================
function downloadMovie(quality) {
    if (!movieData.video_links || !movieData.video_links[quality]) {
        return showToast("Download link not available");
    }
    
    const url = movieData.video_links[quality];
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoTitle.innerText}_${quality}p.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Add to downloads list
    addToDownloads(movieData, quality);
}

// Download buttons
if (download480Btn) {
    download480Btn.addEventListener("click", () => downloadMovie("480"));
}
if (download720Btn) {
    download720Btn.addEventListener("click", () => downloadMovie("720"));
}
if (download1080Btn) {
    download1080Btn.addEventListener("click", () => downloadMovie("1080"));
}

// ================= PLAY TRAILER =================
// ================= PLAY TRAILER (FIXED) =================
function playTrailer(trailerUrl) {
    // Create modal container
    const trailerModal = document.createElement("div");
    trailerModal.classList.add("trailer-modal");
    
    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.classList.add("trailer-modal-content");
    
    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("trailer-close");
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = trailerUrl;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.frameBorder = "0";
    
    // Assemble modal
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(iframe);
    trailerModal.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(trailerModal);
    document.body.style.overflow = "hidden";
    
    // Close functions
    function closeTrailerModal() {
        if (document.body.contains(trailerModal)) {
            document.body.removeChild(trailerModal);
            document.body.style.overflow = "";
        }
    }
    
    // Close on close button click
    closeBtn.addEventListener("click", closeTrailerModal);
    
    // Close on backdrop click
    trailerModal.addEventListener("click", (e) => {
        if (e.target === trailerModal) {
            closeTrailerModal();
        }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === "Escape") {
            closeTrailerModal();
            document.removeEventListener("keydown", escapeHandler);
        }
    };
    document.addEventListener("keydown", escapeHandler);
}

// ================= QUALITY SELECTOR =================
if (qualitySelect) {
    qualitySelect.addEventListener("change", (e) => {
        const quality = e.target.value;
        if (movieData.video_links && movieData.video_links[quality]) {
            videoPlayer.src = movieData.video_links[quality];
            showToast(`Quality changed to ${quality}p`);
        }
    });
}

// ================= KEYBOARD SHORTCUTS =================
document.addEventListener("keydown", (e) => {
    // Spacebar to play/pause
    if (e.code === "Space" && document.activeElement !== videoPlayer) {
        e.preventDefault();
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    }
    
    // F for fullscreen
    if (e.key === "f" || e.key === "F") {
        if (videoPlayer.requestFullscreen) {
            videoPlayer.requestFullscreen();
        }
    }
    
    // Escape to close menus
    if (e.key === "Escape") {
        if (downloadsMenu.classList.contains("active")) {
            downloadsMenu.classList.remove("active");
        }
    }
});

// ================= VIDEO PLAYER CONTROLS =================
videoPlayer.addEventListener("play", () => {
    playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
});

videoPlayer.addEventListener("pause", () => {
    playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
});

videoPlayer.addEventListener("ended", () => {
    playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
    showToast("Video ended");
});

// ================= INITIAL LOAD =================
if (movieId) {
    fetchMovieData(movieId);
    updateDownloadsBadge();
    renderDownloadsList();
} else {
    videoTitle.innerText = "No movie selected";
    videoDesc.innerText = "Please select a movie from the movies page";
    watchPopupImage.src = "https://via.placeholder.com/300x450?text=🎬";
    trailerBtn.disabled = true;
}

// ================= SHARE FUNCTIONALITY =================
function shareMovie() {
    if (navigator.share) {
        navigator.share({
            title: videoTitle.innerText,
            text: videoDesc.innerText.substring(0, 100) + "...",
            url: window.location.href
        }).catch(() => {
            copyToClipboard();
        });
    } else {
        copyToClipboard();
    }
}

function copyToClipboard() {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard!");
}

// ================= RATING FUNCTIONALITY =================
function rateMovie(rating) {
    const ratings = JSON.parse(localStorage.getItem("movieRatings") || "{}");
    ratings[movieId] = rating;
    localStorage.setItem("movieRatings", JSON.stringify(ratings));
    showToast(`You rated this movie ${rating} stars`);
}

console.log("Video.js loaded with downloads menu");
// ================= FALLBACK TRAILER SEARCH =================
async function searchYouTubeTrailer(movieTitle) {
    try {
        // You can use a YouTube API key here if you have one
        // This is a fallback using a public API (for demo purposes)
        const searchQuery = encodeURIComponent(`${movieTitle} official trailer`);
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&key=YOUR_YOUTUBE_API_KEY&maxResults=1&type=video`);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].id.videoId;
        }
    } catch (err) {
        console.error("YouTube search error:", err);
    }
    return null;
}
// ================= CLOSE DOWNLOADS MENU (Add this near line 100) =================
function closeDownloadsMenu() {
    if (downloadsMenu) {
        downloadsMenu.classList.remove("active");
    }
}

// ================= PLAY TRAILER (FIXED) =================
function playTrailer(trailerUrl) {
    // Check if modal already exists
    if (document.querySelector('.trailer-modal')) {
        return;
    }
    
    // Create modal container
    const trailerModal = document.createElement("div");
    trailerModal.classList.add("trailer-modal");
    
    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.classList.add("trailer-modal-content");
    
    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("trailer-close");
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = trailerUrl;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.frameBorder = "0";
    
    // Assemble modal
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(iframe);
    trailerModal.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(trailerModal);
    document.body.style.overflow = "hidden";
    
    // Close functions
    function closeTrailerModal() {
        if (document.body.contains(trailerModal)) {
            document.body.removeChild(trailerModal);
            document.body.style.overflow = "";
            // Pause main video if it's playing
            if (videoPlayer && !videoPlayer.paused) {
                videoPlayer.pause();
            }
        }
    }
    
    // Close on close button click
    closeBtn.addEventListener("click", closeTrailerModal);
    
    // Close on backdrop click
    trailerModal.addEventListener("click", (e) => {
        if (e.target === trailerModal) {
            closeTrailerModal();
        }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === "Escape") {
            closeTrailerModal();
            document.removeEventListener("keydown", escapeHandler);
        }
    };
    document.addEventListener("keydown", escapeHandler);
}
