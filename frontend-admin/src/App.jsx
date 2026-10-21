import React, { useState, useEffect } from 'react';
import { fetchStaff, createStaff, updateStaff, fetchMetadata, fetchRoster, createShift, recordClockOverride, fetchAuditLogs } from './api';
import { Users, UserPlus, RefreshCw, Building2, Calendar, Clock, PlusCircle, Edit, ShieldAlert, KeyRound, FileText, LogOut, Lock } from 'lucide-react';
import Reports from './pages/Reports';

export default function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loginCode, setLoginCode] = useState('ADM001');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('staff');
  const [staffList, setStaffList] = useState([]);
  const [rosterList, setRosterList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [metadata, setMetadata] = useState({ departments: [], roles: [] });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Selected User for Editing
  const [editingUserId, setEditingUserId] = useState(null);

  // Forms
  const [staffFormData, setStaffFormData] = useState({
    employee_code: '', first_name: '', last_name: '', email: '', pin: '',
    dept_id: '', role_id: '', contract_type: 'Full-Time', hourly_rate: 28.50, weekly_max_hours: 38.00
  });

  const [editStaffFormData, setEditStaffFormData] = useState({
    first_name: '', last_name: '', email: '', pin: '',
    dept_id: '', role_id: '', is_active: 1
  });

  const [shiftFormData, setShiftFormData] = useState({
    user_id: '',
    shift_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '16:30',
    break_duration_mins: 30
  });

  const [overrideFormData, setOverrideFormData] = useState({
    userId: '',
    eventType: 'CLOCK_IN',
    eventTimestamp: `${new Date().toISOString().split('T')[0]}T08:00`,
    breakReason: '',
    overrideReason: '',
    supervisorPin: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [staffRes, metaRes, rosterRes, auditRes] = await Promise.all([
        fetchStaff(),
        fetchMetadata(),
        fetchRoster(),
        fetchAuditLogs()
      ]);
      setStaffList(staffRes.data || []);
      setMetadata(metaRes.data || { departments: [], roles: [] });
      setRosterList(rosterRes.data || []);
      setAuditLogs(auditRes.data || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      if (err.response?.status === 401) {
        handleLogout();
        setMessage({ text: 'Session expired. Please log in again.', type: 'error' });
      } else {
        setMessage({ text: 'Error connecting to backend API.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: loginCode, 
          employeeCode: loginCode,
          password: loginPin,
          pin: loginPin 
        })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setLoginPin('');
      } else {
        setLoginError(data.error || 'Invalid Admin Credentials');
      }
    } catch (err) {
      setLoginError('Server connection failed. Ensure Backend is on port 5000.');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setStaffList([]);
    setRosterList([]);
    setAuditLogs([]);
  };

  const handleStaffInputChange = (e) => {
    const { name, value } = e.target;
    setStaffFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditStaffInputChange = (e) => {
    const { name, value } = e.target;
    setEditStaffFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShiftInputChange = (e) => {
    const { name, value } = e.target;
    setShiftFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOverrideInputChange = (e) => {
    const { name, value } = e.target;
    setOverrideFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await createStaff(staffFormData);
      setMessage({ text: `Staff member ${staffFormData.first_name} ${staffFormData.last_name} created successfully!`, type: 'success' });
      setIsStaffModalOpen(false);
      setStaffFormData({
        employee_code: '', first_name: '', last_name: '', email: '', pin: '',
        dept_id: '', role_id: '', contract_type: 'Full-Time', hourly_rate: 28.50, weekly_max_hours: 38.00
      });
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || 'Failed to create staff member.', type: 'error' });
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUserId(user.user_id);
    const deptObj = metadata.departments.find(d => d.dept_name === user.dept_name);
    const roleObj = metadata.roles.find(r => r.role_name === user.role_name);

    setEditStaffFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      pin: '',
      dept_id: deptObj ? deptObj.dept_id : '',
      role_id: roleObj ? roleObj.role_id : '',
      is_active: user.is_active
    });
    setIsEditStaffModalOpen(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      await updateStaff(editingUserId, editStaffFormData);
      setMessage({ text: `Staff member updated successfully!`, type: 'success' });
      setIsEditStaffModalOpen(false);
      setEditingUserId(null);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || 'Failed to update staff member.', type: 'error' });
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...shiftFormData,
        start_time: shiftFormData.start_time.length === 5 ? `${shiftFormData.start_time}:00` : shiftFormData.start_time,
        end_time: shiftFormData.end_time.length === 5 ? `${shiftFormData.end_time}:00` : shiftFormData.end_time
      };
      await createShift(formattedData);
      setMessage({ text: 'Shift assigned successfully!', type: 'success' });
      setIsShiftModalOpen(false);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || 'Failed to assign shift.', type: 'error' });
    }
  };

  // Close & Clean Override Modal
  const closeOverrideModal = () => {
    setIsOverrideModalOpen(false);
    setOverrideFormData({
      userId: '',
      eventType: 'CLOCK_IN',
      eventTimestamp: `${new Date().toISOString().split('T')[0]}T08:00`,
      breakReason: '',
      overrideReason: '',
      supervisorPin: ''
    });
  };

  const handleRecordOverride = async (e) => {
    e.preventDefault();
    try {
      await recordClockOverride(overrideFormData);
      setMessage({ text: 'Clocking override recorded successfully with supervisor audit log!', type: 'success' });
      closeOverrideModal();
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || 'Failed to record clock override.', type: 'error' });
    }
  };

  const toggleStatus = async (user) => {
    try {
      await updateStaff(user.user_id, { is_active: user.is_active ? 0 : 1 });
      loadDashboardData();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-AU', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={styles.page}>
      {/* AUTHENTICATION OVERLAY MODAL */}
      {!token && (
        <div style={styles.loginOverlay}>
          <div style={styles.loginModal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Lock size={26} color="#D32F2F" />
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                Admin Portal Authentication
              </h2>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#4B5563' }}>
              Enter administrative credentials to access staff rosters, overrides, and compliance reports.
            </p>

            <form onSubmit={handleLogin} style={styles.form}>
              <div>
                <label style={styles.label}>Admin Employee Code</label>
                <input
                  required
                  style={styles.input}
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  placeholder="e.g. ADM001"
                />
              </div>

              <div>
                <label style={styles.label}>4-Digit PIN Code</label>
                <input
                  required
                  type="password"
                  maxLength={4}
                  style={styles.input}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="Enter 4-Digit PIN"
                />
              </div>

              {loginError && (
                <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: 'bold', margin: '4px 0 0 0' }}>
                  {loginError}
                </p>
              )}

              <button type="submit" style={{ ...styles.primaryBtn, marginTop: '12px', justifyContent: 'center' }}>
                Sign In to Portal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerTitle}>
          <Building2 size={28} color="#D32F2F" />
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#111' }}>
            Beerenberg Time Management — Admin Portal
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.refreshBtn} onClick={loadDashboardData}>
            <RefreshCw size={16} /> Refresh Data
          </button>
          <button style={{ ...styles.refreshBtn, color: '#C62828', borderColor: '#FFCDD2' }} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.navTabs}>
        <button
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'staff' ? '3px solid #D32F2F' : '3px solid transparent', color: activeTab === 'staff' ? '#D32F2F' : '#666' }}
          onClick={() => setActiveTab('staff')}
        >
          <Users size={18} /> Staff Management
        </button>
        <button
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'roster' ? '3px solid #D32F2F' : '3px solid transparent', color: activeTab === 'roster' ? '#D32F2F' : '#666' }}
          onClick={() => setActiveTab('roster')}
        >
          <Calendar size={18} /> Shift Rostering
        </button>
        <button
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'overrides' ? '3px solid #D32F2F' : '3px solid transparent', color: activeTab === 'overrides' ? '#D32F2F' : '#666' }}
          onClick={() => setActiveTab('overrides')}
        >
          <ShieldAlert size={18} /> Clock Overrides
        </button>
        <button
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'reports' ? '3px solid #D32F2F' : '3px solid transparent', color: activeTab === 'reports' ? '#D32F2F' : '#666' }}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={18} /> Compliance Reports
        </button>
      </nav>

      {/* Main Content Area */}
      <main style={styles.container}>
        {message.text && (
          <div style={{ ...styles.alert, backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E9', color: message.type === 'error' ? '#C62828' : '#2E7D32' }}>
            {message.text}
          </div>
        )}

        {/* TAB 1: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <>
            <div style={styles.actionBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#555" />
                <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Staff Members & Contracts ({staffList.length})</h2>
              </div>
              <button style={styles.primaryBtn} onClick={() => setIsStaffModalOpen(true)}>
                <UserPlus size={18} /> Add New Staff
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading staff records from MySQL...</p>
            ) : (
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Code</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Department</th>
                      <th style={styles.th}>Contract</th>
                      <th style={styles.th}>Hourly Rate</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((user) => (
                      <tr key={user.user_id} style={styles.tr}>
                        <td style={styles.td}><strong>{user.employee_code}</strong></td>
                        <td style={styles.td}>{user.first_name} {user.last_name}</td>
                        <td style={styles.td}>{user.role_name || 'Unassigned'}</td>
                        <td style={styles.td}>{user.dept_name || 'Unassigned'}</td>
                        <td style={styles.td}>{user.contract_type || 'N/A'}</td>
                        <td style={styles.td}>{user.hourly_rate ? `$${parseFloat(user.hourly_rate).toFixed(2)}/hr` : 'N/A'}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, backgroundColor: user.is_active ? '#E8F5E9' : '#FFEBEE', color: user.is_active ? '#2E7D32' : '#C62828' }}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              style={styles.editBtn}
                              onClick={() => handleOpenEditModal(user)}
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              style={user.is_active ? styles.deactivateBtn : styles.activateBtn}
                              onClick={() => toggleStatus(user)}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB 2: SHIFT ROSTERING */}
        {activeTab === 'roster' && (
          <>
            <div style={styles.actionBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#555" />
                <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Scheduled Shifts ({rosterList.length})</h2>
              </div>
              <button style={styles.primaryBtn} onClick={() => setIsShiftModalOpen(true)}>
                <PlusCircle size={18} /> Assign New Shift
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading roster schedules...</p>
            ) : (
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Shift ID</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Staff Member</th>
                      <th style={styles.th}>Department</th>
                      <th style={styles.th}>Start Time</th>
                      <th style={styles.th}>End Time</th>
                      <th style={styles.th}>Planned Break</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterList.map((shift) => (
                      <tr key={shift.shift_id} style={styles.tr}>
                        <td style={styles.td}><strong>#{shift.shift_id}</strong></td>
                        <td style={styles.td}>{formatDate(shift.shift_date)}</td>
                        <td style={styles.td}>{shift.first_name} {shift.last_name} ({shift.employee_code})</td>
                        <td style={styles.td}>{shift.dept_name || 'N/A'}</td>
                        <td style={styles.td}><Clock size={14} /> {shift.start_time}</td>
                        <td style={styles.td}><Clock size={14} /> {shift.end_time}</td>
                        <td style={styles.td}>{shift.break_duration_mins} mins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB 3: CLOCK OVERRIDES & AUDIT TRAIL */}
        {activeTab === 'overrides' && (
          <>
            <div style={styles.actionBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#D32F2F" />
                <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Supervisor Manual Overrides & Audit Trail ({auditLogs.length})</h2>
              </div>
              <button style={styles.primaryBtn} onClick={() => setIsOverrideModalOpen(true)}>
                <KeyRound size={18} /> Manual Clock Override
              </button>
            </div>

            <div style={{ ...styles.infoCard, marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#B91C1C' }}>Fair Work Audit Compliance Log</h3>
              <p style={{ margin: 0, color: '#7F1D1D', fontSize: '14px', lineHeight: '1.5' }}>
                All manual clocking adjustments bypass automated kiosk verification. Under Australian Fair Work Award guidelines, manual edits must include a valid audit reason and require authorization from a Supervisor or Admin PIN.
              </p>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading audit logs...</p>
            ) : (
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Event ID</th>
                      <th style={styles.th}>Timestamp</th>
                      <th style={styles.th}>Staff Member</th>
                      <th style={styles.th}>Event Type</th>
                      <th style={styles.th}>Verification</th>
                      <th style={styles.th}>Audit Reason / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#888' }}>
                          No manual override events logged yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.event_id} style={styles.tr}>
                          <td style={styles.td}><strong>#{log.event_id}</strong></td>
                          <td style={styles.td}>{formatDate(log.event_timestamp)}</td>
                          <td style={styles.td}>{log.first_name} {log.last_name} ({log.employee_code})</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, backgroundColor: '#E0F2FE', color: '#0369A1' }}>
                              {log.event_type}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {/* Fixed High Contrast Badge (#713F12 on #FEF3C7) */}
                            <span style={{ ...styles.badge, backgroundColor: '#FEF3C7', color: '#713F12' }}>
                              {log.verification_method}
                            </span>
                          </td>
                          <td style={{ ...styles.td, color: '#4B5563', fontSize: '13px' }}>
                            {log.break_reason || 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB 4: COMPLIANCE REPORTS */}
        {activeTab === 'reports' && <Reports />}
      </main>

      {/* Modal 1: Add Staff */}
      {isStaffModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0, color: '#111' }}>Add New Staff Member</h3>
            <form onSubmit={handleCreateStaff} style={styles.form}>
              <div style={styles.formRow}>
                <input required style={styles.input} name="employee_code" placeholder="Employee Code (e.g. EMP002)" value={staffFormData.employee_code} onChange={handleStaffInputChange} />
                <input required style={styles.input} name="pin" placeholder="4-Digit PIN Code" type="password" maxLength={4} value={staffFormData.pin} onChange={handleStaffInputChange} />
              </div>
              <div style={styles.formRow}>
                <input required style={styles.input} name="first_name" placeholder="First Name" value={staffFormData.first_name} onChange={handleStaffInputChange} />
                <input required style={styles.input} name="last_name" placeholder="Last Name" value={staffFormData.last_name} onChange={handleStaffInputChange} />
              </div>
              <input style={styles.input} name="email" placeholder="Email Address (Optional)" value={staffFormData.email} onChange={handleStaffInputChange} />
              
              <div style={styles.formRow}>
                <select required style={styles.input} name="dept_id" value={staffFormData.dept_id} onChange={handleStaffInputChange}>
                  <option value="">Select Department</option>
                  {metadata.departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                </select>
                <select required style={styles.input} name="role_id" value={staffFormData.role_id} onChange={handleStaffInputChange}>
                  <option value="">Select System Role</option>
                  {metadata.roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                </select>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Contract Details</h4>

              <div style={styles.formRow}>
                <select style={styles.input} name="contract_type" value={staffFormData.contract_type} onChange={handleStaffInputChange}>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Casual">Casual</option>
                </select>
                <input required style={styles.input} type="number" step="0.01" name="hourly_rate" placeholder="Hourly Rate ($)" value={staffFormData.hourly_rate} onChange={handleStaffInputChange} />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setIsStaffModalOpen(false)}>Cancel</button>
                <button type="submit" style={styles.primaryBtn}>Save Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Staff */}
      {isEditStaffModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0, color: '#111' }}>Edit Staff Member</h3>
            <form onSubmit={handleUpdateStaff} style={styles.form}>
              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>First Name</label>
                  <input required style={styles.input} name="first_name" value={editStaffFormData.first_name} onChange={handleEditStaffInputChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Last Name</label>
                  <input required style={styles.input} name="last_name" value={editStaffFormData.last_name} onChange={handleEditStaffInputChange} />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Email Address</label>
                  <input style={styles.input} name="email" value={editStaffFormData.email} onChange={handleEditStaffInputChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Kiosk PIN Code (4 Digits)</label>
                  <input style={styles.input} name="pin" type="password" maxLength={4} placeholder="Leave blank to keep current" value={editStaffFormData.pin} onChange={handleEditStaffInputChange} />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Department</label>
                  <select style={styles.input} name="dept_id" value={editStaffFormData.dept_id} onChange={handleEditStaffInputChange}>
                    <option value="">Select Department</option>
                    {metadata.departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>System Role</label>
                  <select style={styles.input} name="role_id" value={editStaffFormData.role_id} onChange={handleEditStaffInputChange}>
                    <option value="">Select System Role</option>
                    {metadata.roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={styles.label}>Account Status</label>
                <select style={styles.input} name="is_active" value={editStaffFormData.is_active} onChange={handleEditStaffInputChange}>
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setIsEditStaffModalOpen(false)}>Cancel</button>
                <button type="submit" style={styles.primaryBtn}>Update Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Assign Shift */}
      {isShiftModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0, color: '#111' }}>Assign Shift to Staff</h3>
            <form onSubmit={handleCreateShift} style={styles.form}>
              <select required style={styles.input} name="user_id" value={shiftFormData.user_id} onChange={handleShiftInputChange}>
                <option value="">Select Staff Member</option>
                {staffList.map(s => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.first_name} {s.last_name} ({s.employee_code})
                  </option>
                ))}
              </select>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Shift Date</label>
                  <input required style={styles.input} type="date" name="shift_date" value={shiftFormData.shift_date} onChange={handleShiftInputChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Planned Break (mins)</label>
                  <input required style={styles.input} type="number" name="break_duration_mins" value={shiftFormData.break_duration_mins} onChange={handleShiftInputChange} />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Start Time</label>
                  <input required style={styles.input} type="time" name="start_time" value={shiftFormData.start_time} onChange={handleShiftInputChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>End Time</label>
                  <input required style={styles.input} type="time" name="end_time" value={shiftFormData.end_time} onChange={handleShiftInputChange} />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setIsShiftModalOpen(false)}>Cancel</button>
                <button type="submit" style={styles.primaryBtn}>Assign Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Clock Override Modal */}
      {isOverrideModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <ShieldAlert size={24} color="#D32F2F" />
              <h3 style={{ margin: 0, color: '#111' }}>Manual Clock Override</h3>
            </div>
            
            <form onSubmit={handleRecordOverride} style={styles.form}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Target Staff Member</label>
                <select required style={styles.input} name="userId" value={overrideFormData.userId} onChange={handleOverrideInputChange}>
                  <option value="">Select Staff Member</option>
                  {staffList.map(s => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.first_name} {s.last_name} ({s.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Event Type</label>
                  <select required style={styles.input} name="eventType" value={overrideFormData.eventType} onChange={handleOverrideInputChange}>
                    <option value="CLOCK_IN">CLOCK IN</option>
                    <option value="BREAK_START">START BREAK</option>
                    <option value="BREAK_END">END BREAK</option>
                    <option value="CLOCK_OUT">CLOCK OUT</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Adjusted Date & Time</label>
                  <input required style={styles.input} type="datetime-local" name="eventTimestamp" value={overrideFormData.eventTimestamp} onChange={handleOverrideInputChange} />
                </div>
              </div>

              {(overrideFormData.eventType === 'BREAK_START' || overrideFormData.eventType === 'BREAK_END') && (
                <div>
                  <label style={styles.label}>Break Category</label>
                  <select style={styles.input} name="breakReason" value={overrideFormData.breakReason} onChange={handleOverrideInputChange}>
                    <option value="">Select Category</option>
                    <option value="Meal / Lunch Break">Meal / Lunch Break</option>
                    <option value="Rest / Tea Break">Rest / Tea Break</option>
                    <option value="Authorized Special Break">Authorized Special Break</option>
                  </select>
                </div>
              )}

              <div>
                <label style={styles.label}>Mandatory Audit Reason</label>
                <textarea 
                  required 
                  style={{ ...styles.input, height: '60px', fontFamily: 'inherit' }} 
                  name="overrideReason" 
                  placeholder="e.g. Forgot to clock in, Kiosk hardware reboot, Approved shift adjustment..." 
                  value={overrideFormData.overrideReason} 
                  onChange={handleOverrideInputChange} 
                />
              </div>

              <div style={{ backgroundColor: '#FEF2F2', padding: '12px', borderRadius: '6px', border: '1px solid #FCA5A5' }}>
                <label style={{ ...styles.label, color: '#991B1B' }}>Supervisor Authorization PIN</label>
                <input 
                  required 
                  type="password" 
                  maxLength={4} 
                  style={styles.input} 
                  name="supervisorPin" 
                  placeholder="Enter Supervisor / Admin 4-Digit PIN" 
                  value={overrideFormData.supervisorPin} 
                  onChange={handleOverrideInputChange} 
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.secondaryBtn} onClick={closeOverrideModal}>Cancel</button>
                <button type="submit" style={{ ...styles.primaryBtn, backgroundColor: '#B91C1C' }}>Submit Manual Override</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#F8F9FA', minHeight: '100vh', color: '#212529' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E9ECEF' },
  headerTitle: { display: 'flex', alignItems: 'center', gap: '12px' },
  navTabs: { display: 'flex', gap: '24px', backgroundColor: '#FFFFFF', padding: '0 32px', borderBottom: '1px solid #E9ECEF' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 4px', background: 'none', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' },
  // Added 64px bottom padding to container to ensure rows #17+ aren't cut off
  container: { padding: '32px 32px 64px 32px', maxWidth: '1200px', margin: '0 auto' },
  actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#D32F2F', color: '#FFF', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: '#E0E0E0', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFF', border: '1px solid #CCC', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' },
  // Added overflowX and bottom margin for proper table spacing
  tableCard: { backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E9ECEF', overflowX: 'auto', marginBottom: '30px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeader: { backgroundColor: '#F1F3F5', borderBottom: '1px solid #E9ECEF' },
  th: { padding: '14px 16px', fontSize: '13px', color: '#495057' },
  tr: { borderBottom: '1px solid #F1F3F5' },
  td: { padding: '14px 16px', fontSize: '14px' },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  editBtn: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#E3F2FD', color: '#1976D2', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  activateBtn: { backgroundColor: '#E8F5E9', color: '#2E7D32', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  deactivateBtn: { backgroundColor: '#FFEBEE', color: '#C62828', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  alert: { padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' },
  infoCard: { backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '16px', borderRadius: '8px', marginTop: '16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loginOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  loginModal: { backgroundColor: '#FFF', padding: '32px', borderRadius: '8px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' },
  modal: { backgroundColor: '#FFF', padding: '24px', borderRadius: '8px', width: '520px', maxWidth: '90%' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formRow: { display: 'flex', gap: '12px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '4px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }
};