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
  const { user, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

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
    { id: 'bookings', label: 'Bookings', icon: BookOpen }
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      fontFamily: "'Outfit', 'Inter', sans-serif"
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
        top: 0,
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

        {/* Sidebar Header */}
        <div style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#ca3b24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                color: '#fff',
                fontSize: '16px',
                boxShadow: '0 0 15px rgba(202, 59, 36, 0.4)'
              }}>
                B
              </div>
              <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '0.5px' }}>
                BDD <span style={{ color: '#ca3b24' }}>BOXING</span>
              </span>
            </div>
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#ca3b24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              color: '#fff',
              fontSize: '16px',
              boxShadow: '0 0 15px rgba(202, 59, 36, 0.4)'
            }}>
              B
            </div>
          )}
        </div>

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
          height: '70px',
          backgroundColor: '#121212',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
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
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '2px 0 0 0' }}>
                {getBreadcrumbTitle()}
              </h2>
            </div>
          </div>

          {/* Right Side: Notification Icon & Shared Profile Dropdown */}
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
                  </div>
                </>
              )}
            </div>

            {/* Shared Profile Dropdown Wrapper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', '@media (maxWidth: 640px)': { display: 'none' } }} className="admin-header-username">
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                  {profile?.full_name || 'Coach'}
                </span>
                <span style={{ fontSize: '10px', color: '#ca3b24', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {profile?.role || 'Admin'}
                </span>
              </div>
              <AvatarDropdown />
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
