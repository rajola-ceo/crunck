// BACK BUTTON
function goBack(){ window.location.href="movies.html"; }

// Get movie ID from URL
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

// DOM Elements
const videoPlayer = document.getElementById("videoPlayer");
const videoTitle = document.getElementById("videoTitle");
const videoDesc = document.getElementById("videoDesc");
const playBtn = document.getElementById("playBtn");
const trailerBtn = document.getElementById("trailerBtn");
const watchListBtn = document.getElementById("watchListBtn");
const downloadToggle = document.getElementById("downloadToggle");
const downloadOptions = document.getElementById("downloadOptions");
const qualitySelect = document.getElementById("qualitySelect");
const download480Btn = document.getElementById("download480");
const download720Btn = document.getElementById("download720");
const download1080Btn = document.getElementById("download1080");

// Example API Base URL (replace with your API)
const API_BASE = "https://api.example.com/movies";

// FETCH MOVIE DATA
let movieData = {};
async function fetchMovieData(id){
    try{
        const res = await fetch(`${API_BASE}/${id}`);
        movieData = await res.json();

        videoTitle.innerText = movieData.title;
        videoDesc.innerText = movieData.description;
        videoPlayer.poster = movieData.poster;

        // Trailer Button
        if(movieData.trailer){
            trailerBtn.onclick = ()=>playTrailer(movieData.trailer);
        } else { trailerBtn.disabled = true; }

    } catch(err){
        console.error(err);
        videoTitle.innerText = "Movie not found";
        videoDesc.innerText = "";
    }
}

// PLAY MOVIE
playBtn.addEventListener("click", ()=>{
    if(movieData.video_links){
        videoPlayer.src = movieData.video_links[qualitySelect.value];
        videoPlayer.play();
    } else alert("Video link not available");
});

// WATCHLIST
watchListBtn.addEventListener("click", ()=>{
    let list = JSON.parse(localStorage.getItem("watchList")||"[]");
    if(!list.includes(videoTitle.innerText)){
        list.push(videoTitle.innerText);
        localStorage.setItem("watchList", JSON.stringify(list));
        alert(videoTitle.innerText+" added to Watchlist!");
    } else alert(videoTitle.innerText+" already in Watchlist");
});

// DOWNLOAD TOGGLE
downloadToggle.addEventListener("click", ()=>{
    downloadOptions.style.display = downloadOptions.style.display==="none"?"flex":"none";
});

// DOWNLOAD BUTTONS
function downloadMovie(url){
    if(!url) return alert("Download link not available");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoTitle.innerText}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

download480Btn.addEventListener("click", ()=>downloadMovie(movieData.video_links["480"]));
download720Btn.addEventListener("click", ()=>downloadMovie(movieData.video_links["720"]));
download1080Btn.addEventListener("click", ()=>downloadMovie(movieData.video_links["1080"]));

// PLAY TRAILER
function playTrailer(trailerUrl){
    const trailerModal = document.createElement("div");
    trailerModal.classList.add("trailer-modal");
    trailerModal.style.position="fixed";
    trailerModal.style.top=0;
    trailerModal.style.left=0;
    trailerModal.style.width="100%";
    trailerModal.style.height="100%";
    trailerModal.style.background="rgba(0,0,0,0.9)";
    trailerModal.style.display="flex";
    trailerModal.style.alignItems="center";
    trailerModal.style.justifyContent="center";
    trailerModal.style.zIndex=30000;

    trailerModal.innerHTML = `
        <div style="position:relative; width:90%; max-width:600px;">
            <span style="position:absolute; top:10px; right:15px; font-size:28px; cursor:pointer; color:#34d399;">&times;</span>
            <video src="${trailerUrl}" controls autoplay style="width:100%; border-radius:12px;"></video>
        </div>
    `;

    trailerModal.querySelector("span").onclick = ()=>document.body.removeChild(trailerModal);
    document.body.appendChild(trailerModal);
}

// INITIAL LOAD
if(movieId) fetchMovieData(movieId);
