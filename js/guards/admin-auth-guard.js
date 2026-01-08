/**
 * Admin Auth Guard
 * Kiểm tra quyền truy cập Admin Panel
 * Chỉ cho phép admin truy cập
 */

const AdminAuthGuard = {
    /**
     * Kiểm tra và bảo vệ trang Admin
     * @returns {Promise<boolean>} true nếu có quyền truy cập
     */
    async protect() {
        // 1. Kiểm tra Firebase Auth
        if (!window.AuthService) {
            console.error('AuthService not available');
            this.redirectToLogin();
            return false;
        }

        await window.AuthService.init();

        // Wait for auth state to settle
        const user = await new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        if (!user) {
            console.log('No authenticated user, redirecting to login');
            this.redirectToLogin();
            return false;
        }

        // 2. Kiểm tra Firestore Service
        if (!window.FirestoreService) {
            console.error('FirestoreService not available');
            this.redirectToIndex('Lỗi hệ thống. Vui lòng thử lại sau.');
            return false;
        }

        await window.FirestoreService.init();

        // 3. Kiểm tra admin role trong Firestore
        console.log('[ADMIN GUARD] Checking admin role for UID:', user.uid);
        const isAdmin = await window.FirestoreService.isAdmin(user.uid);
        console.log('[ADMIN GUARD] isAdmin result:', isAdmin);

        if (!isAdmin) {
            // Thử lấy user data để xem lỗi gì
            const userData = await window.FirestoreService.getUser(user.uid);
            console.log('[ADMIN GUARD] User data from Firestore:', userData);

            if (!userData) {
                console.error('[ADMIN GUARD] No user record found in Firestore for UID:', user.uid);
                console.error('[ADMIN GUARD] Make sure:');
                console.error('  1. User document exists in Firestore collection "users"');
                console.error('  2. Document ID matches Firebase Auth UID');
                console.error('  3. Firestore Rules allow read for authenticated users');
            } else {
                console.error('[ADMIN GUARD] User role:', userData.role, '(expected: admin)');
                if (userData.role !== 'admin') {
                    console.error('[ADMIN GUARD] User is not an admin. Current role:', userData.role);
                }
            }

            console.log('[ADMIN GUARD] User is not an admin, redirecting to index');
            this.redirectToIndex('Chỉ admin mới được truy cập trang quản trị.');
            return false;
        }

        // 4. Lưu thông tin admin vào window để dùng sau
        const userData = await window.FirestoreService.getUser(user.uid);
        if (userData) {
            window.currentAdmin = {
                uid: user.uid,
                email: user.email,
                role: userData.role
            };
            console.log('Admin authenticated:', window.currentAdmin);
        }

        return true;
    },

    /**
     * Redirect về trang login
     */
    redirectToLogin() {
        window.location.href = 'login.html';
    },

    /**
     * Redirect về trang index với thông báo
     * @param {string} message - Thông báo lỗi
     */
    redirectToIndex(message) {
        if (message) {
            alert(message);
        }
        window.location.href = 'index.html';
    },

    /**
     * Lấy thông tin admin hiện tại
     * @returns {Object|null} Admin data
     */
    getCurrentAdmin() {
        return window.currentAdmin || null;
    }
};

// Export
if (typeof window !== 'undefined') {
    window.AdminAuthGuard = AdminAuthGuard;
}

