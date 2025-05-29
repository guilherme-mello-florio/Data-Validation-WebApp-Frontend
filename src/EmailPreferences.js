import { useNavigate } from 'react-router-dom';
import logo from './wysupp-logo.svg';
import React, { useState, useEffect, useCallback } from 'react';

const apiUrl = process.env.REACT_APP_API_URL;
const API_URL = `${apiUrl}/api/v1/email-preferences`;

function UserEmailPreferences() {
    const [preferences, setPreferences] = useState({
        receber_notificacoes_alteracoes_interface: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Função para buscar as preferências usando fetch
    const fetchPreferences = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token'); // Exemplo
            
            const response = await fetch(API_URL, {
                method: 'GET', // Opcional para GET, mas bom para clareza
                headers: {
                    'Authorization': `Bearer ${token}`, // Ajuste conforme seu método de auth
                },
            });

            // fetch não lança erro para status HTTP como 4xx ou 5xx, então verificamos manualmente
            if (!response.ok) {
                // Criamos um erro para ser pego pelo bloco catch
                const error = new Error(`Erro HTTP: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            // Precisamos extrair o corpo da resposta como JSON
            const data = await response.json();

            if (data) {
                setPreferences({
                    receber_notificacoes_alteracoes_interface: data.receber_notificacoes_alteracoes_interface,
                });
            }
        } catch (err) {
            console.error("Erro ao buscar preferências:", err);
            setError("Não foi possível carregar suas preferências. Tente novamente mais tarde.");
            
            // Verificamos o status do erro que criamos
            if (err.status === 404) {
                 console.log("Nenhuma preferência encontrada, usando defaults.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    const handleCheckboxChange = (event) => {
        const { name, checked } = event.target;
        setPreferences(prevPreferences => ({
            ...prevPreferences,
            [name]: checked,
        }));
        setSuccessMessage('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            const token = localStorage.getItem('token'); // Exemplo
            
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`, // Ajuste conforme seu método de auth
                    'Content-Type': 'application/json', // Essencial para enviar JSON
                },
                // O corpo da requisição precisa ser convertido para uma string JSON
                body: JSON.stringify(preferences),
            });

            if (!response.ok) {
                const error = new Error(`Erro HTTP: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            // Mesmo que não usemos a resposta, é uma boa prática consumi-la
            await response.json(); 
            
            setSuccessMessage('Preferências salvas com sucesso!');
        } catch (err) {
            console.error("Erro ao salvar preferências:", err);
            setError('Não foi possível salvar suas preferências. Tente novamente.');
            fetchPreferences(); // Recarrega as preferências originais em caso de erro
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !preferences.user_id) {
        return <p>Carregando preferências...</p>;
    }

return (
    <div className='connected_devices_body'>
        <header className='connected_devices_header'>
                <div className='back_button' onClick={() => window.history.back()}>◄ Back</div>
                    <img src={logo} />
        </header>
        <h2>Preferências de E-mail</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            name="receber_notificacoes_alteracoes_interface"
                            checked={preferences.receber_notificacoes_alteracoes_interface}
                            onChange={handleCheckboxChange}
                            disabled={isLoading}
                        />
                        Receber notificações de alterações na interface
                    </label>
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : 'Salvar Preferências'}
                </button>
            </form>
    </div>
);
}

export default UserEmailPreferences;