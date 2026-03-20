// tournaments.js - Main Tournaments Page Logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBW0Sz7TODfa8tQJTfNUaLhfK9qJhdA1yE",
    authDomain: "crunck-app.firebaseapp.com",
    projectId: "crunck-app",
    storageBucket: "crunck-app.firebasestorage.app",
    messagingSenderId: "475953302982",
    appId: "1:475953302982:web:607e08379adb12f985f6c7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const createLeagueBtn = document.getElementById('createLeagueBtn');
const joinLeagueBtn = document.getElementById('joinLeagueBtn');
const createTeamCard = document.getElementById('createTeamCard');
const joinLeagueCard = document.getElementById('joinLeagueCard');
const myLeaguesCard = document.getElementById('myLeaguesCard');
const leaderboardCard = document.getElementById('leaderboardCard');
const featuredLeaguesContainer = document.getElementById('featuredLeagues');
const activeLeaguesContainer = document.getElementById('activeLeagues');
const myTeamsContainer = document.getElementById('myTeams');

// User Data
let currentUser = null;

// Veno Coins System
function getVenoCoins() {
    return parseInt(localStorage.getItem('venoCoins') || '0');
}

function updateVenoCoinsDisplay() {
    const coinsSpan = document.getElementById('venoCoinsAmount');
    if (coinsSpan) {
        coinsSpan.textContent = getVenoCoins();
    }
}

// Load Featured Leagues from localStorage
function loadFeaturedLeagues() {
    const leagues = JSON.parse(localStorage.getItem('leagues') || '[]');
    
    if (featuredLeaguesContainer) {
        featuredLeaguesContainer.innerHTML = '';
        
        if (leagues.length === 0) {
            featuredLeaguesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No leagues yet. Be the first to create one!</p>
                    <button class="btn-primary" onclick="window.location.href='league-create.html'">
                        <i class="fas fa-plus"></i> Create League
                    </button>
                </div>
            `;
            return;
        }
        
        // Show latest 6 leagues
        const latestLeagues = leagues.slice(0, 6);
        latestLeagues.forEach(league => {
            featuredLeaguesContainer.appendChild(createLeagueCard(league));
        });
    }
}

// Create League Card
function createLeagueCard(league) {
    const card = document.createElement('div');
    card.className = 'league-card';
    card.onclick = () => window.location.href = `league-view.html?id=${league.id}`;
    
    const statusClass = league.status === 'live' ? 'status-live' : 
                        league.status === 'registration' ? 'status-registration' : 
                        league.status === 'upcoming' ? 'status-upcoming' : 'status-completed';
    const statusText = league.status === 'live' ? 'LIVE' : 
                       league.status === 'registration' ? 'REGISTRATION OPEN' : 
                       league.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED';
    
    card.innerHTML = `
        <div class="league-header">
            <span class="league-type ${statusClass}">${statusText}</span>
            <div class="league-icon">
                <i class="fas fa-futbol"></i>
            </div>
            <h3>${league.name || 'Unnamed League'}</h3>
            <div class="league-game">${league.gameType || 'eFootball'}</div>
        </div>
        <div class="league-body">
            <div class="league-stats">
                <div class="stat">
                    <div class="stat-value">${league.teams?.length || 0}/${league.maxTeams || 16}</div>
                    <div class="stat-label">Teams</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${league.matches?.filter(m => m.result).length || 0}/${league.matches?.length || 0}</div>
                    <div class="stat-label">Matches</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${league.weeks || 0}</div>
                    <div class="stat-label">Weeks</div>
                </div>
            </div>
            <div class="league-prize">
                <span><i class="fas fa-trophy"></i> Prize Pool</span>
                <span class="prize"><i class="fas fa-coins"></i> ${league.prizePool || 0} VC</span>
            </div>
            <div class="league-prize">
                <span><i class="fas fa-door-open"></i> Entry Fee</span>
                <span><i class="fas fa-coins"></i> ${league.entryFee || 0} VC</span>
            </div>
        </div>
        <div class="league-footer">
            <button class="join-btn" onclick="event.stopPropagation(); joinLeague('${league.id}')">
                <i class="fas fa-sign-in-alt"></i> Join League
            </button>
            <button class="details-btn" onclick="event.stopPropagation(); viewLeague('${league.id}')">
                <i class="fas fa-info-circle"></i> Details
            </button>
        </div>
    `;
    
    return card;
}

// Load Active Leagues from localStorage
function loadActiveLeagues() {
    if (!activeLeaguesContainer) return;
    
    const leagues = JSON.parse(localStorage.getItem('leagues') || '[]');
    const activeLeagues = leagues.filter(l => l.status === 'live' || l.status === 'registration');
    
    activeLeaguesContainer.innerHTML = '';
    
    if (activeLeagues.length === 0) {
        activeLeaguesContainer.innerHTML = '<div class="empty-state">No active leagues at the moment</div>';
        return;
    }
    
    activeLeagues.slice(0, 3).forEach(league => {
        activeLeaguesContainer.appendChild(createLeagueCard(league));
    });
}

// Load My Teams from localStorage
function loadMyTeams() {
    if (!myTeamsContainer) return;
    
    const teams = JSON.parse(localStorage.getItem('userTeams') || '[]');
    
    myTeamsContainer.innerHTML = '';
    
    if (teams.length === 0) {
        myTeamsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>You haven't created any teams yet</p>
                <button class="btn-primary" onclick="window.location.href='team-create.html'">
                    <i class="fas fa-plus"></i> Create Your First Team
                </button>
            </div>
        `;
        return;
    }
    
    teams.forEach(team => {
        myTeamsContainer.appendChild(createTeamCard(team));
    });
}

// Create Team Card
function createTeamCard(team) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.onclick = () => window.location.href = `team-view.html?id=${team.id}`;
    
    card.innerHTML = `
        <div class="team-logo">
            ${team.logo ? `<img src="${team.logo}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">` : '<i class="fas fa-shield-alt"></i>'}
        </div>
        <div class="team-info">
            <div class="team-name">${team.name}</div>
            <div class="team-stats">
                <span><i class="fas fa-trophy"></i> ${team.wins || 0} Wins</span>
                <span><i class="fas fa-futbol"></i> ${team.matches || 0} Matches</span>
            </div>
        </div>
        <i class="fas fa-chevron-right" style="color: #10b981;"></i>
    `;
    
    return card;
}

// Join League Function
window.joinLeague = function(leagueId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    const userCoins = getVenoCoins();
    const leagues = JSON.parse(localStorage.getItem('leagues') || '[]');
    const leagueIndex = leagues.findIndex(l => l.id === leagueId);
    
    if (leagueIndex === -1) {
        showToast('League not found', 'error');
        return;
    }
    
    const league = leagues[leagueIndex];
    
    // Check if user already requested or joined
    const alreadyRequested = league.pendingRequests?.some(r => r.ownerId === currentUser.uid);
    const alreadyJoined = league.teams?.some(t => t.ownerId === currentUser.uid);
    
    if (alreadyJoined) {
        showToast('You already joined this league!', 'info');
        return;
    }
    
    if (alreadyRequested) {
        showToast('You already sent a join request!', 'info');
        return;
    }
    
    if (league.entryFee > userCoins) {
        showToast(`Need ${league.entryFee} Veno Coins to join!`, 'error');
        return;
    }
    
    // Show confirmation dialog
    if (confirm(`Join ${league.name}?\n\nEntry Fee: ${league.entryFee} Veno Coins\nPrize Pool: ${league.prizePool} Veno Coins`)) {
        // Deduct coins
        localStorage.setItem('venoCoins', userCoins - league.entryFee);
        updateVenoCoinsDisplay();
        
        // Add to pending requests
        if (!league.pendingRequests) league.pendingRequests = [];
        league.pendingRequests.push({
            id: 'req_' + Date.now(),
            teamName: `${currentUser.displayName}'s Team`,
            ownerId: currentUser.uid,
            ownerName: currentUser.displayName,
            logo: currentUser.photoURL,
            requestedAt: new Date().toISOString()
        });
        
        // Save back to localStorage
        leagues[leagueIndex] = league;
        localStorage.setItem('leagues', JSON.stringify(leagues));
        
        showToast(`Join request sent to ${league.ownerName}!`, 'success');
        
        // Update button
        const joinBtn = document.querySelector(`.join-btn[onclick*="${leagueId}"]`);
        if (joinBtn) {
            joinBtn.disabled = true;
            joinBtn.textContent = 'Request Sent';
        }
    }
};

window.viewLeague = function(leagueId) {
    window.location.href = `league-view.html?id=${leagueId}`;
};

// Navigation
if (createLeagueBtn) {
    createLeagueBtn.addEventListener('click', () => {
        window.location.href = 'league-create.html';
    });
}

if (joinLeagueBtn) {
    joinLeagueBtn.addEventListener('click', () => {
        document.querySelector('.featured-section').scrollIntoView({ behavior: 'smooth' });
    });
}

if (createTeamCard) {
    createTeamCard.addEventListener('click', () => {
        window.location.href = 'team-create.html';
    });
}

if (joinLeagueCard) {
    joinLeagueCard.addEventListener('click', () => {
        document.querySelector('.featured-section').scrollIntoView({ behavior: 'smooth' });
    });
}

if (myLeaguesCard) {
    myLeaguesCard.addEventListener('click', () => {
        window.location.href = 'my-leagues.html';
    });
}

if (leaderboardCard) {
    leaderboardCard.addEventListener('click', () => {
        window.location.href = 'leaderboard.html';
    });
}

// Sidebar navigation
const menuHome = document.getElementById('menuHome');
const menuTournaments = document.getElementById('menuTournaments');
const menuLeagues = document.getElementById('menuLeagues');
const menuTeams = document.getElementById('menuTeams');
const menuCreateLeague = document.getElementById('menuCreateLeague');
const menuCreateTeam = document.getElementById('menuCreateTeam');
const menuLeaderboard = document.getElementById('menuLeaderboard');
const menuSettings = document.getElementById('menuSettings');

if (menuHome) menuHome.addEventListener('click', () => window.location.href = 'home.html');
if (menuTournaments) menuTournaments.addEventListener('click', () => window.location.href = 'tournaments.html');
if (menuLeagues) menuLeagues.addEventListener('click', () => window.location.href = 'my-leagues.html');
if (menuTeams) menuTeams.addEventListener('click', () => window.location.href = 'my-teams.html');
if (menuCreateLeague) menuCreateLeague.addEventListener('click', () => window.location.href = 'league-create.html');
if (menuCreateTeam) menuCreateTeam.addEventListener('click', () => window.location.href = 'team-create.html');
if (menuLeaderboard) menuLeaderboard.addEventListener('click', () => window.location.href = 'leaderboard.html');
if (menuSettings) menuSettings.addEventListener('click', () => window.location.href = 'settings.html');

// Venaura Icon
const venauraIcon = document.getElementById('venauraIcon');
if (venauraIcon) {
    venauraIcon.addEventListener('click', () => {
        window.open('https://your-venaura-app-url.com', '_blank');
    });
}

// Profile Dropdown
const profileDropdown = document.getElementById('profileDropdown');
const profilePopup = document.getElementById('profilePopup');
if (profileDropdown) {
    profileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        profilePopup.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target) && !profilePopup.contains(e.target)) {
            profilePopup.classList.remove('active');
        }
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('crunkUser');
        window.location.href = 'index.html';
    });
}

// Theme Toggle
const menuTheme = document.getElementById('menuTheme');
const themeLabel = document.getElementById('themeLabel');
if (menuTheme) {
    menuTheme.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeLabel.innerText = isLight ? 'Light' : 'Dark';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        const sunIcon = menuTheme.querySelector('.bx-sun');
        const moonIcon = menuTheme.querySelector('.bx-moon');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isLight ? 'inline-block' : 'none';
            moonIcon.style.display = isLight ? 'none' : 'inline-block';
        }
    });
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeLabel) themeLabel.innerText = 'Light';
}

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        
        // Update profile images
        const googleProfilePic = document.getElementById('googleProfilePic');
        const popupProfilePic = document.getElementById('popupProfilePic');
        const accountName = document.getElementById('accountName');
        const accountEmail = document.getElementById('accountEmail');
        
        if (googleProfilePic) {
            googleProfilePic.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=10b981&color=fff&size=128`;
        }
        if (popupProfilePic) {
            popupProfilePic.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=10b981&color=fff&size=128`;
        }
        if (accountName) accountName.innerText = user.displayName;
        if (accountEmail) accountEmail.innerText = user.email;
        
        updateVenoCoinsDisplay();
        loadMyTeams();
    }
});

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedLeagues();
    loadActiveLeagues();
    updateVenoCoinsDisplay();
});

// Veno Coins Claim
const claimBtn = document.getElementById('claimVenoCoinsBtn');
if (claimBtn) {
    const LAST_CLAIM_KEY = 'lastVenoClaim';
    
    function canClaim() {
        const lastClaim = localStorage.getItem(LAST_CLAIM_KEY);
        if (!lastClaim) return true;
        return (Date.now() - parseInt(lastClaim)) >= 24 * 60 * 60 * 1000;
    }
    
    function updateClaimButton() {
        if (canClaim()) {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim 10';
            claimBtn.style.opacity = '1';
        } else {
            claimBtn.disabled = true;
            const timeLeft = 24 * 60 * 60 * 1000 - (Date.now() - parseInt(localStorage.getItem(LAST_CLAIM_KEY)));
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            claimBtn.innerHTML = `<i class="fas fa-clock"></i> ${hoursLeft}h ${minutesLeft}m left`;
            claimBtn.style.opacity = '0.6';
        }
    }
    
    claimBtn.addEventListener('click', () => {
        if (canClaim()) {
            const currentCoins = getVenoCoins();
            const newCoins = currentCoins + 10;
            localStorage.setItem('venoCoins', newCoins);
            localStorage.setItem(LAST_CLAIM_KEY, Date.now().toString());
            updateVenoCoinsDisplay();
            updateClaimButton();
            showToast('🎉 You claimed 10 Veno Coins!', 'success');
        } else {
            showToast('Already claimed! Come back tomorrow', 'error');
        }
    });
    
    updateClaimButton();
    setInterval(updateClaimButton, 60000);
}

// Notification System (Sample)
const notificationList = document.getElementById('notificationList');
const notificationCount = document.getElementById('notificationCount');
const markAllRead = document.getElementById('markAllRead');

function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    if (notificationList) {
        notificationList.innerHTML = '';
        if (notifications.length === 0) {
            notificationList.innerHTML = '<div class="empty-state">No notifications</div>';
        } else {
            notifications.slice(0, 5).forEach(notif => {
                const item = document.createElement('div');
                item.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
                item.innerHTML = `
                    <div class="notification-icon">${notif.icon || '🔔'}</div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.title}</div>
                        <div class="notification-message">${notif.message}</div>
                        <div class="notification-time">${notif.time}</div>
                    </div>
                `;
                notificationList.appendChild(item);
            });
        }
    }
    
    const unreadCount = notifications.filter(n => !n.read).length;
    if (notificationCount) {
        notificationCount.textContent = unreadCount;
        notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

if (markAllRead) {
    markAllRead.addEventListener('click', () => {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifications.forEach(n => n.read = true);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        loadNotifications();
        if (notificationCount) notificationCount.style.display = 'none';
    });
}

// Sample welcome notification
setTimeout(() => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const welcomeExists = notifications.some(n => n.title === 'Welcome to Tournaments');
    if (!welcomeExists) {
        notifications.unshift({
            id: Date.now(),
            title: 'Welcome to Tournaments!',
            message: 'Create your own league or join existing ones to win Veno Coins!',
            time: 'Just now',
            read: false,
            icon: '🏆'
        });
        localStorage.setItem('notifications', JSON.stringify(notifications));
        loadNotifications();
    }
}, 2000);

loadNotifications();

// Notification bell toggle
const notificationBtn = document.getElementById('notificationBtn');
const notificationPopup = document.getElementById('notificationPopup');
if (notificationBtn && notificationPopup) {
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationPopup.classList.toggle('active');
        loadNotifications();
    });
    
    document.addEventListener('click', (e) => {
        if (!notificationBtn.contains(e.target) && !notificationPopup.contains(e.target)) {
            notificationPopup.classList.remove('active');
        }
    });
}

console.log('✅ Tournaments page loaded with localStorage support');
