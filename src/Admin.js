/*
import logo from './wysupp-logo.svg';
import React, { useRef, useState, useEffect, useContext } from 'react';
import AdminHome from './admin_pages/AdminHome';
import CreateUser from './admin_pages/CreateUser';
import ManageUsers from './admin_pages/ManageUsers';
import AdminAccount from './admin_pages/Account';
import ConnectedDevicesList from './ConnectedDevicesList';

export function AdminNavbar(){
    const [component, setComponent] = useState('');
    const [project, setProject] = useState('(No project selected)');
    const [projects, setProjects] = useState(null);

    function navigate_home() {
        setComponent(<AdminHome />);
    }
    
    function navigate_create_user() {
        setComponent(<CreateUser />);
    }

    function navigate_manage_users() {
        setComponent(<ManageUsers />);
    }

    function navigate_admin_account() {
        setComponent(<AdminAccount />);
    }


    useEffect(() => {
        fetch('http://localhost:8000/projects')
        .then(response => {
            return response.json();
        })
        .then((data) => {
            setProjects(data);
        });
    }, []);




// { projects && Object.entries(projects).map(([key, value]) => <option className='nav_button' key={key}>{value}</option>) }

    return (
        <div className='body_admin'>
            <nav>
                <img className='nav_logo' src={logo} alt="logo" />
                <div className='nav_separator' />
                <button className='nav_button' onClick={navigate_home}>
                    Home
                </button>
                <button className='nav_button' onClick={navigate_create_user}>
                    Create User
                </button>
                <button className='nav_button' onClick={navigate_manage_users}>
                    Manage Users
                </button>
                <button className='nav_button' onClick={navigate_admin_account}>
                    Add Project
                </button>
                <button className='nav_button' onClick={navigate_admin_account}>
                    Edit Project
                </button>
                <button className='nav_button' onClick={navigate_admin_account}>
                    Account
                </button>
                <div id='projects_dropdown' className='nav_button'>
                    <p>Projects ▼</p>
                    <div className='project_dropdown_content'>
                        
                    </div>
                </div>
                {project}
            </nav>
            {component}
        </div>
    )
}
    */