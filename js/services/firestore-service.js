/**
 * Firestore Service
 * Service để tương tác với Firestore database
 */

const FirestoreService = {
    db: null,

    /**
     * Initialize Firestore
     */
    async init() {
        if (this.db) return this.db;

        if (typeof firebase === 'undefined') {
            console.error('[ERROR] Firebase SDK not loaded');
            return null;
        }

        // Đợi Firestore SDK được load (nếu chưa có)
        let retries = 0;
        while (typeof firebase.firestore !== 'function' && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (typeof firebase.firestore !== 'function') {
            console.error('[ERROR] Firestore SDK not loaded after waiting');
            return null;
        }

        const { db } = await window.firebaseConfig.initializeFirebase();
        if (db) {
            this.db = db;
            console.log('[DEBUG] Firestore initialized successfully');
        } else {
            console.warn('[WARN] Firestore not initialized, trying to initialize directly...');
            // Thử khởi tạo trực tiếp nếu initializeFirebase không trả về db
            try {
                if (window.firebaseConfig && typeof window.firebaseConfig.initializeFirebase === 'function') {
                    const result = await window.firebaseConfig.initializeFirebase();
                    if (result && result.db) {
                        this.db = result.db;
                    } else if (typeof firebase.firestore === 'function') {
                        // Khởi tạo trực tiếp nếu cần
                        const { app, auth } = await window.firebaseConfig.initializeFirebase();
                        if (app && typeof firebase.firestore === 'function') {
                            this.db = firebase.firestore();
                            console.log('[DEBUG] Firestore initialized successfully (fallback method)');
                        }
                    }
                }
            } catch (error) {
                console.error('[ERROR] Error initializing Firestore:', error);
            }
        }
        return this.db;
    },

    /**
     * Lấy thông tin sinh viên từ Firestore
     * @param {string} uid - Firebase Auth UID
     * @returns {Promise<Object|null>} Student data hoặc null
     */
    async getStudent(uid) {
        if (!this.db) {
            await this.init();
        }

        if (!this.db) {
            console.error('[ERROR] Firestore not initialized in getStudent');
            return null;
        }

        try {
            console.log('[DEBUG] Getting student from Firestore, uid:', uid);
            
            // Đảm bảo user đã đăng nhập
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                console.error('[ERROR] User not authenticated');
                return null;
            }
            
            console.log('[DEBUG] Current user UID:', currentUser.uid, 'Requested UID:', uid);
            
            // Kiểm tra UID có khớp không
            if (currentUser.uid !== uid) {
                console.warn('[DEBUG] UID mismatch - current:', currentUser.uid, 'requested:', uid);
                // Vẫn tiếp tục vì có thể là trường hợp đặc biệt
            }
            
            // Đọc trực tiếp từ Firestore
            const docRef = this.db.collection('students').doc(uid);
            console.log('[DEBUG] Attempting to read document: students/', uid);
            
            const docSnap = await docRef.get();

            console.log('[DEBUG] Student document exists:', docSnap.exists);
            
            if (docSnap.exists) {
                const studentData = {
                    id: docSnap.id,
                    ...docSnap.data()
                };
                console.log('[DEBUG] Student data retrieved:', studentData);
                return studentData;
            }
            
            console.log('[DEBUG] Student document does not exist in Firestore');
            console.log('[DEBUG] ⚠️ Make sure:');
            console.log('  1. Document exists in collection "students" with document ID =', uid);
            console.log('  2. Document ID must match Firebase Auth UID exactly');
            console.log('  3. Check Firestore Console: https://console.firebase.google.com/');
            return null;
        } catch (error) {
            console.error('[ERROR] Error getting student:', error);
            console.error('[ERROR] Error code:', error.code);
            console.error('[ERROR] Error message:', error.message);
            
            // Nếu lỗi permissions, log chi tiết hơn
            if (error.code === 'permission-denied' || error.message?.includes('permissions') || error.message?.includes('Missing or insufficient')) {
                console.error('[ERROR] ⚠️ Permission denied! Make sure:');
                console.error('  1. Firestore Security Rules have been deployed to Firebase Console');
                console.error('  2. User is authenticated (current user:', firebase.auth().currentUser?.uid, ')');
                console.error('  3. Rules allow read for students/{uid} where uid matches auth.uid');
                console.error('  4. Check Firestore Rules in Firebase Console: https://console.firebase.google.com/');
            }
            
            // Không throw error, chỉ return null để không crash app
            return null;
        }
    },

    /**
     * Lấy thông tin user từ Firestore
     * @param {string} uid - Firebase Auth UID
     * @returns {Promise<Object|null>} User data hoặc null
     */
    async getUser(uid) {
        if (!this.db) {
            await this.init();
        }

        if (!this.db) {
            console.error('[ERROR] Firestore not initialized in getUser');
            return null;
        }

        try {
            console.log('[DEBUG] Getting user from Firestore, uid:', uid);
            
            // Đảm bảo user đã đăng nhập
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                console.error('[ERROR] User not authenticated');
                return null;
            }
            
            console.log('[DEBUG] Current user UID:', currentUser.uid, 'Requested UID:', uid);
            
            // Kiểm tra UID có khớp không
            if (currentUser.uid !== uid) {
                console.warn('[DEBUG] UID mismatch - current:', currentUser.uid, 'requested:', uid);
                // Vẫn tiếp tục vì có thể là trường hợp đặc biệt
            }
            
            // Đọc trực tiếp từ Firestore
            const docRef = this.db.collection('users').doc(uid);
            console.log('[DEBUG] Attempting to read document: users/', uid);
            
            const docSnap = await docRef.get();

            console.log('[DEBUG] User document exists:', docSnap.exists);
            
            if (docSnap.exists) {
                const userData = {
                    id: docSnap.id,
                    ...docSnap.data()
                };
                console.log('[DEBUG] User data retrieved:', userData);
                return userData;
            }
            
            console.log('[DEBUG] User document does not exist in Firestore');
            console.log('[DEBUG] ⚠️ Make sure:');
            console.log('  1. Document exists in collection "users" with document ID =', uid);
            console.log('  2. Document ID must match Firebase Auth UID exactly');
            console.log('  3. Check Firestore Console: https://console.firebase.google.com/');
            return null;
        } catch (error) {
            console.error('[ERROR] Error getting user:', error);
            console.error('[ERROR] Error code:', error.code);
            console.error('[ERROR] Error message:', error.message);
            
            // Nếu lỗi permissions, log chi tiết hơn
            if (error.code === 'permission-denied' || error.message?.includes('permissions') || error.message?.includes('Missing or insufficient')) {
                console.error('[ERROR] ⚠️ Permission denied! Make sure:');
                console.error('  1. Firestore Security Rules have been deployed to Firebase Console');
                console.error('  2. User is authenticated (current user:', firebase.auth().currentUser?.uid, ')');
                console.error('  3. Rules allow read for users/{uid} where uid matches auth.uid');
                console.error('  4. Check Firestore Rules in Firebase Console: https://console.firebase.google.com/');
            }
            
            // Không throw error, chỉ return null để không crash app
            return null;
        }
    },

    /**
     * Kiểm tra xem user có phải là sinh viên không
     * @param {string} uid - Firebase Auth UID
     * @returns {Promise<boolean>} true nếu là sinh viên
     */
    async isStudent(uid) {
        console.log('[DEBUG] isStudent check for UID:', uid);
        const student = await this.getStudent(uid);
        
        if (!student) {
            console.log('[DEBUG] isStudent: No student record found');
            return false;
        }

        // Kiểm tra isActive
        if (student.isActive === false) {
            console.log('[DEBUG] isStudent: Student account is inactive');
            return false;
        }

        console.log('[DEBUG] isStudent: User is a valid student');
        return true;
    },

    /**
     * Kiểm tra xem user có phải là admin không
     * @param {string} uid - Firebase Auth UID
     * @returns {Promise<boolean>} true nếu là admin
     */
    async isAdmin(uid) {
        try {
            console.log('[DEBUG] isAdmin check for UID:', uid);
            
            if (!this.db) {
                await this.init();
            }
            
            if (!this.db) {
                console.error('[ERROR] Firestore not initialized in isAdmin');
                return false;
            }
            
            const user = await this.getUser(uid);
            console.log('[DEBUG] getUser result for isAdmin:', user);
            
            if (!user) {
                console.log('[DEBUG] isAdmin: No user record found in Firestore');
                return false;
            }

            const isAdminResult = user.role === 'admin';
            console.log('[DEBUG] User role:', user.role, 'isAdmin:', isAdminResult);
            
            if (!isAdminResult) {
                console.log('[DEBUG] isAdmin: User is not an admin. Role:', user.role);
            } else {
                console.log('[DEBUG] isAdmin: User is a valid admin');
            }
            
            return isAdminResult;
        } catch (error) {
            console.error('[ERROR] Error in isAdmin:', error);
            return false;
        }
    },

    /**
     * Lấy role của user
     * @param {string} uid - Firebase Auth UID
     * @returns {Promise<string|null>} 'student', 'admin', hoặc null
     */
    async getUserRole(uid) {
        const user = await this.getUser(uid);
        if (!user) return null;

        return user.role || null;
    }
};

// Export
if (typeof window !== 'undefined') {
    window.FirestoreService = FirestoreService;
}

