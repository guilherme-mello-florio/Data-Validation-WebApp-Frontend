import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import your CSS file
// import './Monitoring.css'; 

// Placeholder for AdminHeader
let AdminHeader;
try {
  AdminHeader = require('./AdminHeader').default || require('./AdminHeader');
} catch (e) {
  console.warn("AdminHeader component not found, using placeholder.");
  AdminHeader = ({ page }) => (
    <header className="admin-header-placeholder">
      <div className="admin-header-container-placeholder">
        <h1>Admin Dashboard</h1>
        <h2>Page: {page}</h2>
      </div>
    </header>
  );
}

// --- Helper Functions for System Logs ---
// --- UPDATED to handle new log format ---
const extractSystemLogType = (description) => {
  if (!description) return "Unknown";

  // Rule 1: Handle the most specific pattern first: user updates in Portuguese.
  if (description.includes(" updated the user ")) {
    return "User Updated";
  }

  // Rule 1.1: Handle user deletion logs in Portuguese.
  if (description.includes(" deleted the user ")) {
    return "User Deleted";
  }

  // Rule 2: Handle user creation logs that have a dynamic username in parentheses.
  // This must be checked before the general " at " rule.
  if (description.includes("User has created a new") && description.includes('(') && description.includes(')')) {
    return description.split('(')[0].trim();
  }

  // Rule 3: Handle all other logs that use the " at " separator.
  // This is a general rule for logs with a timestamp at the end.
  const atParts = description.split(" at ");
  if (atParts.length > 1) {
    return atParts[0].trim();
  }
  
  // Rule 4: Handle user creation logs that might not have an "at" or "()".
  // This is a fallback for simple creation messages.
  if (description.includes("User has created a new")) {
    return description;
  }

  if (description.includes("Email notification sent to")) {
    return "Email Notification Sent";
  }

  // Final fallback if no other pattern matches.
  return "Unknown Log Format";
};

const extractSystemLogTimestampString = (description) => {
  if (!description) return "";

  // NEW: Check for timestamp at the beginning: [YYYY-MM-DD HH:MM:SS]
  const bracketMatch = description.match(/^\[(.*?)\]/);
  if (bracketMatch && bracketMatch[1]) {
    return bracketMatch[1];
  }

  // OLD: Check for " at " pattern
  const parts = description.split(" at ");
  if (parts.length > 1) return parts.slice(1).join(" at ").replace(/ from IP address: .*/, '').trim();
  
  return "N/A";
};

const parseSystemLogTimestamp = (description) => {
  const tsStr = extractSystemLogTimestampString(description);
  if (tsStr === "N/A") return null;
  try { return new Date(tsStr); } catch (e) { console.error("SysLog Date Parse Err:", tsStr, e); return null; }
};

// --- Helper function to format Date object to string or return N/A ---
const formatDate = (dateObj, includeTime = true) => {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj)) {
    return "N/A";
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  if (includeTime) {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  return `${year}-${month}-${day}`;
};


export default function Monitoring() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));

  // --- State for System Logs ---
  const [systemLogs, setSystemLogs] = useState([]);
  const [systemLogsLoading, setSystemLogsLoading] = useState(true);
  const [systemLogsError, setSystemLogsError] = useState(null);
  const [sysUsernameFilter, setSysUsernameFilter] = useState('');
  const [sysLogTypeFilter, setSysLogTypeFilter] = useState('');
  const [sysStartDateFilter, setSysStartDateFilter] = useState('');
  const [sysEndDateFilter, setSysEndDateFilter] = useState('');

  // --- State for Interface Logs ---
  const [interfaceLogs, setInterfaceLogs] = useState([]);
  const [interfaceLogsLoading, setInterfaceLogsLoading] = useState(true);
  const [interfaceLogsError, setInterfaceLogsError] = useState(null);
  const [ifaceUsernameFilter, setIfaceUsernameFilter] = useState('');
  const [ifaceAlterationTypeFilter, setIfaceAlterationTypeFilter] = useState('');
  const [ifaceDidFailFilter, setIfaceDidFailFilter] = useState(''); 
  const [ifaceInterfaceFilter, setIfaceInterfaceFilter] = useState('');
  const [ifaceProjectFilter, setIfaceProjectFilter] = useState('');
  const [ifaceStartDateFilter, setIfaceStartDateFilter] = useState('');
  const [ifaceEndDateFilter, setIfaceEndDateFilter] = useState('');

  // Token Verification and Initial Data Fetch
  useEffect(() => {
    const localToken = localStorage.getItem('token');
    if (!localToken) {
      navigate('/');
      return;
    }
    setToken(localToken);

    const verifyTokenAndFetch = async () => {
      try {
        const response = await fetch(`http://localhost:8000/verify-token/${localToken}`);
        if (!response.ok) throw new Error('Token verification failed');
        
        fetchSystemLogs(localToken);
        fetchInterfaceLogs(localToken);

      } catch (err) {
        console.error("Token verification error:", err);
        localStorage.removeItem('token');
        navigate('/');
      }
    };
    verifyTokenAndFetch();
  }, [navigate]);

  // --- Fetching Logic for System Logs ---
  const fetchSystemLogs = async (authToken) => {
    setSystemLogsLoading(true);
    setSystemLogsError(null);
    try {
      const response = await fetch('http://localhost:8000/logs/', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error(`SysLogs: ${response.status} ${await response.text()}`);
      const data = await response.json();
      const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => {
        const dateA = parseSystemLogTimestamp(a.log_description);
        const dateB = parseSystemLogTimestamp(b.log_description);
        if (dateA && dateB) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      });
      setSystemLogs(sortedData);
    } catch (err) {
      console.error("Error fetching system logs:", err);
      setSystemLogsError(err.message);
    } finally {
      setSystemLogsLoading(false);
    }
  };

  // --- Fetching Logic for Interface Logs ---
  const fetchInterfaceLogs = async (authToken) => {
    setInterfaceLogsLoading(true);
    setInterfaceLogsError(null);
    try {
      const response = await fetch('http://localhost:8000/interface-logs/', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error(`InterfaceLogs: ${response.status} ${await response.text()}`);
      const data = await response.json();
      const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          if (!isNaN(dateA) && !isNaN(dateB)) return dateB - dateA;
          return (b.id || 0) - (a.id || 0); 
      });
      setInterfaceLogs(sortedData);
    } catch (err) {
      console.error("Error fetching interface logs:", err);
      setInterfaceLogsError(err.message);
    } finally {
      setInterfaceLogsLoading(false);
    }
  };
  
  // --- Memoized Filters for System Logs ---
  const availableSystemLogTypes = useMemo(() => Array.from(new Set(systemLogs.map(log => extractSystemLogType(log.log_description)))).sort(), [systemLogs]);
  const filteredSystemLogs = useMemo(() => {
    return systemLogs.filter(log => {
      const matchesUsername = sysUsernameFilter ? (log.user_username || '').toLowerCase().includes(sysUsernameFilter.toLowerCase()) : true;
      const matchesLogType = sysLogTypeFilter ? extractSystemLogType(log.log_description) === sysLogTypeFilter : true;
      const logDate = parseSystemLogTimestamp(log.log_description);
      let matchesDate = true;
      if (logDate) {
        if (sysStartDateFilter) {
          const filterDate = new Date(sysStartDateFilter); filterDate.setHours(0,0,0,0);
          if (logDate < filterDate) matchesDate = false;
        }
        if (sysEndDateFilter && matchesDate) {
          const filterDate = new Date(sysEndDateFilter); filterDate.setHours(23,59,59,999);
          if (logDate > filterDate) matchesDate = false;
        }
      } else if (sysStartDateFilter || sysEndDateFilter) matchesDate = false;
      return matchesUsername && matchesLogType && matchesDate;
    });
  }, [systemLogs, sysUsernameFilter, sysLogTypeFilter, sysStartDateFilter, sysEndDateFilter]);

  // --- Memoized Filters for Interface Logs ---
  const availableIfaceAlterationTypes = useMemo(() => Array.from(new Set(interfaceLogs.map(log => log.alteration_type).filter(Boolean))).sort(), [interfaceLogs]);
  const availableIfaceInterfaces = useMemo(() => Array.from(new Set(interfaceLogs.map(log => log.interface).filter(Boolean))).sort(), [interfaceLogs]);
  const availableIfaceProjects = useMemo(() => Array.from(new Set(interfaceLogs.map(log => log.project).filter(Boolean))).sort(), [interfaceLogs]);

  const filteredInterfaceLogs = useMemo(() => {
    return interfaceLogs.filter(log => {
      const matchesUsername = ifaceUsernameFilter ? (log.user_username || '').toLowerCase().includes(ifaceUsernameFilter.toLowerCase()) : true;
      const matchesAlterationType = ifaceAlterationTypeFilter ? log.alteration_type === ifaceAlterationTypeFilter : true;
      const matchesDidFail = ifaceDidFailFilter === '' ? true : String(log.didFail) === ifaceDidFailFilter;
      const matchesInterface = ifaceInterfaceFilter ? log.interface === ifaceInterfaceFilter : true;
      const matchesProject = ifaceProjectFilter ? log.project === ifaceProjectFilter : true;
      
      const logDate = log.timestamp ? new Date(log.timestamp) : null;
      let matchesDate = true;
      if (logDate && !isNaN(logDate)) {
        if (ifaceStartDateFilter) {
          const filterDate = new Date(ifaceStartDateFilter); filterDate.setHours(0,0,0,0);
          if (logDate < filterDate) matchesDate = false;
        }
        if (ifaceEndDateFilter && matchesDate) {
          const filterDate = new Date(ifaceEndDateFilter); filterDate.setHours(23,59,59,999);
          if (logDate > filterDate) matchesDate = false;
        }
      } else if (ifaceStartDateFilter || ifaceEndDateFilter) matchesDate = false; 

      return matchesUsername && matchesAlterationType && matchesDidFail && matchesInterface && matchesProject && matchesDate;
    });
  }, [interfaceLogs, ifaceUsernameFilter, ifaceAlterationTypeFilter, ifaceDidFailFilter, ifaceInterfaceFilter, ifaceProjectFilter, ifaceStartDateFilter, ifaceEndDateFilter]);


  // --- Clear Filters ---
  const handleClearSystemLogFilters = () => {
    setSysUsernameFilter(''); setSysLogTypeFilter(''); setSysStartDateFilter(''); setSysEndDateFilter('');
  };
  const handleClearInterfaceLogFilters = () => {
    setIfaceUsernameFilter(''); setIfaceAlterationTypeFilter(''); setIfaceDidFailFilter('');
    setIfaceInterfaceFilter(''); setIfaceProjectFilter(''); setIfaceStartDateFilter(''); setIfaceEndDateFilter('');
  };

  // --- Scroll Function ---
  const scrollToSystemLogs = () => {
    const systemLogsSection = document.getElementById('system-logs-section');
    if (systemLogsSection) {
      systemLogsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- Export Functions ---
  const genericExportToCSV = (logs, filename, headers, rowMapper) => {
    if (logs.length === 0) { alert("No logs to export."); return; }
    const csvRows = [
      headers.join(','),
      ...logs.map(rowMapper)
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const genericExportToPDF = (logs, filename, title, tableColumns, rowMapper) => {
    if (logs.length === 0) { alert("No logs to export."); return; }
    const doc = new jsPDF();
    doc.text(title, 14, 16);
    autoTable(doc, {
      head: [tableColumns.map(col => col.header)],
      body: logs.map(rowMapper),
      startY: 20,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 1.5 }, 
      headStyles: { fillColor: [22, 160, 133] },
      columnStyles: tableColumns.reduce((acc, col, index) => {
        if(col.width) acc[index] = { cellWidth: col.width };
        return acc;
      }, {})
    });
    doc.save(filename);
  };

  // System Log Exporters
  const exportSystemLogsToCSV = () => genericExportToCSV(
    filteredSystemLogs, 'system_logs.csv',
    ["ID", "Username", "Action", "Timestamp", "Full Description"],
    log => [
      log.id, `"${log.user_username || ''}"`, `"${extractSystemLogType(log.log_description) || ''}"`,
      `"${extractSystemLogTimestampString(log.log_description) || ''}"`, `"${(log.log_description || '').replace(/"/g, '""')}"`
    ].join(',')
  );
  const exportSystemLogsToPDF = () => genericExportToPDF(
    filteredSystemLogs, 'system_logs.pdf', "System Logs",
    [
      { header: "ID", dataKey: "id", width: 10 }, { header: "Username", dataKey: "user_username", width: 30 },
      { header: "Action", dataKey: "action", width: 40 }, { header: "Timestamp", dataKey: "timestamp_str", width: 40 },
      { header: "Description", dataKey: "log_description" } 
    ],
    log => [ log.id, log.user_username, extractSystemLogType(log.log_description), extractSystemLogTimestampString(log.log_description), log.log_description ]
  );

  // Interface Log Exporters
  const exportInterfaceLogsToCSV = () => genericExportToCSV(
    filteredInterfaceLogs, 'interface_logs.csv',
    ["ID", "Username", "Alteration Type", "Failed", "Interface", "Project", "Timestamp", "Description"],
    log => [
      log.id, `"${log.user_username || ''}"`, `"${log.alteration_type || ''}"`, log.didFail,
      `"${log.interface || ''}"`, `"${log.project || ''}"`, `"${formatDate(log.timestamp ? new Date(log.timestamp) : null)}"`,
      `"${(log.log_description || '').replace(/"/g, '""')}"`
    ].join(',')
  );
  const exportInterfaceLogsToPDF = () => genericExportToPDF(
    filteredInterfaceLogs, 'interface_logs.pdf', "Interface Activity Logs",
    [
      { header: "ID", dataKey: "id", width: 10 }, { header: "User", dataKey: "user_username", width: 25 },
      { header: "Type", dataKey: "alteration_type", width: 25 }, { header: "Failed", dataKey: "didFail", width: 15 },
      { header: "Interface", dataKey: "interface", width: 25 }, { header: "Project", dataKey: "project", width: 20 },
      { header: "Timestamp", dataKey: "timestamp", width: 30 }, { header: "Description", dataKey: "log_description" }
    ],
    log => [ log.id, log.user_username, log.alteration_type, log.didFail ? 'Yes' : 'No', log.interface, log.project, formatDate(log.timestamp ? new Date(log.timestamp) : null), log.log_description ]
  );

  return (
    <div className="log-monitoring-page">
      <AdminHeader page="Monitoring" />

      {/* --- Interface Logs Section --- */}
      <main className="log-monitoring-main interface-logs-main">
        <div className="logs-container">
          <div className="section-header-controls"> 
            <h1 className="logs-header">Interface Activity Logs</h1>
            <button onClick={scrollToSystemLogs} className="scroll-to-button">
              Go to System Event Logs &#x21E9; 
            </button>
          </div>
          <div className="filters-section">
            <div className="filter-grid filter-grid-interface"> 
              <div className="filter-group">
                <label htmlFor="ifaceUsernameFilter">Username</label>
                <input type="text" id="ifaceUsernameFilter" value={ifaceUsernameFilter} onChange={(e) => setIfaceUsernameFilter(e.target.value)} placeholder="Username" className="filter-input"/>
              </div>
              <div className="filter-group">
                <label htmlFor="ifaceAlterationTypeFilter">Alteration Type</label>
                <select id="ifaceAlterationTypeFilter" value={ifaceAlterationTypeFilter} onChange={(e) => setIfaceAlterationTypeFilter(e.target.value)} className="filter-select">
                  <option value="">All Types</option>
                  {availableIfaceAlterationTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="ifaceDidFailFilter">Status</label>
                <select id="ifaceDidFailFilter" value={ifaceDidFailFilter} onChange={(e) => setIfaceDidFailFilter(e.target.value)} className="filter-select">
                  <option value="">All</option>
                  <option value="true">Failed</option>
                  <option value="false">Success</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="ifaceInterfaceFilter">Interface</label>
                <select id="ifaceInterfaceFilter" value={ifaceInterfaceFilter} onChange={(e) => setIfaceInterfaceFilter(e.target.value)} className="filter-select">
                  <option value="">All Interfaces</option>
                  {availableIfaceInterfaces.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="ifaceProjectFilter">Project</label>
                 <select id="ifaceProjectFilter" value={ifaceProjectFilter} onChange={(e) => setIfaceProjectFilter(e.target.value)} className="filter-select">
                  <option value="">All Projects</option>
                  {availableIfaceProjects.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
               <div className="filter-group"> {/* Spacer */} </div>
              <div className="filter-group">
                <label htmlFor="ifaceStartDateFilter">Start Date</label>
                <input type="date" id="ifaceStartDateFilter" value={ifaceStartDateFilter} onChange={(e) => setIfaceStartDateFilter(e.target.value)} className="filter-input"/>
              </div>
              <div className="filter-group">
                <label htmlFor="ifaceEndDateFilter">End Date</label>
                <input type="date" id="ifaceEndDateFilter" value={ifaceEndDateFilter} onChange={(e) => setIfaceEndDateFilter(e.target.value)} className="filter-input"/>
              </div>
              <div className="filter-group clear-filters-container">
                <button onClick={handleClearInterfaceLogFilters} className="clear-filters-button">Clear Interface Filters</button>
              </div>
            </div>
          </div>
          <div className="export-buttons-section">
            <button onClick={exportInterfaceLogsToCSV} className="export-button csv-button">Export CSV</button>
            <button onClick={exportInterfaceLogsToPDF} className="export-button pdf-button">Export PDF</button>
          </div>
          {interfaceLogsLoading && <div className="loading-indicator"><div className="spinner"></div><p>Loading interface logs...</p></div>}
          {!interfaceLogsLoading && interfaceLogsError && <div className="error-message"><p><strong>Error:</strong> {interfaceLogsError}</p><button onClick={()=>fetchInterfaceLogs(token)} className="retry-button">Retry</button></div>}
          {!interfaceLogsLoading && !interfaceLogsError && (
            <>
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead className="logs-table-header-group">
                    <tr>
                      <th className="logs-table-header">ID</th>
                      <th className="logs-table-header">User</th>
                      <th className="logs-table-header">Timestamp</th>
                      <th className="logs-table-header">Alter. Type</th>
                      <th className="logs-table-header">Interface</th>
                      <th className="logs-table-header">Project</th>
                      <th className="logs-table-header">Status</th>
                      <th className="logs-table-header">Description</th>
                    </tr>
                  </thead>
                  <tbody className="logs-table-body">
                    {filteredInterfaceLogs.length > 0 ? filteredInterfaceLogs.map(log => (
                      <tr key={log.id} className="logs-table-row">
                        <td className="logs-table-cell">{log.id}</td>
                        <td className="logs-table-cell">{log.user_username}</td>
                        <td className="logs-table-cell">{formatDate(log.timestamp ? new Date(log.timestamp) : null)}</td>
                        <td className="logs-table-cell">{log.alteration_type}</td>
                        <td className="logs-table-cell">{log.interface}</td>
                        <td className="logs-table-cell">{log.project}</td>
                        <td className="logs-table-cell">{log.didFail ? 'Failed' : 'Success'}</td>
                        <td className="logs-table-cell logs-table-cell-description">{log.log_description}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" className="no-logs-message">No interface logs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="logs-count-message">Showing {filteredInterfaceLogs.length} of {interfaceLogs.length} interface logs.</div>
            </>
          )}
        </div>
      </main>

      {/* --- System Logs Section (Existing) --- */}
      <main id="system-logs-section" className="log-monitoring-main system-logs-main">
        <div className="logs-container">
          <h1 className="logs-header">System Event Logs</h1>
           <div className="filters-section">
            <div className="filter-grid"> 
              <div className="filter-group">
                <label htmlFor="sysUsernameFilter">Username</label>
                <input type="text" id="sysUsernameFilter" value={sysUsernameFilter} onChange={(e) => setSysUsernameFilter(e.target.value)} placeholder="Username" className="filter-input"/>
              </div>
              <div className="filter-group">
                <label htmlFor="sysLogTypeFilter">Log Type</label>
                <select id="sysLogTypeFilter" value={sysLogTypeFilter} onChange={(e) => setSysLogTypeFilter(e.target.value)} className="filter-select">
                  <option value="">All Types</option>
                  {availableSystemLogTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="filter-group"> {/* Spacer */} </div>
              <div className="filter-group">
                <label htmlFor="sysStartDateFilter">Start Date</label>
                <input type="date" id="sysStartDateFilter" value={sysStartDateFilter} onChange={(e) => setSysStartDateFilter(e.target.value)} className="filter-input"/>
              </div>
              <div className="filter-group">
                <label htmlFor="sysEndDateFilter">End Date</label>
                <input type="date" id="sysEndDateFilter" value={sysEndDateFilter} onChange={(e) => setSysEndDateFilter(e.target.value)} className="filter-input"/>
              </div>
              <div className="filter-group clear-filters-container">
                <button onClick={handleClearSystemLogFilters} className="clear-filters-button">Clear System Filters</button>
              </div>
            </div>
          </div>
          <div className="export-buttons-section">
            <button onClick={exportSystemLogsToCSV} className="export-button csv-button">Export CSV</button>
            <button onClick={exportSystemLogsToPDF} className="export-button pdf-button">Export PDF</button>
          </div>
          {systemLogsLoading && <div className="loading-indicator"><div className="spinner"></div><p>Loading system logs...</p></div>}
          {!systemLogsLoading && systemLogsError && <div className="error-message"><p><strong>Error:</strong> {systemLogsError}</p><button onClick={()=>fetchSystemLogs(token)} className="retry-button">Retry</button></div>}
          {!systemLogsLoading && !systemLogsError && (
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
                    {filteredSystemLogs.length > 0 ? filteredSystemLogs.map(log => (
                      <tr key={log.id} className="logs-table-row">
                        <td className="logs-table-cell">{log.id}</td>
                        <td className="logs-table-cell">{log.user_username}</td>
                        <td className="logs-table-cell logs-table-cell-action">{extractSystemLogType(log.log_description)}</td>
                        <td className="logs-table-cell">{extractSystemLogTimestampString(log.log_description)}</td>
                        <td className="logs-table-cell logs-table-cell-description">{log.log_description}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="no-logs-message">No system logs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
               <div className="logs-count-message">Showing {filteredSystemLogs.length} of {systemLogs.length} system logs.</div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
