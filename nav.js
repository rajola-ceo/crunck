// nav.js
document.addEventListener("DOMContentLoaded", () => {
  // inject nav into #nav-placeholder
  const placeholder = document.getElementById("nav-placeholder");
  if(!placeholder) return;

  fetch("nav.html")
    .then(res => res.text())
    .then(data => {
      placeholder.innerHTML = data;

      // highlight active tab
      const currentPage = window.location.pathname.split("/").pop().replace(".html","");
      const navItems = placeholder.querySelectorAll(".nav-item");
      navItems.forEach(item => {
        if(item.dataset.tab === currentPage){
          item.classList.add("active");
        }
      });
    })
    .catch(err => console.error("Nav load error:", err));
});
