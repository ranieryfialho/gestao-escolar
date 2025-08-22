import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ArrowRightLeft,
  MessageSquareText,
  FileCheck2,
} from "lucide-react";

function Gradebook({
  students,
  modules,
  onSaveGrades,
  onTransferClick,
  onEditClick,
  onDeleteClick,
  onObservationClick,
  isUserAdmin,
  isUserProfessor,
  isReadOnly,
  onOpenSubGradesModal,
  isVirtual,
}) {
  const [grades, setGrades] = useState({});
  const [certificateStatuses, setCertificateStatuses] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialGrades = {};
    const initialCertStatuses = {};
    if (students) {
      students.forEach((student) => {
        const studentId = student.studentId || student.id;
        const studentGrades = {};
        if (student.grades) {
          Object.keys(student.grades).forEach((moduleId) => {
            const value = student.grades[moduleId];
            if (
              typeof value === "object" &&
              value !== null &&
              value.hasOwnProperty("finalGrade")
            ) {
              studentGrades[moduleId] = value;
            } else {
              studentGrades[moduleId] = formatGradeOnLoad(value);
            }
          });
        }
        initialGrades[studentId] = studentGrades;
        initialCertStatuses[studentId] =
          student.certificateStatus || "nao_impresso";
      });
    }
    setGrades(initialGrades);
    setCertificateStatuses(initialCertStatuses);
  }, [students]);

  const handleCertificateStatusChange = (studentId, status) => {
    if (isReadOnly) return;
    setCertificateStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const formatGradeOnLoad = (value) => {
    if (!value && value !== 0) return "";
    const num = Number.parseFloat(String(value).replace(",", "."));
    return isNaN(num) ? "" : num.toFixed(1);
  };

  const handleGradeChange = (studentId, moduleId, value) => {
    if (isReadOnly) return;
    const sanitizedValue = value.replace(/[^0-9,.]/g, "").replace(",", ".");
    if (Number.parseFloat(sanitizedValue) > 10 || sanitizedValue.length > 4)
      return;
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [moduleId]: sanitizedValue,
      },
    }));
  };

  const handleGradeBlur = (studentId, moduleId, value) => {
    if (isReadOnly || !value) return;
    const num = Number.parseFloat(value.replace(",", "."));
    if (!isNaN(num)) {
      const formattedGrade = num.toFixed(1);
      setGrades((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [moduleId]: formattedGrade,
        },
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveGrades(grades, certificateStatuses);
    setIsSaving(false);
  };

  const getGradeStyle = (grade) => {
    let numericGrade;
    if (
      typeof grade === "object" &&
      grade !== null &&
      grade.hasOwnProperty("finalGrade")
    ) {
      numericGrade = Number.parseFloat(grade.finalGrade);
    } else {
      numericGrade = Number.parseFloat(grade);
    }

    if (isNaN(numericGrade)) return "bg-white";
    return numericGrade >= 7
      ? "bg-green-100 text-green-800 font-bold"
      : "bg-red-100 text-red-800 font-bold";
  };

  const getCertificateStatusStyle = (status) => {
    switch (status) {
      case "impresso":
        return "bg-yellow-100 text-yellow-800";
      case "entregue":
        return "bg-green-100 text-green-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-4 text-center">
        <p className="text-gray-500">
          Importe ou adicione alunos para poder lançar as notas.
        </p>
      </div>
    );
  }

  const showActionsColumn = isUserAdmin || isUserProfessor;

  return (
    <div className="mt-4">
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-800 uppercase bg-gray-100 border-b-2">
            <tr>
              <th className="px-4 py-2 font-bold w-24">Código</th>
              <th className="px-4 py-2 font-bold w-64">Aluno(a)</th>
              {modules.map((module) => (
                <th
                  key={module.id}
                  className="px-2 py-2 text-center font-bold w-32"
                >
                  {module.title || module.id || "Módulo"}
                </th>
              ))}
              {isVirtual && (
                <th className="px-4 py-2 font-bold text-center w-48">
                  <FileCheck2 size={16} className="inline-block mr-1" />{" "}
                  Certificado
                </th>
              )}
              {showActionsColumn && (
                <th className="px-4 py-2 font-bold text-center w-40">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const studentId = student.studentId || student.id;
              return (
                <tr
                  key={studentId}
                  className="bg-white border-b hover:bg-blue-50"
                >
                  <td className="px-4 py-2 font-mono text-gray-500">
                    {student.code}
                  </td>
                  <th className="px-4 py-2 font-bold text-gray-900">
                    {student.name}
                  </th>

                  {modules.map((module) => {
                    const gradeValue = grades[studentId]?.[module.id];
                    if (module.subGrades) {
                      const finalGrade = gradeValue?.finalGrade
                        ? formatGradeOnLoad(gradeValue.finalGrade)
                        : "-";
                      const cellStyle = getGradeStyle(finalGrade);
                      return (
                        <td key={module.id} className="p-1 text-center">
                          <button
                            onClick={() =>
                              onOpenSubGradesModal(student, module)
                            }
                            disabled={isReadOnly}
                            className={`w-20 h-10 flex items-center justify-center gap-2 border rounded-md p-2 mx-auto disabled:cursor-not-allowed disabled:bg-gray-100 transition-colors ${cellStyle}`}
                          >
                            <span>{finalGrade}</span>
                            {!isReadOnly && <Pencil size={12} />}
                          </button>
                        </td>
                      );
                    } else {
                      const cellStyle = getGradeStyle(gradeValue);

                      let displayValue = "";
                      if (
                        typeof gradeValue === "object" &&
                        gradeValue !== null
                      ) {
                        displayValue = gradeValue.finalGrade
                          ? formatGradeOnLoad(gradeValue.finalGrade)
                          : "";
                      } else {
                        displayValue = gradeValue || "";
                      }

                      return (
                        <td
                          key={module.id}
                          className={`p-1 text-center transition-colors ${
                            !isReadOnly ? cellStyle : ""
                          }`}
                        >
                          <input
                            type="text"
                            inputMode="decimal"
                            value={displayValue}
                            onChange={(e) =>
                              handleGradeChange(
                                studentId,
                                module.id,
                                e.target.value
                              )
                            }
                            onBlur={(e) =>
                              handleGradeBlur(
                                studentId,
                                module.id,
                                e.target.value
                              )
                            }
                            disabled={isReadOnly}
                            className={`w-16 text-center border-none rounded-md p-2 mx-auto block ${
                              isReadOnly
                                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                : `bg-transparent focus:ring-2 focus:ring-blue-500 ${cellStyle}`
                            }`}
                            placeholder="-"
                          />
                        </td>
                      );
                    }
                  })}

                  {isVirtual && (
                    <td className="px-4 py-2 text-center">
                      <select
                        value={certificateStatuses[studentId] || "nao_impresso"}
                        onChange={(e) =>
                          handleCertificateStatusChange(
                            studentId,
                            e.target.value
                          )
                        }
                        disabled={isReadOnly}
                        className={`w-full text-center border-none rounded-md p-2 font-semibold ${getCertificateStatusStyle(
                          certificateStatuses[studentId]
                        )} ${
                          isReadOnly
                            ? "cursor-not-allowed"
                            : "focus:ring-2 focus:ring-blue-500"
                        }`}
                      >
                        <option value="nao_impresso">Não Impresso</option>
                        <option value="impresso">Impresso</option>
                        <option value="entregue">Entregue</option>
                      </select>
                    </td>
                  )}

                  {showActionsColumn && (
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center items-center gap-4">
                        <button
                          onClick={() => onObservationClick(student)}
                          className="text-gray-500 hover:text-yellow-600 transition-colors"
                          title="Adicionar Observação"
                        >
                          <MessageSquareText size={16} />
                        </button>

                        {isUserAdmin && (
                          <>
                            <button
                              onClick={() => onEditClick(student)}
                              className="text-gray-500 hover:text-blue-600 transition-colors"
                              title="Editar Aluno"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => onTransferClick(student)}
                              className="text-gray-500 hover:text-green-600 transition-colors"
                              title="Transferir Aluno"
                            >
                              <ArrowRightLeft size={16} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => onDeleteClick(studentId)}
                          className="text-gray-500 hover:text-red-600 transition-colors"
                          title="Apagar Aluno"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isReadOnly && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait transition shadow-lg"
          >
            {isSaving ? "A salvar..." : "Salvar Todas as Alterações"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Gradebook;
