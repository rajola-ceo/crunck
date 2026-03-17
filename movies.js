
const moviesSections = document.getElementById("moviesSections");
const categoryBtns = document.querySelectorAll(".nav-item");
const loading = document.getElementById("loading");
const hero = document.getElementById("heroSection");
const heroBadge = document.getElementById("heroBadge");
const heroTitle = document.getElementById("heroTitle");
const heroMeta = document.getElementById("heroMeta");
const searchInput = document.getElementById("searchInput");

// ================= TMDB CONFIG =================
const TMDB_KEY = "2a48fa3779af50f428b6d5f73d4d8ba7"; // replace with your key
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// Hero trending movies
let heroData = [];
let heroIndex = 0;

// ================= LOADING =================
function showLoading(){ loading.classList.add("active"); }
function hideLoading(){ loading.classList.remove("active"); }

// ================= FETCH TRENDING =================
async function fetchTrending(){
  try{
    showLoading();
    const res = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`);
    const data = await res.json();
    hideLoading();
    heroData = data.results.slice(0,3); // first 3 for hero
    startHeroSlider();
    renderMovies("for-you", data.results); // initial carousel
  }catch(err){
    console.error(err);
    hideLoading();
    moviesSections.innerHTML="<p style='margin:20px;color:#888;'>Error fetching movies</p>";
  }
}

// ================= HERO SLIDER =================
function startHeroSlider(){
  if(heroData.length===0) return;
  updateHero(heroData[heroIndex]);
  setInterval(()=>{
    heroIndex = (heroIndex+1)%heroData.length;
    updateHero(heroData[heroIndex]);
  },3000);
}
function updateHero(movie){
  hero.style.backgroundImage = `url(${IMG_BASE+movie.poster_path})`;
  heroBadge.innerText = "Trending";
  heroTitle.innerText = movie.title;
  heroMeta.innerText = `★ ${movie.vote_average} | ${movie.release_date?.slice(0,4)||"N/A"} | ${movie.adult ? "18+" : "All"} | Movie`;
}

// ================= CREATE CARD WITH BADGES =================
function createMovieCard(movie){
  const card = document.createElement("div");
  card.classList.add("movie-card");

  // Determine badge
  let badge = "HD"; // default
  const year = movie.release_date ? parseInt(movie.release_date.slice(0,4)) : 0;
  const currentYear = new Date().getFullYear();
  if(movie.vote_average >= 8.5) badge = "Top";
  else if(year === currentYear) badge = "New";

  card.innerHTML = `
    <img src="${movie.poster_path ? IMG_BASE+movie.poster_path : 'https://via.placeholder.com/140x200'}" alt="${movie.title}">
    <div class="overlay">${badge}</div>
    <div class="movie-info">
      <div class="movie-title">${movie.title}</div>
      <div class="movie-sub">${movie.release_date || "N/A"}</div>
    </div>
  `;
  card.addEventListener("click",()=>openWatchPopup(movie));
  return card;
}

// ================= UPDATE HERO WITH BADGE =================
function updateHero(movie){
  hero.style.backgroundImage = `url(${IMG_BASE+movie.poster_path})`;

  // Hero badge logic
  let badge = "HD";
  const year = movie.release_date ? parseInt(movie.release_date.slice(0,4)) : 0;
  const currentYear = new Date().getFullYear();
  if(movie.vote_average >= 8.5) badge = "Top";
  else if(year === currentYear) badge = "New";

  heroBadge.innerText = badge;
  heroTitle.innerText = movie.title;
  heroMeta.innerText = `★ ${movie.vote_average} | ${movie.release_date?.slice(0,4)||"N/A"} | ${movie.adult ? "18+" : "All"} | Movie`;
}
// ================= RENDER MOVIES =================
function renderMovies(category, movies){
 showLoading();
  setTimeout(()=>{
    moviesSections.innerHTML="";
    const section = document.createElement("div");
    section.classList.add("carousel");
    const container = document.createElement("div");
    container.classList.add("carousel-container");
    movies.forEach(m=>container.appendChild(createMovieCard(m)));
    section.appendChild(container);
    moviesSections.appendChild(section);
   hideLoading();
  },300);
}
// ================= CATEGORY BUTTONS =================
categoryBtns.forEach(btn=>{
  btn.addEventListener("click", async ()=>{
    categoryBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    let genreMap = {
      "action":28,"horror":27,"adventure":12,"comedy":35,"drama":18,"top-rating":"" // example
    };
    const genreId = genreMap[btn.dataset.category]||"";
    //showLoading();//
    try{
      const url = genreId ? `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}` :
                            `${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      renderMovies(btn.dataset.category, data.results);
    }catch(err){
      console.error(err);
      moviesSections.innerHTML="<p style='margin:20px;color:#888;'>Error fetching movies</p>";
    }finally{
      //hideLoading();//
    }
  });
});

// ================= SEARCH =================
searchInput.addEventListener("input", async e=>{
  const query = e.target.value;
  if(query.length<1) return;
  //showLoading(); //
  try{
    const res = await fetch(`${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${query}`);
    const data = await res.json();
    renderMovies("search", data.results);
  }catch(err){
    console.error(err);
  }finally{
  //  hideLoading();  //
  }
});

// ================= INITIAL LOAD =================
fetchTrending();
window.addEventListener("scroll", async ()=>{
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 300){
    // fetch next page from TMDB
    page++;
    const res = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}&page=${page}`);
    const data = await res.json();
    renderMovies("for-you", data.results);
  }
});
