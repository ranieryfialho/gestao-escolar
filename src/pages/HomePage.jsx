import React, { useRef, useState, useEffect } from "react";
import { useClasses } from "../contexts/ClassContext";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Users,
  GraduationCap,
  School,
  ClipboardList,
  FileText,
  CalendarPlus,
  BookMarked,
  UserX,
  FileSpreadsheet,
  Beaker,
  Ticket,
  BookImage,
  Calculator,
  BookCopy,
  BookOpenCheck,
  CalendarClock, // ### ÍCONE CORRIGIDO E ADICIONADO DE VOLTA ###
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BarChart from "../components/charts/BarChart";
import DoughnutChart from "../components/charts/DoughnutChart";

const StatCard = ({
  title,
  value,
  icon,
  to,
  state,
  bgColor = "bg-blue-100",
  textColor = "text-blue-600",
}) => {
  const IconComponent = icon;
  const content = (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col items-center text-center h-full justify-center">
      <div className={`${bgColor} p-3 rounded-full mb-3`}>
        <IconComponent className={`h-7 w-7 ${textColor}`} />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        <h3 className="text-sm font-medium text-gray-500 mt-1">{title}</h3>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} state={state} className="h-full block">
      {content}
    </Link>
  ) : (
    <div className="h-full">{content}</div>
  );
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

const getDisplayModules = (turma) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (!turma.modules || turma.modules.length === 0) {
    return { moduloAtual: "Sem Módulos" };
  }

  let currentModuleId;

  if (turma.mapa_modulo_atual_id) {
    currentModuleId = turma.mapa_modulo_atual_id;
  } else {
    const modAtualPorData = turma.modules.find((mod) => {
      const inicio = parseDate(mod.startDate);
      const termino = parseDate(mod.endDate);
      return inicio && termino && hoje >= inicio && hoje <= termino;
    });

    if (modAtualPorData) {
      currentModuleId = modAtualPorData.id;
    } else {
      const modulosPassados = turma.modules
        .filter((mod) => {
          const termino = parseDate(mod.endDate);
          return termino && termino < hoje;
        })
        .sort((a, b) => parseDate(b.endDate) - parseDate(a.endDate));

      if (modulosPassados.length > 0) {
        currentModuleId = modulosPassados[0].id;
      } else if (turma.modules.length > 0) {
        currentModuleId = turma.modules[0].id;
      } else {
        currentModuleId = "N/D";
      }
    }
  }
  return { moduloAtual: currentModuleId };
};

function HomePage() {
  const { classes, loadingClasses } = useClasses();
  const { userProfile } = useAuth();
  const [taskCounts, setTaskCounts] = useState({ todo: 0, inprogress: 0 });
  const [inactiveStudentsCount, setInactiveStudentsCount] = useState(0);

  const navigate = useNavigate();
  const barChartRef = useRef();
  const doughnutChartRef = useRef();

  const userRole = userProfile?.role;
  const isProfessorNexus = userRole === "professor_nexus";

  useEffect(() => {
    let unsubscribeTasks = () => {};
    let unsubscribeInactive = () => {};

    const canSeeTasks = ![
      "comercial",
      "financeiro",
      "secretaria",
      "professor_nexus",
    ].includes(userRole);
    if (canSeeTasks) {
      const tasksQuery = query(
        collection(db, "tasks"),
        where("status", "in", ["todo", "inprogress"])
      );
      unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
        const counts = { todo: 0, inprogress: 0 };
        querySnapshot.forEach((doc) => {
          const task = doc.data();
          if (task.status === "todo") counts.todo += 1;
          else if (task.status === "inprogress") counts.inprogress += 1;
        });
        setTaskCounts(counts);
      });
    }

    const canSeeInactive = [
      "coordenador",
      "auxiliar_coordenacao",
      "diretor",
    ].includes(userRole);
    if (canSeeInactive) {
      const inactiveQuery = query(collection(db, "inativos"));
      unsubscribeInactive = onSnapshot(inactiveQuery, (snapshot) => {
        setInactiveStudentsCount(snapshot.size);
      });
    }

    return () => {
      unsubscribeTasks();
      unsubscribeInactive();
    };
  }, [userRole]);

  if (loadingClasses) {
    return (
      <div className="p-8 text-center">Carregando dados do dashboard...</div>
    );
  }

  if (isProfessorNexus) {
    const professorCards = getVisibleCardsData();
    return (
      <div className="p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Bem-vindo(a), {userProfile?.name || "Professor(a) Nexus"}!
          </h2>
          <p className="text-md text-gray-600">
            O seu perfil de acesso é:{" "}
            <span className="font-semibold text-blue-600 capitalize">
              {userRole?.replace(/_/g, " ") || "Carregando..."}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {professorCards.map((card) => (
            <StatCard
              key={card.key}
              title={card.title}
              value={card.value}
              icon={card.icon}
              to={card.to}
              state={card.state}
              bgColor={card.bgColor}
              textColor={card.textColor}
            />
          ))}
          <Link
            to="/boletim"
            state={{
              isNexusUser: true,
              lockedSchoolId: "GEYs70ghHbdAm9oeE8hu",
            }}
            className="h-full block"
          >
            <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col items-center text-center h-full justify-center">
              <div className="bg-amber-100 p-3 rounded-full mb-3">
                <BookMarked className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">Consultar</p>
                <h3 className="text-sm font-medium text-gray-500 mt-1">
                  Boletim Nexus
                </h3>
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  const activeClasses = classes.filter(
    (c) => c.name !== "CONCLUDENTES" && !c.isMapaOnly
  );
  const totalStudents = activeClasses.reduce(
    (sum, c) => sum + (c.students?.length || 0),
    0
  );
  const tbClassesCount = classes.filter(
    (c) => (c.modules?.[0]?.id || "").toUpperCase() === "TB"
  ).length;
  const extraCoursesCount = classes.filter(
    (c) => (c.modules?.[0]?.id || "").toUpperCase() === "CURSO EXTRA"
  ).length;
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const classesWithModulesEndingThisMonth = activeClasses.filter((turma) => {
    if (!turma.modules || turma.modules.length === 0) {
      const termDate = parseDate(turma.dataTermino);
      return (
        termDate &&
        termDate.getMonth() === currentMonth &&
        termDate.getFullYear() === currentYear
      );
    }
    return turma.modules.some((mod) => {
      const termDate = parseDate(
        mod.endDate || mod.dataTermino || turma.dataTermino
      );
      return (
        termDate &&
        termDate.getMonth() === currentMonth &&
        termDate.getFullYear() === currentYear
      );
    });
  });
  const modulesEndingCount = classesWithModulesEndingThisMonth.length;
  const classesEndingCourseThisMonth = activeClasses.filter((turma) => {
    const { moduloAtual } = getDisplayModules(turma);
    const isLastModule = moduloAtual === "CMV";
    const termDate = parseDate(turma.dataTermino);
    const isEndingThisMonth =
      termDate &&
      termDate.getMonth() === currentMonth &&
      termDate.getFullYear() === currentYear;
    return isLastModule && isEndingThisMonth;
  });
  const courseEndingCount = classesEndingCourseThisMonth.length;
  const moduleOrder = ["ICN", "OFFA", "ADM", "PWB", "TRI", "CMV"];
  const moduleCounts = activeClasses.reduce((acc, turma) => {
    const { moduloAtual } = getDisplayModules(turma);
    acc[moduloAtual] = (acc[moduloAtual] || 0) + 1;
    return acc;
  }, {});
  const allModulesInChart = Object.keys(moduleCounts);
  const sortedLabels = moduleOrder.filter((mod) =>
    allModulesInChart.includes(mod)
  );
  const remainingLabels = allModulesInChart.filter(
    (mod) => !moduleOrder.includes(mod) && mod !== "Sem Módulos"
  );
  const finalLabels = [...sortedLabels, ...remainingLabels];
  const finalData = finalLabels.map((label) => moduleCounts[label]);
  const moduleChartData = {
    labels: finalLabels,
    datasets: [
      {
        label: "Nº de Turmas",
        data: finalData,
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };
  const handleBarChartClick = (event, elements) => {
    if (!elements || elements.length === 0) return;
    const { index } = elements[0];
    navigate("/mapa-turmas", {
      state: { filter: "module", moduleName: moduleChartData.labels[index] },
    });
  };
  const moduleChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleBarChartClick,
    onHover: (event, chartElement) => {
      event.native.target.style.cursor = chartElement[0]
        ? "pointer"
        : "default";
    },
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Turmas por Módulo Atual" },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };
  const gradeStatusCounts = activeClasses.reduce(
    (acc, turma) => {
      turma.students?.forEach((student) => {
        if (student.grades) {
          Object.values(student.grades).forEach((gradeInfo) => {
            const grade = parseFloat(
              typeof gradeInfo === "object" ? gradeInfo.finalGrade : gradeInfo
            );
            if (!isNaN(grade)) grade < 7 ? acc.red++ : acc.green++;
          });
        }
      });
      return acc;
    },
    { green: 0, red: 0 }
  );
  const doughnutChartData = {
    labels: ["Notas Acima da Média", "Notas Abaixo da Média"],
    datasets: [
      {
        data: [gradeStatusCounts.green, gradeStatusCounts.red],
        backgroundColor: ["#4CAF50", "#F44336"],
        hoverBackgroundColor: ["#66BB6A", "#EF5350"],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "Desempenho Geral de Notas" },
    },
  };

  const getVisibleCardsData = () => {
    if (!userRole) return [];

    const allCards = [];

    if (userRole !== "professor_nexus") {
      allCards.push(
        {
          key: "students",
          title: "Alunos Ativos",
          value: totalStudents,
          icon: Users,
          to: "/boletim",
        },
        {
          key: "classes",
          title: "Turmas Ativas",
          value: activeClasses.length,
          icon: School,
          to: "/boletim",
        },
        {
          key: "tb-classes",
          title: "Treinamentos Básicos",
          value: tbClassesCount,
          icon: BookOpenCheck,
          to: "/frequencia",
          bgColor: "bg-indigo-100",
          textColor: "text-indigo-600",
        },
        {
          key: "extra-courses",
          title: "Cursos Extras",
          value: extraCoursesCount,
          icon: BookCopy,
          to: "/frequencia",
          bgColor: "bg-purple-100",
          textColor: "text-purple-600",
        },
        {
          key: "lab-support",
          title: "Laboratório de Apoio",
          value: "Acessar",
          icon: Beaker,
          to: "/laboratorio",
          bgColor: "bg-lime-100",
          textColor: "text-lime-600",
        },
        {
          key: "events-management",
          title: "Gestão de Eventos",
          value: "Gerenciar",
          icon: Ticket,
          to: "/eventos",
          bgColor: "bg-rose-100",
          textColor: "text-rose-600",
        },
        {
          key: "courses-syllabi",
          title: "Cursos e Ementas",
          value: "Visualizar",
          icon: BookImage,
          to: "/cursos",
          bgColor: "bg-pink-100",
          textColor: "text-pink-600",
        },
        {
          key: "replacement-calculator",
          title: "Calculadora de Reposição",
          value: "Calcular",
          icon: Calculator,
          to: "/calculadora",
          bgColor: "bg-sky-100",
          textColor: "text-sky-600",
        }
      );
    }

    if (["coordenador", "auxiliar_coordenacao", "diretor"].includes(userRole)) {
      allCards.push({
        key: "inactive-students",
        title: "Alunos Inativos",
        value: inactiveStudentsCount,
        icon: UserX,
        to: "/alunos-inativos",
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
      });
    }

    if (userRole !== "comercial" && userRole !== "professor_nexus") {
      allCards.push(
        {
          key: "course-ending",
          title: "Turmas Finalizando",
          value: courseEndingCount,
          icon: GraduationCap,
          to: "/mapa-turmas",
          state: { filter: "endingCourseThisMonth" },
          bgColor: "bg-orange-100",
          textColor: "text-orange-600",
        },
        {
          key: "modules-ending",
          title: "Módulos Finalizando",
          value: modulesEndingCount,
          icon: CalendarClock,
          to: "/mapa-turmas",
          state: { filter: "endingThisMonth" },
          bgColor: "bg-teal-100",
          textColor: "text-teal-600",
        }
      );
    }

    if (
      [
        "coordenador",
        "auxiliar_coordenacao",
        "diretor",
        "financeiro",
        "professor_nexus",
      ].includes(userRole)
    ) {
      allCards.push({
        key: "frequencia-nexus",
        title: "Frequência Nexus",
        value: "Acessar",
        icon: CalendarPlus,
        to: "/frequencia-nexus",
        bgColor: "bg-cyan-100",
        textColor: "text-cyan-600",
      });
    }

    if (["coordenador", "auxiliar_coordenacao", "diretor"].includes(userRole)) {
      allCards.push({
        key: "retuf-report",
        title: "Relatório RETUF",
        value: "Acessar",
        icon: FileSpreadsheet,
        to: "/retuf",
        bgColor: "bg-blue-100",
        textColor: "text-blue-600",
      });
    }

    if (
      [
        "coordenador",
        "diretor",
        "comercial",
        "secretaria",
        "financeiro",
      ].includes(userRole)
    ) {
      allCards.push({
        key: "generate-contract",
        title: "Gerar Contrato",
        value: "Criar",
        icon: FileText,
        to: "/gerar-contrato",
        bgColor: "bg-violet-100",
        textColor: "text-violet-600",
      });
    }

    if (
      !["comercial", "financeiro", "secretaria", "professor_nexus"].includes(
        userRole
      )
    ) {
      allCards.push({
        key: "pending-tasks",
        title: "Tarefas Pendentes",
        value: taskCounts.todo + taskCounts.inprogress,
        icon: ClipboardList,
        to: "/kanban",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-600",
      });
    }

    return allCards;
  };

  const visibleCards = getVisibleCardsData();
  const rows = [];
  for (let i = 0; i < visibleCards.length; i += 5) {
    rows.push(visibleCards.slice(i, i + 5));
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Geral</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Bem-vindo(a), {userProfile?.name || "Usuário"}!
        </h2>
        <p className="text-md text-gray-600">
          O seu perfil de acesso é:{" "}
          <span className="font-semibold text-blue-600 capitalize">
            {userRole?.replace(/_/g, " ") || "Carregando..."}
          </span>
        </p>
      </div>

      {rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6"
        >
          {row.map((card) => (
            <StatCard
              key={card.key}
              title={card.title}
              value={card.value}
              icon={card.icon}
              to={card.to}
              state={card.state}
              bgColor={card.bgColor}
              textColor={card.textColor}
            />
          ))}
        </div>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={`${
            userRole === "comercial" ? "lg:col-span-3" : "lg:col-span-2"
          } h-80 sm:h-96`}
        >
          <BarChart
            chartRef={barChartRef}
            chartData={moduleChartData}
            chartOptions={moduleChartOptions}
          />
        </div>
        {userRole !== "comercial" && (
          <div className="lg:col-span-1 h-80 sm:h-96">
            <DoughnutChart
              chartRef={doughnutChartRef}
              chartData={doughnutChartData}
              chartOptions={doughnutChartOptions}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
