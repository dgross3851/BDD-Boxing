import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AvatarDropdown } from '../components/AvatarDropdown';
import { User, Phone, Mail, Shield, Save, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export const Profile = () => {
  const { user, profile, role, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Sync state with context profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!fullName.trim()) {
      setFeedback({ type: 'error', message: 'Full name cannot be blank.' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setFeedback({ type: 'success', message: 'Profile details updated successfully!' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
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
        position: 'relative',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0a0a0a',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ca3b24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '14px',
              color: '#fff'
            }}>
              BDD
            </div>
            <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', color: '#fff' }}>
              BDD BOXING
            </span>
          </Link>
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
            Back to Dashboard
          </Link>

          <AvatarDropdown />
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '640px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Profile Settings</h1>
        <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px 0' }}>
          Manage your personal details and account status
        </p>

        {feedback.message && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: feedback.type === 'error' ? 'rgba(202, 59, 36, 0.15)' : 'rgba(22, 163, 74, 0.15)',
            border: `1px solid ${feedback.type === 'error' ? '#ca3b24' : '#16a34a'}`,
            color: feedback.type === 'error' ? '#ff8a7a' : '#86efac',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            {feedback.type === 'error' ? (
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            ) : (
              <CheckCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div style={{
          backgroundColor: '#121212',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#ccc', marginBottom: '8px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#666' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '12px 12px 12px 40px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#ccc', marginBottom: '8px' }}>
                Email Address (Cannot be changed)
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#444' }} />
                <input
                  type="email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  style={{
                    width: '100%',
                    backgroundColor: '#070707',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '12px 12px 12px 40px',
                    color: '#666',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#ccc', marginBottom: '8px' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#666' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '12px 12px 12px 40px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Security Profile Role & Status Info */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '20px'
            }}>
              <div style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  User Role
                </span>
                <span style={{
                  color: role === 'admin' ? '#ca3b24' : role === 'client' ? '#16a34a' : '#2563eb',
                  fontWeight: '700',
                  fontSize: '14px'
                }}>
                  {role?.toUpperCase() || 'USER'}
                </span>
              </div>

              <div style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Account Status
                </span>
                <span style={{
                  color: profile?.status === 'banned' ? '#ca3b24' : '#16a34a',
                  fontWeight: '700',
                  fontSize: '14px'
                }}>
                  {profile?.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '16px',
                backgroundColor: '#ca3b24',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(202, 59, 36, 0.35)',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <Save style={{ width: '18px', height: '18px' }} />
              <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
