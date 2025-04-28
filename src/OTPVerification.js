import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import logo from './wysupp-logo.svg';

function OTPVerification() {
    const [otp, setOtp] = useState('');

    const navigate = useNavigate();

    function back (){
        navigate('/2fa-setup');
    }

    function handleSubmit(event) {
      event.preventDefault();
      const username = localStorage.getItem('username');
  
      const requestBody = {
          username: username,
          otp: otp,
      };
  
      fetch('http://localhost:8000/verify-2fa/' + username, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
      })
      .then((res) => {
          if (res.ok) {
              navigate('/home');
          } else {
              alert("Invalid OTP. Please try again.");
          }
      })
      .catch((error) => console.error("Error verifying OTP:", error));
  }

    //if (user_data.role == "admin") {
    //    navigate('/admin');
    //} else if (user_data.role == "customer") {
    //    navigate('/home');
    //}

  return (
    <div className="connected_devices_body">
        <header className='connected_devices_header'>
            <div className='back_button' onClick={back}>◄ Back</div>
            <img src={logo} />
        </header>
        <form className="login_form" onSubmit={handleSubmit}>
            <h3 style={{ color: "#16362e" }}>Enter the OTP sent to your email</h3>
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