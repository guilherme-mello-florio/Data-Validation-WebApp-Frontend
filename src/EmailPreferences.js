import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './wysupp-logo.svg'; // Assuming you have a logo file

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function UserEmailPreferences() {
    const navigate = useNavigate();
    const [projectPreferences, setProjectPreferences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch all project-specific preferences for the user
    const fetchPreferences = useCallback(async (token) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/api/v1/email-preferences/projects`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            const data = await response.json();
            setProjectPreferences(data);
        } catch (err) {
            console.error("Error fetching preferences:", err);
            setError("Could not load your preferences. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchPreferences(token);
    }, [fetchPreferences, navigate]);

    // Handle toggling a checkbox for a specific project
    const handlePreferenceChange = async (projectId, newValue) => {
        const token = localStorage.getItem('token');
        
        // Optimistic UI update for instant feedback
        const originalPreferences = [...projectPreferences];
        setProjectPreferences(prev => 
            prev.map(p => 
                p.project_id === projectId 
                ? { ...p, receber_notificacoes_alteracoes_interface: newValue } 
                : p
            )
        );
        setSuccessMessage(''); // Clear previous success message

        try {
            const response = await fetch(`${apiUrl}/api/v1/email-preferences/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ receber_notificacoes_alteracoes_interface: newValue }),
            });

            if (!response.ok) {
                throw new Error('Failed to save preference.');
            }
            
            // Show a temporary success message
            setSuccessMessage('Preference saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            console.error("Error saving preference:", err);
            setError('Could not save your change. Please try again.');
            // Revert UI to original state on failure
            setProjectPreferences(originalPreferences);
        }
    };

    if (isLoading) {
        return <div className="preferences-loading">Loading preferences...</div>;
    }

    return (
        <div className='preferences-page-body'>
            <header className='preferences-header'>
                <div className='back-button' onClick={() => navigate(-1)}>◄ Back</div>
                <img src={logo} alt="Wysupp Logo" className="header-logo" />
            </header>
            <main className="preferences-container">
                <h1 className="main-title">Email Notification Preferences</h1>
                <p className="main-subtitle">Manage notifications for interface changes for each of your projects.</p>
                
                {error && <p className="feedback-message error-message">{error}</p>}
                {successMessage && <p className="feedback-message success-message">{successMessage}</p>}
                
                <div className="preferences-list">
                    {projectPreferences.length > 0 ? (
                        projectPreferences.map(pref => (
                            <div key={pref.project_id} className="preference-item">
                                <span className="project-name">{pref.project_name}</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={pref.receber_notificacoes_alteracoes_interface}
                                        onChange={(e) => handlePreferenceChange(pref.project_id, e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        ))
                    ) : (
                        <p>You are not assigned to any projects with configurable notifications.</p>
                    )}
                </div>
            </main>
        </div>
    );
}

export default UserEmailPreferences;
