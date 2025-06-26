import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from './AdminHeader';

const AVAILABLE_ROLES = [
    { key: 'admin', label: 'Admin' },
    { key: 'editor', label: 'Editor' },
    { key: 'viewer', label: 'Viewer' },
];

export default function EditUserListPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // --- Estados para os Filtros ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [projects, setProjects] = useState([]);

    // --- Estados para Autocomplete ---
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimeoutRef = useRef(null); // Ref para o timeout do debounce

    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    // Função para buscar os projetos disponíveis
    const fetchProjects = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/projects`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch projects.');
            }

            const data = await response.json();
            setProjects(data || []);
        } catch (err) {
            console.error("Error fetching projects:", err);
        }
    }, [apiUrl]);

    // Função para buscar os usuários da API, com filtros
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        try {
            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.append('search', searchTerm);
            if (selectedRole) queryParams.append('role', selectedRole);
            if (selectedProject) queryParams.append('project', selectedProject);

            const response = await fetch(`${apiUrl}/api/users?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if(response.status === 401) navigate('/');
                throw new Error('Failed to fetch users or you do not have permission.');
            }

            const data = await response.json();
            setUsers(data || []);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, searchTerm, selectedRole, selectedProject, navigate]);

    // --- Função para buscar sugestões de autocomplete ---
    const fetchSuggestions = useCallback(async (currentSearchTerm) => {
        if (currentSearchTerm.length < 2) { // Não busca sugestões para termos muito curtos
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('search', currentSearchTerm);
            queryParams.append('limit', 10); // Limita o número de sugestões

            const response = await fetch(`${apiUrl}/api/users?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                console.error('Failed to fetch suggestions.');
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            const data = await response.json();
            // Filtrar para garantir que apenas username ou email sejam mostrados
            const uniqueSuggestions = Array.from(new Set(
                data.flatMap(user => [user.username, user.email]) // Pega username e email
                                .filter(item => item && item.toLowerCase().includes(currentSearchTerm.toLowerCase()))
            )).slice(0, 10); // Garante um limite de 10 sugestões

            setSuggestions(uniqueSuggestions);
            setShowSuggestions(uniqueSuggestions.length > 0);

        } catch (err) {
            console.error("Error fetching suggestions:", err);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [apiUrl]);

    // Efeito para debounce da busca de sugestões
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        if (searchTerm) {
            debounceTimeoutRef.current = setTimeout(() => {
                fetchSuggestions(searchTerm);
            }, 300); // Debounce de 300ms
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchTerm, fetchSuggestions]);

    // Efeitos para carregar dados
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Função para deletar um usuário
    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to delete the user ${username}? This action cannot be undone.`)) {
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete the user.');
            }
            
            alert('User deleted successfully!');
            fetchUsers();
        } catch(err) {
            alert(err.message);
            console.error(err);
        }
    };

    // Função para Exportar para CSV
    const handleExportCsv = () => {
        setIsExporting(true);
        try {
            const headers = ["Username", "Email", "Permission level", "Projects"];
            
            const csvRows = users.map(user => {
                const permissionLevel = AVAILABLE_ROLES.find(r => r.key === user.role)?.label || user.role;
                
                const projectsList = user.projects && user.projects.length > 0
                    ? user.projects.map(p => (typeof p === 'string' ? p : p.project_name)).join(', ')
                    : "Nenhum";
                
                const escapeCsv = (value) => {
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                };

                return [
                    escapeCsv(user.username),
                    escapeCsv(user.email),
                    escapeCsv(permissionLevel),
                    escapeCsv(projectsList)
                ].join(',');
            });

            const csvContent = [
                headers.join(','),
                ...csvRows
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'users_filtered.csv');

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (err) {
            console.error("Error exporting CSV:", err);
        } finally {
            setIsExporting(false);
        }
    };

    // Função para lidar com a seleção de sugestão
    const handleSelectSuggestion = (suggestion) => {
        setSearchTerm(suggestion); // Define o termo de busca com a sugestão
        setShowSuggestions(false); // Esconde as sugestões
        fetchUsers(); // Dispara uma nova busca de usuários com o termo completo
    };

    // Função para ocultar sugestões ao clicar fora
    const handleBlur = () => {
        // Usa um pequeno atraso para permitir que o clique em uma sugestão seja registrado antes de ocultar
        setTimeout(() => {
            setShowSuggestions(false);
        }, 100);
    };

    // --- NOVA FUNÇÃO: Resetar Filtros ---
    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedRole('');
        setSelectedProject('');
        setSuggestions([]); // Limpa as sugestões de autocomplete
        setShowSuggestions(false); // Esconde as sugestões
        // fetchUsers será chamado automaticamente pelo useEffect que depende de searchTerm, selectedRole e selectedProject
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <AdminHeader page="Edit Users" />
            
            <main className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-700 mb-6">User Filters</h2>
                    
                    {/* --- Seção de Filtros --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative">
                        <div className="relative"> {/* Wrapper para o input de busca e sugestões */}
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="p-2 border rounded-md w-full"
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    // Mostra sugestões imediatamente ao digitar, se houver termo
                                    setShowSuggestions(e.target.value.length > 0); 
                                }}
                                onFocus={() => searchTerm.length > 0 && suggestions.length > 0 && setShowSuggestions(true)}
                                onBlur={handleBlur}
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                    {suggestions.map((suggestion, index) => (
                                        <li
                                            key={index}
                                            className="p-2 cursor-pointer hover:bg-gray-100"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelectSuggestion(suggestion);
                                            }}
                                        >
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <select 
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Filter by Permissions...</option>
                            {AVAILABLE_ROLES.map(r => (
                                <option key={r.key} value={r.key}>{r.label}</option>
                            ))}
                        </select>
                        <select
                            value={selectedProject}
                            onChange={e => setSelectedProject(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Filter by Project...</option>
                            {projects.map(project => (
                                <option key={project.project_name} value={project.project_name}>
                                    {project.project_name}
                                </option>
                            ))}
                        </select>
                        {/* Novo botão de Resetar Filtros */}
                        <div className="col-span-full md:col-span-1 flex justify-end md:justify-start mt-4 md:mt-0">
                            <button
                                onClick={handleResetFilters}
                                className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {/* Botão de Exportar CSV */}
                    <div className="mb-6 text-right">
                        <button
                            onClick={handleExportCsv}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isExporting || users.length === 0}
                        >
                            {isExporting ? 'Exporting...' : 'Export to CSV'}
                        </button>
                    </div>

                    {/* --- Tabela de Usuários --- */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600 uppercase">Username</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600 uppercase">Email</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600 uppercase">Permission level</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-600 uppercase">Projects</th>
                                    <th className="p-3 text-center text-sm font-semibold text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading && <tr><td colSpan="5" className="text-center p-4">Loading...</td></tr>}
                                {error && <tr><td colSpan="5" className="text-center p-4 text-red-500">{error}</td></tr>}
                                {!loading && !error && users.length === 0 && (
                                    <tr><td colSpan="5" className="text-center p-4 text-gray-500">No user found that matches the filters.</td></tr>
                                )}
                                {!loading && !error && users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-700">{user.username}</td>
                                        <td className="p-3 text-gray-700">{user.email}</td>
                                        <td className="p-3">
                                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                                {AVAILABLE_ROLES.find(r => r.key === user.role)?.label || user.role}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-700">
                                            {user.projects && user.projects.length > 0 ? (
                                                <ul className="list-disc list-inside">
                                                    {user.projects.map((project, index) => (
                                                        <li key={index}>
                                                            {typeof project === 'string' ? project : project.project_name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                "No projects"
                                            )}
                                        </td>
                                        <td className="p-3 space-x-2 text-center">
                                            <button 
                                                onClick={() => navigate(`/admin/manage-users/edit-user/${user.id}`)}
                                                className="bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-600"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id, user.username)}
                                                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                            >
                                                Delete
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
