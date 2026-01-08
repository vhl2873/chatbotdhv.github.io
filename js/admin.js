/**
 * Admin Panel - Quản lý Tài khoản và Upload
 */

// API Configuration
let API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const backToChatBtn = document.getElementById('backToChatBtn');
const adminNav = document.getElementById('adminNav');
const adminContent = document.getElementById('adminContent');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const logoutBtn = document.getElementById('logoutBtn');

// Accounts Management Elements
const addStudentBtn = document.getElementById('addStudentBtn');
const searchInput = document.getElementById('searchInput');
const facultyFilter = document.getElementById('facultyFilter');
const statusFilter = document.getElementById('statusFilter');
const studentsTableBody = document.getElementById('studentsTableBody');
const studentModal = document.getElementById('studentModal');
const studentForm = document.getElementById('studentForm');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');

// State
let students = [];
let filteredStudents = [];
let currentPage = 1;
let itemsPerPage = 10;
let editingStudentId = null;
let currentDomain = "general";

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // 🔐 Bước 1: Kiểm tra quyền truy cập với Admin Auth Guard
    // ⚠️ ĐÃ TẮT XÁC MINH - Cho phép truy cập không cần đăng nhập
    if (window.AdminAuthGuard) {
        const hasAccess = await window.AdminAuthGuard.protect();
        if (!hasAccess) {
            // Guard sẽ tự redirect, không cần làm gì thêm
            return;
        }

        // Lấy thông tin admin sau khi đã verify
        const admin = window.AdminAuthGuard.getCurrentAdmin();
        if (admin) {
            updateUserInfo(admin);
        }
    } else {
        console.error('AdminAuthGuard not available');
    }

    // Load API config
    if (window.APIConfig) {
        const config = await window.APIConfig.loadAPIConfig();
        API_BASE_URL = config.baseUrl;
    }

    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupNavigation();
    setupSidebar();
    setupMenu();
    loadStudents();
    setupUploadSection();
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

    // Add student button
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            openStudentModal();
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Filters
    if (facultyFilter) {
        facultyFilter.addEventListener('change', handleFilter);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilter);
    }

    // Modal
    if (modalClose) {
        modalClose.addEventListener('click', closeStudentModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeStudentModal);
    }

    // Form submit
    if (studentForm) {
        studentForm.addEventListener('submit', handleStudentSubmit);
    }

    // Click outside modal to close
    if (studentModal) {
        studentModal.addEventListener('click', (e) => {
            if (e.target === studentModal) {
                closeStudentModal();
            }
        });
    }
}

/**
 * Setup navigation
 */
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                switchSection(section);
            }
        });
    });
}

/**
 * Switch section
 */
function switchSection(section) {
    // Update nav items
    navItems.forEach(item => {
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update content sections
    contentSections.forEach(sec => {
        if (sec.id === `${section}Section`) {
            sec.classList.add('active');
        } else {
            sec.classList.remove('active');
        }
    });
}

/**
 * Setup sidebar
 */
function setupSidebar() {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true' && sidebar) {
        sidebar.classList.add('collapsed');
    }
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
 * Setup menu
 */
function setupMenu() {
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.style.display = menuDropdown.style.display === 'none' ? 'block' : 'none';
        });
    }

    document.addEventListener('click', (e) => {
        if (!menuBtn?.contains(e.target) && !menuDropdown?.contains(e.target)) {
            menuDropdown.style.display = 'none';
        }
    });

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
}

/**
 * Update user info
 */
function updateUserInfo(admin) {
    if (userName) {
        userName.textContent = admin.email || 'Admin';
    }
    if (userAvatar) {
        userAvatar.innerHTML = '<span>A</span>';
    }
}

/**
 * Load students from Firestore
 */
async function loadStudents() {
    if (!window.FirestoreService) {
        console.error('FirestoreService not available');
        return;
    }

    await window.FirestoreService.init();
    const db = window.FirestoreService.db;

    if (!db) {
        console.error('Firestore not initialized');
        return;
    }

    try {
        studentsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-row">
                    <div class="loading-spinner"></div>
                    <span>Đang tải dữ liệu...</span>
                </td>
            </tr>
        `;

        const studentsRef = db.collection('students');
        const snapshot = await studentsRef.get();

        students = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            students.push({
                id: doc.id,
                studentCode: data.studentCode || '',
                fullName: data.fullName || '',
                email: data.email || '',
                faculty: data.faculty || '',
                major: data.major || '',
                courseYear: data.courseYear || '',
                isActive: data.isActive !== false
            });
        });

        // Sort by studentCode
        students.sort((a, b) => {
            if (a.studentCode < b.studentCode) return -1;
            if (a.studentCode > b.studentCode) return 1;
            return 0;
        });

        filteredStudents = [...students];
        renderStudents();

    } catch (error) {
        console.error('Error loading students:', error);
        studentsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="error-row">
                    <span>❌ Lỗi khi tải dữ liệu: ${error.message}</span>
                </td>
            </tr>
        `;
    }
}

/**
 * Render students table
 */
function renderStudents() {
    if (filteredStudents.length === 0) {
        studentsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    <span>Không có dữ liệu</span>
                </td>
            </tr>
        `;
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageStudents = filteredStudents.slice(start, end);

    studentsTableBody.innerHTML = pageStudents.map(student => `
        <tr>
            <td>${student.studentCode}</td>
            <td>${student.fullName}</td>
            <td>${student.email || 'N/A'}</td>
            <td>${getFacultyName(student.faculty)}</td>
            <td>${student.major || 'N/A'}</td>
            <td>${student.courseYear || 'N/A'}</td>
            <td>
                <span class="status-badge ${student.isActive ? 'active' : 'inactive'}">
                    ${student.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editStudent('${student.id}')" title="Sửa">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11 2L14 5M2 14l2-7 7-7 3 3-7 7-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteStudent('${student.id}', '${student.studentCode}')" title="Xóa">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1v1M6 8v4M10 8v4M2 4h12l-1 10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1L2 4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination();
}

/**
 * Render pagination
 */
function renderPagination() {
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const pagination = document.getElementById('pagination');

    if (!pagination || totalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-controls">';

    // Previous button
    html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">Trước</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
    }

    // Next button
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Sau</button>`;

    html += '</div>';
    html += `<div class="pagination-info">Trang ${currentPage} / ${totalPages} (${filteredStudents.length} sinh viên)</div>`;

    pagination.innerHTML = html;
}

/**
 * Go to page
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderStudents();
}

/**
 * Handle search
 */
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    applyFilters();
}

/**
 * Handle filter
 */
function handleFilter() {
    applyFilters();
}

/**
 * Apply filters
 */
function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const faculty = facultyFilter.value;
    const status = statusFilter.value;

    filteredStudents = students.filter(student => {
        // Search filter
        if (query) {
            const matchQuery =
                student.studentCode.toLowerCase().includes(query) ||
                student.fullName.toLowerCase().includes(query) ||
                (student.email && student.email.toLowerCase().includes(query));
            if (!matchQuery) return false;
        }

        // Faculty filter
        if (faculty && student.faculty !== faculty) return false;

        // Status filter
        if (status === 'active' && !student.isActive) return false;
        if (status === 'inactive' && student.isActive) return false;

        return true;
    });

    currentPage = 1;
    renderStudents();
}

/**
 * Get faculty name
 */
function getFacultyName(facultyCode) {
    const faculties = {
        'cntt': 'Công nghệ Thông tin',
        'su_pham': 'Sư phạm',
        'kinh_te': 'Kinh tế',
        'luat': 'Luật',
        'ngoai_ngu': 'Ngoại ngữ',
        'khoa_hoc_tu_nhien': 'Khoa học Tự nhiên'
    };
    return faculties[facultyCode] || facultyCode;
}

/**
 * Open student modal
 */
function openStudentModal(studentId = null) {
    editingStudentId = studentId;
    const modalTitle = document.getElementById('modalTitle');

    if (studentId) {
        modalTitle.textContent = 'Sửa Sinh viên';
        const student = students.find(s => s.id === studentId);
        if (student) {
            document.getElementById('studentCode').value = student.studentCode;
            document.getElementById('fullName').value = student.fullName;
            document.getElementById('email').value = student.email;
            document.getElementById('faculty').value = student.faculty;
            document.getElementById('major').value = student.major || '';
            document.getElementById('courseYear').value = student.courseYear || '';
            document.getElementById('isActive').value = student.isActive ? 'true' : 'false';
            document.getElementById('password').required = false;
            document.getElementById('password').placeholder = 'Để trống nếu không đổi mật khẩu';
        }
    } else {
        modalTitle.textContent = 'Thêm Sinh viên';
        studentForm.reset();
        document.getElementById('password').required = true;
        document.getElementById('password').placeholder = 'Mật khẩu mặc định';
    }

    studentModal.style.display = 'flex';
}

/**
 * Close student modal
 */
function closeStudentModal() {
    studentModal.style.display = 'none';
    editingStudentId = null;
    studentForm.reset();
}

/**
 * Handle student form submit
 */
async function handleStudentSubmit(e) {
    e.preventDefault();

    const formData = {
        studentCode: document.getElementById('studentCode').value.trim(),
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        faculty: document.getElementById('faculty').value,
        major: document.getElementById('major').value.trim(),
        courseYear: parseInt(document.getElementById('courseYear').value) || null,
        isActive: document.getElementById('isActive').value === 'true'
    };

    // Validation
    if (!formData.studentCode || !formData.fullName || !formData.email || !formData.faculty) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    if (!editingStudentId && !formData.password) {
        alert('Vui lòng nhập mật khẩu cho tài khoản mới');
        return;
    }

    try {
        // Gọi API backend để tạo/sửa sinh viên
        // Hoặc có thể gọi trực tiếp Firebase Admin SDK từ backend
        const response = await fetch(`${API_BASE_URL}/admin/students`, {
            method: editingStudentId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify({
                ...formData,
                id: editingStudentId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Có lỗi xảy ra');
        }

        alert(editingStudentId ? 'Cập nhật sinh viên thành công!' : 'Thêm sinh viên thành công!');
        closeStudentModal();
        loadStudents();

    } catch (error) {
        console.error('Error saving student:', error);
        alert(`Lỗi: ${error.message}`);
    }
}

/**
 * Edit student
 */
function editStudent(studentId) {
    openStudentModal(studentId);
}

/**
 * Delete student
 */
async function deleteStudent(studentId, studentCode) {
    if (!confirm(`Bạn có chắc chắn muốn xóa sinh viên ${studentCode}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/students/${studentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${await getAuthToken()}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Có lỗi xảy ra');
        }

        alert('Xóa sinh viên thành công!');
        loadStudents();

    } catch (error) {
        console.error('Error deleting student:', error);
        alert(`Lỗi: ${error.message}`);
    }
}

/**
 * Get auth token
 */
async function getAuthToken() {
    if (window.AuthService) {
        return await window.AuthService.getToken();
    }
    return null;
}

/**
 * Setup upload section
 */
function setupUploadSection() {
    // Tích hợp upload functionality từ upload.js
    // Có thể load upload component hoặc copy logic
    const uploadContainer = document.getElementById('uploadContainer');

    if (uploadContainer) {
        // Load upload HTML và logic
        // Hoặc tạo upload component inline
        uploadContainer.innerHTML = `
            <div class="upload-card">
                <div class="upload-card-header">
                    <h3>Upload Tài liệu</h3>
                    <p>Chọn file PDF, DOCX, TXT hoặc MD để upload</p>
                </div>
                <div class="upload-dropzone" id="uploadArea">
                    <div class="dropzone-content">
                        <div class="dropzone-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </div>
                        <div class="dropzone-text">
                            <h3>Kéo thả file vào đây</h3>
                            <p>hoặc <button type="button" class="browse-link-btn">click để chọn file</button></p>
                        </div>
                        <div class="dropzone-formats">
                            <span class="format-tag">PDF</span>
                            <span class="format-tag">DOCX</span>
                            <span class="format-tag">TXT</span>
                            <span class="format-tag">MD</span>
                        </div>
                    </div>
                    <input type="file" id="fileInput" class="file-input" accept=".pdf,.txt,.md,.docx" multiple>
                </div>
                <div class="upload-actions">
                    <button class="upload-btn" id="uploadBtn" disabled>Upload Tài liệu</button>
                </div>
            </div>
        `;

        // Initialize upload functionality
        // Có thể import từ upload.js hoặc tạo lại
    }
}

// Export functions for inline event handlers
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.goToPage = goToPage;

