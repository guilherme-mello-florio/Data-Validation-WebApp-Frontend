import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Basic inline styles (replace with your preferred styling method if needed)
const styles = {
    container: { maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f9f9f9' },
    title: { marginBottom: '15px', color: '#333' },
    paragraph: { marginBottom: '20px', color: '#555', fontSize: '0.9em' },
    formGroup: { marginBottom: '15px', textAlign: 'left' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#444' },
    input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    button: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em', width: '100%' },
    buttonDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
    message: { marginTop: '15px', color: 'green', fontWeight: 'bold' },
    error: { marginTop: '15px', color: 'red' },
    linkButton: { background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: '10px 0', display: 'block', margin: '10px auto 0 auto' }
};

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch('http://localhost:8000/forgot-password', { // Your backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Even if backend sends generic success on 404,
                // other errors (like 500) should be caught.
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            // Use the message from the backend
            setMessage(data.message || 'Password reset instructions sent.');
            setEmail(''); // Clear field on success

        } catch (err) {
            console.error("Forgot Password Error:", err);
            // Display a user-friendly error
            setError(err.message.includes("Failed to fetch") ? "Network error. Please check your connection." : "An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Forgot Your Password?</h2>
            <p style={styles.paragraph}>
                Enter your email address below, and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label htmlFor="email" style={styles.label}>Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={styles.input}
                        placeholder="you@example.com"
                        disabled={isLoading}
                    />
                </div>

                {message && <p style={styles.message}>{message}</p>}
                {error && <p style={styles.error}>{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{ ...styles.button, ...(isLoading ? styles.buttonDisabled : {}) }}
                >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
            <button onClick={() => navigate('/')} style={styles.linkButton}>
                Back to Login
            </button>
        </div>
    );
}

export default ForgotPassword;
