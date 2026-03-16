// movies.js
const trendingContainer = document.getElementById("trendingContainer");
const categoriesNav = document.getElementById("categoriesNav");
const categoryMovies = document.getElementById("categoryMovies");

// ================= TMDB CONFIG =================
const TMDB_KEY = "YOUR_TMDB_API_KEY"; // replace with your TMDB API key
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// Example categories
const categories = [
  { id: 28, name: "Action" },
  { id: 27, name: "Horror" },
  { id: 12, name: "Adventure" },
  { id: 35, name: "Comedy" },
  { id: 10749, name: "Romance" },
  { id: 16, name: "Animation" }
];

// ================= TRENDING =================
async function fetchTrending(){
  try {
    const res = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`);
    const data = await res.json();
    displayMovies(data.results, trendingContainer);
  } catch(err){
    console.error(err);
    trendingContainer.innerHTML = "<p>Error fetching trending movies.</p>";
  }
}

// ================= DISPLAY MOVIES =================
function displayMovies(movies, container){
  container.innerHTML = "";
  movies.forEach(movie => {
    const div = document.createElement("div");
    div.classList.add("movie-card");
    div.innerHTML = `
      <img src="${movie.poster_path ? IMG_BASE + movie.poster_path : 'https://via.placeholder.com/300x450'}" alt="${movie.title}">
      <h3>${movie.title}</h3>
      <p>Release: ${movie.release_date || "N/A"}</p>
      <p>Rating: ${movie.vote_average || "N/A"}/10</p>
      <a class="watch-btn" onclick="watchTrailer(${movie.id}, '${movie.title}')">▶ Trailer</a>
      <a class="download-btn" onclick="downloadMovie(${movie.id}, '${movie.title}')">⬇ Download</a>
    `;
    container.appendChild(div);
  });
}

// ================= CATEGORIES NAV =================
categories.forEach(cat => {
  const btn = document.createElement("div");
  btn.classList.add("category-btn");
  btn.innerText = cat.name;
  btn.onclick = () => fetchCategory(cat.id, btn);
  categoriesNav.appendChild(btn);
});

// ================= FETCH CATEGORY =================
async function fetchCategory(catId, btn){
  // highlight active
  document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  try {
    const res = await fetch(`${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${catId}`);
    const data = await res.json();
    displayMovies(data.results, categoryMovies);
  } catch(err){
    console.error(err);
    categoryMovies.innerHTML = "<p>Error fetching category movies.</p>";
  }
}

// ================= WATCH TRAILER =================
function watchTrailer(movieId, title){
  // TODO: integrate Vimeo/Dailymotion API for real trailers
  alert(`Watch trailer for ${title} (Movie ID: ${movieId})`);
}

// ================= DOWNLOAD MOVIE =================
function downloadMovie(movieId, title){
  // TODO: integrate your Mod APK / download API
  alert(`Download function for ${title} (Movie ID: ${movieId})`);
}

// ================= INITIAL LOAD =================
fetchTrending();
