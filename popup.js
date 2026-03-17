// Go back to movies page
function goBack(){
    window.location.href = "movies.html";
}

// Get movie ID from URL
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

// Elements
const videoPlayer = document.getElementById("videoPlayer");
const videoTitle = document.getElementById("videoTitle");
const videoDesc = document.getElementById("videoDesc");
const playBtn = document.getElementById("playBtn");
const trailerBtn = document.getElementById("trailerBtn");
const watchListBtn = document.getElementById("watchListBtn");
const downloadToggle = document.getElementById("downloadToggle");
const downloadOptions = document.getElementById("downloadOptions");
const qualitySelect = document.getElementById("qualitySelect");

// ================= TMDB CONFIG =================
const TMDB_KEY = "2a48fa3779af50f428b6d5f73d4d8ba7";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// Fetch single movie details
async function fetchMovieDetails(id){
    try{
        const res = await fetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}`);
        const data = await res.json();

        videoTitle.innerText = data.title;
        videoDesc.innerText = `Release: ${data.release_date || "N/A"} | Rating: ${data.vote_average || "N/A"}`;
        videoPlayer.src = `https://www.example.com/movies/${id}.mp4`; // replace with actual video URL
        trailerBtn.onclick = ()=>window.open(`https://www.example.com/trailer/${id}.mp4`,"_blank");
    }catch(err){
        console.error(err);
        videoTitle.innerText = "Movie not found";
        videoDesc.innerText = "";
    }
}

// Buttons
playBtn.addEventListener("click",()=>{
    videoPlayer.src = `https://www.example.com/movies/${movieId}.mp4?quality=${qualitySelect.value}`;
});

downloadToggle.addEventListener("click",()=>{
    downloadOptions.style.display = downloadOptions.style.display==="none"?"block":"none";
});

function downloadMovie(quality){
    alert(`Downloading movie in ${quality}p...`);
}

watchListBtn.addEventListener("click",()=>{
    let list = JSON.parse(localStorage.getItem("watchList")||"[]");
    if(!list.includes(videoTitle.innerText)){
        list.push(videoTitle.innerText);
        localStorage.setItem("watchList", JSON.stringify(list));
        alert(videoTitle.innerText+" added to Watchlist!");
    }else alert(videoTitle.innerText+" is already in Watchlist!");
});

// Initial load
if(movieId) fetchMovieDetails(movieId);
