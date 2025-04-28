/*
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminNavbar } from './Admin';

function ProtectedPageAdmin() {
    const navigate = useNavigate();

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:8000/verify-token/' + token);

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

    return (
        <div>
            <AdminNavbar/>
        </div>
    )
}

export default ProtectedPageAdmin;
*/