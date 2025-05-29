import React, { useRef, useState, useEffect, useContext } from 'react';
import logo from './wysupp-logo.svg';
import usericon from './user icon.png';
import lockicon from './lock icon.png';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import TwoFactorSetup from './2faSetup';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [captchaDone, setCaptchaDone] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL;
    let recaptchaRef = useRef(null);

    useEffect(() => {
        const data = localStorage.getItem('login_attempts');
        if (data !== null ) setLoginAttempts(JSON.parse(data));
    }, [])

    function onChange(value) {
        setCaptchaDone(!!value);
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

    const forgot_password = () => {
        navigate('/forgot-password');
    }

//-----------------------------------------
    const handleSubmit = async (event) => {
        event.preventDefault();
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

            setLoading(false);

            if (response.status === 403) {
                localStorage.setItem('username', username);
                alert('Your password has expired. Please change your password.');
                window.location.href = '/change-password';
            }

            if (response.status === 429) {
                const userIp = await fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => data.ip)
                .catch(() => 'unknown IP');

                const loginBlockDetails = {
                    log_description: `Login has been blocked by multiple failed login attempts at ${new Date()} from IP address: ${userIp}`,
                    user_username: username,
                  };

                const log_response = await fetch(`${apiUrl}/logs/`, {   
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loginBlockDetails),
                });
            }

            if (response.ok && user_response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);

                const user_data = await user_response.json();

                localStorage.setItem('login_attempts', 0);

                // Corpo da criação de log de login
                const autoLoginDetails = {
                    log_description: "User has logged in at " + new Date(),
                    user_username: username,
                  };

                // Envio do log de login
                const log_response = await fetch(`${apiUrl}/logs/`, {   
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(autoLoginDetails),
                });

                localStorage.setItem('username', username);

                if (user_data.is_first_login == true) {
                    navigate('/2fa-setup');
                } else if (user_data.is_2fa_active == false) {
                    navigate('/home');
                } else {
                    navigate('/otp-verification');
                    return;
                }
                
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Authentication failed!');

                setLoginAttempts(loginAttempts + 1);
                localStorage.setItem('login_attempts', JSON.stringify(loginAttempts));
                console.log(loginAttempts);

                if (loginAttempts >= 2 && recaptchaRef.current) { // Check ref exists
                    recaptchaRef.current.reset();
                    setCaptchaDone(false);
                }
            } 
        } catch (error) {
            console.log(error);
            setLoading(false);
            setError('An error has ocurred. Please try again later.');
        }
    };

    return (
        <div className='body'>
            <div className='login_deco'>
                <img src={logo} alt="logo" />
            </div>
            <div className='login_body'>
                <div>
                    <center>
                        <h1>Welcome</h1>
                        <h5>Please, Log in to continue</h5>
                    </center>
                </div>
                <section className='login_section'>
                    {error && <p className='errmsg'>{error}</p>}
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
                        <section  className='login_input'>
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
                        <div className='forgot_password' onClick={forgot_password}>Forgot your password?</div>
                        {loginAttempts >= 3 && <ReCAPTCHA ref={recaptchaRef} sitekey='6LceJAgrAAAAAAgiDQpgmS6_Wv8jTyphyI-hWdPx' onChange={onChange} />}
                        {!captchaDone && loginAttempts <= 2 && <button className='login_button'>Login</button>}
                        {captchaDone && <button className='login_button'>Login</button>}
                    </form>
                </section>
            </div>
        </div>
    )
}

//<TwoFactorSetup username={username} qrData={qr_data} />

export default Login