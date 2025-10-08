// src/pages/InactiveStudentsPage.jsx

import React, { useState, useEffect } from "react";
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

// Ícones e Modais
import { Users, Pencil, ArrowRightLeft, MessageSquareText } from "lucide-react";
import EditInactiveReasonModal from "../components/EditInactiveReasonModal"; // ### NOVO MODAL
import TransferStudentModal from "../components/TransferStudentModal";
import ObservationModal from "../components/ObservationModal";

const InactiveStudentsPage = () => {
  const { classes } = useClasses();
  const [inactiveStudents, setInactiveStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // ### ESTADOS ATUALIZADOS ###
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

  // ### NOVOS HANDLERS PARA O MODAL DE EDIÇÃO DE MOTIVO ###
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

  // ### NOVA FUNÇÃO PARA ATUALIZAR O MOTIVO ###
  const handleUpdateInactiveReason = async (studentId, newReasonValue) => {
    let newReasonText = "Inativo";
    if (newReasonValue === "cancelamento")
      newReasonText = "Inativo por Cancelamento";
    else if (newReasonValue === "trancamento")
      newReasonText = "Inativo por Trancamento";
    else if (newReasonValue === "spc") newReasonText = "Inativo por SPC";

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

        {inactiveStudents.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full leading-normal">
              {/* ... thead ... */}
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
                {inactiveStudents.map((student) => (
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
                      <span
                        className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${
                          student.inactiveReason === "Inativo por SPC"
                            ? "bg-red-100 text-red-700"
                            : student.inactiveReason ===
                              "Inativo por Trancamento"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
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
                        {/* ### BOTÃO DE EDITAR ATUALIZADO ### */}
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
              Nenhum aluno inativo encontrado.
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