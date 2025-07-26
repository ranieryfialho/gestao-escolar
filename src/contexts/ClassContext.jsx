import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { db } from "../firebase.js";
import { addDoc, updateDoc, doc, deleteDoc, collection, onSnapshot, arrayUnion, arrayRemove } from "firebase/firestore";
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Helper para chamar as Cloud Functions (mantido para outras funcionalidades existentes ou futuras)
const callApi = async (functionName, payload, token) => {
    const functionUrl = `https://us-central1-boletim-escolar-app.cloudfunctions.net/${functionName}`;
    const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: payload }),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || "Ocorreu um erro na chamada da API.");
    }
    return result;
};

const ClassContext = createContext(null);

export const ClassesProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (!firebaseUser) {
      setClasses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const classesCollectionRef = collection(db, "classes");

    const unsubscribe = onSnapshot(classesCollectionRef, (querySnapshot) => {
      const classesData = [];
      querySnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classesData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao escutar as alterações nas turmas:", error);
      setClasses([]);
      setLoading(false);
    });

    return () => unsubscribe();

  }, [firebaseUser]);
  
  const allStudentsMap = useMemo(() => {
    const map = new Map();
    classes.forEach(turma => {
      if (turma.students && Array.isArray(turma.students)) {
        turma.students.forEach(aluno => {
          const studentId = aluno.studentId || aluno.id;
          if (aluno.code && !map.has(aluno.code.toString())) {
            map.set(aluno.code.toString(), {
              id: studentId,
              name: aluno.name,
              code: aluno.code.toString(),
              className: turma.name
            });
          }
        });
      }
    });
    return map;
  }, [classes]);


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

  const findClassById = (classId) => {
    return classes.find(c => c.id === classId);
  };

  const findStudentByCode = async (code) => {
    if (!firebaseUser) throw new Error("Usuário não autenticado.");
    const token = await firebaseUser.getIdToken();
    try {
        const result = await callApi('findStudentByCode', { code }, token);
        return result.student;
    } catch (error) {
        console.error("Erro ao buscar aluno por matrícula:", error);
        throw error;
    }
  };
  
  const addStudentToClass = async (classId, studentData) => {
    const classRef = doc(db, "classes", classId);
    const newStudentId = studentData.studentId || doc(collection(db, 'students')).id;

    const newStudentPayload = {
      studentId: newStudentId,
      name: studentData.name,
      code: studentData.code,
      grades: {},
      observation: "",
      attendance: {} // Adiciona o campo de frequência
    };

    try {
      await updateDoc(classRef, {
          students: arrayUnion(newStudentPayload)
      });
      toast.success("Aluno adicionado com sucesso!");
    } catch (error) {
        console.error("Erro ao adicionar aluno à turma:", error);
        toast.error("Não foi possível adicionar o aluno.");
    }
  };

  const removeStudentFromClass = async (classId, studentId) => {
    const classRef = doc(db, "classes", classId);
    const classDoc = classes.find(c => c.id === classId);
    if (!classDoc || !classDoc.students) {
      toast.error("Turma ou aluno não encontrado.");
      return;
    }
    const studentToRemove = classDoc.students.find(s => (s.studentId || s.id) === studentId);
    if (!studentToRemove) {
      toast.error("Não foi possível encontrar o aluno para remover.");
      return;
    }

    try {
        await updateDoc(classRef, {
            students: arrayRemove(studentToRemove)
        });
        toast.success("Aluno removido com sucesso!");
    } catch (error) {
        console.error("Erro ao remover aluno:", error);
        toast.error("Não foi possível remover o aluno.");
    }
  };

  // --- FUNÇÃO PARA ATUALIZAR A FREQUÊNCIA ---
  const updateStudentAttendance = async (classId, studentId, dateString, status) => {
    const classDoc = classes.find(c => c.id === classId);
    if (!classDoc) return;

    const updatedStudents = classDoc.students.map(student => {
      if ((student.studentId || student.id) === studentId) {
        const updatedAttendance = { ...(student.attendance || {}) };
        
        if (updatedAttendance[dateString] === status) {
          delete updatedAttendance[dateString];
        } else {
          updatedAttendance[dateString] = status;
        }
        
        return { ...student, attendance: updatedAttendance };
      }
      return student;
    });

    try {
      await updateClass(classId, { students: updatedStudents });
      toast.success('Frequência salva!', { id: 'attendance-toast', duration: 1500 });
    } catch (error) {
      toast.error('Erro ao salvar frequência.');
      console.error(error);
    }
  };

  const value = { 
    classes, 
    addClass, 
    updateClass, 
    deleteClass, 
    loadingClasses: loading,
    allStudentsMap,
    findClassById,
    findStudentByCode, // Mantido caso seja útil em outro lugar
    addStudentToClass,
    removeStudentFromClass,
    updateStudentAttendance 
  };

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
};

export const useClasses = () => {
  return useContext(ClassContext);
};