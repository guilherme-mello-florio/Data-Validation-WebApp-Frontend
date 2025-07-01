import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from './AdminHeader';

const AVAILABLE_ROLES = [
    { key: 'admin', label: 'Admin' },
    { key: 'editor', label: 'Editor' },
    { key: 'viewer', label: 'Viewer' },
];

const SORT_OPTIONS = [
    { key: 'username_asc', label: 'Nome (A-Z)', value: { by: 'username', order: 'asc' } },
    { key: 'username_desc', label: 'Nome (Z-A)', value: { by: 'username', order: 'desc' } },
    { key: 'role_asc', label: 'Permissão (A-Z)', value: { by: 'role', order: 'asc' } },
    { key: 'role_desc', label: 'Permissão (Z-Z)', value: { by: 'role', order: 'desc' } },
    { key: 'status_desc', label: 'Status (Ativo > Inativo)', value: { by: 'is_active', order: 'desc' } },
    { key: 'status_asc', label: 'Status (Inativo > Ativo)', value: { by: 'is_active', order: 'asc' } },
];

export default function EditUserListPage() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sortConfig, setSortConfig] = useState(SORT_OPTIONS[0].key);

    // Novo estado para as sugestões do autocomplete
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
    // Para controlar o timeout da busca (debounce)
    const autocompleteTimeoutRef = useRef(null);

    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchProjects = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/projects`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao buscar projetos.');
            const data = await response.json();
            setProjects(data || []);
        } catch (err) {
            console.error("Erro ao buscar projetos:", err);
        }
    }, [apiUrl]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        try {
            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.append('search', searchTerm);
            if (selectedStatus) queryParams.append('status', selectedStatus);
            
            selectedRoles.forEach(role => queryParams.append('roles', role));
            selectedProjects.forEach(project => queryParams.append('projects', project));
            
            const currentSort = SORT_OPTIONS.find(opt => opt.key === sortConfig)?.value;
            if (currentSort) {
                queryParams.append('sort_by', currentSort.by);
                queryParams.append('order', currentSort.order);
            }

            const response = await fetch(`${apiUrl}/api/users?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if(response.status === 401) navigate('/');
                throw new Error('Falha ao buscar usuários ou você não tem permissão.');
            }

            const data = await response.json();
            setUsers(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, searchTerm, selectedRoles, selectedProjects, selectedStatus, sortConfig, navigate]);

    // Função para buscar sugestões de autocomplete
    const fetchAutocompleteSuggestions = useCallback(async (query) => {
        if (!query.trim()) {
            setAutocompleteSuggestions([]);
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/api/v1/users/autocomplete?q=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                // Em caso de erro na API de autocomplete, não exiba sugestões
                setAutocompleteSuggestions([]);
                return;
            }

            const data = await response.json();
            // A API de sugestões deve retornar um array de objetos, ex: [{ username: 'usuario1', email: 'a@b.com' }]
            setAutocompleteSuggestions(data || []);

        } catch (err) {
            console.error("Erro ao buscar sugestões de autocomplete:", err);
            setAutocompleteSuggestions([]); // Limpa as sugestões em caso de erro
        }
    }, [apiUrl]);


    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Efeito para debounce do autocomplete
    useEffect(() => {
        if (autocompleteTimeoutRef.current) {
            clearTimeout(autocompleteTimeoutRef.current);
        }
        if (searchTerm.length >= 2) { // Dispara a busca de sugestões após 2 ou mais caracteres
            autocompleteTimeoutRef.current = setTimeout(() => {
                fetchAutocompleteSuggestions(searchTerm);
            }, 300); // Debounce de 300ms
        } else {
            setAutocompleteSuggestions([]); // Limpa as sugestões se o termo for muito curto
        }
    }, [searchTerm, fetchAutocompleteSuggestions]);

    const handleMultiSelectChange = (setter) => (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setter(selectedOptions);
    };

    // Handler para selecionar uma sugestão
    const handleSelectSuggestion = (suggestion) => {
        setSearchTerm(suggestion.username || suggestion.email); // Define o termo de busca com o valor selecionado
        setAutocompleteSuggestions([]); // Limpa as sugestões
        // O fetchUsers será chamado automaticamente pelo useEffect que observa searchTerm
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Tem certeza que deseja deletar o usuário ${username}?`)) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/api/users/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao deletar usuário.');
            alert('Usuário deletado com sucesso!');
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleToggleStatus = async (user) => {
        const action = user.is_active ? "desativar" : "ativar";
        if (!window.confirm(`Tem certeza que deseja ${action} o usuário ${user.username}?`)) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/api/users/${user.id}/status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !user.is_active }),
            });
            if (!response.ok) throw new Error(`Falha ao ${action} o usuário.`);
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleExportCsv = () => {
        setIsExporting(true);
        const headers = ["Username", "Email", "Permission", "Status", "Projects"];
        const csvRows = users.map(user => {
            const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
            const projectsList = user.projects?.map(p => p.project_name).join('; ') || "Nenhum";
            return [
                escapeCsv(user.username),
                escapeCsv(user.email),
                escapeCsv(user.role),
                escapeCsv(user.is_active ? 'Ativo' : 'Inativo'),
                escapeCsv(projectsList)
            ].join(',');
        });
        const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'users_list.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
    };
    
    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedRoles([]);
        setSelectedProjects([]);
        setSelectedStatus('');
        setSortConfig(SORT_OPTIONS[0].key);
        setAutocompleteSuggestions([]); // Limpa sugestões ao resetar
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            <AdminHeader page="Gerenciar Usuários" />
            <main className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-8 text-center">Gerenciar Usuários</h2>
                    
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6 border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Filtros e Ordenação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="lg:col-span-4 relative"> {/* Adicionado 'relative' para posicionar as sugestões */}
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                                <input
                                    id="search"
                                    type="text"
                                    placeholder="Buscar por nome ou email..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="input-filtro-usuario"
                                    autoComplete="off" // Desativa o autocomplete padrão do navegador
                                />
                                {autocompleteSuggestions.length > 0 && (
                                    <ul className="autocomplete-suggestions"> {/* Nova lista para sugestões */}
                                        {autocompleteSuggestions.map((user, index) => (
                                            <li key={index} onClick={() => handleSelectSuggestion(user)}>
                                                {user.username} ({user.email})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            <div className="flex flex-col">
                                <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">Permissões</label>
                                <select
                                    id="roles"
                                    multiple
                                    value={selectedRoles}
                                    onChange={handleMultiSelectChange(setSelectedRoles)}
                                    className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 custom-scrollbar"
                                    title="Segure Ctrl/Cmd para selecionar múltiplos"
                                >
                                    {AVAILABLE_ROLES.map(r => (<option key={r.key} value={r.key}>{r.label}</option>))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="projects" className="block text-sm font-medium text-gray-700 mb-1">Projetos</label>
                                <select
                                    id="projects"
                                    multiple
                                    value={selectedProjects}
                                    onChange={handleMultiSelectChange(setSelectedProjects)}
                                    className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 custom-scrollbar"
                                    title="Segure Ctrl/Cmd para selecionar múltiplos"
                                >
                                    {projects.map(p => (<option key={p.id} value={p.project_name}>{p.project_name}</option>))}
                                </select>
                            </div>
                            
                            <div className="flex flex-col">
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    id="status"
                                    value={selectedStatus}
                                    onChange={e => setSelectedStatus(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                >
                                    <option value="">Todos</option>
                                    <option value="true">Ativo</option>
                                    <option value="false">Inativo</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                                <select
                                    id="sort"
                                    value={sortConfig}
                                    onChange={e => setSortConfig(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                >
                                    {SORT_OPTIONS.map(opt => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleResetFilters}
                                className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 ease-in-out shadow-md"
                            >
                                Limpar Filtros
                            </button>
                            <button
                                onClick={handleExportCsv}
                                disabled={isExporting || users.length === 0}
                                className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? 'Exportando...' : 'Exportar CSV'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">Username</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Permissão</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Projetos</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider rounded-tr-lg">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading && <tr><td colSpan="6" className="text-center py-10 text-lg text-blue-500">Carregando usuários...</td></tr>}
                                {error && <tr><td colSpan="6" className="text-center py-10 text-lg text-red-500 font-semibold">{error}</td></tr>}
                                {!loading && !error && users.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10 text-lg text-gray-500">Nenhum usuário encontrado com os filtros aplicados.</td>
                                    </tr>
                                )}
                                {!loading && !error && users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-100 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.projects?.map(p => p.project_name).join(', ') || 'Nenhum'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => navigate(`/admin/manage-users/edit-user/${user.id}`)}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${user.is_active ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out`}
                                            >
                                                {user.is_active ? 'Desativar' : 'Ativar'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.username)}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                                            >
                                                Deletar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}