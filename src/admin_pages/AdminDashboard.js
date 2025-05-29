import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
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

    return (
        <div>
            <p>esse e o dashboard</p>
        </div>
    )
}