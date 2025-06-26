import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import logo from './wysupp-logo.svg';

function OTPVerification() {
    const [otp, setOtp] = useState('');

    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleSubmit = async (event) => {
      event.preventDefault();
      const username = localStorage.getItem('username');
  
      const requestBody = {
          username: username,
          otp: otp,
      };

      const user_response = await fetch(`${apiUrl}/users/${username}`, {
        method: 'GET',
    })  
    
        if (user_response.ok) {
            const user_data = await user_response.json();

            await fetch(`${apiUrl}/verify-2fa/${username}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })
            .then((res) => {
                if (res.ok) {
                    if (user_data.role == "admin") {
                        navigate('/admin');
                    } else if (user_data.role == "editor" || user_data.role == "viewer") {
                        navigate('/home');
                    }
                } else {
                    alert("Invalid OTP. Please try again.");
                }
            })
            .catch((error) => console.error("Error verifying OTP:", error));
        }
    }

  return (
    <div className="connected_devices_body">
        <header className='connected_devices_header'>
            <div className='back_button' onClick={() => window.history.back()}>◄ Back</div>
            <img src={logo} />
        </header>
        <form className="login_form" onSubmit={handleSubmit}>
            <h3 style={{ color: "#16362e" }}>Enter the code sent to Authentication App</h3>
            <div className="input_container">
                <input
                    type="text"
                    placeholder="OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                />
            </div>
            <button type="submit" className="login_button">Verify OTP</button>
        </form>
    </div>
  );
};

export default OTPVerification;