// src/pages/ClassDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClasses } from '../contexts/ClassContext';
import { useUsers } from '../contexts/UserContext';
import StudentImporter from '../components/StudentImporter';
import Gradebook from '../components/Gradebook';
import TransferStudentModal from '../components/TransferStudentModal'; // Novo modal de transferência

function ClassDetailsPage() {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { classes, updateClass, deleteClass } = useClasses();
  const { users } = useUsers();

  const [turma, setTurma] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherList, setTeacherList] = useState([]);

  // Novos estados para transferência
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState(null);

  const adminRoles = ['coordenador', 'diretor', 'admin'];
  const isUserAdmin = userProfile && adminRoles.includes(userProfile.role);

  useEffect(() => {
    const foundTurma = classes.find(c => c.id === turmaId);
    if (foundTurma) {
      setTurma(foundTurma);
      setNewClassName(foundTurma.name);
      setSelectedTeacherId(foundTurma.professorId || '');
    }
    const rolesPermitidos = ['professor', 'coordenador', 'auxiliar_coordenacao'];
    const filteredTeachers = users.filter(user => rolesPermitidos.includes(user.role));
    setTeacherList(filteredTeachers);
  }, [turmaId, classes, users]);

  const handleSaveName = async () => {
    if (newClassName.trim() === '') return alert("O nome da turma não pode ficar em branco.");
    await updateClass(turma.id, { name: newClassName });
    setIsEditingName(false);
  };

  const handleTeacherChange = async (e) => {
    const newTeacherId = e.target.value;
    const selectedTeacher = teacherList.find(t => t.id === newTeacherId);
    if (selectedTeacher) {
      await updateClass(turma.id, {
        professorId: selectedTeacher.id,
        professorName: selectedTeacher.name,
      });
      setSelectedTeacherId(newTeacherId);
    }
  };

  const handleStudentsImported = async (importedStudents) => {
    const studentsWithGrades = importedStudents.map(student => ({
      ...student,
      grades: student.grades || {}
    }));
    await updateClass(turma.id, { students: studentsWithGrades });
    alert(`${importedStudents.length} alunos importados com sucesso!`);
  };

  const handleSaveGrades = async (newGrades) => {
    if (!turma || !turma.students) return;
    const updatedStudents = turma.students.map(student => ({
      ...student,
      grades: { ...student.grades, ...newGrades[student.id] },
    }));
    await updateClass(turma.id, { students: updatedStudents });
  };

  const handleDeleteClass = async () => {
    if (window.confirm("Tem a certeza que deseja apagar esta turma? Esta ação é irreversível.")) {
      await deleteClass(turma.id);
      navigate('/dashboard');
    }
  };

  const handleRemoveModule = async (moduleIdToRemove) => {
    if (window.confirm("Tem a certeza que deseja remover este módulo da grade da turma?")) {
      const updatedModules = turma.modules.filter(module => module.id !== moduleIdToRemove);
      await updateClass(turma.id, { modules: updatedModules });
    }
  };

  // --- Funções para transferência ---
  const handleOpenTransferModal = (student) => {
    setStudentToTransfer(student);
    setIsTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false);
    setStudentToTransfer(null);
  };

  const handleConfirmTransfer = async (student, sourceClassId, targetClassId) => {
    // ** Implementar lógica futura aqui **
    console.log(`Transferindo ${student.name} da turma ${sourceClassId} para a turma ${targetClassId}`);
    alert("Função de transferir ainda não implementada. Veja o console.");
    handleCloseTransferModal();
  };

  if (!turma) {
    return <div className="p-8">A carregar turma...</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 hover:underline mb-6 block">&larr; Voltar para o Dashboard</Link>

      {/* Bloco 1: Informações Gerais */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {!isEditingName ? (
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">{turma.name}</h1>
            {isUserAdmin && (
              <button onClick={() => setIsEditingName(true)} className="text-sm text-blue-600 font-semibold">Editar</button>
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
            <button onClick={handleSaveName} className="bg-green-500 text-white px-3 py-1 rounded">Salvar</button>
            <button onClick={() => setIsEditingName(false)} className="text-sm text-gray-500">Cancelar</button>
          </div>
        )}
        {isUserAdmin ? (
          <div className="mt-4">
            <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700">Professor(a) Responsável:</label>
            <select
              id="teacher-select"
              value={selectedTeacherId}
              onChange={handleTeacherChange}
              className="mt-1 block w-full md:w-1/2 p-2 border rounded-md"
            >
              <option value="" disabled>Selecione um professor</option>
              {teacherList.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-md text-gray-600 mt-2">
            Professor(a) Responsável: {turma.professorName || 'A definir'}
          </p>
        )}
      </div>

      {/* Bloco 2: Alunos e Notas */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold">Alunos e Notas</h2>
        {isUserAdmin && (
          <div className="my-4">
            <StudentImporter onStudentsImported={handleStudentsImported} />
          </div>
        )}
        <Gradebook
          students={turma.students || []}
          modules={turma.modules || []}
          onSaveGrades={handleSaveGrades}
          onTransferClick={handleOpenTransferModal} // Nova prop
          isUserAdmin={isUserAdmin} // Nova prop
        />
      </div>

      {/* Bloco 3: Módulos e Ementas */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold">Módulos e Ementas da Turma</h2>
        <div className="mt-4 space-y-4">
          {turma.modules && turma.modules.length > 0 ? (
            turma.modules.map(module => (
              <div key={module.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{module.title}</h3>
                  <p className="text-gray-700 mt-1">{module.syllabus}</p>
                </div>
                {isUserAdmin && (
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

      {/* Bloco 4: Zona de Perigo */}
      {isUserAdmin && (
        <div className="mt-10 border-t-2 border-red-200 pt-6">
          <h2 className="text-xl font-semibold text-red-700">Zona de Perigo</h2>
          <div className="mt-4 bg-red-50 p-6 rounded-lg shadow-inner">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div>
                <h3 className="font-bold">Apagar esta Turma</h3>
                <p className="text-sm text-red-800 mt-1 max-w-2xl">
                  Uma vez que a turma for apagada, todos os seus dados serão permanentemente perdidos. Esta ação não pode ser desfeita.
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

      {/* Modal de Transferência */}
      <TransferStudentModal
        isOpen={isTransferModalOpen}
        onClose={handleCloseTransferModal}
        student={studentToTransfer}
        currentClass={turma}
        allClasses={classes}
        onConfirmTransfer={handleConfirmTransfer}
      />
    </div>
  );
}

export default ClassDetailsPage;