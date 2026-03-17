// popup.js
const watchPopup = document.getElementById("watchPopup");
const watchPopupImage = document.getElementById("watchPopupImage");
const watchPopupVideo = document.getElementById("watchPopupVideo");
const watchPopupTitle = document.getElementById("watchPopupTitle");
const watchPopupDesc = document.getElementById("watchPopupDesc");

// open popup with movie data
function openWatchPopup(movie){
    watchPopup.classList.add("active");
    watchPopupImage.style.display = "block";
    watchPopupVideo.style.display = "none";
    watchPopupImage.src = movie.poster_path ? IMG_BASE+movie.poster_path : '';
    watchPopupTitle.innerText = movie.title;
    watchPopupDesc.innerText = `Release: ${movie.release_date || "N/A"} | Rating: ${movie.vote_average || "N/A"}`;
    watchPopupVideo.src = movie.video || "";
}

// close popup
function closeWatchPopup(){
    watchPopupVideo.pause();
    watchPopupVideo.currentTime = 0;
    watchPopup.classList.remove("active");
}

// click image to play video
watchPopupImage.addEventListener("click", ()=>{
    watchPopupImage.style.display = "none";
    watchPopupVideo.style.display = "block";
    watchPopupVideo.play();
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
function downloadMovie(){
    alert("Downloading movie...");
}
