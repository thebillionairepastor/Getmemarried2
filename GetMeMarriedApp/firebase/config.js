
// firebase/config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ✅ Your real config (copied from Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDWqGVGqGVGqGVGqGVGqGVGqGVGqGVGqGVG",
  authDomain: "getmemarriedapp.firebaseapp.com",
  projectId: "getmemarriedapp",
  storageBucket: "getmemarriedapp.firebasestorage.app",
  messagingSenderId: "675418023687",
  appId: "1:675418023687:web:4e341084546956800007a2"
};

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Export services you'll use
export const auth = getAuth(app);
export const db = getFirestore(app);
