import React, { useState, useMemo } from "react";
import { useClasses } from "../contexts/ClassContext";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { List, Search, CheckCircle, Calendar, Clock } from "lucide-react";

const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return "-";

  let date;
  if (typeof dateValue === "string") {
    date = new Date(dateValue + "T00:00:00");
  } else if (dateValue.toDate) {
    date = dateValue.toDate();
  } else {
    date = new Date(dateValue);
  }

  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

function AttendancePage() {
  const { classes } = useClasses();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Verificar se o usuário tem acesso restrito
  const isSecretaria = userProfile?.role === "secretaria";
  const isComercial = userProfile?.role === "comercial";
  const hasRestrictedAccess = isSecretaria || isComercial;

  const getClassType = (turma) => {
    const nameUpper = (turma.name || "").toUpperCase();
    const typeSource = (
      (turma.modules && turma.modules[0] && turma.modules[0].id) ||
      ""
    ).toUpperCase();

    if (
      nameUpper.includes("CURSO EXTRA") ||
      typeSource.includes("CURSO EXTRA")
    ) {
      return "Curso Extra";
    }

    return "Treinamento Básico";
  };

  const extraClasses = useMemo(() => {
    if (!classes) return [];

    const filtered = classes.filter((c) => {
      const typeSource = (
        (c.modules && c.modules[0] && c.modules[0].id) ||
        ""
      ).toUpperCase();
      return typeSource === "TB" || typeSource === "CURSO EXTRA";
    });

    let searchResult = filtered;
    if (searchTerm) {
      searchResult = filtered.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return searchResult.sort((a, b) => {
      const statusA = a.status === "finalizada" ? 1 : 0;
      const statusB = b.status === "finalizada" ? 1 : 0;
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [classes, searchTerm]);

  const ClassItem = ({ turma }) => {
    const type = getClassType(turma);
    const isFinished = turma.status === "finalizada";

    const content = (
      <div className={`block p-4 border rounded-lg transition-all duration-200 ${
        isFinished
          ? "bg-gray-100 opacity-70"
          : "bg-white"
      } ${!hasRestrictedAccess ? "hover:shadow-md hover:bg-gray-50" : ""}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-blue-700">
                {turma.name}
              </h2>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  type === "Treinamento Básico"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {type}
              </span>
              {isFinished && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  <CheckCircle size={12} /> Finalizada
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Professor(a): {turma.professorName || "A definir"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>
                  Início: {formatDateForDisplay(turma.dataInicio)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>
                  Término: {formatDateForDisplay(turma.dataTermino)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>
                  Horário: {turma.horario || 'Não definido'}
                </span>
              </div>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {turma.students?.length || 0} aluno(s)
          </span>
        </div>
      </div>
    );

    // Se tiver acesso restrito, retorna apenas o conteúdo sem link
    if (hasRestrictedAccess) {
      return content;
    }

    // Para outros perfis, mantém o link clicável
    return (
      <Link to={`/frequencia/${turma.id}`} className="cursor-pointer">
        {content}
      </Link>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Frequência - Cursos Extras e TBs
        </h1>
        <div className="relative w-full sm:w-auto">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
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
            {extraClasses.map((turma) => (
              <li key={turma.id}>
                <ClassItem turma={turma} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10">
            <List size={48} className="mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">
              Nenhuma turma de Curso Extra ou TB foi encontrada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendancePage;