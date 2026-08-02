import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AvatarDropdown } from './AvatarDropdown';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BookOpen, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Menu,
  ShieldAlert,
  X
} from 'lucide-react';

const AdminLayout = ({ activeTab, setActiveTab, children }) => {
  const { user, profile, role, signOut, avatarUrl } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Listen to real-time changes
    const channel = supabase
      .channel(`realtime:notifications:${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          console.log('Real-time notification update received:', payload);
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Overview';
      case 'sessions': return 'Sessions & Categories';
      case 'clients': return 'Clients Management';
      case 'bookings': return 'Bookings & Schedule';
      case 'notifications': return 'Notifications Log';
      default: return 'Dashboard';
    }
  };

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Website Navigation Header */}
      <header className="main-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', zIndex: 1000, backgroundColor: '#050505', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center' }}>
        <div className="nav-container" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', margin: '0 auto', maxWidth: '1300px' }}>
          <a href="index.html" className="nav-logo" id="header-logo-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="assets/bbd-boxing-logo-updated.jpeg" alt="BDD Boxing Logo" style={{ height: '50px', width: 'auto', borderRadius: '4px' }} />
            <span className="nav-logo-text" style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff' }}>BDD <span style={{ color: '#ca3b24' }}>BOXING</span></span>
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
            
            {/* Mobile Profile Section (Only visible on mobile) */}
            <li className="mobile-only" style={{ marginTop: '1.5rem', width: '100%' }}>
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem', padding: '0 10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ca3b24',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                  boxShadow: '0 0 12px rgba(202, 59, 36, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile?.full_name ? profile.full_name.trim().split(/\s+/)[0].slice(0, 2).toUpperCase() : 'U'
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'left' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile?.full_name || 'Fighter'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                    {user?.email}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href={role === 'admin' ? 'portal.html#/admin' : 'portal.html#/dashboard'} onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary mobile-menu-cta" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: '700', width: '100%', textAlign: 'center' }}>
                  Dashboard
                </a>
                <a href="portal.html#/profile" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary mobile-menu-cta" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: '700', width: '100%', textAlign: 'center' }}>
                  Profile Settings
                </a>
                <button 
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                    window.location.href = '/index.html';
                  }} 
                  className="mobile-logout-btn" 
                  style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: '700', width: '100%', color: '#ff8a7a', backgroundColor: 'rgba(202, 59, 36, 0.1)', border: '1px solid rgba(202, 59, 36, 0.3)', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.2s', textAlign: 'center' }}
                >
                  Log Out
                </button>
              </div>
            </li>
          </ul>

          <div className="header-cta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <AvatarDropdown />
            <a href="contact.html" className="btn btn-primary" id="header-cta-btn" style={{ padding: '8px 16px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#ca3b24', color: '#fff', textDecoration: 'none' }}>Book First Session</a>
          </div>
        </div>
      </header>

      {/* Portal Layout Wrapper */}
      <div style={{
        display: 'flex',
        minHeight: 'calc(100vh - 80px)',
        marginTop: '80px',
        position: 'relative'
      }}>
        {/* Mobile Drawer Overlay */}
        {mobileOpen && (
          <div 
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              zIndex: 998,
              backdropFilter: 'blur(4px)'
            }}
          />
        )}

        {/* Sidebar Navigation */}
        <aside style={{
          width: collapsed ? '70px' : '260px',
          backgroundColor: '#121212',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: '80px',
          bottom: 0,
          left: 0,
          zIndex: 999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }} className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Mobile Tab Toggle Button (Sticks out of the sidebar on mobile) */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            position: 'absolute',
            right: '-46px',
            top: '15px',
            width: '46px',
            height: '46px',
            backgroundColor: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: 'none',
            borderRadius: '0 8px 8px 0',
            color: '#fff',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '4px 0 10px rgba(0,0,0,0.3)',
            outline: 'none',
            transition: 'background-color 0.2s'
          }}
          className="admin-mobile-sidebar-toggle"
        >
          {mobileOpen ? <X style={{ width: '20px', height: '20px' }} /> : <Menu style={{ width: '20px', height: '20px' }} />}
        </button>

        <div style={{ height: '20px' }}></div>

        {/* Sidebar Links */}
        <nav style={{ padding: '20px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? '0' : '12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: '12px',
                  backgroundColor: active ? 'rgba(202, 59, 36, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: active ? '#ca3b24' : '#888',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  fontWeight: active ? '700' : '500',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#888';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse Sidebar Button at Bottom */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end'
        }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#666';
            }}
          >
            {collapsed ? <ChevronRight style={{ width: '18px', height: '18px' }} /> : <ChevronLeft style={{ width: '18px', height: '18px' }} />}
          </button>
        </div>
      </aside>

      {/* Main Admin Wrapper */}
      <div style={{
        flex: 1,
        marginLeft: collapsed ? '70px' : '260px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Top Header Bar */}
        <header style={{
          height: '60px',
          backgroundColor: '#121212',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: '80px',
          zIndex: 990
        }}>
          {/* Left Side: Mobile Menu Button & Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setMobileOpen(true)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px',
                outline: 'none'
              }}
              className="admin-mobile-menu-btn"
            >
              <Menu style={{ width: '22px', height: '22px' }} />
            </button>

            {/* Breadcrumbs Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>Admin</span>
                <span>/</span>
                <span style={{ color: '#ca3b24' }}>{activeTab}</span>
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: '2px 0 0 0' }}>
                {getBreadcrumbTitle()}
              </h2>
            </div>
          </div>

          {/* Right Side: Notification Icon only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* Notification Center */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#aaa';
                }}
              >
                <Bell style={{ width: '20px', height: '20px' }} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#ca3b24',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(202, 59, 36, 0.6)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Overlay */}
              {notificationsOpen && (
                <>
                  <div 
                    onClick={() => setNotificationsOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 991 }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '8px',
                    width: '320px',
                    backgroundColor: '#121212',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    zIndex: 992,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ca3b24',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                          No notifications
                        </div>
                      ) : (
                        notifications.map(item => (
                          <div 
                            key={item.id}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid rgba(255,255,255,0.02)',
                              backgroundColor: item.read ? 'transparent' : 'rgba(202, 59, 36, 0.03)',
                              transition: 'background-color 0.2s',
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'flex-start'
                            }}
                          >
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: item.read ? 'transparent' : '#ca3b24',
                              margin: '6px 0 0 0',
                              flexShrink: 0
                            }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '12px', fontWeight: item.read ? '600' : '700', color: '#fff' }}>
                                {item.title}
                              </span>
                              <p style={{ fontSize: '11px', color: '#888', margin: 0, lineHeight: '1.4' }}>
                                {item.message}
                              </p>
                              <span style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
                                {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {/* View All Activity Footer Button */}
                    <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      <button
                        onClick={() => {
                          setActiveTab('notifications');
                          setNotificationsOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#ca3b24',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'background-color 0.2s',
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b0301c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ca3b24'}
                      >
                        View All Activity
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          padding: '32px 24px',
          overflowY: 'auto'
        }}>
          {children}
        </main>
      </div>
      </div>

      {/* Global CSS Inject for Mobile Sidebar Display */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .admin-sidebar {
            transform: translateX(-100%) !important;
            width: 260px !important;
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .admin-mobile-sidebar-toggle {
            display: flex !important;
          }
          .admin-mobile-menu-btn {
            display: block !important;
          }
          .admin-sidebar + div {
            margin-left: 0 !important;
          }
          .admin-header-username {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default AdminLayout;
