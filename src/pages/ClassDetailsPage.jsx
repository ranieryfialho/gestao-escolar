import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useClasses } from "../contexts/ClassContext";
import { useUsers } from "../contexts/UserContext";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import StudentImporter from "../components/StudentImporter";
import Gradebook from "../components/Gradebook";
import TransferStudentModal from "../components/TransferStudentModal";
import SubGradesModal from "../components/SubGradesModal";
import AddStudentModal from "../components/AddStudentModal";
import EditStudentModal from "../components/EditStudentModal";
import ObservationModal from "../components/ObservationModal";
import QrCodeModal from "../components/QrCodeModal";
import MoveToInactiveModal from "../components/MoveToInactiveModal";
import { UserPlus, QrCode, Pencil, Save, X } from "lucide-react";
import toast from "react-hot-toast";

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
    throw new Error(
      result.error?.message || result.error || "Ocorreu um erro no servidor."
    );
  }
  return result.result || result;
};

const showConfirmationToast = (message, onConfirm) => {
  toast(
    (t) => (
      <div className="flex flex-col gap-3 p-2">
        <span className="text-white text-center">{message}</span>
        <div className="flex gap-2">
          <button
            className="w-full bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-700"
            onClick={() => {
              onConfirm();
              toast.dismiss(t.id);
            }}
          >
            Confirmar
          </button>
          <button
            className="w-full bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-lg hover:bg-gray-400"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ),
    { duration: 6000 }
  );
};

function ClassDetailsPage() {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, firebaseUser } = useAuth();
  const { classes, updateClass, deleteClass } = useClasses();
  const { users } = useUsers();

  const [turma, setTurma] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teacherList, setTeacherList] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [whatsappLinkInput, setWhatsappLinkInput] = useState("");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isEditingWhatsappLink, setIsEditingWhatsappLink] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState(null);
  const [isSubGradesModalOpen, setIsSubGradesModalOpen] = useState(false);
  const [selectedGradeData, setSelectedGradeData] = useState({
    student: null,
    module: null,
  });
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [studentToObserve, setStudentToObserve] = useState(null);
  const [isMoveToInactiveModalOpen, setIsMoveToInactiveModalOpen] = useState(false);
  const [studentToMove, setStudentToMove] = useState(null);
  const [editingSubGrades, setEditingSubGrades] = useState({});
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const isUserProfessor =
    userProfile && ["professor", "professor_apoio"].includes(userProfile.role);
  const isUserAdmin =
    userProfile &&
    ["diretor", "coordenador", "admin", "auxiliar_coordenacao"].includes(
      userProfile.role
    );
  const isUserFinancial = userProfile && userProfile.role === "financeiro";
  const canAddStudents =
    userProfile && !["financeiro", "comercial"].includes(userProfile.role);
  const canEditGraduates =
    userProfile &&
    [
      "diretor",
      "coordenador",
      "admin",
      "auxiliar_coordenacao",
      "professor_apoio",
    ].includes(userProfile.role);
  const isGradebookReadOnly = isUserFinancial;
  const canUserEditClass = isUserAdmin;

  const gradeInformatica12meses = [
    {
      id: "ICN",
      title: "ICN - Internet e Computação em Nuvem",
      syllabus: "Carga Horária: 16h, Duração: 2 meses",
    },
    {
      id: "OFFA",
      title: "OFFA - Office Aplicado",
      syllabus: "Carga Horária: 40h, Duração: 5 meses",
      subGrades: [
        "Avaliação de Word",
        "Avaliação de Excel",
        "Avaliação de PowerPoint",
      ],
    },
    {
      id: "ADM",
      title: "ADM - Assistente Administrativo",
      syllabus: "Carga Horária: 48h, Duração: 6 meses",
      subGrades: [
        "Gestão de Pessoas e Pensamento Estratégico",
        "Gestão Financeira",
        "Projeto",
      ],
    },
  ];
  const gradeEspecializacao19meses = [
    ...gradeInformatica12meses,
    {
      id: "PWB",
      title: "PWB - Power Bi",
      syllabus: "Carga Horária: 16h, Duração: 2 meses",
    },
    {
      id: "TRI",
      title: "TRI - Tratamento de Imagem com Photoshop",
      syllabus: "Carga Horária: 16h, Duração: 2 meses",
    },
    {
      id: "CMV",
      title: "CMV - Comunicação Visual com Illustrator",
      syllabus: "Carga Horária: 16h, Duração: 2 meses",
    },
  ];

  const sortStudentsByName = (studentArray) => {
    if (!studentArray) return [];
    return [...studentArray].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
  };

  useEffect(() => {
    const loadClassData = async () => {
      if (turmaId === "concludentes") {
        try {
          if (!firebaseUser) return;
          const token = await firebaseUser.getIdToken();
          const { schoolId } = location.state || {};
          if (!schoolId) {
            toast.error("Escola não selecionada. Voltando...");
            navigate("/boletim");
            return;
          }
          const functionUrl =
            "https://us-central1-boletim-escolar-app.cloudfunctions.net/listGraduates";
          const response = await fetch(functionUrl, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Erro ao buscar concludentes.");
          }
          const allGraduates = result.result.graduates || [];
          const schoolGraduates = allGraduates.filter(
            (g) => g.schoolId === schoolId
          );
          const virtualClass = {
            id: "concludentes",
            name: "Turma de Concludentes",
            students: schoolGraduates,
            modules: gradeEspecializacao19meses,
            isVirtual: true,
          };
          setTurma(virtualClass);
          setNewClassName(virtualClass.name);
          const sortedStudents = sortStudentsByName(virtualClass.students);
          if (studentSearchTerm === "") {
            setFilteredStudents(sortedStudents);
          } else {
            const results = sortedStudents.filter(
              (student) =>
                student.name
                  .toLowerCase()
                  .includes(studentSearchTerm.toLowerCase()) ||
                String(student.code)
                  .toLowerCase()
                  .includes(studentSearchTerm.toLowerCase())
            );
            setFilteredStudents(results);
          }
        } catch (error) {
          console.error("Erro ao carregar turma de concludentes:", error);
          toast.error(error.message);
          navigate("/boletim");
        }
        return;
      }
      const foundTurma = classes.find((c) => c.id === turmaId);
      if (foundTurma) {
        let modulesToApply = [];
        const finalTurmaData = { ...foundTurma };
        if (finalTurmaData.curriculumId) {
          if (finalTurmaData.curriculumId === "grade_19_meses")
            modulesToApply = gradeEspecializacao19meses;
          else if (finalTurmaData.curriculumId === "grade_12_meses")
            modulesToApply = gradeInformatica12meses;
          else modulesToApply = finalTurmaData.modules || [];
        } else {
          const upperCaseName = finalTurmaData.name.toUpperCase();
          if (upperCaseName.includes("ESP"))
            modulesToApply = gradeEspecializacao19meses;
          else if (upperCaseName.includes("INF. E ADM"))
            modulesToApply = gradeInformatica12meses;
          else modulesToApply = finalTurmaData.modules || [];
        }
        finalTurmaData.modules = modulesToApply;
        setTurma(finalTurmaData);
        setNewClassName(finalTurmaData.name);
        setSelectedTeacherId(finalTurmaData.professorId || "");
        setWhatsappLinkInput(finalTurmaData.whatsappLink || "");
        const sortedStudents = sortStudentsByName(finalTurmaData.students);
        if (studentSearchTerm === "") {
          setFilteredStudents(sortedStudents);
        } else {
          const results = sortedStudents.filter(
            (student) =>
              student.name
                .toLowerCase()
                .includes(studentSearchTerm.toLowerCase()) ||
              String(student.code)
                .toLowerCase()
                .includes(studentSearchTerm.toLowerCase())
          );
          setFilteredStudents(results);
        }
      }
    };
    loadClassData();
    const rolesPermitidos = [
      "professor",
      "professor_apoio",
      "coordenador",
      "auxiliar_coordenacao",
      "diretor",
    ];
    const filteredTeachers = users.filter((user) =>
      rolesPermitidos.includes(user.role)
    );
    setTeacherList(filteredTeachers);
  }, [
    turmaId,
    classes,
    users,
    studentSearchTerm,
    firebaseUser,
    navigate,
    refetchTrigger,
    location.state,
  ]);

  const handleApiAction = async (functionName, payload, successCallback) => {
    const toastId = toast.loading("Executando operação...");
    try {
      if (!firebaseUser) {
        throw new Error("Usuário não autenticado.");
      }
      const token = await firebaseUser.getIdToken();
      const result = await callApi(functionName, payload, token);
      toast.success(result.message || "Operação concluída com sucesso!", {
        id: toastId,
      });
      if (successCallback) {
        successCallback();
      }
    } catch (error) {
      console.error(`Erro ao executar a função '${functionName}':`, error);
      toast.error(`Erro: ${error.message}`, { id: toastId });
    }
  };

  const handleSaveWhatsappLink = async () => {
    await updateClass(turma.id, { whatsappLink: whatsappLinkInput });
    toast.success("Link do WhatsApp salvo com sucesso!");
    setIsEditingWhatsappLink(false);
  };

  const handleCancelEditWhatsappLink = () => {
    setWhatsappLinkInput(turma?.whatsappLink || "");
    setIsEditingWhatsappLink(false);
  };

  const handleSaveName = async () => {
    if (newClassName.trim() === "")
      return toast.error("O nome da turma não pode ficar em branco.");
    await updateClass(turma.id, { name: newClassName });
    toast.success("Nome da turma atualizado!");
    setIsEditingName(false);
  };

  const handleTeacherChange = async (e) => {
    const newTeacherId = e.target.value;
    const selectedTeacher = teacherList.find((t) => t.id === newTeacherId);
    if (selectedTeacher) {
      await updateClass(turma.id, {
        professorId: selectedTeacher.id,
        professorName: selectedTeacher.name,
      });
      toast.success("Professor responsável atualizado!");
      setSelectedTeacherId(newTeacherId);
    }
  };

  const handleDeleteClass = async () => {
    showConfirmationToast(
      "Apagar esta turma? Esta ação é irreversível.",
      async () => {
        await deleteClass(turma.id);
        navigate("/dashboard");
        toast.success("Turma apagada com sucesso!");
      }
    );
  };

  const handleRemoveModule = async (moduleIdToRemove) => {
    showConfirmationToast(
      "Remover este módulo da grade da turma?",
      async () => {
        const updatedModules = turma.modules.filter(
          (module) => module.id !== moduleIdToRemove
        );
        await updateClass(turma.id, { modules: updatedModules });
        toast.success("Módulo removido com sucesso!");
      }
    );
  };

  const handleStudentsImported = async (importedStudents) => {
    if (!importedStudents || importedStudents.length === 0) {
      toast.error("Nenhum aluno válido encontrado no arquivo.");
      return;
    }
    await handleApiAction(
      "importStudentsBatch",
      { classId: turma.id, studentsToImport: importedStudents },
      () => setRefetchTrigger((prev) => prev + 1)
    );
  };

  const handleSaveGrades = async (newGrades, newCertificateStatuses, newReleaseChecklist) => {
    if (!turma || !turma.students) {
      console.log("⚠️ Turma ou alunos não carregados");
      return;
    }
    
    console.log("🔍 Iniciando handleSaveGrades...");
    
    if (turma.isVirtual) {
      const changedStudents = turma.students
        .map((student) => {
          const studentId = student.studentId || student.id;
          
          // 🔍 COMPARAÇÕES ROBUSTAS
          const studentCurrentGrades = student.grades || {};
          const studentNewGrades = newGrades[studentId] || {};
          
          // Verifica se há notas diferentes
          const hasGradeChanged = Object.keys(studentNewGrades).some(moduleId => {
            const currentValue = studentCurrentGrades[moduleId];
            const newValue = studentNewGrades[moduleId];
            
            // Comparação considerando objetos e valores simples
            if (typeof newValue === 'object' && typeof currentValue === 'object') {
              return JSON.stringify(newValue) !== JSON.stringify(currentValue);
            }
            
            // Normaliza valores para comparação (0.0, 0, "0.0" devem ser iguais)
            const normalizedCurrent = currentValue ? parseFloat(currentValue) : null;
            const normalizedNew = newValue ? parseFloat(newValue) : null;
            
            return normalizedCurrent !== normalizedNew;
          });
          
          const currentCertStatus = student.certificateStatus || "nao_impresso";
          const newCertStatus = newCertificateStatuses[studentId];
          const hasCertChanged = newCertStatus && newCertStatus !== currentCertStatus;
          
          const currentChecklist = student.releaseChecklist || { 
            pagamento: false, 
            notas: false, 
            frequencia: false 
          };
          const newChecklist = newReleaseChecklist ? newReleaseChecklist[studentId] : null;
          const hasChecklistChanged = newChecklist && (
            currentChecklist.pagamento !== newChecklist.pagamento ||
            currentChecklist.notas !== newChecklist.notas ||
            currentChecklist.frequencia !== newChecklist.frequencia
          );
          
          // ✅ SÓ RETORNA SE HOUVER MUDANÇA REAL
          if (!hasGradeChanged && !hasCertChanged && !hasChecklistChanged) {
            return null;
          }
          
          const updatedStudent = {
            ...student,
            grades: hasGradeChanged ? { ...studentCurrentGrades, ...studentNewGrades } : studentCurrentGrades,
            certificateStatus: hasCertChanged ? newCertStatus : currentCertStatus,
            releaseChecklist: hasChecklistChanged ? newChecklist : currentChecklist,
          };
          
          console.log("✏️ Aluno com alterações:", student.name, {
            hasGradeChanged,
            hasCertChanged,
            hasChecklistChanged,
            data: {
              certificateStatus: updatedStudent.certificateStatus,
              releaseChecklist: updatedStudent.releaseChecklist,
            }
          });
          
          return updatedStudent;
        })
        .filter(Boolean); // Remove nulls
      
      // ⛔ CANCELA SE NÃO HÁ MUDANÇAS
      if (changedStudents.length === 0) {
        console.log("✅ Nenhuma alteração detectada - salvamento cancelado");
        return; // NÃO FAZ NADA!
      }
      
      console.log("📊 Total de alunos com alterações:", changedStudents.length);
      
      await handleApiAction(
        "updateGraduatesBatch",
        { updatedStudents: changedStudents },
        () => {
          console.log("✅ Salvamento concluído com sucesso");
          setRefetchTrigger((prev) => prev + 1);
        }
      );
    } else {
      // PARA TURMAS NORMAIS
      let hasAnyChange = false;
      
      const allUpdatedStudents = turma.students.map((s) => {
        const studentId = s.studentId || s.id;
        const currentGrades = s.grades || {};
        const newStudentGrades = newGrades[studentId] || {};
        
        // Verifica se há mudanças reais nas notas
        const gradeChanged = Object.keys(newStudentGrades).some(moduleId => {
          const currentValue = currentGrades[moduleId];
          const newValue = newStudentGrades[moduleId];
          
          // Comparação considerando objetos
          if (typeof newValue === 'object' && typeof currentValue === 'object') {
            return JSON.stringify(newValue) !== JSON.stringify(currentValue);
          }
          
          const normalizedCurrent = currentValue ? parseFloat(currentValue) : null;
          const normalizedNew = newValue ? parseFloat(newValue) : null;
          
          return normalizedCurrent !== normalizedNew;
        });
        
        if (gradeChanged) {
          hasAnyChange = true;
          return {
            ...s,
            grades: { ...currentGrades, ...newStudentGrades }
          };
        }
        
        return s;
      });
      
      // ⛔ CANCELA SE NÃO HÁ MUDANÇAS
      if (!hasAnyChange) {
        console.log("✅ Nenhuma alteração detectada - salvamento cancelado");
        return;
      }
      
      await updateClass(turma.id, { students: allUpdatedStudents });
      toast.success("Notas salvas com sucesso!");
    }
  };

  const handleOpenTransferModal = (student) => {
    setStudentToTransfer(student);
    setIsTransferModalOpen(true);
  };
  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false);
    setStudentToTransfer(null);
  };

  const handleConfirmTransfer = async (
    studentData,
    sourceClassId,
    targetClassId
  ) => {
    await handleApiAction(
      "transferStudent",
      { studentData, sourceClassId, targetClassId },
      () => {
        handleCloseTransferModal();
        setRefetchTrigger((prev) => prev + 1);
      }
    );
  };

  const handleOpenSubGradesModal = (student, module) => {
    setSelectedGradeData({ student, module });
    const currentGrades = student.grades?.[module.id];
    setEditingSubGrades(currentGrades?.subGrades || {});
    setIsSubGradesModalOpen(true);
  };
  const handleCloseSubGradesModal = () => {
    setIsSubGradesModalOpen(false);
    setSelectedGradeData({ student: null, module: null });
    setEditingSubGrades({});
  };
  const handleEditingSubGradeChange = (subGradeName, value) => {
    const sanitizedValue = value.replace(/[^0-9,.]/g, "").replace(",", ".");
    if (Number.parseFloat(sanitizedValue) > 10 || sanitizedValue.length > 4)
      return;
    setEditingSubGrades((prev) => ({
      ...prev,
      [subGradeName]: sanitizedValue,
    }));
  };
  const handleSaveSubGrades = async () => {
    const { student, module } = selectedGradeData;
    if (!student || !module) return;
    const uniqueStudentId = student.studentId || student.id;
    const gradesAsNumbers = Object.values(editingSubGrades)
      .map((g) => Number.parseFloat(String(g).replace(",", ".")))
      .filter((g) => !isNaN(g));
    const average =
      gradesAsNumbers.length > 0
        ? gradesAsNumbers.reduce((a, b) => a + b, 0) / gradesAsNumbers.length
        : 0;
    const updatedGradeObject = {
      finalGrade: average.toFixed(1),
      subGrades: editingSubGrades,
    };
    const currentStudentInClass = turma.students.find(
      (s) => (s.studentId || s.id) === uniqueStudentId
    );
    const currentStudentGrades = currentStudentInClass?.grades || {};
    const updatedGradesForStudent = {
      ...currentStudentGrades,
      [module.id]: updatedGradeObject,
    };
    const updatedStudents = turma.students.map((s) =>
      (s.studentId || s.id) === uniqueStudentId
        ? { ...s, grades: updatedGradesForStudent }
        : s
    );
    if (turma.isVirtual) {
      await handleApiAction("updateGraduatesBatch", { updatedStudents }, () =>
        setRefetchTrigger((prev) => prev + 1)
      );
    } else {
      await updateClass(turma.id, { students: updatedStudents });
    }
    toast.success("Notas do módulo salvas com sucesso!");
    handleCloseSubGradesModal();
  };

  const handleOpenAddStudentModal = () => setIsAddStudentModalOpen(true);
  const handleCloseAddStudentModal = () => setIsAddStudentModalOpen(false);
  const handleAddStudent = async (newStudentData) => {
    await handleApiAction(
      "addStudentToClass",
      {
        classId: turma.id,
        studentCode: newStudentData.code,
        studentName: newStudentData.name,
      },
      () => {
        handleCloseAddStudentModal();
        setRefetchTrigger((prev) => prev + 1);
      }
    );
  };

  const handleOpenEditStudentModal = (student) => {
    setStudentToEdit(student);
    setIsEditStudentModalOpen(true);
  };
  const handleCloseEditStudentModal = () => {
    setIsEditStudentModalOpen(false);
    setStudentToEdit(null);
  };
  const handleUpdateStudent = async (updatedStudentData) => {
    if (!turma) return;
    const { id, name } = updatedStudentData;
    const updatedStudents = turma.students.map((student) => {
      if ((student.studentId || student.id) === id) {
        return { ...student, name: name };
      }
      return student;
    });
    try {
      if (turma.isVirtual) {
        await handleApiAction(
          "updateGraduatesBatch",
          {
            updatedStudents: updatedStudents.filter(
              (s) => (s.studentId || s.id) === id
            ),
          },
          () => setRefetchTrigger((prev) => prev + 1)
        );
      } else {
        await updateClass(turma.id, { students: updatedStudents });
      }
      toast.success("Nome do aluno atualizado com sucesso!");
      handleCloseEditStudentModal();
    } catch (error) {
      toast.error("Erro ao atualizar dados do aluno.");
      console.error(error);
    }
  };

  const handleDeleteStudent = (studentId) => {
    if (!turma || !turma.students) return;
    const student = turma.students.find(
      (s) => (s.studentId || s.id) === studentId
    );
    if (student) {
      setStudentToMove(student);
      setIsMoveToInactiveModalOpen(true);
    } else {
      toast.error("Aluno não encontrado para mover.");
    }
  };

  const handleConfirmMoveToInactive = async (reason) => {
    if (!studentToMove) return;
    const toastId = toast.loading("Movendo aluno para inativos...");
    try {
      let inactiveReason = "Inativo";
      if (reason === "cancelamento")
        inactiveReason = "Inativo por Cancelamento";
      else if (reason === "spc") inactiveReason = "Inativo por SPC";
      else if (reason === "trancamento")
        inactiveReason = "Inativo por Trancamento";
      else if (reason === "mudanca_unidade")
        inactiveReason = "Mudança de Unidade";

      await addDoc(collection(db, "inativos"), {
        ...studentToMove,
        inactiveReason,
        movedAt: new Date(),
        originalClassId: turma.id,
        originalClassName: turma.name,
      });

      const updatedStudents = turma.students.filter(
        (s) =>
          (s.studentId || s.id) !==
          (studentToMove.studentId || studentToMove.id)
      );
      await updateClass(turma.id, { students: updatedStudents });

      toast.success(`Aluno movido para ${inactiveReason} com sucesso!`, {
        id: toastId,
      });
      setRefetchTrigger((p) => p + 1);
    } catch (error) {
      console.error("Erro ao mover aluno para inativos: ", error);
      toast.error("Erro ao mover aluno. Tente novamente.", { id: toastId });
    } finally {
      setIsMoveToInactiveModalOpen(false);
      setStudentToMove(null);
    }
  };

  const handleOpenObservationModal = (student) => {
    setStudentToObserve(student);
    setIsObservationModalOpen(true);
  };
  const handleCloseObservationModal = () => {
    setIsObservationModalOpen(false);
    setStudentToObserve(null);
  };

  const handleSaveObservation = async (observationText) => {
    if (!turma || !studentToObserve) {
      toast.error("Nenhum aluno selecionado para salvar observação.");
      return;
    }

    const studentId = studentToObserve.studentId || studentToObserve.id;

    const studentToUpdate = turma.students.find(
      (s) => (s.studentId || s.id) === studentId
    );

    if (!studentToUpdate) {
      toast.error("Aluno não encontrado para salvar a observação.");
      return;
    }

    const studentPayload = { ...studentToUpdate, observation: observationText };

    try {
      if (turma.isVirtual) {
        await handleApiAction("updateGraduatesBatch", {
          updatedStudents: [studentPayload],
        });
        toast.success("Observação salva com sucesso!");
      } else {
        const updatedStudents = turma.students.map((student) =>
          (student.studentId || student.id) === studentId
            ? { ...student, observation: observationText }
            : student
        );
        await updateClass(turma.id, { students: updatedStudents });
        toast.success("Observação salva com sucesso!");
      }
      
      handleCloseObservationModal();
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error("Erro ao salvar observação.");
      console.error(error);
    }
  };

  if (!turma) return <div className="p-8">Carregando turma...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/boletim" className="text-blue-600 hover:underline mb-6 block text-lg">
          &larr; Voltar para o Boletim
        </Link>
        
        <div className="bg-white p-8 rounded-xl shadow-md mb-8">
          {!isEditingName ? (
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold text-gray-800">{turma.name}</h1>
              {canUserEditClass && !turma.isVirtual && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-base text-blue-600 font-semibold hover:text-blue-700"
                >
                  Editar
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="text-4xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none flex-grow"
              />
              <button
                onClick={handleSaveName}
                className="bg-green-500 text-white px-5 py-2 rounded-lg text-base hover:bg-green-600"
              >
                Salvar
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="text-base text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          )}
          {canUserEditClass && !turma.isVirtual ? (
            <div className="mt-6">
              <label
                htmlFor="teacher-select"
                className="block text-base font-medium text-gray-700 mb-2"
              >
                Professor(a) Responsável:
              </label>
              <select
                id="teacher-select"
                value={selectedTeacherId}
                onChange={handleTeacherChange}
                className="block w-full md:w-1/2 p-3 text-base border rounded-lg"
              >
                <option value="" disabled>
                  Selecione um professor
                </option>
                {teacherList.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            !turma.isVirtual && (
              <p className="text-lg text-gray-600 mt-3">
                Professor(a) Responsável: {turma.professorName || "A definir"}
              </p>
            )
          )}
          {!turma.isVirtual && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">
                Grupo do WhatsApp
              </h3>
              {isEditingWhatsappLink && canUserEditClass ? (
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <input
                    type="url"
                    placeholder="Cole aqui o link do grupo"
                    value={whatsappLinkInput}
                    onChange={(e) => setWhatsappLinkInput(e.target.value)}
                    className="flex-grow p-3 text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveWhatsappLink}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition"
                  >
                    <Save size={20} />
                    Salvar
                  </button>
                  <button
                    onClick={handleCancelEditWhatsappLink}
                    className="flex items-center justify-center gap-2 bg-gray-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-600 transition"
                  >
                    <X size={20} />
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-grow bg-gray-100 p-3 rounded-lg text-gray-700 truncate text-base">
                    {turma.whatsappLink ? (
                      <a
                        href={turma.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {turma.whatsappLink}
                      </a>
                    ) : (
                      <span className="text-gray-400">
                        Nenhum link cadastrado.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {canUserEditClass && (
                      <button
                        onClick={() => setIsEditingWhatsappLink(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                      >
                        <Pencil size={18} />
                        {turma.whatsappLink ? "Editar" : "Adicionar"}
                      </button>
                    )}
                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      disabled={!turma.whatsappLink}
                      className="flex items-center justify-center gap-2 bg-gray-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      title="Exibir QR Code"
                    >
                      <QrCode size={20} />
                      <span>QR Code</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-12">
          <div className="flex flex-col gap-6 mb-6">
            <h2 className="text-3xl font-semibold text-gray-800">Alunos e Notas</h2>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <input
                type="text"
                placeholder="Buscar por nome ou código do aluno..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="flex-1 p-5 text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {canAddStudents && !turma.isVirtual && (
                <button
                  onClick={handleOpenAddStudentModal}
                  className="flex items-center justify-center gap-3 bg-blue-600 text-white font-bold px-8 py-5 rounded-xl hover:bg-blue-700 transition shadow-md whitespace-nowrap text-lg"
                >
                  <UserPlus size={22} />
                  <span>Adicionar Aluno</span>
                </button>
              )}
            </div>
          </div>

          {canAddStudents && !turma.isVirtual && (
            <div className="my-6">
              <StudentImporter onStudentsImported={handleStudentsImported} />
            </div>
          )}

          <Gradebook
            students={filteredStudents}
            modules={turma.modules || []}
            onSaveGrades={handleSaveGrades}
            onTransferClick={handleOpenTransferModal}
            onEditClick={handleOpenEditStudentModal}
            onDeleteClick={handleDeleteStudent}
            onObservationClick={handleOpenObservationModal}
            isUserAdmin={canUserEditClass}
            isUserProfessor={isUserProfessor}
            isVirtual={turma.isVirtual}
            isReadOnly={
              isGradebookReadOnly || (turma.isVirtual && !canEditGraduates)
            }
            onOpenSubGradesModal={handleOpenSubGradesModal}
          />
        </div>

        {!turma.isVirtual && (
          <div className="mt-12">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Módulos e Ementas da Turma</h2>
            <div className="space-y-4">
              {turma.modules && turma.modules.length > 0 ? (
                turma.modules.map((module) => (
                  <div
                    key={module.id}
                    className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-start"
                  >
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">{module.title}</h3>
                      <p className="text-gray-700 mt-2 text-base">{module.syllabus}</p>
                    </div>
                    {canUserEditClass && (
                      <button
                        onClick={() => handleRemoveModule(module.id)}
                        className="text-red-500 hover:text-red-700 font-semibold ml-4 flex-shrink-0 text-base"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 bg-white p-6 rounded-xl shadow-sm text-base">
                  Nenhum módulo cadastrado para esta turma.
                </p>
              )}
            </div>
          </div>
        )}

        {isUserAdmin && !turma.isVirtual && (
          <div className="mt-12 border-t-2 border-red-200 pt-8">
            <h2 className="text-2xl font-semibold text-red-700 mb-4">Zona de Perigo</h2>
            <div className="bg-red-50 p-8 rounded-xl shadow-inner">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">Apagar esta Turma</h3>
                  <p className="text-base text-red-800 mt-2 max-w-2xl">
                    Uma vez que a turma for apagada, todos os seus dados serão
                    permanentemente perdidos. Esta ação não pode ser desfeita.
                  </p>
                </div>
                <button
                  onClick={handleDeleteClass}
                  className="bg-red-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto mt-4 sm:mt-0 text-base"
                >
                  Apagar Turma
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        link={turma?.whatsappLink}
        className={turma?.name}
      />
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={handleCloseAddStudentModal}
        onSave={handleAddStudent}
      />
      <EditStudentModal
        isOpen={isEditStudentModalOpen}
        onClose={handleCloseEditStudentModal}
        onSave={handleUpdateStudent}
        studentToEdit={studentToEdit}
      />
      <TransferStudentModal
        isOpen={isTransferModalOpen}
        onClose={handleCloseTransferModal}
        student={studentToTransfer}
        currentClass={turma}
        allClasses={classes}
        onConfirmTransfer={handleConfirmTransfer}
      />
      <SubGradesModal
        isOpen={isSubGradesModalOpen}
        onClose={handleCloseSubGradesModal}
        module={selectedGradeData.module}
        student={selectedGradeData.student}
        gradesToDisplay={editingSubGrades}
        onGradeChange={handleEditingSubGradeChange}
        onSave={handleSaveSubGrades}
      />
      <ObservationModal
        isOpen={isObservationModalOpen}
        onClose={handleCloseObservationModal}
        onSave={handleSaveObservation}
        student={studentToObserve}
      />
      <MoveToInactiveModal
        isOpen={isMoveToInactiveModalOpen}
        onClose={() => setIsMoveToInactiveModalOpen(false)}
        onConfirm={handleConfirmMoveToInactive}
      />
    </div>
  );
}

export default ClassDetailsPage;