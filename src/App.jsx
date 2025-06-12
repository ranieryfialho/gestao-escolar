// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts e Componentes de Rota
import MainLayout from './components/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import UsersPage from './pages/UsersPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="turma/:turmaId" element={<ClassDetailsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
        </Route>
      </Route>

      {/* Rota de Fallback para páginas não encontradas */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;