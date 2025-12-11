import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClasses } from '../contexts/ClassContext';
import { UserPlus, ArrowLeft, Trash2, CheckCircle, XCircle } from 'lucide-react';
import AddStudentToExtraClassModal from '../components/AddStudentToExtraClassModal';
import toast from 'react-hot-toast';

const generateClassDates = (startDate, endDate, dayOfWeek) => {
    const dates = [];
    if (!startDate || !endDate || !dayOfWeek) return dates;

    const dayMap = {
        "Domingo": 0, "Segunda-feira": 1, "Terça-feira": 2, "Quarta-feira": 3, 
        "Quinta-feira": 4, "Sexta-feira": 5, "Sábado": 6
    };

    const targetDay = dayMap[dayOfWeek];
    if (targetDay === undefined) return dates;

    let current = new Date(startDate);
    current.setDate(current.getDate() + (targetDay - current.getDay() + 7) % 7);

    const finalEndDate = new Date(endDate);

    while (current <= finalEndDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 7);
    }
    return dates;
};

function AttendanceDetailPage() {
    const { classId } = useParams();
    const { classes, findClassById, addStudentToClass, removeStudentFromClass, allStudentsMap, updateStudentAttendance, updateClassStatus } = useClasses();
    const [turma, setTurma] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const classDates = useMemo(() => {
        if (!turma) return [];
        const startDate = turma.dataInicio ? new Date(turma.dataInicio + 'T00:00:00-03:00') : null;
        const endDate = turma.dataTermino ? new Date(turma.dataTermino + 'T00:00:00-03:00') : null;
        return generateClassDates(startDate, endDate, turma.dia_semana);
    }, [turma]);

    const sortedStudents = useMemo(() => {
        if (!turma || !turma.students) return [];
        return [...turma.students].sort((a, b) => a.name.localeCompare(b.name));
    }, [turma]);


    useEffect(() => {
        const foundTurma = findClassById(classId);
        setTurma(foundTurma);
    }, [classId, classes, findClassById]);
    
    const handleAddStudent = async (studentData) => {
        await addStudentToClass(turma.id, studentData);
        setIsModalOpen(false);
    };
      
    const handleRemoveStudent = async (studentId) => {
        if (window.confirm("Tem certeza que deseja remover este aluno da turma?")) {
            await removeStudentFromClass(turma.id, studentId);
        }
    };
    
    const handleAttendanceChange = (studentId, date, status) => {
        const dateString = date.toISOString().split('T')[0];
        updateStudentAttendance(turma.id, studentId, dateString, status);
    };

    const handleFinishClass = () => {
        if (window.confirm(`Tem certeza que deseja marcar a turma "${turma.name}" como finalizada?`)) {
            updateClassStatus(turma.id, 'finalizada');
        }
    };

    if (!turma) {
        return <div className="p-8">Carregando turma...</div>;
    }

    return (
        <div className="p-4 sm:p-8 max-w-full mx-auto">
            <Link to="/frequencia" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6">
                <ArrowLeft size={18} />
                Voltar para a lista de turmas
            </Link>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{turma.name}</h1>
                    {turma.status === 'finalizada' && (
                        <span className="mt-1 flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                            <CheckCircle size={16}/> Turma Finalizada
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <UserPlus size={18} />
                        Adicionar Aluno
                    </button>
                    {turma.status !== 'finalizada' && (
                        <button
                            onClick={handleFinishClass}
                            className="flex items-center gap-2 bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            <CheckCircle size={18} />
                            Finalizar Turma
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white p-2 sm:p-4 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 px-4">Grade de Frequência</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="border-b">
                                <th className="sticky left-0 bg-gray-50 z-10 p-3 font-semibold text-left w-64">Nome do Aluno</th>
                                {classDates.map(date => (
                                    <th key={date.getTime()} className="p-3 font-semibold text-center w-24">
                                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </th>
                                ))}
                                <th className="sticky right-0 bg-gray-50 z-10 p-3 font-semibold text-center w-32">Frequência (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStudents.length > 0 ? (
                                sortedStudents.map(student => {
                                    const studentId = student.studentId || student.id;

                                    const totalClasses = classDates.length;
                                    const presentCount = student.attendance ? Object.values(student.attendance).filter(s => s === 'present').length : 0;
                                    const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
                                    const percentageColor = attendancePercentage >= 80 ? 'text-green-600' : 'text-red-600';

                                    return (
                                        <tr key={studentId} className="border-b hover:bg-gray-50">
                                            <td className="sticky left-0 bg-white hover:bg-gray-50 z-10 p-3 font-medium flex justify-between items-center w-64">
                                                <span>{student.name}</span>
                                                <button 
                                                  onClick={() => handleRemoveStudent(studentId)} 
                                                  className="text-red-500 hover:text-red-700 opacity-25 hover:opacity-100 transition-opacity"
                                                  title="Remover aluno"
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                            </td>
                                            {classDates.map(date => {
                                                const dateString = date.toISOString().split('T')[0];
                                                const status = student.attendance ? student.attendance[dateString] : null;

                                                return (
                                                    <td key={date.getTime()} className="p-3 text-center">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <button onClick={() => handleAttendanceChange(studentId, date, 'present')} title="Presente">
                                                                <CheckCircle size={20} className={status === 'present' ? 'text-green-500' : 'text-gray-300 hover:text-green-400'}/>
                                                            </button>
                                                            <button onClick={() => handleAttendanceChange(studentId, date, 'absent')} title="Ausente">
                                                                <XCircle size={20} className={status === 'absent' ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}/>
                                                            </button>
                                                        </div>
                                                    </td>
                                                )
                                            })}
                                            <td className={`sticky right-0 bg-white hover:bg-gray-50 z-10 p-3 text-center font-bold ${percentageColor}`}>
                                                {attendancePercentage.toFixed(0)}%
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={classDates.length + 2} className="text-center p-6 text-gray-500">
                                        Nenhum aluno adicionado a esta turma.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <AddStudentToExtraClassModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddStudent}
                allStudentsMap={allStudentsMap}
            />
        </div>
    );
}

export default AttendanceDetailPage;