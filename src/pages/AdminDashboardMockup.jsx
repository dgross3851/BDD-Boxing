import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Shield, Users, RefreshCw, LogOut, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const AdminDashboardMockup = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050505',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header Bar */}
      <header style={{
        borderBottom: '1px solid rgba(202, 59, 36, 0.3)',
        backgroundColor: '#0a0a0a',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: '#ca3b24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Shield style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }}>
              ADMINISTRATOR DASHBOARD
            </span>
            <span style={{ fontSize: '12px', color: '#ff8a7a', display: 'block' }}>
              BDD Boxing Supabase Control Center
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={{
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ccc',
            padding: '8px 14px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ArrowLeft style={{ width: '14px', height: '14px' }} />
            User Dashboard
          </Link>

          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: '#ca3b24',
              border: 'none',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
            Sign Out
          </button>
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
