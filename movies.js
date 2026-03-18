let page = 1;
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
function goToVideo(id){
    window.location.href = `video.html?id=${id}`;
}
// ================= LOADING =================
function showLoading(){ loading.classList.add("active"); }
function hideLoading(){ loading.classList.remove("active"); }

// ================= FETCH TRENDING =================
async function fetchTrending(){
  try{
    showLoading();
    const res = await fetch('http://localhost:3000/movies/trending');
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

// ================= CREATE CARD WITH BADGES =================
// ================= CREATE CARD WITH BADGES =================
function createMovieCard(movie){
  const card = document.createElement("div");
  card.classList.add("movie-card");

  let badge = "HD";
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

  card.addEventListener("click", ()=>goToVideo(movie.id));

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

    // Use setTimeout to simulate loading (optional)
    setTimeout(() => {
        // clear previous movies
        moviesSections.innerHTML = "";

        // create carousel section
        const section = document.createElement("div");
        section.classList.add("carousel");

        const container = document.createElement("div");
        container.classList.add("carousel-container");

        // append each movie card
movies.forEach(movie => {
    const card = createMovieCard(movie);
    container.appendChild(card);
});
        section.appendChild(container);
        moviesSections.appendChild(section);

        hideLoading();
    }, 300);
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
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();

  if(query.length < 2){
    searchResults.style.display = "none";
    return;
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=YOUR_TMDB_KEY&query=${query}`);
    const data = await res.json();

    searchResults.innerHTML = "";

    data.results.slice(0,6).forEach(movie => {
      const item = document.createElement("div");
      item.classList.add("search-item");
      item.innerText = movie.title;

      item.onclick = () => {
        window.location.href = `video.html?id=${movie.id}`;
      };

      searchResults.appendChild(item);
    });

    searchResults.style.display = "block";

  } catch(err){
    console.error(err);
  }
});
<div id="searchResults" class="search-results"></div>
