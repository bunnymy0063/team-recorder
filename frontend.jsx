import React, { useState, useEffect } from 'react';

const TeamRecordTracker = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(!token);
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [showRecordDetailModal, setShowRecordDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form states
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [recordForm, setRecordForm] = useState({
    type: 'case',
    title: '',
    desc: '',
    respondent: '',
    status: 'open'
  });
  const [newComment, setNewComment] = useState('');

  // Login
  const handleLogin = async () => {
    if (!loginName.trim() || !loginEmail.trim()) {
      alert('Enter name and email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginName, email: loginEmail })
      });

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setCurrentUser(loginName);
        setCurrentUserEmail(loginEmail);
        setShowLoginModal(false);
        await fetchRecords(data.token);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch records
  const fetchRecords = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/records`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  // Create record
  const handleCreateRecord = async () => {
    if (!recordForm.title.trim() || !recordForm.respondent.trim()) {
      alert('Fill required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...recordForm,
          creator: currentUser,
          creatorEmail: currentUserEmail
        })
      });

      if (response.ok) {
        await fetchRecords(token);
        setShowNewRecordModal(false);
        setRecordForm({
          type: 'case',
          title: '',
          desc: '',
          respondent: '',
          status: 'open'
        });
        alert('Record created! Team notified.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedRecord) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/records/${selectedRecord._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          author: currentUser,
          text: newComment
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setSelectedRecord(updated);
        setNewComment('');
        await fetchRecords(token);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API_URL}/api/records/export/csv`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'records.csv';
        a.click();
      }
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  // Export single record JSON
  const handleExportRecord = async (recordId) => {
    try {
      const response = await fetch(`${API_URL}/api/records/${recordId}/export/json`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.title}.json`;
        a.click();
      }
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  // Filter records
  const filteredRecords = records.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.respondent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.desc && r.desc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const typeColors = {
    case: '#ef4444',
    task: '#3b82f6',
    discussion: '#f59e0b',
    decision: '#10b981'
  };

  if (showLoginModal) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Team Record Tracker</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>Shared workspace for cases, tasks, discussions</p>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Your name</label>
            <input
              type="text"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              placeholder="e.g., Bunny"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
          >
            {loading ? 'Logging in...' : 'Enter workspace'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '500' }}>Records</h1>
            <div style={{ fontSize: '13px', color: '#666' }}>Logged in as: {currentUser} ({currentUserEmail})</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleExportCSV}
              style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Export All (CSV)
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              Log out
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search records…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
          />
          <button
            onClick={() => setShowNewRecordModal(true)}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            + New record
          </button>
        </div>

        {/* Records List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              No records. Create one to start.
            </div>
          ) : (
            filteredRecords.map(record => (
              <div
                key={record._id}
                onClick={() => {
                  setSelectedRecord(record);
                  setShowRecordDetailModal(true);
                }}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: typeColors[record.type],
                        color: 'white',
                        marginRight: '8px'
                      }}
                    >
                      {record.type.toUpperCase()}
                    </span>
                    <div style={{ fontWeight: '500', marginTop: '4px' }}>{record.title}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{record.date} {record.time}</div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
                  <span><strong>Respondent:</strong> {record.respondent}</span>
                  <span><strong>Created by:</strong> {record.creator}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#dbeafe', color: '#1e40af' }}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Record Modal */}
      {showNewRecordModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowNewRecordModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>New record</span>
              <button
                onClick={() => setShowNewRecordModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Type</label>
              <select
                value={recordForm.type}
                onChange={(e) => setRecordForm({ ...recordForm, type: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
              >
                <option value="case">Case</option>
                <option value="task">Task</option>
                <option value="discussion">Discussion</option>
                <option value="decision">Decision</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Title</label>
              <input
                type="text"
                value={recordForm.title}
                onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
                placeholder="Brief title"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Description</label>
              <textarea
                value={recordForm.desc}
                onChange={(e) => setRecordForm({ ...recordForm, desc: e.target.value })}
                placeholder="Details…"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', minHeight: '80px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Who handled this?</label>
              <input
                type="text"
                value={recordForm.respondent}
                onChange={(e) => setRecordForm({ ...recordForm, respondent: e.target.value })}
                placeholder="Name or team member"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Status</label>
              <select
                value={recordForm.status}
                onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
              >
                <option value="open">Open</option>
                <option value="in-progress">In progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <button
              onClick={handleCreateRecord}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create record'}
            </button>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {showRecordDetailModal && selectedRecord && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowRecordDetailModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '500' }}>{selectedRecord.title}</h2>
              <button
                onClick={() => setShowRecordDetailModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  background: typeColors[selectedRecord.type],
                  color: 'white',
                  marginRight: '8px'
                }}
              >
                {selectedRecord.type.toUpperCase()}
              </span>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                {selectedRecord.date} {selectedRecord.time}
              </div>
            </div>

            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
              <p style={{ fontWeight: '500', marginBottom: '6px' }}>Description:</p>
              <p style={{ color: '#666', margin: 0 }}>{selectedRecord.desc || '(No description)'}</p>
            </div>

            <table style={{ width: '100%', fontSize: '13px', marginBottom: '16px' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#666', padding: '6px 0' }}><strong>Respondent:</strong></td>
                  <td style={{ padding: '6px 0' }}>{selectedRecord.respondent}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666', padding: '6px 0' }}><strong>Created by:</strong></td>
                  <td style={{ padding: '6px 0' }}>{selectedRecord.creator}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666', padding: '6px 0' }}><strong>Status:</strong></td>
                  <td style={{ padding: '6px 0' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: '500' }}>
                      {selectedRecord.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <button
              onClick={() => handleExportRecord(selectedRecord._id)}
              style={{
                padding: '6px 12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                marginBottom: '16px'
              }}
            >
              Export Record (JSON)
            </button>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <p style={{ fontWeight: '500', marginBottom: '12px' }}>Follow-ups & updates</p>

              <div style={{ marginBottom: '12px', maxHeight: '250px', overflowY: 'auto' }}>
                {selectedRecord.comments.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '13px' }}>No updates yet</p>
                ) : (
                  selectedRecord.comments.map((comment, idx) => (
                    <div key={idx} style={{ background: '#f9fafb', padding: '10px', borderRadius: '6px', marginBottom: '8px', fontSize: '13px' }}>
                      <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                        {comment.author} • {new Date(comment.time).toLocaleString()}
                      </div>
                      <div style={{ color: '#333' }}>{comment.text}</div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: '12px' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add update…"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    minHeight: '60px',
                    fontFamily: 'inherit',
                    marginBottom: '8px'
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {loading ? 'Adding...' : 'Add update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamRecordTracker;
