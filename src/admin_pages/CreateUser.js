import AdminHeader from "./AdminHeader";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatISO } from 'date-fns';

export default function CreateUser() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${apiUrl}/verify-token/${token}`);

                if (!response.ok) {
                    throw new Error('Token verification failed');
                }
            } catch (error) {
                localStorage.removeItem('token');
                navigate('/');
            }
        };

        verifyToken();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const role = formData.get('role');

        const createUserDetails = {
            username: username,
            password: password,
            role: role,
            // Ao criar o usuário, ele é obrigado a resetar a senha
            last_password_change: new Date(2000, 0, 1).toISOString().replace('T', ' ').split('.')[0],
            is_first_login: true,
            secret: "",
            is_2fa_active: true,
            email: email,
        };

        try {
            const response = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(createUserDetails),
            });

            if (response.ok) {
                alert("User created successfully!");

                const createUsertDetails = {
                    log_description: `User has created a new ${role} user (${username}) at ${new Date()}`,
                    user_username: localStorage.getItem('username'),
                };

                // Log password reset attempt
                const log_response = await fetch(`${apiUrl}/logs/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(createUsertDetails),
                });
            } else {
                alert("Failed to create user. Please try again.");
            }
        } catch (error) {
            console.error("Error creating user:", error);
            alert("An error occurred while creating the user.");
        }
    }


    return (
        <div className="manage_users_body">
            <AdminHeader page="Create User" />
            <div className="create_user_main">
                <form className="create_user_form" autoComplete="off" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            autoComplete="new-username" // Evita preenchimento automático
                            placeholder="Username"
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            autoComplete="new-password" // Evita preenchimento automático
                            placeholder="Password"
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            autoComplete="new-email" // Evita preenchimento automático
                            placeholder="Email"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="role">Role:</label>
                        <select id="role" name="role" required>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                        </select>
                    </div>

                    <button type="submit">Create User</button>
                </form>
            </div>
        </div>
    )
}