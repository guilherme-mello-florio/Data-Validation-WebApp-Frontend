import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf'; // For PDF export
import autoTable from 'jspdf-autotable'; // Import autoTable as a function

// Import your CSS file if it's separate
// import './Monitoring.css'; 

// Assume AdminHeader is a component you have.
// If AdminHeader is not defined, you might see an error or a blank space.
// For demonstration, I'll use a placeholder if it's not available.
let AdminHeader;
try {
  // This is a common pattern but might need adjustment based on actual project setup
  AdminHeader = require('./AdminHeader').default || require('./AdminHeader');
} catch (e) {
  console.warn("AdminHeader component not found, using placeholder. Please ensure './AdminHeader' is correct.");
  AdminHeader = ({ page }) => (
    <header className="admin-header-placeholder">
      <div className="admin-header-container-placeholder">
        <h1>Admin Dashboard</h1>
        <h2>Page: {page}</h2>
      </div>
    </header>
  );
}

// Helper function to extract the main action/type from the log description
const extractLogType = (description) => {
  if (!description) return "Unknown";
  const match = description.match(/^(.*?) at /);
  if (match && match[1]) {
    return match[1].trim();
  }
  const parts = description.split(" at ");
  return parts[0].trim();
};

// Helper function to extract the timestamp string from the log description
const extractTimestampString = (description) => {
  if (!description) return "";
  const parts = description.split(" at ");
  if (parts.length > 1) {
    return parts.slice(1).join(" at ").replace(/ from IP address: .*/, '').trim();
  }
  return "N/A";
};

// Helper function to parse log timestamp string into a Date object
const parseLogTimestamp = (description) => {
  const timestampString = extractTimestampString(description);
  if (timestampString === "N/A") return null;
  try {
    return new Date(timestampString);
  } catch (e) {
    console.error("Error parsing date:", timestampString, e);
    return null;
  }
};


export default function Monitoring() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [usernameFilter, setUsernameFilter] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      try {
        const response = await fetch(`http://localhost:8000/verify-token/${token}`);
        if (!response.ok) {
          throw new Error('Token verification failed. Status: ' + response.status);
        }
        fetchLogs(token);
      } catch (err) {
        console.error("Token verification error:", err);
        localStorage.removeItem('token');
        navigate('/');
      }
    };

    verifyToken();
  }, [navigate]);

  const fetchLogs = async (token) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/logs/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/');
            throw new Error('Unauthorized. Please log in again.');
        }
        throw new Error(`Failed to fetch logs. Status: ${response.status}`);
      }
      const data = await response.json();
      const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => {
        const dateA = parseLogTimestamp(a.log_description);
        const dateB = parseLogTimestamp(b.log_description);
        if (dateA && dateB) return dateB - dateA;
        return b.id - a.id;
      });
      setLogs(sortedData);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.message);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const availableLogTypes = useMemo(() => {
    const types = new Set();
    logs.forEach(log => {
      types.add(extractLogType(log.log_description));
    });
    return Array.from(types).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesUsername = usernameFilter
        ? log.user_username && log.user_username.toLowerCase().includes(usernameFilter.toLowerCase())
        : true;
      
      const matchesLogType = logTypeFilter
        ? extractLogType(log.log_description) === logTypeFilter
        : true;

      const logDate = parseLogTimestamp(log.log_description);
      let matchesDate = true;
      if (logDate) {
        if (startDateFilter) {
          const filterStartDate = new Date(startDateFilter);
          filterStartDate.setHours(0, 0, 0, 0);
          if (logDate < filterStartDate) {
            matchesDate = false;
          }
        }
        if (endDateFilter && matchesDate) {
          const filterEndDate = new Date(endDateFilter);
          filterEndDate.setHours(23, 59, 59, 999);
          if (logDate > filterEndDate) {
            matchesDate = false;
          }
        }
      } else if (startDateFilter || endDateFilter) {
        matchesDate = false;
      }
      
      return matchesUsername && matchesLogType && matchesDate;
    });
  }, [logs, usernameFilter, logTypeFilter, startDateFilter, endDateFilter]);

  const handleClearFilters = () => {
    setUsernameFilter('');
    setLogTypeFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No logs to export.");
      return;
    }
    const headers = ["ID", "Username", "Action", "Timestamp", "Full Description"];
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.id,
        `"${log.user_username || ''}"`,
        `"${extractLogType(log.log_description) || ''}"`,
        `"${extractTimestampString(log.log_description) || ''}"`,
        `"${(log.log_description || '').replace(/"/g, '""')}"`
      ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'logs.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToPDF = () => {
    if (filteredLogs.length === 0) {
      alert("No logs to export.");
      return;
    }
    const doc = new jsPDF(); // Create a new jsPDF instance
    
    doc.text("System Logs", 14, 16); // Add a title to the PDF
    
    const tableColumn = ["ID", "Username", "Action", "Timestamp", "Description"];
    const tableRows = [];

    filteredLogs.forEach(log => {
      const logData = [
        log.id,
        log.user_username || "N/A", // Handle potentially undefined username
        extractLogType(log.log_description),
        extractTimestampString(log.log_description),
        log.log_description
      ];
      tableRows.push(logData);
    });

    // Call autoTable as a function, passing the doc instance
    autoTable(doc, { 
      head: [tableColumn],
      body: tableRows,
      startY: 20, // Y position to start the table
      theme: 'striped', // 'striped', 'grid', 'plain'
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133] }, // Example: a teal color for header
      columnStyles: {
        0: { cellWidth: 10 }, // ID column width
        1: { cellWidth: 30 }, // Username column width
        2: { cellWidth: 40 }, // Action column width
        3: { cellWidth: 40 }, // Timestamp column width
        // Description column will take the remaining width automatically
      },
      // Use didDrawCell to handle potential text overflow in the description
      didDrawCell: (data) => {
        // For the description column (index 4), if it's not in the header
        if (data.column.index === 4 && data.cell.section === 'body') {
            // Check if text overflows, jsPDF-autoTable might handle some wrapping by default with cellWidth
            // but for very long text, you might need more advanced handling if issues persist.
            // This basic example relies on autoTable's default behavior with columnStyles.
        }
      }
    });
    doc.save('logs.pdf'); // Save the PDF
  };


  return (
    <div className="log-monitoring-page">
      <AdminHeader page="Monitoring" />
      <main className="log-monitoring-main">
        <div className="logs-container">
          <h1 className="logs-header">System Logs</h1>

          <div className="filters-section">
            <div className="filter-grid">
              {/* Row 1 of filters */}
              <div className="filter-group">
                <label htmlFor="usernameFilter">Filter by Username</label>
                <input
                  type="text"
                  id="usernameFilter"
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  placeholder="Enter username"
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label htmlFor="logTypeFilter">Filter by Log Type</label>
                <select
                  id="logTypeFilter"
                  value={logTypeFilter}
                  onChange={(e) => setLogTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Log Types</option>
                  {availableLogTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
               <div className="filter-group"> {/* Placeholder for alignment */} </div>


              {/* Row 2 of filters - Date Filters */}
              <div className="filter-group">
                <label htmlFor="startDateFilter">Start Date</label>
                <input
                  type="date"
                  id="startDateFilter"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label htmlFor="endDateFilter">End Date</label>
                <input
                  type="date"
                  id="endDateFilter"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="filter-input"
                />
              </div>
               {/* Clear Filters Button */}
               <div className="filter-group clear-filters-container">
                 <button
                    onClick={handleClearFilters}
                    className="clear-filters-button"
                  >
                    Clear All Filters
                  </button>
               </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="export-buttons-section">
            <button onClick={exportToCSV} className="export-button csv-button">
              Export as CSV
            </button>
            <button onClick={exportToPDF} className="export-button pdf-button">
              Export as PDF
            </button>
          </div>


          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading logs...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="error-message">
              <p><strong>Error</strong></p>
              <p>{error}</p>
              <button
                onClick={() => fetchLogs(localStorage.getItem('token'))}
                className="retry-button"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead className="logs-table-header-group">
                    <tr>
                      <th className="logs-table-header">ID</th>
                      <th className="logs-table-header">Username</th>
                      <th className="logs-table-header">Action</th>
                      <th className="logs-table-header">Timestamp</th>
                      <th className="logs-table-header">Full Description</th>
                    </tr>
                  </thead>
                  <tbody className="logs-table-body">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map(log => (
                        <tr key={log.id} className="logs-table-row">
                          <td className="logs-table-cell">{log.id}</td>
                          <td className="logs-table-cell">{log.user_username}</td>
                          <td className="logs-table-cell logs-table-cell-action">{extractLogType(log.log_description)}</td>
                          <td className="logs-table-cell">{extractTimestampString(log.log_description)}</td>
                          <td className="logs-table-cell logs-table-cell-description">{log.log_description}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-logs-message">
                          No logs found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!isLoading && !error && logs.length > 0 && (
                <div className="logs-count-message">
                  Showing {filteredLogs.length} of {logs.length} total logs.
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
