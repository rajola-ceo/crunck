// ELEMENTS
const moviesSections = document.getElementById("moviesSections");
const categoryBtns = document.querySelectorAll(".nav-item");
const searchInput = document.getElementById("searchInput");
const popup = document.getElementById("popup");
const popupImage = document.getElementById("popupImage");
const popupTitle = document.getElementById("popupTitle");
const popupDesc = document.getElementById("popupDesc");
const loading = document.getElementById("loading");
const hero = document.getElementById("heroSection");
const heroBadge = document.getElementById("heroBadge");
const heroTitle = document.getElementById("heroTitle");
const heroMeta = document.getElementById("heroMeta");

// DUMMY MOVIES DATA
const moviesData = {
  "for-you":[
    {title:"Running Man", sub:"03-15", img:"https://via.placeholder.com/140x200", overlay:"Top 10"},
    {title:"The Earth 4", sub:"8 Episodes", img:"https://via.placeholder.com/140x200", overlay:"Top 10"},
    {title:"How Dare You!?", sub:"32 Episodes", img:"https://via.placeholder.com/140x200", overlay:"Top 10"}
  ],
  "drama":[{title:"Cutie Pie", sub:"12 Episodes", img:"https://via.placeholder.com/140x200", overlay:"Free"},{title:"Love Story", sub:"8 Episodes", img:"https://via.placeholder.com/140x200", overlay:"Top 5"}],
  "movie":[{title:"Action Movie", sub:"2h", img:"https://via.placeholder.com/140x200", overlay:"HD"}],
  "comedy":[{title:"Funny Life", sub:"10 Episodes", img:"https://via.placeholder.com/140x200", overlay:"Top 10"}],
  "adventure":[{title:"Jungle Quest", sub:"5 Episodes", img:"https://via.placeholder.com/140x200", overlay:"New"}],
  "horror":[{title:"Haunted Night", sub:"6 Episodes", img:"https://via.placeholder.com/140x200", overlay:"Top 3"}],
  "series":[{title:"Series One", sub:"12 Episodes", img:"https://via.placeholder.com/140x200", overlay:"HD"}],
  "action":[{title:"Action Blast", sub:"2h", img:"https://via.placeholder.com/140x200", overlay:"HD"}],
  "top-rating":[{title:"Top Movie", sub:"2h", img:"https://via.placeholder.com/140x200", overlay:"Top"}]
};

// HERO CHANGING IMAGES + DATA
const heroData = [
  {img:"https://via.placeholder.com/500x200?text=Hero+1", badge:"Free", title:"THE LAST STAND", meta:"★ 9.8 | 2024 | 18+ | Action"},
  {img:"https://via.placeholder.com/500x200?text=Hero+2", badge:"HD", title:"BATTLEFIELD", meta:"★ 9.0 | 2023 | 16+ | Action"},
  {img:"https://via.placeholder.com/500x200?text=Hero+3", badge:"New", title:"ADVENTURE QUEST", meta:"★ 8.5 | 2024 | 12+ | Adventure"}
];
let heroIndex = 0;
setInterval(()=>{
  const h = heroData[heroIndex];
  hero.style.backgroundImage = `url(${h.img})`;
  heroBadge.innerText = h.badge;
  heroTitle.innerText = h.title;
  heroMeta.innerHTML = h.meta;
  heroIndex = (heroIndex+1)%heroData.length;
}, 3000);

// LOADING
function showLoading(){ loading.classList.add("active"); }
function hideLoading(){ loading.classList.remove("active"); }

// CREATE MOVIE CARD
function createMovieCard(movie){
  const card = document.createElement("div");
  card.classList.add("movie-card");
  card.innerHTML = `<img src="${movie.img}" alt="${movie.title}">
    <div class="overlay">${movie.overlay||""}</div>
    <div class="movie-info">
      <div class="movie-title">${movie.title}</div>
      <div class="movie-sub">${movie.sub||""}</div>
    </div>`;
  card.addEventListener("click",()=>openPopup(movie));
  return card;
}

// RENDER MOVIES
function renderMovies(category){
  showLoading();
  setTimeout(()=>{
    moviesSections.innerHTML="";
    const section = document.createElement("div");
    section.classList.add("carousel");
    const container = document.createElement("div");
    container.classList.add("carousel-container");
    (moviesData[category]||[]).forEach(m=>container.appendChild(createMovieCard(m)));
    section.appendChild(container);
    moviesSections.appendChild(section);
    hideLoading();
  },500);
}

// POPUP
function openPopup(movie){
  popup.classList.add("active");
  popupImage.src = movie.img;
  popupTitle.innerText = movie.title;
  popupDesc.innerText = `Episodes/info: ${movie.sub || "N/A"}`;
}
function closePopup(){ popup.classList.remove("active"); }

// CATEGORY BUTTONS
categoryBtns.forEach(btn=>{
  btn.addEventListener("click",()=>{
    categoryBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const cat = btn.dataset.category;
    renderMovies(cat);
  });
});

// INITIAL RENDER
renderMovies("for-you");

// SEARCH
searchInput.addEventListener("input", e=>{
  const query = e.target.value.toLowerCase();
  const currentCategory = document.querySelector(".nav-item.active").dataset.category;
  const filtered = (moviesData[currentCategory]||[]).filter(m=>m.title.toLowerCase().includes(query));
  moviesSections.innerHTML="";
  if(filtered.length>0){
    const section = document.createElement("div");
    section.classList.add("carousel");
    const container = document.createElement("div");
    container.classList.add("carousel-container");
    filtered.forEach(m=>container.appendChild(createMovieCard(m)));
    section.appendChild(container);
    moviesSections.appendChild(section);
  } else {
    moviesSections.innerHTML="<p style='margin:20px; color:#888;'>No movies found.</p>";
  }
});
