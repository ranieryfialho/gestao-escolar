// src/pages/AttendancePage.jsx
import React, { useState, useMemo } from 'react';
import { useClasses } from '../contexts/ClassContext';
import { Link } from 'react-router-dom';
import { List, Search } from 'lucide-react';

function AttendancePage() {
  const { classes } = useClasses();
  const [searchTerm, setSearchTerm] = useState('');

  const extraClasses = useMemo(() => {
    if (!classes) return [];
    
    // --- LÓGICA DE FILTRAGEM ATUALIZADA E MAIS ROBUSTA ---
    const filtered = classes.filter(c => {
      const nameUpper = c.name.toUpperCase();
      // Verifica o campo 'tipo' ou 'modulo_atual'
      const typeUpper = (c.tipo || c.modulo_atual || '').toUpperCase();
      // VERIFICA TAMBÉM O ID DO PRIMEIRO MÓDULO NA LISTA
      const firstModuleIdUpper = (c.modules && c.modules[0] && c.modules[0].id || '').toUpperCase();

      return nameUpper.includes('TB') || 
             nameUpper.includes('CURSO EXTRA') ||
             typeUpper.includes('TB') ||
             typeUpper.includes('CURSO EXTRA') ||
             firstModuleIdUpper.includes('TB') ||
             firstModuleIdUpper.includes('CURSO EXTRA');
    });

    // Filtra adicionalmente pelo termo de busca
    if (!searchTerm) return filtered;
    return filtered.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  }, [classes, searchTerm]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Frequência - Cursos Extras e TBs</h1>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border rounded-md"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {extraClasses.length > 0 ? (
          <ul className="space-y-4">
            {extraClasses.map(turma => (
              <li key={turma.id}>
                <Link 
                  to={`/frequencia/${turma.id}`} 
                  className="block p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-blue-700">{turma.name}</h2>
                      <p className="text-sm text-gray-600">
                        Professor(a): {turma.professorName || 'A definir'}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {turma.students?.length || 0} aluno(s)
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10">
            <List size={48} className="mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">Nenhuma turma de Curso Extra ou TB foi encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendancePage;