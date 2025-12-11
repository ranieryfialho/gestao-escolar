// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, userProfile, loading, resetPassword } = useAuth(); // 1. Obtenha a função 'resetPassword'

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  // 2. Crie a função para lidar com o clique no botão de reset
  const handlePasswordReset = () => {
    resetPassword(email);
  };

  if (!loading && userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Boletim Escolar</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Entrar</button>
        </form>
        
        {/* 3. Adicione o botão/link para redefinir a senha */}
        <div className="text-center mt-4">
          <button 
            onClick={handlePasswordReset} 
            className="text-sm text-blue-600 hover:underline"
          >
            Esqueci a minha senha
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
