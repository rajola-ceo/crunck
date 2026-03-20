// nav.js - Enhanced navigation with better active tab detection
document.addEventListener("DOMContentLoaded", () => {
    initializeNav();
    fixActiveTabOnPageLoad();
});

function initializeNav() {
    const placeholder = document.getElementById("nav-placeholder");
    if (!placeholder) return;

    const user = JSON.parse(localStorage.getItem("crunkUser"));
    
    fetch("nav.html")
        .then(res => {
            if (!res.ok) throw new Error('Failed to load navigation');
            return res.text();
        })
        .then(data => {
            placeholder.innerHTML = data;
            highlightActiveTab();
            setupChatLink(user);
            setupNavClickHandlers();
            initializeNavFeatures();
            ensureNavAtBottom();
            addNavStyles();
        })
        .catch(err => {
            console.error("Nav load error:", err);
            createFallbackNav(placeholder, user);
        });
}

function fixActiveTabOnPageLoad() {
    // Ensure active tab is set after page fully loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            highlightActiveTab();
        }, 100);
    });
    
    // Handle back/forward buttons
    window.addEventListener('popstate', () => {
        setTimeout(() => {
            highlightActiveTab();
        }, 50);
    });
}

function highlightActiveTab() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split("/").pop().replace(".html", "") || "home";
    
    const navItems = document.querySelectorAll(".nav-item");
    let activeFound = false;
    
    navItems.forEach(item => {
        const tab = item.dataset.tab;
        item.classList.remove("active");
        
        // Match based on page name
        if (tab === currentPage || 
            (currentPage === "" && tab === "home") ||
            (currentPage === "index" && tab === "home") ||
            (currentPage === "tournaments" && tab === "tournaments")) {
            item.classList.add("active");
            activeFound = true;
        }
        
        // Special case for tournaments page
        if (currentPage === "tournaments" && tab === "tournaments") {
            item.classList.add("active");
            activeFound = true;
        }
        
        // Special case for chat page
        if (currentPage === "chats" && tab === "chats") {
            item.classList.add("active");
        }
    });
    
    // Fallback: if no active found, try to match by href
    if (!activeFound) {
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && currentPath.includes(href.replace('.html', ''))) {
                item.classList.add("active");
            }
        });
    }
}

function setupNavClickHandlers() {
    const navItems = document.querySelectorAll(".nav-item");
    
    navItems.forEach(item => {
        item.addEventListener("click", function(e) {
            const href = this.getAttribute("href");
            
            if (href && href !== "#" && href !== "javascript:void(0)") {
                // Add loading effect
                this.classList.add("loading");
                
                // Remove loading after navigation
                setTimeout(() => {
                    this.classList.remove("loading");
                }, 500);
                
                // Don't prevent default - let navigation happen
                console.log(`🔗 Navigating to: ${href}`);
            }
        });
    });
}

function setupChatLink(user) {
    const chatLink = document.querySelector('[data-tab="chats"]');
    if (!chatLink) return;

    if (user) {
        const userData = {
            username: user.username || user.name || user.displayName || 'User',
            email: user.email || '',
            picture: user.picture || user.photoURL || '',
            userId: user.userId || user.uid || Date.now().toString(),
            loggedIn: true,
            timestamp: Date.now()
        };
        
        sessionStorage.setItem("chatUser", JSON.stringify(userData));
        const encodedData = encodeURIComponent(JSON.stringify(userData));
        chatLink.href = `https://qonvo-chat.netlify.app/?user=${encodedData}`;
        chatLink.classList.add("chat-active");
        chatLink.setAttribute("title", "Open Qonvo Chat");
        
        chatLink.addEventListener("click", (e) => {
            const freshUserData = { ...userData, timestamp: Date.now() };
            sessionStorage.setItem("chatUser", JSON.stringify(freshUserData));
            const freshEncoded = encodeURIComponent(JSON.stringify(freshUserData));
            chatLink.href = `https://qonvo-chat.netlify.app/?user=${freshEncoded}`;
            trackUserActivity('chat_click');
        });
    } else {
        chatLink.href = "index.html";
        chatLink.classList.add("chat-required");
        chatLink.setAttribute("title", "Please login first");
        
        chatLink.addEventListener("click", (e) => {
            e.preventDefault();
            showLoginPrompt();
        });
    }
}

function ensureNavAtBottom() {
    const nav = document.querySelector('.bottom-nav');
    if (nav) {
        nav.style.position = 'fixed';
        nav.style.bottom = '0';
        nav.style.left = '0';
        nav.style.width = '100%';
        nav.style.zIndex = '1000';
        
        // Add padding to body
        const body = document.body;
        if (body && !body.style.paddingBottom) {
            body.style.paddingBottom = '80px';
        }
    }
}

function addNavStyles() {
    // Add loading animation if not present
    if (!document.querySelector('#nav-loading-styles')) {
        const style = document.createElement('style');
        style.id = 'nav-loading-styles';
        style.textContent = `
            .nav-item.loading {
                pointer-events: none;
                opacity: 0.7;
            }
            .nav-item.loading i {
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function showLoginPrompt() {
    const toast = document.createElement("div");
    toast.className = "nav-toast";
    toast.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Please login first to access chats</span>
        <button onclick="window.redirectToLogin()">Login</button>
    `;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 2000;
        animation: slideUp 0.3s ease;
    `;
    
    const button = toast.querySelector('button');
    if (button) {
        button.style.cssText = `
            background: #34d399;
            border: none;
            color: #333;
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
        `;
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.redirectToLogin = function() {
    window.location.href = "index.html";
};

function trackUserActivity(action) {
    const user = JSON.parse(localStorage.getItem("crunkUser"));
    if (user && user.email) {
        console.log(`📊 User ${user.email}: ${action}`);
    }
}

function initializeNavFeatures() {
    // Scroll effect
    window.addEventListener("scroll", () => {
        const nav = document.querySelector(".bottom-nav");
        if (nav) {
            nav.classList.toggle("nav-scrolled", window.scrollY > 50);
        }
    });
    
    // Resize handler
    window.addEventListener('resize', ensureNavAtBottom);
}

function createFallbackNav(placeholder, user) {
    const chatLink = user ? 
        `https://qonvo-chat.netlify.app/?user=${encodeURIComponent(JSON.stringify({
            username: user.username || user.name || user.displayName || 'User',
            email: user.email || '',
            picture: user.picture || user.photoURL || '',
            userId: user.userId || user.uid || Date.now().toString(),
            loggedIn: true
        }))}` : 
        "index.html";
    
    placeholder.innerHTML = `
        <nav class="bottom-nav" style="position:fixed; bottom:0; left:0; width:100%; z-index:1000; background: #0b1222; display:flex; justify-content:space-around; padding:12px 0; border-top:1px solid #1f2937;">
            <a href="home.html" class="nav-item" data-tab="home" style="color:#9ca3af; text-decoration:none; display:flex; flex-direction:column; align-items:center; gap:4px;">
                <i class="fas fa-home" style="font-size:22px;"></i>
                <span style="font-size:10px;">Home</span>
            </a>
            <a href="tournaments.html" class="nav-item" data-tab="tournaments" style="color:#9ca3af; text-decoration:none; display:flex; flex-direction:column; align-items:center; gap:4px;">
                <i class="fas fa-trophy" style="font-size:22px;"></i>
                <span style="font-size:10px;">Tournaments</span>
            </a>
            <a href="${chatLink}" class="nav-item" data-tab="chats" style="color:#9ca3af; text-decoration:none; display:flex; flex-direction:column; align-items:center; gap:4px;">
                <i class="fas fa-comment-dots" style="font-size:22px;"></i>
                <span style="font-size:10px;">Chats</span>
            </a>
            <a href="movies.html" class="nav-item" data-tab="movies" style="color:#9ca3af; text-decoration:none; display:flex; flex-direction:column; align-items:center; gap:4px;">
                <i class="fas fa-film" style="font-size:22px;"></i>
                <span style="font-size:10px;">Movies</span>
            </a>
            <a href="lovecode.html" class="nav-item" data-tab="lovecode" style="color:#9ca3af; text-decoration:none; display:flex; flex-direction:column; align-items:center; gap:4px;">
                <i class="fas fa-heart" style="font-size:22px;"></i>
                <span style="font-size:10px;">Other</span>
            </a>
        </nav>
    `;
    
    highlightActiveTab();
    ensureNavAtBottom();
}

// Handle messages from Qonvo
window.addEventListener("message", (event) => {
    if (event.origin === "https://qonvo-chat.netlify.app") {
        if (event.data.type === 'USER_LOGGED_OUT') {
            localStorage.removeItem("crunkUser");
            sessionStorage.removeItem("chatUser");
            window.location.href = "index.html";
        }
    }
});

// Auto-refresh session
setInterval(() => {
    const user = JSON.parse(localStorage.getItem("crunkUser"));
    if (user) {
        user.lastActive = Date.now();
        localStorage.setItem("crunkUser", JSON.stringify(user));
    }
}, 300000);

console.log("✅ Nav.js loaded");
