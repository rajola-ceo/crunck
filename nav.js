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
        })
        .catch(err => {
            console.error("Nav load error:", err);
            // Fallback navigation if nav.html fails to load
            createFallbackNav(placeholder, user);
        });
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
            username: user.username || user.name || 'User',
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
        username: user.username || user.name || 'User',
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
    // Fallback navigation if nav.html fails to load
    placeholder.innerHTML = `
        <nav class="bottom-nav">
            <a href="home.html" class="nav-item" data-tab="home">
                <span class="icon">🏠</span>
                <span class="label">Home</span>
            </a>
            <a href="tournaments.html" class="nav-item" data-tab="tournaments">
                <span class="icon">🏆</span>
                <span class="label">Tournaments</span>
            </a>
            <a href="${user ? 'chats.html' : '#'}" class="nav-item ${!user ? 'chat-required' : ''}" data-tab="chats">
                <span class="icon">💬</span>
                <span class="label">Chats ${!user ? '🔒' : ''}</span>
            </a>
            <a href="movies.html" class="nav-item" data-tab="movies">
                <span class="icon">🎬</span>
                <span class="label">Movies</span>
            </a>
            <a href="lovecode.html" class="nav-item" data-tab="lovecode">
                <span class="icon">❤️</span>
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
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
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
            border-left-color: #4FC3F7;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .container {
            max-width: 400px;
            padding: 20px;
        }
        h2 {
            color: #4FC3F7;
            margin-bottom: 10px;
        }
        .redirect-btn {
            background: #4FC3F7;
            color: #1B2A49;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        .redirect-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(79, 195, 247, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Redirecting to Qonvo Chat</h2>
        <p>Please wait while we redirect you to the chat application...</p>
        <div class="loader"></div>
        <button class="redirect-btn" onclick="redirectNow()">Click here if not redirected</button>
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

        // Auto redirect after 2 seconds
        setTimeout(redirectNow, 2000);
    </script>
</body>
</html>
    `;
    
    // You would save this as chats.html
    console.log("Create chats.html with this content");
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

console.log("Nav.js loaded - Chat integration ready");
