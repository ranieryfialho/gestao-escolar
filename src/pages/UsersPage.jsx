import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useUsers } from "../contexts/UserContext.jsx";
import Modal from "../components/Modal.jsx";
import { useNavigate } from "react-router-dom";

// Função auxiliar para chamar a API (mantida como no seu arquivo original)
const callUserApi = async (functionName, payload, token) => {
  const functionUrl = `https://us-central1-boletim-escolar-app.cloudfunctions.net/${functionName}`;
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: payload }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Ocorreu um erro no servidor.");
  }
  return result;
};

function UsersPage() {
  const { userProfile, firebaseUser } = useAuth();
  const { users, loadingUsers, fetchUsers } = useUsers();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("professor");
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userProfile) {
      const authorizedRoles = ["diretor", "coordenador", "admin"];
      if (!authorizedRoles.includes(userProfile.role)) {
        navigate("/dashboard");
      }
    }
  }, [userProfile, navigate]);

  const handleApiAction = async (action, payload, successCallback) => {
    try {
      if (!firebaseUser) throw new Error("Usuário não autenticado.");
      const token = await firebaseUser.getIdToken();
      const result = await callUserApi(action, payload, token);
      alert(result.message || "Operação bem-sucedida!");
      if (successCallback) successCallback();
    } catch (error) {
      console.error(`Erro ao executar ${action}:`, error);
      alert(`Erro: ${error.message}`);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    await handleApiAction(
      "createNewUserAccount",
      { name: userName, email: userEmail, role: userRole },
      () => {
        setUserName("");
        setUserEmail("");
        setUserRole("professor");
        fetchUsers();
      }
    );
    setIsCreating(false);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);
    await handleApiAction(
      "updateUserProfile",
      { uid: editingUser.id, name: editingUser.name, role: editingUser.role },
      () => {
        setEditingUser(null);
        fetchUsers();
      }
    );
    setIsUpdating(false);
  };

  const handleDeleteUser = async (userToDelete) => {
    if (
      window.confirm(
        `Tem a certeza que deseja apagar o usuário ${userToDelete.name}?`
      )
    ) {
      await handleApiAction(
        "deleteUserAccount",
        { uid: userToDelete.id },
        () => {
          fetchUsers();
        }
      );
    }
  };

  const handleOpenEditModal = (user) => setEditingUser(user);
  const handleCloseEditModal = () => setEditingUser(null);

  if (!userProfile) {
    return <div className="p-8 text-center">A verificar permissões...</div>;
  }

  // --- MUDANÇA AQUI: Lista de cargos alinhada com seu sistema ---
  const rolesOptions = [
    { value: "professor", label: "Professor" },
    { value: "professor_nexus", label: "Professor Nexus" },
    { value: "professor_apoio", label: "Professor de Apoio" },
    { value: "auxiliar_coordenacao", label: "Auxiliar de Coordenação" },
    { value: "coordenador", label: "Coordenador" },
    { value: "diretor", label: "Diretor" },
    { value: "financeiro", label: "Financeiro" },
    { value: "comercial", label: "Comercial" },
    { value: "secretaria", label: "Secretaria" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Gestão de Usuários
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-bold mb-4">Cadastrar Novo Usuário</h3>
        <form
          onSubmit={handleCreateUser}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label
              htmlFor="userName"
              className="block text-sm font-medium text-gray-700"
            >
              Nome
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="userEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="userEmail"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="userRole"
              className="block text-sm font-medium text-gray-700"
            >
              Perfil
            </label>
            <select
              id="userRole"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            >
              {rolesOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {isCreating ? "A cadastrar..." : "Cadastrar Usuário"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mt-8">
        <h3 className="text-xl font-bold mb-4 px-2">Usuários Cadastrados</h3>
        <div className="overflow-x-auto">
          {loadingUsers ? (
            <p>Carregando usuários...</p>
          ) : (
            <table className="w-full text-left">
              <thead className="border-b-2">
                <tr>
                  <th className="p-2">Nome</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Perfil</th>
                  <th className="p-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.name}</td>
                    <td className="p-2 text-gray-600">{user.email}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full capitalize">
                        {(user.role || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-2 text-right space-x-4">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Apagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!editingUser}
        onClose={handleCloseEditModal}
        title="Editar Perfil do Usuário"
      >
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label
                htmlFor="editName"
                className="block text-sm font-medium text-gray-700"
              >
                Nome
              </label>
              <input
                id="editName"
                type="text"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email (não pode ser alterado)
              </label>
              <input
                type="email"
                value={editingUser.email}
                disabled
                className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label
                htmlFor="editRole"
                className="block text-sm font-medium text-gray-700"
              >
                Perfil
              </label>
              <select
                id="editRole"
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border rounded-md"
              >
                {rolesOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isUpdating ? "A salvar..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default UsersPage;