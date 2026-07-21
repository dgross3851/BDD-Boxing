import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Shield, ChevronDown, LayoutDashboard } from 'lucide-react';

export const AvatarDropdown = () => {
  const { user, profile, role, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await signOut();
      window.location.href = '/index.html';
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  // Get initials from user's full name
  const getInitials = () => {
    if (!profile?.full_name) {
      return user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';
    }
    const parts = profile.full_name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          outline: 'none'
        }}
      >
        {/* Circle Avatar */}
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: '#ca3b24',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '14px',
          boxShadow: '0 0 12px rgba(202, 59, 36, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {getInitials()}
        </div>
        <ChevronDown style={{ width: '14px', height: '14px', color: '#888', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: '8px',
          width: '220px',
          backgroundColor: '#121212',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* User Details Preview */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name || 'Fighter'}
            </div>
            <div style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
              {user?.email}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '4px' }}>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                color: '#ddd',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <User style={{ width: '16px', height: '16px', color: '#ca3b24' }} />
              Profile
            </Link>

            <Link
              to={role === 'admin' ? '/admin' : '/dashboard'}
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                color: '#ddd',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <LayoutDashboard style={{ width: '16px', height: '16px', color: '#ca3b24' }} />
              Dashboard
            </Link>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.05)', margin: '4px 0' }} />

            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                color: '#ff8a7a',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(202,59,36,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
