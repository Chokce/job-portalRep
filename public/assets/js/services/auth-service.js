
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { auth, db } from './firebase-init.js';

class AuthService {
    constructor() {
        this.user = null;
        onAuthStateChanged(auth, (user) => {
            this.user = user;
        });
    }

    async register(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), userData);
            return { success: true, user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();
            return { success: true, user: { ...user, ...userData } };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getCurrentUser() {
        return this.user;
    }

    async getUser(uid) {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                return { success: true, user: userDoc.data() };
            }
            return { success: false, message: 'User not found' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

export default new AuthService();
