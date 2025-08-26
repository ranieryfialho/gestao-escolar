import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useClasses } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, PhoneMissed, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const callFollowUpApi = async (functionName, payload, token) => {
  const functionUrl = `https://us-central1-boletim-escolar-app.cloudfunctions.net/${functionName}`;
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ data: payload }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Ocorreu um erro no servidor.");
  }
  return result;
};


function AcademicFollowUpPage() {
  const { classes, loadingClasses } = useClasses();
  const { firebaseUser } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [followUpData, setFollowUpData] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(false);

  const availableClasses = useMemo(() => {
    return classes.filter(c => c.name !== 'CONCLUDENTES' && !c.isMapaOnly)
                  .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes]);

  const fetchFollowUpData = useCallback(async () => {
    if (!selectedClassId || !selectedDate || !firebaseUser) return;
    
    setIsLoadingData(true);
    try {
      const token = await firebaseUser.getIdToken();
      const result = await callFollowUpApi('getFollowUpForDate', { classId: selectedClassId, date: selectedDate }, token);
      setFollowUpData(result.data || {});
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Não foi possível carregar os dados de acompanhamento.");
      setFollowUpData({});
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedClassId, selectedDate, firebaseUser]);


  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      if (selectedClass && selectedClass.students) {
        const sortedStudents = [...selectedClass.students].sort((a, b) => a.name.localeCompare(b.name));
        setStudents(sortedStudents);
      } else {
        setStudents([]);
      }
      fetchFollowUpData();
    } else {
      setStudents([]);
      setFollowUpData({});
    }
  }, [selectedClassId, classes, fetchFollowUpData]);

  useEffect(() => {
    fetchFollowUpData();
  }, [selectedDate, fetchFollowUpData]);
  
  const handleFollowUpChange = (studentId, field, value) => {
    setFollowUpData(prevData => {
      const studentData = prevData[studentId] || {};
      const newData = {
        ...prevData,
        [studentId]: {
          ...studentData,
          [field]: value,
        },
      };
      if (field === 'respostaFalta' && (value === 'sim' || value === 'pendente')) {
        newData[studentId].obsNaResposta = false;
      }
      return newData;
    });
  };

  const handleSave = async () => {
    if (Object.keys(followUpData).length === 0) {
        return toast.error("Nenhuma alteração para salvar.");
    }
    const promise = async () => {
        const token = await firebaseUser.getIdToken();
        await callFollowUpApi('saveFollowUpForDate', {
            classId: selectedClassId,
            date: selectedDate,
            followUpData: followUpData
        }, token);
    };

    toast.promise(promise(), {
        loading: 'Salvando...',
        success: 'Acompanhamento salvo com sucesso!',
        error: 'Erro ao salvar acompanhamento.'
    });
  };


  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Acompanhamento Acadêmico
      </h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">
              Selecione a Turma
            </label>
            <select
              id="class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingClasses}
            >
              <option value="" disabled>{loadingClasses ? 'Carregando turmas...' : 'Selecione uma turma'}</option>
              {availableClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date-select" className="block text-sm font-medium text-gray-700">
              Data do Acompanhamento
            </label>
            <input
              type="date"
              id="date-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {selectedClassId ? (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            {isLoadingData ? (
                <div className="p-8 text-center text-gray-500">Carregando dados...</div>
            ) : (
                <>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <MessageSquare size={16} className="mx-auto" />
                            Lembrete de Aula
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <PhoneMissed size={16} className="mx-auto" />
                            Resposta (Falta)
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <FileText size={16} className="mx-auto" />
                            Obs. (Não Respondeu)
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {students.map(student => {
                            const studentId = student.studentId || student.id;
                            const data = followUpData[studentId] || {};
                            const naoRespondeu = data.respostaFalta === 'nao';

                            return (
                            <tr key={studentId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">Cód: {student.code}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={!!data.lembreteEnviado}
                                    onChange={(e) => handleFollowUpChange(studentId, 'lembreteEnviado', e.target.checked)}
                                />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                    className="w-full text-center p-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={data.respostaFalta || 'pendente'}
                                    onChange={(e) => handleFollowUpChange(studentId, 'respostaFalta', e.target.value)}
                                >
                                    <option value="pendente">Pendente</option>
                                    <option value="sim">Sim</option>
                                    <option value="nao">Não</option>
                                </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                {naoRespondeu && (
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={!!data.obsNaResposta}
                                        onChange={(e) => handleFollowUpChange(studentId, 'obsNaResposta', e.target.checked)}
                                    />
                                )}
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    <div className="p-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                        >
                            Salvar Acompanhamento
                        </button>
                    </div>
                </>
            )}
        </div>
      ) : (
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-500">Por favor, selecione uma turma e uma data para iniciar o acompanhamento.</p>
        </div>
      )}
    </div>
  );
}

export default AcademicFollowUpPage;