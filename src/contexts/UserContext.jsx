import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, firebaseUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    const authorizedRoles = ['diretor', 'coordenador', 'admin', 'auxiliar_coordenacao'];
    if (!firebaseUser || !userProfile || !authorizedRoles.includes(userProfile.role)) {
      setUsers([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const functionUrl = `https://us-central1-boletim-escolar-app.cloudfunctions.net/listAllUsers`;
      
      const response = await fetch(functionUrl, {
        method: 'GET',
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
      setUsers([]); 
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, userProfile]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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