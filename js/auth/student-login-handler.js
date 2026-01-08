/**
 * Student Login Handler
 * Xử lý đăng nhập và kiểm tra quyền student
 */

const StudentLoginHandler = {
    /**
     * Xử lý đăng nhập student
     */
    async handleLogin(email, password) {
        try {
            console.log('[STUDENT LOGIN] Starting login process...');
            
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
            console.log('[STUDENT LOGIN] Signing in with Firebase Auth...');
            const { user, error: authError } = await window.AuthService.signIn(email, password);
            
            if (authError) {
                console.error('[STUDENT LOGIN] Auth error:', authError);
                return { success: false, error: authError };
            }
            
            if (!user) {
                return { success: false, error: 'Đăng nhập thất bại' };
            }
            
            console.log('[STUDENT LOGIN] Auth successful, UID:', user.uid);
            
            // Đợi một chút để đảm bảo auth state được cập nhật
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Step 3: Kiểm tra quyền student từ Firestore
            console.log('[STUDENT LOGIN] Checking student role in Firestore...');
            const isStudent = await window.FirestoreService.isStudent(user.uid);
            
            if (isStudent) {
                console.log('[STUDENT LOGIN] User is student, redirecting to academic-assistant.html');
                // Redirect to academic assistant
                window.location.href = 'academic-assistant.html';
                return { success: true };
            } else {
                console.warn('[STUDENT LOGIN] User is not a student');
                // Sign out user
                if (window.AuthService) {
                    await window.AuthService.signOut();
                }
                return { success: false, error: 'Tài khoản này không phải là sinh viên. Vui lòng đăng nhập bằng tài khoản sinh viên.' };
            }
            
        } catch (error) {
            console.error('[STUDENT LOGIN] Error:', error);
            
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
    window.StudentLoginHandler = StudentLoginHandler;
}

