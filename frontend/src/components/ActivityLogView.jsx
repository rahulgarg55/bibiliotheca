import React, { useContext, useState, useRef } from 'react';
import { LibraryContext } from '../context/LibraryContext';
import { Terminal, Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';

export default function ActivityLogView() {
  const { 
    logs, 
    exportDatabase, 
    importDatabase, 
    showToast 
  } = useContext(LibraryContext);

  const [activeFilter, setActiveFilter] = useState('all');
  const fileInputRef = useRef(null);

  // Filter logs based on type selection
  const filteredLogs = logs.filter(l => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'checkout') return l.type === 'checkout';
    if (activeFilter === 'return') return l.type === 'return';
    if (activeFilter === 'system') return l.type === 'system';
    if (activeFilter === 'admin') return l.type === 'admin';
    if (activeFilter === 'fine') return l.type === 'fine';
    return true;
  });

  // Export DB Handler
  const handleExport = () => {
    const dataStr = exportDatabase();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `bibliotheca_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast("Database backup downloaded successfully!", "success");
  };

  // Import DB Handler
  const handleImport = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const success = importDatabase(event.target.result);
      if (success) {
        // Force simple reload to re-read localStorage
        window.location.reload();
      }
    };
    fileReader.readAsText(file, "UTF-8");
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Reset to Factory Setup
  const handleFactoryReset = () => {
    if (window.confirm("WARNING: This will erase all custom books, users, checkout transactions, and custom bookshelves, restoring default mock data. Do you wish to proceed?")) {
      localStorage.clear();
      showToast("Library system restored to factory settings.", "info");
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="animate-slide">
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }} className="text-glow-purple">
            System Terminal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Console activity stream logging real-time member checkouts and inventory audits.
          </p>
        </div>

        {/* Action button deck */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="secondary-btn" onClick={handleExport}>
            <Download size={14} /> Export Backup
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            style={{ display: 'none' }} 
            accept=".json"
          />
          <button className="secondary-btn" onClick={triggerFileInput}>
            <Upload size={14} /> Import Backup
          </button>
          
          <button className="danger-btn" onClick={handleFactoryReset}>
            <RotateCcw size={14} /> Factory Reset
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-pill-container">
        {['all', 'checkout', 'return', 'system', 'admin', 'fine'].map((filter) => (
          <button
            key={filter}
            className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
            style={{ textTransform: 'uppercase' }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Terminal Display */}
      <div className="logs-console">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>
          <Terminal size={12} color="var(--accent-secondary)" />
          BIBLIOTHECA AUDIT CONSOLE LOGS // CONNECTED STATUS: ACTIVE
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '60px' }}>
            Console output buffer is empty for the selected filters.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="log-line">
              <span className="log-timestamp">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span className={`log-tag ${log.type}`}>
                {log.type}
              </span>
              <span className="log-message">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Sandbox warning banner */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '16px 20px', marginTop: '25px', background: 'rgba(239, 68, 68, 0.03)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5', marginBottom: '3px' }}>
            System Administration Notice
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Importing custom backups overwrites all active catalog records. Please ensure your files use valid Bibliotheca JSON schemes containing books, users, and borrowing logs.
          </p>
        </div>
      </div>
    </div>
  );
}
