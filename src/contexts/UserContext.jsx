// src/contexts/UserContext.jsx (VERSÃO CORRIGIDA)
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Precisamos do contexto de autenticação

const UserContext = createContext(null);

export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { firebaseUser } = useAuth(); // Obter o usuário logado

  useEffect(() => {
    const fetchUsers = async () => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const token = await firebaseUser.getIdToken();
        const functionUrl = `https://us-central1-boletim-escolar-app.cloudfunctions.net/listAllUsers`;
        
        const response = await fetch(functionUrl, {
          method: 'GET', // Usamos GET como definimos na função
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao buscar usuários.');
        }

        const result = await response.json();
        setUsers(result.users);

      } catch (error) {
        console.error("Erro ao carregar usuários via Cloud Function:", error);
        // Em caso de erro, definimos a lista como vazia.
        setUsers([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    
  }, [firebaseUser]);

  const value = { users, loadingUsers: loading };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  return useContext(UserContext);
};