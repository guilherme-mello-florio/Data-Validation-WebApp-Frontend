import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// --- MOCK DATA and API ---
// In a real application, this data would come from your backend.
// We'll simulate an API call to fetch the upload history.
const MOCK_UPLOAD_HISTORY = [
  { id: 3, filename: 'customer_data_q1.csv', status: 'Success', uploadedAt: '2025-06-27T14:30:00Z' },
  { id: 2, filename: 'sales_report_may.csv', status: 'Error', uploadedAt: '2025-06-26T11:05:00Z', details: 'Invalid column: "SaleValue"' },
  { id: 1, filename: 'inventory_update.csv', status: 'Success', uploadedAt: '2025-06-25T09:15:00Z' },
];

// Mock API call
const fetchUploadHistory = async (token) => {
  console.log("Fetching upload history with token:", token);
  // In a real app: `await fetch('http://localhost:8000/upload-history/', { headers: ... })`
  return new Promise(resolve => setTimeout(() => resolve([...MOCK_UPLOAD_HISTORY]), 500));
};


export default function FileUploadPage() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null); // 'admin', 'editor', or other roles

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);

  // Effect for permission control and fetching initial data
  useEffect(() => {
    const verifyAccessAndFetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/'); // Redirect if not logged in
        return;
      }
      try {
        // --- PERMISSION CHECK ---
        // In a real app, you would verify the token and get the user's role.
        // For this example, we'll mock it. You should replace this with a real API call.
        // const response = await fetch('http://localhost:8000/users/me', { headers: {'Authorization': `Bearer ${token}`} });
        // const userData = await response.json();
        // const role = userData.role;
        const mockRole = 'admin'; // Change to 'viewer' or other to test permission denial
        
        if (mockRole !== 'admin' && mockRole !== 'editor') {
          console.error("Access Denied: User does not have sufficient permissions.");
          navigate('/dashboard'); // Or show an "Access Denied" message
          return;
        }
        setUserRole(mockRole);

        // Fetch initial upload history
        const history = await fetchUploadHistory(token);
        setUploadHistory(history);

      } catch (error) {
        console.error("Error verifying access:", error);
        navigate('/');
      }
    };
    verifyAccessAndFetchData();
  }, [navigate]);

  // --- File Handling Logic ---
  const handleFileSelect = (file) => {
    // Reset states
    setUploadError('');
    setUploadSuccess('');
    setSelectedFile(null);

    if (file) {
      // Check file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setUploadError('Invalid file format. Please upload a .csv file.');
        return;
      }
      setSelectedFile(file);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsDragActive(true);
    } else if (event.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileSelect(event.dataTransfer.files[0]);
    }
  }, []);

  // --- Upload Logic ---
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccess('');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Simulate progress for demonstration
      for (let p = 0; p <= 100; p += 10) {
        await new Promise(res => setTimeout(res, 150));
        setUploadProgress(p);
      }

      // --- REAL API CALL ---
      // const response = await fetch('http://localhost:8000/upload-csv/', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` },
      //   body: formData,
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || 'Upload failed.');
      // }
      
      // const result = await response.json();

      // --- MOCK API CALL ---
      await new Promise(res => setTimeout(res, 200)); // Simulate final network time
      const result = { detail: "File uploaded successfully and is being processed." };
      // --- END MOCK ---
      
      setUploadSuccess(result.detail);
      setSelectedFile(null);

      // Add to mock history and re-fetch (or just update state)
      const newHistoryEntry = { 
        id: Math.random(), 
        filename: selectedFile.name, 
        status: 'Success', 
        uploadedAt: new Date().toISOString() 
      };
      setUploadHistory(prev => [newHistoryEntry, ...prev]);

    } catch (error) {
      setUploadError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!userRole) {
    // Show a loading state or nothing while permissions are being verified
    return <div className="loading-permission">Verifying access...</div>;
  }

  return (
    <>
      {/* <AdminHeader page="File Import" /> */}
      <div className="file-upload-page">
        <main className="upload-container">
          <h1 className="main-title">File Import</h1>
          <p className="main-subtitle">Upload your CSV files to import data into the platform.</p>

          {/* Upload Area */}
          <div 
            className={`drop-zone ${isDragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="file-input" 
              className="file-input-hidden" 
              accept=".csv"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            <div className="drop-zone-prompt">
              <span className="drop-zone-icon">&#x1F4C2;</span> {/* Folder Icon */}
              <p>Drag & drop your .csv file here</p>
              <p className="or-text">or</p>
              <label htmlFor="file-input" className="browse-button">
                Browse Files
              </label>
            </div>
          </div>
          
          {/* File Selection Info */}
          {selectedFile && !isUploading && (
            <div className="file-selection-info">
              <p>Selected file: <strong>{selectedFile.name}</strong></p>
              <button onClick={handleUpload} className="upload-button">
                Start Upload
              </button>
            </div>
          )}

          {/* Upload Progress and Feedback */}
          {isUploading && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          )}

          {uploadError && <div className="feedback-message error-message">{uploadError}</div>}
          {uploadSuccess && <div className="feedback-message success-message">{uploadSuccess}</div>}

          {/* Upload History */}
          <section className="history-section">
            <h2 className="history-title">Recent Uploads</h2>
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.length > 0 ? (
                    uploadHistory.map(item => (
                      <tr key={item.id}>
                        <td>{item.filename}</td>
                        <td>{new Date(item.uploadedAt).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-history-message">No recent uploads found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}