/**
 * Academic Auth Guard
 * Kiểm tra quyền truy cập Academic Assistant
 * Chỉ cho phép sinh viên Đại học Vinh truy cập
 */

const AcademicAuthGuard = {
    /**
     * Kiểm tra và bảo vệ trang Academic Assistant
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

        // 3. Kiểm tra student record trong Firestore
        console.log('[ACADEMIC GUARD] Checking student record for UID:', user.uid);
        const isStudent = await window.FirestoreService.isStudent(user.uid);
        console.log('[ACADEMIC GUARD] isStudent result:', isStudent);

        if (!isStudent) {
            // Thử lấy student data để xem lỗi gì
            const studentData = await window.FirestoreService.getStudent(user.uid);
            console.log('[ACADEMIC GUARD] Student data:', studentData);

            if (!studentData) {
                console.error('[ACADEMIC GUARD] No student record found in Firestore for UID:', user.uid);
                console.error('[ACADEMIC GUARD] Make sure:');
                console.error('  1. Student document exists in Firestore collection "students"');
                console.error('  2. Document ID matches Firebase Auth UID');
                console.error('  3. Firestore Rules allow read for authenticated users');
            } else if (studentData.isActive === false) {
                console.error('[ACADEMIC GUARD] Student account is inactive');
            }

            console.log('[ACADEMIC GUARD] User is not a student, redirecting to index');
            this.redirectToIndex('Chỉ sinh viên Đại học Vinh mới được truy cập Trợ lý Học vụ & Sinh viên.');
            return false;
        }

        // 4. Lấy thông tin sinh viên và lưu vào window để dùng sau
        const studentData = await window.FirestoreService.getStudent(user.uid);
        if (studentData) {
            window.currentStudent = studentData;
            console.log('Student authenticated:', studentData);
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
     * Lấy thông tin sinh viên hiện tại
     * @returns {Object|null} Student data
     */
    getCurrentStudent() {
        return window.currentStudent || null;
    }
};

// Export
if (typeof window !== 'undefined') {
    window.AcademicAuthGuard = AcademicAuthGuard;
}

