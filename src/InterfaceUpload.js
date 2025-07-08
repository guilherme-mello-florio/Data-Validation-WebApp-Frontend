import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Helper function to fetch interfaces for a specific project
const fetchProjectInterfaces = async (token, apiUrl, projectName) => {
    try {
        const response = await fetch(`${apiUrl}/api/projects/${projectName}/interfaces`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch interfaces for project ${projectName}.`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching project interfaces:", error);
        throw error;
    }
};

// Helper function to fetch upload history for a specific project
const fetchUploadHistory = async (token, apiUrl, projectName) => {
    if (!projectName) return [];
    try {
        const response = await fetch(`${apiUrl}/api/uploads/history?project_name=${encodeURIComponent(projectName)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch upload history.');
        return await response.json();
    } catch (error) {
        console.error("Error fetching upload history:", error);
        throw error;
    }
};

export default function FileUploadPage() {
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    const [currentUser, setCurrentUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [interfaces, setInterfaces] = useState([]);
    const [selectedInterface, setSelectedInterface] = useState('');
    
    // --- State updated for multi-file handling ---
    const [selectedFiles, setSelectedFiles] = useState([]); // Array for multiple files
    const [uploadingFiles, setUploadingFiles] = useState({}); // Tracks progress of each file: { [fileName]: progress }
    const [uploadErrors, setUploadErrors] = useState({});     // Tracks errors for each file: { [fileName]: errorMessage }
    const [uploadSuccesses, setUploadSuccesses] = useState({}); // Tracks success for each file: { [fileName]: successMessage }
    
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadHistory, setUploadHistory] = useState([]);
    
    const fileInputRef = useRef(null);

    // Initial data load
    useEffect(() => {
        const verifyAccessAndFetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/'); return; }
            try {
                const userRes = await fetch(`${apiUrl}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!userRes.ok) throw new Error('Session expired.');
                const userData = await userRes.json();
                setCurrentUser(userData);

                if (userData.role !== 'admin' && userData.role !== 'editor') {
                    navigate('/dashboard'); 
                    return;
                }
                
                setProjects(userData.projects || []);
                if (userData.projects && userData.projects.length > 0) {
                    setSelectedProject(userData.projects[0].project_name);
                }
            } catch (error) {
                console.error("Error verifying access:", error);
                navigate('/');
            }
        };
        verifyAccessAndFetchData();
    }, [navigate, apiUrl]);

    // Fetch interfaces and history when project changes
    useEffect(() => {
        if (selectedProject) {
            const token = localStorage.getItem('token');
            const getProjectData = async () => {
                try {
                    setInterfaces([]);
                    setUploadHistory([]);
                    
                    const [projectInterfaces, history] = await Promise.all([
                        fetchProjectInterfaces(token, apiUrl, selectedProject),
                        fetchUploadHistory(token, apiUrl, selectedProject)
                    ]);

                    setInterfaces(projectInterfaces);
                    setUploadHistory(history);
                    setSelectedInterface('');
                } catch (error) {
                    setUploadErrors({ global: error.message });
                }
            };
            getProjectData();
        }
    }, [selectedProject, apiUrl]);

    // --- Restored multi-file selection logic ---
    const handleFileSelect = useCallback((files) => {
        setUploadErrors({});
        setUploadSuccesses({});

        const newValidFiles = [];
        const currentErrors = {};

        Array.from(files).forEach(file => {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                currentErrors[file.name] = 'Invalid format. Only .csv is allowed.';
                return;
            }
            if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                currentErrors[file.name] = 'This file is already in the list.';
                return;
            }
            newValidFiles.push(file);
        });

        if (Object.keys(currentErrors).length > 0) {
            setUploadErrors(prev => ({ ...prev, ...currentErrors }));
        }
        
        setSelectedFiles(prevFiles => [...prevFiles, ...newValidFiles]);
    }, [selectedFiles]);

    const handleDrag = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(e.type === "dragenter" || e.type === "dragover"); }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    }, [handleFileSelect]);

    // --- Restored function to remove a single file from the list ---
    const handleRemoveFile = useCallback((fileToRemove) => {
        setSelectedFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
        setUploadErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fileToRemove.name];
            return newErrors;
        });
    }, []);

    // --- Restored multi-file upload logic ---
    const handleUploadAll = async () => {
        if (selectedFiles.length === 0 || !selectedProject || !selectedInterface) {
            setUploadErrors({ global: 'Please select a project, an interface, and at least one file.' });
            return;
        }

        const token = localStorage.getItem('token');
        setUploadingFiles({});
        setUploadErrors({});
        setUploadSuccesses({});

        for (const file of selectedFiles) {
            setUploadingFiles(prev => ({ ...prev, [file.name]: 0 }));

            const formData = new FormData();
            formData.append('file', file);
            const uploadUrl = `${apiUrl}/api/upload-csv/?project_name=${encodeURIComponent(selectedProject)}&interface_name=${encodeURIComponent(selectedInterface)}`;

            try {
                // Simulate progress
                for (let p = 0; p <= 100; p += 10) {
                    await new Promise(res => setTimeout(res, 50));
                    setUploadingFiles(prev => ({ ...prev, [file.name]: p }));
                }
                
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.detail || 'Upload failed.');
                
                setUploadSuccesses(prev => ({ ...prev, [file.name]: result.message }));

            } catch (error) {
                setUploadErrors(prev => ({ ...prev, [file.name]: error.message }));
            } finally {
                setUploadingFiles(prev => {
                    const newUploading = { ...prev };
                    delete newUploading[file.name];
                    return newUploading;
                });
            }
        }
        
        // After all uploads are attempted, clear the selection and refresh data
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        const [updatedInterfaces, updatedHistory] = await Promise.all([
            fetchProjectInterfaces(token, apiUrl, selectedProject),
            fetchUploadHistory(token, apiUrl, selectedProject)
        ]);
        setInterfaces(updatedInterfaces);
        setUploadHistory(updatedHistory);
    };

    const handleMarkAsComplete = async (interfaceName) => {
        const token = localStorage.getItem('token');
        if (!token || !selectedProject) return;
        try {
            const response = await fetch(`${apiUrl}/api/project-interfaces/${selectedProject}/${interfaceName}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed and awaiting upload in RELEX system' })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || 'Failed to update status.');
            const updatedInterfaces = await fetchProjectInterfaces(token, apiUrl, selectedProject);
            setInterfaces(updatedInterfaces);
        } catch (error) {
            setUploadErrors({ global: error.message });
        }
    };

    if (!currentUser) return <div className="loading-permission">Verifying access...</div>;

    return (
        <div className="file-upload-page">
            <main className="upload-container">
                <h1 className="main-title">Interface File Upload</h1>
                
                <div className="project-selector-container">
                    <label htmlFor="project-selector">Select Project:</label>
                    <select id="project-selector" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                        <option value="" disabled>-- Choose a project --</option>
                        {projects.map(p => <option key={p.id} value={p.project_name}>{p.project_name}</option>)}
                    </select>
                </div>

                {selectedProject && (
                    <>
                        <div className="interface-upload-section">
                            <h2 className="section-title">Select Interface and Upload Files</h2>
                            <div className="interface-selector-container">
                                <label htmlFor="interface-selector">Upload files for interface:</label>
                                <select id="interface-selector" value={selectedInterface} onChange={e => setSelectedInterface(e.target.value)} disabled={!interfaces.length}>
                                    <option value="" disabled>-- Choose an interface --</option>
                                    {interfaces.map(i => <option key={i.interface_name} value={i.interface_name}>{i.interface_name.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            
                            <div className={`drop-zone ${isDragActive ? 'active' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                                <input type="file" id="file-input" className="file-input-hidden" accept=".csv" multiple onChange={(e) => handleFileSelect(e.target.files)} ref={fileInputRef} />
                                <div className="drop-zone-prompt">
                                    <span className="drop-zone-icon">&#x1F4C2;</span>
                                    <p>Drag & drop your .csv files here</p>
                                    <p className="or-text">or</p>
                                    <label htmlFor="file-input" className="browse-button">Browse Files</label>
                                </div>
                            </div>
                            
                            {selectedFiles.length > 0 && (
                                <div className="selected-files-container">
                                    <h3 className="selected-files-title">Files to Upload ({selectedFiles.length})</h3>
                                    <ul className="selected-files-list">
                                        {selectedFiles.map((file, index) => (
                                            <li key={`${file.name}-${index}`} className="selected-file-item">
                                                <span>{file.name}</span>
                                                <button onClick={() => handleRemoveFile(file)} className="remove-file-button">&times;</button>
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={handleUploadAll} className="upload-button" disabled={!selectedInterface || Object.keys(uploadingFiles).length > 0}>
                                        {Object.keys(uploadingFiles).length > 0 ? 'Uploading...' : `Upload All to ${selectedInterface.replace(/_/g, ' ')}`}
                                    </button>
                                </div>
                            )}

                            <div className="upload-feedback-area">
                                {Object.entries(uploadingFiles).map(([name, progress]) => (
                                    <div key={name} className="progress-item">
                                        <span>{name}</span>
                                        <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${progress}%` }}></div></div>
                                        <span>{progress}%</span>
                                    </div>
                                ))}
                                {Object.entries(uploadSuccesses).map(([name, message]) => (
                                    <div key={name} className="feedback-message success-message"><strong>{name}:</strong> {message}</div>
                                ))}
                                {Object.entries(uploadErrors).map(([name, message]) => (
                                    <div key={name} className="feedback-message error-message"><strong>{name}:</strong> {message}</div>
                                ))}
                            </div>
                        </div>

                        <div className="interface-status-section">
                            <h2 className="section-title">Interface Status Overview</h2>
                            <div className="history-table-container">
                                <table className="history-table">
                                    <thead><tr><th>Interface</th><th>Status</th><th>Last Updated</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {interfaces.length > 0 ? interfaces.map(item => (
                                            <tr key={item.interface_name}>
                                                <td>{item.interface_name.replace(/_/g, ' ')}</td>
                                                <td><span className={`status-badge ${item.status.toLowerCase().replace(/\s/g, '-')}`}>{item.status}</span></td>
                                                <td>{new Date(item.last_updated).toLocaleString()}</td>
                                                <td>
                                                    {item.status !== 'Completed and awaiting upload in RELEX system' && item.status !== 'Completed and uploaded' && (
                                                        <button className="mark-complete-button" onClick={() => handleMarkAsComplete(item.interface_name)}>Mark as Complete</button>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="no-history-message">No interfaces found for this project.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="upload-history-section">
                            <h2 className="section-title">Upload History for {selectedProject}</h2>
                            <div className="history-table-container">
                                <table className="history-table">
                                    <thead><tr><th>File Name</th><th>Interface</th><th>Date</th><th>Status</th><th>Uploader</th></tr></thead>
                                    <tbody>
                                        {uploadHistory.length > 0 ? uploadHistory.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.filename}</td>
                                                <td>{item.interface_name ? item.interface_name.replace(/_/g, ' ') : 'N/A'}</td>
                                                <td>{new Date(item.uploadedAt).toLocaleString()}</td>
                                                <td><span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                                                <td>{item.uploader}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="no-history-message">No upload history for this project.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
