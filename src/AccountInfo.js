import React from 'react';
import { useNavigate } from 'react-router-dom';
import usericon from './user icon.png';
import settingsicon from './settings icon.png';

function AccountInfo({ username }) {
    const navigate = useNavigate();
    let settings_open = false;

    function openSettings() {
        const settingsSection = document.getElementsByClassName('settings_section')[0];
        if (!settings_open) {
            settingsSection.style.visibility = "visible";
            settings_open = true;
        } else {
            settingsSection.style.visibility = "hidden";
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

    function emailPreferences() {
        navigate("/email-preferences");
    }

    return (
        <div>
            <div className='account_info'>
                <div className='account_icon_and_name'>
                    <img src={usericon} className='account_icon' alt="User Icon" />
                    <p className='account_info_name'>{username}</p>
                </div>
                <button className='settings_button'>
                    <img src={settingsicon} className='account_icon' onClick={openSettings} alt="Settings Icon" />
                </button>
            </div>
            <div className='settings_section'>
                <header id='settings_header'>Settings</header>
                <div id='settings_content'>
                    <div className='settings_change_password' onClick={changePassword}>Change password</div>
                    <div className='settings_change_password' onClick={checkConnectedDevices}>Check connected devices</div>
                    <div className='settings_change_password' onClick={loginHistory}>Login history</div>
                    <div className='settings_change_password' onClick={emailPreferences}>E-mail Preferences</div>
                    <div id='languages_dropdown'>Choose Language ▼
                        <div className='languages_dropdown_content'>
                            <p>Nothing here yet!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AccountInfo;