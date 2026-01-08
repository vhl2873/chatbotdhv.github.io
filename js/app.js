/**
 * Chat Application - ChatGPT Style
 * Main JavaScript with sidebar, chat history, and full functionality
 */

// API Configuration
let API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const modelSelect = document.getElementById('modelSelect');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
const newChatBtn = document.getElementById('newChatBtn');
const historyList = document.getElementById('historyList');
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const overlay = document.getElementById('overlay');
const settingsBtn = document.getElementById('settingsBtn');
const imageUploadBtn = document.getElementById('imageUploadBtn');
const imageInput = document.getElementById('imageInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewRemove = document.getElementById('imagePreviewRemove');

// State
let currentModel = 'gemini-1.5-flash';
let currentChatId = null;
let chatHistory = [];
let chatSessions = [];
let currentUserId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load API config
    if (window.APIConfig) {
        const config = await window.APIConfig.loadAPIConfig();
        API_BASE_URL = config.baseUrl;
        
        if (config.models) {
            currentModel = config.models.default || 'gemini-1.5-flash';
            populateModelSelector(config.models.available || []);
        }
    }
    
    // Load saved preferences
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel && modelSelect) {
        currentModel = savedModel;
        modelSelect.value = savedModel;
    }
    
    // Initialize Firebase auth
    if (window.AuthService) {
        await window.AuthService.init();
        
        window.AuthService.onAuthStateChanged((user) => {
            if (user) {
                currentUserId = user.uid;
                updateUserInfo(user);
                loadChatSessions(); // Load after getting user ID
                initializeApp();
            } else {
                window.location.href = 'login.html';
            }
        });
    } else {
        // Fallback: use anonymous user ID
        currentUserId = 'anonymous_' + localStorage.getItem('anonymousId') || Date.now();
        if (!localStorage.getItem('anonymousId')) {
            localStorage.setItem('anonymousId', currentUserId);
        }
        loadChatSessions();
        initializeApp();
    }
});

/**
 * Initialize app
 */
function initializeApp() {
    setupEventListeners();
    setupSidebar();
    setupMenu();
    autoResizeTextarea();
    updateSendButton();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Form submit
    chatForm.addEventListener('submit', handleSubmit);
    
    // Enter key (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    });
    
    // Auto resize textarea
    messageInput.addEventListener('input', () => {
        autoResizeTextarea();
        updateSendButton();
    });
    
    // Model selector change
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            currentModel = e.target.value;
            localStorage.setItem('selectedModel', currentModel);
        });
    }
    
    // Image upload button
    if (imageUploadBtn && imageInput) {
        imageUploadBtn.addEventListener('click', () => {
            imageInput.click();
        });
        
        imageInput.addEventListener('change', (e) => {
            handleImageSelect(e);
        });
    }
    
    // Image preview remove
    if (imagePreviewRemove) {
        imagePreviewRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            clearImagePreview();
        });
    }
    
    // Suggestion chips
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const suggestion = chip.getAttribute('data-suggestion');
            messageInput.value = suggestion;
            messageInput.focus();
            autoResizeTextarea();
            updateSendButton();
        });
    });
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }
}

/**
 * Setup sidebar
 */
function setupSidebar() {
    // Load saved sidebar state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true' && sidebar) {
        sidebar.classList.add('collapsed');
    }
    
    // Sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            toggleSidebar();
        });
    }
    
    // Toggle sidebar when clicking logo or user avatar in collapsed state
    const sidebarLogo = document.querySelector('.sidebar-logo');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (sidebarLogo) {
        sidebarLogo.addEventListener('click', (e) => {
            if (sidebar.classList.contains('collapsed')) {
                toggleSidebar();
            }
        });
    }
    
    if (userAvatar) {
        userAvatar.addEventListener('click', (e) => {
            if (sidebar.classList.contains('collapsed')) {
                toggleSidebar();
            }
        });
    }
    
    // Mobile sidebar toggle
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('show');
            overlay.classList.add('show');
        });
    }
    
    // Overlay click to close sidebar on mobile
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }
    
    // New chat button
    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChat);
    }
}

/**
 * Setup menu
 */
function setupMenu() {
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menuDropdown.style.display === 'block';
            menuDropdown.style.display = isVisible ? 'none' : 'block';
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.style.display = 'none';
        }
    });
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                if (window.AuthService) {
                    await window.AuthService.signOut();
                    window.location.href = 'login.html';
                }
            }
        });
    }
    
    // Settings button
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            alert('Tính năng cài đặt đang được phát triển');
            menuDropdown.style.display = 'none';
        });
    }
}

/**
 * Start new chat
 */
function startNewChat() {
    currentChatId = null;
    chatHistory = [];
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2"/>
                    <path d="M20 32h24M32 20v24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <h2>Xin chào!</h2>
            <p>Tôi là AI Assistant. Hãy hỏi tôi bất cứ điều gì bạn muốn.</p>
            <div class="suggestions">
                <button class="suggestion-chip" data-suggestion="Giải thích về AI">
                    Giải thích về AI
                </button>
                <button class="suggestion-chip" data-suggestion="Viết code Python">
                    Viết code Python
                </button>
                <button class="suggestion-chip" data-suggestion="Dịch sang tiếng Anh">
                    Dịch sang tiếng Anh
                </button>
            </div>
        </div>
    `;
    
    // Re-attach suggestion chip listeners
    setTimeout(() => {
        const suggestionChips = document.querySelectorAll('.suggestion-chip');
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const suggestion = chip.getAttribute('data-suggestion');
                messageInput.value = suggestion;
                messageInput.focus();
                autoResizeTextarea();
                updateSendButton();
            });
        });
    }, 100);
    
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    }
}

/**
 * Handle form submit
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    const imageFile = imageInput?.files?.[0];
    
    // Nếu có ảnh, tìm kiếm bằng ảnh
    if (imageFile) {
        await handleImageSearch(imageFile, message);
        return;
    }
    
    // Nếu không có message và không có ảnh, return
    if (!message) return;
    
    // Clear input
    messageInput.value = '';
    autoResizeTextarea();
    updateSendButton();
    
    // Remove welcome message
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    // Add user message
    addMessage(message, 'user');
    
    // Show typing indicator
    const typingId = showTypingIndicator();
    
    // Disable input
    setInputDisabled(true);
    
    try {
        // Create chat ID if new chat
        if (!currentChatId) {
            currentChatId = 'chat_' + Date.now();
        }
        
        // Get user ID if available
        let userId = null;
        if (window.AuthService) {
            const user = window.AuthService.getCurrentUser();
            if (user) {
                userId = user.uid;
            }
        }
        
        // Call API
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: message,
                chat_history: chatHistory,
                limit: 3,
                temperature: 0.7,
                model: currentModel,
                user_id: userId  // Gửi user_id để lưu log
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const botResponse = data.answer || data.message || 'Xin lỗi, tôi không thể trả lời.';
        // Ưu tiên model_used từ response, fallback về currentModel nếu không có
        const modelUsed = (data.model_used && data.model_used.trim() !== '') ? data.model_used : currentModel;
        
        // Debug log
        console.log('[DEBUG] Frontend - Response model_used:', data.model_used, 'Current model:', currentModel, 'Using:', modelUsed);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add bot message
        addMessage(botResponse, 'bot', modelUsed);
        
        // Update chat history
        chatHistory.push({ 
            role: 'user', 
            content: message,
            timestamp: Date.now()
        });
        chatHistory.push({ 
            role: 'assistant', 
            content: botResponse,
            model: modelUsed,
            timestamp: Date.now()
        });
        
        // Save chat session
        saveChatSession();
        
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator(typingId);
        addMessage(`Xin lỗi, có lỗi xảy ra: ${error.message}`, 'bot');
    } finally {
        setInputDisabled(false);
        messageInput.focus();
    }
}

/**
 * Add message to chat
 */
function addMessage(text, type, modelInfo = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (type === 'user') {
        avatar.textContent = 'U';
    } else {
        avatar.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
                <path d="M6 10h8M10 6v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    }
    
    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content-wrapper';
    
    // Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    // Add model badge for bot messages
    if (type === 'bot' && modelInfo) {
        const modelBadge = document.createElement('div');
        modelBadge.className = 'model-badge';
        modelBadge.textContent = getModelDisplayName(modelInfo);
        modelBadge.title = `Model: ${modelInfo}`;
        contentDiv.appendChild(modelBadge);
    }
    
    contentWrapper.appendChild(contentDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentWrapper);
    messagesContainer.appendChild(messageDiv);
    
    scrollToBottom();
}

/**
 * Get display name for model
 */
function getModelDisplayName(modelId) {
    const modelMap = {
        'gemini-1.5-flash': 'Gemini 1.5',
        'gpt-4o-mini': 'GPT-4o Mini'
    };
    return modelMap[modelId] || modelId;
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const typingId = 'typing-' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.id = typingId;
    messageDiv.className = 'message bot';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M6 10h8M10 6v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content-wrapper';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    
    contentWrapper.appendChild(typingDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentWrapper);
    messagesContainer.appendChild(messageDiv);
    
    scrollToBottom();
    return typingId;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(id) {
    const typingElement = document.getElementById(id);
    if (typingElement) {
        typingElement.remove();
    }
}

/**
 * Scroll to bottom
 */
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Auto resize textarea
 */
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
}

/**
 * Update send button state
 */
function updateSendButton() {
    const hasText = messageInput.value.trim().length > 0;
    sendButton.disabled = !hasText;
}

/**
 * Set input disabled state
 */
function setInputDisabled(disabled) {
    messageInput.disabled = disabled;
    sendButton.disabled = disabled;
    if (disabled) {
        sendButton.style.opacity = '0.5';
    } else {
        updateSendButton();
    }
}

/**
 * Update user info
 */
function updateUserInfo(user) {
    if (user && userName) {
        const displayName = user.displayName || user.email || 'Người dùng';
        userName.textContent = displayName;
        
        // Update avatar with initials
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar) {
            // Get initials from display name or email
            let initials = 'U';
            if (displayName && displayName !== 'Người dùng') {
                const parts = displayName.trim().split(/\s+/);
                if (parts.length >= 2) {
                    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                } else if (parts.length === 1) {
                    initials = parts[0][0].toUpperCase();
                } else if (user.email) {
                    initials = user.email[0].toUpperCase();
                }
            } else if (user.email) {
                initials = user.email[0].toUpperCase();
            }
            
            userAvatar.innerHTML = `<span style="font-weight: 700; font-size: 16px;">${initials}</span>`;
        }
    }
}

/**
 * Populate model selector
 */
function populateModelSelector(models) {
    if (!modelSelect || !models || models.length === 0) return;
    
    modelSelect.innerHTML = '';
    
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name} (${model.provider})`;
        option.title = model.description || '';
        modelSelect.appendChild(option);
    });
    
    if (currentModel) {
        modelSelect.value = currentModel;
    }
}

/**
 * Get storage key for current user
 */
function getStorageKey() {
    if (!currentUserId) {
        currentUserId = 'anonymous_' + (localStorage.getItem('anonymousId') || Date.now());
        if (!localStorage.getItem('anonymousId')) {
            localStorage.setItem('anonymousId', currentUserId);
        }
    }
    return `chatSessions_${currentUserId}`;
}

/**
 * Load chat sessions for current user
 */
function loadChatSessions() {
    const storageKey = getStorageKey();
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            chatSessions = JSON.parse(saved);
            // Sort by timestamp (newest first)
            chatSessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            renderChatHistory();
        } catch (e) {
            console.error('Error loading chat sessions:', e);
            chatSessions = [];
        }
    } else {
        chatSessions = [];
        renderChatHistory();
    }
}

/**
 * Save chat session for current user
 */
function saveChatSession() {
    if (!currentChatId || chatHistory.length === 0) return;
    
    // Get first user message as title
    const firstUserMessage = chatHistory.find(msg => msg.role === 'user');
    const title = firstUserMessage?.content?.substring(0, 50) || 'Cuộc trò chuyện mới';
    
    // Count questions and answers
    const questionCount = chatHistory.filter(msg => msg.role === 'user').length;
    const answerCount = chatHistory.filter(msg => msg.role === 'assistant').length;
    
    const session = {
        id: currentChatId,
        title: title,
        timestamp: Date.now(),
        questionCount: questionCount,
        answerCount: answerCount,
        messages: [...chatHistory], // Deep copy
        model: currentModel
    };
    
    // Remove existing session with same ID
    chatSessions = chatSessions.filter(s => s.id !== currentChatId);
    
    // Add to beginning
    chatSessions.unshift(session);
    
    // Keep only last 50 sessions per user
    if (chatSessions.length > 50) {
        chatSessions = chatSessions.slice(0, 50);
    }
    
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(chatSessions));
    renderChatHistory();
}

/**
 * Format timestamp to readable date
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return minutes < 1 ? 'Vừa xong' : `${minutes} phút trước`;
    }
    
    // Today
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Hôm qua';
    }
    
    // This week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date > weekAgo) {
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[date.getDay()];
    }
    
    // Older
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Render chat history
 */
function renderChatHistory() {
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (chatSessions.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'history-empty';
        emptyState.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 14px;">
                <p>Chưa có lịch sử trò chuyện</p>
                <p style="margin-top: 8px; font-size: 12px;">Bắt đầu cuộc trò chuyện mới để lưu lịch sử</p>
            </div>
        `;
        historyList.appendChild(emptyState);
        return;
    }
    
    chatSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'history-item';
        if (session.id === currentChatId) {
            item.classList.add('active');
        }
        
        const timeStr = formatTimestamp(session.timestamp);
        const questionCount = session.questionCount || 0;
        const answerCount = session.answerCount || 0;
        
        item.innerHTML = `
            <div class="history-item-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <div class="history-item-content">
                <div class="history-item-text">${session.title}</div>
                <div class="history-item-meta">
                    <span class="history-item-time">${timeStr}</span>
                    <span class="history-item-stats">${questionCount} câu hỏi • ${answerCount} câu trả lời</span>
                </div>
            </div>
            <button class="history-item-delete" title="Xóa" data-session-id="${session.id}">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        // Click to load session
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.history-item-delete')) {
                loadChatSession(session.id);
            }
        });
        
        // Delete button
        const deleteBtn = item.querySelector('.history-item-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChatSession(session.id);
        });
        
        historyList.appendChild(item);
    });
}

/**
 * Delete chat session
 */
function deleteChatSession(sessionId) {
    if (!confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
        return;
    }
    
    chatSessions = chatSessions.filter(s => s.id !== sessionId);
    
    // If deleted session was current, start new chat
    if (sessionId === currentChatId) {
        startNewChat();
    }
    
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(chatSessions));
    renderChatHistory();
}

/**
 * Load chat session
 */
function loadChatSession(sessionId) {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    currentChatId = session.id;
    chatHistory = session.messages ? [...session.messages] : []; // Deep copy
    
    // Update model if session has model info
    if (session.model && modelSelect) {
        currentModel = session.model;
        modelSelect.value = session.model;
        localStorage.setItem('selectedModel', session.model);
    }
    
    // Clear messages
    messagesContainer.innerHTML = '';
    
    // Render messages
    session.messages.forEach((msg) => {
        if (msg.role === 'user') {
            addMessage(msg.content, 'user');
        } else if (msg.role === 'assistant') {
            // Get model info if available
            const modelInfo = msg.model || session.model || null;
            addMessage(msg.content, 'bot', modelInfo);
        }
    });
    
    renderChatHistory();
    
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    }
    
    // Scroll to bottom
    setTimeout(() => scrollToBottom(), 100);
}

/**
 * Handle image select
 */
function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh (jpeg, png, webp, gif)');
        return;
    }
    
    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
        alert(`File quá lớn. Tối đa ${MAX_SIZE / 1024 / 1024}MB`);
        return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
        if (imagePreview) {
            imagePreview.src = event.target.result;
        }
        if (imagePreviewContainer) {
            imagePreviewContainer.style.display = 'flex';
        }
    };
    reader.readAsDataURL(file);
}

/**
 * Clear image preview
 */
function clearImagePreview() {
    if (imageInput) {
        imageInput.value = '';
    }
    if (imagePreview) {
        imagePreview.src = '';
    }
    if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'none';
    }
}

/**
 * Handle image search
 */
async function handleImageSearch(imageFile, optionalPrompt = null) {
    // Remove welcome message
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    // Add user message with image
    const userMessage = optionalPrompt || 'Tìm kiếm bằng hình ảnh';
    addMessageWithImage(userMessage, imageFile, 'user');
    
    // Clear input and image
    messageInput.value = '';
    clearImagePreview();
    autoResizeTextarea();
    updateSendButton();
    
    // Show typing indicator
    const typingId = showTypingIndicator();
    
    // Disable input
    setInputDisabled(true);
    
    try {
        // Create chat ID if new chat
        if (!currentChatId) {
            currentChatId = 'chat_' + Date.now();
        }
        
        // Get user ID if available
        let userId = null;
        if (window.AuthService) {
            const user = window.AuthService.getCurrentUser();
            if (user) {
                userId = user.uid;
            }
        }
        
        // Prepare form data
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('limit', '5');
        formData.append('return_answer', 'true');
        formData.append('temperature', '0.7');
        
        if (userId) {
            formData.append('user_id', userId);
        }
        
        if (optionalPrompt) {
            formData.append('prompt', optionalPrompt);
        }
        
        // Call image search API
        const response = await fetch(`${API_BASE_URL}/image-search`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Handle response
        if (data.status === 'error') {
            addMessage(`Xin lỗi, có lỗi xảy ra: ${data.message}`, 'bot');
            return;
        }
        
        // Build response message
        let responseText = '';
        
        if (data.description) {
            responseText += `**Mô tả hình ảnh:**\n${data.description}\n\n`;
        }
        
        if (data.answer) {
            responseText += `**Trả lời:**\n${data.answer}\n\n`;
        }
        
        if (data.sources && data.sources.length > 0) {
            responseText += `**Nguồn tham khảo (${data.sources.length}):**\n`;
            data.sources.forEach((source, index) => {
                responseText += `${index + 1}. ${source.text.substring(0, 150)}... (Độ tương đồng: ${(source.similarity * 100).toFixed(1)}%)\n`;
            });
        } else {
            responseText += 'Không tìm thấy tài liệu liên quan trong cơ sở dữ liệu.';
        }
        
        // Add bot message
        addMessage(responseText, 'bot', 'gpt-4o-mini');
        
        // Update chat history
        chatHistory.push({ 
            role: 'user', 
            content: `[IMAGE SEARCH] ${userMessage}`,
            timestamp: Date.now()
        });
        chatHistory.push({ 
            role: 'assistant', 
            content: responseText,
            model: 'gpt-4o-mini',
            timestamp: Date.now()
        });
        
        // Save chat session
        saveChatSession();
        
    } catch (error) {
        console.error('Image search error:', error);
        removeTypingIndicator(typingId);
        addMessage(`Xin lỗi, có lỗi xảy ra khi tìm kiếm hình ảnh: ${error.message}`, 'bot');
    } finally {
        setInputDisabled(false);
        messageInput.focus();
    }
}

/**
 * Add message with image
 */
function addMessageWithImage(text, imageFile, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (type === 'user') {
        avatar.textContent = 'U';
    } else {
        avatar.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
                <path d="M6 10h8M10 6v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    }
    
    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content-wrapper';
    
    // Image preview
    const imageDiv = document.createElement('div');
    imageDiv.className = 'message-image';
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target.result;
        img.alt = 'Uploaded image';
        imageDiv.appendChild(img);
    };
    reader.readAsDataURL(imageFile);
    
    // Text content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    contentWrapper.appendChild(imageDiv);
    contentWrapper.appendChild(contentDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentWrapper);
    messagesContainer.appendChild(messageDiv);
    
    scrollToBottom();
}
