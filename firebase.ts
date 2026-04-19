import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAC0SJHugcOCkDlOU_YfmWfLtYx882gYEM",
  authDomain: "bingo-adcd3.firebaseapp.com",
  projectId: "bingo-adcd3",
  storageBucket: "bingo-adcd3.firebasestorage.app",
  messagingSenderId: "329898599732",
  appId: "1:329898599732:web:4745053a8d46c964cb3161",
  measurementId: "G-479PLNB8WY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
