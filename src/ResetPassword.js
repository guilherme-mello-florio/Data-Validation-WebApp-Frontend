import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Reusing styles from ForgotPassword for consistency
const styles = {
    container: { maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f9f9f9' },
    title: { marginBottom: '15px', color: '#333' },
    formGroup: { marginBottom: '15px', textAlign: 'left' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#444' },
    input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    button: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em', width: '100%' },
    buttonDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
    message: { marginTop: '15px', color: 'green', fontWeight: 'bold' },
    error: { marginTop: '15px', color: 'red' },
    linkButton: { background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: '10px 0', display: 'block', margin: '10px auto 0 auto' }
};

function ResetPassword() {
    const { token } = useParams(); // Get token from URL
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid password reset link. No token provided.');
            // Consider navigating away if token is definitely missing
            // setTimeout(() => navigate('/login'), 3000);
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!token) {
            setError('Missing reset token.');
            return;
        }
        if (password.length < 8) {
             setError('Password must be at least 8 characters long.');
             return;
        }


        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch('http://localhost:8000/reset-password', { // Your backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token, new_password: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            setMessage(data.message || 'Password reset successfully!');
            setPassword('');
            setConfirmPassword('');
            // Redirect to login after a short delay
            setTimeout(() => navigate('/'), 3000); // Navigate to login ('/')

        } catch (err) {
            console.error("Reset Password Error:", err);
             setError(err.message.includes("Failed to fetch") ? "Network error." : (err.message || 'Failed to reset password. The link may be invalid or expired.'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!token && !error) {
        // Handle case where token is missing but useEffect hasn't run yet or set error
        return <div style={styles.container}><p style={styles.error}>Loading or invalid link...</p></div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Reset Your Password</h2>
            {/* Show form only if no success message */}
            {!message && (
                 <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label htmlFor="password" style={styles.label}>New Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="8"
                            style={styles.input}
                            placeholder="Enter new password (min 8 chars)"
                            disabled={isLoading}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="confirmPassword" style={styles.label}>Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="Confirm new password"
                            disabled={isLoading}
                        />
                    </div>

                    {error && <p style={styles.error}>{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ ...styles.button, ...(isLoading ? styles.buttonDisabled : {}) }}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}
            {/* Show success message */}
            {message && <p style={styles.message}>{message}</p>}

            {/* Always show back to login button, maybe hide if successful and redirecting */}
            {!message && (
                 <button onClick={() => navigate('/')} style={styles.linkButton}>
                    Back to Login
                 </button>
             )}
        </div>
    );
}

export default ResetPassword;
