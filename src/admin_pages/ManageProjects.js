import AdminHeader from "./AdminHeader"
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ManageProjects(){

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

    function createproject(){
        navigate('/admin/manage-projects/create-project')
    }

    function editproject(){
        navigate('/admin/manage-projects/edit-project')
    }

    return(
        <div className="manage_users_body">
            <AdminHeader page="Manage Projects"/>
            <main className="manage_users_main">
                <button className="manage_buttons" onClick={createproject}>Create Project</button>
                <button className="manage_buttons" onClick={editproject}>Edit Project</button>
            </main>
        </div>
    )
}