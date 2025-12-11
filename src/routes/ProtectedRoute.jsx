// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">A verificar autenticação...</div>;
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
