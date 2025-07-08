import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminHeader from './AdminHeader';

const AVAILABLE_ROLES = [
    { key: 'admin', label: '👔 Admin', description: 'Full access to the system. Can configure settings, create users, and assign permissions.' },
    { key: 'editor', label: '✏️ Editor', description: 'Can modify data and content, but not system settings.' },
    { key: 'viewer', label: '👀 Viewer', description: 'Can only view data, reports, and dashboards, without making any changes.' },
];

export default function EditUserFormPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;
    
    // Estados do formulário
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    
    // Estados de controle da UI
    const [initialData, setInitialData] = useState(null); 
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!userId) {
            setError("ID do usuário não fornecido na URL.");
            return;
        }

        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${apiUrl}/api/users/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido.' }));
                    throw new Error(errorData.detail || `Erro ${response.status}`);
                }

                const userData = await response.json();
                
                setUsername(userData.username);
                setEmail(userData.email || ''); 
                setRole(userData.role);
                setInitialData(userData); // Define initialData após buscar os dados

            } catch (err) {
                setError(err.message);
            }
        };

        fetchUserData();
        
    }, [userId, apiUrl, navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');

        const updatedUserData = {};
        // Adiciona apenas os campos que foram alterados para evitar PUTs desnecessários
        if (username !== initialData.username) {
            updatedUserData.username = username;
        }
        if (email !== initialData.email) {
            updatedUserData.email = email;
        }
        if (role !== initialData.role) {
            updatedUserData.role = role;
        }
        
        if (Object.keys(updatedUserData).length === 0) {
            setError("Nenhuma alteração foi feita.");
            return;
        }
        
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updatedUserData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Falha ao atualizar o usuário.");
            }
            
            setSuccessMessage("Usuário atualizado com sucesso!");
            // Atualiza initialData com os novos valores para refletir o estado atual
            setInitialData(prev => ({ ...prev, ...updatedUserData }));
            // Não redireciona imediatamente, permite que o usuário veja a mensagem de sucesso
            // e talvez continue editando ou use os novos botões de ação.
            // setTimeout(() => navigate('/admin/manage-users/edit-user'), 2000); 

        } catch (err) {
            setError(err.message);
        }
    };

    // NOVO: Função para deletar o usuário
    const handleDeleteUser = async () => {
        if (!initialData) return; // Garante que os dados do usuário estão carregados
        if (!window.confirm(`Are you sure you want to delete the user ${initialData.username}? This action cannot be undone.`)) {
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/api/users/${userId}`, { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete the user.');
            }
            alert('User deleted successfully!');
            navigate('/admin/manage-users/edit-user'); // Redireciona para a lista após a exclusão
        } catch (err) {
            alert(err.message);
            setError(err.message);
        }
    };

    // NOVO: Função para ativar/desativar o usuário
    const handleToggleStatus = async () => {
        if (!initialData) return; // Garante que os dados do usuário estão carregados
        const action = initialData.is_active ? "deactivate" : "activate";
        if (!window.confirm(`Are you sure you want to ${action} the user ${initialData.username}?`)) {
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/api/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !initialData.is_active }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to ${action} the user.`);
            }
            alert(`User ${action}d successfully!`);
            // Atualiza o estado `initialData` para refletir a mudança de status na UI
            setInitialData(prev => ({ ...prev, is_active: !prev.is_active }));
            setSuccessMessage(`Usuário ${action === 'activate' ? 'ativado' : 'desativado'} com sucesso!`);
        } catch (err) {
            alert(err.message);
            setError(err.message);
        }
    };


    // --- LÓGICA DE RENDERIZAÇÃO CORRIGIDA ---

    if (error) {
        return <div className="p-4 m-4 bg-red-100 text-red-700 rounded-md text-center">Error: {error}</div>;
    }

    if (!initialData) {
        return <div className="text-center p-8">Loading user data...</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <AdminHeader page={`Edit User: ${initialData.username}`} />
            <main className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                        {successMessage && <div className="p-3 bg-green-100 text-green-700 rounded-md">{successMessage}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Profile</h3>
                            <div className="space-y-4">
                                {AVAILABLE_ROLES.map((r) => (
                                    <div key={r.key} className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
                                        <input id={r.key} name="role" type="radio" checked={role === r.key} onChange={() => setRole(r.key)} className="h-4 w-4 text-indigo-600 border-gray-300" />
                                        <div className="ml-3 text-sm">
                                            <label htmlFor={r.key} className="font-medium text-gray-800">{r.label}</label>
                                            <p className="text-gray-500">{r.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4">
                            {/* NOVO: Botão Deactivate/Activate */}
                            <button
                                type="button"
                                onClick={handleToggleStatus}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${initialData.is_active ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out`}
                            >
                                {initialData.is_active ? 'Deactivate User' : 'Activate User'}
                            </button>
                            {/* NOVO: Botão Delete */}
                            <button
                                type="button"
                                onClick={handleDeleteUser}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                            >
                                Delete User
                            </button>

                            <button type="button" onClick={() => navigate('/admin/manage-users/edit-user')} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300">
                                Back to User List
                            </button>
                            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">
                                Save Alterations
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
