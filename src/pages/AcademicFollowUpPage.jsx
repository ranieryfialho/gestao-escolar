import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useClasses } from "../contexts/ClassContext";
import { useAuth } from "../contexts/AuthContext";
import {
  MessageSquare,
  PhoneMissed,
  FileText,
  ClipboardCopy,
  HelpCircle,
  User,
  Calendar,
  Clock,
  CheckCircle,
  Loader,
} from "lucide-react";
import toast from "react-hot-toast";

const callFollowUpApi = async (functionName, payload, token) => {
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
    throw new Error(result.error || "Ocorreu um erro no servidor.");
  }
  return result;
};

function AcademicFollowUpPage() {
  const { classes, loadingClasses } = useClasses();
  const { firebaseUser } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState([]);
  const [followUpData, setFollowUpData] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);

  const [saveStatus, setSaveStatus] = useState("idle");
  const debounceTimeout = useRef(null);

  const availableClasses = useMemo(() => {
    return classes
      .filter((c) => c.name !== "CONCLUDENTES" && !c.isMapaOnly)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes]);

  const fetchFollowUpData = useCallback(async () => {
    if (!selectedClassId || !selectedDate || !firebaseUser) return;

    setIsLoadingData(true);
    try {
      const token = await firebaseUser.getIdToken();
      const result = await callFollowUpApi(
        "getFollowUpForDate",
        { classId: selectedClassId, date: selectedDate },
        token
      );
      setFollowUpData(result.data || {});
      setSaveStatus("idle");
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
      const selectedClass = classes.find((c) => c.id === selectedClassId);
      if (selectedClass) {
        const sortedStudents = [...(selectedClass.students || [])].sort(
          (a, b) => a.name.localeCompare(b.name)
        );
        setStudents(sortedStudents);
        setSelectedClassDetails({
          professorName: selectedClass.professorName || "A definir",
          dia_semana: selectedClass.dia_semana || "Não definido",
          horario: selectedClass.horario || "Não definido",
        });
      } else {
        setStudents([]);
        setSelectedClassDetails(null);
      }
      fetchFollowUpData();
    } else {
      setStudents([]);
      setFollowUpData({});
      setSelectedClassDetails(null);
    }
  }, [selectedClassId, classes, fetchFollowUpData]);

  useEffect(() => {
    fetchFollowUpData();
  }, [selectedDate, fetchFollowUpData]);

  const handleSave = useCallback(
    async (currentData) => {
      if (Object.keys(currentData).length === 0 || !selectedClassId) {
        return;
      }
      setSaveStatus("saving");
      try {
        const token = await firebaseUser.getIdToken();
        await callFollowUpApi(
          "saveFollowUpForDate",
          {
            classId: selectedClassId,
            date: selectedDate,
            followUpData: currentData,
          },
          token
        );
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        setSaveStatus("idle");
        toast.error("Erro ao salvar acompanhamento.");
      }
    },
    [selectedClassId, selectedDate, firebaseUser]
  );

  const handleFollowUpChange = (studentId, field, value) => {
    setFollowUpData((prevData) => {
      const studentData = prevData[studentId] || {};
      const newData = {
        ...prevData,
        [studentId]: {
          ...studentData,
          [field]: value,
        },
      };

      if (
        field === "respostaFalta" &&
        (value === "sim" || value === "pendente")
      ) {
        newData[studentId].obsNaResposta = false;
      }

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        handleSave(newData);
      }, 1500);

      return newData;
    });
  };

  const areAllRemindersSelected = useMemo(() => {
    if (students.length === 0) return false;
    return students.every((student) => {
      const studentId = student.studentId || student.id;
      return !!followUpData[studentId]?.lembreteEnviado;
    });
  }, [students, followUpData]);

  const handleSelectAllReminders = () => {
    const newCheckedState = !areAllRemindersSelected;
    setFollowUpData((prevData) => {
      const newFollowUpData = { ...prevData };
      students.forEach((student) => {
        const studentId = student.studentId || student.id;
        newFollowUpData[studentId] = {
          ...newFollowUpData[studentId],
          lembreteEnviado: newCheckedState,
        };
      });

      // Lógica de debounce para salvar
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        handleSave(newFollowUpData);
      }, 1500);

      return newFollowUpData;
    });
  };

  const handleCopyObservationMessage = (student) => {
    const studentId = student.studentId || student.id;
    const data = followUpData[studentId] || {};
    const contactType = data.contactType || "falta";
    const followUpDate = new Date(selectedDate + "T12:00:00");
    let relevantDate = new Date(followUpDate);
    let eventType = "";

    if (contactType === "lembrete") {
      eventType = "o lembrete de aula";
      if (followUpDate.getDay() === 6) {
        relevantDate.setDate(relevantDate.getDate() + 2);
      } else {
        relevantDate.setDate(relevantDate.getDate() + 1);
      }
    } else {
      eventType = "sua falta";
      if (followUpDate.getDay() === 1) {
        relevantDate.setDate(relevantDate.getDate() - 2);
      } else {
        relevantDate.setDate(relevantDate.getDate() - 1);
      }
    }

    const formattedDate = relevantDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const message = `Aluno(a) ${student.name} não respondeu à mensagem de acompanhamento sobre ${eventType}, enviada pelo setor acadêmico referente à aula do dia ${formattedDate}.`;

    navigator.clipboard
      .writeText(message)
      .then(() => toast.success("Mensagem de observação copiada!"))
      .catch((err) => {
        console.error("Erro ao copiar mensagem:", err);
        toast.error("Não foi possível copiar a mensagem.");
      });
  };

  const SaveStatusIndicator = () => {
    if (saveStatus === "saving") {
      return (
        <div className="flex items-center gap-2 text-sm text-yellow-600">
          <Loader size={16} className="animate-spin" /> Salvando...
        </div>
      );
    }
    if (saveStatus === "saved") {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle size={16} /> Salvo!
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Acompanhamento Acadêmico
      </h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label
              htmlFor="class-select"
              className="block text-sm font-medium text-gray-700"
            >
              Selecione a Turma
            </label>
            <select
              id="class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingClasses}
            >
              <option value="" disabled>
                {loadingClasses
                  ? "Carregando turmas..."
                  : "Selecione uma turma"}
              </option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="date-select"
              className="block text-sm font-medium text-gray-700"
            >
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

      {selectedClassDetails && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              <p>
                <strong className="font-semibold">Professor(a):</strong>{" "}
                {selectedClassDetails.professorName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <p>
                <strong className="font-semibold">Dia da Semana:</strong>{" "}
                {selectedClassDetails.dia_semana}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <p>
                <strong className="font-semibold">Horário:</strong>{" "}
                {selectedClassDetails.horario}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedClassId ? (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          {isLoadingData ? (
            <div className="p-8 text-center text-gray-500">
              Carregando dados...
            </div>
          ) : (
            <>
              <div className="p-4 flex justify-end">
                <SaveStatusIndicator />
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aluno
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-1">
                          <MessageSquare size={16} />
                          <span>Lembrete de Aula/Falta</span>
                        </div>
                        {students.length > 0 && (
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={areAllRemindersSelected}
                            onChange={handleSelectAllReminders}
                            title={
                              areAllRemindersSelected
                                ? "Desmarcar Todos"
                                : "Marcar Todos"
                            }
                          />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <PhoneMissed size={16} className="mx-auto" /> Houve
                      resposta?
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <HelpCircle size={16} className="mx-auto" /> Tipo de
                      Contato
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <FileText size={16} className="mx-auto" /> Obs. adicionada
                      no Sistema?
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    const studentId = student.studentId || student.id;
                    const data = followUpData[studentId] || {};
                    const naoRespondeu = data.respostaFalta === "nao";

                    return (
                      <tr key={studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Cód: {student.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={!!data.lembreteEnviado}
                            onChange={(e) =>
                              handleFollowUpChange(
                                studentId,
                                "lembreteEnviado",
                                e.target.checked
                              )
                            }
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="w-full text-center p-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={data.respostaFalta || "pendente"}
                            onChange={(e) =>
                              handleFollowUpChange(
                                studentId,
                                "respostaFalta",
                                e.target.value
                              )
                            }
                          >
                            <option value="pendente">Pendente</option>
                            <option value="sim">Sim</option>
                            <option value="nao">Não</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {naoRespondeu && (
                            <select
                              className="w-full text-center p-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              value={data.contactType || "falta"}
                              onChange={(e) =>
                                handleFollowUpChange(
                                  studentId,
                                  "contactType",
                                  e.target.value
                                )
                              }
                            >
                              <option value="falta">Falta</option>
                              <option value="lembrete">Lembrete de Aula</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {naoRespondeu && (
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={!!data.obsNaResposta}
                              onChange={(e) =>
                                handleFollowUpChange(
                                  studentId,
                                  "obsNaResposta",
                                  e.target.checked
                                )
                              }
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {naoRespondeu && (
                            <button
                              onClick={() =>
                                handleCopyObservationMessage(student)
                              }
                              className="text-blue-600 hover:text-blue-800"
                              title="Copiar mensagem de observação"
                            >
                              <ClipboardCopy size={20} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      ) : (
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-500">
            Por favor, selecione uma turma e uma data para iniciar o
            acompanhamento.
          </p>
        </div>
      )}
    </div>
  );
}

export default AcademicFollowUpPage;