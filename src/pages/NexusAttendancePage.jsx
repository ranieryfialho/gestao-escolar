import React, { useState, useEffect } from "react";
import { useClasses } from "../contexts/ClassContext";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  Check,
  X,
  Calendar,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquarePlus,
  MessageSquareText,
} from "lucide-react";

// Componente da Janela Modal para Observações
const ObservationModal = ({
  student,
  date,
  initialText,
  onClose,
  onSave,
  isSaving,
}) => {
  const [text, setText] = useState(initialText);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in">
        <h2 className="text-xl font-bold mb-1">Observação do Aluno</h2>
        <p className="font-semibold text-blue-600 mb-2">{student.name}</p>
        <p className="text-sm text-gray-500 mb-4">
          Data: {new Date(date + "T12:00:00").toLocaleDateString("pt-BR")}
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows="6"
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Digite uma observação para este aluno nesta data..."
        />
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(text)}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold disabled:bg-blue-300"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [observations, setObservations] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [observationModalOpen, setObservationModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isSavingObservation, setIsSavingObservation] = useState(false);

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
      setObservations({});
      return;
    }
    const fetchClassDetails = async () => {
      setIsLoadingStudents(true);
      const classData = findClassById(selectedClassId);

      if (classData && classData.students && classData.students.length > 0) {
        const studentCodes = classData.students.map((s) => s.code);
        const studentsCollectionRef = collection(db, "students");
        const q = query(
          studentsCollectionRef,
          where("code", "in", studentCodes)
        );
        const studentDocsSnap = await getDocs(q);
        const fullStudentDataMap = new Map();
        studentDocsSnap.forEach((doc) => {
          const data = doc.data();
          fullStudentDataMap.set(data.code, data);
        });
        const enrichedStudents = classData.students
          .map((s) => ({ ...s, ...fullStudentDataMap.get(s.code) }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setStudents(enrichedStudents);

        const attendanceDocRef = doc(
          db,
          "classes",
          selectedClassId,
          "attendance",
          date
        );
        const attendanceSnap = await getDoc(attendanceDocRef);
        const initialAttendance = {};
        const attendanceData = attendanceSnap.exists()
          ? attendanceSnap.data()
          : {};
        const records = attendanceData.records || {};
        setObservations(attendanceData.observations || {});

        enrichedStudents.forEach((student) => {
          initialAttendance[student.code] =
            records[student.code] || "nao_lancado";
        });
        setAttendance(initialAttendance);
      } else {
        setStudents([]);
        setObservations({});
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
        {
          classId: selectedClassId,
          date: date,
          attendanceRecords: attendance,
        },
        token
      );
      toast.success("Frequência salva com sucesso!");
    } catch (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openObservationModal = (student) => {
    setCurrentStudent(student);
    setObservationModalOpen(true);
  };

  const handleSaveObservation = async (newText) => {
    if (!currentStudent) return;
    setIsSavingObservation(true);
    const studentCode = currentStudent.code;
    const attendanceDocRef = doc(
      db,
      "classes",
      selectedClassId,
      "attendance",
      date
    );
    const updatedObservations = { ...observations, [studentCode]: newText };
    try {
      await setDoc(
        attendanceDocRef,
        { observations: updatedObservations },
        { merge: true }
      );
      setObservations(updatedObservations);
      toast.success("Observação salva!");
      setObservationModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar observação.");
      console.error(error);
    } finally {
      setIsSavingObservation(false);
    }
  };

  const stats = {
    total: students.length,
    presente: Object.values(attendance).filter(
      (status) => status === "presente"
    ).length,
    falta: Object.values(attendance).filter((status) => status === "falta")
      .length,
    naoLancado: Object.values(attendance).filter(
      (status) => status === "nao_lancado"
    ).length,
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
                      <p className="text-2xl font-bold text-gray-800">
                        {stats.total}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm text-green-700">Presentes</p>
                      <p className="text-2xl font-bold text-green-800">
                        {stats.presente}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-100">
                  <div className="flex items-center">
                    <XCircle className="text-red-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm text-red-700">Faltas</p>
                      <p className="text-2xl font-bold text-red-800">
                        {stats.falta}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
                  <div className="flex items-center">
                    <Clock className="text-yellow-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm text-yellow-700">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-800">
                        {stats.naoLancado}
                      </p>
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
                {students.map((student, index) => {
                  const hasObservation =
                    observations[student.code] &&
                    observations[student.code].trim() !== "";
                  return (
                    <div
                      key={student.code}
                      className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 border border-gray-100"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                          {index + 1}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800 text-lg">
                           {student.code} - {student.name}
                          </span>
                          {student.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                              <Phone size={14} />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openObservationModal(student)}
                          title={
                            hasObservation
                              ? "Ver/Editar Observação"
                              : "Adicionar Observação"
                          }
                          className={`p-3 rounded-full transition-all duration-200 ${
                            hasObservation
                              ? "bg-yellow-400 text-white hover:bg-yellow-500"
                              : "bg-white text-gray-500 hover:bg-gray-200 border-2 border-gray-200"
                          }`}
                        >
                          {hasObservation ? (
                            <MessageSquareText size={18} />
                          ) : (
                            <MessageSquarePlus size={18} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(student.code, "presente")
                          }
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
                          onClick={() =>
                            handleStatusChange(student.code, "falta")
                          }
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
                  );
                })}
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

        {observationModalOpen && currentStudent && (
          <ObservationModal
            student={currentStudent}
            date={date}
            initialText={observations[currentStudent.code] || ""}
            onClose={() => setObservationModalOpen(false)}
            onSave={handleSaveObservation}
            isSaving={isSavingObservation}
          />
        )}
      </div>
    </div>
  );
}

export default NexusAttendancePage;