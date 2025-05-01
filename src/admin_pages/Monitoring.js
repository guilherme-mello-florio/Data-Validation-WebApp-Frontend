import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Monitoring(){

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

    return(
        <div>
            <p>essa e o monitoring</p>
        </div>
    )
}