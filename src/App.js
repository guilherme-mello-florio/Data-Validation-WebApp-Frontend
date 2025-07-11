import React, { useRef, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import ProtectedPageAdmin from './AdminHome';
import ProtectedPageCustomer from './Home';
import ProtectedPageChangePassword from './ChangePassword';
import ProtectedPageCheckConnectedDevices from './ConnectedDevicesList';
import ProtectedPageLoginHistory from './LoginHistory';
import UserEmailPreferences from './EmailPreferences';
import TwoFactorSetup from './2faSetup';
import OTPVerification from './OTPVerification';
import Disable2FA from './Disable2FA';
import AdminDashboard from './admin_pages/AdminDashboard';
import ManageUsers from './admin_pages/ManageUsers';
import ManageProjects from './admin_pages/ManageProjects';
import Monitoring from './admin_pages/Monitoring';
import CreateUser from './admin_pages/CreateUser';
import CreateProject from './admin_pages/CreateProject';
import EditUserListPage from './admin_pages/EditUserListPage';
import EditUserFormPage from './admin_pages/EditUserFormPage';
import EditProjectListPage from './admin_pages/EditProjectListPage';
import EditProjectFormPage from './admin_pages/EditProjectFormPage';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import InterfaceUploadPage from './InterfaceUpload';

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

      const apiUrl = process.env.REACT_APP_API_URL;

      const response = await fetch(`${apiUrl}/logs/`, {   
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
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/manage-users" element={<ManageUsers />} />
        <Route path="/admin/manage-users/create-user" element={<CreateUser />} />
        <Route path="/admin/manage-users/edit-user" element={<EditUserListPage />} />
        <Route path='/admin/manage-users/edit-user/:userId' element={<EditUserFormPage />}/>
        <Route path="/admin/manage-projects" element={<ManageProjects />} />
        <Route path="/admin/manage-projects/create-project" element={<CreateProject />} />
        <Route path="/admin/manage-projects/edit-project" element={<EditProjectListPage />} />
        <Route path='/admin/manage-projects/edit-project/:projectId' element={<EditProjectFormPage />}/>
        <Route path="/admin/monitoring" element={<Monitoring />} />
        <Route path="/home" element={<ProtectedPageCustomer />} />
        <Route path="/interface-upload" element={<InterfaceUploadPage />} />
        <Route path="/change-password" element={<ProtectedPageChangePassword />} />
        <Route path="/connected-devices" element={<ProtectedPageCheckConnectedDevices />} />
        <Route path="/login-history" element={<ProtectedPageLoginHistory />} />
        <Route path="/email-preferences" element={<UserEmailPreferences />} />
        <Route path="/2fa-setup" element={<TwoFactorSetup />} />
        <Route path="/otp-verification" element={<OTPVerification />}/>
        <Route path="/disable-2fa" element={<Disable2FA />}/>
        <Route path="/disable-2fa" element={<AdminDashboard />}/>
        <Route path="/disable-2fa" element={<ManageUsers />}/>
        <Route path="/disable-2fa" element={<ManageProjects />}/>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;