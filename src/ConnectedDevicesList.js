import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './wysupp-logo.svg';

function ProtectedPageCheckConnectedDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');

  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
          setUsername(localStorage.getItem('username'));

          const verifyToken = async () => {
              const token = localStorage.getItem('token');
              try {
                  const response = await fetch(`${apiUrl}/verify-token/${token}`);
  
                  if (!response.ok) {
                      throw new Error('Token verification failed');
                  }
              } catch (error) {
                  localStorage.removeItem('token');
                  navigate('/');
              }
          };
  
          verifyToken();
      }, [navigate]);

  // Função para buscar os dados
  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
        const token = localStorage.getItem("token");
      
        const response = await fetch(`${apiUrl}/api/user/sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      
        if (!response.ok) {
          const text = await response.text();
          console.error("Erro do servidor:", text);
          throw new Error("Erro ao buscar sessões.");
        }
      
        const data = await response.json();
        console.log(data);
        setDevices(data); // ou data, dependendo da estrutura que o backend envia
      } catch (error) {
        console.error("Erro ao carregar dispositivos:", error);
      } finally {
      setLoading(false);
    }
  };

  // Buscar dados quando o componente montar
  useEffect(() => {
    fetchDevices();
  }, []); // Array vazio significa que executa apenas uma vez na montagem

  // Opcional: Função para revogar um dispositivo
  const handleRevokeDevice = async (deviceId) => {
    if (!window.confirm("Tem certeza que deseja desconectar este dispositivo?")) {
        return;
    }
    try {
      // Chamar o endpoint DELETE
      const response = await fetch(`${apiUrl}/api/user/sessions/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
         throw new Error(`Falha ao revogar: ${response.statusText}`);
      }
       // Atualizar a lista após revogar com sucesso
       fetchDevices(); 
       // Ou remova o item diretamente do estado:
       // setDevices(prevDevices => prevDevices.filter(d => d.id !== deviceId));
    } catch (err) {
        alert(`Erro ao desconectar dispositivo: ${err.message}`);
        console.error("Erro ao revogar:", err);
    }
  };

  async function back (){
    const user_response = await fetch(`${apiUrl}/users/${username}`, {
        method: 'GET',
    })  

    if (user_response.ok) {
        const data = await user_response.json();
        console.log(data);
    if (data.role == "admin") {
        navigate('/admin');
    } else if (data.role == "customer") {
        navigate('/home');
  }
    }
}

  if (loading) return <p>Carregando dispositivos...</p>;
  if (error) return <p>Erro ao carregar dispositivos: {error}</p>;

  return (
    <div className='connected_devices_body'>
        <header className='connected_devices_header'>
        <div className='back_button' onClick={back}>◄ Back</div>
            <img src={logo} />
        </header>
      <h2>Connected Devices</h2>
      {devices.length === 0 ? (
        <p>Nenhum outro dispositivo conectado.</p>
      ) : (
        <ul>
          {devices.map((device) => (
            <li key={device.id}>
              <strong>{device.device_info}</strong>
              {device.is_current && <span> (Current session)</span>}
              <br />
              Last activity: {new Date(device.last_active_at).toLocaleString()}
              {device.location && <span> - {device.location}</span>}
              {!device.is_current && ( // Não permitir revogar a sessão atual aqui
                 <button onClick={() => handleRevokeDevice(device.id)} style={{marginLeft: '10px'}}>
                   Disconnect
                 </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProtectedPageCheckConnectedDevices;