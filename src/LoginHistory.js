import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './wysupp-logo.svg';

function UserLoginLogoutLog() {
  const [logDescriptions, setLogDescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');

  function back (){
    navigate('/home');
  }

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    if (!storedUsername) {
      setError("Nome de usuário não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }
    setUsername(storedUsername);

    if (!token) {
      setError("Token de autenticação não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/logs/login/${storedUsername}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          let errorDetail = `Erro ${response.status}: ${response.statusText}`;
          if (response.status === 404) {
            errorDetail = "Nenhum log de login/logout encontrado para este usuário.";
          } else {
            try {
              const errorData = await response.json();
              errorDetail = errorData.detail || errorDetail;
            } catch (e) {}
          }
          throw new Error(errorDetail);
        }

        const data = await response.json();
        setLogDescriptions(data);

      } catch (err) {
        console.error("Erro ao buscar logs de login/logout:", err);
        setError(err.message || "Falha ao buscar logs.");
      } finally {
        setLoading(false);
      }
    };

    if (storedUsername && token) {
        fetchLogs();
    }

  }, []);

  if (loading) {
    return <p>Carregando logs de login/logout...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Erro: {error}</p>;
  }

  if (logDescriptions.length === 0) {
    return <p>Nenhum log de login ou logout encontrado para o usuário '{username}'.</p>;
  }

  return (
    <div className='connected_devices_body'>
    <header className='connected_devices_header'>
            <div className='back_button' onClick={back}>◄ Back</div>
                <img src={logo} />
    </header>
    <div style={{ fontFamily: 'sans-serif' }}>
      <h2>Login / Logout history for '{username}'</h2>
      <ul style={{ listStyle: 'decimal', paddingLeft: '20px', overflowY: 'auto', maxHeight: '60vh' }}>
        {logDescriptions.map((description, index) => (
          <li key={index} style={{ marginBottom: '8px', padding: '4px', borderBottom: '1px dashed #ccc' }}>
            {description}
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}

export default UserLoginLogoutLog;