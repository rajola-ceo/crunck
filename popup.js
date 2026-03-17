// Elements
const watchPopup = document.getElementById("watchPopup");
const watchPopupImage = document.getElementById("watchPopupImage");
const watchPopupVideo = document.getElementById("watchPopupVideo");
const watchPopupTitle = document.getElementById("watchPopupTitle");
const watchPopupDesc = document.getElementById("watchPopupDesc");

// Open popup function
function openWatchPopup(movie){
    watchPopup.classList.add("active");
    watchPopupImage.style.display = "block";
    watchPopupVideo.style.display = "none";
    watchPopupImage.src = movie.poster_path ? IMG_BASE+movie.poster_path : '';
    watchPopupTitle.innerText = movie.title;
    watchPopupDesc.innerText = `Release: ${movie.release_date || "N/A"} | Rating: ${movie.vote_average || "N/A"}`;
    watchPopupVideo.src = movie.video || ""; // API video link
}

// Click image to play movie
watchPopupImage.addEventListener("click", ()=>{
    watchPopupImage.style.display = "none";
    watchPopupVideo.style.display = "block";
    watchPopupVideo.play();
});

// Close popup
function closeWatchPopup(){
    watchPopup.classList.remove("active");
    watchPopupVideo.pause();
    watchPopupVideo.currentTime = 0;
    watchPopupVideo.style.display = "none";
    watchPopupImage.style.display = "block";
}

// Download
function downloadMovie(){
    const link = watchPopupVideo.src;
    if(!link) return alert("Movie link not available");
    const a = document.createElement("a");
    a.href = link;
    a.download = watchPopupTitle.innerText + ".mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Watch List
function addToWatchListPopup(){
    const title = watchPopupTitle.innerText;
    let list = JSON.parse(localStorage.getItem("watchList") || "[]");
    if(!list.includes(title)){
        list.push(title);
        localStorage.setItem("watchList", JSON.stringify(list));
        alert(`${title} added to Watch List`);
        updateWatchListMenu();
    } else alert(`${title} is already in Watch List`);
}

// Update hamburger menu
function updateWatchListMenu(){
    const menu = document.getElementById("watchListMenu");
    const list = JSON.parse(localStorage.getItem("watchList") || "[]");
    menu.innerHTML = list.map(t=>`<div>${t}</div>`).join("");
}
