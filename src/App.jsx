import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/MainLayout';

import ProtectedRoute from './routes/ProtectedRoute';

import MapaTurmasPage from './pages/MapaTurmasPage';
import LabSupportPage from "./pages/LabSupportPage";
import CalculatorPage from "./pages/CalculatorPage";
import KanbanPage from './pages/KanbanPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import BoletimPage from './pages/BoletimPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import UsersPage from './pages/UsersPage';
import NotFoundPage from './pages/NotFoundPage';
import AttendancePage from './pages/AttendancePage';
import AttendanceDetailPage from './pages/AttendanceDetailPage';
import LowGradesPage from './pages/LowGradesPage';
import ContractGeneratorPage from './pages/ContractGeneratorPage';
import NexusAttendancePage from './pages/NexusAttendancePage';
import CursosPage from './pages/CursosPage';
import EventosPage from './pages/EventosPage';
import EventAttendeesPage from './pages/EventAttendeesPage';
import RetufPage from './pages/RetufPage';
import InactiveStudentsPage from './pages/InactiveStudentsPage';
import ActiveStudentsPage from './pages/ActiveStudentsPage';
import LabStatisticsPage from './pages/LabStatisticsPage';
import GradeGenerator from "./pages/GradeGenerator";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
         <Route path="dashboard" element={<HomePage />} /> 
          <Route path="boletim" element={<BoletimPage />} />
          <Route path="mapa-turmas" element={<MapaTurmasPage />} />
          <Route path="laboratorio" element={<LabSupportPage />} />
          <Route path="calculadora" element={<CalculatorPage />} />
          <Route path="turma/:turmaId" element={<ClassDetailsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="frequencia" element={<AttendancePage />} />
          <Route path="frequencia/:classId" element={<AttendanceDetailPage />} />
          <Route path="alunos-nota-baixa" element={<LowGradesPage />} />
          <Route path="gerar-contrato" element={<ContractGeneratorPage />} />
          <Route path="frequencia-nexus" element={<NexusAttendancePage />} />
          <Route path="cursos" element={<CursosPage />} />
          <Route path="/retuf" element={<RetufPage />} />
          <Route path="/alunos-inativos" element={<InactiveStudentsPage />} />
          <Route path="alunos-ativos" element={<ActiveStudentsPage />} />
          <Route path="/eventos" element={<EventosPage />} />
          <Route path="/eventos/:eventId/inscritos" element={<EventAttendeesPage />} />
          <Route path="/laboratorio/estatisticas" element={<LabStatisticsPage />} />
          <Route path="gerador-notas" element={<GradeGenerator />} />
          
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;