import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usericon from './user icon.png';
import settingsicon from './settings icon.png';
import logo from './wysupp-logo.svg';

function ProtectedPageCustomer() {
    const username = localStorage.getItem('username');

    let settings_open = false;

    const navigate = useNavigate();

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

    function disable2FA(){
        navigate("/disable-2fa");
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
                    <button className='main_menu_button'>Deadline Schedule</button>
                    <button className='main_menu_button'>RELEX Standard Interfaces</button>
                    <button className='main_menu_button'>Pre-requisites per Interface</button>
                    <button className='main_menu_button'>Upload Interfaces to Validate</button>
                    <button className='main_menu_button'>Interface Validation Status and Delivery Control</button>
                    <button className='main_menu_button'>General KPIs - Dashboard</button>
                </div>
                <div className='cliente_home_deco'>
                    <div className='account_info'>
                        <div className='account_icon_and_name'>
                            <img src={usericon} className='account_icon' />
                            <p className='account_info_name'>{username}</p>
                        </div>
                        <button className='settings_button'>
                            <img src={settingsicon} className='account_icon' onClick={openSettings}/>
                        </button>
                    </div>
                    <div className='settings_section'>
                        <header id='settings_header'>Settings</header>
                        <div id='settings_content'>
                            <div className='settings_change_password' onClick={changePassword}>Change password</div>
                            <div className='settings_change_password' onClick={checkConnectedDevices}>Check connected devices</div>
                            <div className='settings_change_password' onClick={loginHistory}>Login history</div>
                            <div className='settings_change_password' onClick={disable2FA}>Disable 2FA</div>
                            <div className='languages_dropdown'>Choose Language ▼
                                <div className='languages_dropdown_content'>
                                    <p>Nada aqui ainda!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProtectedPageCustomer;