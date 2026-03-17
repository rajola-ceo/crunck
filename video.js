// ================= BACK BUTTON =================
function goBack(){
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
const downloadToggle = document.getElementById("downloadToggle");
const downloadOptions = document.getElementById("downloadOptions");
const qualitySelect = document.getElementById("qualitySelect");
const download480Btn = document.getElementById("download480");
const download720Btn = document.getElementById("download720");
const download1080Btn = document.getElementById("download1080");
const watchPopupImage = document.getElementById("watchPopupImage");

// ================= TMDB CONFIG =================
const TMDB_KEY = "2a48fa3779af50f428b6d5f73d4d8ba7";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// ================= FETCH MOVIE DATA =================
let movieData = {};
async function fetchMovieData(id){
    try{
        const res = await fetch(`http://localhost:3000/movies/${id}`);
        if(!res.ok) throw new Error("Movie not found");
        const movie = await res.json();
        movieData = movie;

        // Update title, description, poster
        videoTitle.innerText = movie.title || "No title available";
        videoDesc.innerText = movie.overview || "No description available";
        watchPopupImage.src = movie.poster_path ? IMG_BASE + movie.poster_path : "https://via.placeholder.com/300x450";

        // Trailer button
        const trailer = movie.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
        if(trailer){
            trailerBtn.onclick = () => playTrailer(`https://www.youtube.com/embed/${trailer.key}`);
            trailerBtn.disabled = false;
        } else {
            trailerBtn.disabled = true;
        }

        // Setup dummy video links for play & download (replace with real if you have server links)
        movieData.video_links = {
            "480": `https://sample-videos.com/video123/mp4/480/big_buck_bunny_480p_5mb.mp4`,
            "720": `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`,
            "1080": `https://sample-videos.com/video123/mp4/1080/big_buck_bunny_1080p_1mb.mp4`
        }

    } catch(err){
        console.error(err);
        videoTitle.innerText = "Movie data not fully available";
        videoDesc.innerText = "Could not load all movie info. Try refreshing.";
        watchPopupImage.src = "https://via.placeholder.com/300x450";
        trailerBtn.disabled = true;
    }
}

// ================= PLAY MOVIE =================
playBtn.addEventListener("click", ()=>{
    if(movieData.video_links){
        videoPlayer.src = movieData.video_links[qualitySelect.value];
        videoPlayer.play();
    } else alert("Video link not available");
});

// ================= WATCHLIST =================
watchListBtn.addEventListener("click", ()=>{
    let list = JSON.parse(localStorage.getItem("watchList")||"[]");
    if(!list.includes(videoTitle.innerText)){
        list.push(videoTitle.innerText);
        localStorage.setItem("watchList", JSON.stringify(list));
        alert(videoTitle.innerText + " added to Watchlist!");
    } else alert(videoTitle.innerText + " already in Watchlist");
});

// ================= DOWNLOAD TOGGLE =================
downloadToggle.addEventListener("click", ()=>{
    downloadOptions.style.display = downloadOptions.style.display==="none"?"flex":"none";
});

// ================= DOWNLOAD FUNCTION =================
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

// ================= PLAY TRAILER =================
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
            <iframe src="${trailerUrl}" frameborder="0" allowfullscreen style="width:100%; height:315px; border-radius:12px;"></iframe>
        </div>
    `;

    trailerModal.querySelector("span").onclick = ()=>document.body.removeChild(trailerModal);
    document.body.appendChild(trailerModal);
}

// ================= INITIAL LOAD =================
if(movieId) fetchMovieData(movieId);
