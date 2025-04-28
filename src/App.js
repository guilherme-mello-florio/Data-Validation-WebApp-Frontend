import React, { useRef, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import ProtectedPageAdmin from './AdminHome';
import ProtectedPageCustomer from './Home';
import ProtectedPageChangePassword from './ChangePassword';
import ProtectedPageCheckConnectedDevices from './ConnectedDevicesList';
import ProtectedPageLoginHistory from './LoginHistory';
import TwoFactorSetup from './2faSetup';
import OTPVerification from './OTPVerification';
import Disable2FA from './Disable2FA';

function App() {
  useEffect(() => {
    document.addEventListener("mousemove", () => {
      localStorage.setItem('LastActivity', new Date());
    })
    document.addEventListener("click", () => {
      localStorage.setItem('LastActivity', new Date());
    })
  }, [])
  
  const autoLogoutDetails = {
    log_description: "User has been logged out due to inactivity at " + new Date(),
    user_username: localStorage.getItem('username'),
  };

  console.log(autoLogoutDetails);

  let timeInterval = setInterval(async () => {
    const lastActivity = new Date(localStorage.getItem('LastActivity'));
    const currentTime = new Date();
    const timeDiff = Math.abs(currentTime - lastActivity) / 1000; // in seconds

    if (timeDiff > 3300 && localStorage.getItem('username')) { // 55 minutes
      window.alert("You are inactive, want to remain logged in?");
      console.log("rodou");
    }

    if (timeDiff > 3600 && localStorage.getItem('username')) { // 60 minutes
      alert('User automatizally logged off.');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      clearInterval(timeInterval);

      const response = await fetch('http://localhost:8000/logs/', {   
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(autoLogoutDetails),
    });
    
    if (response.ok) {
        console.log('Logout details sent successfully');
    } else {
        console.error('Failed to send logout details:', await response.json());
    }

      window.location.reload();
    }
  }, 10000);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<ProtectedPageAdmin />} />
        <Route path="/home" element={<ProtectedPageCustomer />} />
        <Route path="/change-password" element={<ProtectedPageChangePassword />} />
        <Route path="/connected-devices" element={<ProtectedPageCheckConnectedDevices />} />
        <Route path="/login-history" element={<ProtectedPageLoginHistory />} />
        <Route path="/2fa-setup" element={<TwoFactorSetup />} />
        <Route path="/otp-verification" element={<OTPVerification />}/>
        <Route path="/disable-2fa" element={<Disable2FA />}/>
      </Routes>
    </Router>
  );
}

export default App;