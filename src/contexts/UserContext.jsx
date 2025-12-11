import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

// NOME CORRIGIDO AQUI: de UserProvider para UsersProvider
export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, firebaseUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    const authorizedRoles = ["diretor", "coordenador", "admin", "auxiliar_coordenacao", "professor_apoio", "financeiro", "professor"];
    
    if (!userProfile || !firebaseUser || !authorizedRoles.includes(userProfile.role)) {
      setUsers([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const functionUrl = "https://us-central1-boletim-escolar-app.cloudfunctions.net/listAllUsers";

      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar usuários.');
      }
      
      const result = await response.json();
      setUsers(result.users);

    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setUsers([]); 
    } finally {
      setLoading(false);
    }
  }, [userProfile, firebaseUser]);

  useEffect(() => {
    if (firebaseUser) {
      fetchUsers();
    }
  }, [fetchUsers, firebaseUser]);

  const value = { users, loadingUsers: loading, fetchUsers };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  return useContext(UserContext);
};