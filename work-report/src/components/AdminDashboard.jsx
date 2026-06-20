import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import './AdminDashboard.css';

const AdminDashboard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersData, reportsData] = await Promise.all([
          api.getAdminUsers(),
          api.getAllReports()
        ]);
        setUsers(usersData);
        setReports(reportsData);
      } catch (err) {
        console.error('Admin fetch error:', err);
        const msg = err.message || 'Failed to load admin data';
        setError(msg.includes('Admin access') ? msg : `Failed to load admin data: ${msg}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateRole = async (email, newRole) => {
    if (!window.confirm(`Change ${email} role to ${newRole}?`)) return;
    
    try {
      await api.updateAdminUser(email, newRole);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => 
      r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.report_date?.includes(searchTerm)
    );
  }, [reports, searchTerm]);

  const calculateUserStats = (userEmail) => {
    const userReports = reports.filter(r => r.user_email === userEmail);
    const totalTasks = userReports.reduce((sum, r) => sum + (r.tasks_data?.length || 0), 0);
    const avgTasks = userReports.length > 0 ? (totalTasks / userReports.length).toFixed(1) : 0;
    
    // Simple Performance Score (0-100)
    // based on report consistency (reports in last 7 days) and average task count
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReports = userReports.filter(r => new Date(r.report_date) >= sevenDaysAgo).length;
    const score = Math.min(100, (recentReports * 10) + (avgTasks * 5)).toFixed(0);

    return { totalReports: userReports.length, avgTasks, score };
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todayCount = reports.filter(r => r.report_date === today).length;
    const yesterdayCount = reports.filter(r => r.report_date === yesterdayStr).length;
    const trend = todayCount >= yesterdayCount ? 'up' : 'down';

    return {
      totalUsers: users.length,
      totalReports: reports.length,
      todayReports: todayCount,
      activeUsers: new Set(reports.map(r => r.user_email)).size,
      trend
    };
  }, [users, reports]);

  if (loading) return <div className="admin-dashboard loading animate-pulse">Initializing Management Console...</div>;
  if (error) return <div className="admin-dashboard error">{error}</div>;

  return (
    <div className="admin-dashboard animate-fade-in">
      <div className="admin-header">
        <h2>Industrial <span className="accent-text" style={{color: 'var(--admin-accent)'}}>Control Center</span></h2>
        <div style={{display: 'flex', gap: '1rem'}}>
           <button className="secondary" onClick={() => window.location.reload()}>Refresh</button>
           <button className="primary" style={{backgroundColor: 'rgba(255,255,255,0.1)'}} onClick={onClose}>Exit Dashboard</button>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <h4>Workforce Size</h4>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-trend trend-up">Registered Accounts</div>
        </div>
        <div className="stat-card">
          <h4>Cumulative Reports</h4>
          <div className="stat-value">{stats.totalReports}</div>
          <div className="stat-trend trend-up">All-time Archive</div>
        </div>
        <div className="stat-card">
          <h4>Daily Output</h4>
          <div className="stat-value">{stats.todayReports}</div>
          <div className={`stat-trend trend-${stats.trend}`}>
             {stats.trend === 'up' ? '↑ Increasing Activity' : '↓ Below Yesterday'}
          </div>
        </div>
        <div className="stat-card">
          <h4>Active Today</h4>
          <div className="stat-value">{stats.activeUsers}</div>
          <div className="stat-trend">Engaged Reporters</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Workforce Directory</button>
        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Global Report Stream</button>
      </div>

      <div className="admin-actions">
        <input 
          type="text" 
          placeholder="Filter by employee name, email, department or specific date..." 
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {activeTab === 'users' ? (
        <div className="users-grid">
          {filteredUsers.map(user => {
            const userStats = calculateUserStats(user.email);
            return (
              <div key={user.id} className="user-card animate-slide-up">
                <div className="user-card-header" style={{display: 'flex', gap: '1.2rem', alignItems: 'center'}}>
                  {user.photo ? (
                    <img src={user.photo} alt={user.name} className="user-avatar-large" />
                  ) : (
                    <div className="default-avatar-large">{user.name?.charAt(0) || 'U'}</div>
                  )}
                  <div className="user-main-info">
                    <span className="user-role-tag" style={{color: user.role === 'admin' ? 'var(--admin-accent)' : 'inherit'}}>
                      {user.role}
                    </span>
                    <h3>{user.name || 'User Profile Missing'}</h3>
                    <p style={{fontSize: '0.8rem', opacity: 0.6}}>{user.email}</p>
                  </div>
                </div>

                <div className="user-performance" style={{marginTop: '1.5rem'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                     <span style={{fontSize: '0.8rem', color: 'var(--admin-text-dim)'}}>System Performance Score</span>
                     <span className="performance-badge">{userStats.score}%</span>
                  </div>
                  <div style={{height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden'}}>
                    <div style={{width: `${userStats.score}%`, height: '100%', background: 'var(--admin-accent)', boxShadow: '0 0 10px var(--admin-accent-glow)'}}></div>
                  </div>
                </div>

                <div className="user-metric-grid">
                  <div className="metric-item">
                    <span className="label">Total Reports</span>
                    <span className="val">{userStats.totalReports}</span>
                  </div>
                  <div className="metric-item">
                    <span className="label">Avg Tasks</span>
                    <span className="val">{userStats.avgTasks}</span>
                  </div>
                </div>

                 <div style={{marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                   <button className="view-btn" style={{flex: '1 1 100%'}} onClick={() => { setActiveTab('reports'); setSearchTerm(user.email); }}>View History</button>
                   <button className="view-btn" style={{flex: '1', fontSize: '0.7rem', padding: '0 8px'}} onClick={() => handleUpdateRole(user.email, 'admin')}>Make Admin</button>
                   <button className="view-btn" style={{flex: '1', fontSize: '0.7rem', padding: '0 8px'}} onClick={() => handleUpdateRole(user.email, 'manager')}>Make Manager</button>
                   <button className="view-btn" style={{flex: '1', fontSize: '0.7rem', padding: '0 8px'}} onClick={() => handleUpdateRole(user.email, 'user')}>Make User</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="reports-table-container animate-fade-in">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Submission Date</th>
                <th>Employee Identity</th>
                <th>Classification</th>
                <th>Resource Count</th>
                <th>Operational Window</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id}>
                  <td>{report.report_date}</td>
                  <td>
                    <div style={{fontWeight: 700}}>{report.user_name}</div>
                    <div style={{fontSize: '0.7rem', color: 'var(--admin-text-dim)'}}>{report.user_email}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${report.category?.toLowerCase() || 'daily'}`}>
                      {report.category}
                    </span>
                  </td>
                  <td>{report.tasks_data?.length || 0} work items</td>
                  <td>{report.start_time} - {report.end_time}</td>
                  <td>
                     <button className="view-btn" onClick={() => setSelectedReport(report)}>Inspect Report</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport && (
        <div className="admin-modal-overlay animate-fade-in" onClick={() => setSelectedReport(null)}>
          <div className="admin-modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{margin: 0}}>{selectedReport.user_name}'s {selectedReport.category} Report</h3>
                <p style={{margin: '0.2rem 0 0', fontSize: '0.85rem', opacity: 0.6}}>
                  {selectedReport.report_date} &bull; {selectedReport.start_time} - {selectedReport.end_time}
                </p>
              </div>
              <button className="close-modal" onClick={() => setSelectedReport(null)}>✕</button>
            </div>
            <div className="modal-content">
              {selectedReport.expanded_data && selectedReport.expanded_data.length > 0 ? (
                <div className="task-list-admin">
                  <div style={{fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4, marginBottom: '1rem'}}>AI-Enhanced Report ({selectedReport.expanded_data.length} items)</div>
                  {selectedReport.expanded_data.map((task, idx) => (
                    <div key={idx} className="task-item-admin" style={{borderLeft: '3px solid var(--admin-accent, #6366f1)'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem'}}>
                        <span className="badge badge-daily" style={{fontSize: '0.7rem'}}>{task.category || 'Task'}</span>
                        <span className="task-time-admin">{task.startTime || ''} - {task.endTime || ''}</span>
                      </div>
                      <p style={{margin: 0, lineHeight: 1.6, fontSize: '0.95rem'}}>{task.expanded || task.text || ''}</p>
                      {task.original && task.original !== task.expanded && (
                        <p style={{margin: '0.4rem 0 0', fontSize: '0.75rem', opacity: 0.4, fontStyle: 'italic'}}>Original: {task.original}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="task-list-admin">
                  <div style={{fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4, marginBottom: '1rem'}}>Raw Task Log ({selectedReport.tasks_data?.length || 0} items)</div>
                  {selectedReport.tasks_data.map((task, idx) => (
                    <div key={idx} className="task-item-admin">
                      <span className="task-time-admin">{task.startTime} - {task.endTime}</span>
                      <p style={{margin: 0, lineHeight: 1.5}}>{task.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {(!selectedReport.tasks_data || selectedReport.tasks_data.length === 0) && (!selectedReport.expanded_data || selectedReport.expanded_data.length === 0) && (
                <div style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>No task data found in this report archive.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
