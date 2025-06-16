import { createContext, useState, useContext, useEffect } from "react"
import { db } from "../firebase.js"
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore"

const ClassContext = createContext(null)

export const ClassesProvider = ({ children }) => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const classesCollectionRef = collection(db, "classes")
    const unsubscribe = onSnapshot(classesCollectionRef, (querySnapshot) => {
      const classesData = []
      querySnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() })
      })
      setClasses(classesData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const addClass = async (newClassData) => {
    try {
      const classesCollectionRef = collection(db, "classes")
      await addDoc(classesCollectionRef, newClassData)
    } catch (error) {
      console.error("Erro ao adicionar turma: ", error)
    }
  }

  const updateClass = async (classId, updatedData) => {
    try {
      const classDocRef = doc(db, "classes", classId)
      await updateDoc(classDocRef, updatedData)
    } catch (error) {
      console.error("Erro ao atualizar turma: ", error)
    }
  }

  const deleteClass = async (classId) => {
    try {
      const classDocRef = doc(db, "classes", classId)
      await deleteDoc(classDocRef)
    } catch (error) {
      console.error("Erro ao deletar turma: ", error)
      alert("Ocorreu um erro ao deletar a turma.")
    }
  }

  const value = { classes, addClass, updateClass, deleteClass, loadingClasses: loading }

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>
}

export const useClasses = () => {
  return useContext(ClassContext)
}