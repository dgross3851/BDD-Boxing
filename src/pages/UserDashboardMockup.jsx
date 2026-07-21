import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AvatarDropdown } from '../components/AvatarDropdown';
import { User, Shield, CheckCircle, Calendar } from 'lucide-react';

export const UserDashboardMockup = () => {
  const { user, profile, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050505',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Navbar Header */}
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

      {/* Main Body */}
      <main style={{ maxWidth: '960px', margin: '40px auto', padding: '0 20px' }}>
        {/* Welcome Banner */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '28px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>
                Welcome, {profile?.full_name || user?.email || 'Fighter'}!
              </h1>
              <span style={{
                backgroundColor: role === 'admin' ? '#ca3b24' : role === 'client' ? '#16a34a' : '#2563eb',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '800',
                padding: '4px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Role: {role || 'USER'}
              </span>
            </div>
            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
              Logged in as <strong style={{ color: '#ddd' }}>{user?.email}</strong>
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#aaa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle style={{ color: '#16a34a', width: '16px', height: '16px' }} />
            <span>Account Status: <strong style={{ color: '#fff' }}>{profile?.status?.toUpperCase() || 'ACTIVE'}</strong></span>
          </div>
        </div>

        {/* Info Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Card 1: User Profile */}
          <div style={{
            backgroundColor: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <User style={{ color: '#ca3b24', width: '20px', height: '20px' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Profile Details</h3>
            </div>
            <div style={{ fontSize: '14px', color: '#bbb', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div><strong>Full Name:</strong> {profile?.full_name || 'Not provided'}</div>
              <div><strong>Email:</strong> {profile?.email || user?.email}</div>
              <div><strong>Phone:</strong> {profile?.phone || 'Not provided'}</div>
              <div><strong>User ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#777' }}>{user?.id}</span></div>
            </div>
          </div>

          {/* Card 2: Training Status */}
          <div style={{
            backgroundColor: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Calendar style={{ color: '#ca3b24', width: '20px', height: '20px' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Training & Bookings</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              {role === 'client' 
                ? 'You are an active client. Book training slots for Monday Group Class or Tuesday Sparring sessions.'
                : 'Book your first training session to automatically transition your account to Client status!'}
            </p>
            <div style={{
              backgroundColor: '#0a0a0a',
              border: '1px border-dashed rgba(202, 59, 36, 0.3)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#ff8a7a',
              textAlign: 'center'
            }}>
              ✨ Phase 1 Auth Testing Active
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
