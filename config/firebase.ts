import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCCndEEALKsEqszsYxhl_7KOmm4Bexl1j4",
  authDomain: "loginapp-99c62.firebaseapp.com",
  projectId: "loginapp-99c62",
  storageBucket: "loginapp-99c62.firebasestorage.app",
  messagingSenderId: "918392200512",
  appId: "1:918392200512:web:a6ec66845e015b75df6ea5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, Timestamp };
