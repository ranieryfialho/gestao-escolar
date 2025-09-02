import React, { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, UserX, Search } from 'lucide-react';

function LowGradesPage() {
    const location = useLocation();
    const { students: allStudentsWithLowGrades } = location.state || { students: [] };

    const [searchTerm, setSearchTerm] = useState('');

    const groupedAndFilteredData = useMemo(() => {
        const studentsMap = allStudentsWithLowGrades.reduce((acc, item) => {
            if (!acc[item.studentCode]) {
                acc[item.studentCode] = {
                    studentName: item.studentName,
                    studentCode: item.studentCode,
                    className: item.className,
                    professorName: item.professorName,
                    lowGrades: [],
                };
            }
            acc[item.studentCode].lowGrades.push({
                module: item.module,
                grade: item.grade,
            });
            return acc;
        }, {});

        const filteredStudents = Object.values(studentsMap).filter(student => {
            const term = searchTerm.toLowerCase();
            const hasMatch = (
                student.studentName.toLowerCase().includes(term) ||
                student.studentCode.toString().toLowerCase().includes(term) ||
                student.className.toLowerCase().includes(term) ||
                student.professorName.toLowerCase().includes(term) ||
                student.lowGrades.some(g => g.module.toLowerCase().includes(term))
            );
            return hasMatch;
        });

        const groupedByClass = filteredStudents.reduce((acc, student) => {
            if (!acc[student.className]) {
                acc[student.className] = {
                    professorName: student.professorName,
                    students: [],
                };
            }
            acc[student.className].students.push(student);
            return acc;
        }, {});
        
        return Object.entries(groupedByClass).sort((a, b) => a[0].localeCompare(b[0]));

    }, [allStudentsWithLowGrades, searchTerm]);

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6"
            >
                <ArrowLeft size={18} />
                Voltar para o Dashboard
            </Link>
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex-shrink-0">Alunos com Notas Abaixo da Média</h1>
                {/* AQUI ESTÁ A ALTERAÇÃO */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar aluno, turma, professor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>
            
            {groupedAndFilteredData.length > 0 ? (
                <div className="space-y-8">
                    {groupedAndFilteredData.map(([className, data]) => (
                        <div key={className} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                            <div className="pb-4 border-b mb-4">
                                <h2 className="text-xl font-bold text-blue-700">{className}</h2>
                                <p className="text-sm text-gray-600">Professor(a): {data.professorName}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="p-3 font-semibold text-left w-1/6">Matrícula</th>
                                            <th className="p-3 font-semibold text-left w-2/6">Aluno(a)</th>
                                            <th className="p-3 font-semibold text-left w-3/6">Módulos com Notas Baixas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.students.map((student) => (
                                            <tr key={student.studentCode} className="border-b hover:bg-gray-50 last:border-b-0">
                                                <td className="p-3 text-gray-600 align-top">{student.studentCode}</td>
                                                <td className="p-3 font-medium text-gray-900 align-top">{student.studentName}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-1">
                                                        {student.lowGrades.map((gradeInfo, index) => (
                                                            <div key={index} className="flex justify-between items-center">
                                                                <span className="text-gray-700">{gradeInfo.module}:</span>
                                                                <span className="font-bold text-red-600">{gradeInfo.grade}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-10 bg-white rounded-lg shadow-md">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                        <UserX size={40} className="text-gray-300" />
                        <span>Nenhum resultado encontrado para a sua busca.</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LowGradesPage;