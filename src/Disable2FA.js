import React, { useEffect, useState } from "react";
import logo from './wysupp-logo.svg';
import usericon from './user icon.png';
import lockicon from './lock icon.png';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";

function Disable2FA() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [captchaDone, setCaptchaDone] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL;

    let recaptchaRef;

    useEffect(() => {
        const data = localStorage.getItem('login_attempts');
        if (data !== null) setLoginAttempts(JSON.parse(data));
    }, [])

    function onChange(value) {
        setCaptchaDone(true);
    }

    const navigate = useNavigate();

    const validateForm = () => {
        if (!username || !password) {
            setError('Username and password are required');
            return false;
        }
        setError('');
        return true;
    };

    //-----------------------------------------
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (window.confirm('Are you sure you want to disable Two-Factor Authentication? This action cannot be undone.')) {
            if (!validateForm()) return;
        setLoading(true);

        const formDetails = new URLSearchParams();
        formDetails.append('username', username);
        formDetails.append('password', password);

        try {
            const response = await fetch(`${apiUrl}/token`, {   
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formDetails,
            });

            const user_response = await fetch(`${apiUrl}/users/${username}`, {
                method: 'GET',
            })

            await fetch(`${apiUrl}/2fa/disable/${username}`, {
                method: 'PUT',
        })

            setLoading(false);

            if (response.ok && user_response.ok) {

                const user_data = await user_response.json();

                localStorage.setItem('login_attempts', 0);

                // Corpo da criação de log de login
                const autoLogDetails = {
                    log_description: "User has disabled Two-Factor Authentication at " + new Date(),
                    user_username: username,
                };

                // Envio do log de desabilitalçao de 2FA
                const log_response = await fetch(`${apiUrl}/logs/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(autoLogDetails),
                });

                alert('Two-Factor Authentication has been disabled successfully.');
                navigate('/home');

            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Authentication failed!');

                setLoginAttempts(loginAttempts + 1);
                localStorage.setItem('login_attempts', JSON.stringify(loginAttempts));
                console.log(loginAttempts);
            }
        } catch (error) {
            console.log(error);
            setLoading(false);
            console.log(error);
            setError('An error has ocurred. Please try again later.');
        }
    };
        }


    function back() {
        navigate('/home');
    }



    return (
        <div className="connected_devices_body">
            <header className='connected_devices_header'>
                <div className='back_button' onClick={back}>◄ Back</div>
                <img src={logo} />
            </header>
            <h3>Please, authenticate in order to disable Two-Factor Authentication</h3>
            <section className='login_section'>
                {error && <p className='errmsg2fa'>{error}</p>}
                <form className='login_form' onSubmit={handleSubmit}>
                    <section className='login_input'>
                        <img src={usericon} className='input_icon' />
                        <input
                            type="text"
                            id="username"
                            autoComplete="off"
                            placeholder='Username'
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                            required
                        />
                    </section>
                    <section className='login_input'>
                        <img src={lockicon} className='input_icon' />
                        <input
                            type="password"
                            id="password"
                            placeholder='Password'
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            required
                        />
                    </section>
                    {loginAttempts > 2 && <ReCAPTCHA ref={e => { recaptchaRef = e; }} sitekey='6LceJAgrAAAAAAgiDQpgmS6_Wv8jTyphyI-hWdPx' onChange={onChange} />}
                    {!captchaDone && loginAttempts <= 2 && <button className='disable_2fa_button'>Disable 2FA</button>}
                    {captchaDone && <button className='disable_2fa_button'>Disable 2FA</button>}
                </form>
            </section>
        </div>
    );
};

export default Disable2FA;