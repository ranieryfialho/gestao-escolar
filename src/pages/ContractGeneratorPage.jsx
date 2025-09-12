import { useState, useMemo, useEffect } from "react";
import { useClasses } from "../contexts/ClassContext";
import {
  FileText,
  User,
  Phone,
  Hash,
  BookUser,
  CalendarDays,
  Award,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
import seniorLogo from "../assets/logo-senior.jpeg";

// --- Funções de Máscara (sem alterações) ---
const maskCPF = (value) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .substring(0, 14);
const maskPhone = (value) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);

// --- Função para Gerar Datas (sem alterações) ---
const generateClassDates = (startDate, endDate, dayOfWeek) => {
  const dates = [];
  if (!startDate || !endDate || !dayOfWeek) return dates;
  const dayMap = {
    Domingo: 0,
    "Segunda-feira": 1,
    "Terça-feira": 2,
    "Quarta-feira": 3,
    "Quinta-feira": 4,
    "Sexta-feira": 5,
    Sábado: 6,
  };
  const targetDay = dayMap[dayOfWeek];
  if (targetDay === undefined) return dates;
  let current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);
  let dayDifference = targetDay - current.getUTCDay();
  if (dayDifference < 0) {
    dayDifference += 7;
  }
  current.setUTCDate(current.getUTCDate() + dayDifference);
  const finalEndDate = new Date(endDate);
  finalEndDate.setUTCHours(0, 0, 0, 0);
  while (current <= finalEndDate) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 7);
  }
  return dates;
};

// --- Componente Principal ---
const ContractGeneratorPage = () => {
  const { classes } = useClasses();
  const BASE_RATE_PER_COURSE = 80;

  const [studentName, setStudentName] = useState("");
  const [studentCpf, setStudentCpf] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianCpf, setGuardianCpf] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianPhone2, setGuardianPhone2] = useState("");
  const [paymentValue, setPaymentValue] = useState("0.00");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [certificateOption, setCertificateOption] = useState("impresso");

  useEffect(() => {
    const trainingAndTBCourses = classes.filter((c) =>
      (c.modules?.[0]?.id || "")
        .toUpperCase()
        .match(/TB|TREINAMENTO/)
    );
    setAvailableCourses(trainingAndTBCourses);
  }, [classes]);

  useEffect(() => {
    if (certificateOption === "impresso" || certificateOption === "pdf") {
      setPaymentValue(
        (selectedCourses.length * BASE_RATE_PER_COURSE).toFixed(2)
      );
    } else {
      setPaymentValue("0.00");
    }
  }, [selectedCourses, certificateOption]);

  const handleCourseSelection = (course, isChecked) => {
    setSelectedCourses((prev) =>
      isChecked ? [...prev, course] : prev.filter((c) => c.id !== course.id)
    );
  };

  const handleGeneratePDF = () => {
    if (
      !studentName ||
      !guardianName ||
      !guardianCpf ||
      !guardianPhone ||
      selectedCourses.length === 0
    ) {
      toast.error("Preencha os dados pessoais e selecione ao menos um curso.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageHeight = doc.internal.pageSize.getHeight();
    const halfPage = pageHeight / 2;

    const generateContractBlock = (startY) => {
      doc.addImage(seniorLogo, "JPEG", 15, startY + 5, 40, 0);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SÊNIOR ESCOLA DE PROFISSÕES", 105, startY + 10, {
        align: "center",
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Avenida Bezerra de Menezes, Nº 1384 - Alagadiço Novo",
        105,
        startY + 14,
        { align: "center" }
      );
      doc.text(
        "Telefone: (85) 3236-0000 | C.N.P.J: 45.102.340/0001-40",
        105,
        startY + 17,
        { align: "center" }
      );

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      // MUDANÇA: Aumentado o espaçamento para o título
      doc.text("Contrato (Treinamentos)", 105, startY + 28, {
        align: "center",
      });
      
      // MUDANÇA: Posição Y inicial do texto do contrato ajustada
      let y = startY + 36;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const allPhones = [guardianPhone, guardianPhone2]
        .filter(Boolean)
        .join(" / ");
      const courseCountText =
        selectedCourses.length > 1
          ? `${selectedCourses.length} cursos`
          : "1 curso";
      
      let contractText = `O aluno(a) ${studentName}, CPF ${
        studentCpf || "N/A"
      }, junto com o seu responsável de nome ${guardianName}, CPF: ${guardianCpf} e telefone (${allPhones}) junta a este termo de adesão, firma o presente acordo sobre o(s) treinamento(s) ofertado(s). O aluno(a) está se inscrevendo em ${courseCountText}.`;

      if (certificateOption === "impresso" || certificateOption === "pdf") {
        contractText += ` A taxa única de R$ ${parseFloat(paymentValue).toFixed(
          2
        )} é para confecção dos certificados, taxa essa que não há devolução, depois de o pagamento ser realizado.`;
      } else {
        contractText += ` A modalidade escolhida é SEM CERTIFICADO, isentando o aluno(a) da taxa.`;
      }
      
      const textLines = doc.splitTextToSize(contractText, 180);
      doc.text(textLines, 15, y);
      y += textLines.length * 4 + 2;

      selectedCourses.forEach((course, index) => {
        const courseDates = generateClassDates(
          course.dataInicio,
          course.dataTermino,
          course.dia_semana
        );
        const formattedDates = courseDates
          .map((date) => date.toLocaleDateString("pt-BR"))
          .join(", ");
        y += 8; // MUDANÇA: Aumentado espaçamento entre cursos
        doc.setFont("helvetica", "bold");
        doc.text(`Curso ${index + 1}:`, 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${course.name} (${course.dia_semana} das ${course.horario})`,
          40,
          y
        );
        y += 5; // MUDANÇA: Aumentado espaçamento entre linha do curso e as datas
        doc.setFont("helvetica", "bold");
        doc.text("Datas:", 15, y);
        doc.setFont("helvetica", "normal");
        const dateLines = doc.splitTextToSize(formattedDates, 150);
        doc.text(dateLines, 40, y);
        y += dateLines.length * 4;
      });

      // MUDANÇA: Posição das assinaturas ajustada para o final da página
      y = startY + 120;
      doc.line(40, y, 170, y);
      doc.text("ASSINATURA DO RESPONSÁVEL", 105, y + 4, { align: "center" });

      y += 12; // MUDANÇA: Aumentado espaçamento entre assinaturas
      doc.line(40, y, 170, y);
      doc.text("SÊNIOR ESCOLA DE PROFISSÕES", 105, y + 4, { align: "center" });

      const today = new Date();
      doc.text(
        `Fortaleza, ${today.getDate()} de ${today.toLocaleString("pt-BR", {
          month: "long",
        })} de ${today.getFullYear()}.`,
        105,
        y + 10,
        { align: "center" }
      );
    };

    generateContractBlock(0);
    doc.setLineDash([2, 2], 0);
    doc.line(10, halfPage, 200, halfPage);
    generateContractBlock(halfPage);

    doc.save(`contrato_${studentName.replace(/ /g, "_")}.pdf`);
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Gerador de Contrato Inteligente
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-6">
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2 text-gray-700">
              Dados Pessoais
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome do Aluno*
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full p-2 pl-10 border rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  CPF do Aluno
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={studentCpf}
                    onChange={(e) => setStudentCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full p-2 pl-10 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome do Responsável*
                </label>
                <div className="relative">
                  <BookUser
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full p-2 pl-10 border rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  CPF do Responsável*
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={guardianCpf}
                    onChange={(e) => setGuardianCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full p-2 pl-10 border rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Telefone do Responsável*
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) =>
                      setGuardianPhone(maskPhone(e.target.value))
                    }
                    className="w-full p-2 pl-10 border rounded-md"
                    placeholder="Informe um número"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Telefone 2 (Opcional)
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="tel"
                    value={guardianPhone2}
                    onChange={(e) =>
                      setGuardianPhone2(maskPhone(e.target.value))
                    }
                    className="w-full p-2 pl-10 border rounded-md"
                    placeholder="Informe mais um número"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2 text-gray-700">
              Dados do Treinamento
            </legend>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Selecione o(s) Treinamento(s) Disponível(is)*
                </label>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {availableCourses.length > 0 ? (
                    availableCourses.map((course) => (
                      <label
                        key={course.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onChange={(e) =>
                            handleCourseSelection(course, e.target.checked)
                          }
                        />
                        <span className="text-sm">
                          {course.name} ({course.dia_semana})
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nenhum treinamento ou TB disponível no momento
                    </p>
                  )}
                </div>
              </div>

              {selectedCourses.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm space-y-3">
                  {selectedCourses.map((course) => {
                    const courseDates = generateClassDates(
                      course.dataInicio,
                      course.dataTermino,
                      course.dia_semana
                    );
                    return (
                      <div
                        key={course.id}
                        className="pb-2 border-b last:border-b-0 last:pb-0"
                      >
                        <p className="font-bold text-blue-800">
                          {course.name} ({course.dia_semana} - {course.horario})
                        </p>
                        <p>
                          <span className="font-semibold">Professor(a):</span>{" "}
                          {course.professorName}
                        </p>
                        <p>
                          <span className="font-semibold">Sala:</span>{" "}
                          {course.sala}
                        </p>
                        {courseDates.length > 0 && (
                          <div className="flex items-start gap-2">
                            <CalendarDays
                              size={16}
                              className="text-blue-700 mt-0.5 flex-shrink-0"
                            />
                            <p>
                              <span className="font-semibold">Dias:</span>{" "}
                              {courseDates
                                .map((d) => d.toLocaleDateString("pt-BR"))
                                .join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Opção de Certificado
                  </label>
                  <div className="relative">
                    <Award
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <select
                      value={certificateOption}
                      onChange={(e) => setCertificateOption(e.target.value)}
                      className="w-full p-2 pl-10 border rounded-md bg-white"
                    >
                      <option value="impresso">Certificado Impresso</option>
                      <option value="pdf">Certificado em PDF</option>
                      <option value="sem">Sem Certificado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor da Taxa (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentValue}
                    onChange={(e) => setPaymentValue(e.target.value)}
                    className="w-full p-2 border rounded-md bg-white"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <div className="pt-4 text-right">
            <button
              onClick={handleGeneratePDF}
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2 disabled:bg-gray-400"
              disabled={selectedCourses.length === 0}
            >
              <FileText size={20} />
              Gerar Contrato em PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractGeneratorPage;