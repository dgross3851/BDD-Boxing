import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AvatarDropdown } from '../components/AvatarDropdown';
import { User, Phone, Mail, Shield, Save, CheckCircle, AlertCircle, ArrowLeft, Camera, Loader2, Trash2 } from 'lucide-react';

export const Profile = () => {
  const { user, profile, role, avatarUrl, refreshProfile, refreshAvatar } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  // Sync state with context profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Only JPEG, PNG, WEBP, and GIF images are allowed.' });
      return;
    }

    // Validate size limit (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setFeedback({ type: 'error', message: 'Image size must be less than 2MB.' });
      return;
    }

    setUploading(true);
    setFeedback({ type: '', message: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload file to the storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update database profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh cache in context
      await refreshProfile();
      await refreshAvatar(filePath);
      setFeedback({ type: 'success', message: 'Profile picture updated successfully!' });
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to upload profile picture.' });
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!profile?.avatar_url) return;

    setUploading(true);
    setFeedback({ type: '', message: '' });

    try {
      // Remove from storage bucket
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([profile.avatar_url]);

      if (deleteError) throw deleteError;

      // Nullify database column
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh context cache
      await refreshProfile();
      await refreshAvatar(null);
      setFeedback({ type: 'success', message: 'Profile picture removed successfully!' });
    } catch (err) {
      console.error('Error deleting avatar:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to remove profile picture.' });
    } finally {
      setUploading(false);
    }
  };

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
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .avatar-hover-container:hover .avatar-hover-overlay {
              opacity: 1 !important;
            }
          `}} />
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Profile Picture Upload Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              paddingBottom: '24px'
            }}>
              <div 
                className="avatar-hover-container"
                style={{
                  position: 'relative',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: '2px solid rgba(202, 59, 36, 0.5)',
                  boxShadow: '0 0 20px rgba(202, 59, 36, 0.25)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0a0a0a'
                }}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 style={{ width: '28px', height: '28px', color: '#ca3b24', animation: 'spin 1s linear infinite' }} />
                ) : avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar Preview" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }} 
                  />
                ) : (
                  <div style={{
                    color: '#888',
                    fontSize: '28px',
                    fontWeight: '800'
                  }}>
                    {profile?.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                
                {/* Hover overlay to change photo */}
                <div 
                  className="avatar-hover-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    opacity: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.2s ease',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '8px'
                  }}
                >
                  <Camera style={{ width: '18px', height: '18px', marginBottom: '4px' }} />
                  Change Photo
                </div>
              </div>

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload}
                accept="image/jpeg, image/png, image/webp, image/gif"
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#ccc',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Upload Photo
                </button>
                {profile?.avatar_url && (
                  <button
                    type="button"
                    onClick={handleAvatarDelete}
                    disabled={uploading}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(202, 59, 36, 0.3)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: '#ff8a7a',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 style={{ width: '12px', height: '12px' }} />
                    Remove
                  </button>
                )}
              </div>
              <span style={{ fontSize: '11px', color: '#666' }}>Max file size 2MB (JPG, PNG, WEBP, GIF)</span>
            </div>

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
