// nav.js - Enhanced with chat app integration and session management
document.addEventListener("DOMContentLoaded", () => {
    initializeNav();
});

function initializeNav() {
    const placeholder = document.getElementById("nav-placeholder");
    if (!placeholder) return;

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem("crunkUser"));
    
    fetch("nav.html")
        .then(res => {
            if (!res.ok) throw new Error('Failed to load navigation');
            return res.text();
        })
        .then(data => {
            placeholder.innerHTML = data;

            // Highlight active tab
            highlightActiveTab();
            
            // Setup chat link with session persistence
            setupChatLink(user);
            
            // Setup other navigation items
            setupNavItems();
            
            // Initialize any additional features
            initializeNavFeatures();
        })
        .catch(err => {
            console.error("Nav load error:", err);
            // Fallback navigation if nav.html fails to load
            createFallbackNav(placeholder);
        });
}

function highlightActiveTab() {
    const currentPage = window.location.pathname.split("/").pop().replace(".html", "") || "home";
    const navItems = document.querySelectorAll(".nav-item");
    
    navItems.forEach(item => {
        const tab = item.dataset.tab;
        if (tab === currentPage || (currentPage === "" && tab === "home")) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

function setupChatLink(user) {
    const chatLink = document.querySelector('[data-tab="chat"]');
    if (!chatLink) return;

    if (user) {
        // User is logged in - pass user data to chat app
        const chatUrl = `https://qonvo-chat.netlify.app/?user=${encodeURIComponent(JSON.stringify({
            username: user.username || user.name || 'User',
            email: user.email || '',
            picture: user.picture || user.photoURL || '',
            userId: user.userId || user.uid || Date.now().toString(),
            loggedIn: true,
            timestamp: Date.now()
        }))}`;
        
        chatLink.href = chatUrl;
        chatLink.target = "_blank"; // Open in new tab
        chatLink.classList.add("chat-active");
        
        // Add tooltip
        chatLink.setAttribute("title", "Open Chat (Auto-login)");
        
        // Add click tracking
        chatLink.addEventListener("click", (e) => {
            console.log("Opening chat app for user:", user.username);
            trackUserActivity('chat_click');
        });
    } else {
        // No user logged in - redirect to login first
        chatLink.href = "#";
        chatLink.classList.add("chat-required");
        chatLink.setAttribute("title", "Please login first");
        
        chatLink.addEventListener("click", (e) => {
            e.preventDefault();
            showLoginPrompt();
        });
    }
}

function setupNavItems() {
    // Home navigation
    const homeLink = document.querySelector('[data-tab="home"]');
    if (homeLink) {
        homeLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "home.html";
        });
    }

    // Games navigation
    const gamesLink = document.querySelector('[data-tab="games"]');
    if (gamesLink) {
        gamesLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "games.html";
        });
    }

    // Profile navigation
    const profileLink = document.querySelector('[data-tab="profile"]');
    if (profileLink) {
        profileLink.addEventListener("click", (e) => {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem("crunkUser"));
            if (user) {
                window.location.href = "profile.html";
            } else {
                window.location.href = "index.html";
            }
        });
    }

    // Settings navigation
    const settingsLink = document.querySelector('[data-tab="settings"]');
    if (settingsLink) {
        settingsLink.addEventListener("click", (e) => {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem("crunkUser"));
            if (user) {
                window.location.href = "settings.html";
            } else {
                showLoginPrompt();
            }
        });
    }
}

function showLoginPrompt() {
    // Create toast notification
    const toast = document.createElement("div");
    toast.className = "nav-toast";
    toast.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Please login first to access this feature</span>
        <button onclick="redirectToLogin()">Login</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("show");
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function redirectToLogin() {
    window.location.href = "index.html";
}

function trackUserActivity(action) {
    // Track user activity for analytics
    const user = JSON.parse(localStorage.getItem("crunkUser"));
    if (user && user.email) {
        console.log(`User ${user.email} performed: ${action}`);
        // You can send this to your analytics service
    }
}

function initializeNavFeatures() {
    // Add active class on scroll
    window.addEventListener("scroll", () => {
        const nav = document.querySelector(".bottom-nav");
        if (nav) {
            if (window.scrollY > 50) {
                nav.classList.add("nav-scrolled");
            } else {
                nav.classList.remove("nav-scrolled");
            }
        }
    });

    // Handle back/forward navigation
    window.addEventListener("popstate", () => {
        highlightActiveTab();
    });
}

function createFallbackNav(placeholder) {
    // Fallback navigation if nav.html fails to load
    const user = JSON.parse(localStorage.getItem("crunkUser"));
    const chatUrl = user ? 
        `https://qonvo-chat.netlify.app/?user=${encodeURIComponent(JSON.stringify({
            username: user.username || 'User',
            email: user.email || '',
            picture: user.picture || ''
        }))}` : 
        '#';
    
    placeholder.innerHTML = `
        <nav class="bottom-nav">
            <a href="home.html" class="nav-item" data-tab="home">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </a>
            <a href="games.html" class="nav-item" data-tab="games">
                <i class="fas fa-gamepad"></i>
                <span>Games</span>
            </a>
            <a href="${chatUrl}" class="nav-item ${!user ? 'chat-required' : ''}" data-tab="chat" ${user ? 'target="_blank"' : ''}>
                <i class="fas fa-comment"></i>
                <span>Chat</span>
            </a>
            <a href="profile.html" class="nav-item" data-tab="profile">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </a>
        </nav>
    `;
    
    if (!user) {
        const chatLink = placeholder.querySelector('[data-tab="chat"]');
        chatLink.addEventListener("click", (e) => {
            e.preventDefault();
            showLoginPrompt();
        });
    }
    
    highlightActiveTab();
}

// Expose functions globally for onclick handlers
window.redirectToLogin = redirectToLogin;
window.showLoginPrompt = showLoginPrompt;

// Handle incoming user data from chat app
window.addEventListener("message", (event) => {
    // Verify origin for security
    if (event.origin === "https://qonvo-chat.netlify.app") {
        if (event.data.type === 'USER_LOGGED_OUT') {
            // User logged out from chat, update local session
            localStorage.removeItem("crunkUser");
            window.location.href = "index.html";
        }
    }
});

// Auto-refresh session if user is logged in
function refreshSession() {
    const user = JSON.parse(localStorage.getItem("crunkUser"));
    if (user) {
        // Update last active timestamp
        user.lastActive = Date.now();
        localStorage.setItem("crunkUser", JSON.stringify(user));
    }
}

// Refresh session every 5 minutes
setInterval(refreshSession, 300000);

console.log("Nav.js loaded - Chat app integration ready");
