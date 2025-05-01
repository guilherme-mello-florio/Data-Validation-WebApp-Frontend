import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usericon from './user icon.png';
import settingsicon from './settings icon.png';
import logo from './wysupp-logo.svg';
import AccountInfo from './AccountInfo';


function ProtectedPageAdmin() {
    const username = localStorage.getItem('username');

    let settings_open = false;

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

    function openSettings(){
        if (!settings_open) {
            document.getElementsByClassName('settings_section')[0].style.visibility = "visible";
            settings_open = true;
        } else {
            document.getElementsByClassName('settings_section')[0].style.visibility = "hidden";
            settings_open = false;
        }
    }

    function changePassword(){
        navigate("/change-password");
    }

    function checkConnectedDevices(){
        navigate("/connected-devices");
    }

    function loginHistory(){
        navigate("/login-history");
    }

    function ManageUsers(){
        navigate("/admin/manage-users");
    }


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
        <div className='body'>
            <div className='cliente_home'>
                <div className='cliente_home_main'>
                    <img src={logo} alt="logo" />
                    <h3>Welcome, {username}</h3>
                    <button className='main_menu_button'>Choose Project ▼</button>
                    <button className='main_menu_button'>Dashboard</button>
                    <button className='main_menu_button' onClick={ManageUsers}>Manage Users</button>
                    <button className='main_menu_button'>Manage Projects</button>
                    <button className='main_menu_button'>Monitoring</button>
                </div>
                <div className='cliente_home_deco'>
                    <AccountInfo username={username} />
                </div>
            </div>
        </div>
    )
}

export default ProtectedPageAdmin;