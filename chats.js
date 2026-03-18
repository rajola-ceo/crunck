// chat.js - Main Chat Application
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    serverTimestamp,
    limit,
    startAfter,
    getDocs,
    arrayUnion,
    arrayRemove,
    deleteDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL,
    uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// ================= DOM ELEMENTS =================
// Home Screen
const homeScreen = document.getElementById('home-screen');
const chatScreen = document.getElementById('chat-screen');
const profileBadge = document.getElementById('profile-badge');
const headerProfilePic = document.getElementById('header-profile-pic');
const searchToggle = document.getElementById('search-toggle');
const searchBar = document.getElementById('search-bar');
const globalSearch = document.getElementById('global-search');
const clearSearch = document.getElementById('clear-search');

// Tabs
const tabChats = document.getElementById('tab-chats');
const tabContacts = document.getElementById('tab-contacts');
const tabCalls = document.getElementById('tab-calls');
const chatsView = document.getElementById('chats-view');
const contactsView = document.getElementById('contacts-view');
const callsView = document.getElementById('calls-view');

// Lists
const recentChatsList = document.getElementById('recent-chats-list');
const userList = document.getElementById('user-list');
const callsList = document.getElementById('calls-list');

// Empty States
const emptyChats = document.getElementById('empty-chats');
const emptyCalls = document.getElementById('empty-calls');

// Chat Screen Elements
const backBtn = document.getElementById('back-btn');
const chatAvatar = document.getElementById('chat-avatar');
const chatWithName = document.getElementById('chat-with-name');
const chatStatusIndicator = document.getElementById('chat-status-indicator');
const chatStatusText = document.getElementById('chat-status-text');
const typingIndicator = document.getElementById('typing-indicator');
const messageBox = document.getElementById('message-box');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const attachBtn = document.getElementById('attach-btn');
const imageUpload = document.getElementById('image-upload');
const fileUpload = document.getElementById('file-upload');
const emojiBtn = document.getElementById('emoji-btn');
const fileBtn = document.getElementById('file-btn');
const cameraBtn = document.getElementById('camera-btn');
const voiceCallBtn = document.getElementById('voice-call-btn');
const videoCallBtn = document.getElementById('video-call-btn');
const chatMenuBtn = document.getElementById('chat-menu-btn');

// Reply Preview
const replyPreview = document.getElementById('reply-preview');
const replyName = document.getElementById('reply-name');
const replyText = document.getElementById('reply-text');
const closeReply = document.getElementById('close-reply');

// Image Modal
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const modalCaption = document.getElementById('modal-caption');
const closeModal = document.querySelector('.close-modal');

// Toast & Loading
const toastContainer = document.getElementById('toast-container');
const loadingOverlay = document.getElementById('loading-overlay');

// Invite Button
const inviteBtn = document.getElementById('invite-btn');

// ================= STATE MANAGEMENT =================
let currentUser = null;
let currentChatUser = null;
let currentChatId = null;
let messagesUnsubscribe = null;
let usersUnsubscribe = null;
let chatsUnsubscribe = null;
let typingTimeout = null;
let replyingTo = null;
let onlineUsers = new Set();
let allUsers = [];

// ================= AUTHENTICATION =================
// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        currentUser = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL || 'https://via.placeholder.com/100',
            phoneNumber: user.phoneNumber
        };
        
        // Save user to Firestore
        await saveUserToFirestore(currentUser);
        
        // Update UI
        updateProfileUI();
        
        // Load initial data
        loadUsers();
        loadRecentChats();
        setupPresence();
        
        console.log('User logged in:', currentUser);
    } else {
        // No user, redirect to login
        window.location.href = 'index.html';
    }
});

// Save user to Firestore
async function saveUserToFirestore(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastSeen: serverTimestamp(),
                status: 'online',
                createdAt: serverTimestamp()
            });
        } else {
            await updateDoc(userRef, {
                lastSeen: serverTimestamp(),
                status: 'online'
            });
        }
    } catch (error) {
        console.error('Error saving user:', error);
    }
}

// Update profile UI
function updateProfileUI() {
    if (currentUser && headerProfilePic) {
        headerProfilePic.src = currentUser.photoURL;
    }
}

// Setup presence system
function setupPresence() {
    if (!currentUser) return;
    
    const userStatusRef = doc(db, 'users', currentUser.uid);
    
    // Update status when window closes
    window.addEventListener('beforeunload', () => {
        updateDoc(userStatusRef, {
            status: 'offline',
            lastSeen: serverTimestamp()
        });
    });
    
    // Set online status
    updateDoc(userStatusRef, {
        status: 'online',
        lastSeen: serverTimestamp()
    });
    
    // Listen for online users
    const usersRef = collection(db, 'users');
    onSnapshot(usersRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
                const user = change.doc.data();
                if (user.status === 'online') {
                    onlineUsers.add(user.uid);
                } else {
                    onlineUsers.delete(user.uid);
                }
            }
        });
        updateUserStatusIndicators();
    });
}

// ================= LOAD USERS =================
function loadUsers() {
    if (!currentUser) return;
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', currentUser.uid));
    
    if (usersUnsubscribe) usersUnsubscribe();
    
    usersUnsubscribe = onSnapshot(q, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        allUsers = users;
        renderContacts(users);
    });
}

// Render contacts
function renderContacts(users) {
    if (!userList) return;
    
    if (users.length === 0) {
        userList.innerHTML = '<div class="empty-state"><p>No users found</p></div>';
        return;
    }
    
    userList.innerHTML = '';
    users.forEach(user => {
        const isOnline = onlineUsers.has(user.uid);
        const contactEl = document.createElement('div');
        contactEl.className = 'contact-item';
        contactEl.onclick = () => openChat(user);
        contactEl.innerHTML = `
            <img src="${user.photoURL || 'https://via.placeholder.com/56'}" 
                 alt="${user.displayName}" 
                 class="contact-avatar ${isOnline ? 'online' : ''}">
            <div class="contact-info">
                <div class="contact-name">
                    ${user.displayName}
                    ${isOnline ? '<span class="status-indicator online"></span>' : ''}
                </div>
                <div class="contact-status">${isOnline ? 'Online' : 'Offline'}</div>
            </div>
        `;
        userList.appendChild(contactEl);
    });
}

// Update status indicators
function updateUserStatusIndicators() {
    // Update contacts list
    document.querySelectorAll('.contact-item').forEach(item => {
        const avatar = item.querySelector('.contact-avatar');
        if (avatar) {
            // Logic to update online status
        }
    });
}

// ================= LOAD RECENT CHATS =================
function loadRecentChats() {
    if (!currentUser) return;
    
    const chatsRef = collection(db, 'chats');
    const q = query(
        chatsRef, 
        where('participants', 'array-contains', currentUser.uid),
        orderBy('lastMessageTime', 'desc')
    );
    
    if (chatsUnsubscribe) chatsUnsubscribe();
    
    chatsUnsubscribe = onSnapshot(q, (snapshot) => {
        const chats = [];
        snapshot.forEach((doc) => {
            chats.push({ id: doc.id, ...doc.data() });
        });
        renderRecentChats(chats);
    });
}

// Render recent chats
function renderRecentChats(chats) {
    if (!recentChatsList) return;
    
    if (chats.length === 0) {
        emptyChats.classList.remove('hidden');
        recentChatsList.innerHTML = '';
        return;
    }
    
    emptyChats.classList.add('hidden');
    recentChatsList.innerHTML = '';
    
    chats.forEach(async (chat) => {
        const otherUserId = chat.participants.find(id => id !== currentUser.uid);
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        const otherUser = userDoc.data();
        
        const isOnline = onlineUsers.has(otherUserId);
        const chatEl = document.createElement('div');
        chatEl.className = 'chat-item';
        chatEl.onclick = () => openChat(otherUser, chat.id);
        chatEl.innerHTML = `
            <img src="${otherUser.photoURL || 'https://via.placeholder.com/56'}" 
                 alt="${otherUser.displayName}" 
                 class="chat-avatar ${isOnline ? 'online' : ''}">
            <div class="chat-info">
                <div class="chat-name">
                    ${otherUser.displayName}
                    ${isOnline ? '<span class="status-indicator online"></span>' : ''}
                </div>
                <div class="chat-last-message">
                    ${chat.lastMessage?.type === 'text' ? chat.lastMessage.content : 'Media message'}
                </div>
            </div>
            <div class="chat-time">${formatTime(chat.lastMessageTime?.toDate())}</div>
            ${chat.unreadCount ? `<span class="unread-badge">${chat.unreadCount}</span>` : ''}
        `;
        recentChatsList.appendChild(chatEl);
    });
}

// ================= OPEN CHAT =================
async function openChat(user, existingChatId = null) {
    if (!currentUser) return;
    
    currentChatUser = user;
    
    // Update UI
    chatAvatar.src = user.photoURL || 'https://via.placeholder.com/56';
    chatWithName.textContent = user.displayName;
    
    // Check online status
    const isOnline = onlineUsers.has(user.uid);
    chatStatusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
    chatStatusText.textContent = isOnline ? 'Online' : 'Offline';
    
    // Get or create chat
    if (existingChatId) {
        currentChatId = existingChatId;
    } else {
        currentChatId = await getOrCreateChat(user.uid);
    }
    
    // Switch to chat screen
    homeScreen.classList.remove('active');
    chatScreen.classList.add('active');
    
    // Load messages
    loadMessages(currentChatId);
    
    // Mark messages as read
    markChatAsRead(currentChatId);
}

// Get or create chat
async function getOrCreateChat(otherUserId) {
    const chatsRef = collection(db, 'chats');
    const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    let existingChat = null;
    
    querySnapshot.forEach((doc) => {
        const chat = doc.data();
        if (chat.participants.includes(otherUserId)) {
            existingChat = doc.id;
        }
    });
    
    if (existingChat) {
        return existingChat;
    }
    
    // Create new chat
    const newChatRef = await addDoc(collection(db, 'chats'), {
        participants: [currentUser.uid, otherUserId],
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: serverTimestamp(),
        unreadCount: 0
    });
    
    return newChatRef.id;
}

// ================= LOAD MESSAGES =================
function loadMessages(chatId) {
    if (messagesUnsubscribe) messagesUnsubscribe();
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        renderMessages(messages);
        scrollToBottom();
    });
}

// Render messages
function renderMessages(messages) {
    if (!messageBox) return;
    
    messageBox.innerHTML = '';
    
    if (messages.length === 0) {
        messageBox.innerHTML = '<div class="empty-state"><p>No messages yet. Say hello!</p></div>';
        return;
    }
    
    let lastDate = null;
    
    messages.forEach((message) => {
        const messageDate = message.timestamp?.toDate();
        const messageDay = messageDate?.toDateString();
        
        // Add date separator
        if (messageDay !== lastDate && messageDate) {
            const dateSeparator = document.createElement('div');
            dateSeparator.className = 'date-separator';
            dateSeparator.innerHTML = `<span>${formatDate(messageDate)}</span>`;
            messageBox.appendChild(dateSeparator);
            lastDate = messageDay;
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
        messageEl.dataset.id = message.id;
        
        if (message.type === 'text') {
            messageEl.innerHTML = `
                <div class="message-content">
                    ${message.replyTo ? `<div class="reply-preview-mini">Replying to: ${message.replyTo}</div>` : ''}
                    ${message.content}
                </div>
                <div class="message-info">
                    <span class="message-time">${formatTime(messageDate)}</span>
                    ${message.senderId === currentUser.uid ? `
                        <span class="message-status ${message.status || 'sent'}">
                            ${message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                        </span>
                    ` : ''}
                </div>
            `;
        } else if (message.type === 'image') {
            messageEl.innerHTML = `
                <div class="message-content">
                    ${message.replyTo ? `<div class="reply-preview-mini">Replying to: ${message.replyTo}</div>` : ''}
                    <img src="${message.url}" class="message-image" onclick="openImageModal('${message.url}')">
                </div>
                <div class="message-info">
                    <span class="message-time">${formatTime(messageDate)}</span>
                    ${message.senderId === currentUser.uid ? `
                        <span class="message-status ${message.status || 'sent'}">
                            ${message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                        </span>
                    ` : ''}
                </div>
            `;
        }
        
        messageBox.appendChild(messageEl);
    });
}

// ================= SEND MESSAGE =================
async function sendMessage() {
    const content = msgInput.value.trim();
    if (!content && !replyingTo) return;
    
    const message = {
        senderId: currentUser.uid,
        type: 'text',
        content: content,
        timestamp: serverTimestamp(),
        status: 'sent',
        replyTo: replyingTo ? replyingTo.content : null
    };
    
    try {
        // Add message to Firestore
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), message);
        
        // Update chat last message
        const chatRef = doc(db, 'chats', currentChatId);
        await updateDoc(chatRef, {
            lastMessage: message,
            lastMessageTime: serverTimestamp()
        });
        
        // Clear input
        msgInput.value = '';
        
        // Clear reply
        clearReply();
        
        // Show send button
        micBtn.classList.add('hidden');
        sendBtn.classList.remove('hidden');
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    }
}

// Send image
async function sendImage(file) {
    if (!file) return;
    
    showLoading(true);
    
    try {
        // Upload to storage
        const storageRef = ref(storage, `chats/${currentChatId}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload progress:', progress);
            },
            (error) => {
                console.error('Upload error:', error);
                showToast('Upload failed', 'error');
                showLoading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                // Send message with image
                const message = {
                    senderId: currentUser.uid,
                    type: 'image',
                    url: downloadURL,
                    filename: file.name,
                    timestamp: serverTimestamp(),
                    status: 'sent'
                };
                
                await addDoc(collection(db, 'chats', currentChatId, 'messages'), message);
                
                // Update chat
                await updateDoc(doc(db, 'chats', currentChatId), {
                    lastMessage: message,
                    lastMessageTime: serverTimestamp()
                });
                
                showLoading(false);
                showToast('Image sent', 'success');
            }
        );
    } catch (error) {
        console.error('Error sending image:', error);
        showToast('Failed to send image', 'error');
        showLoading(false);
    }
}

// ================= TYPING INDICATOR =================
msgInput.addEventListener('input', () => {
    // Show send button when typing
    if (msgInput.value.trim()) {
        micBtn.classList.add('hidden');
        sendBtn.classList.remove('hidden');
    } else {
        micBtn.classList.remove('hidden');
        sendBtn.classList.add('hidden');
    }
    
    // Send typing indicator
    if (currentChatId) {
        const chatRef = doc(db, 'chats', currentChatId);
        if (typingTimeout) clearTimeout(typingTimeout);
        
        typingTimeout = setTimeout(() => {
            // Clear typing indicator
        }, 1000);
    }
});

// ================= MARK AS READ =================
async function markChatAsRead(chatId) {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        unreadCount: 0
    });
    
    // Update message status
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('status', '==', 'delivered'));
    const snapshot = await getDocs(q);
    
    snapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, {
            status: 'read'
        });
    });
}

// ================= UTILITY FUNCTIONS =================
function formatTime(date) {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Less than 24 hours
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
}

function scrollToBottom() {
    messageBox.scrollTop = messageBox.scrollHeight;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }, 100);
}

function showLoading(show) {
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }
}

function clearReply() {
    replyingTo = null;
    replyPreview.classList.add('hidden');
}

function openImageModal(url) {
    modalImage.src = url;
    imageModal.classList.add('active');
}

// ================= EVENT LISTENERS =================
// Tab switching
tabChats.addEventListener('click', () => {
    document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
    tabChats.classList.add('active');
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    chatsView.classList.add('active');
});

tabContacts.addEventListener('click', () => {
    document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
    tabContacts.classList.add('active');
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    contactsView.classList.add('active');
});

tabCalls.addEventListener('click', () => {
    document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
    tabCalls.classList.add('active');
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    callsView.classList.add('active');
});

// Back button
backBtn.addEventListener('click', () => {
    chatScreen.classList.remove('active');
    homeScreen.classList.add('active');
    if (messagesUnsubscribe) messagesUnsubscribe();
});

// Send message
sendBtn.addEventListener('click', sendMessage);

msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Image upload
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        sendImage(file);
    }
});

// Attach button
attachBtn.addEventListener('click', () => {
    imageUpload.click();
});

// Close modal
closeModal.addEventListener('click', () => {
    imageModal.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === imageModal) {
        imageModal.classList.remove('active');
    }
});

// Search toggle
searchToggle.addEventListener('click', () => {
    searchBar.classList.toggle('hidden');
    if (!searchBar.classList.contains('hidden')) {
        globalSearch.focus();
    }
});

// Clear search
clearSearch.addEventListener('click', () => {
    globalSearch.value = '';
    renderContacts(allUsers);
});

// Search functionality
globalSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.trim()) {
        const filtered = allUsers.filter(user => 
            user.displayName.toLowerCase().includes(query)
        );
        renderContacts(filtered);
    } else {
        renderContacts(allUsers);
    }
});

// Invite button
inviteBtn.addEventListener('click', () => {
    const inviteText = `Join me on Crunk Chat!`;
    if (navigator.share) {
        navigator.share({
            title: 'Crunk Chat',
            text: inviteText,
            url: window.location.origin
        });
    } else {
        navigator.clipboard.writeText(window.location.origin);
        showToast('Link copied to clipboard!', 'success');
    }
});

// Close reply
closeReply.addEventListener('click', clearReply);

// ================= EXPOSE GLOBALLY =================
window.switchTab = (tab) => {
    if (tab === 'contacts') {
        tabContacts.click();
    }
};

window.openImageModal = openImageModal;

console.log('Chat app initialized');
