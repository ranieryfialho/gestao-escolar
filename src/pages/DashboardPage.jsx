// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClasses } from '../contexts/ClassContext';
import { useUsers } from '../contexts/UserContext';
import CreateClassForm from '../components/CreateClassForm';
import { modulePackages, masterModuleList } from '../data/mockData';

function DashboardPage() {
  const { userProfile } = useAuth(); // Usamos o perfil do usuário para exibir as informações
  const { classes, addClass, loadingClasses } = useClasses();
  const { users } = useUsers();

  const [displayedClasses, setDisplayedClasses] = useState([]);
  const [teacherList, setTeacherList] = useState([]);

  const adminRoles = ['coordenador', 'diretor', 'admin'];
  const isUserAdmin = userProfile && adminRoles.includes(userProfile.role);

  useEffect(() => {
    const rolesPermitidos = ['professor', 'coordenador', 'auxiliar_coordenacao'];
    const filteredTeachers = users.filter(user => rolesPermitidos.includes(user.role));
    setTeacherList(filteredTeachers);
  }, [users]);

  useEffect(() => {
    if (!userProfile || loadingClasses) return;
    const validClasses = classes.filter(c => c && c.id);
    if (isUserAdmin) {
      setDisplayedClasses(validClasses);
    } else if (userProfile.role === 'professor') {
      const professorClasses = validClasses.filter(c => c.professorId === userProfile.id);
      setDisplayedClasses(professorClasses);
    } else {
      setDisplayedClasses([]);
    }
  }, [userProfile, classes, loadingClasses, isUserAdmin]);

  const handleCreateClass = async (className, selectedPackageId, teacherId) => {
    const selectedPackage = modulePackages.find(p => p.id === selectedPackageId);
    const selectedTeacher = teacherList.find(t => t.id === teacherId);
    if (!selectedPackage || !selectedTeacher) return;
    
    const classModules = selectedPackage.moduleKeys.map(key => masterModuleList[key]);
    const newClassData = {
      name: className,
      professorId: selectedTeacher.id,
      professorName: selectedTeacher.name,
      modules: classModules,
      createdAt: new Date(),
    };
    await addClass(newClassData); 
  };

  return (
    <div className="p-8">
      {/* AQUI ESTÁ A MUDANÇA: Adicionamos este bloco de boas-vindas */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Bem-vindo(a), {userProfile?.name || 'Usuário'}! 👋 
        </h1>
        <p className="text-md text-gray-600">
          O seu perfil de acesso é: <span className="font-semibold text-blue-600 capitalize">{userProfile?.role.replace('_', ' ')}</span>
        </p>
      </div>

      {isUserAdmin && (
        <CreateClassForm 
          onClassCreated={handleCreateClass} 
          packages={modulePackages}
          teachers={teacherList}
        />
      )}
      <h2 className="text-2xl font-semibold text-gray-800 my-4">
        {isUserAdmin ? 'Todas as Turmas' : 'Minhas Turmas'}
      </h2>
      
      {loadingClasses ? <p>A carregar turmas...</p> : displayedClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedClasses.map((turma) => (
            <Link key={turma.id} to={`/turma/${turma.id}`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer h-full">
                <h3 className="text-lg font-bold text-blue-700">{turma.name}</h3>
                <p className="text-sm text-gray-500 mt-2">Professor(a): {turma.professorName || 'A definir'}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Nenhuma turma cadastrada no sistema.</p>
      )}
    </div>
  );
}

export default DashboardPage;
