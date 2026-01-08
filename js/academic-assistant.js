/**
 * Academic Assistant - Trợ lý Học tập & Sinh viên
 */

// API Configuration
let API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const backToChatBtn = document.getElementById('backToChatBtn');
const academicNav = document.getElementById('academicNav');
const academicContent = document.getElementById('academicContent');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const logoutBtn = document.getElementById('logoutBtn');

// Chat Elements
const academicChatMessages = document.getElementById('academicChatMessages');
const academicChatForm = document.getElementById('academicChatForm');
const academicMessageInput = document.getElementById('academicMessageInput');
const academicSendButton = document.getElementById('academicSendButton');
const academicImageUploadBtn = document.getElementById('academicImageUploadBtn');
const academicImageInput = document.getElementById('academicImageInput');
const academicImagePreviewContainer = document.getElementById('academicImagePreviewContainer');
const academicImagePreview = document.getElementById('academicImagePreview');
const academicImagePreviewRemove = document.getElementById('academicImagePreviewRemove');
const academicModelSelect = document.getElementById('academicModelSelect');

// State
let academicChatHistory = [];
let currentUserId = null;
let currentAcademicModel = 'gpt-4o-mini'; // Mặc định dùng GPT-4o Mini cho Trợ lý Học tập

// Sample Data - Exam Schedule
const examScheduleData = [
    {
        code: 'CS101',
        name: 'Lập trình Cơ bản',
        date: '15/01/2025',
        day: 'Thứ 2',
        time: '7:00-9:00',
        room: 'P.301',
        type: 'Thi cuối kỳ',
        status: 'upcoming'
    },
    {
        code: 'CS102',
        name: 'Cấu trúc dữ liệu',
        date: '17/01/2025',
        day: 'Thứ 4',
        time: '9:00-11:00',
        room: 'P.205',
        type: 'Thi cuối kỳ',
        status: 'upcoming'
    },
    {
        code: 'CS201',
        name: 'Lập trình hướng đối tượng',
        date: '20/01/2025',
        day: 'Thứ 7',
        time: '13:00-15:00',
        room: 'P.401',
        type: 'Thi cuối kỳ',
        status: 'upcoming'
    },
    {
        code: 'CS202',
        name: 'Cơ sở dữ liệu',
        date: '22/01/2025',
        day: 'Thứ 2',
        time: '7:00-9:00',
        room: 'P.302',
        type: 'Thi cuối kỳ',
        status: 'upcoming'
    },
    {
        code: 'CS301',
        name: 'Lập trình Web',
        date: '24/01/2025',
        day: 'Thứ 4',
        time: '9:00-11:00',
        room: 'P.301',
        type: 'Thi cuối kỳ',
        status: 'upcoming'
    }
];

const gradesData = [
    { code: 'CS101', name: 'Lập trình Cơ bản', credits: 3, qt: 8.5, th: 9.0, ck: 8.0, avg: 8.5, letter: 'B+' },
    { code: 'CS102', name: 'Cấu trúc dữ liệu', credits: 3, qt: 9.0, th: 8.5, ck: 9.5, avg: 9.0, letter: 'A' },
    { code: 'CS201', name: 'Lập trình hướng đối tượng', credits: 4, qt: 8.0, th: 8.5, ck: 8.5, avg: 8.3, letter: 'B+' },
    { code: 'CS202', name: 'Cơ sở dữ liệu', credits: 3, qt: 9.5, th: 9.0, ck: 9.0, avg: 9.2, letter: 'A' },
    { code: 'CS301', name: 'Lập trình Web', credits: 3, qt: 8.5, th: 9.0, ck: 8.5, avg: 8.7, letter: 'A-' }
];


const notificationsData = [
    { id: 1, title: 'Thông báo đăng ký học phần', text: 'Thời gian đăng ký học phần học kỳ 2 năm học 2024-2025 từ 15/12/2024 đến 30/12/2024', time: '2 giờ trước', unread: true },
    { id: 2, title: 'Lịch thi cuối kỳ', text: 'Lịch thi cuối kỳ học kỳ 1 năm học 2024-2025 đã được công bố. Vui lòng kiểm tra trên hệ thống.', time: '1 ngày trước', unread: true },
    { id: 3, title: 'Thông báo học phí', text: 'Học phí học kỳ 2 năm học 2024-2025 sẽ được thu từ ngày 01/01/2025', time: '3 ngày trước', unread: false }
];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // 🔐 Bước 1: Kiểm tra quyền truy cập với Academic Auth Guard
    // ⚠️ ĐÃ TẮT XÁC MINH - Cho phép truy cập không cần đăng nhập
    if (window.AcademicAuthGuard) {
        const hasAccess = await window.AcademicAuthGuard.protect();
        if (!hasAccess) {
            // Guard sẽ tự redirect, không cần làm gì thêm
            return;
        }

        // Lấy thông tin sinh viên sau khi đã verify
        const student = window.AcademicAuthGuard.getCurrentStudent();
        if (student) {
            currentUserId = student.id;
            // Có thể dùng student data để populate UI
            console.log('Student data loaded:', student);
        }
    } else {
        console.error('AcademicAuthGuard not available');
        // Fallback: vẫn cho phép nhưng log warning
    }

    // Load API config
    if (window.APIConfig) {
        const config = await window.APIConfig.loadAPIConfig();
        API_BASE_URL = config.baseUrl;

        // Load model config
        if (config.models && config.models.available) {
            populateAcademicModelSelector(config.models.available);
        }
    }

    // Load saved model preference
    const savedModel = localStorage.getItem('academicSelectedModel');
    if (savedModel && academicModelSelect) {
        currentAcademicModel = savedModel;
        academicModelSelect.value = savedModel;
    }

    // Get user ID (fallback nếu guard không có)
    if (!currentUserId && window.AuthService) {
        await window.AuthService.init();
        const user = window.AuthService.getCurrentUser();
        if (user) {
            currentUserId = user.uid;
        }
    }

    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupNavigation();
    setupAcademicChat();
    loadExamSchedule();
    loadGrades();
    loadNotifications();
    updateUserInfo();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Back to chat
    if (backToChatBtn) {
        backToChatBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // User menu
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.style.display = menuDropdown.style.display === 'none' ? 'block' : 'none';
        });
    }

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.style.display = 'none';
        }
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.AuthService) {
                window.AuthService.signOut().then(() => {
                    window.location.href = 'login.html';
                });
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // Navigation items
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Academic chat form
    if (academicChatForm) {
        academicChatForm.addEventListener('submit', handleAcademicChatSubmit);
    }

    // Academic message input
    if (academicMessageInput) {
        academicMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAcademicChatSubmit(e);
            }
        });

        academicMessageInput.addEventListener('input', () => {
            autoResizeTextarea(academicMessageInput);
            updateSendButton(academicSendButton, academicMessageInput);
        });
    }

    // Academic model selector change
    if (academicModelSelect) {
        academicModelSelect.addEventListener('change', (e) => {
            currentAcademicModel = e.target.value;
            localStorage.setItem('academicSelectedModel', currentAcademicModel);
        });
    }

    // Suggestion chips
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const suggestion = chip.getAttribute('data-suggestion');
            if (academicMessageInput) {
                academicMessageInput.value = suggestion;
                academicMessageInput.focus();
                autoResizeTextarea(academicMessageInput);
                updateSendButton(academicSendButton, academicMessageInput);
            }
        });
    });
}

/**
 * Setup navigation
 */
function setupNavigation() {
    // Load saved section
    const savedSection = localStorage.getItem('academicSection') || 'profile';
    switchSection(savedSection);
}

/**
 * Switch content section
 */
function switchSection(sectionName) {
    // Update nav items
    navItems.forEach(item => {
        if (item.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update content sections
    contentSections.forEach(section => {
        if (section.id === `${sectionName}Section`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    // Save to localStorage
    localStorage.setItem('academicSection', sectionName);

    // Scroll to top
    academicContent.scrollTo(0, 0);
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
 * Load exam schedule
 */
function loadExamSchedule() {
    const examList = document.getElementById('examList');
    if (!examList) return;

    examList.innerHTML = '';

    if (examScheduleData.length === 0) {
        examList.innerHTML = `
            <div class="empty-state">
                <p>Chưa có lịch thi nào</p>
            </div>
        `;
        return;
    }

    examScheduleData.forEach(exam => {
        const examCard = document.createElement('div');
        examCard.className = 'exam-card';

        const daysUntil = getDaysUntil(exam.date);
        let statusClass = 'exam-upcoming';
        let statusText = `Còn ${daysUntil} ngày`;

        if (daysUntil === 0) {
            statusClass = 'exam-today';
            statusText = 'Hôm nay';
        } else if (daysUntil < 0) {
            statusClass = 'exam-past';
            statusText = 'Đã qua';
        }

        examCard.innerHTML = `
            <div class="exam-header">
                <div class="exam-code">${exam.code}</div>
                <div class="exam-status ${statusClass}">${statusText}</div>
            </div>
            <div class="exam-name">${exam.name}</div>
            <div class="exam-details">
                <div class="exam-detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="4" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M3 7h10M7 4v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span>${exam.date} (${exam.day})</span>
                </div>
                <div class="exam-detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M8 4v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span>${exam.time}</span>
                </div>
                <div class="exam-detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 6l5 3 5-3M3 6v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>${exam.room}</span>
                </div>
                <div class="exam-detail-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span>${exam.type}</span>
                </div>
            </div>
        `;

        examList.appendChild(examCard);
    });
}

/**
 * Get days until exam date
 */
function getDaysUntil(dateString) {
    const examDate = new Date(dateString.split('/').reverse().join('-'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Load grades
 */
function loadGrades() {
    const gradesTableBody = document.getElementById('gradesTableBody');
    if (!gradesTableBody) return;

    gradesTableBody.innerHTML = '';

    gradesData.forEach(grade => {
        const row = document.createElement('tr');

        let gradeClass = 'grade-average';
        if (grade.avg >= 9.0) gradeClass = 'grade-excellent';
        else if (grade.avg >= 8.0) gradeClass = 'grade-good';

        row.innerHTML = `
            <td>${grade.code}</td>
            <td>${grade.name}</td>
            <td>${grade.credits}</td>
            <td>${grade.qt}</td>
            <td>${grade.th}</td>
            <td>${grade.ck}</td>
            <td class="${gradeClass}">${grade.avg}</td>
            <td class="${gradeClass}">${grade.letter}</td>
        `;

        gradesTableBody.appendChild(row);
    });
}


/**
 * Load notifications
 */
function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    notificationsList.innerHTML = '';

    notificationsData.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.unread ? 'unread' : ''}`;
        item.innerHTML = `
            <div class="notification-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2a6 6 0 0 1 6 6v4a2 2 0 0 0 2 2h1a1 1 0 0 1 0 2H1a1 1 0 0 1 0-2h1a2 2 0 0 0 2-2V8a6 6 0 0 1 6-6z" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-text">${notification.text}</div>
                <div class="notification-time">${notification.time}</div>
            </div>
        `;

        notificationsList.appendChild(item);
    });

    // Mark all as read button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            document.querySelectorAll('.notification-item').forEach(item => {
                item.classList.remove('unread');
            });
        });
    }
}

/**
 * Update user info từ Firestore student data
 */
async function updateUserInfo() {
    // Ưu tiên lấy từ Firestore student data (đã được load bởi guard)
    const student = window.currentStudent || window.AcademicAuthGuard?.getCurrentStudent();

    if (student && userName) {
        // Sử dụng fullName từ Firestore
        const displayName = student.fullName || student.studentCode || 'Sinh viên';
        userName.textContent = displayName;

        // Update avatar với mã sinh viên hoặc tên
        if (userAvatar) {
            let initials = 'S';
            if (student.studentCode) {
                // Lấy 2 chữ số cuối của mã SV
                const code = student.studentCode.toString();
                initials = code.slice(-2).toUpperCase();
            } else if (student.fullName) {
                const parts = student.fullName.trim().split(/\s+/);
                if (parts.length >= 2) {
                    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                } else if (parts.length === 1) {
                    initials = parts[0][0].toUpperCase();
                }
            }
            userAvatar.innerHTML = `<span>${initials}</span>`;
        }

        // Cập nhật profile section nếu có
        updateProfileSection(student);
    } else {
        // Fallback: dùng Firebase Auth user
        if (window.AuthService) {
            const user = window.AuthService.getCurrentUser();
            if (user && userName) {
                const displayName = user.displayName || user.email || 'Sinh viên';
                userName.textContent = displayName;

                if (userAvatar) {
                    let initials = 'S';
                    if (displayName && displayName !== 'Sinh viên') {
                        const parts = displayName.trim().split(/\s+/);
                        if (parts.length >= 2) {
                            initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                        } else if (parts.length === 1) {
                            initials = parts[0][0].toUpperCase();
                        }
                    }
                    userAvatar.innerHTML = `<span>${initials}</span>`;
                }
            }
        }
    }
}

/**
 * Cập nhật profile section với dữ liệu từ Firestore
 */
function updateProfileSection(student) {
    if (!student) return;

    // Cập nhật các field trong profile section
    const profileSection = document.getElementById('profileSection');
    if (!profileSection) return;

    // Cập nhật mã sinh viên
    const studentCodeEl = profileSection.querySelector('[data-field="studentCode"]');
    if (studentCodeEl && student.studentCode) {
        studentCodeEl.textContent = student.studentCode;
    }

    // Cập nhật họ tên
    const fullNameEl = profileSection.querySelector('[data-field="fullName"]');
    if (fullNameEl && student.fullName) {
        fullNameEl.textContent = student.fullName;
    }

    // Cập nhật khoa
    const facultyEl = profileSection.querySelector('[data-field="faculty"]');
    if (facultyEl && student.faculty) {
        facultyEl.textContent = student.faculty;
    }

    // Cập nhật ngành
    const majorEl = profileSection.querySelector('[data-field="major"]');
    if (majorEl && student.major) {
        majorEl.textContent = student.major;
    }
}

/**
 * Setup academic chat
 */
function setupAcademicChat() {
    if (!academicChatMessages) return;

    // Auto resize textarea
    if (academicMessageInput) {
        autoResizeTextarea(academicMessageInput);
    }
}

/**
 * Handle academic chat submit
 */
async function handleAcademicChatSubmit(e) {
    e.preventDefault();

    const message = academicMessageInput?.value.trim();
    const imageFile = academicImageInput?.files?.[0];

    // Nếu có ảnh, tìm kiếm bằng ảnh
    if (imageFile) {
        await handleAcademicImageSearch(imageFile, message);
        return;
    }

    // Nếu không có message và không có ảnh, return
    if (!message) return;

    // Clear input
    if (academicMessageInput) {
        academicMessageInput.value = '';
        autoResizeTextarea(academicMessageInput);
        updateSendButton(academicSendButton, academicMessageInput);
    }

    // Remove welcome message
    const welcomeMessage = academicChatMessages?.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    // Add user message
    addAcademicMessage(message, 'user');

    // Show typing indicator
    const typingId = showAcademicTypingIndicator();

    // Disable input
    setAcademicInputDisabled(true);

    try {
        // Get auth token
        const token = await window.AuthService?.getToken();

        // Call academic chat API
        const response = await fetch(`${API_BASE_URL}/academic-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
                question: message,
                chat_history: academicChatHistory,
                limit: 5,
                temperature: 0.7,
                model: currentAcademicModel,
                user_id: currentUserId
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Remove typing indicator
        removeAcademicTypingIndicator(typingId);

        // Handle response
        if (data.status === 'error') {
            addAcademicMessage(`Xin lỗi, có lỗi xảy ra: ${data.answer}`, 'bot');
            return;
        }

        // Build response text
        let responseText = data.answer || '';

        // Add learning path suggestion if available
        if (data.learning_path_suggestion) {
            responseText += '\n\n' + data.learning_path_suggestion;
        }

        // Add sources if available
        if (data.sources && data.sources.length > 0) {
            responseText += '\n\n**Nguồn tham khảo:**\n';
            data.sources.forEach((source, index) => {
                const meta = source.metadata || {};
                const course = meta.course ? ` (${meta.course})` : '';
                responseText += `${index + 1}. ${source.text.substring(0, 100)}...${course} (${(source.similarity * 100).toFixed(1)}%)\n`;
            });
        }

        // Add bot message
        addAcademicMessage(responseText, 'bot', data.model_used);

        // Update chat history
        academicChatHistory.push({
            role: 'user',
            content: message,
            timestamp: Date.now()
        });
        academicChatHistory.push({
            role: 'assistant',
            content: responseText,
            model: data.model_used,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Academic chat error:', error);
        removeAcademicTypingIndicator(typingId);
        addAcademicMessage(`Xin lỗi, có lỗi xảy ra: ${error.message}`, 'bot');
    } finally {
        setAcademicInputDisabled(false);
        if (academicMessageInput) {
            academicMessageInput.focus();
        }
    }
}

/**
 * Add message to academic chat
 */
function addAcademicMessage(text, type, modelInfo = null) {
    if (!academicChatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (type === 'user') {
        avatar.textContent = 'SV';
    } else {
        avatar.innerHTML = '🎓';
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
        modelBadge.textContent = 'Trợ lý Học tập';
        contentDiv.appendChild(modelBadge);
    }

    contentWrapper.appendChild(contentDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentWrapper);
    academicChatMessages.appendChild(messageDiv);

    scrollAcademicToBottom();
}

/**
 * Show typing indicator
 */
function showAcademicTypingIndicator() {
    if (!academicChatMessages) return null;

    const typingId = 'typing-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = typingId;
    messageDiv.className = 'message bot';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '🎓';

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content-wrapper';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';

    contentWrapper.appendChild(typingDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentWrapper);
    academicChatMessages.appendChild(messageDiv);

    scrollAcademicToBottom();
    return typingId;
}

/**
 * Remove typing indicator
 */
function removeAcademicTypingIndicator(id) {
    if (!id) return;
    const typingElement = document.getElementById(id);
    if (typingElement) {
        typingElement.remove();
    }
}

/**
 * Scroll to bottom
 */
function scrollAcademicToBottom() {
    if (academicChatMessages) {
        academicChatMessages.scrollTop = academicChatMessages.scrollHeight;
    }
}

/**
 * Auto resize textarea
 */
function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

/**
 * Update send button state
 */
function updateSendButton(button, input) {
    if (!button || !input) return;
    const hasText = input.value.trim().length > 0;
    button.disabled = !hasText;
}

/**
 * Set input disabled state
 */
function setAcademicInputDisabled(disabled) {
    if (academicMessageInput) {
        academicMessageInput.disabled = disabled;
    }
    if (academicSendButton) {
        academicSendButton.disabled = disabled;
        if (disabled) {
            academicSendButton.style.opacity = '0.5';
        } else {
            updateSendButton(academicSendButton, academicMessageInput);
        }
    }
}

/**
 * Handle image select
 */
function handleAcademicImageSelect(e) {
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
        if (academicImagePreview) {
            academicImagePreview.src = event.target.result;
        }
        if (academicImagePreviewContainer) {
            academicImagePreviewContainer.style.display = 'flex';
        }
    };
    reader.readAsDataURL(file);
}

/**
 * Clear image preview
 */
function clearAcademicImagePreview() {
    if (academicImageInput) {
        academicImageInput.value = '';
    }
    if (academicImagePreview) {
        academicImagePreview.src = '';
    }
    if (academicImagePreviewContainer) {
        academicImagePreviewContainer.style.display = 'none';
    }
}

/**
 * Handle academic image search
 */
async function handleAcademicImageSearch(imageFile, optionalPrompt = null) {
    // Remove welcome message
    const welcomeMessage = academicChatMessages?.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    // Add user message with image
    const userMessage = optionalPrompt || 'Tìm kiếm bằng hình ảnh trong tài liệu học vụ';
    addAcademicMessageWithImage(userMessage, imageFile, 'user');

    // Clear input and image
    if (academicMessageInput) {
        academicMessageInput.value = '';
        autoResizeTextarea(academicMessageInput);
        updateSendButton(academicSendButton, academicMessageInput);
    }
    clearAcademicImagePreview();

    // Show typing indicator
    const typingId = showAcademicTypingIndicator();

    // Disable input
    setAcademicInputDisabled(true);

    try {
        // Prepare form data
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('limit', '5');
        formData.append('return_answer', 'true');
        formData.append('temperature', '0.7');

        if (currentUserId) {
            formData.append('user_id', currentUserId);
        }

        if (optionalPrompt) {
            formData.append('prompt', optionalPrompt);
        }

        // Get auth token
        const token = await window.AuthService?.getToken();

        // Call academic image search API
        const response = await fetch(`${API_BASE_URL}/academic-image-search`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Remove typing indicator
        removeAcademicTypingIndicator(typingId);

        // Handle response
        if (data.status === 'error') {
            addAcademicMessage(`Xin lỗi, có lỗi xảy ra: ${data.message}`, 'bot');
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
            responseText += `**Nguồn tham khảo từ tài liệu học vụ (${data.sources.length}):**\n`;
            data.sources.forEach((source, index) => {
                const meta = source.metadata || {};
                const course = meta.course ? ` (${meta.course})` : '';
                const type = meta.type ? ` - ${meta.type}` : '';
                responseText += `${index + 1}. ${source.text.substring(0, 150)}...${course}${type} (Độ tương đồng: ${(source.similarity * 100).toFixed(1)}%)\n`;
            });
        } else {
            responseText += 'Không tìm thấy tài liệu học vụ liên quan trong cơ sở dữ liệu của Trường Đại học Vinh.';
        }

        // Add bot message
        addAcademicMessage(responseText, 'bot', 'gpt-4o-mini');

        // Update chat history
        academicChatHistory.push({
            role: 'user',
            content: `[IMAGE SEARCH] ${userMessage}`,
            timestamp: Date.now()
        });
        academicChatHistory.push({
            role: 'assistant',
            content: responseText,
            model: 'gpt-4o-mini',
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Academic image search error:', error);
        removeAcademicTypingIndicator(typingId);
        addAcademicMessage(`Xin lỗi, có lỗi xảy ra khi tìm kiếm hình ảnh: ${error.message}`, 'bot');
    } finally {
        setAcademicInputDisabled(false);
        if (academicMessageInput) {
            academicMessageInput.focus();
        }
    }
}

/**
 * Add message with image
 */
function addAcademicMessageWithImage(text, imageFile, type) {
    if (!academicChatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (type === 'user') {
        avatar.textContent = 'SV';
    } else {
        avatar.innerHTML = '🎓';
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
    academicChatMessages.appendChild(messageDiv);

    scrollAcademicToBottom();
}

/**
 * Populate academic model selector
 */
function populateAcademicModelSelector(models) {
    if (!academicModelSelect || !models || models.length === 0) return;

    academicModelSelect.innerHTML = '';

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name} (${model.provider})`;
        option.title = model.description || '';
        academicModelSelect.appendChild(option);
    });

    // Set default to gpt-4o-mini for academic assistant
    const savedModel = localStorage.getItem('academicSelectedModel');
    if (savedModel && academicModelSelect.querySelector(`option[value="${savedModel}"]`)) {
        academicModelSelect.value = savedModel;
        currentAcademicModel = savedModel;
    } else if (academicModelSelect.querySelector('option[value="gpt-4o-mini"]')) {
        academicModelSelect.value = 'gpt-4o-mini';
        currentAcademicModel = 'gpt-4o-mini';
    }
}

// Load saved sidebar state
const savedState = localStorage.getItem('sidebarCollapsed');
if (savedState === 'true' && sidebar) {
    sidebar.classList.add('collapsed');
}

