import { useState, useMemo } from "react";
import { useClasses } from "../contexts/ClassContext";
import { useUsers } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import { masterModuleList } from "../data/mockData.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase.js";
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  PlusCircle,
  Trash2,
  Pencil,
  Save,
  X,
  Search,
  FileDown,
  XCircle,
} from "lucide-react";
import MapaClassModal from "../components/MapaClassModal";
import InstructorStats from "../components/InstructorStats";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return "-";

  let date;
  if (typeof dateValue === "string") {
    const [year, month, day] = dateValue.split("-");
    if (year && month && day) {
      date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );
    } else {
      date = new Date(dateValue);
    }
  } else if (dateValue.toDate) {
    date = dateValue.toDate();
  } else {
    date = new Date(dateValue);
  }

  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR");
};

const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";

  let date;
  if (typeof dateValue === "string") {
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateValue;
    }
    const [year, month, day] = dateValue.split("-");
    if (year && month && day) {
      date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );
    } else {
      date = new Date(dateValue);
    }
  } else if (dateValue.toDate) {
    date = dateValue.toDate();
  } else {
    date = new Date(dateValue);
  }

  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatTimestampForInput = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== "function") return "";
  const date = timestamp.toDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (dateValue) => {
  if (!dateValue) return null;

  if (typeof dateValue === "string") {
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateValue.split("-");
      return new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );
    }
    return new Date(dateValue);
  } else if (dateValue.toDate) {
    return dateValue.toDate();
  } else if (dateValue instanceof Date) {
    return dateValue;
  }

  return null;
};

const calculateDynamicModules = (turma) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let moduloAtual = "N/D";
  let proximoModulo = "-";

  if (!turma.modules || turma.modules.length === 0) {
    return { moduloAtual, proximoModulo };
  }

  const modulosValidos = turma.modules.filter(
    (mod) => mod.dataInicio && mod.dataTermino
  );

  if (modulosValidos.length === 0) {
    if (turma.modules[0]?.id) {
      moduloAtual = turma.modules[0].id;
    }
    if (turma.modules[1]?.id) {
      proximoModulo = turma.modules[1].id;
    }
    return { moduloAtual, proximoModulo };
  }

  const modAtualEncontrado = modulosValidos.find((mod) => {
    const inicio = parseDate(mod.dataInicio);
    const termino = parseDate(mod.dataTermino);

    if (!inicio || !termino) return false;

    inicio.setHours(0, 0, 0, 0);
    termino.setHours(23, 59, 59, 999);

    return hoje >= inicio && hoje <= termino;
  });

  if (modAtualEncontrado) {
    moduloAtual = modAtualEncontrado.id;
  } else {
    const modulosFuturos = modulosValidos
      .filter((mod) => {
        const inicio = parseDate(mod.dataInicio);
        return inicio && inicio > hoje;
      })
      .sort((a, b) => parseDate(a.dataInicio) - parseDate(b.dataInicio));

    if (modulosFuturos.length > 0) {
      moduloAtual = "Aguardando";
    } else {
      const modulosPassados = modulosValidos
        .filter((mod) => {
          const termino = parseDate(mod.dataTermino);
          return termino && termino < hoje;
        })
        .sort((a, b) => parseDate(b.dataTermino) - parseDate(a.dataTermino));

      if (modulosPassados.length > 0) {
        moduloAtual = modulosPassados[0].id + " (Finalizado)";
      } else if (turma.modules[0]?.id) {
        moduloAtual = turma.modules[0].id;
      }
    }
  }

  const modulosFuturos = modulosValidos
    .filter((mod) => {
      const inicio = parseDate(mod.dataInicio);
      return inicio && inicio > hoje;
    })
    .sort((a, b) => parseDate(a.dataInicio) - parseDate(b.dataInicio));

  if (modulosFuturos.length > 0) {
    proximoModulo = modulosFuturos[0].id;
  } else {
    const indexAtual = turma.modules.findIndex(
      (mod) => mod.id === moduloAtual.replace(" (Finalizado)", "")
    );
    if (indexAtual >= 0 && indexAtual < turma.modules.length - 1) {
      proximoModulo = turma.modules[indexAtual + 1].id;
    }
  }

  return { moduloAtual, proximoModulo };
};

function MapaTurmasPage() {
  const { classes, loadingClasses } = useClasses();
  const { users } = useUsers();
  const { userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canEditMap =
    userProfile &&
    ["coordenador", "auxiliar_coordenacao"].includes(userProfile.role);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState(
    location.state?.filter || null
  );

  const handleInstructorSelect = (instructorName) => {
    if (selectedInstructor === instructorName) {
      setSelectedInstructor(null);
    } else {
      setSelectedInstructor(instructorName);
    }
  };

  const sortedClasses = useMemo(() => {
    const dayOrder = {
      "Segunda-feira": 1,
      "Terça-feira": 2,
      "Quarta-feira": 3,
      "Quinta-feira": 4,
      "Sexta-feira": 5,
      Sábado: 6,
    };

    return classes
      .filter((turma) => turma.name !== "CONCLUDENTES")
      .sort((a, b) => {
        const dayA = dayOrder[a.dia_semana] || 99;
        const dayB = dayOrder[b.dia_semana] || 99;
        if (dayA !== dayB) return dayA - dayB;

        const timeA = a.horario
          ? Number.parseInt(a.horario.replace(":", ""), 10)
          : 9999;
        const timeB = b.horario
          ? Number.parseInt(b.horario.replace(":", ""), 10)
          : 9999;
        if (timeA !== timeB) return timeA - timeB;

        const numA = Number.parseInt(a.name, 10);
        const numB = Number.parseInt(b.name, 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
      });
  }, [classes]);

  const instructorStats = useMemo(
    () =>
      Object.values(
        sortedClasses.reduce((acc, turma) => {
          const professor = turma.professorName || "Não Definido";
          if (!acc[professor]) acc[professor] = { name: professor, count: 0 };
          acc[professor].count++;
          return acc;
        }, {})
      ).sort((a, b) => b.count - a.count),
    [sortedClasses]
  );

  const filteredClasses = useMemo(() => {
    let result = sortedClasses;

    if (activeFilter === "endingThisMonth") {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      result = result.filter((turma) => {
        if (!turma.dataTermino) return false;
        const termDate = parseDate(turma.dataTermino);
        return (
          termDate &&
          termDate.getMonth() === currentMonth &&
          termDate.getFullYear() === currentYear
        );
      });
    }

    if (selectedInstructor) {
      result = result.filter(
        (turma) => (turma.professorName || "Não Definido") === selectedInstructor
      );
    }

    if (searchTerm.trim() !== "") {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      result = result.filter((turma) =>
        [
          turma.name,
          turma.professorName,
          turma.sala,
          turma.horario,
          turma.dia_semana,
          turma.modules?.[0]?.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(lowerCaseSearchTerm)
      );
    }

    return result;
  }, [sortedClasses, selectedInstructor, searchTerm, activeFilter]);

  const moduleOptions = Object.keys(masterModuleList);
  const instructorOptions = users.filter((u) =>
    [
      "professor",
      "coordenador",
      "diretor",
      "auxiliar_coordenacao",
      "professor_apoio",
    ].includes(u.role)
  );
  const roomOptions = ["Lab 01", "Lab 02", "Lab 03", "EAD"];
  const scheduleOptions = [
    "07:30 as 09:20",
    "09:30 as 11:20",
    "11:30 as 13:20",
    "13:30 as 15:20",
    "15:30 as 17:20",
    "19:00 as 21:20",
  ];
  const dayOptions = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  const handleStartEdit = (turma) => {
    setEditingRowId(turma.id);

    const { moduloAtual, proximoModulo } = calculateDynamicModules(turma);

    setEditedData({
      modulo_atual: moduloAtual
        .replace(" (Finalizado)", "")
        .replace("Aguardando", ""),
      proximo_modulo: proximoModulo === "-" ? "" : proximoModulo,
      data_inicio: formatDateForInput(turma.dataInicio),
      data_termino: formatDateForInput(turma.dataTermino),
      instrutor: turma.professorName || "",
      sala: turma.sala || "",
      horario: turma.horario || "",
      dia_semana: turma.dia_semana || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditedData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (turmaId) => {
    const dataToSave = {
      professorName: editedData.instrutor,
      sala: editedData.sala,
      horario: editedData.horario,
      dataInicio: editedData.data_inicio,
      dataTermino: editedData.data_termino,
      dia_semana: editedData.dia_semana,
      modules: [
        { id: editedData.modulo_atual || "" },
        { id: editedData.proximo_modulo || "" },
      ],
    };

    const classDocRef = doc(db, "classes", turmaId);
    const promise = updateDoc(classDocRef, dataToSave);

    await toast.promise(promise, {
      loading: "Salvando...",
      success: "Turma atualizada com sucesso!",
      error: "Erro ao atualizar a turma.",
    });

    handleCancelEdit();
  };

  const handleDeleteMapClass = async (turmaId, turmaName) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-2">
          <span className="text-center">Apagar "{turmaName}"?</span>
          <div className="flex gap-2">
            <button
              className="w-full bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-700"
              onClick={async () => {
                const promise = deleteDoc(doc(db, "classes", turmaId));
                await toast.promise(promise, {
                  loading: "Apagando...",
                  success: "Turma apagada do mapa.",
                  error: "Erro ao apagar turma.",
                });
                toast.dismiss(t.id);
              }}
            >
              Confirmar
            </button>
            <button
              className="w-full bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-lg hover:bg-gray-400"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 6000 }
    );
  };

  const handleAddMapClass = async (formData) => {
    const dataToSave = {
      name: formData.nome_turma,
      professorName: formData.instrutor,
      sala: formData.sala,
      horario: formData.horario,
      dataInicio: formData.data_inicio || "",
      dataTermino: formData.data_termino || "",
      dia_semana: formData.dia_semana,
      modules: [{ id: formData.modulo_atual || "" }],
      isMapaOnly: true,
      students: [],
    };

    const promise = addDoc(collection(db, "classes"), dataToSave);

    await toast.promise(promise, {
      loading: "Adicionando...",
      success: "Turma de planejamento adicionada!",
      error: "Erro ao adicionar turma.",
    });

    setIsAddModalOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(18);
    doc.text("Mapa de Turmas", 14, 22);

    const tableColumn = [
      "Dia",
      "Horário",
      "Turma",
      "Módulo Atual",
      "Próx. Módulo",
      "Início",
      "Término",
      "Instrutor",
      "Sala",
    ];
    const tableRows = [];

    filteredClasses.forEach((turma) => {
      const { moduloAtual, proximoModulo } = calculateDynamicModules(turma);

      const turmaData = [
        turma.dia_semana || "-",
        turma.horario || "-",
        turma.name || "N/D",
        moduloAtual,
        proximoModulo,
        formatDateForDisplay(turma.dataInicio),
        formatDateForDisplay(turma.dataTermino),
        turma.professorName || "A definir",
        turma.sala || "-",
      ];
      tableRows.push(turmaData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save("mapa-de-turmas.pdf");
  };

  if (loadingClasses) {
    return <div className="p-8">Carregando mapa de turmas...</div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Mapa de Turmas</h1>
        <div className="flex items-center gap-4">
          {canEditMap && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <PlusCircle size={18} />
              <span>Adicionar Curso Extra/TB</span>
            </button>
          )}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FileDown size={18} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar turma, instrutor, sala, horário, dia ou módulo..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <InstructorStats
        stats={instructorStats}
        onSelect={handleInstructorSelect}
        selected={selectedInstructor}
      />

      {activeFilter === "endingThisMonth" && (
        <div className="flex justify-between items-center mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
          <span className="text-sm font-semibold text-teal-800">
            Mostrando turmas que finalizam este mês.
          </span>
          <button
            onClick={() => {
              setActiveFilter(null);
              navigate(location.pathname, { replace: true, state: {} });
            }}
            className="flex items-center gap-1 text-sm text-red-600 hover:underline font-bold"
          >
            <XCircle size={16} />
            Limpar Filtro
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dia
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Horário
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turma
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Módulo Atual
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Próx. Módulo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Início
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Término
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Instrutor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sala
              </th>
              {canEditMap && (
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClasses.map((turma) => {
              const isEditing = editingRowId === turma.id;
              const { moduloAtual, proximoModulo } =
                calculateDynamicModules(turma);

              return (
                <tr
                  key={turma.id}
                  className={isEditing ? "bg-blue-50" : "hover:bg-gray-50"}
                >
                  <td className="p-1 font-semibold">
                    {isEditing && canEditMap ? (
                      <select
                        name="dia_semana"
                        value={editedData.dia_semana}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    ) : (
                      turma.dia_semana || "-"
                    )}
                  </td>
                  <td className="p-1">
                    {isEditing && canEditMap ? (
                      <select
                        name="horario"
                        value={editedData.horario}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {scheduleOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      turma.horario || "-"
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-semibold">
                    {!turma.isMapaOnly ? (
                      <Link
                        to={`/turma/${turma.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {turma.name}
                      </Link>
                    ) : (
                      <span className="text-gray-900">{turma.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing && canEditMap ? (
                      <select
                        name="modulo_atual"
                        value={editedData.modulo_atual}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {moduleOptions.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={
                          moduloAtual.includes("Finalizado")
                            ? "text-gray-500"
                            : moduloAtual === "Aguardando"
                            ? "text-orange-600"
                            : ""
                        }
                      >
                        {moduloAtual}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing && canEditMap ? (
                      <select
                        name="proximo_modulo"
                        value={editedData.proximo_modulo}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {moduleOptions.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    ) : (
                      proximoModulo
                    )}
                  </td>
                  <td className="p-1">
                    {isEditing && canEditMap ? (
                      <input
                        type="date"
                        name="data_inicio"
                        value={editedData.data_inicio}
                        onChange={handleEditChange}
                        className="w-32 p-2 border rounded-md"
                      />
                    ) : (
                      formatDateForDisplay(turma.dataInicio)
                    )}
                  </td>
                  <td className="p-1">
                    {isEditing && canEditMap ? (
                      <input
                        type="date"
                        name="data_termino"
                        value={editedData.data_termino}
                        onChange={handleEditChange}
                        className="w-32 p-2 border rounded-md"
                      />
                    ) : (
                      formatDateForDisplay(turma.dataTermino)
                    )}
                  </td>
                  <td className="p-1">
                    {isEditing && canEditMap ? (
                      <select
                        name="instrutor"
                        value={editedData.instrutor}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {instructorOptions.map((i) => (
                          <option key={i.id} value={i.name}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      turma.professorName || "-"
                    )}
                  </td>
                  <td className="p-1">
                    {isEditing && canEditMap ? (
                      <select
                        name="sala"
                        value={editedData.sala}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {roomOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      turma.sala || "-"
                    )}
                  </td>
                  {canEditMap && (
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-4">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(turma.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Salvar"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-700"
                              title="Cancelar"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(turma)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar Linha"
                            >
                              <Pencil size={16} />
                            </button>
                            {turma.isMapaOnly && (
                              <button
                                onClick={() =>
                                  handleDeleteMapClass(turma.id, turma.name)
                                }
                                className="text-red-600 hover:text-red-800"
                                title="Apagar Linha"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredClasses.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Nenhuma turma de planejamento encontrada.
          </p>
        )}
      </div>

      {canEditMap && (
        <MapaClassModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddMapClass}
          instructors={instructorOptions}
          dayOptions={dayOptions}
        />
      )}
    </div>
  );
}

export default MapaTurmasPage;