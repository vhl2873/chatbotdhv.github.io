/**
 * Simple Auth Service
 * Đăng nhập không dùng Firebase Auth, chỉ kiểm tra Firestore
 */

const SimpleAuthService = {
    db: null,
    currentUser: null,

    /**
     * Initialize Firestore (không cần Firebase Auth)
     */
    async init() {
        if (this.db) return this.db;

        if (typeof firebase === 'undefined') {
            console.error('[SIMPLE AUTH] Firebase SDK not loaded');
            return null;
        }

        // Đợi Firestore SDK được load
        let retries = 0;
        while (typeof firebase.firestore !== 'function' && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (typeof firebase.firestore !== 'function') {
            console.error('[SIMPLE AUTH] Firestore SDK not loaded');
            return null;
        }

        // Khởi tạo Firebase App nếu chưa có
        if (!window.firebaseConfig) {
            console.error('[SIMPLE AUTH] firebaseConfig not available');
            return null;
        }

        const { app } = await window.firebaseConfig.initializeFirebase();
        if (!app) {
            console.error('[SIMPLE AUTH] Firebase app not initialized');
            return null;
        }

        // Lấy Firestore instance
        this.db = firebase.firestore();
        console.log('[SIMPLE AUTH] Firestore initialized');
        return this.db;
    },

    /**
     * Đăng nhập bằng email và password (so sánh với Firestore)
     */
    async signIn(email, password) {
        try {
            if (!this.db) {
                await this.init();
            }

            if (!this.db) {
                return { user: null, error: 'Firestore chưa được khởi tạo' };
            }

            console.log('[SIMPLE AUTH] Signing in with email:', email);

            // Tìm user trong collection users theo email
            const usersRef = this.db.collection('users');
            const querySnapshot = await usersRef.where('email', '==', email).limit(1).get();

            if (querySnapshot.empty) {
                console.log('[SIMPLE AUTH] User not found with email:', email);
                return { user: null, error: 'Email hoặc mật khẩu không đúng' };
            }

            // Lấy user document đầu tiên
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const uid = userDoc.id;

            console.log('[SIMPLE AUTH] User found, UID:', uid);

            // Kiểm tra password (so sánh plain text - trong production nên hash password)
            if (userData.password !== password) {
                console.log('[SIMPLE AUTH] Password mismatch');
                return { user: null, error: 'Email hoặc mật khẩu không đúng' };
            }

            // Kiểm tra account có bị vô hiệu hóa không
            if (userData.isActive === false) {
                return { user: null, error: 'Tài khoản đã bị vô hiệu hóa' };
            }

            // Tạo user object
            const user = {
                uid: uid,
                email: userData.email,
                displayName: userData.displayName || userData.fullName || email,
                role: userData.role || 'student'
            };

            // Lưu vào currentUser và localStorage
            this.currentUser = user;
            localStorage.setItem('simpleAuth_user', JSON.stringify(user));
            localStorage.setItem('simpleAuth_uid', uid);

            console.log('[SIMPLE AUTH] Login successful:', user);
            return { user: user, error: null };

        } catch (error) {
            console.error('[SIMPLE AUTH] Sign in error:', error);
            return { user: null, error: this.getErrorMessage(error) };
        }
    },

    /**
     * Đăng nhập student (kiểm tra trong collection students)
     */
    async signInStudent(email, password) {
        try {
            if (!this.db) {
                await this.init();
            }

            if (!this.db) {
                return { user: null, error: 'Firestore chưa được khởi tạo' };
            }

            console.log('[SIMPLE AUTH] Signing in student with email:', email);

            // Tìm trong collection students
            const studentsRef = this.db.collection('students');
            const querySnapshot = await studentsRef.where('email', '==', email).limit(1).get();

            if (querySnapshot.empty) {
                console.log('[SIMPLE AUTH] Student not found with email:', email);
                return { user: null, error: 'Email hoặc mật khẩu không đúng' };
            }

            const studentDoc = querySnapshot.docs[0];
            const studentData = studentDoc.data();
            const uid = studentDoc.id;

            // Kiểm tra password
            if (studentData.password !== password) {
                return { user: null, error: 'Email hoặc mật khẩu không đúng' };
            }

            // Kiểm tra isActive
            if (studentData.isActive === false) {
                return { user: null, error: 'Tài khoản sinh viên đã bị vô hiệu hóa' };
            }

            const user = {
                uid: uid,
                email: studentData.email,
                displayName: studentData.fullName || email,
                role: 'student',
                studentCode: studentData.studentCode,
                faculty: studentData.faculty,
                major: studentData.major
            };

            this.currentUser = user;
            localStorage.setItem('simpleAuth_user', JSON.stringify(user));
            localStorage.setItem('simpleAuth_uid', uid);

            console.log('[SIMPLE AUTH] Student login successful:', user);
            return { user: user, error: null };

        } catch (error) {
            console.error('[SIMPLE AUTH] Student sign in error:', error);
            return { user: null, error: this.getErrorMessage(error) };
        }
    },

    /**
     * Đăng nhập admin (kiểm tra trong collection users với role='admin')
     */
    async signInAdmin(email, password) {
        try {
            if (!this.db) {
                await this.init();
            }

            if (!this.db) {
                return { user: null, error: 'Firestore chưa được khởi tạo' };
            }

            console.log('[SIMPLE AUTH] Signing in admin with email:', email);
            console.log('[SIMPLE AUTH] Firestore db initialized:', !!this.db);

            // Tìm trong collection users với role='admin'
            const usersRef = this.db.collection('users');
            console.log('[SIMPLE AUTH] Querying users collection...');
            
            let querySnapshot;
            try {
                querySnapshot = await usersRef
                    .where('email', '==', email)
                    .where('role', '==', 'admin')
                    .limit(1)
                    .get();
                console.log('[SIMPLE AUTH] Query successful, found documents:', querySnapshot.size);
            } catch (queryError) {
                console.error('[SIMPLE AUTH] Query error:', queryError);
                console.error('[SIMPLE AUTH] Error code:', queryError.code);
                console.error('[SIMPLE AUTH] Error message:', queryError.message);
                throw queryError;
            }

            if (querySnapshot.empty) {
                console.log('[SIMPLE AUTH] Admin not found with email:', email);
                return { user: null, error: 'Email hoặc mật khẩu không đúng' };
            }

            const adminDoc = querySnapshot.docs[0];
            const adminData = adminDoc.data();
            const uid = adminDoc.id;

            // Kiểm tra password
            if (adminData.password !== password) {
                return { user: null, error: 'Email hoặc mật khẩu không đúng' };
            }

            // Kiểm tra isActive
            if (adminData.isActive === false) {
                return { user: null, error: 'Tài khoản admin đã bị vô hiệu hóa' };
            }

            const user = {
                uid: uid,
                email: adminData.email,
                displayName: adminData.displayName || adminData.fullName || email,
                role: 'admin'
            };

            this.currentUser = user;
            localStorage.setItem('simpleAuth_user', JSON.stringify(user));
            localStorage.setItem('simpleAuth_uid', uid);

            console.log('[SIMPLE AUTH] Admin login successful:', user);
            return { user: user, error: null };

        } catch (error) {
            console.error('[SIMPLE AUTH] Admin sign in error:', error);
            return { user: null, error: this.getErrorMessage(error) };
        }
    },

    /**
     * Đăng xuất
     */
    signOut() {
        this.currentUser = null;
        localStorage.removeItem('simpleAuth_user');
        localStorage.removeItem('simpleAuth_uid');
        console.log('[SIMPLE AUTH] Signed out');
        return { error: null };
    },

    /**
     * Lấy user hiện tại (từ localStorage hoặc currentUser)
     */
    getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        // Thử lấy từ localStorage
        const userStr = localStorage.getItem('simpleAuth_user');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
                return this.currentUser;
            } catch (e) {
                console.error('[SIMPLE AUTH] Error parsing user from localStorage:', e);
                localStorage.removeItem('simpleAuth_user');
            }
        }

        return null;
    },

    /**
     * Kiểm tra user đã đăng nhập chưa
     */
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    },

    /**
     * Chuyển đổi error code sang message tiếng Việt
     */
    getErrorMessage(error) {
        if (error.code === 'permission-denied') {
            return 'Lỗi quyền truy cập Firestore. Vui lòng kiểm tra Firestore Security Rules.';
        }
        if (error.message) {
            return error.message;
        }
        return 'Có lỗi xảy ra khi đăng nhập';
    }
};

// Export
if (typeof window !== 'undefined') {
    window.SimpleAuthService = SimpleAuthService;
}

