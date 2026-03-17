// ================= ELEMENTS =================
const trendingContainer = document.getElementById("trendingContainer");
const categoriesNav = document.getElementById("categoriesNav");
const categoryMovies = document.getElementById("categoryMovies");
const popup = document.getElementById("popup");
const popupImage = document.getElementById("popupImage");
const popupTitle = document.getElementById("popupTitle");
const popupDesc = document.getElementById("popupDesc");
const popupTrailerBtn = document.getElementById("popupTrailerBtn");
const popupDownloadBtn = document.getElementById("popupDownloadBtn");
const loading = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");

// ================= TMDB CONFIG =================
const TMDB_KEY = "YOUR_TMDB_API_KEY"; // replace with your TMDB API key
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// ================= CATEGORIES =================
const categories = [
  { id: 28, name: "Action" },
  { id: 27, name: "Horror" },
  { id: 12, name: "Adventure" },
  { id: 35, name: "Comedy" },
  { id: 10749, name: "Romance" },
  { id: 16, name: "Animation" }
];

// ================= HELPER FUNCTIONS =================
function showLoading(){ loading.style.display="flex"; }
function hideLoading(){ loading.style.display="none"; }

function createMovieCard(movie){
  const div = document.createElement("div");
  div.classList.add("movie-card");
  div.innerHTML = `
      <img src="${movie.poster_path ? IMG_BASE + movie.poster_path : 'https://via.placeholder.com/300x450'}" alt="${movie.title}">
      <h3>${movie.title}</h3>
      <p>Release: ${movie.release_date || "N/A"}</p>
      <p>Rating: ${movie.vote_average || "N/A"}/10</p>
      <a class="watch-btn">▶ Trailer</a>
      <a class="download-btn">⬇ Download</a>
  `;
  div.querySelector(".watch-btn").addEventListener("click", e=>{
    e.stopPropagation();
    watchTrailer(movie.id, movie.title);
  });
  div.querySelector(".download-btn").addEventListener("click", e=>{
    e.stopPropagation();
    downloadMovie(movie.id, movie.title);
  });
  div.addEventListener("click", ()=> openPopup(movie));
  return div;
}

function displayMovies(movies, container){
  container.innerHTML="";
  if(!movies || movies.length===0){
    container.innerHTML="<p>No movies found.</p>";
    return;
  }
  movies.forEach(movie=>{
    container.appendChild(createMovieCard(movie));
  });
}

// ================= TRENDING =================
async function fetchTrending(){
  showLoading();
  try{
    const res = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`);
    const data = await res.json();
    displayMovies(data.results, trendingContainer);
  }catch(err){
    console.error(err);
    trendingContainer.innerHTML="<p>Error fetching trending movies.</p>";
  }
  hideLoading();
}

// ================= CATEGORIES NAV =================
categories.forEach(cat=>{
  const btn = document.createElement("div");
  btn.classList.add("category-btn");
  btn.innerText = cat.name;
  btn.onclick = ()=> fetchCategory(cat.id, btn);
  categoriesNav.appendChild(btn);
});

// ================= FETCH CATEGORY =================
async function fetchCategory(catId, btn){
  // highlight active
  document.querySelectorAll(".category-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");

  showLoading();
  try{
    const res = await fetch(`${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${catId}`);
    const data = await res.json();
    displayMovies(data.results, categoryMovies);
  }catch(err){
    console.error(err);
    categoryMovies.innerHTML="<p>Error fetching category movies.</p>";
  }
  hideLoading();
}

// ================= POPUP =================
function openPopup(movie){
  popup.classList.add("active");
  popupImage.src = movie.poster_path ? IMG_BASE + movie.poster_path : 'https://via.placeholder.com/300x450';
  popupTitle.innerText = movie.title;
  popupDesc.innerText = `Release: ${movie.release_date || "N/A"} | Rating: ${movie.vote_average || "N/A"}`;
  popupTrailerBtn.onclick = ()=> watchTrailer(movie.id, movie.title);
  popupDownloadBtn.onclick = ()=> downloadMovie(movie.id, movie.title);
}
function closePopup(){ popup.classList.remove("active"); }

// ================= WATCH TRAILER =================
async function watchTrailer(movieId, title){
  try{
    const res = await fetch(`${TMDB_BASE}/movie/${movieId}/videos?api_key=${TMDB_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(v=>v.type==="Trailer" && v.site==="YouTube");
    if(trailer){
      window.open(`https://www.youtube.com/watch?v=${trailer.key}`, "_blank");
    }else{
      alert(`No trailer found for ${title}`);
    }
  }catch(err){
    console.error(err);
    alert(`Error fetching trailer for ${title}`);
  }
}

// ================= DOWNLOAD MOVIE =================
function downloadMovie(movieId, title){
  alert(`Download function for ${title} (Movie ID: ${movieId})`);
}

// ================= SEARCH =================
searchInput.addEventListener("input", e=>{
  const query = e.target.value.toLowerCase();
  let allMovies = [];
  const trendingMovies = trendingContainer.querySelectorAll(".movie-card");
  const categoryMoviesCards = categoryMovies.querySelectorAll(".movie-card");
  [...trendingMovies, ...categoryMoviesCards].forEach(card=>{
    const title = card.querySelector("h3").innerText.toLowerCase();
    if(title.includes(query)) card.style.display = "block";
    else card.style.display = "none";
  });
});

// ================= INITIAL LOAD =================
fetchTrending();
fetchCategory(categories[0].id, document.querySelectorAll(".category-btn")[0]);
function showLoading(){ document.getElementById("loading").classList.add("active"); }
function hideLoading(){ document.getElementById("loading").classList.remove("active"); }
