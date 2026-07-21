import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const Signup = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      await signUp({ email, password, fullName, phone });
      window.location.href = '/index.html';
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050505',
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      {/* Header Branding */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#ca3b24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '18px',
            color: '#fff',
            boxShadow: '0 0 20px rgba(202, 59, 36, 0.4)'
          }}>
            BDD
          </div>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '1px' }}>
            BDD BOXING
          </span>
        </Link>
        <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>
          Create your account to access client booking & training portal
        </p>
      </div>

      {/* Auth Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#121212',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '32px',
        boxSizing: 'border-box',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', fontWeight: '700', color: '#ffffff', textAlign: 'center' }}>
          Get Started
        </h2>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(202, 59, 36, 0.15)',
            border: '1px solid #ca3b24',
            color: '#ff8a7a',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#ccc', marginBottom: '6px' }}>
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#666' }} />
              <input
                type="text"
                placeholder="e.g. Marcus Johnson"
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

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#ccc', marginBottom: '6px' }}>
              Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#666' }} />
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#ccc', marginBottom: '6px' }}>
              Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#666' }} />
              <input
                type="tel"
                placeholder="(828) 555-0199"
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

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#ccc', marginBottom: '6px' }}>
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#666' }} />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '10px',
              backgroundColor: '#ca3b24',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(202, 59, 36, 0.35)',
              opacity: submitting ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight style={{ width: '18px', height: '18px' }} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#888' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#ca3b24', textDecoration: 'none', fontWeight: '600' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
