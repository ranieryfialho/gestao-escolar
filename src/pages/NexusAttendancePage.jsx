import React, { useState, useEffect } from "react";
import { useClasses } from "../contexts/ClassContext";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Check, X, Calendar, BookOpen, Users, Clock, CheckCircle, XCircle } from "lucide-react";

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
    throw new Error(result.error?.message || "Ocorreu um erro no servidor.");
  }
  return result;
};

const NEXUS_SCHOOL_ID = "GEYs70ghHbdAm9oeE8hu";

function NexusAttendancePage() {
  const { classes, loadingClasses, findClassById } = useClasses();
  const { firebaseUser } = useAuth();

  const [nexusClasses, setNexusClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loadingClasses && classes.length > 0) {
      const filtered = classes.filter((c) => c.schoolId === NEXUS_SCHOOL_ID);
      setNexusClasses(filtered);
    }
  }, [classes, loadingClasses]);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setAttendance({});
      return;
    }
    const fetchClassDetails = async () => {
      setIsLoadingStudents(true);
      const classData = findClassById(selectedClassId);
      if (classData && classData.students) {
        const sortedStudents = [...classData.students].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setStudents(sortedStudents);
        const attendanceDocRef = doc(
          db,
          "classes",
          selectedClassId,
          "attendance",
          date
        );
        const attendanceSnap = await getDoc(attendanceDocRef);
        const initialAttendance = {};
        const records = attendanceSnap.exists()
          ? attendanceSnap.data().records
          : {};
        sortedStudents.forEach((student) => {
          initialAttendance[student.code] =
            records[student.code] || "nao_lancado";
        });
        setAttendance(initialAttendance);
      } else {
        setStudents([]);
        if (!classData) {
          console.warn("Turma não encontrada no contexto.");
        }
      }
      setIsLoadingStudents(false);
    };
    fetchClassDetails();
  }, [selectedClassId, date, findClassById]);

  const handleStatusChange = (studentCode, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentCode]: prev[studentCode] === status ? "nao_lancado" : status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
      toast.error("Por favor, selecione uma turma.");
      return;
    }
    setIsSaving(true);
    try {
      const token = await firebaseUser.getIdToken();
      await callApi(
        "saveAttendance",
        { classId: selectedClassId, date: date, attendanceRecords: attendance },
        token
      );
      toast.success("Frequência salva com sucesso!");
    } catch (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const stats = {
    total: students.length,
    presente: Object.values(attendance).filter(status => status === "presente").length,
    falta: Object.values(attendance).filter(status => status === "falta").length,
    naoLancado: Object.values(attendance).filter(status => status === "nao_lancado").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Users className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Controle de Frequência
          </h1>
          <p className="text-gray-600 text-lg">
            Nexus - Gestão de Presença Inteligente
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 border-b border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <BookOpen className="mr-2 text-blue-600" size={18} />
                  Turma
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white text-gray-800 font-medium"
                  disabled={loadingClasses}
                >
                  <option value="">
                    {loadingClasses
                      ? "Carregando turmas..."
                      : `Selecione uma turma (${nexusClasses.length} disponíveis)`}
                  </option>
                  {nexusClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="mr-2 text-blue-600" size={18} />
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white text-gray-800 font-medium"
                />
              </div>
            </div>

            {selectedClassId && students.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <Users className="text-gray-500 mr-2" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm text-green-700">Presentes</p>
                      <p className="text-2xl font-bold text-green-800">{stats.presente}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-100">
                  <div className="flex items-center">
                    <XCircle className="text-red-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm text-red-700">Faltas</p>
                      <p className="text-2xl font-bold text-red-800">{stats.falta}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
                  <div className="flex items-center">
                    <Clock className="text-yellow-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm text-yellow-700">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-800">{stats.naoLancado}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8">
            {isLoadingStudents ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Carregando alunos...</p>
                </div>
              </div>
            ) : !selectedClassId ? (
              <div className="text-center py-16">
                <BookOpen className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">
                  Selecione uma turma para começar
                </p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-16">
                <Users className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">
                  Nenhum aluno encontrado nesta turma
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student, index) => (
                  <div
                    key={student.code}
                    className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 border border-gray-100"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-800 text-lg">
                        {student.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleStatusChange(student.code, "presente")}
                        className={`flex items-center px-6 py-3 rounded-full transition-all duration-200 font-semibold text-sm ${
                          attendance[student.code] === "presente"
                            ? "bg-green-600 text-white shadow-lg transform scale-105"
                            : "bg-white text-green-600 border-2 border-green-200 hover:bg-green-50"
                        }`}
                      >
                        <Check size={16} className="mr-2" />
                        Presente
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.code, "falta")}
                        className={`flex items-center px-6 py-3 rounded-full transition-all duration-200 font-semibold text-sm ${
                          attendance[student.code] === "falta"
                            ? "bg-red-600 text-white shadow-lg transform scale-105"
                            : "bg-white text-red-600 border-2 border-red-200 hover:bg-red-50"
                        }`}
                      >
                        <X size={16} className="mr-2" />
                        Falta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {students.length > 0 && (
            <div className="bg-gray-50 p-8 border-t border-gray-100">
              <div className="flex justify-center">
                <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                  className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Salvando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Check className="mr-2" size={20} />
                      Salvar Frequência
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NexusAttendancePage;