import { createContext, useState, useContext, useEffect } from "react";
import { db } from "../firebase.js";
import { addDoc, updateDoc, doc, deleteDoc, collection } from "firebase/firestore";
import { useAuth } from './AuthContext';

const ClassContext = createContext(null);

export const ClassesProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { firebaseUser } = useAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      if (!firebaseUser) {
        setClasses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = await firebaseUser.getIdToken();
        const functionUrl = `https://us-central1-boletim-escolar-app.cloudfunctions.net/listAllClasses`;
        
        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao buscar turmas.');
        }

        const result = await response.json();
        setClasses(result.classes);

      } catch (error) {
        console.error("Erro ao carregar turmas via Cloud Function:", error);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();

  }, [firebaseUser]);

  const addClass = async (newClassData) => {
    try {
      const classesCollectionRef = collection(db, "classes");
      await addDoc(classesCollectionRef, newClassData);
    } catch (error) {
      console.error("Erro ao adicionar turma: ", error);
    }
  };

  const updateClass = async (classId, updatedData) => {
    try {
      const classDocRef = doc(db, "classes", classId);
      await updateDoc(classDocRef, updatedData);
    } catch (error) {
      console.error("Erro ao atualizar turma: ", error);
    }
  };

  const deleteClass = async (classId) => {
    try {
      const classDocRef = doc(db, "classes", classId);
      await deleteDoc(classDocRef);
    } catch (error) {
      console.error("Erro ao deletar turma: ", error);
      alert("Ocorreu um erro ao deletar a turma.");
    }
  };

  const value = { classes, addClass, updateClass, deleteClass, loadingClasses: loading };

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
};

export const useClasses = () => {
  return useContext(ClassContext);
};