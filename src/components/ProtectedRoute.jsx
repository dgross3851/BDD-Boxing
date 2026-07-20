import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505',
        color: '#ca3b24'
      }}>
        <Loader2 style={{ animation: 'spin 1s linear infinite', width: '40px', height: '40px', marginBottom: '16px' }} />
        <p style={{ color: '#888', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>Authenticating Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.status === 'banned') {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505',
        color: '#ffffff',
        padding: '24px',
        textAlign: 'center'
      }}>
        <ShieldAlert style={{ width: '64px', height: '64px', color: '#ca3b24', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#ca3b24' }}>Account Suspended</h2>
        <p style={{ color: '#aaa', maxWidth: '440px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
          Your account has been restricted from accessing BDD Boxing portals. If you believe this is an error, please contact Coach Jrob at the gym.
        </p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect non-admin attempting admin access to user dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
