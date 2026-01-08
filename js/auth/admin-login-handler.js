/**
 * Admin Login Handler
 * Xử lý đăng nhập và kiểm tra quyền admin
 */

const AdminLoginHandler = {
    /**
     * Xử lý đăng nhập admin
     */
    async handleLogin(email, password) {
        try {
            console.log('[ADMIN LOGIN] Starting login process...');
            
            // Step 1: Initialize services
            if (!window.AuthService) {
                throw new Error('AuthService not available');
            }
            
            await window.AuthService.init();
            
            if (!window.FirestoreService) {
                throw new Error('FirestoreService not available');
            }
            
            await window.FirestoreService.init();
            
            // Step 2: Sign in với Firebase Auth
            console.log('[ADMIN LOGIN] Signing in with Firebase Auth...');
            const { user, error: authError } = await window.AuthService.signIn(email, password);
            
            if (authError) {
                console.error('[ADMIN LOGIN] Auth error:', authError);
                return { success: false, error: authError };
            }
            
            if (!user) {
                return { success: false, error: 'Đăng nhập thất bại' };
            }
            
            console.log('[ADMIN LOGIN] Auth successful, UID:', user.uid);
            
            // Đợi một chút để đảm bảo auth state được cập nhật
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Step 3: Kiểm tra quyền admin từ Firestore
            console.log('[ADMIN LOGIN] Checking admin role in Firestore...');
            const isAdmin = await window.FirestoreService.isAdmin(user.uid);
            
            if (isAdmin) {
                console.log('[ADMIN LOGIN] User is admin, redirecting to admin.html');
                // Redirect to admin page
                window.location.href = 'admin.html';
                return { success: true };
            } else {
                console.warn('[ADMIN LOGIN] User is not admin');
                // Sign out user
                if (window.AuthService) {
                    await window.AuthService.signOut();
                }
                return { success: false, error: 'Tài khoản này không có quyền admin. Vui lòng đăng nhập bằng tài khoản admin.' };
            }
            
        } catch (error) {
            console.error('[ADMIN LOGIN] Error:', error);
            
            let errorMessage = 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.code === 'permission-denied') {
                errorMessage = 'Lỗi quyền truy cập Firestore. Vui lòng kiểm tra Firestore Security Rules đã được deploy chưa.';
            }
            
            return { success: false, error: errorMessage };
        }
    }
};

// Export
if (typeof window !== 'undefined') {
    window.AdminLoginHandler = AdminLoginHandler;
}

