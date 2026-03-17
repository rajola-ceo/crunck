let currentMovie = null;
// popup.js
const watchPopup = document.getElementById("watchPopup");
const watchPopupImage = document.getElementById("watchPopupImage");
const watchPopupVideo = document.getElementById("watchPopupVideo");
const watchPopupTitle = document.getElementById("watchPopupTitle");
const watchPopupDesc = document.getElementById("watchPopupDesc");

// open popup with movie data
function openWatchPopup(movie){
    currentMovie = movie;
    watchPopup.classList.add("active");
    watchPopupImage.style.display = "block";
    watchPopupVideo.style.display = "none";
    watchPopupImage.src = movie.poster_path ? IMG_BASE+movie.poster_path : '';
    watchPopupTitle.innerText = movie.title;
    watchPopupDesc.innerText = `Release: ${movie.release_date || "N/A"} | Rating: ${movie.vote_average || "N/A"}`;
    
}
function closeWatchPopup(){
    watchPopupVideo.src = ""; // muhimu sana
    watchPopup.classList.remove("active");
}
watchPopupImage.addEventListener("click", ()=>{
    const url = `https://vidsrc.to/embed/movie/${currentMovie.id}`;

    watchPopupVideo.src = url;

    watchPopupImage.style.display = "none";
    watchPopupVideo.style.display = "block";
});

// add to watch list
function addToWatchListPopup(){
    const title = watchPopupTitle.innerText;
    let list = JSON.parse(localStorage.getItem("watchList") || "[]");
    if(!list.includes(title)){
        list.push(title);
        localStorage.setItem("watchList", JSON.stringify(list));
        alert(`${title} added to Watch List`);
    } else {
        alert(`${title} is already in Watch List`);
    }
}

// dummy download
function downloadMovie(quality){
    window.open(`https://vidsrc.to/embed/movie/${currentMovie.id}`);
}
document.getElementById("playBtn").addEventListener("click", ()=>{
    const url = `https://vidsrc.to/embed/movie/${currentMovie.id}`;

    watchPopupVideo.src = url;

    watchPopupImage.style.display = "none";
    watchPopupVideo.style.display = "block";
});
document.getElementById("trailerBtn").addEventListener("click", async ()=>{
    if(!currentMovie) return;

    try{
        const res = await fetch(`${TMDB_BASE}/movie/${currentMovie.id}/videos?api_key=${TMDB_KEY}`);
        const data = await res.json();

        // tafuta trailer
        const trailer = data.results.find(v => v.type === "Trailer");

        if(trailer){
            const url = `https://www.youtube.com/embed/${trailer.key}`;

            watchPopupVideo.src = url;

            watchPopupImage.style.display = "none";
            watchPopupVideo.style.display = "block";
        }else{
            alert("Trailer haipatikani");
        }

    }catch(err){
        console.error(err);
        alert("Error loading trailer");
    }
});
