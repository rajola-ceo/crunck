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

            // Highlight active tab based on current page
            highlightActiveTab();
            
            // Setup chat link with session persistence - NOW DIRECT TO QONVO
            setupChatLink(user);
            
            // Setup navigation click handlers
            setupNavClickHandlers();
            
            // Initialize any additional features
            initializeNavFeatures();
            
            // Make nav always visible at bottom
            ensureNavAtBottom();
        })
        .catch(err => {
            console.error("Nav load error:", err);
            // Fallback navigation if nav.html fails to load
            createFallbackNav(placeholder, user);
        });
}

function ensureNavAtBottom() {
    const nav = document.querySelector('.bottom-nav');
    if (nav) {
        nav.style.position = 'fixed';
        nav.style.bottom = '0';
        nav.style.left = '0';
        nav.style.width = '100%';
        nav.style.zIndex = '1000';
        
        // Add padding to body to prevent content from being hidden behind nav
        const body = document.body;
        if (body) {
            body.style.paddingBottom = '80px';
        }
    }
}

function highlightActiveTab() {
    const currentPage = window.location.pathname.split("/").pop().replace(".html", "") || "home";
    const navItems = document.querySelectorAll(".nav-item");
    
    navItems.forEach(item => {
        const tab = item.dataset.tab;
        // Remove active class from all
        item.classList.remove("active");
        
        // Add active class to matching tab
        if (tab === currentPage || (currentPage === "" && tab === "home")) {
            item.classList.add("active");
        }
    });
}

function setupChatLink(user) {
    const chatLink = document.querySelector('[data-tab="chats"]');
    if (!chatLink) return;

    if (user) {
        // User is logged in - pass user data to Qonvo chat app DIRECTLY
        const userData = {
            username: user.username || user.name || user.displayName || 'User',
            email: user.email || '',
            picture: user.picture || user.photoURL || '',
            userId: user.userId || user.uid || Date.now().toString(),
            loggedIn: true,
            timestamp: Date.now()
        };
        
        // Store user data in sessionStorage for backup
        sessionStorage.setItem("chatUser", JSON.stringify(userData));
        
        // DIRECT LINK to Qonvo chat with user data encoded in URL
        const encodedData = encodeURIComponent(JSON.stringify(userData));
        chatLink.href = `https://qonvo-chat.netlify.app/?user=${encodedData}`;
        
        // Add special class and tooltip
        chatLink.classList.add("chat-active");
        chatLink.setAttribute("title", "Open Qonvo Chat");
        
        // Add click handler to track and ensure data is passed
        chatLink.addEventListener("click", (e) => {
            // Update session data on each click with fresh timestamp
            const freshUserData = {
                ...userData,
                timestamp: Date.now()
            };
            sessionStorage.setItem("chatUser", JSON.stringify(freshUserData));
            
            // Update href with fresh data
            const freshEncoded = encodeURIComponent(JSON.stringify(freshUserData));
            chatLink.href = `https://qonvo-chat.netlify.app/?user=${freshEncoded}`;
            
            trackUserActivity('chat_click');
        });
    } else {
        // No user logged in - redirect to login page
        chatLink.href = "index.html";
        chatLink.classList.add("chat-required");
        chatLink.setAttribute("title", "Please login first");
        
        chatLink.addEventListener("click", (e) => {
            e.preventDefault();
            showLoginPrompt();
        });
    }
}

function setupNavClickHandlers() {
    // Add click handlers for all nav items
    const navItems = document.querySelectorAll(".nav-item");
    
    navItems.forEach(item => {
        item.addEventListener("click", function(e) {
            const href = this.getAttribute("href");
            
            // Don't prevent default if it's a valid link
            if (href && href !== "#" && href !== "index.html") {
                // Add loading state
                this.classList.add("loading");
                
                // Remove loading state after navigation (will be cleared on new page)
                setTimeout(() => {
                    this.classList.remove("loading");
                }, 500);
            }
        });
    });
}

function showLoginPrompt() {
    // Create toast notification
    const toast = document.createElement("div");
    toast.className = "nav-toast";
    toast.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Please login first to access chats</span>
        <button onclick="redirectToLogin()">Login</button>
    `;
    
    // Style the toast
    toast.style.position = 'fixed';
    toast.style.bottom = '100px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#333';
    toast.style.color = 'white';
    toast.style.padding = '15px 25px';
    toast.style.borderRadius = '50px';
    toast.style.boxShadow = '0 5px 20px rgba(0,0,0,0.3)';
    toast.style.zIndex = '2000';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '15px';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    
    const button = toast.querySelector('button');
    if (button) {
        button.style.backgroundColor = '#34d399';
        button.style.border = 'none';
        button.style.color = '#333';
        button.style.padding = '8px 20px';
        button.style.borderRadius = '25px';
        button.style.fontWeight = 'bold';
        button.style.cursor = 'pointer';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 100);
    
    setTimeout(() => {
        toast.style.opacity = '0';
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
    // Add scroll effect
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
    
    // Check for active chat session
    checkChatSession();
    
    // Ensure nav stays at bottom on resize
    window.addEventListener('resize', ensureNavAtBottom);
}

function checkChatSession() {
    const user = JSON.parse(localStorage.getItem("crunkUser"));
    
    // If we're on the current page and have user data, check for return from Qonvo
    const urlParams = new URLSearchParams(window.location.search);
    const fromChat = urlParams.get('from_chat');
    
    if (fromChat === 'true' && user) {
        // Came back from chat, show welcome back message
        showWelcomeBackMessage(user);
    }
}

function showWelcomeBackMessage(user) {
    const toast = document.createElement("div");
    toast.className = "welcome-back-toast";
    toast.innerHTML = `
        <i class="fas fa-smile"></i>
        <span>Welcome back, ${user.username || 'User'}!</span>
    `;
    
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#34d399';
    toast.style.color = '#333';
    toast.style.padding = '12px 25px';
    toast.style.borderRadius = '10px';
    toast.style.boxShadow = '0 5px 20px rgba(52, 211, 153, 0.4)';
    toast.style.zIndex = '2000';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.animation = 'slideIn 0.5s ease';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function createFallbackNav(placeholder, user) {
    // Fallback navigation if nav.html fails to load - with Font Awesome icons
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
        <nav class="bottom-nav" style="position:fixed; bottom:0; left:0; width:100%; z-index:1000; background: linear-gradient(135deg, #1B2A49, #224566); padding: 12px 0; display: flex; justify-content: space-around; align-items: center; box-shadow: 0 -2px 10px rgba(0,0,0,0.2);">
            <a href="home.html" class="nav-item" data-tab="home" style="color: #9ca3af; text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: color 0.3s;">
                <i class="fas fa-home" style="font-size: 24px;"></i>
                <span class="label" style="font-size: 12px;">Home</span>
            </a>
            <a href="tournaments.html" class="nav-item" data-tab="tournaments" style="color: #9ca3af; text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <i class="fas fa-trophy" style="font-size: 24px;"></i>
                <span class="label" style="font-size: 12px;">Tournaments</span>
            </a>
            <a href="${chatLink}" class="nav-item ${!user ? 'chat-required' : ''}" data-tab="chats" style="color: #9ca3af; text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <i class="fas fa-comment-dots" style="font-size: 24px;"></i>
                <span class="label" style="font-size: 12px;">Chats ${!user ? '<i class="fas fa-lock" style="font-size:10px; margin-left:2px;"></i>' : ''}</span>
            </a>
            <a href="movies.html" class="nav-item" data-tab="movies" style="color: #9ca3af; text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <i class="fas fa-film" style="font-size: 24px;"></i>
                <span class="label" style="font-size: 12px;">Movies</span>
            </a>
            <a href="lovecode.html" class="nav-item" data-tab="lovecode" style="color: #9ca3af; text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <i class="fas fa-heart" style="font-size: 24px;"></i>
                <span class="label" style="font-size: 12px;">Love Code</span>
            </a>
        </nav>
    `;
    
    // Add hover effect styles
    const style = document.createElement('style');
    style.textContent = `
        .nav-item:hover {
            color: #34d399 !important;
        }
        .nav-item.active {
            color: #34d399 !important;
        }
        .nav-item.active i {
            color: #34d399;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Setup chat link for fallback nav
    if (!user) {
        const chatLink = placeholder.querySelector('[data-tab="chats"]');
        if (chatLink) {
            chatLink.addEventListener("click", (e) => {
                e.preventDefault();
                showLoginPrompt();
            });
        }
    }
    
    highlightActiveTab();
    ensureNavAtBottom();
}

// Handle messages from Qonvo chat
window.addEventListener("message", (event) => {
    // Verify origin for security
    if (event.origin === "https://qonvo-chat.netlify.app") {
        if (event.data.type === 'USER_LOGGED_OUT') {
            // User logged out from chat, update local session
            localStorage.removeItem("crunkUser");
            sessionStorage.removeItem("chatUser");
            window.location.href = "index.html";
        } else if (event.data.type === 'USER_ACTIVITY') {
            // Update user activity
            const user = JSON.parse(localStorage.getItem("crunkUser"));
            if (user) {
                user.lastActive = Date.now();
                localStorage.setItem("crunkUser", JSON.stringify(user));
            }
        }
    }
});

// Auto-refresh session
function refreshSession() {
    const user = JSON.parse(localStorage.getItem("crunkUser"));
    if (user) {
        user.lastActive = Date.now();
        localStorage.setItem("crunkUser", JSON.stringify(user));
    }
}

// Refresh session every 5 minutes
setInterval(refreshSession, 300000);

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Page became visible again, refresh session
        refreshSession();
        highlightActiveTab();
    }
});

// Ensure nav is at bottom on page load
document.addEventListener('DOMContentLoaded', ensureNavAtBottom);

// Expose functions globally
window.redirectToLogin = redirectToLogin;

console.log("✅ Nav.js loaded - Direct Qonvo chat integration ready with fixed bottom nav");
