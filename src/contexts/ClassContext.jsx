// src/contexts/ClassContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase.js';
import { 
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc // 1. Importe a função deleteDoc do Firestore
} from "firebase/firestore";

const ClassContext = createContext(null);

export const ClassProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const classesCollectionRef = collection(db, 'classes');
    const unsubscribe = onSnapshot(classesCollectionRef, (querySnapshot) => {
      const classesData = [];
      querySnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addClass = async (newClassData) => {
    try {
      const classesCollectionRef = collection(db, 'classes');
      await addDoc(classesCollectionRef, newClassData);
    } catch (error) {
      console.error("Erro ao adicionar turma: ", error);
    }
  };

  const updateClass = async (classId, updatedData) => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      await updateDoc(classDocRef, updatedData);
    } catch (error) {
      console.error("Erro ao atualizar turma: ", error);
    }
  };

  // 2. Adicione a nova função para deletar a turma
  const deleteClass = async (classId) => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      await deleteDoc(classDocRef);
    } catch (error) {
      console.error("Erro ao deletar turma: ", error);
      alert("Ocorreu um erro ao deletar a turma.");
    }
  };

  // 3. Exponha a nova função 'deleteClass' no contexto
  const value = { classes, addClass, updateClass, deleteClass, loadingClasses: loading };

  return (
    <ClassContext.Provider value={value}>
      {children}
    </ClassContext.Provider>
  );
};

export const useClasses = () => {
  return useContext(ClassContext);
};
