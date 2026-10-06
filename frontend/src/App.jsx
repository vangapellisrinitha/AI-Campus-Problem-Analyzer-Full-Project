import React, { useState, useEffect } from 'react';
import { checkHealth } from './services/api';
import ProblemSubmissionForm from './components/ProblemSubmissionForm';
import './App.css';

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  const fetchHealthStatus = async () => {
    setLoading(true);
    const result = await checkHealth();
    setHealthStatus(result);
    setLastChecked(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">🏛️</span>
          <div>
            <h1>AI Campus Problem Analyzer</h1>
            <p className="brand-subtitle">Smart Student Grievance & Issue Resolution Portal</p>
          </div>
        </div>
        <div className="header-badges">
          <div className="stage-badge">Stage 3: SQLite Storage</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Backend Connectivity Status Bar (Always Accessible) */}
        <section className="card health-banner-card">
          <div className="health-banner-header">
            <div className="health-status-summary">
              <span className="health-label">System Backend Status:</span>
              {loading ? (
                <span className="status-badge status-loading">
                  <span className="pulse-dot"></span> Checking connection...
                </span>
              ) : healthStatus?.success ? (
                <span className="status-badge status-success">
                  <span className="status-dot-success">●</span> Online (Port 5000)
                </span>
              ) : (
                <span className="status-badge status-error">
                  <span className="status-dot-error">●</span> Offline
                </span>
              )}
            </div>

            <div className="health-actions">
              <button
                onClick={() => setShowHealthDetails((prev) => !prev)}
                className="btn btn-text"
              >
                {showHealthDetails ? 'Hide Health Details ▲' : 'View Health Details ▼'}
              </button>
              <button
                onClick={fetchHealthStatus}
                className="btn btn-secondary btn-sm"
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Retest Health'}
              </button>
            </div>
          </div>

          {/* Collapsible Health Check Details */}
          {showHealthDetails && healthStatus && (
            <div className="status-details">
              {healthStatus.success ? (
                <div className="alert alert-success">
                  <strong>Backend Response:</strong> {healthStatus.data.message}
                  <div className="detail-meta">
                    <span>Server Timestamp: {healthStatus.data.timestamp}</span>
                    <span>Last Checked: {lastChecked}</span>
                  </div>
                </div>
              ) : (
                <div className="alert alert-error">
                  <strong>Connection Error:</strong> {healthStatus.error}
                  <div className="detail-meta">
                    <span>Ensure backend server is running on http://localhost:5000</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Student Problem Submission Feature */}
        <ProblemSubmissionForm />

        {/* Project Roadmap / Planned Modules */}
        <section className="modules-grid">
          <div className="card module-card module-active">
            <div className="module-header">
              <span className="module-icon">📝</span>
              <h3>Student Portal</h3>
            </div>
            <p className="module-desc">
              Active in Stage 2. Students can submit campus complaints across classrooms, labs, hostels, Wi-Fi, electrical, and transport issues.
            </p>
            <span className="tag tag-active">Active Feature</span>
          </div>

          <div className="card module-card">
            <div className="module-header">
              <span className="module-icon">🤖</span>
              <h3>AI Analysis Engine</h3>
            </div>
            <p className="module-desc">
              Processes submitted text to automatically determine category, assign severity/priority, summarize, and recommend responsible departments.
            </p>
            <span className="tag tag-pending">Planned: Stage 3</span>
          </div>

          <div className="card module-card">
            <div className="module-header">
              <span className="module-icon">📊</span>
              <h3>Admin Dashboard</h3>
            </div>
            <p className="module-desc">
              Campus authority portal to filter, review, track, and update problem status (Pending, Under Review, In Progress, Resolved).
            </p>
            <span className="tag tag-pending">Planned: Stage 4</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>AI Campus Problem Analyzer &bull; College Project &bull; React + Node.js + Express</p>
      </footer>
    </div>
  );
}

export default App;
