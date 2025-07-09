import { useState, useMemo, useEffect } from "react";
import AddLabEntryModal from "../components/AddLabEntryModal";
import LabEntriesTable from "../components/LabEntriesTable";
import { PlusCircle } from "lucide-react";
import { useClasses } from "../contexts/ClassContext";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";

function LabSupportPage() {
  const { userProfile } = useAuth();
  const { classes } = useClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [labEntries, setLabEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const allStudentsMap = useMemo(() => {
    const map = new Map();
    classes.forEach(turma => {
      if (turma.students && Array.isArray(turma.students)) {
        turma.students.forEach(aluno => {
          if (aluno.code && aluno.name) {
            map.set(aluno.code.toString(), {
              name: aluno.name,
              className: turma.name
            });
          }
        });
      }
    });
    return map;
  }, [classes]);

  useEffect(() => {
    setLoadingEntries(true);
    const q = query(collection(db, "labEntries"), where("entryDate", "==", selectedDate));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const entriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLabEntries(entriesData);
      setLoadingEntries(false);
    });
    return () => unsubscribe();
  }, [selectedDate]);

  const handleAddEntry = async (entryData) => {
    if (!entryData.studentCode || !entryData.studentName) {
        return toast.error("Código do aluno inválido ou não encontrado.");
    }
    const newLabEntry = {
        ...entryData,
        isDone: false,
        entryDate: selectedDate,
        createdAt: serverTimestamp()
    };
    try {
        await addDoc(collection(db, "labEntries"), newLabEntry);
        toast.success("Atendimento salvo com sucesso!");
        setIsModalOpen(false);
    } catch (error) {
        toast.error("Ocorreu um erro ao salvar.");
    }
  };

  const handleStatusChange = async (entryId, newStatus) => {
    const entryDocRef = doc(db, "labEntries", entryId);
    try {
      await updateDoc(entryDocRef, { isDone: newStatus });
      toast.success(`Atendimento marcado como ${newStatus ? 'realizado' : 'não realizado'}.`);
    } catch (error) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleEntryUpdate = async (entryId, updatedData) => {
    const entryDocRef = doc(db, "labEntries", entryId);
    try {
      await updateDoc(entryDocRef, updatedData);
      toast.success("Atendimento atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar o atendimento.");
    }
  };

  const handleEntryDelete = async (entryId) => {
    if (window.confirm("Tem certeza que deseja remover este atendimento?")) {
      const entryDocRef = doc(db, "labEntries", entryId);
      try {
        await deleteDoc(entryDocRef);
        toast.success("Atendimento removido com sucesso.");
      } catch (error) {
        toast.error("Erro ao remover o atendimento.");
      }
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Controle do Laboratório de Apoio</h1>

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="flex items-center gap-4">
          <label htmlFor="date-filter" className="font-semibold text-gray-700">
            Selecione a Data:
          </label>
          <input id="date-filter" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 border border-gray-300 rounded-lg" />
        </div>
        {userProfile && userProfile.role !== 'financeiro' && (
          <button onClick={() => setIsModalOpen(true)} className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md">
            <PlusCircle size={20} />
            Adicionar Atendimento
          </button>
        )}
      </div>

      <div className="mt-8">
        {loadingEntries ? (<p className="text-center text-gray-500">Carregando atendimentos...</p>) :
        (<LabEntriesTable entries={labEntries} onStatusChange={handleStatusChange} onEntryUpdate={handleEntryUpdate} onEntryDelete={handleEntryDelete} />)}
      </div>

      <AddLabEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddEntry} allStudentsMap={allStudentsMap} />
    </div>
  );
}

export default LabSupportPage;