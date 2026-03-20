import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCBbjwUV2rYYq_YK3NRXCHn9ZgG99JR0Pw",
  authDomain: "vidya-c4e8d.firebaseapp.com",
  projectId: "vidya-c4e8d",
  storageBucket: "vidya-c4e8d.firebasestorage.app",
  messagingSenderId: "616512392132",
  appId: "1:616512392132:web:6e9ff387ffaae96a4ef291"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logOut = () => signOut(auth);

const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const getEmailSignInMethods = (email) => fetchSignInMethodsForEmail(auth, email);
export const onAuthChanged = (callback) => onAuthStateChanged(auth, callback);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

