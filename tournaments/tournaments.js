// tournaments.js - Main Tournaments Page Logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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
const db = getFirestore(app);

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
let venoCoins = 0;

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

// Load Featured Leagues
async function loadFeaturedLeagues() {
    try {
        const leaguesRef = collection(db, 'leagues');
        const q = query(leaguesRef, orderBy('createdAt', 'desc'), limit(6));
        const snapshot = await getDocs(q);
        
        if (featuredLeaguesContainer) {
            featuredLeaguesContainer.innerHTML = '';
            
            if (snapshot.empty) {
                featuredLeaguesContainer.innerHTML = '<div class="empty-state">No leagues yet. Be the first to create one!</div>';
                return;
            }
            
            snapshot.forEach(doc => {
                const league = { id: doc.id, ...doc.data() };
                featuredLeaguesContainer.appendChild(createLeagueCard(league));
            });
        }
    } catch (error) {
        console.error('Error loading featured leagues:', error);
        if (featuredLeaguesContainer) {
            featuredLeaguesContainer.innerHTML = '<div class="error-message">Failed to load leagues</div>';
        }
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
                    <div class="stat-value">${league.matchesPlayed || 0}/${league.totalMatches || 0}</div>
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

// Load Active Leagues
async function loadActiveLeagues() {
    if (!activeLeaguesContainer) return;
    
    try {
        const leaguesRef = collection(db, 'leagues');
        const q = query(leaguesRef, where('status', '==', 'live'), orderBy('createdAt', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        
        activeLeaguesContainer.innerHTML = '';
        
        if (snapshot.empty) {
            activeLeaguesContainer.innerHTML = '<div class="empty-state">No active leagues at the moment</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const league = { id: doc.id, ...doc.data() };
            activeLeaguesContainer.appendChild(createLeagueCard(league));
        });
    } catch (error) {
        console.error('Error loading active leagues:', error);
    }
}

// Load My Teams
async function loadMyTeams() {
    if (!myTeamsContainer || !currentUser) return;
    
    try {
        const teamsRef = collection(db, 'teams');
        const q = query(teamsRef, where('ownerId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        
        myTeamsContainer.innerHTML = '';
        
        if (snapshot.empty) {
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
        
        snapshot.forEach(doc => {
            const team = { id: doc.id, ...doc.data() };
            myTeamsContainer.appendChild(createTeamCard(team));
        });
    } catch (error) {
        console.error('Error loading my teams:', error);
    }
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
window.joinLeague = async function(leagueId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    const userCoins = getVenoCoins();
    
    try {
        const leagueRef = doc(db, 'leagues', leagueId);
        const leagueSnap = await getDoc(leagueRef);
        
        if (!leagueSnap.exists()) {
            showToast('League not found', 'error');
            return;
        }
        
        const league = leagueSnap.data();
        
        if (league.entryFee > userCoins) {
            showToast(`Need ${league.entryFee} Veno Coins to join!`, 'error');
            return;
        }
        
        if (league.teams?.includes(currentUser.uid)) {
            showToast('You already joined this league!', 'info');
            return;
        }
        
        // Show confirmation dialog
        if (confirm(`Join ${league.name}?\n\nEntry Fee: ${league.entryFee} Veno Coins\nPrize Pool: ${league.prizePool} Veno Coins`)) {
            // Here you would update Firestore and deduct coins
            showToast(`Successfully joined ${league.name}!`, 'success');
            
            // Update local coin display
            localStorage.setItem('venoCoins', userCoins - league.entryFee);
            updateVenoCoinsDisplay();
        }
        
    } catch (error) {
        console.error('Error joining league:', error);
        showToast('Failed to join league', 'error');
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

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateVenoCoinsDisplay();
    
    if (user) {
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
            const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - parseInt(localStorage.getItem(LAST_CLAIM_KEY)))) / (60 * 60 * 1000));
            claimBtn.innerHTML = `<i class="fas fa-clock"></i> ${hoursLeft}h left`;
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
        }
    });
    
    updateClaimButton();
    setInterval(updateClaimButton, 60000);
}

console.log('✅ Tournaments page loaded');
