// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDeXuCKW6Z_0UMFPBdJb7pAL9IIDcIeNrY",
    authDomain: "fir-rtc-91cc7.firebaseapp.com",
    databaseURL: "https://fir-rtc-91cc7-default-rtdb.firebaseio.com",
    projectId: "fir-rtc-91cc7",
    storageBucket: "fir-rtc-91cc7.appspot.com",
    messagingSenderId: "470324836210",
    appId: "1:470324836210:web:c21c5f6bb78f6385bc4feb",
    measurementId: "G-RZZPJDDPGT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const dbRealtime = getDatabase(app);
export const dbFirestore = getFirestore(app);