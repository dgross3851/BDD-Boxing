import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AvatarDropdown } from '../components/AvatarDropdown';
import logoImg from '../../assets/bbd-boxing-logo-updated.jpeg';
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
  const { user, profile, role, refreshProfile, signOut, avatarUrl } = useAuth();
  
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

  // Phase 5 Calendar states
  const [bookingViewMode, setBookingViewMode] = useState('list'); // 'list' or 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalSession, setSelectedCalSession] = useState(null);
  const [calModalOpen, setCalModalOpen] = useState(false);
  const [tallyChecked, setTallyChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      setNotifications(notifs || []);

      // 4. Auto-select and open slot details modal if redirecting from public site
      const hash = window.location.hash;
      const hashQuestionIndex = hash.indexOf('?');
      let bookSessionId = '';
      let bookProgramCategory = '';
      let bookGeneral = '';
      
      if (hashQuestionIndex !== -1) {
        const searchParams = new URLSearchParams(hash.substring(hashQuestionIndex));
        bookSessionId = searchParams.get('bookSessionId');
        bookProgramCategory = searchParams.get('bookProgramCategory');
        bookGeneral = searchParams.get('bookGeneral');
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        bookSessionId = searchParams.get('bookSessionId');
        bookProgramCategory = searchParams.get('bookProgramCategory');
        bookGeneral = searchParams.get('bookGeneral');
      }

      if (bookSessionId) {
        const foundSession = sessionsWithCounts.find(s => s.id === bookSessionId);
        if (foundSession) {
          setActiveTab('book');
          setBookingViewMode('calendar');
          setSelectedCalSession(foundSession);
          setCalModalOpen(true);
          
          // Clear query parameters from hash route to prevent double modals
          const nextHash = window.location.hash.split('?')[0];
          window.location.hash = nextHash;
        }
      } else if (bookProgramCategory) {
        setActiveTab('book');
        setCategoryFilter(bookProgramCategory);
        
        // Clear query parameters from hash route
        const nextHash = window.location.hash.split('?')[0];
        window.location.hash = nextHash;
      } else if (bookGeneral) {
        setActiveTab('book');
        setCategoryFilter('all');
        
        // Clear query parameters from hash route
        const nextHash = window.location.hash.split('?')[0];
        window.location.hash = nextHash;
      }

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

      // Automatically promote User to Client role upon booking their first session
      if (role === 'user' || profile?.role === 'user') {
        const { error: roleErr } = await supabase
          .from('profiles')
          .update({ role: 'client' })
          .eq('id', user.id);
        if (roleErr) {
          console.error("Failed to promote user to client role:", roleErr);
        } else {
          if (refreshProfile) {
            await refreshProfile();
          }
        }
      }

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
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Website Navigation Header */}
      <header className="main-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', zIndex: 1000, backgroundColor: '#050505', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center' }}>
        <div className="nav-container" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', margin: '0 auto', maxWidth: '1300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="index.html" className="nav-logo" id="header-logo-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <img src={logoImg} alt="BDD Boxing Logo" onError={(e) => { e.currentTarget.src = '/assets/bbd-boxing-logo-updated.jpeg'; }} style={{ height: '50px', width: 'auto', borderRadius: '4px' }} />
              <span className="nav-logo-text" style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', whiteSpace: 'nowrap' }}>BDD <span style={{ color: '#ca3b24' }}>BOXING</span></span>
            </a>

            {/* Desktop Navigation Links (Cleanly Spaced) */}
            <ul className="portal-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', listStyle: 'none', margin: 0, padding: 0 }}>
              <li><a href="index.html" className="nav-link" style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#ccc', textDecoration: 'none', whiteSpace: 'nowrap' }}>Home</a></li>
              <li><a href="programs.html" className="nav-link" style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#ccc', textDecoration: 'none', whiteSpace: 'nowrap' }}>Programs</a></li>
              <li><a href="about-coach.html" className="nav-link" style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#ccc', textDecoration: 'none', whiteSpace: 'nowrap' }}>About Coach</a></li>
              <li><a href="training.html" className="nav-link" style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#ccc', textDecoration: 'none', whiteSpace: 'nowrap' }}>Training</a></li>
              <li><a href="schedule.html" className="nav-link" style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#ccc', textDecoration: 'none', whiteSpace: 'nowrap' }}>Schedule</a></li>
              <li><a href="events.html" className="nav-link" style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#ccc', textDecoration: 'none', whiteSpace: 'nowrap' }}>Events</a></li>
              <li><a href="contact.html" className="nav-link" style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#ccc', textDecoration: 'none', whiteSpace: 'nowrap' }}>Contact</a></li>
            </ul>
          </div>

          <div className="header-cta" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
            <AvatarDropdown />
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
                <span>Portal</span>
                <span>/</span>
                <span style={{ color: '#ca3b24' }}>{activeTab}</span>
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: '2px 0 0 0', textTransform: 'capitalize' }}>
                {activeTab === 'book' ? 'Schedule Class' : activeTab === 'bookings' ? 'My Bookings Log' : activeTab}
              </h2>
            </div>
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

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Onboarding Tally Form Alert Banner */}
              {!profile?.membership_form_completed && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(202, 59, 36, 0.15) 0%, rgba(202, 59, 36, 0.05) 100%)',
                  border: '1.5px solid #ca3b24',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 8px 24px rgba(202, 59, 36, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: 'rgba(202, 59, 36, 0.2)', padding: '10px', borderRadius: '8px' }}>
                      <Activity style={{ width: '22px', height: '22px', color: '#ff8a7a' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                        Membership Form Required
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#ccc' }}>
                        Please complete the official BDD Boxing Membership Form to unlock session bookings.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://tally.so/r/Bzl0PQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#ca3b24',
                      color: '#fff',
                      textDecoration: 'none',
                      padding: '10px 18px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b0301c'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ca3b24'}
                  >
                    Open Tally Form
                  </a>
                </div>
              )}

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

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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

                  <div style={{ display: 'inline-flex', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '3px' }}>
                    {[
                      { id: 'list', label: 'List View' },
                      { id: 'calendar', label: 'Calendar View' }
                    ].map(view => {
                      const active = bookingViewMode === view.id;
                      return (
                        <button
                          key={view.id}
                          type="button"
                          onClick={() => setBookingViewMode(view.id)}
                          style={{
                            backgroundColor: active ? 'rgba(202, 59, 36, 0.15)' : 'transparent',
                            border: 'none',
                            color: active ? '#ff8a7a' : '#888',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                        >
                          {view.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Available Slots Grid */}
              {bookingViewMode === 'list' && (
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
                          <p 
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            style={{ 
                              margin: '4px 0 0 0', 
                              fontSize: '12px', 
                              color: '#888', 
                              maxHeight: '4.5em', 
                              overflowY: 'auto', 
                              touchAction: 'pan-y',
                              WebkitOverflowScrolling: 'touch',
                              lineHeight: '1.4',
                              paddingRight: '4px'
                            }}
                          >
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
                            onClick={() => {
                              setSelectedCalSession(s);
                              setCalModalOpen(true);
                            }}
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
              )}

              {/* Calendar Month Grid */}
              {bookingViewMode === 'calendar' && (
                <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
                  {/* Calendar Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                      {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', outline: 'none'
                        }}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarDate(new Date())}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', outline: 'none'
                        }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', outline: 'none'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {/* Calendar Month Grid */}
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center', fontWeight: '700', fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', minHeight: '320px' }}>
                      {(() => {
                        const year = calendarDate.getFullYear();
                        const month = calendarDate.getMonth();
                        const firstDay = new Date(year, month, 1).getDay();
                        const totalDays = new Date(year, month + 1, 0).getDate();
                        
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) {
                          cells.push(
                            <div key={`pad-${i}`} style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '8px', minHeight: '80px' }} />
                          );
                        }
                        for (let day = 1; day <= totalDays; day++) {
                          const dateObj = new Date(year, month, day);
                          const daySessions = filteredSessions.filter(s => {
                            if (!s.datetime) return false;
                            const d = new Date(s.datetime);
                            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
                          });

                          const isToday = new Date().toDateString() === dateObj.toDateString();

                          cells.push(
                            <div 
                              key={`day-${day}`}
                              style={{
                                backgroundColor: isToday ? 'rgba(202, 59, 36, 0.05)' : 'rgba(255,255,255,0.02)',
                                border: isToday ? '1px solid #ca3b24' : '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                padding: '8px',
                                minHeight: '80px',
                                display: 'flex',
                                flexDirection: 'column'
                              }}
                            >
                              <span style={{ fontSize: '12px', fontWeight: '700', color: isToday ? '#ff8a7a' : '#888' }}>
                                {day}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', flex: 1, overflowY: 'auto' }}>
                                {daySessions.map(s => {
                                  const alreadyBooked = myBookings.some(b => b.session_id === s.id && b.status !== 'cancelled');
                                  return (
                                    <div
                                      key={s.id}
                                      onClick={() => {
                                        setSelectedCalSession(s);
                                        setCalModalOpen(true);
                                      }}
                                      style={{
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        backgroundColor: alreadyBooked ? 'rgba(22, 163, 74, 0.15)' : 'rgba(202, 59, 36, 0.15)',
                                        border: alreadyBooked ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(202, 59, 36, 0.3)',
                                        color: alreadyBooked ? '#86efac' : '#ff8a7a',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px'
                                      }}
                                      title={`${alreadyBooked ? 'Booked: ' : ''}${new Date(s.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${s.session_types?.title}`}
                                    >
                                      {s.is_recurring && <Repeat style={{ width: '8px', height: '8px' }} />}
                                      <span>
                                        {new Date(s.datetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {s.session_types?.title}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* CLIENT CALENDAR VIEW DETAILS MODAL */}
              {calModalOpen && selectedCalSession && (
                <div style={{
                  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
                }}>
                  <div style={{
                    width: '100%', maxWidth: '440px', backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', overflow: 'hidden'
                  }}>
                    {/* Modal Header */}
                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Class Session Details</h3>
                      <button 
                        type="button"
                        onClick={() => { setCalModalOpen(false); setSelectedCalSession(null); }}
                        style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                      >
                        <X style={{ width: '20px', height: '20px' }} />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <span style={{
                          backgroundColor: 'rgba(202, 59, 36, 0.15)', color: '#ff8a7a', border: '1px solid rgba(202, 59, 36, 0.2)',
                          fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase'
                        }}>
                          {selectedCalSession.session_types?.category || 'Group Class'}
                        </span>
                        <h4 style={{ margin: '10px 0 6px 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
                          {selectedCalSession.session_types?.title}
                        </h4>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Description</label>
                        <p style={{ margin: 0, fontSize: '13px', color: '#ccc', lineHeight: '1.6', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          {selectedCalSession.session_types?.description || 'No description provided.'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: '#888' }}>Date & Time</span>
                          <span style={{ color: '#fff', fontWeight: '600' }}>
                            {new Date(selectedCalSession.datetime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(selectedCalSession.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: '#888' }}>Location</span>
                          <span style={{ color: '#fff', fontWeight: '600' }}>{selectedCalSession.location}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: '#888' }}>Session Price</span>
                          <span style={{ color: '#ca3b24', fontWeight: '800' }}>${selectedCalSession.price_usd}</span>
                        </div>
                        
                        {/* Capacity count */}
                        {(() => {
                          const alreadyBooked = myBookings.some(b => b.session_id === selectedCalSession.id && b.status !== 'cancelled');
                          const isFull = selectedCalSession.bookedCount >= selectedCalSession.max_slots;
                          return (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                                <span style={{ color: '#888' }}>Class Capacity</span>
                                <span style={{
                                  backgroundColor: isFull ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                  color: isFull ? '#fca5a5' : '#86efac',
                                  fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px'
                                }}>
                                  {selectedCalSession.bookedCount} / {selectedCalSession.max_slots} spots filled
                                </span>
                              </div>

                              {/* Tally Form Onboarding Section */}
                              {!alreadyBooked && !isFull && !profile?.membership_form_completed && (
                                <div style={{
                                  backgroundColor: 'rgba(202, 59, 36, 0.05)',
                                  border: '1.5px solid #ca3b24',
                                  borderRadius: '8px',
                                  padding: '12px 16px',
                                  marginTop: '12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px'
                                }}>
                                  <span style={{ fontSize: '12px', color: '#ff8a7a', fontWeight: '700' }}>
                                    ⚠️ Action Required
                                  </span>
                                  <span style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>
                                    You must fill out our BDD Boxing Membership Form before you can book.
                                    <a
                                      href="https://tally.so/r/Bzl0PQ"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#ff8a7a', textDecoration: 'underline', marginLeft: '4px', fontWeight: '600' }}
                                    >
                                      Fill out Tally Form here ↗
                                    </a>
                                  </span>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                                    <input 
                                      type="checkbox"
                                      checked={tallyChecked}
                                      onChange={e => setTallyChecked(e.target.checked)}
                                      style={{ cursor: 'pointer', accentColor: '#ca3b24' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>
                                      I have completed the Tally Form
                                    </span>
                                  </label>
                                </div>
                              )}

                              <div style={{ marginTop: '10px' }}>
                                {alreadyBooked ? (
                                  <button
                                    disabled
                                    style={{
                                      width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                      color: '#555', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'not-allowed'
                                    }}
                                  >
                                    You Are Registered ✓
                                  </button>
                                ) : isFull ? (
                                  <button
                                    disabled
                                    style={{
                                      width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
                                      color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'not-allowed'
                                    }}
                                  >
                                    Class Slot Full
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={!profile?.membership_form_completed && !tallyChecked}
                                    onClick={async () => {
                                      // If form not completed yet, update user profile in database
                                      if (!profile?.membership_form_completed) {
                                        const { error: updErr } = await supabase
                                          .from('profiles')
                                          .update({ membership_form_completed: true })
                                          .eq('id', user.id);
                                        if (updErr) {
                                          alert("Failed to update profile form completion status: " + updErr.message);
                                          return;
                                        }
                                        profile.membership_form_completed = true;
                                      }

                                      await handleBookSession(selectedCalSession);
                                      setCalModalOpen(false);
                                      setSelectedCalSession(null);
                                      setTallyChecked(false);
                                    }}
                                    style={{
                                      width: '100%',
                                      backgroundColor: (!profile?.membership_form_completed && !tallyChecked) ? '#444' : '#ca3b24',
                                      color: (!profile?.membership_form_completed && !tallyChecked) ? '#888' : '#fff',
                                      border: 'none',
                                      padding: '12px',
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      cursor: (!profile?.membership_form_completed && !tallyChecked) ? 'not-allowed' : 'pointer',
                                      transition: 'background-color 0.2s',
                                      outline: 'none'
                                    }}
                                  >
                                    Confirm Booking
                                  </button>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                    </div>
                  </div>
                </div>
              )}
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
                {/* Desktop Table View */}
                <div className="portal-desktop-table" style={{ overflowX: 'auto' }}>
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
                                  Cancel Spot
                                </button>
                              ) : (
                                <span style={{ color: '#555', fontSize: '12px' }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedMyBookings.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                            You have no historical booking entries.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Cards View (<768px) */}
                <div className="portal-mobile-cards" style={{ display: 'none', flexDirection: 'column', gap: '14px' }}>
                  {paginatedMyBookings.map(b => {
                    const canCancel = b.status === 'booked' && b.sessions?.datetime && new Date(b.sessions.datetime) > new Date();
                    return (
                      <div key={b.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontWeight: '800', fontSize: '15px', color: '#fff', display: 'block' }}>
                              {b.sessions?.session_types?.title || 'Unknown Class'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#888', display: 'block', marginTop: '2px' }}>
                              📍 {b.sessions?.location || 'Main Ring'}
                            </span>
                          </div>
                          <span style={{ color: '#ca3b24', fontWeight: '800', fontSize: '16px' }}>
                            ${b.sessions?.price_usd || '0.00'}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: '#ccc' }}>
                          📅 {b.sessions?.datetime ? new Date(b.sessions.datetime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{
                              backgroundColor: b.status === 'attended' ? 'rgba(34, 197, 94, 0.15)' : b.status === 'cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(202, 59, 36, 0.15)',
                              border: `1px solid ${b.status === 'attended' ? '#22c55e' : b.status === 'cancelled' ? '#ef4444' : '#ca3b24'}`,
                              color: b.status === 'attended' ? '#86efac' : b.status === 'cancelled' ? '#fca5a5' : '#ff8a7a',
                              fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase'
                            }}>
                              {b.status}
                            </span>
                            <span style={{
                              backgroundColor: b.payment_status === 'paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              border: `1px solid ${b.payment_status === 'paid' ? '#22c55e' : '#ef4444'}`,
                              color: b.payment_status === 'paid' ? '#86efac' : '#fca5a5',
                              fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase'
                            }}>
                              {b.payment_status}
                            </span>
                          </div>

                          {canCancel && (
                            <button
                              onClick={() => handleCancelBooking(b)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5',
                                padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                transition: 'background-color 0.2s', outline: 'none'
                              }}
                            >
                              Cancel Spot
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {paginatedMyBookings.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '24px', color: '#666', fontSize: '13px', margin: 0 }}>
                      You have no historical booking entries.
                    </p>
                  )}
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
