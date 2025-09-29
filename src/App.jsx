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
import AcademicFollowUpPage from './pages/AcademicFollowUpPage';
import LowGradesPage from './pages/LowGradesPage';
import ContractGeneratorPage from './pages/ContractGeneratorPage';
import NexusAttendancePage from './pages/NexusAttendancePage';
import CursosPage from './pages/CursosPage';
import EventosPage from './pages/EventosPage';

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
          <Route path="acompanhamento" element={<AcademicFollowUpPage />} />
          <Route path="alunos-nota-baixa" element={<LowGradesPage />} />
          <Route path="gerar-contrato" element={<ContractGeneratorPage />} />
          <Route path="frequencia-nexus" element={<NexusAttendancePage />} />
          <Route path="cursos" element={<CursosPage />} />
          <Route path="/eventos" element={<EventosPage />} />
          
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;