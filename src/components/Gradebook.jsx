import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Pencil,
  Trash2,
  ArrowRightLeft,
  MessageSquareText,
  FileCheck2,
  CheckCircle2,
  Circle,
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
  const [releaseChecklist, setReleaseChecklist] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);
  const isLoadingFromServer = useRef(false);

  const formatGradeOnLoad = (value) => {
    if (!value && value !== 0) return "";
    const num = Number.parseFloat(String(value).replace(",", "."));
    return isNaN(num) ? "" : num.toFixed(1);
  };

  // Cria um hash dos dados dos estudantes
  const studentsDataHash = useMemo(() => {
    if (!students) return '';
    return JSON.stringify(students.map(s => ({
      id: s.studentId || s.id,
      grades: s.grades,
      certificateStatus: s.certificateStatus,
      releaseChecklist: s.releaseChecklist,
    })));
  }, [students]);

  // Inicializa estados quando os dados mudarem
  useEffect(() => {
    if (!students || students.length === 0) return;

    console.log("🔄 Inicializando estados com dados do servidor");
    isLoadingFromServer.current = true;

    const initialGrades = {};
    const initialCertStatuses = {};
    const initialChecklist = {};
    
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
      
      initialChecklist[studentId] = {
        pagamento: student.releaseChecklist?.pagamento || false,
        notas: student.releaseChecklist?.notas || false,
        frequencia: student.releaseChecklist?.frequencia || false,
      };
    });
    
    setGrades(initialGrades);
    setCertificateStatuses(initialCertStatuses);
    setReleaseChecklist(initialChecklist);
    
    // Aguarda os estados serem definidos antes de liberar para edição
    setTimeout(() => {
      isLoadingFromServer.current = false;
      isInitialMount.current = false;
    }, 100);
  }, [studentsDataHash]);

  // Auto-save quando grades, certificateStatuses ou releaseChecklist mudarem
  useEffect(() => {
    // Ignora primeira montagem e quando está carregando do servidor
    if (isInitialMount.current || isLoadingFromServer.current || isReadOnly) {
      return;
    }

    console.log("📝 Detectada mudança nos estados, iniciando debounce...");

    // Limpa timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Configura novo timeout
    saveTimeoutRef.current = setTimeout(async () => {
      console.log("💾 Executando auto-save...");
      setIsSaving(true);
      
      try {
        await onSaveGrades(grades, certificateStatuses, releaseChecklist);
        console.log("✅ Auto-save concluído!");
      } catch (error) {
        console.error("❌ Erro no auto-save:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [grades, certificateStatuses, releaseChecklist, onSaveGrades, isReadOnly]);

  const handleCertificateStatusChange = (studentId, status) => {
    if (isReadOnly) return;
    console.log("📋 Alterando certificado:", studentId, status);
    setCertificateStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleChecklistChange = (studentId, field) => {
    if (isReadOnly) return;
    console.log("✅ Alterando checklist:", studentId, field);
    setReleaseChecklist((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: !prev[studentId]?.[field],
      },
    }));
  };

  const isCertificateUnlocked = (studentId) => {
    const checklist = releaseChecklist[studentId];
    if (!checklist) return false;
    return checklist.pagamento && checklist.notas && checklist.frequencia;
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

  const handleManualSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    try {
      await onSaveGrades(grades, certificateStatuses, releaseChecklist);
      console.log("✅ Salvamento manual concluído!");
    } catch (error) {
      console.error("❌ Erro no salvamento manual:", error);
    } finally {
      setIsSaving(false);
    }
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

    if (isNaN(numericGrade)) return "bg-gray-50 text-gray-800";
    if (numericGrade >= 7) return "bg-green-100 text-green-800";
    if (numericGrade >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (!students || students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-xl">Nenhum aluno encontrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Indicador de Salvamento */}
      {isSaving && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <p className="text-blue-700 text-sm font-medium animate-pulse">
            💾 Salvando alterações...
          </p>
        </div>
      )}

      {/* VERSÃO DESKTOP */}
      <div className="hidden xl:block">
        <div className="w-full">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-5 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Código
                </th>
                <th className="px-5 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Aluno(a)
                </th>
                {modules.map((module) => (
                  <th
                    key={module.id}
                    className="px-4 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider"
                    title={module.title}
                  >
                    {module.id}
                  </th>
                ))}
                {isVirtual && (
                  <>
                    <th className="px-5 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                      Liberação
                    </th>
                    <th className="px-5 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                      Certificado
                    </th>
                  </>
                )}
                <th className="px-5 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100">
              {students.map((student) => {
                const studentId = student.studentId || student.id;
                const studentGrades = grades[studentId] || {};
                const certStatus = certificateStatuses[studentId] || "nao_impresso";
                const checklist = releaseChecklist[studentId] || {
                  pagamento: false,
                  notas: false,
                  frequencia: false,
                };
                const canSelectCertificate = isCertificateUnlocked(studentId);

                return (
                  <tr key={studentId} className="hover:bg-blue-50 transition">
                    <td className="px-5 py-5 text-base text-gray-900 font-semibold whitespace-nowrap">
                      {student.code || student.matricula || "-"}
                    </td>
                    <td className="px-5 py-5 text-base text-gray-900 font-semibold">
                      <div className="min-w-[200px]">{student.name}</div>
                    </td>
                    {modules.map((module) => {
                      const gradeValue = studentGrades[module.id];
                      const displayValue =
                        typeof gradeValue === "object" && gradeValue?.finalGrade
                          ? gradeValue.finalGrade
                          : gradeValue || "";
                      const hasSubGrades =
                        module.subGrades && module.subGrades.length > 0;
                      
                      // LÓGICA DE TRAVAMENTO
                      const isRestricted = module.id === "OFFA" || module.id === "ADM";

                      return (
                        <td key={module.id} className="px-4 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="text"
                              value={displayValue}
                              // Se for restrito, não permite edição (input não chama onChange)
                              onChange={(e) =>
                                isRestricted ? undefined : handleGradeChange(studentId, module.id, e.target.value)
                              }
                              onBlur={(e) =>
                                isRestricted ? undefined : handleGradeBlur(studentId, module.id, e.target.value)
                              }
                              // Aplica readOnly se for restrito
                              readOnly={isRestricted}
                              disabled={isReadOnly}
                              className={`w-20 px-3 py-2.5 text-center text-base font-bold rounded-lg border-2 border-gray-300 transition 
                                ${getGradeStyle(gradeValue)} 
                                ${isReadOnly ? "cursor-not-allowed" : ""}
                                ${isRestricted ? "cursor-default focus:outline-none focus:ring-0" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
                              `}
                              placeholder="0.0"
                            />
                            {hasSubGrades && !isReadOnly && (
                              <button
                                onClick={() => onOpenSubGradesModal(student, module)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition flex-shrink-0"
                                title="Ver detalhes das notas"
                              >
                                <FileCheck2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    
                    {isVirtual && (
                      <>
                        <td className="px-5 py-5">
                          <div className="flex flex-col gap-2.5 min-w-[140px]">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 px-2 py-2 rounded-lg transition">
                              <input
                                type="checkbox"
                                checked={checklist.pagamento}
                                onChange={() => handleChecklistChange(studentId, 'pagamento')}
                                disabled={isReadOnly}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-sm font-semibold text-gray-700">Pagamento</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-green-50 px-2 py-2 rounded-lg transition">
                              <input
                                type="checkbox"
                                checked={checklist.notas}
                                onChange={() => handleChecklistChange(studentId, 'notas')}
                                disabled={isReadOnly}
                                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                              />
                              <span className="text-sm font-semibold text-gray-700">Notas</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 px-2 py-2 rounded-lg transition">
                              <input
                                type="checkbox"
                                checked={checklist.frequencia}
                                onChange={() => handleChecklistChange(studentId, 'frequencia')}
                                disabled={isReadOnly}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                              />
                              <span className="text-sm font-semibold text-gray-700">Frequência</span>
                            </label>
                          </div>
                        </td>
                        
                        <td className="px-5 py-5 text-center">
                          <div className="flex flex-col items-center gap-2 min-w-[160px]">
                            <select
                              value={certStatus}
                              onChange={(e) =>
                                handleCertificateStatusChange(studentId, e.target.value)
                              }
                              disabled={isReadOnly || !canSelectCertificate}
                              className={`w-full px-3 py-2.5 text-sm font-semibold border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                                canSelectCertificate
                                  ? certStatus === "entregue"
                                    ? "bg-green-50 border-green-400 text-green-800"
                                    : certStatus === "impresso"
                                    ? "bg-blue-50 border-blue-400 text-blue-800"
                                    : "bg-gray-50 border-gray-300"
                                  : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <option value="nao_impresso">Não Impresso</option>
                              <option value="impresso">Impresso</option>
                              <option value="entregue">Entregue</option>
                            </select>
                            {!canSelectCertificate && (
                              <span className="text-xs text-amber-600 font-semibold text-center leading-tight">
                                Complete o checklist
                              </span>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    <td className="px-5 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {onObservationClick && (
                          <button
                            onClick={() => onObservationClick(student)}
                            className="p-2.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition"
                            title="Adicionar observação"
                          >
                            <MessageSquareText size={20} />
                          </button>
                        )}
                        {onEditClick && isUserAdmin && (
                          <button
                            onClick={() => onEditClick(student)}
                            className="p-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Editar aluno"
                          >
                            <Pencil size={20} />
                          </button>
                        )}
                        {onTransferClick && isUserAdmin && (
                          <button
                            onClick={() => onTransferClick(student)}
                            className="p-2.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition"
                            title="Transferir aluno"
                          >
                            <ArrowRightLeft size={20} />
                          </button>
                        )}
                        {onDeleteClick && isUserAdmin && (
                          <button
                            onClick={() => onDeleteClick(studentId)}
                            className="p-2.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                            title="Remover aluno"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VERSÃO MOBILE/TABLET - CARDS */}
      <div className="xl:hidden space-y-6 p-6">
        {students.map((student) => {
          const studentId = student.studentId || student.id;
          const studentGrades = grades[studentId] || {};
          const certStatus = certificateStatuses[studentId] || "nao_impresso";
          const checklist = releaseChecklist[studentId] || {
            pagamento: false,
            notas: false,
            frequencia: false,
          };
          const canSelectCertificate = isCertificateUnlocked(studentId);

          return (
            <div
              key={studentId}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-xl mb-1">
                    {student.name}
                  </h3>
                  <p className="text-base text-gray-500">
                    Matrícula: {student.code || student.matricula || "-"}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {onObservationClick && (
                    <button
                      onClick={() => onObservationClick(student)}
                      className="p-3 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="Observação"
                    >
                      <MessageSquareText size={22} />
                    </button>
                  )}
                  {onEditClick && isUserAdmin && (
                    <button
                      onClick={() => onEditClick(student)}
                      className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <Pencil size={22} />
                    </button>
                  )}
                  {onTransferClick && isUserAdmin && (
                    <button
                      onClick={() => onTransferClick(student)}
                      className="p-3 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                      title="Transferir"
                    >
                      <ArrowRightLeft size={22} />
                    </button>
                  )}
                  {onDeleteClick && isUserAdmin && (
                    <button
                      onClick={() => onDeleteClick(studentId)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remover"
                    >
                      <Trash2 size={22} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-600 uppercase mb-3">
                  Notas dos Módulos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {modules.map((module) => {
                    const gradeValue = studentGrades[module.id];
                    const displayValue =
                      typeof gradeValue === "object" && gradeValue?.finalGrade
                        ? gradeValue.finalGrade
                        : gradeValue || "";
                    const hasSubGrades =
                      module.subGrades && module.subGrades.length > 0;
                    
                    // LÓGICA DE TRAVAMENTO MOBILE
                    const isRestricted = module.id === "OFFA" || module.id === "ADM";

                    return (
                      <div key={module.id} className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-600">
                          {module.id}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={displayValue}
                            onChange={(e) =>
                              isRestricted ? undefined : handleGradeChange(studentId, module.id, e.target.value)
                            }
                            onBlur={(e) =>
                              isRestricted ? undefined : handleGradeBlur(studentId, module.id, e.target.value)
                            }
                            readOnly={isRestricted}
                            disabled={isReadOnly}
                            className={`w-full px-3 py-3 text-center text-base font-bold rounded-lg border-2 border-gray-300 transition 
                              ${getGradeStyle(gradeValue)} 
                              ${isReadOnly ? "cursor-not-allowed" : ""}
                              ${isRestricted ? "cursor-default focus:outline-none focus:ring-0" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
                            `}
                            placeholder="0.0"
                          />
                          {hasSubGrades && !isReadOnly && (
                            <button
                              onClick={() => onOpenSubGradesModal(student, module)}
                              className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition flex-shrink-0"
                            >
                              <FileCheck2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isVirtual && (
                <div className="space-y-6 pt-6 border-t-2 border-gray-100">
                  <div>
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-3">
                      Checklist de Liberação
                    </h4>
                    <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-xl">
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition">
                        <input
                          type="checkbox"
                          checked={checklist.pagamento}
                          onChange={() => handleChecklistChange(studentId, 'pagamento')}
                          disabled={isReadOnly}
                          className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-base font-semibold text-gray-700">Pagamento</span>
                        {checklist.pagamento && (
                          <CheckCircle2 size={20} className="ml-auto text-blue-600" />
                        )}
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-green-50 p-3 rounded-lg transition">
                        <input
                          type="checkbox"
                          checked={checklist.notas}
                          onChange={() => handleChecklistChange(studentId, 'notas')}
                          disabled={isReadOnly}
                          className="w-6 h-6 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <span className="text-base font-semibold text-gray-700">Notas</span>
                        {checklist.notas && (
                          <CheckCircle2 size={20} className="ml-auto text-green-600" />
                        )}
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-3 rounded-lg transition">
                        <input
                          type="checkbox"
                          checked={checklist.frequencia}
                          onChange={() => handleChecklistChange(studentId, 'frequencia')}
                          disabled={isReadOnly}
                          className="w-6 h-6 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-base font-semibold text-gray-700">Frequência</span>
                        {checklist.frequencia && (
                          <CheckCircle2 size={20} className="ml-auto text-purple-600" />
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-3">
                      Status do Certificado
                    </h4>
                    <select
                      value={certStatus}
                      onChange={(e) =>
                        handleCertificateStatusChange(studentId, e.target.value)
                      }
                      disabled={isReadOnly || !canSelectCertificate}
                      className={`w-full px-4 py-4 text-base font-semibold border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        canSelectCertificate
                          ? certStatus === "entregue"
                            ? "bg-green-50 border-green-400 text-green-800"
                            : certStatus === "impresso"
                            ? "bg-blue-50 border-blue-400 text-blue-800"
                            : "bg-gray-50 border-gray-300"
                          : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <option value="nao_impresso">Não Impresso</option>
                      <option value="impresso">Impresso</option>
                      <option value="entregue">Entregue</option>
                    </select>
                    {!canSelectCertificate && (
                      <p className="text-sm text-amber-600 font-semibold mt-3 text-center bg-amber-50 p-3 rounded-lg">
                        ⚠️ Complete todos os itens do checklist para liberar
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default Gradebook;