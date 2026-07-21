import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AvatarDropdown } from '../components/AvatarDropdown';
import { Shield, Users, RefreshCw, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const AdminDashboardMockup = () => {
  const { user, profile } = useAuth();

  const [profilesList, setProfilesList] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchAllProfiles = async () => {
    setLoadingProfiles(true);
    setFeedbackMsg('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfilesList(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    fetchAllProfiles();
  }, []);

  const handleRoleChange = async (targetId, newRole) => {
    try {
      setFeedbackMsg('');
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetId);

      if (error) throw error;
      setFeedbackMsg(`Role updated to "${newRole}" successfully!`);
      await fetchAllProfiles();
    } catch (err) {
      setFeedbackMsg(`Failed to update role: ${err.message}`);
    }
  };

  const handleStatusChange = async (targetId, newStatus) => {
    try {
      setFeedbackMsg('');
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', targetId);

      if (error) throw error;
      setFeedbackMsg(`Status updated to "${newStatus}"!`);
      await fetchAllProfiles();
    } catch (err) {
      setFeedbackMsg(`Failed to update status: ${err.message}`);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050505',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header Bar */}
      <header style={{ position: 'relative' }}>
        <div className="nav-container">
          <a href="index.html" className="nav-logo" id="header-logo-link">
            <img src="assets/bbd-boxing-logo-updated.jpeg" alt="BDD Boxing Logo" width="50" height="50" />
            <span className="nav-logo-text">BDD <span>BOXING</span></span>
          </a>
          
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <ul className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <li><a href="index.html" className="nav-link">Home</a></li>
            <li><a href="programs.html" className="nav-link">Programs</a></li>
            <li><a href="about-coach.html" className="nav-link">About Coach</a></li>
            <li><a href="training.html" className="nav-link">Training</a></li>
            <li><a href="schedule.html" className="nav-link">Schedule</a></li>
            <li><a href="events.html" className="nav-link">Events</a></li>
            <li><a href="contact.html" className="nav-link">Contact</a></li>
          </ul>

          <div className="header-cta">
            <AvatarDropdown />
            <a href="contact.html" className="btn btn-primary" id="header-cta-btn">Book First Session</a>
          </div>
        </div>
      </header>

      {/* Body Content */}
      <main style={{ maxWidth: '1100px', margin: '36px auto', padding: '0 20px' }}>
        {/* Verification Success Banner */}
        <div style={{
          backgroundColor: 'rgba(202, 59, 36, 0.12)',
          border: '1px solid #ca3b24',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <ShieldCheck style={{ width: '32px', height: '32px', color: '#ca3b24', flexShrink: 0 }} />
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#ff8a7a' }}>
              Admin Access Guard Confirmed!
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#ddd' }}>
              Your account <strong style={{ color: '#fff' }}>{user?.email}</strong> is verified as an <strong style={{ color: '#ca3b24' }}>ADMIN</strong>. Protected route guards are working properly.
            </p>
          </div>
        </div>

        {feedbackMsg && (
          <div style={{
            backgroundColor: feedbackMsg.startsWith('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
            border: `1px solid ${feedbackMsg.startsWith('Error') ? '#ef4444' : '#22c55e'}`,
            color: feedbackMsg.startsWith('Error') ? '#fca5a5' : '#86efac',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {feedbackMsg}
          </div>
        )}

        {/* User Management Section */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users style={{ color: '#ca3b24', width: '22px', height: '22px' }} />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Registered Profiles Ledger</h2>
            </div>

            <button
              onClick={fetchAllProfiles}
              disabled={loadingProfiles}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw style={{ width: '14px', height: '14px', animation: loadingProfiles ? 'spin 1s linear infinite' : 'none' }} />
              Refresh Profiles
            </button>
          </div>

          {loadingProfiles ? (
            <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>Loading user profiles from Supabase...</p>
          ) : profilesList.length === 0 ? (
            <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>No profiles found in database.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#888' }}>
                    <th style={{ padding: '12px' }}>Full Name</th>
                    <th style={{ padding: '12px' }}>Email</th>
                    <th style={{ padding: '12px' }}>Phone</th>
                    <th style={{ padding: '12px' }}>Role</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profilesList.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#fff' }}>{p.full_name || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#ccc' }}>{p.email}</td>
                      <td style={{ padding: '12px', color: '#aaa' }}>{p.phone || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          backgroundColor: p.role === 'admin' ? '#ca3b24' : p.role === 'client' ? '#16a34a' : '#2563eb',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {p.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          color: p.status === 'banned' ? '#ef4444' : '#22c55e',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          {p.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {/* Role Toggle Button */}
                          <select
                            value={p.role}
                            onChange={(e) => handleRoleChange(p.id, e.target.value)}
                            style={{
                              backgroundColor: '#0a0a0a',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#fff',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="user">USER</option>
                            <option value="client">CLIENT</option>
                            <option value="admin">ADMIN</option>
                          </select>

                          {/* Status Toggle Button */}
                          <button
                            onClick={() => handleStatusChange(p.id, p.status === 'banned' ? 'active' : 'banned')}
                            style={{
                              backgroundColor: p.status === 'banned' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              border: `1px solid ${p.status === 'banned' ? '#22c55e' : '#ef4444'}`,
                              color: p.status === 'banned' ? '#86efac' : '#fca5a5',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {p.status === 'banned' ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
