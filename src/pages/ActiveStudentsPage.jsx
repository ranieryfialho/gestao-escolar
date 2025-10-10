// src/pages/ActiveStudentsPage.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useClasses } from '../contexts/ClassContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, ChevronDown, ChevronUp, User, BookOpen, Search } from 'lucide-react';

const ActiveStudentsPage = () => {
  const { classes, loadingClasses } = useClasses();
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClasses, setExpandedClasses] = useState({});

  useEffect(() => {
    const fetchSchools = async () => {
      setLoadingSchools(true);
      try {
        const schoolsCollection = collection(db, "schools");
        const schoolSnapshot = await getDocs(schoolsCollection);
        const schoolList = schoolSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSchools(schoolList);
      } catch (error) {
        console.error("Erro ao buscar escolas:", error);
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  const activeSeniorsData = useMemo(() => {
    if (loadingClasses || loadingSchools || !classes.length || !schools.length) {
      return { classes: [], totalStudents: 0 };
    }

    const seniorSchool = schools.find(school => school.name === "Sênior Escola de Profissões");
    if (!seniorSchool) return { classes: [], totalStudents: 0 };

    const seniorSchoolId = seniorSchool.id;

    const filtered = classes.filter(c =>
      c.schoolId === seniorSchoolId &&
      !c.isMapaOnly &&
      c.name !== 'CONCLUDENTES' &&
      c.module !== 'Curso Extra' &&
      c.module !== 'TB' &&
      c.students && c.students.length > 0
    );

    const totalStudents = filtered.reduce((sum, c) => sum + (c.students?.length || 0), 0);

    return {
      classes: filtered.sort((a, b) => a.name.localeCompare(b.name)),
      totalStudents,
    };
  }, [classes, schools, loadingClasses, loadingSchools]);

  const finalFilteredClasses = useMemo(() => {
    if (!searchTerm) {
      return activeSeniorsData.classes;
    }
    const term = searchTerm.toLowerCase();
    return activeSeniorsData.classes.filter(turma =>
      turma.name.toLowerCase().includes(term) ||
      (turma.professorName || '').toLowerCase().includes(term) ||
      turma.students.some(student => student.name.toLowerCase().includes(term))
    );
  }, [activeSeniorsData.classes, searchTerm]);

  const toggleClassExpansion = (classId) => {
    setExpandedClasses(prev => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  if (loadingClasses || loadingSchools) {
    return <div className="p-8 text-center">Carregando alunos...</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6">
        <ArrowLeft size={18} />
        Voltar para o Dashboard
      </Link>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Alunos Ativos (Sênior)</h1>
            <p className="text-gray-600 mt-1">
              Total de <span className="font-bold">{activeSeniorsData.totalStudents}</span> alunos em <span className="font-bold">{activeSeniorsData.classes.length}</span> turmas.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por turma, professor ou aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {finalFilteredClasses.length > 0 ? (
          finalFilteredClasses.map(turma => (
            <div key={turma.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => toggleClassExpansion(turma.id)}
              >
                <div>
                  <h2 className="font-bold text-lg text-blue-700">{turma.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1.5"><User size={14} /> {turma.professorName || 'A definir'}</span>
                    <span className="flex items-center gap-1.5"><Users size={14} /> {turma.students.length} alunos</span>
                  </div>
                </div>
                {expandedClasses[turma.id] ? <ChevronUp /> : <ChevronDown />}
              </div>
              
              {expandedClasses[turma.id] && (
                <div className="border-t">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 font-semibold text-left w-1/3">Matrícula</th>
                        <th className="p-3 font-semibold text-left w-2/3">Nome do Aluno</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turma.students.sort((a,b) => a.name.localeCompare(b.name)).map(student => (
                        <tr key={student.code} className="border-b last:border-0 hover:bg-blue-50/50">
                          <td className="p-3 text-gray-600 font-mono">{student.code}</td>
                          <td className="p-3 text-gray-800">{student.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center p-10 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">Nenhum resultado encontrado para a sua busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveStudentsPage;