/**
 * Auth Service - Xử lý authentication với Firebase
 */

const AuthService = {
    auth: null,

    /**
     * Initialize auth service
     */
    async init() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return;
        }

        const { auth: firebaseAuth } = await window.firebaseConfig.initializeFirebase();
        if (firebaseAuth) {
            this.auth = firebaseAuth;
        }
    },

    /**
     * Đăng ký tài khoản mới
     */
    async signUp(email, password, displayName) {
        if (!this.auth) {
            await this.init();
        }

        if (!this.auth) {
            return { user: null, error: 'Firebase auth chưa được khởi tạo' };
        }

        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(
                email,
                password
            );

            // Update display name
            if (userCredential.user && displayName) {
                await userCredential.user.updateProfile({
                    displayName: displayName
                });
            }

            return { user: userCredential.user, error: null };
        } catch (error) {
            return { user: null, error: this.getErrorMessage(error) };
        }
    },

    /**
     * Đăng nhập
     */
    async signIn(email, password) {
        if (!this.auth) {
            await this.init();
        }

        if (!this.auth) {
            return { user: null, error: 'Firebase auth chưa được khởi tạo' };
        }

        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(
                email,
                password
            );
            return { user: userCredential.user, error: null };
        } catch (error) {
            return { user: null, error: this.getErrorMessage(error) };
        }
    },

    /**
     * Đăng xuất
     */
    async signOut() {
        if (!this.auth) {
            await this.init();
        }

        if (!this.auth) {
            return { error: 'Firebase auth chưa được khởi tạo' };
        }

        try {
            await firebase.auth().signOut();
            return { error: null };
        } catch (error) {
            return { error: this.getErrorMessage(error) };
        }
    },

    /**
     * Lấy user hiện tại
     */
    getCurrentUser() {
        if (!this.auth) return null;
        return firebase.auth().currentUser;
    },

    /**
     * Lắng nghe thay đổi auth state
     */
    onAuthStateChanged(callback) {
        if (!this.auth) {
            this.init().then(() => {
                if (this.auth && firebase.auth) {
                    firebase.auth().onAuthStateChanged(callback);
                }
            });
            return;
        }
        if (firebase.auth) {
            firebase.auth().onAuthStateChanged(callback);
        }
    },

    /**
     * Lấy ID token
     */
    async getToken() {
        const user = this.getCurrentUser();
        if (!user) return null;
        try {
            return await user.getIdToken();
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    /**
     * Chuyển đổi error code sang message tiếng Việt
     */
    getErrorMessage(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'Email này đã được sử dụng',
            'auth/invalid-email': 'Email không hợp lệ',
            'auth/operation-not-allowed': 'Thao tác không được phép',
            'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự)',
            'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
            'auth/user-not-found': 'Không tìm thấy tài khoản',
            'auth/wrong-password': 'Mật khẩu không đúng',
            'auth/invalid-credential': 'Email hoặc mật khẩu không đúng',
            'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau',
            'auth/network-request-failed': 'Lỗi kết nối mạng'
        };

        return errorMessages[error.code] || error.message || 'Có lỗi xảy ra';
    }
};

// Export
if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}

