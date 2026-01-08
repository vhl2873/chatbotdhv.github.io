/**
 * Auth Controller - Xử lý UI cho đăng nhập/đăng ký
 */

const AuthController = {
    /**
     * Initialize auth controller
     */
    async init() {
        // Initialize auth service
        if (window.AuthService) {
            await window.AuthService.init();
        }

        // Setup form handlers
        this.setupLoginForm();
        this.setupRegisterForm();
    },

    /**
     * Setup login form
     */
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    },

    /**
     * Setup register form
     */
    setupRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) return;

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
    },

    /**
     * Handle login
     */
    async handleLogin() {
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const loginButton = document.getElementById('loginButton');
        const errorMessage = document.getElementById('errorMessage');

        if (!email || !password) {
            this.showError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        // Disable button
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Đang đăng nhập...';
        }

        // Clear error
        this.hideError();

        // Call auth service
        if (!window.AuthService) {
            this.showError('Auth service chưa được khởi tạo');
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Đăng nhập';
            }
            return;
        }

        const { user, error } = await window.AuthService.signIn(email, password);

        if (error) {
            this.showError(error);
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Đăng nhập';
            }
        } else if (user) {
            // Kiểm tra role và redirect tương ứng
            await this.redirectBasedOnRole(user);
        }
    },

    /**
     * Handle register
     */
    async handleRegister() {
        const name = document.getElementById('name')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const registerButton = document.getElementById('registerButton');
        const errorMessage = document.getElementById('errorMessage');

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (password.length < 6) {
            this.showError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Mật khẩu xác nhận không khớp');
            return;
        }

        // Disable button
        if (registerButton) {
            registerButton.disabled = true;
            registerButton.textContent = 'Đang đăng ký...';
        }

        // Clear error
        this.hideError();

        // Call auth service
        if (!window.AuthService) {
            this.showError('Auth service chưa được khởi tạo');
            if (registerButton) {
                registerButton.disabled = false;
                registerButton.textContent = 'Đăng ký';
            }
            return;
        }

        const { user, error } = await window.AuthService.signUp(email, password, name);

        if (error) {
            this.showError(error);
            if (registerButton) {
                registerButton.disabled = false;
                registerButton.textContent = 'Đăng ký';
            }
        } else if (user) {
            // Kiểm tra role và redirect tương ứng
            await this.redirectBasedOnRole(user);
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.add('show');
        }
    },

    /**
     * Hide error message
     */
    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.classList.remove('show');
        }
    },

    /**
     * Redirect based on user role
     */
    async redirectBasedOnRole(user) {
        try {
            console.log('[DEBUG] Checking user role for:', user.uid);
            
            // Initialize Firestore service if not already
            if (!window.FirestoreService) {
                console.error('[ERROR] FirestoreService not available');
                window.location.href = 'index.html';
                return;
            }
            
            await window.FirestoreService.init();
            
            if (!window.FirestoreService.db) {
                console.error('[ERROR] Firestore not initialized');
                window.location.href = 'index.html';
                return;
            }
            
            // Check if user is admin
            console.log('[DEBUG] Checking if user is admin...');
            const isAdmin = await window.FirestoreService.isAdmin(user.uid);
            console.log('[DEBUG] isAdmin result:', isAdmin);
            
            if (isAdmin) {
                console.log('[DEBUG] User is admin, redirecting to admin.html');
                window.location.href = 'admin.html';
                return;
            }
            
            // Check if user is student
            console.log('[DEBUG] Checking if user is student...');
            const isStudent = await window.FirestoreService.isStudent(user.uid);
            console.log('[DEBUG] isStudent result:', isStudent);
            
            if (isStudent) {
                // Student có thể vào cả index.html và academic-assistant.html
                // Mặc định redirect đến index.html, họ có thể vào academic-assistant sau
                console.log('[DEBUG] User is student, redirecting to index.html');
                window.location.href = 'index.html';
                return;
            }
            
            // Default: redirect to index.html for regular users
            console.log('[DEBUG] User is regular user, redirecting to index.html');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('[ERROR] Error checking user role:', error);
            // Fallback: redirect to index.html
            window.location.href = 'index.html';
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthController.init());
} else {
    AuthController.init();
}

// Export
if (typeof window !== 'undefined') {
    window.AuthController = AuthController;
}

