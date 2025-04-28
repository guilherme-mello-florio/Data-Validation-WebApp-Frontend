import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import logo from './wysupp-logo.svg';

function TwoFactorSetup() {
  const [qrData, setQrData] = useState(null);
  
  const username = localStorage.getItem('username');

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:8000/2fa/setup/${username}`)
      .then((res) => {
        console.log("Response:", res); // Debugging
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("QR Data:", data); // Debugging
        setQrData(data);
      })
      .catch((error) => console.error("Error fetching QR data:", error));
  }, [username]);

  if (!qrData) return <p>Loading...</p>;

  function back (){
    navigate('/');
  }

  function finish2faSetup() {
    if (window.confirm("Are you sure you are done setting up 2FA?")) {

        fetch('http://localhost:8000/2fa/setup/save-secret/' + username + '/' + qrData.secret, {
            method: 'PUT'
            });

        navigate('/otp-verification');
        
        }
    }

  return (
    <div className="connected_devices_body">
        <header className='connected_devices_header'>
            <div className='back_button' onClick={back}>◄ Back</div>
            <img src={logo} />
        </header>
        <h3 style={{ color: "#16362e" }}>First time logging in? Let's set up your 2FA</h3>
        <h2 style={{ color: "#16362e" }}>Scan this QR code with your preferred Authentication App</h2>
        <img style={{ maxHeight: "300px", maxWidth: "300px" }} src={`data:image/png;base64,${qrData.qr_code_base64}`} alt="QR Code" />
        <p style={{ color: "#16362e" }}>Or use this secret: <strong>{qrData.secret}</strong></p>
        <button className="two_factor_authentication_button" onClick={finish2faSetup}>When done, click here</button>
    </div>
  );
};

export default TwoFactorSetup;