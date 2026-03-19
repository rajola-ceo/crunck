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
            
            // Setup chat link with session persistence
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
        // User is logged in - pass user data to chat app
        const userData = {
            username: user.username || user.name || user.displayName || 'User',
            email: user.email || '',
            picture: user.picture || user.photoURL || '',
            userId: user.userId || user.uid || Date.now().toString(),
            loggedIn: true,
            timestamp: Date.now()
        };
        
        // Store user data in sessionStorage for the chat page
        sessionStorage.setItem("chatUser", JSON.stringify(userData));
        
        // Update the href to go to our local chats page first
        chatLink.href = "chats.html";
        
        // Add special class and tooltip
        chatLink.classList.add("chat-active");
        chatLink.setAttribute("title", "Open Chats (Auto-login)");
        
        // Add click handler to ensure user data is passed
        chatLink.addEventListener("click", (e) => {
            // Update session data on each click
            sessionStorage.setItem("chatUser", JSON.stringify(userData));
            trackUserActivity('chat_click');
        });
    } else {
        // No user logged in - redirect to login
        chatLink.href = "#";
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
            if (href && href !== "#") {
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
    const chatUser = sessionStorage.getItem("chatUser");
    
    // If we're on chats.html and have user data, redirect to Qonvo
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "chats.html" && user) {
        redirectToQonvoChat(user);
    }
}

function redirectToQonvoChat(user) {
    // Prepare user data for Qonvo
    const userData = {
        username: user.username || user.name || user.displayName || 'User',
        email: user.email || '',
        picture: user.picture || user.photoURL || '',
        userId: user.userId || user.uid || Date.now().toString(),
        loggedIn: true,
        timestamp: Date.now()
    };
    
    // Encode and redirect to Qonvo
    const encodedData = encodeURIComponent(JSON.stringify(userData));
    window.location.href = `https://qonvo-chat.netlify.app/?user=${encodedData}`;
}

function createFallbackNav(placeholder, user) {
    // Fallback navigation if nav.html fails to load - with Font Awesome icons
    placeholder.innerHTML = `
        <nav class="bottom-nav" style="position:fixed; bottom:0; left:0; width:100%; z-index:1000;">
            <a href="home.html" class="nav-item" data-tab="home">
                <i class="fas fa-home"></i>
                <span class="label">Home</span>
            </a>
            <a href="tournaments.html" class="nav-item" data-tab="tournaments">
                <i class="fas fa-trophy"></i>
                <span class="label">Tournaments</span>
            </a>
            <a href="${user ? 'chats.html' : '#'}" class="nav-item ${!user ? 'chat-required' : ''}" data-tab="chats">
                <i class="fas fa-comment-dots"></i>
                <span class="label">Chats ${!user ? '<i class="fas fa-lock" style="font-size:10px; margin-left:2px;"></i>' : ''}</span>
            </a>
            <a href="movies.html" class="nav-item" data-tab="movies">
                <i class="fas fa-film"></i>
                <span class="label">Movies</span>
            </a>
            <a href="lovecode.html" class="nav-item" data-tab="lovecode">
                <i class="fas fa-heart"></i>
                <span class="label">Love Code</span>
            </a>
        </nav>
    `;
    
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

// Create chats.html page that handles the redirect
function createChatsPage() {
    // This function creates the content for chats.html
    const chatPageContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirecting to Chat...</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1B2A49, #224566);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
        }
        .loader {
            border: 4px solid rgba(255,255,255,0.1);
            border-left-color: #34d399;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .container {
            max-width: 400px;
            padding: 30px;
            background: rgba(0,0,0,0.3);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h2 {
            color: #34d399;
            margin-bottom: 10px;
        }
        .redirect-btn {
            background: #34d399;
            color: #1B2A49;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        .redirect-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(52, 211, 153, 0.4);
        }
        .user-info {
            margin: 20px 0;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="container">
        <i class="fas fa-comment-dots" style="font-size: 60px; color: #34d399; margin-bottom: 20px;"></i>
        <h2>Redirecting to Chat</h2>
        <p>Please wait while we redirect you to the chat application...</p>
        <div class="loader"></div>
        <div id="userInfo" class="user-info">
            <p><i class="fas fa-user"></i> <span id="username">Loading...</span></p>
        </div>
        <button class="redirect-btn" onclick="redirectNow()">
            <i class="fas fa-external-link-alt"></i> Click here if not redirected
        </button>
    </div>

    <script>
        function redirectNow() {
            const userData = sessionStorage.getItem('chatUser');
            if (userData) {
                const encodedData = encodeURIComponent(userData);
                window.location.href = 'https://qonvo-chat.netlify.app/?user=' + encodedData;
            } else {
                window.location.href = 'index.html';
            }
        }

        // Display user info
        const userData = sessionStorage.getItem('chatUser');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                document.getElementById('username').textContent = user.username || 'User';
            } catch (e) {}
        }

        // Auto redirect after 2 seconds
        setTimeout(redirectNow, 2000);
    </script>
</body>
</html>
    `;
    
    console.log("✅ Create chats.html with this content");
    return chatPageContent;
}

// Expose functions globally
window.redirectToLogin = redirectToLogin;
window.redirectToQonvoChat = redirectToQonvoChat;

// Handle messages from Qonvo
window.addEventListener("message", (event) => {
    // Verify origin for security
    if (event.origin === "https://qonvo-chat.netlify.app") {
        if (event.data.type === 'USER_LOGGED_OUT') {
            // User logged out from chat, update local session
            localStorage.removeItem("crunkUser");
            sessionStorage.removeItem("chatUser");
            window.location.href = "index.html";
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

// Ensure nav is at bottom on page load
document.addEventListener('DOMContentLoaded', ensureNavAtBottom);

console.log("✅ Nav.js loaded - Chat integration ready with fixed bottom nav");
