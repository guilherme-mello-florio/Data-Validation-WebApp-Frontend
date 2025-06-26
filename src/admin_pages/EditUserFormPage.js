import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminHeader from './AdminHeader';

const AVAILABLE_ROLES = [
    { key: 'admin', label: '👔 Admin', description: 'Total access to the system.' },
    { key: 'editor', label: '✏️ Editor', description: 'Can view and edit data. Can upload interfaces to the system' },
    { key: 'viewer', label: '👀 Viewer', description: 'Can only view data.' },
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
    // **CORREÇÃO PRINCIPAL:** `initialData` começa como `null`.
    // Usaremos a existência de `initialData` para controlar o estado de carregamento.
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
                
                // Popula os estados do formulário e, mais importante,
                // o estado 'initialData' que libera a renderização do formulário.
                setUsername(userData.username);
                setEmail(userData.email || ''); // Trata emails nulos de forma segura
                setRole(userData.role);
                setInitialData(userData);

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
        updatedUserData.username = username;
        updatedUserData.email = email;
        updatedUserData.role = role;
        
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
            setTimeout(() => navigate('/admin/manage-users/edit-user'), 2000);

        } catch (err) {
            setError(err.message);
        }
    };

    // --- LÓGICA DE RENDERIZAÇÃO CORRIGIDA ---

    // Primeiro, checa por erros.
    if (error) {
        return <div className="p-4 m-4 bg-red-100 text-red-700 rounded-md text-center">Error: {error}</div>;
    }

    // Segundo, e mais importante: enquanto `initialData` for `null`, mostramos o loading.
    // Isso garante que o formulário só renderize quando os dados existirem.
    if (!initialData) {
        return <div className="text-center p-8">Loading user data...</div>;
    }

    // Se passamos pelas checagens acima, é seguro renderizar o formulário.
    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <AdminHeader page={`Editar Usuário: ${initialData.username}`} />
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
