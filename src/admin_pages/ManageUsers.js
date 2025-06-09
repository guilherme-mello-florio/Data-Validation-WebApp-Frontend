import AdminHeader from "./AdminHeader"
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ManageUsers(){

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
            }, [navigate, apiUrl]);

    function createuser(){
        navigate('/admin/manage-users/create-user')
    }

    function edituser(){
        navigate('/admin/manage-users/edit-user')
    }

    return(
        <div className="manage_users_body">
            <AdminHeader page="Manage Users"/>
            <main className="manage_users_main">
                <button className="manage_buttons" onClick={createuser}>Create User</button>
                <button className="manage_buttons" onClick={edituser}>Edit User</button>
            </main>
        </div>
    )
}