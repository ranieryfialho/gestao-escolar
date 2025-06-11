import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";


const firebaseConfig = {
  apiKey: "AIzaSyANMr7iik2i8ANNqXZFVg_Q_2U64qT2LpU",
  authDomain: "boletim-escolar-app.firebaseapp.com",
  projectId: "boletim-escolar-app",
  storageBucket: "boletim-escolar-app.firebasestorage.app",
  messagingSenderId: "629925665935",
  appId: "1:629925665935:web:ac8ad56de85161f549e4fa"
};

// Inicializa a aplicação Firebase
const app = initializeApp(firebaseConfig);

// Criamos e exportamos os serviços que os outros ficheiros vão usar.
export const db = getFirestore(app);
export const auth = getAuth(app);
// Especificamos a região para garantir uma conexão estável com as funções
export const functions = getFunctions(app, 'us-central1');