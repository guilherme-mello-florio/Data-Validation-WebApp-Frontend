import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from './AdminHeader'; // Certifique-se de que este componente está disponível

export default function EditProjectListPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/'); // Redireciona se não estiver logado
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/projects/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 401) navigate('/');
                const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido.' }));
                throw new Error(errorData.detail || 'Falha ao buscar projetos ou você não tem permissão.');
            }

            const data = await response.json();
            setProjects(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, navigate]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            <AdminHeader page="Edit Projects" />
            <main className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-8 text-center">Manage Projects</h2>
                    
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={() => navigate('/admin/manage-projects/create-project')}
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out shadow-md"
                        >
                            Create New Project
                        </button>
                    </div>

                    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">Project Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Project Users</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading && <tr><td colSpan="4" className="text-center py-10 text-lg text-blue-500">Loading projects...</td></tr>}
                                {error && <tr><td colSpan="4" className="text-center py-10 text-lg text-red-500 font-semibold">{error}</td></tr>}
                                {!loading && !error && projects.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-lg text-gray-500">No projects found.</td>
                                    </tr>
                                )}
                                {!loading && !error && projects.map(project => (
                                    <tr key={project.id} className="hover:bg-gray-100 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.project_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {project.project_users && project.project_users.length > 0
                                                ? project.project_users.map(pu => pu.username).join(', ')
                                                : 'No user'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {/* Supondo que você tenha um campo 'is_active' no seu modelo Project para o status */}
                                            {/* Se não tiver, você pode adicionar um ou remover esta coluna */}
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                Active {/* Ou 'Inativo' se você adicionar um campo de status */}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/admin/manage-projects/edit-project/${project.id}`)}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                                            >
                                                Edit
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
