import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import { useClasses } from "../contexts/ClassContext";
import toast from "react-hot-toast";
import { Users, Pencil, ArrowRightLeft, MessageSquareText, Search } from "lucide-react";
import EditInactiveReasonModal from "../components/EditInactiveReasonModal";
import TransferStudentModal from "../components/TransferStudentModal";
import ObservationModal from "../components/ObservationModal";

// Array de opções de motivo para os filtros e modais
const inactiveReasonOptions = [
  { value: "cancelamento", text: "Inativo por Cancelamento" },
  { value: "trancamento", text: "Inativo por Trancamento" },
  { value: "spc", text: "Inativo por SPC" },
  { value: "mudanca_unidade", text: "Mudança de Unidade" },
];

const InactiveStudentsPage = () => {
  const { classes } = useClasses();
  const [inactiveStudents, setInactiveStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Estados para busca e filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReason, setFilterReason] = useState("todos");

  const [isEditReasonModalOpen, setIsEditReasonModalOpen] = useState(false);
  const [studentToEditReason, setStudentToEditReason] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [studentToObserve, setStudentToObserve] = useState(null);

  useEffect(() => {
    const fetchInactiveStudents = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "inativos"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const studentsList = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setInactiveStudents(studentsList);
      } catch (error) {
        console.error("Erro ao buscar alunos inativos: ", error);
        toast.error("Erro ao buscar alunos inativos.");
      } finally {
        setLoading(false);
      }
    };

    fetchInactiveStudents();
  }, [refetchTrigger]);

  // Lógica de filtragem com useMemo
  const filteredStudents = useMemo(() => {
    return inactiveStudents.filter(student => {
      const reasonText = inactiveReasonOptions.find(opt => opt.value === filterReason)?.text;
      
      if (filterReason !== 'todos' && student.inactiveReason !== reasonText) {
        return false;
      }
      
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const nameMatch = student.name.toLowerCase().includes(term);
        const codeMatch = (student.code || '').toString().toLowerCase().includes(term);
        if (!nameMatch && !codeMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [inactiveStudents, searchTerm, filterReason]);

  const handleOpenEditReasonModal = (student) => {
    setStudentToEditReason(student);
    setIsEditReasonModalOpen(true);
  };
  const handleCloseEditReasonModal = () => {
    setStudentToEditReason(null);
    setIsEditReasonModalOpen(false);
  };

  const handleOpenTransferModal = (student) => {
    setStudentToTransfer(student);
    setIsTransferModalOpen(true);
  };
  const handleCloseTransferModal = () => setIsTransferModalOpen(false);

  const handleOpenObservationModal = (student) => {
    setStudentToObserve(student);
    setIsObservationModalOpen(true);
  };
  const handleCloseObservationModal = () => setIsObservationModalOpen(false);

  const handleUpdateInactiveReason = async (studentId, newReasonValue) => {
    const newReasonText = inactiveReasonOptions.find(opt => opt.value === newReasonValue)?.text || "Inativo";
    const studentDocRef = doc(db, "inativos", studentId);
    try {
      await updateDoc(studentDocRef, { inactiveReason: newReasonText });
      toast.success("Motivo da inativação atualizado!");
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error("Erro ao atualizar o motivo.");
    } finally {
      handleCloseEditReasonModal();
    }
  };

  const handleConfirmTransfer = async (
    studentData,
    sourceClassId,
    targetClassId
  ) => {
    if (!studentData || !targetClassId) {
      toast.error("Dados insuficientes para a transferência.");
      return;
    }
    const studentToReactivate = {
      code: studentData.code,
      name: studentData.name,
      grades: studentData.grades || {},
      observation: studentData.observation || "",
      studentId: studentData.studentId || studentData.id,
    };
    const targetClassRef = doc(db, "classes", targetClassId);
    const inactiveStudentRef = doc(db, "inativos", studentData.id);
    try {
      await updateDoc(targetClassRef, {
        students: arrayUnion(studentToReactivate),
      });
      await deleteDoc(inactiveStudentRef);
      toast.success(`Aluno ${studentData.name} reativado com sucesso!`);
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Erro ao reativar aluno: ", error);
      toast.error("Erro ao reativar o aluno.");
    } finally {
      handleCloseTransferModal();
    }
  };

  const handleSaveObservation = async (studentId, observationText) => {
    const studentDocRef = doc(db, "inativos", studentId);
    try {
      await updateDoc(studentDocRef, { observation: observationText });
      toast.success("Observação salva com sucesso!");
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error("Erro ao salvar a observação.");
    } finally {
      handleCloseObservationModal();
    }
  };

  const getReasonStyle = (reason) => {
    if (reason?.includes("SPC")) return "bg-red-100 text-red-700";
    if (reason?.includes("Trancamento")) return "bg-blue-100 text-blue-700";
    if (reason?.includes("Mudança")) return "bg-purple-100 text-purple-700";
    return "bg-yellow-100 text-yellow-700";
  };
  
  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Carregando alunos inativos...</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Alunos Inativos
        </h1>

        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">Buscar por Matrícula ou Nome</label>
                    <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            id="search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 p-2 border rounded-md" 
                            placeholder="Digite para buscar..."
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="filter" className="block text-sm font-medium text-gray-700">Filtrar por Motivo</label>
                    <select 
                        id="filter"
                        value={filterReason}
                        onChange={e => setFilterReason(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md bg-white"
                    >
                        <option value="todos">Todos os Motivos</option>
                        {inactiveReasonOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.text}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Turma Original
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-600 whitespace-no-wrap font-mono">
                        {student.code || "N/A"}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap font-semibold">
                        {student.name}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${getReasonStyle(student.inactiveReason)}`}>
                        {student.inactiveReason}
                      </span>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {student.movedAt
                          ? new Date(
                              student.movedAt.seconds * 1000
                            ).toLocaleDateString("pt-BR")
                          : "N/A"}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {student.originalClassName || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <div className="flex justify-center items-center gap-4">
                        <button
                          onClick={() => handleOpenObservationModal(student)}
                          className="text-gray-500 hover:text-yellow-600"
                          title="Observações"
                        >
                          <MessageSquareText size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenEditReasonModal(student)}
                          className="text-gray-500 hover:text-blue-600"
                          title="Editar Motivo"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenTransferModal(student)}
                          className="text-gray-500 hover:text-green-600"
                          title="Transferir / Reativar Aluno"
                        >
                          <ArrowRightLeft size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <Users className="mx-auto text-gray-300 mb-4" size={56} />
            <p className="text-gray-500 text-lg">
              {searchTerm || filterReason !== 'todos' ? 'Nenhum aluno encontrado para os filtros aplicados.' : 'Nenhum aluno inativo encontrado.'}
            </p>
          </div>
        )}
      </div>

      <EditInactiveReasonModal
        isOpen={isEditReasonModalOpen}
        onClose={handleCloseEditReasonModal}
        onSave={handleUpdateInactiveReason}
        student={studentToEditReason}
      />

      <TransferStudentModal
        isOpen={isTransferModalOpen}
        onClose={handleCloseTransferModal}
        student={studentToTransfer}
        currentClass={{ id: "inativos", name: "Alunos Inativos" }}
        allClasses={classes}
        onConfirmTransfer={handleConfirmTransfer}
      />

      <ObservationModal
        isOpen={isObservationModalOpen}
        onClose={handleCloseObservationModal}
        onSave={handleSaveObservation}
        student={studentToObserve}
      />
    </>
  );
};

export default InactiveStudentsPage;