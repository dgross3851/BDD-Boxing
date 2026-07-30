import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AvatarDropdown } from '../components/AvatarDropdown';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  Bell, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Menu,
  Repeat
} from 'lucide-react';

export const UserDashboardMockup = () => {
  const { user, profile, role } = useAuth();
  
  // Navigation states
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'book', 'bookings', 'notifications'
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Data states
  const [sessionsList, setSessionsList] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Sorter / Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [notifFilter, setNotifFilter] = useState('all'); // 'all', 'bookings', 'system'

  // Pagination states
  const [bookPerPage, setBookPerPage] = useState(10);
  const [bookPage, setBookPage] = useState(1);
  const [notifPerPage, setNotifPerPage] = useState(10);
  const [notifPage, setNotifPage] = useState(1);

  // Load all user database rows
  const loadAllClientData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch available future sessions (not cancelled)
      const { data: sess, error: errSess } = await supabase
        .from('sessions')
        .select(`
          id, datetime, location, price_usd, max_slots, status, is_recurring,
          session_types (title, category, description)
        `)
        .eq('status', 'active')
        .gt('datetime', new Date().toISOString())
        .order('datetime', { ascending: true });
      if (errSess) throw errSess;

      // Filter local bookings count to show remaining spots
      const { data: allBks, error: errAllBks } = await supabase
        .from('bookings')
        .select('id, session_id, status')
        .neq('status', 'cancelled');
      if (errAllBks) throw errAllBks;

      const sessionsWithCounts = (sess || []).map(s => {
        const bookedCount = allBks.filter(b => b.session_id === s.id).length;
        return { ...s, bookedCount };
      });

      setSessionsList(sessionsWithCounts);

      // 2. Fetch user's bookings history
      const { data: bks, error: errBks } = await supabase
        .from('bookings')
        .select(`
          id, status, payment_status, created_at, session_id,
          sessions (
            id, datetime, location, price_usd,
            session_types (title, category, description)
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      if (errBks) throw errBks;
      setMyBookings(bks || []);

      // 3. Fetch user's notifications
      const { data: notifs, error: errNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (errNotifs) throw errNotifs;
      setNotifications(notifs || []);

    } catch (err) {
      console.error("Error fetching client data:", err);
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllClientData();
    
    // Auto-collapse sidebar on smaller screens
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
  }, [user]);

  // Real-time notifications channels integration
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`realtime:client-notifications:${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
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

  // Book session handler
  const handleBookSession = async (session) => {
    if (!user) return;
    try {
      // 1. Check if already booked
      const alreadyBooked = myBookings.some(b => b.session_id === session.id && b.status !== 'cancelled');
      if (alreadyBooked) {
        alert("You have already booked a spot in this class!");
        return;
      }

      // 2. Check slots availability
      if (session.bookedCount >= session.max_slots) {
        alert("This class slot is fully booked!");
        return;
      }

      setFeedbackMsg('Booking slot...');
      // Insert booking
      const { error: insertErr } = await supabase
        .from('bookings')
        .insert([{
          client_id: user.id,
          session_id: session.id,
          status: 'booked',
          payment_status: 'pending'
        }]);
      if (insertErr) throw insertErr;

      // Log notification
      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: "Session Booked",
        message: `You booked a spot in "${session.session_types?.title}" scheduled on ${new Date(session.datetime).toLocaleString()}.`,
        type: 'booking',
        read: false
      }]);

      setFeedbackMsg('Session booked successfully! Payment made in person.');
      await loadAllClientData();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    }
  };

  // Cancel booking handler
  const handleCancelBooking = async (booking) => {
    if (!window.confirm("Cancel your reservation for this class?")) return;
    try {
      setFeedbackMsg('Cancelling booking...');
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);
      if (error) throw error;

      // Log notification
      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: "Booking Cancelled",
        message: `You cancelled your booking for "${booking.sessions?.session_types?.title}" on ${new Date(booking.sessions?.datetime).toLocaleString()}.`,
        type: 'system',
        read: false
      }]);

      setFeedbackMsg('Booking cancelled successfully.');
      await loadAllClientData();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    }
  };

  // Mark all notifications as read
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
      console.error(err);
    }
  };

  // Mark single notification as read
  const handleMarkSingleRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  // Get notifications category label
  const getCategory = (n) => {
    const t = n.type?.toLowerCase() || '';
    const title = n.title?.toLowerCase() || '';
    const msg = n.message?.toLowerCase() || '';
    if (t === 'booking' || title.includes('book') || msg.includes('book')) return 'bookings';
    return 'system';
  };

  // Stats Computations
  const attendedBookings = myBookings.filter(b => b.status === 'attended');
  const classesAttendedCount = attendedBookings.length;
  
  // Total in-person payments (Sum of price for all attended bookings)
  const totalPaidInPerson = attendedBookings.reduce((sum, b) => sum + (parseFloat(b.sessions?.price_usd) || 0), 0);
  
  const upcomingReservationsCount = myBookings.filter(b => b.status === 'booked' && b.sessions?.datetime && new Date(b.sessions.datetime) > new Date()).length;

  // Sliced Lists Sorter
  const filteredSessions = sessionsList.filter(s => {
    const matchesQuery = !searchQuery || s.session_types?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || s.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.session_types?.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const uniqueCategories = [...new Set(sessionsList.map(s => s.session_types?.category).filter(Boolean))];

  // Bookings list pagination
  const filteredMyBookings = myBookings;
  const paginatedMyBookings = filteredMyBookings.slice(
    (bookPage - 1) * bookPerPage,
    bookPage * bookPerPage
  );

  // Notifications category filters
  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'all') return true;
    return getCategory(n) === notifFilter;
  });
  const paginatedNotifications = filteredNotifications.slice(
    (notifPage - 1) * notifPerPage,
    notifPage * notifPerPage
  );

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Pagination Builder Helper
  const renderPaginationControls = (totalItems, currentPage, itemsPerPage, setCurrentPage, setItemsPerPage) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#888' }}>
          <span>Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            {[5, 10, 20, 50].map(size => (
              <option key={size} value={size}>{size} rows</option>
            ))}
          </select>
          <span>of {totalItems} entries</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{
              backgroundColor: currentPage === 1 ? 'transparent' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: currentPage === 1 ? '#444' : '#fff',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              outline: 'none'
            }}
          >
            Prev
          </button>
          <span style={{ fontSize: '13px', color: '#ccc', minWidth: '80px', textAlign: 'center' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{
              backgroundColor: currentPage >= totalPages ? 'transparent' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: currentPage >= totalPages ? '#444' : '#fff',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              outline: 'none'
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: CheckCircle2 },
    { id: 'book', label: 'Book Session', icon: Plus },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount }
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
        
        {/* Mobile Tab Toggle Button */}
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
                  justifyContent: collapsed ? 'center' : 'space-between',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '12px' }}>
                  <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.badge > 0 && (
                  <span style={{
                    backgroundColor: '#ca3b24',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {item.badge}
                  </span>
                )}
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
                <span>Portal</span>
                <span>/</span>
                <span style={{ color: '#ca3b24' }}>{activeTab}</span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '2px 0 0 0', textTransform: 'capitalize' }}>
                {activeTab === 'book' ? 'Schedule Class' : activeTab === 'bookings' ? 'My Bookings Log' : activeTab}
              </h2>
            </div>
          </div>

          {/* Right Side: Shared Profile Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} className="admin-header-username">
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                {profile?.full_name || 'Fighter'}
              </span>
              <span style={{ fontSize: '10px', color: '#ca3b24', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {profile?.role || 'User'}
              </span>
            </div>
            <AvatarDropdown />
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          padding: '32px 24px',
          overflowY: 'auto'
        }}>
          {feedbackMsg && (
            <div style={{
              backgroundColor: feedbackMsg.startsWith('Error') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${feedbackMsg.startsWith('Error') ? '#ef4444' : '#22c55e'}`,
              color: feedbackMsg.startsWith('Error') ? '#fca5a5' : '#86efac',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{feedbackMsg}</span>
              <button 
                onClick={() => setFeedbackMsg('')} 
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Welcome Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(10,10,10,0.9) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
                    Welcome back, <span style={{ color: '#ff8a7a' }}>{profile?.full_name || 'Champ'}</span>!
                  </h1>
                  <p style={{ fontSize: '14px', color: '#aaa', margin: '8px 0 0 0', maxWidth: '500px', lineHeight: '1.6' }}>
                    Track your personal boxing statistics, book new sparring slots, and view training schedules directly in your portal.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('book')}
                  style={{
                    backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s', outline: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b0301c'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ca3b24'}
                >
                  Book New Session
                </button>
              </div>

              {/* Stats Counters Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.2)', padding: '12px', borderRadius: '8px' }}>
                    <CheckCircle2 style={{ width: '24px', height: '24px', color: '#22c55e' }} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Classes Attended</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{classesAttendedCount}</span>
                  </div>
                </div>

                <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ backgroundColor: 'rgba(202, 59, 36, 0.1)', border: '1px solid rgba(202, 59, 36, 0.2)', padding: '12px', borderRadius: '8px' }}>
                    <DollarSign style={{ width: '24px', height: '24px', color: '#ca3b24' }} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Total Paid In-Person</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>${totalPaidInPerson.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '12px', borderRadius: '8px' }}>
                    <Calendar style={{ width: '24px', height: '24px', color: '#2563eb' }} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Upcoming Slots</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{upcomingReservationsCount}</span>
                  </div>
                </div>
              </div>

              {/* Grid: Bookings Summary & Notifications logs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* Upcoming sessions */}
                <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>Your Upcoming Booked Classes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {myBookings
                      .filter(b => b.status === 'booked' && b.sessions?.datetime && new Date(b.sessions.datetime) > new Date())
                      .slice(0, 3)
                      .map(b => (
                        <div key={b.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: '#fff', display: 'block' }}>
                              {b.sessions?.session_types?.title}
                            </span>
                            <span style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '2px' }}>
                              📍 {b.sessions?.location} • Paid In Person
                            </span>
                          </div>
                          <span style={{ backgroundColor: 'rgba(202, 59, 36, 0.15)', border: '1px solid #ca3b24', color: '#ff8a7a', fontSize: '9px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px' }}>
                            {new Date(b.sessions?.datetime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(b.sessions?.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    {myBookings.filter(b => b.status === 'booked' && b.sessions?.datetime && new Date(b.sessions.datetime) > new Date()).length === 0 && (
                      <p style={{ color: '#555', fontSize: '12px', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                        No upcoming sessions booked.
                      </p>
                    )}
                  </div>
                </div>

                {/* Notifications summary card */}
                <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>Recent Notifications</h3>
                    <button onClick={() => setActiveTab('notifications')} style={{ background: 'transparent', border: 'none', color: '#ca3b24', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      View all
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.slice(0, 3).map(n => (
                      <div key={n.id} style={{ display: 'flex', gap: '10px', padding: '10px', backgroundColor: '#0a0a0a', borderRadius: '8px', borderLeft: `3px solid ${n.read ? 'rgba(255,255,255,0.1)' : '#ca3b24'}` }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{n.title}</span>
                          <span style={{ fontSize: '11px', color: '#888' }}>{n.message}</span>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p style={{ color: '#555', fontSize: '12px', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                        No notifications logs.
                      </p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* BOOK SESSION TAB */}
          {activeTab === 'book' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Available Sparring & Training Slots</h1>
                <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>Explore upcoming class schedules, check openings, and book your spot</p>
              </div>

              {/* Filter controls */}
              <div style={{
                display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#121212', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                  <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#666' }} />
                  <input
                    type="text" placeholder="Search classes by name or location..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                      padding: '10px 12px 10px 40px', color: '#fff', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Category:</span>
                  <select
                    value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                    style={{
                      backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                      padding: '10px 14px', color: '#fff', fontSize: '13px', cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* Available Slots Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredSessions.map(s => {
                  const alreadyBooked = myBookings.some(b => b.session_id === s.id && b.status !== 'cancelled');
                  const isFull = s.bookedCount >= s.max_slots;
                  return (
                    <div 
                      key={s.id}
                      style={{
                        backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                        padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'transform 0.2s',
                        outline: alreadyBooked ? '1.5px solid rgba(202, 59, 36, 0.4)' : 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {/* Repeat badge */}
                      {s.is_recurring && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', color: '#ca3b24', title: 'Recurring Class' }}>
                          <Repeat style={{ width: '16px', height: '16px' }} />
                        </div>
                      )}

                      <div>
                        <span style={{
                          backgroundColor: 'rgba(202, 59, 36, 0.15)', color: '#ff8a7a', border: '1px solid rgba(202, 59, 36, 0.2)',
                          fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase'
                        }}>
                          {s.session_types?.category || 'Group Class'}
                        </span>
                        <h3 style={{ margin: '10px 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#fff' }}>{s.session_types?.title}</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#888', height: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.session_types?.description || 'No description provided.'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#ccc' }}>
                        <div>📅 {new Date(s.datetime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(s.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div>📍 {s.location}</div>
                        <div>💰 <strong style={{ color: '#ca3b24' }}>${s.price_usd}</strong> (Payable In Person)</div>
                      </div>

                      {/* Capacity capsule */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                          <span>Capacity</span>
                          <span>{s.bookedCount} / {s.max_slots} spots filled</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#0a0a0a', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(s.bookedCount / s.max_slots) * 100}%`,
                            backgroundColor: isFull ? '#ef4444' : s.bookedCount >= s.max_slots * 0.8 ? '#eab308' : '#ca3b24',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {alreadyBooked ? (
                        <button
                          disabled
                          style={{
                            width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#555', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'not-allowed'
                          }}
                        >
                          Booked ✓
                        </button>
                      ) : isFull ? (
                        <button
                          disabled
                          style={{
                            width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
                            color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'not-allowed'
                          }}
                        >
                          Class Full
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBookSession(s)}
                          style={{
                            width: '100%', backgroundColor: '#ca3b24', border: 'none', color: '#fff',
                            padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            transition: 'background-color 0.2s', outline: 'none'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b0301c'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ca3b24'}
                        >
                          Book Spot
                        </button>
                      )}
                    </div>
                  );
                })}

                {filteredSessions.length === 0 && (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: '40px 0', fontSize: '13px' }}>
                    No upcoming sessions matched your filters.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* MY BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>My Personal Training Ledger</h1>
                <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>Monitor bookings history, payment records, and class reservations</p>
              </div>

              <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                        <th style={{ padding: '12px' }}>Session Class</th>
                        <th style={{ padding: '12px' }}>Date & Time</th>
                        <th style={{ padding: '12px' }}>Location</th>
                        <th style={{ padding: '12px' }}>Price</th>
                        <th style={{ padding: '12px' }}>Attendance</th>
                        <th style={{ padding: '12px' }}>Payment</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMyBookings.map(b => {
                        const canCancel = b.status === 'booked' && b.sessions?.datetime && new Date(b.sessions.datetime) > new Date();
                        return (
                          <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px', fontWeight: '700', color: '#fff' }}>{b.sessions?.session_types?.title || 'Unknown Class'}</td>
                            <td style={{ padding: '12px', color: '#ccc' }}>{b.sessions?.datetime ? new Date(b.sessions.datetime).toLocaleString() : 'N/A'}</td>
                            <td style={{ padding: '12px', color: '#aaa' }}>{b.sessions?.location || 'Main Ring'}</td>
                            <td style={{ padding: '12px', color: '#ca3b24', fontWeight: '700' }}>${b.sessions?.price_usd || '0.00'}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                backgroundColor: b.status === 'attended' ? 'rgba(34, 197, 94, 0.15)' : b.status === 'cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(202, 59, 36, 0.15)',
                                border: `1px solid ${b.status === 'attended' ? '#22c55e' : b.status === 'cancelled' ? '#ef4444' : '#ca3b24'}`,
                                color: b.status === 'attended' ? '#86efac' : b.status === 'cancelled' ? '#fca5a5' : '#ff8a7a',
                                fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase'
                              }}>
                                {b.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                backgroundColor: b.payment_status === 'paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                border: `1px solid ${b.payment_status === 'paid' ? '#22c55e' : '#ef4444'}`,
                                color: b.payment_status === 'paid' ? '#86efac' : '#fca5a5',
                                fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase'
                              }}>
                                {b.payment_status}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {canCancel ? (
                                <button
                                  onClick={() => handleCancelBooking(b)}
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5',
                                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                    transition: 'background-color 0.2s', outline: 'none'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                >
                                  Cancel Booking
                                </button>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#555' }}>Locked</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredMyBookings.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: '#666', padding: '32px 0' }}>
                            You have no historical booking entries.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {renderPaginationControls(filteredMyBookings.length, bookPage, bookPerPage, setBookPage, setBookPerPage)}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Personal Notification Center</h1>
                <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>Monitor bookings reminders, schedule changes, and account alerts</p>
              </div>

              {/* Filters and Actions */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                backgroundColor: '#121212', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'all', label: 'All Notifications' },
                    { id: 'bookings', label: 'Bookings' },
                    { id: 'system', label: 'System Alerts' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setNotifFilter(item.id);
                        setNotifPage(1);
                      }}
                      style={{
                        backgroundColor: notifFilter === item.id ? 'rgba(202, 59, 36, 0.15)' : 'transparent',
                        color: notifFilter === item.id ? '#ff8a7a' : '#888',
                        border: notifFilter === item.id ? '1px solid #ca3b24' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleMarkAllRead}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                    borderRadius: '8px', padding: '10px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                    transition: 'background-color 0.2s', outline: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                >
                  Mark All as Read
                </button>
              </div>

              {/* List */}
              <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {paginatedNotifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px',
                        backgroundColor: n.read ? 'rgba(255,255,255,0.01)' : 'rgba(202, 59, 36, 0.03)',
                        border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px',
                        borderLeft: `3px solid ${n.read ? 'rgba(255,255,255,0.1)' : '#ca3b24'}`
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{n.title}</span>
                          {!n.read && (
                            <span style={{
                              backgroundColor: '#ca3b24', color: '#fff', fontSize: '9px', fontWeight: '800',
                              padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase'
                            }}>
                              New
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '13px', color: '#ccc' }}>{n.message}</span>
                        <span style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
                          Category: <span style={{ textTransform: 'uppercase', color: '#888', fontWeight: '600' }}>{getCategory(n)}</span> • {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>

                      {!n.read && (
                        <button
                          onClick={() => handleMarkSingleRead(n.id)}
                          style={{
                            backgroundColor: 'transparent', border: 'none', color: '#ca3b24',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none'
                          }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))}

                  {filteredNotifications.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#666', padding: '40px 0', fontSize: '13px', margin: 0 }}>
                      No notifications found.
                    </p>
                  )}
                </div>

                {renderPaginationControls(filteredNotifications.length, notifPage, notifPerPage, setNotifPage, setNotifPerPage)}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Global CSS Inject for Sidebar */}
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
