import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usericon from './user icon.png';
import settingsicon from './settings icon.png';
import logo from './wysupp-logo.svg';
import AccountInfo from './AccountInfo';

function ProtectedPageCustomer() {
    const username = localStorage.getItem('username');
    const [role, setRole] = useState('');

    let settings_open = false;

    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    function openSettings() {
        if (!settings_open) {
            document.getElementsByClassName('settings_section')[0].style.visibility = "visible";
            settings_open = true;
        } else {
            document.getElementsByClassName('settings_section')[0].style.visibility = "hidden";
            settings_open = false;
        }
    }

    function changePassword() {
        navigate("/change-password");
    }

    function checkConnectedDevices() {
        navigate("/connected-devices");
    }

    function loginHistory() {
        navigate("/login-history");
    }

    function disable2FA() {
        navigate("/disable-2fa");
    }

    useEffect(() => {
        const fetchUserRole = async () => {
            const getUserRole = async () => {
                const user_response = await fetch(`${apiUrl}/users/${username}`, {
                    method: 'GET',
                })

                if (user_response.ok) {
                    const user_data = await user_response.json();
                    setRole(user_data.role);
                    console.log("user role: " + user_data.role);
                }
            }

            getUserRole()
        }

        fetchUserRole()
    }, []);

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
        <div className='body'>
            <div className='cliente_home'>
                <div className='cliente_home_main'>
                    <img src={logo} alt="logo" />
                    <h3>Welcome, {username}</h3>
                    <button className='main_menu_button'>Deadline Schedule</button>
                    <button className='main_menu_button'>RELEX Standard Interfaces</button>
                    <button className='main_menu_button'>Pre-requisites per Interface</button>
                    {(role === "admin" || role === "editor") && role !== "" && (
                        <button className='main_menu_button'>Interface Management</button>
                    )}
                    {(role === "admin" || role === "editor") && role !== "" && (
                        <button className='main_menu_button' onClick={() => navigate('/interface-upload')}>Upload Interfaces to Validate</button>
                    )}
                    <button className='main_menu_button'>Interface Validation Status and Delivery Control</button>
                    <button className='main_menu_button'>General KPIs - Dashboard</button>
                </div>
                <div className='cliente_home_deco'>
                    <AccountInfo username={username} />
                </div>
            </div>
        </div>
    )
}

export default ProtectedPageCustomer;