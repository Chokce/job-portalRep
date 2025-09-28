
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { db } from '../firebase-init.js';

const userService = {
    createUser: async (uid, userData) => {
        try {
            await setDoc(doc(db, 'users', uid), userData);
            return { success: true };
        } catch (error) {
            console.error("Error creating user document:", error);
            return { success: false, message: error.message };
        }
    }
};

export default userService;
