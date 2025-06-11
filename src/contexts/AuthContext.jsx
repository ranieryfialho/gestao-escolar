// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase.js';
import { doc, onSnapshot } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail // 1. Importe a função de reset de senha
} from "firebase/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        const profileDocRef = doc(db, "users", user.uid);
        const unsubscribeProfile = onSnapshot(profileDocRef, (doc) => {
          if (doc.exists()) {
            setUserProfile({ id: doc.id, ...doc.data() });
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      alert("Falha no login. Verifique o email e a senha.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate('/login');
  };
  
  // 2. Adicione a nova função para redefinir a senha
  const resetPassword = async (email) => {
    if (!email) {
      return alert("Por favor, digite o seu email primeiro.");
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email para redefinição de senha enviado! Por favor, verifique a sua caixa de entrada.");
    } catch (error) {
      console.error("Erro ao enviar email de reset:", error);
      alert("Falha ao enviar o email. Verifique se o email está correto.");
    }
  };

  // 3. Adicione a nova função ao 'value' do contexto
  const value = { firebaseUser, userProfile, login, logout, loading, resetPassword };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">A carregar...</div>;
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);