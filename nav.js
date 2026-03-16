// nav.js
document.addEventListener("DOMContentLoaded", () => {
  // inject nav into all pages
  fetch("nav.html")
    .then(res => res.text())
    .then(data => {
      const navContainer = document.createElement("div");
      navContainer.innerHTML = data;
      document.body.appendChild(navContainer);

      // highlight active tab
      const currentPage = window.location.pathname.split("/").pop().replace(".html","");
      const navItems = document.querySelectorAll(".bottom-nav .nav-item");
      navItems.forEach(item => {
        if(item.dataset.tab === currentPage){
          item.classList.add("active");
        }
      });
    })
    .catch(err => console.error("Nav load error:", err));
});
