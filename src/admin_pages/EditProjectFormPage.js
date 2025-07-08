import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminHeader from './AdminHeader'; // Certifique-se de que este componente está disponível

// Definição de todas as interfaces disponíveis (igual à página de criação)
const INTERFACES = [
    { key: 'historical_sales', label: 'Historical Sales' },
    { key: 'historical_campaigns', label: 'Historical Campaigns' },
    { key: 'historical_product_location_campaigns', label: 'Historical Product Location Campaigns' },
    { key: 'historical_production_material_issues_and_receipts', label: 'Historical Production Material Issues and Receipts' },
    { key: 'sales', label: 'Sales' },
    { key: 'balances', label: 'Balances' },
    { key: 'batch_balances', label: 'Batch Balances' },
    { key: 'customer_orders', label: 'Customer Orders' },
    { key: 'distribution_orders', label: 'Distribution Orders' },
    { key: 'purchase_orders', label: 'Purchase Orders' },
    { key: 'distribution_links', label: 'Distribution Links' },
    { key: 'locations', label: 'Locations' },
    { key: 'product_groups', label: 'Product Groups' },
    { key: 'product_structure_routings', label: 'Product Structure Routings' },
    { key: 'product_structures', label: 'Product Structures' },
    { key: 'production_capacities', label: 'Production Capacities' },
    { key: 'production_order_operations', label: 'Production Order Operations' },
    { key: 'end_customers', label: 'End Customers' },
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'product_location_campaigns', label: 'Product Location Campaigns' },
    { key: 'product_replacements', label: 'Product Replacements' },
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'purchase_capacities', label: 'Purchase Capacities' },
    { key: 'distribution_resources', label: 'Distribution Resources' },
    { key: 'production_orders', label: 'Production Orders' },
    { key: 'production_resources', label: 'Production Resources' },
    { key: 'production_shift_patterns', label: 'Production Shift Patterns' },
    { key: 'product_locations', label: 'Product Locations' },
    { key: 'products', label: 'Products' },
    { key: 'stock_areas', label: 'Stock Areas' },
    { key: 'output_demand_plans', label: 'Output Demand Plans' },
    { key: 'output_distribution_requisitions', label: 'Output Distribution Requisitions' },
    { key: 'output_purchase_requisitions', label: 'Output Purchase Requisitions' },
    { key: 'output_planned_production_orders', label: 'Output Planned Production Orders' },
    { key: 'output_production_order_changes', label: 'Output Production Order Changes' },
];

export default function EditProjectFormPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    const [projectName, setProjectName] = useState('');
    const [interfaces, setInterfaces] = useState({});
    const [initialData, setInitialData] = useState(null); // Para controlar o carregamento e comparar alterações
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Efeito para buscar os dados do projeto
    useEffect(() => {
        if (!projectId) {
            setError("ID do projeto não fornecido na URL.");
            setLoading(false);
            return;
        }

        const fetchProjectData = async () => {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }

            try {
                const response = await fetch(`${apiUrl}/api/projects/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido.' }));
                    throw new Error(errorData.detail || `Erro ao buscar projeto: ${response.status}`);
                }

                const projectData = await response.json();
                
                setProjectName(projectData.project_name);
                
                // Popula o estado das interfaces com base nos dados do projeto
                const loadedInterfaces = {};
                INTERFACES.forEach(int => {
                    loadedInterfaces[int.key] = projectData[int.key] || false;
                });
                setInterfaces(loadedInterfaces);
                setInitialData(projectData); // Guarda os dados originais para comparação

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProjectData();
    }, [projectId, apiUrl, navigate]);

    // Função para lidar com a mudança dos checkboxes
    const handleInterfaceChange = (key) => {
        setInterfaces(prevInterfaces => ({
            ...prevInterfaces,
            [key]: !prevInterfaces[key] 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage('');

        const token = localStorage.getItem('token');
        if (!token) {
            setError("Você não está autenticado. Por favor, faça login novamente.");
            setLoading(false);
            navigate('/');
            return;
        }

        if (!projectName.trim()) {
            setError("O nome do projeto não pode ser vazio.");
            setLoading(false);
            return;
        }

        // Constrói o payload de atualização, incluindo apenas os campos alterados
        const updatedProjectData = {};
        if (projectName !== initialData.project_name) {
            updatedProjectData.project_name = projectName;
        }

        // Compara cada interface com o estado inicial
        INTERFACES.forEach(int => {
            if (interfaces[int.key] !== initialData[int.key]) {
                updatedProjectData[int.key] = interfaces[int.key];
            }
        });

        if (Object.keys(updatedProjectData).length === 0) {
            setError("Nenhuma alteração foi feita.");
            setLoading(false);
            return;
        }
        
        try {
            const response = await fetch(`${apiUrl}/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updatedProjectData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido.' }));
                throw new Error(errorData.detail || `Falha ao atualizar o projeto: ${response.status}`);
            }

            const result = await response.json();
            setSuccessMessage(`Projeto "${result.project_name}" atualizado com sucesso!`);
            setInitialData(result); // Atualiza os dados iniciais com a resposta do servidor
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8 text-lg text-blue-500">Loading project data...</div>;
    }

    if (error) {
        return <div className="p-4 m-4 bg-red-100 text-red-700 rounded-md text-center">Error: {error}</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            <AdminHeader page={`Edit Project: ${initialData?.project_name || ''}`} />
            <main className="p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
                    <h2 className="text-3xl font-extrabold text-gray-800 mb-8 text-center">Edit Project</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
                        {successMessage && <div className="p-3 bg-green-100 text-green-700 rounded-md">{successMessage}</div>}

                        {/* Campo de Nome do Projeto */}
                        <div>
                            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                            <input
                                type="text"
                                id="projectName"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                placeholder="Enter project name"
                                required
                            />
                        </div>

                        {/* Seção de Interfaces */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-4 mt-6">Select Project Interfaces</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                {INTERFACES.map(int => (
                                    <div key={int.key} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={int.key}
                                            checked={interfaces[int.key] || false}
                                            onChange={() => handleInterfaceChange(int.key)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor={int.key} className="ml-2 block text-sm text-gray-900 cursor-pointer">
                                            {int.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex justify-end space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/manage-projects')} 
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition duration-200"
                            >
                                Back to Project List
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Save Alterations'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
