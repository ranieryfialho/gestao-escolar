import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useClasses } from "../contexts/ClassContext"
import { useUsers } from "../contexts/UserContext"
import StudentImporter from "../components/StudentImporter"
import Gradebook from "../components/Gradebook"
import TransferStudentModal from "../components/TransferStudentModal"
import SubGradesModal from "../components/SubGradesModal"
import AddStudentModal from "../components/AddStudentModal"
import EditStudentModal from "../components/EditStudentModal"
import ObservationModal from "../components/ObservationModal"
import { UserPlus } from "lucide-react"
import toast from "react-hot-toast"

const callApi = async (functionName, payload, token) => {
  const functionUrl = `https://us-central1-boletim-escolar-app.cloudfunctions.net/${functionName}`
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: payload }),
  })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error?.message || result.error || "Ocorreu um erro no servidor.")
  }
  return result.result || result
}

const showConfirmationToast = (message, onConfirm) => {
  toast(
    (t) => (
      <div className="flex flex-col gap-3 p-2">
        <span className="text-white text-center">{message}</span>
        <div className="flex gap-2">
          <button
            className="w-full bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-700"
            onClick={() => {
              onConfirm()
              toast.dismiss(t.id)
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
    { duration: 6000 },
  )
}

function ClassDetailsPage() {
  const { turmaId } = useParams()
  const navigate = useNavigate()
  const { userProfile, firebaseUser } = useAuth()
  const { classes, updateClass, deleteClass } = useClasses()
  const { users } = useUsers()

  const [turma, setTurma] = useState(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState("")
  const [teacherList, setTeacherList] = useState([])
  const [studentSearchTerm, setStudentSearchTerm] = useState("")
  const [filteredStudents, setFilteredStudents] = useState([])

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [studentToTransfer, setStudentToTransfer] = useState(null)
  const [isSubGradesModalOpen, setIsSubGradesModalOpen] = useState(false)
  const [selectedGradeData, setSelectedGradeData] = useState({ student: null, module: null })
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState(null)
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false)
  const [studentToObserve, setStudentToObserve] = useState(null)

  const [editingSubGrades, setEditingSubGrades] = useState({})

  const isUserProfessor = userProfile && ["professor", "professor_apoio"].includes(userProfile.role)
  const isUserAdmin = userProfile && ["diretor", "coordenador", "admin", "auxiliar_coordenacao"].includes(userProfile.role);
  const isUserFinancial = userProfile && userProfile.role === "financeiro"
  const isGradebookReadOnly = isUserFinancial
  const canUserEditClass = isUserAdmin

  const gradeInformatica12meses = [
    {
      id: 'ICN',
      title: 'ICN - Internet e Computação em Nuvem',
      syllabus: 'Carga Horária: 16h, Duração: 2 meses'
    },
    {
      id: 'OFFA',
      title: 'OFFA - Office Aplicado',
      syllabus: 'Carga Horária: 40h, Duração: 5 meses',
      subGrades: ['Avaliação de Word', 'Avaliação de Excel', 'Avaliação de PowerPoint']
    },
    {
      id: 'ADM',
      title: 'ADM - Assistente Administrativo',
      syllabus: 'Carga Horária: 48h, Duração: 6 meses',
      subGrades: ['Gestão de Pessoas e Pensamento Estratégico', 'Gestão Financeira', 'Projeto']
    },
  ];

  const gradeEspecializacao19meses = [
    ...gradeInformatica12meses,
    {
      id: 'PWB',
      title: 'PWB - Power Bi',
      syllabus: 'Carga Horária: 16h, Duração: 2 meses'
    },
    {
      id: 'TRI',
      title: 'TRI - Tratamento de Imagem com Photoshop',
      syllabus: 'Carga Horária: 16h, Duração: 2 meses'
    },
    {
      id: 'CMV',
      title: 'CMV - Comunicação Visual com Illustrator',
      syllabus: 'Carga Horária: 16h, Duração: 2 meses'
    },
  ];

  useEffect(() => {
    const foundTurma = classes.find((c) => c.id === turmaId);

    if (foundTurma) {
      let modulesToApply = [];
      const finalTurmaData = { ...foundTurma };

      if (finalTurmaData.curriculumId) {
        if (finalTurmaData.curriculumId === 'grade_19_meses') {
          modulesToApply = gradeEspecializacao19meses;
        } else if (finalTurmaData.curriculumId === 'grade_12_meses') {
          modulesToApply = gradeInformatica12meses;
        } else {
          modulesToApply = finalTurmaData.modules || [];
        }
      }
      else {
        const upperCaseName = finalTurmaData.name.toUpperCase();
        if (upperCaseName.includes("ESP")) {
          modulesToApply = gradeEspecializacao19meses;
        } else if (upperCaseName.includes("INF. E ADM")) {
          modulesToApply = gradeInformatica12meses;
        } else {
          modulesToApply = finalTurmaData.modules || [];
        }
      }

      finalTurmaData.modules = modulesToApply;

      setTurma(finalTurmaData);

      setNewClassName(finalTurmaData.name);
      setSelectedTeacherId(finalTurmaData.professorId || "");

      const students = finalTurmaData.students || [];
      if (studentSearchTerm === "") {
        setFilteredStudents(students);
      } else {
        const results = students.filter(
          (student) =>
            student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
            student.code.toString().toLowerCase().includes(studentSearchTerm.toLowerCase()),
        );
        setFilteredStudents(results);
      }
    }

    const rolesPermitidos = ["professor", "professor_apoio", "coordenador", "auxiliar_coordenacao", "diretor"];
    const filteredTeachers = users.filter((user) => rolesPermitidos.includes(user.role));
    setTeacherList(filteredTeachers);

  }, [turmaId, classes, users, studentSearchTerm]);

  const handleApiAction = async (action, payload, successCallback) => {
    try {
      if (!firebaseUser) throw new Error("Usuário não autenticado.")
      const token = await firebaseUser.getIdToken()

      const promise = callApi(action, payload, token)

      await toast.promise(promise, {
        loading: "Processando...",
        success: (result) => {
          if (successCallback) successCallback()
          return result.message || "Operação realizada com sucesso!"
        },
        error: (err) => err.message || "Ocorreu um erro inesperado.",
      })
    } catch (error) {
      console.error(`Erro ao executar ${action}:`, error)
      toast.error(`Erro: ${error.message}`)
    }
  }

  const handleSaveName = async () => {
    if (newClassName.trim() === "") return toast.error("O nome da turma não pode ficar em branco.")
    await updateClass(turma.id, { name: newClassName })
    toast.success("Nome da turma atualizado!")
    setIsEditingName(false)
  }

  const handleTeacherChange = async (e) => {
    const newTeacherId = e.target.value
    const selectedTeacher = teacherList.find((t) => t.id === newTeacherId)
    if (selectedTeacher) {
      await updateClass(turma.id, {
        professorId: selectedTeacher.id,
        professorName: selectedTeacher.name,
      })
      toast.success("Professor responsável atualizado!")
      setSelectedTeacherId(newTeacherId)
    }
  }

  const handleDeleteClass = async () => {
    showConfirmationToast("Apagar esta turma? Esta ação é irreversível.", async () => {
      await deleteClass(turma.id)
      navigate("/dashboard")
      toast.success("Turma apagada com sucesso!")
    })
  }

  const handleRemoveModule = async (moduleIdToRemove) => {
    showConfirmationToast("Remover este módulo da grade da turma?", async () => {
      const updatedModules = turma.modules.filter((module) => module.id !== moduleIdToRemove)
      await updateClass(turma.id, { modules: updatedModules })
      toast.success("Módulo removido com sucesso!")
    })
  }

  const handleStudentsImported = async (importedStudents) => {
    if (!importedStudents || importedStudents.length === 0) {
      toast.error("Nenhum aluno válido encontrado no arquivo.")
      return
    }

    await handleApiAction("importStudentsBatch", {
      classId: turma.id,
      studentsToImport: importedStudents,
    })
  }

  const handleSaveGrades = async (newGrades) => {
    if (!turma || !turma.students) return
    const updatedStudents = turma.students.map((s) => ({
      ...s,
      grades: { ...s.grades, ...newGrades[s.studentId || s.id] },
    }))
    await updateClass(turma.id, { students: updatedStudents })
    toast.success("Notas salvas com sucesso!")
  }

  const handleOpenTransferModal = (student) => {
    setStudentToTransfer(student)
    setIsTransferModalOpen(true)
  }

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false)
    setStudentToTransfer(null)
  }

  const handleConfirmTransfer = async (studentData, sourceClassId, targetClassId) => {
    await handleApiAction("transferStudent", { studentData, sourceClassId, targetClassId }, () =>
      handleCloseTransferModal(),
    )
  }

  const handleOpenSubGradesModal = (student, module) => {
    setSelectedGradeData({ student, module })
    const currentGrades = student.grades?.[module.id]
    setEditingSubGrades(currentGrades?.subGrades || {})
    setIsSubGradesModalOpen(true)
  }

  const handleCloseSubGradesModal = () => {
    setIsSubGradesModalOpen(false)
    setSelectedGradeData({ student: null, module: null })
    setEditingSubGrades({})
  }

  const handleEditingSubGradeChange = (subGradeName, value) => {
    const sanitizedValue = value.replace(/[^0-9,.]/g, "").replace(",", ".")
    if (Number.parseFloat(sanitizedValue) > 10 || sanitizedValue.length > 4) return
    setEditingSubGrades((prev) => ({ ...prev, [subGradeName]: sanitizedValue }))
  }

  const handleSaveSubGrades = async () => {
    const { student, module } = selectedGradeData
    if (!student || !module) return

    const uniqueStudentId = student.studentId || student.id

    const gradesAsNumbers = Object.values(editingSubGrades)
      .map((g) => Number.parseFloat(String(g).replace(",", ".")))
      .filter((g) => !isNaN(g))
    const average = gradesAsNumbers.length > 0 ? gradesAsNumbers.reduce((a, b) => a + b, 0) / gradesAsNumbers.length : 0

    const updatedGradeObject = {
      finalGrade: average.toFixed(1),
      subGrades: editingSubGrades,
    }

    const currentStudentInClass = turma.students.find((s) => (s.studentId || s.id) === uniqueStudentId)
    const currentStudentGrades = currentStudentInClass?.grades || {}

    const updatedGradesForStudent = {
      ...currentStudentGrades,
      [module.id]: updatedGradeObject,
    }

    const updatedStudents = turma.students.map((s) =>
      (s.studentId || s.id) === uniqueStudentId ? { ...s, grades: updatedGradesForStudent } : s,
    )

    await updateClass(turma.id, { students: updatedStudents })
    toast.success("Notas do módulo salvas com sucesso!")
    handleCloseSubGradesModal()
  }

  const handleOpenAddStudentModal = () => setIsAddStudentModalOpen(true)
  const handleCloseAddStudentModal = () => setIsAddStudentModalOpen(false)

  const handleAddStudent = async (newStudentData) => {
    await handleApiAction(
      "addStudentToClass",
      {
        classId: turma.id,
        studentCode: newStudentData.code,
        studentName: newStudentData.name,
      },
      () => handleCloseAddStudentModal(),
    )
  }

  const handleOpenEditStudentModal = (student) => {
    setStudentToEdit(student)
    setIsEditStudentModalOpen(true)
  }

  const handleCloseEditStudentModal = () => {
    setIsEditStudentModalOpen(false)
    setStudentToEdit(null)
  }

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
      await updateClass(turma.id, { students: updatedStudents });
      toast.success("Nome do aluno atualizado com sucesso!");
      handleCloseEditStudentModal();
    } catch (error) {
      toast.error("Erro ao atualizar dados do aluno.");
      console.error(error);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!turma || !turma.students) return
    const studentNameToDelete = turma.students.find((s) => (s.studentId || s.id) === studentId)?.name || "este aluno"

    showConfirmationToast(`Remover "${studentNameToDelete}" da turma?`, async () => {
      const updatedStudents = turma.students.filter((student) => (student.studentId || student.id) !== studentId)
      await updateClass(turma.id, { students: updatedStudents })
      toast.success("Aluno removido com sucesso.")
    })
  }

  const handleOpenObservationModal = (student) => {
    setStudentToObserve(student)
    setIsObservationModalOpen(true)
  }

  const handleCloseObservationModal = () => {
    setIsObservationModalOpen(false)
    setStudentToObserve(null)
  }

  const handleSaveObservation = async (studentId, observationText) => {
    if (!turma) return

    const updatedStudents = turma.students.map((student) => {
      if ((student.studentId || student.id) === studentId) {
        return { ...student, observation: observationText }
      }
      return student
    })

    try {
      await updateClass(turma.id, { students: updatedStudents })
      toast.success("Observação salva com sucesso!")
      handleCloseObservationModal()
    } catch (error) {
      toast.error("Erro ao salvar observação.")
      console.error(error)
    }
  }

  if (!turma) return <div className="p-8">A carregar turma...</div>

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 hover:underline mb-6 block">
        &larr; Voltar para o Dashboard
      </Link>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {!isEditingName ? (
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">{turma.name}</h1>
            {canUserEditClass && (
              <button onClick={() => setIsEditingName(true)} className="text-sm text-blue-600 font-semibold">
                Editar
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="text-3xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none flex-grow"
            />
            <button onClick={handleSaveName} className="bg-green-500 text-white px-3 py-1 rounded">
              Salvar
            </button>
            <button onClick={() => setIsEditingName(false)} className="text-sm text-gray-500">
              Cancelar
            </button>
          </div>
        )}
        {canUserEditClass ? (
          <div className="mt-4">
            <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700">
              Professor(a) Responsável:
            </label>
            <select
              id="teacher-select"
              value={selectedTeacherId}
              onChange={handleTeacherChange}
              className="mt-1 block w-full md:w-1/2 p-2 border rounded-md"
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
          <p className="text-md text-gray-600 mt-2">Professor(a) Responsável: {turma.professorName || "A definir"}</p>
        )}
      </div>

      <div className="mt-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-semibold">Alunos e Notas</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Buscar por nome ou código do aluno..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="w-full md:w-auto p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            />

            {canUserEditClass && (
              <button
                onClick={handleOpenAddStudentModal}
                className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                <UserPlus size={18} />
                <span>Adicionar</span>
              </button>
            )}
          </div>
        </div>

        {canUserEditClass && (
          <div className="my-4">
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
          isReadOnly={isGradebookReadOnly}
          onOpenSubGradesModal={handleOpenSubGradesModal}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold">Módulos e Ementas da Turma</h2>
        <div className="mt-4 space-y-4">
          {turma.modules && turma.modules.length > 0 ? (
            turma.modules.map((module) => (
              <div key={module.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{module.title}</h3>
                  <p className="text-gray-700 mt-1">{module.syllabus}</p>
                </div>
                {canUserEditClass && (
                  <button
                    onClick={() => handleRemoveModule(module.id)}
                    className="text-red-500 hover:text-red-700 font-semibold ml-4 flex-shrink-0"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 bg-white p-4 rounded-lg shadow">Nenhum módulo cadastrado para esta turma.</p>
          )}
        </div>
      </div>

      {isUserAdmin && (
        <div className="mt-10 border-t-2 border-red-200 pt-6">
          <h2 className="text-xl font-semibold text-red-700">Zona de Perigo</h2>
          <div className="mt-4 bg-red-50 p-6 rounded-lg shadow-inner">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div>
                <h3 className="font-bold">Apagar esta Turma</h3>
                <p className="text-sm text-red-800 mt-1 max-w-2xl">
                  Uma vez que a turma for apagada, todos os seus dados serão permanentemente perdidos. Esta ação não
                  pode ser desfeita.
                </p>
              </div>
              <button
                onClick={handleDeleteClass}
                className="bg-red-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto mt-4 sm:mt-0"
              >
                Apagar Turma
              </button>
            </div>
          </div>
        </div>
      )}

      <AddStudentModal isOpen={isAddStudentModalOpen} onClose={handleCloseAddStudentModal} onSave={handleAddStudent} />

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
    </div>
  )
}

export default ClassDetailsPage