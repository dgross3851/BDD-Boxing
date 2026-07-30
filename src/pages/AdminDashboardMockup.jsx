import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AdminLayout from '../components/AdminLayout';
import GlassmorphicCard from '../components/GlassmorphicCard';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  X, 
  Check, 
  ArrowRight, 
  Shield, 
  Clock, 
  DollarSign, 
  Activity,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Repeat
} from 'lucide-react';

export const AdminDashboardMockup = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSessionSubtab, setActiveSessionSubtab] = useState('types');

  // Supabase Table States
  const [profilesList, setProfilesList] = useState([]);
  const [sessionTypes, setSessionTypes] = useState([]);
  const [sessionsList, setSessionsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  
  // Date Range Filter State
  const [dateFilter, setDateFilter] = useState('all');

  // Modal Views
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [showAddSessionTypeModal, setShowAddSessionTypeModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);

  // Form Input States
  const [newSessionType, setNewSessionType] = useState({ title: '', category: 'Group Class', duration_minutes: 60, description: '' });
  const [newSchedule, setNewSchedule] = useState({ session_type_id: '', datetime: '', location: '', price_usd: 25.0, max_slots: 15 });
  const [newBooking, setNewBooking] = useState({ client_id: '', session_id: '', status: 'booked', payment_status: 'pending' });

  // Client Search/Filter states
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Bookings Filter states
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all');
  const [bookingDateRange, setBookingDateRange] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [bookingStartDate, setBookingStartDate] = useState('');
  const [bookingEndDate, setBookingEndDate] = useState('');

  // Bookings Sorting states
  const [sortField, setSortField] = useState('datetime');
  const [sortOrder, setSortOrder] = useState('asc');

  // Bookings Modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Sessions sub-view Modal states
  const [selectedSessionType, setSelectedSessionType] = useState(null);
  const [sessionTypeModalOpen, setSessionTypeModalOpen] = useState(false);
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState(null);
  const [scheduleSlotModalOpen, setScheduleSlotModalOpen] = useState(false);

  // Phase 3 States
  const [sessionsPerPage, setSessionsPerPage] = useState(10);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(10);
  const [clientsPage, setClientsPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(10);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [notifsPerPage, setNotifsPerPage] = useState(10);
  const [notifsPage, setNotifsPage] = useState(1);

  const [sessionsViewMode, setSessionsViewMode] = useState('list'); // 'list' or 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [bookingSessionFilter, setBookingSessionFilter] = useState('all'); // 'all' or specific sessionId

  // Recurring session states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly'); // 'weekly' or 'daily'
  const [recurrenceLimitType, setRecurrenceLimitType] = useState('count'); // 'count' or 'date'
  const [recurrenceCount, setRecurrenceCount] = useState(5);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Notifications states
  const [notificationsList, setNotificationsList] = useState([]);
  const [notifFilter, setNotifFilter] = useState('all'); // 'all', 'bookings', 'clients', 'system'

  // Activity state
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'user', 'admin'
  const [activities, setActivities] = useState([
    { id: 1, type: 'user', message: 'Fighter Test Client1 requested Sparring Class booking', timestamp: '5 mins ago', badgeColor: '#2563eb' },
    { id: 2, type: 'admin', message: 'Admin David Gross confirmed sparring booking for Test Client1', timestamp: '10 mins ago', badgeColor: '#22c55e' },
    { id: 3, type: 'user', message: 'Fighter Test Client2 signed up for a new account', timestamp: '1 hour ago', badgeColor: '#ca3b24' },
    { id: 4, type: 'admin', message: 'Admin David Gross changed role of Test Client2 to CLIENT', timestamp: '2 hours ago', badgeColor: '#ca3b24' },
    { id: 5, type: 'user', message: 'Fighter Test Client1 updated phone details', timestamp: '1 day ago', badgeColor: '#aaa' }
  ]);

  // Fetch all tables from Supabase
  const fetchAllData = async () => {
    setLoading(true);
    setFeedbackMsg('');
    try {
      // 1. Fetch profiles
      const { data: profiles, error: err1 } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (err1) throw err1;
      setProfilesList(profiles || []);

      // 2. Fetch session types
      const { data: types, error: err2 } = await supabase
        .from('session_types')
        .select('*')
        .order('title', { ascending: true });
      if (err2) throw err2;
      setSessionTypes(types || []);

      // 3. Fetch scheduled sessions
      const { data: sess, error: err3 } = await supabase
        .from('sessions')
        .select(`
          id,
          datetime,
          location,
          price_usd,
          max_slots,
          status,
          session_type_id,
          session_types (title, category)
        `)
        .order('datetime', { ascending: true });
      if (err3) throw err3;
      setSessionsList(sess || []);

       // 4. Fetch bookings
      const { data: bks, error: err4 } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          payment_status,
          client_id,
          session_id,
          profiles (full_name, email),
          sessions (
            id,
            datetime,
            location,
            price_usd,
            session_types (title, category)
          )
        `)
        .order('created_at', { ascending: false });
      if (err4) throw err4;
      setBookingsList(bks || []);

      // 5. Fetch notifications
      const { data: notifs, error: err5 } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (err5) throw err5;
      setNotificationsList(notifs || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRoleChange = async (targetId, newRole) => {
    try {
      setFeedbackMsg('');
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetId);

      if (error) throw error;
      setFeedbackMsg(`Role updated to "${newRole}" successfully!`);
      
      // Audit logging
      const clientProfile = profilesList.find(p => p.id === targetId);
      const clientName = clientProfile?.full_name || clientProfile?.email || targetId.slice(0, 8);
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin updated role to "${newRole.toUpperCase()}" for client "${clientName}"`,
        timestamp: 'Just now',
        badgeColor: '#ca3b24'
      }, ...prev]);

      await fetchAllData();
      
      if (selectedClient && selectedClient.id === targetId) {
        setSelectedClient(prev => ({ ...prev, role: newRole }));
      }
    } catch (err) {
      setFeedbackMsg(`Failed to update role: ${err.message}`);
    }
  };

  const handleStatusChange = async (targetId, newStatus) => {
    try {
      setFeedbackMsg('');
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', targetId);

      if (error) throw error;
      setFeedbackMsg(`Status updated to "${newStatus}"!`);
      
      // Audit logging
      const clientProfile = profilesList.find(p => p.id === targetId);
      const clientName = clientProfile?.full_name || clientProfile?.email || targetId.slice(0, 8);
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin set status of "${clientName}" to "${newStatus.toUpperCase()}"`,
        timestamp: 'Just now',
        badgeColor: '#2563eb'
      }, ...prev]);

      await fetchAllData();

      if (selectedClient && selectedClient.id === targetId) {
        setSelectedClient(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setFeedbackMsg(`Failed to update status: ${err.message}`);
    }
  };

  // Add Session Type
  const handleAddSessionType = async (e) => {
    e.preventDefault();
    if (!newSessionType.title) return;
    try {
      const { error } = await supabase
        .from('session_types')
        .insert([newSessionType]);

      if (error) throw error;
      setFeedbackMsg(`Session type "${newSessionType.title}" added to Supabase.`);
      
      // Audit logging
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin created new session category type: "${newSessionType.title}"`,
        timestamp: 'Just now',
        badgeColor: '#22c55e'
      }, ...prev]);

      setShowAddSessionTypeModal(false);
      setNewSessionType({ title: '', category: 'Group Class', duration_minutes: 60, description: '' });
      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Failed to add class type: ${err.message}`);
    }
  };

  // Delete Session Type
  const handleDeleteSessionType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this session type? This will cascade delete any scheduled sessions.')) return;
    try {
      const stName = sessionTypes.find(st => st.id === id)?.title || id.slice(0, 8);
      const { error } = await supabase
        .from('session_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFeedbackMsg('Session type deleted successfully.');

      // Audit logging
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin deleted session type and cascade schedules: "${stName}"`,
        timestamp: 'Just now',
        badgeColor: '#ef4444'
      }, ...prev]);

      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Failed to delete session type: ${err.message}`);
    }
  };

  // Schedule a Class Time Slot
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.session_type_id || !newSchedule.datetime) return;
    try {
      const parentTypeObj = sessionTypes.find(st => st.id === newSchedule.session_type_id);
      const parentDesc = parentTypeObj?.description || '';

      const inserts = [];
      const recurringGroupId = isRecurring ? crypto.randomUUID() : null;

      if (!isRecurring) {
        inserts.push({
          session_type_id: newSchedule.session_type_id,
          datetime: new Date(newSchedule.datetime).toISOString(),
          location: newSchedule.location,
          price_usd: Number(newSchedule.price_usd),
          max_slots: Number(newSchedule.max_slots),
          description: parentDesc,
          status: 'active',
          is_recurring: false,
          recurring_group_id: null
        });
      } else {
        const startDateTime = new Date(newSchedule.datetime);
        const maxInstances = recurrenceLimitType === 'count' ? recurrenceCount : 100;
        const limitDate = recurrenceLimitType === 'date' && recurrenceEndDate ? new Date(recurrenceEndDate + 'T23:59:59') : null;

        for (let i = 0; i < maxInstances; i++) {
          const currentDateTime = new Date(startDateTime);
          if (recurrencePattern === 'weekly') {
            currentDateTime.setDate(startDateTime.getDate() + (i * 7));
          } else {
            currentDateTime.setDate(startDateTime.getDate() + i);
          }

          if (limitDate && currentDateTime > limitDate) {
            break;
          }

          inserts.push({
            session_type_id: newSchedule.session_type_id,
            datetime: currentDateTime.toISOString(),
            location: newSchedule.location,
            price_usd: Number(newSchedule.price_usd),
            max_slots: Number(newSchedule.max_slots),
            description: parentDesc,
            status: 'active',
            is_recurring: true,
            recurring_group_id: recurringGroupId
          });
        }
      }

      const { error } = await supabase
        .from('sessions')
        .insert(inserts);

      if (error) throw error;
      setFeedbackMsg(`Successfully scheduled ${inserts.length} class session slot(s).`);

      // Audit logging
      const stName = parentTypeObj?.title || 'Class';
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin scheduled ${inserts.length} slot(s) for "${stName}" (Recurring: ${isRecurring ? 'Yes' : 'No'}) starting ${new Date(newSchedule.datetime).toLocaleString()}`,
        timestamp: 'Just now',
        badgeColor: '#2563eb'
      }, ...prev]);

      setShowAddScheduleModal(false);
      setNewSchedule({ session_type_id: '', datetime: '', location: '', price_usd: 25.0, max_slots: 15 });
      setIsRecurring(false);
      setRecurrencePattern('weekly');
      setRecurrenceLimitType('count');
      setRecurrenceCount(5);
      setRecurrenceEndDate('');
      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Failed to schedule class: ${err.message}`);
    }
  };

  // Delete Scheduled Session
  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Delete this scheduled class instance?')) return;
    try {
      const sItem = sessionsList.find(s => s.id === id);
      const stName = sItem?.session_types?.title || 'Class Slot';
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFeedbackMsg('Scheduled class removed.');

      // Audit logging
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin cancelled scheduled class: "${stName}"`,
        timestamp: 'Just now',
        badgeColor: '#ef4444'
      }, ...prev]);

      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Failed to delete schedule: ${err.message}`);
    }
  };

  // Add Appointment Booking
  const handleAddBooking = async (e) => {
    e.preventDefault();
    if (!newBooking.client_id || !newBooking.session_id) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([newBooking]);

      if (error) throw error;
      setFeedbackMsg('Fighter booked successfully.');

      // Audit logging
      const clientName = profilesList.find(p => p.id === newBooking.client_id)?.full_name || 'Client';
      const sItem = sessionsList.find(s => s.id === newBooking.session_id);
      const stName = sItem?.session_types?.title || 'Class';
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin created appointment booking: "${clientName}" for "${stName}"`,
        timestamp: 'Just now',
        badgeColor: '#22c55e'
      }, ...prev]);

      setShowAddBookingModal(false);
      setNewBooking({ client_id: '', session_id: '', status: 'booked', payment_status: 'pending' });
      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Failed to create booking: ${err.message}`);
    }
  };

  // Update Booking Status (e.g. mark Attended or Cancelled)
  const handleBookingStatusChange = async (id, status) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setFeedbackMsg(`Booking status set to "${status}".`);
      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Failed to update booking status: ${err.message}`);
    }
  };

  // Open Client Modal helper
  const handleOpenClientModal = (client) => {
    setSelectedClient(client);
    setIsEditingClient(false);
    setClientModalOpen(true);
  };

  // Delete Client profile
  const handleDeleteClient = async (targetId) => {
    if (user && targetId === user.id) {
      alert("You cannot delete your own profile.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this client profile permanently? This cannot be undone.")) return;
    try {
      setFeedbackMsg('');
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', targetId);

      if (error) throw error;
      setFeedbackMsg('Client profile deleted successfully from database.');
      
      // Audit logging
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin deleted client profile ID ${targetId.slice(0,8)}`,
        timestamp: 'Just now',
        badgeColor: '#ef4444'
      }, ...prev]);

      setClientModalOpen(false);
      setSelectedClient(null);
      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Failed to delete client: ${err.message}`);
    }
  };

  // Open Booking Details Modal
  const handleOpenBookingModal = (booking) => {
    setSelectedBooking(booking);
    setBookingModalOpen(true);
  };

  // Update Booking Status from Details Modal
  const handleUpdateBookingStatus = async (bookingId, status, paymentStatus) => {
    try {
      setFeedbackMsg('');
      const updates = {};
      if (status) updates.status = status;
      if (paymentStatus) updates.payment_status = paymentStatus;

      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);

      if (error) throw error;
      setFeedbackMsg('Booking successfully updated!');
      
      // Audit logging
      const bItem = bookingsList.find(b => b.id === bookingId);
      const clientName = bItem?.profiles?.full_name || 'Client';
      const stName = bItem?.sessions?.session_types?.title || 'Class';
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin updated booking status of "${clientName}" for "${stName}" to "${status.toUpperCase()}" (Payment: ${paymentStatus?.toUpperCase() || 'unmodified'})`,
        timestamp: 'Just now',
        badgeColor: '#22c55e'
      }, ...prev]);

      setBookingModalOpen(false);
      setSelectedBooking(null);
      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Error updating booking: ${err.message}`);
    }
  };

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenSessionTypeModal = (typeObj) => {
    setSelectedSessionType(typeObj);
    setSessionTypeModalOpen(true);
  };

  const handleOpenScheduleSlotModal = (slotObj) => {
    setSelectedScheduleSlot(slotObj);
    setScheduleSlotModalOpen(true);
  };

  const handleAdminUploadAvatar = async (e, clientId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setFeedbackMsg('Uploading user image...');
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${clientId}/avatar-${Date.now()}.${fileExt}`;
      const { data, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', clientId);

      if (dbErr) throw dbErr;

      setFeedbackMsg('User avatar updated successfully!');
      
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin modified profile image for user ID: ${clientId.slice(0, 8)}`,
        timestamp: 'Just now',
        badgeColor: '#ca3b24'
      }, ...prev]);

      await fetchAllData();
      
      setSelectedClient(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (err) {
      setFeedbackMsg(`Failed to upload avatar: ${err.message}`);
    }
  };

  const handleAdminRemoveAvatar = async (clientId) => {
    if (!window.confirm("Remove this client's profile picture?")) return;
    try {
      setFeedbackMsg('Resetting user image...');
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', clientId);

      if (dbErr) throw dbErr;

      setFeedbackMsg('User avatar reset successfully!');
      
      setActivities(prev => [{
        id: Date.now(),
        type: 'admin',
        message: `Admin reset profile image for user ID: ${clientId.slice(0, 8)}`,
        timestamp: 'Just now',
        badgeColor: '#ca3b24'
      }, ...prev]);

      await fetchAllData();
      
      setSelectedClient(prev => ({ ...prev, avatar_url: null }));
    } catch (err) {
      setFeedbackMsg(`Failed to reset avatar: ${err.message}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setFeedbackMsg('Marking all notifications as read...');
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
      if (error) throw error;
      setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
      setFeedbackMsg('All notifications marked as read!');
      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await fetchAllData();
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    }
  };

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

  // Filter clients list
  const filteredClients = profilesList.filter(client => {
    const nameMatch = client.full_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
                      client.email?.toLowerCase().includes(clientSearchQuery.toLowerCase());
    const roleMatch = roleFilter === 'all' || client.role === roleFilter;
    return nameMatch && roleMatch;
  });

  // Unique categories list
  const categoriesList = [...new Set(sessionTypes.map(st => st.category).filter(Boolean))];

  // Filter Bookings logic
  const filteredBookings = bookingsList.filter(b => {
    // 1. Client Search (name or email)
    const clientName = b.profiles?.full_name?.toLowerCase() || '';
    const clientEmail = b.profiles?.email?.toLowerCase() || '';
    const query = bookingSearchQuery.toLowerCase();
    const searchMatch = !query || clientName.includes(query) || clientEmail.includes(query);

    // 2. Status Match
    const statusMatch = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;

    // 3. Session Type Match
    const typeMatch = bookingTypeFilter === 'all' || b.sessions?.session_type_id === bookingTypeFilter;

    // 4. Date Range Match
    let dateMatch = true;
    if (b.sessions?.datetime) {
      const bDate = new Date(b.sessions.datetime);
      const now = new Date();
      
      if (bookingDateRange === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        dateMatch = bDate >= todayStart && bDate <= todayEnd;
      } else if (bookingDateRange === 'week') {
        const currentDay = now.getDay();
        const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        dateMatch = bDate >= weekStart && bDate < weekEnd;
      } else if (bookingDateRange === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        dateMatch = bDate >= monthStart && bDate <= monthEnd;
      } else if (bookingDateRange === 'custom') {
        const start = bookingStartDate ? new Date(bookingStartDate + 'T00:00:00') : null;
        const end = bookingEndDate ? new Date(bookingEndDate + 'T23:59:59') : null;
        if (start && end) {
          dateMatch = bDate >= start && bDate <= end;
        } else if (start) {
          dateMatch = bDate >= start;
        } else if (end) {
          dateMatch = bDate <= end;
        }
      }
    } else {
      if (bookingDateRange !== 'all') {
        dateMatch = false;
      }
    }

    const sessionMatch = bookingSessionFilter === 'all' || b.session_id === bookingSessionFilter;
    return searchMatch && statusMatch && typeMatch && dateMatch && sessionMatch;
  });

  // Sorted Bookings logic
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let valA, valB;
    if (sortField === 'client') {
      valA = a.profiles?.full_name?.toLowerCase() || '';
      valB = b.profiles?.full_name?.toLowerCase() || '';
    } else if (sortField === 'class') {
      valA = a.sessions?.session_types?.title?.toLowerCase() || '';
      valB = b.sessions?.session_types?.title?.toLowerCase() || '';
    } else if (sortField === 'datetime') {
      valA = a.sessions?.datetime ? new Date(a.sessions.datetime).getTime() : 0;
      valB = b.sessions?.datetime ? new Date(b.sessions.datetime).getTime() : 0;
    } else if (sortField === 'price') {
      valA = parseFloat(a.sessions?.price_usd) || 0;
      valB = parseFloat(b.sessions?.price_usd) || 0;
    } else if (sortField === 'status') {
      valA = a.status?.toLowerCase() || '';
      valB = b.status?.toLowerCase() || '';
    }
    
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated Sessions List (Schedules)
  const paginatedSessions = sessionsList.slice(
    (sessionsPage - 1) * sessionsPerPage,
    sessionsPage * sessionsPerPage
  );

  // Paginated Clients list
  const paginatedClients = filteredClients.slice(
    (clientsPage - 1) * clientsPerPage,
    clientsPage * clientsPerPage
  );

  // Paginated Bookings list
  const paginatedBookings = sortedBookings.slice(
    (bookingsPage - 1) * bookingsPerPage,
    bookingsPage * bookingsPerPage
  );

  // Notification category classifier
  const getCategory = (n) => {
    const t = n.type?.toLowerCase() || '';
    const title = n.title?.toLowerCase() || '';
    const msg = n.message?.toLowerCase() || '';
    if (t === 'booking' || title.includes('book') || title.includes('sched') || title.includes('session') || msg.includes('book') || msg.includes('session')) return 'bookings';
    if (t === 'client' || title.includes('profile') || title.includes('client') || title.includes('user') || msg.includes('profile') || msg.includes('client')) return 'clients';
    return 'system';
  };

  const filteredNotifications = notificationsList.filter(n => {
    if (notifFilter === 'all') return true;
    return getCategory(n) === notifFilter;
  });

  // Paginated Notifications list
  const paginatedNotifications = filteredNotifications.slice(
    (notifsPage - 1) * notifsPerPage,
    notifsPage * notifsPerPage
  );

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
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
          alignItems: 'center',
          zIndex: 999
        }}>
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* OVERVIEW SUB-VIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Dashboard Overview</h1>
              <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>Real-time statistics and activity ledger</p>
            </div>
            
            <button 
              onClick={fetchAllData}
              disabled={loading}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh Data
            </button>
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            <GlassmorphicCard 
              title="Class Schedules" 
              value={loading ? '...' : sessionsList.length} 
              icon={Calendar} 
              trend={{ value: '+4', positive: true, label: 'this week' }}
              glowColor="202, 59, 36"
              tooltip="Total scheduled class timeslots configured in the booking calendar."
            />
            <GlassmorphicCard 
              title="Registered Clients" 
              value={loading ? '...' : profilesList.length} 
              icon={Users} 
              trend={{ value: '+4', positive: true, label: 'new signups' }}
              glowColor="22, 163, 74"
              tooltip="Total client/fighter profile records saved in database."
            />
            <GlassmorphicCard 
              title="Appointments Booked" 
              value={loading ? '...' : bookingsList.filter(b => b.status === 'booked' || b.status === 'attended').length} 
              icon={BookOpen} 
              trend={{ value: '+18%', positive: true, label: 'vs last month' }}
              glowColor="37, 99, 235"
              tooltip="Active reservations tracked in database."
            />
            <GlassmorphicCard 
              title="Monthly Target" 
              value="$3,840" 
              icon={DollarSign} 
              trend={{ value: '-2.4%', positive: false, label: 'behind target' }}
              glowColor="234, 179, 8"
              tooltip="Gross revenue goal target for the current billing period."
            />
          </div>

          {/* Contextual Quick Actions */}
          <div style={{
            backgroundColor: '#121212',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#ccc' }}>
              Quick Actions Panel
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <button 
                onClick={() => { setActiveTab('bookings'); setShowAddBookingModal(true); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'rgba(202, 59, 36, 0.05)',
                  border: '1px solid rgba(202, 59, 36, 0.15)',
                  borderRadius: '10px',
                  color: '#ff8a7a',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'transform 0.2s, background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(202, 59, 36, 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(202, 59, 36, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span>Book First Session CTA</span>
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </button>

              <button 
                onClick={() => { setActiveTab('sessions'); setShowAddSessionTypeModal(true); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'rgba(22, 163, 74, 0.05)',
                  border: '1px solid rgba(22, 163, 74, 0.15)',
                  borderRadius: '10px',
                  color: '#86efac',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'transform 0.2s, background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span>Create New Class Type</span>
                <Plus style={{ width: '16px', height: '16px' }} />
              </button>

              <button 
                onClick={() => { setActiveTab('sessions'); setShowAddScheduleModal(true); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: 'rgba(37, 99, 235, 0.05)',
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                  borderRadius: '10px',
                  color: '#93c5fd',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  transition: 'transform 0.2s, background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span>Schedule New Session</span>
                <Plus style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>

          {/* Activity Logs ledger */}
          <div style={{
            backgroundColor: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                Recent Audit Log Ledger
              </h3>
              
              {/* Log Filters */}
              <div style={{ display: 'inline-flex', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '3px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'user', label: 'Users' },
                  { id: 'admin', label: 'Admins' }
                ].map(tab => {
                  const active = activityFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivityFilter(tab.id)}
                      style={{
                        backgroundColor: active ? 'rgba(202, 59, 36, 0.15)' : 'transparent',
                        border: 'none',
                        color: active ? '#ff8a7a' : '#888',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activities
                .filter(a => activityFilter === 'all' || a.type === activityFilter)
                .map(a => (
                  <div 
                    key={a.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px', 
                      backgroundColor: '#0a0a0a', 
                      borderRadius: '8px', 
                      borderLeft: `3px solid ${a.badgeColor || '#888'}`,
                      animation: 'fadeIn 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {a.type === 'admin' ? (
                        <Activity style={{ width: '16px', height: '16px', color: a.badgeColor || '#ca3b24' }} />
                      ) : (
                        <CheckCircle2 style={{ width: '16px', height: '16px', color: a.badgeColor || '#22c55e' }} />
                      )}
                      <span style={{ fontSize: '13px', color: '#eee' }}>{a.message}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#555', marginLeft: '10px', whiteSpace: 'nowrap' }}>{a.timestamp}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Grid Layout for Upcoming Sessions and Activity logs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Upcoming Sessions Card */}
            <div style={{
              backgroundColor: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                Upcoming Scheduled Sessions
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessionsList
                  .filter(s => s.datetime && new Date(s.datetime) > new Date())
                  .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
                  .slice(0, 3)
                  .map(s => {
                    const booked = bookingsList.filter(b => b.session_id === s.id && b.status !== 'cancelled').length;
                    return (
                      <div 
                        key={s.id}
                        style={{
                          backgroundColor: '#0a0a0a',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '700', fontSize: '13px', color: '#fff', display: 'block' }}>
                            {s.session_types?.title || 'Training Slot'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '2px' }}>
                            📍 {s.location} • Spots: {booked}/{s.max_slots}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            backgroundColor: 'rgba(202, 59, 36, 0.15)',
                            border: '1px solid #ca3b24',
                            color: '#ff8a7a',
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            {new Date(s.datetime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(s.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {sessionsList.filter(s => s.datetime && new Date(s.datetime) > new Date()).length === 0 && (
                  <span style={{ fontSize: '12px', color: '#666', textAlign: 'center', padding: '20px 0' }}>
                    No upcoming sessions scheduled.
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions summary card */}
            <div style={{
              backgroundColor: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                Fighter Admin Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => { setActiveTab('bookings'); setShowAddBookingModal(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                    backgroundColor: 'rgba(202, 59, 36, 0.05)', border: '1px solid rgba(202, 59, 36, 0.15)', borderRadius: '8px',
                    color: '#ff8a7a', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(202, 59, 36, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(202, 59, 36, 0.05)'; }}
                >
                  <span>Book Appointment CTA</span>
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </button>
                <button 
                  onClick={() => { setActiveTab('sessions'); setShowAddSessionTypeModal(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                    backgroundColor: 'rgba(22, 163, 74, 0.05)', border: '1px solid rgba(22, 163, 74, 0.15)', borderRadius: '8px',
                    color: '#86efac', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.05)'; }}
                >
                  <span>Create Class Type</span>
                  <Plus style={{ width: '14px', height: '14px' }} />
                </button>
                <button 
                  onClick={() => { setActiveTab('sessions'); setShowAddScheduleModal(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                    backgroundColor: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.15)', borderRadius: '8px',
                    color: '#93c5fd', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'; }}
                >
                  <span>Schedule Slot</span>
                  <Plus style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SESSIONS SUB-VIEW */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section Sub-tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setActiveSessionSubtab('types')}
                style={{
                  backgroundColor: activeSessionSubtab === 'types' ? 'rgba(202, 59, 36, 0.1)' : 'transparent',
                  color: activeSessionSubtab === 'types' ? '#ca3b24' : '#888',
                  border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Session Types (Class Definitions)
              </button>
              <button 
                onClick={() => setActiveSessionSubtab('schedules')}
                style={{
                  backgroundColor: activeSessionSubtab === 'schedules' ? 'rgba(202, 59, 36, 0.1)' : 'transparent',
                  color: activeSessionSubtab === 'schedules' ? '#ca3b24' : '#888',
                  border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Schedules (Time Slots)
              </button>
              <button 
                onClick={() => setActiveSessionSubtab('upcoming')}
                style={{
                  backgroundColor: activeSessionSubtab === 'upcoming' ? 'rgba(202, 59, 36, 0.1)' : 'transparent',
                  color: activeSessionSubtab === 'upcoming' ? '#ca3b24' : '#888',
                  border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Upcoming Sessions
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {activeSessionSubtab === 'schedules' && (
                <div style={{ display: 'inline-flex', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '3px', marginRight: '12px' }}>
                  {[
                    { id: 'list', label: 'List View' },
                    { id: 'calendar', label: 'Calendar View' }
                  ].map(view => {
                    const active = sessionsViewMode === view.id;
                    return (
                      <button
                        key={view.id}
                        onClick={() => setSessionsViewMode(view.id)}
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
              )}

              {activeSessionSubtab === 'types' ? (
              <button 
                onClick={() => setShowAddSessionTypeModal(true)}
                style={{
                  backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Add Session Type
              </button>
            ) : (
              <button 
                onClick={() => setShowAddScheduleModal(true)}
                style={{
                  backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Schedule Session Slot
              </button>
            )}
            </div>
          </div>

          {/* Table displaying Session Types */}
          {activeSessionSubtab === 'types' && (
            <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                      <th style={{ padding: '12px' }}>Session Name</th>
                      <th style={{ padding: '12px' }}>Category</th>
                      <th style={{ padding: '12px' }}>Duration</th>
                      <th style={{ padding: '12px' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionTypes.map(s => (
                      <tr 
                        key={s.id} 
                        onClick={() => handleOpenSessionTypeModal(s)}
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td style={{ padding: '12px', fontWeight: '600' }}>{s.title}</td>
                        <td style={{ padding: '12px', color: '#ccc' }}>
                          <span style={{ backgroundColor: 'rgba(202,59,36,0.15)', color: '#ff8a7a', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(202,59,36,0.2)' }}>
                            {s.category || 'Group Class'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#aaa' }}>{s.duration_minutes} mins</td>
                        <td style={{ padding: '12px', color: '#888' }}>{s.description || 'No description'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenSessionTypeModal(s); }}
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                                padding: '8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                outline: 'none',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                              title="View Session Type Details"
                            >
                              <Eye style={{ width: '16px', height: '16px', color: '#ccc' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table displaying Scheduled time slots */}
          {activeSessionSubtab === 'schedules' && sessionsViewMode === 'list' && (
            <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                      <th style={{ padding: '12px' }}>Session Class</th>
                      <th style={{ padding: '12px' }}>Date & Time</th>
                      <th style={{ padding: '12px' }}>Location</th>
                      <th style={{ padding: '12px' }}>Price</th>
                      <th style={{ padding: '12px' }}>Spots</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSessions.map(s => (
                      <tr 
                        key={s.id} 
                        onClick={() => handleOpenScheduleSlotModal(s)}
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td style={{ padding: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {s.is_recurring && <Repeat style={{ width: '14px', height: '14px', color: '#ca3b24' }} />}
                          {s.session_types?.title || 'Unknown Class'}
                        </td>
                        <td style={{ padding: '12px', color: '#ccc' }}>{new Date(s.datetime).toLocaleString()}</td>
                        <td style={{ padding: '12px', color: '#aaa' }}>{s.location}</td>
                        <td style={{ padding: '12px', color: '#ca3b24', fontWeight: '700' }}>${s.price_usd}</td>
                        <td style={{ padding: '12px', color: '#aaa' }}>{s.max_slots} spots</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenScheduleSlotModal(s); }}
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                                padding: '8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                outline: 'none',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                              title="View Schedule Slot Details"
                            >
                              <Eye style={{ width: '16px', height: '16px', color: '#ccc' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPaginationControls(sessionsList.length, sessionsPage, sessionsPerPage, setSessionsPage, setSessionsPerPage)}
            </div>
          )}

          {/* Calendar View displaying Scheduled time slots */}
          {activeSessionSubtab === 'schedules' && sessionsViewMode === 'calendar' && (
            <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              {/* Calendar Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                  {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                      padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', outline: 'none'
                    }}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date())}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                      padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', outline: 'none'
                    }}
                  >
                    Today
                  </button>
                  <button
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
                      const daySessions = sessionsList.filter(s => {
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
                            {daySessions.map(s => (
                              <div
                                key={s.id}
                                onClick={(e) => { e.stopPropagation(); handleOpenScheduleSlotModal(s); }}
                                style={{
                                  fontSize: '9px',
                                  fontWeight: '700',
                                  backgroundColor: 'rgba(202, 59, 36, 0.15)',
                                  border: '1px solid rgba(202, 59, 36, 0.3)',
                                  color: '#ff8a7a',
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
                                title={`${new Date(s.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${s.session_types?.title}`}
                              >
                                {s.is_recurring && <Repeat style={{ width: '8px', height: '8px', color: '#ff8a7a' }} />}
                                <span>
                                  {new Date(s.datetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {s.session_types?.title}
                                </span>
                              </div>
                            ))}
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

          {/* Table displaying Upcoming time slots */}
          {activeSessionSubtab === 'upcoming' && (
            <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                      <th style={{ padding: '12px' }}>Session Class</th>
                      <th style={{ padding: '12px' }}>Date & Time</th>
                      <th style={{ padding: '12px' }}>Location</th>
                      <th style={{ padding: '12px' }}>Price</th>
                      <th style={{ padding: '12px' }}>Reserved Spots</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionsList
                      .filter(s => s.datetime && new Date(s.datetime) > new Date())
                      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
                      .map(s => {
                        const booked = bookingsList.filter(b => b.session_id === s.id && b.status !== 'cancelled').length;
                        return (
                          <tr 
                            key={s.id} 
                            onClick={() => handleOpenScheduleSlotModal(s)}
                            style={{ 
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <td style={{ padding: '12px', fontWeight: '600' }}>{s.session_types?.title || 'Unknown Class'}</td>
                            <td style={{ padding: '12px', color: '#ff8a7a', fontWeight: '600' }}>{new Date(s.datetime).toLocaleString()}</td>
                            <td style={{ padding: '12px', color: '#aaa' }}>{s.location}</td>
                            <td style={{ padding: '12px', color: '#ca3b24', fontWeight: '700' }}>${s.price_usd}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                backgroundColor: booked >= s.max_slots ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                border: `1px solid ${booked >= s.max_slots ? '#ef4444' : '#22c55e'}`,
                                color: booked >= s.max_slots ? '#fca5a5' : '#86efac',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '3px 8px',
                                borderRadius: '4px'
                              }}>
                                {booked} / {s.max_slots} filled
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenScheduleSlotModal(s); }}
                                  style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    outline: 'none',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                                  title="View Upcoming Session Details"
                                >
                                  <Eye style={{ width: '16px', height: '16px', color: '#ccc' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {sessionsList.filter(s => s.datetime && new Date(s.datetime) > new Date()).length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                          No upcoming sessions scheduled.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLIENTS SUB-VIEW */}
      {activeTab === 'clients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Clients Directory</h1>
            <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>Manage fighter roles, permissions, and view training statistics</p>
          </div>

          {/* Search/Filters */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#121212',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#666' }} />
              <input 
                type="text"
                placeholder="Search clients by name or email..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px 10px 40px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Role Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#888' }}>Role Filter:</span>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Database Profiles Ledger */}
          <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '24px' }}>
            {loading ? (
              <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>Loading user profiles from Supabase...</p>
            ) : filteredClients.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>No matching profiles found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#888' }}>
                      <th style={{ padding: '12px' }}>Fighter Name</th>
                      <th style={{ padding: '12px' }}>Email Address</th>
                      <th style={{ padding: '12px' }}>Phone</th>
                      <th style={{ padding: '12px' }}>System Role</th>
                      <th style={{ padding: '12px' }}>Account Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClients.map((p) => {
                      const isSelf = user && p.id === user.id;
                      return (
                        <tr 
                          key={p.id} 
                          onClick={() => handleOpenClientModal(p)}
                          style={{ 
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <td style={{ padding: '12px', fontWeight: '700', color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ca3b24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                                  {p.full_name ? p.full_name.slice(0, 2).toUpperCase() : 'F'}
                                </div>
                              )}
                              <span style={{ fontWeight: isSelf ? '800' : '700', color: isSelf ? '#ff8a7a' : '#fff' }}>
                                {p.full_name || 'N/A'}
                              </span>
                              {isSelf && (
                                <span style={{
                                  backgroundColor: 'rgba(202, 59, 36, 0.15)',
                                  border: '1px solid #ca3b24',
                                  color: '#ff8a7a',
                                  fontSize: '9px',
                                  fontWeight: '800',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  letterSpacing: '0.5px'
                                }}>
                                  YOU
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#ccc' }}>{p.email}</td>
                          <td style={{ padding: '12px', color: '#aaa' }}>{p.phone || 'N/A'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              backgroundColor: p.role === 'admin' ? 'rgba(202, 59, 36, 0.15)' : p.role === 'client' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                              border: `1px solid ${p.role === 'admin' ? '#ca3b24' : p.role === 'client' ? '#16a34a' : '#2563eb'}`,
                              color: p.role === 'admin' ? '#ff8a7a' : p.role === 'client' ? '#86efac' : '#93c5fd',
                              fontSize: '10px',
                              fontWeight: '800',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {p.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              color: p.status === 'banned' ? '#ef4444' : '#22c55e',
                              fontWeight: '600',
                              fontSize: '13px'
                            }}>
                              {p.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenClientModal(p); }}
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  color: '#fff',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  outline: 'none',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
                                title="View Profile"
                              >
                                <Eye style={{ width: '16px', height: '16px', color: '#ccc' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {renderPaginationControls(filteredClients.length, clientsPage, clientsPerPage, setClientsPage, setClientsPerPage)}
          </div>
        </div>
      )}

      {/* BOOKINGS SUB-VIEW */}
      {activeTab === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Bookings Directory</h1>
              <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>Schedule appointments and manage customer attendance</p>
            </div>
            
            <button 
              onClick={() => setShowAddBookingModal(true)}
              style={{
                backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Schedule Appointment
            </button>
          </div>

          {bookingSessionFilter !== 'all' && (
            <div style={{
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid #2563eb',
              color: '#93c5fd',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Filtering bookings for a selected session slot.</span>
              <button 
                onClick={() => setBookingSessionFilter('all')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Bookings Filters Bar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: '#121212',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {/* Top Row: Search and Dropdowns */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search Client Name */}
              <div style={{ position: 'relative', flex: 2, minWidth: '240px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#666' }} />
                <input 
                  type="text"
                  placeholder="Search bookings by fighter name/email..."
                  value={bookingSearchQuery}
                  onChange={(e) => setBookingSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px 10px 40px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Status Select Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '160px' }}>
                <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>Status:</span>
                <select 
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="booked">Booked</option>
                  <option value="attended">Attended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Session Type Select Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1.5, minWidth: '200px' }}>
                <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>Session Type:</span>
                <select 
                  value={bookingTypeFilter}
                  onChange={(e) => setBookingTypeFilter(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Session Types</option>
                  {sessionTypes.map(st => (
                    <option key={st.id} value={st.id}>{st.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom Row: Date Range Selectors */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#888', marginRight: '8px' }}>Date Range:</span>
                {[
                  { id: 'all', label: 'All Time', icon: Calendar },
                  { id: 'today', label: 'Today', icon: Clock },
                  { id: 'week', label: 'This Week', icon: Calendar },
                  { id: 'month', label: 'This Month', icon: Calendar }
                ].map(range => {
                  const Icon = range.icon;
                  const active = bookingDateRange === range.id;
                  return (
                    <button
                      key={range.id}
                      onClick={() => setBookingDateRange(range.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: active ? 'rgba(202, 59, 36, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? '#ca3b24' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '6px',
                        color: active ? '#ff8a7a' : '#aaa',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = '#aaa';
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                        }
                      }}
                    >
                      <Icon style={{ width: '13px', height: '13px' }} />
                      {range.label}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setBookingDateRange('custom')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: bookingDateRange === 'custom' ? 'rgba(202, 59, 36, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${bookingDateRange === 'custom' ? '#ca3b24' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '6px',
                    color: bookingDateRange === 'custom' ? '#ff8a7a' : '#aaa',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <Calendar style={{ width: '13px', height: '13px' }} />
                  Custom...
                </button>
              </div>

              {/* Custom Date Pickers */}
              {bookingDateRange === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="date"
                    value={bookingStartDate}
                    onChange={(e) => setBookingStartDate(e.target.value)}
                    style={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#666' }}>to</span>
                  <input 
                    type="date"
                    value={bookingEndDate}
                    onChange={(e) => setBookingEndDate(e.target.value)}
                    style={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bookings Mock Calendar Grid Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            backgroundColor: '#121212',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
              const dayBookings = filteredBookings.filter(b => {
                const sDate = b.sessions?.datetime;
                if (!sDate) return false;
                const dateObj = new Date(sDate);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                return dayName === day;
              });
              
              return (
                <div key={day} style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px', minHeight: '160px' }}>
                  <span style={{ fontSize: '12px', color: '#ca3b24', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>{day}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dayBookings.length === 0 ? (
                      <span style={{ fontSize: '11px', color: '#444' }}>No classes</span>
                    ) : (
                      dayBookings.map(b => (
                        <div 
                          key={b.id} 
                          onClick={() => handleOpenBookingModal(b)}
                          style={{
                            padding: '8px', 
                            borderRadius: '6px', 
                            backgroundColor: '#0a0a0a', 
                            borderLeft: `3px solid ${b.status === 'cancelled' ? '#ef4444' : b.status === 'attended' ? '#22c55e' : '#ca3b24'}`,
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontWeight: '700', display: 'block', color: '#fff' }}>{b.sessions?.session_types?.title}</span>
                          <span style={{ color: '#888', display: 'block', margin: '2px 0' }}>{b.profiles?.full_name || 'Anonymous'}</span>
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: '800',
                            color: b.status === 'cancelled' ? '#fca5a5' : b.status === 'attended' ? '#86efac' : '#93c5fd',
                            textTransform: 'uppercase'
                          }}>
                            {b.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bookings List Ledger */}
          <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700' }}>Fighter Bookings Log</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                    <th onClick={() => handleSort('client')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>
                      Client {sortField === 'client' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('class')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>
                      Session Class {sortField === 'class' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('datetime')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>
                      Schedule Slot {sortField === 'datetime' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('price')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>
                      Pricing {sortField === 'price' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('status')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>
                      Status {sortField === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map(b => (
                    <tr 
                      key={b.id} 
                      onClick={() => handleOpenBookingModal(b)}
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '12px', fontWeight: '600' }}>{b.profiles?.full_name || b.profiles?.email || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#ccc' }}>{b.sessions?.session_types?.title || 'Unknown Class'}</td>
                      <td style={{ padding: '12px', color: '#aaa' }}>{b.sessions?.datetime ? new Date(b.sessions.datetime).toLocaleString() : 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#ca3b24', fontWeight: '700' }}>
                        ${b.sessions?.price_usd || '0.00'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          backgroundColor: b.status === 'attended' ? 'rgba(34, 197, 94, 0.15)' : b.status === 'cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(202, 59, 36, 0.15)',
                          border: `1px solid ${b.status === 'attended' ? '#22c55e' : b.status === 'cancelled' ? '#ef4444' : '#ca3b24'}`,
                          color: b.status === 'attended' ? '#86efac' : b.status === 'cancelled' ? '#fca5a5' : '#ff8a7a',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenBookingModal(b); }}
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              padding: '8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              outline: 'none',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                            title="View Booking Details"
                          >
                            <Eye style={{ width: '16px', height: '16px', color: '#ccc' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPaginationControls(sortedBookings.length, bookingsPage, bookingsPerPage, setBookingsPage, setBookingsPerPage)}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS SUB-VIEW */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>System Notifications Log</h1>
            <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>Monitor client registration activity, scheduling changes, and system events</p>
          </div>

          {/* Filters and Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            backgroundColor: '#121212',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'all', label: 'All Log Entries' },
                { id: 'bookings', label: 'Bookings' },
                { id: 'clients', label: 'Clients' },
                { id: 'system', label: 'System' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setNotifFilter(item.id);
                    setNotifsPage(1);
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
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            >
              Mark All as Read
            </button>
          </div>

          {/* Notifications Card */}
          <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {paginatedNotifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: n.read ? 'rgba(255,255,255,0.01)' : 'rgba(202, 59, 36, 0.03)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${n.read ? 'rgba(255,255,255,0.1)' : '#ca3b24'}`
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                        {n.title}
                      </span>
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
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ca3b24',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}

              {filteredNotifications.length === 0 && (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px 0', fontSize: '13px' }}>
                  No notifications found.
                </div>
              )}
            </div>

            {/* Pagination controls */}
            {renderPaginationControls(filteredNotifications.length, notifsPage, notifsPerPage, setNotifsPage, setNotifsPerPage)}
          </div>
        </div>
      )}

      {/* BOOKING DETAILS MODAL */}
      {bookingModalOpen && selectedBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#121212',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Booking Details</h3>
              <button 
                onClick={() => { setBookingModalOpen(false); setSelectedBooking(null); }}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', outline: 'none' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Client info and Booking ID */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#666', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Client</span>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                    {selectedBooking.profiles?.full_name || selectedBooking.profiles?.email || 'N/A'}
                  </h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: '#666', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Booking ID</span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888' }}>
                    #{selectedBooking.id ? selectedBooking.id.slice(0, 8) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Session Meta Info Block */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Session Class Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: '#666' }} />
                    Session
                  </span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>
                    {selectedBooking.sessions?.session_types?.title || 'Unknown Class'}
                  </span>
                </div>

                {/* Date/Time Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Clock style={{ width: '14px', height: '14px', color: '#666' }} />
                    Date/Time
                  </span>
                  <span style={{ fontWeight: '700', color: '#ff8a7a' }}>
                    {selectedBooking.sessions?.datetime ? new Date(selectedBooking.sessions.datetime).toLocaleString() : 'N/A'}
                  </span>
                </div>

                {/* Pricing Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign style={{ width: '14px', height: '14px', color: '#666' }} />
                    Pricing
                  </span>
                  <span style={{ fontWeight: '700', color: '#ca3b24' }}>
                    ${selectedBooking.sessions?.price_usd || '0.00'}
                  </span>
                </div>

                {/* Payment Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Shield style={{ width: '14px', height: '14px', color: '#666' }} />
                    Payment
                  </span>
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    On-Premises
                  </span>
                </div>
              </div>
              {/* Description Block */}
              {selectedBooking.sessions?.description && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Session Description</label>
                  <p style={{ margin: 0, fontSize: '13px', color: '#ccc', lineHeight: '1.6', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    {selectedBooking.sessions.description}
                  </p>
                </div>
              )}

              {/* Status Section */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Manage Status
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Confirm (Attended, Paid) */}
                  <button
                    onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'attended', 'paid')}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid #22c55e',
                      color: '#86efac',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'; }}
                  >
                    <Check style={{ width: '14px', height: '14px' }} />
                    Confirm
                  </button>

                  {/* Pending (Booked, Pending) */}
                  <button
                    onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'booked', 'pending')}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'; }}
                  >
                    <Clock style={{ width: '14px', height: '14px' }} />
                    Pending
                  </button>

                  {/* Cancel (Cancelled) */}
                  <button
                    onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'cancelled')}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                  >
                    <X style={{ width: '14px', height: '14px' }} />
                    Cancel
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => { setBookingModalOpen(false); setSelectedBooking(null); }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '10px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              >
                Close
              </button>

            </div>
          </div>
        </div>
      )}

      {/* SESSION TYPE DETAILS MODAL */}
      {sessionTypeModalOpen && selectedSessionType && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#121212',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Session Type Details</h3>
              <button 
                onClick={() => { setSessionTypeModalOpen(false); setSelectedSessionType(null); }}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', outline: 'none' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Category tag */}
              <div>
                <span style={{
                  backgroundColor: 'rgba(202,59,36,0.15)',
                  color: '#ff8a7a',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid rgba(202,59,36,0.2)',
                  textTransform: 'uppercase',
                  display: 'inline-block'
                }}>
                  {selectedSessionType.category || 'Group Class'}
                </span>
              </div>

              {/* Title & Duration */}
              <div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                  {selectedSessionType.title}
                </h4>
                <span style={{ fontSize: '13px', color: '#888', display: 'block', marginTop: '4px' }}>
                  Duration: {selectedSessionType.duration_minutes} minutes
                </span>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Description</label>
                <p style={{ margin: 0, fontSize: '13px', color: '#ccc', lineHeight: '1.6', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {selectedSessionType.description || 'No description provided.'}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    handleDeleteSessionType(selectedSessionType.id);
                    setSessionTypeModalOpen(false);
                    setSelectedSessionType(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                  Delete Category
                </button>

                <button
                  onClick={() => { setSessionTypeModalOpen(false); setSelectedSessionType(null); }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SESSION SCHEDULE SLOT DETAILS MODAL */}
      {scheduleSlotModalOpen && selectedScheduleSlot && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#121212',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Schedule Time Slot Details</h3>
              <button 
                onClick={() => { setScheduleSlotModalOpen(false); setSelectedScheduleSlot(null); }}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', outline: 'none' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Class name and Category */}
              <div>
                <span style={{ fontSize: '10px', color: '#666', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Session Class</span>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                  {selectedScheduleSlot.session_types?.title || 'Unknown Class'}
                </h4>
              </div>

              {/* Session Meta Info Block */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Date/Time Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Clock style={{ width: '14px', height: '14px', color: '#666' }} />
                    Date & Time
                  </span>
                  <span style={{ fontWeight: '700', color: '#ff8a7a' }}>
                    {new Date(selectedScheduleSlot.datetime).toLocaleString()}
                  </span>
                </div>

                {/* Location Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: '#666' }} />
                    Location
                  </span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>
                    {selectedScheduleSlot.location}
                  </span>
                </div>

                {/* Pricing Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign style={{ width: '14px', height: '14px', color: '#666' }} />
                    Price
                  </span>
                  <span style={{ fontWeight: '700', color: '#ca3b24' }}>
                    ${selectedScheduleSlot.price_usd}
                  </span>
                </div>

                {/* Reserved Spots Row */}
                {(() => {
                  const booked = bookingsList.filter(b => b.session_id === selectedScheduleSlot.id && b.status !== 'cancelled').length;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Users style={{ width: '14px', height: '14px', color: '#666' }} />
                        Reserved Spots
                      </span>
                      <span 
                        onClick={() => {
                          setBookingSessionFilter(selectedScheduleSlot.id);
                          setActiveTab('bookings');
                          setScheduleSlotModalOpen(false);
                        }}
                        title="Click to view all bookings for this session"
                        style={{
                          backgroundColor: booked >= selectedScheduleSlot.max_slots ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: booked >= selectedScheduleSlot.max_slots ? '#fca5a5' : '#86efac',
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        {booked} / {selectedScheduleSlot.max_slots} filled
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Description Block */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Description</label>
                <p style={{ margin: 0, fontSize: '13px', color: '#ccc', lineHeight: '1.6', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {selectedScheduleSlot.description || selectedScheduleSlot.session_types?.description || 'No description provided.'}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    handleDeleteSchedule(selectedScheduleSlot.id);
                    setScheduleSlotModalOpen(false);
                    setSelectedScheduleSlot(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                  Cancel Session
                </button>

                <button
                  onClick={() => { setScheduleSlotModalOpen(false); setSelectedScheduleSlot(null); }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CLIENT VIEW/EDIT MODAL */}
      {clientModalOpen && selectedClient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#121212',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
                {isEditingClient ? 'Edit Fighter Profile' : 'Fighter Profile Details'}
              </h3>
              <button 
                onClick={() => { setClientModalOpen(false); setSelectedClient(null); setIsEditingClient(false); }}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', outline: 'none' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Avatar info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {selectedClient.avatar_url ? (
                  <img src={selectedClient.avatar_url} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ca3b24' }} />
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#ca3b24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                    {selectedClient.full_name ? selectedClient.full_name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{selectedClient.full_name || 'Anonymous Fighter'}</h4>
                    {user && selectedClient.id === user.id && (
                      <span style={{ backgroundColor: 'rgba(202, 59, 36, 0.15)', border: '1px solid #ca3b24', color: '#ff8a7a', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                        YOU
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: '#888', display: 'block' }}>{selectedClient.email}</span>
                  
                  {/* Admin Moderation Over User Avatar */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input 
                      type="file" 
                      id={`admin-client-avatar-input-${selectedClient.id}`}
                      accept="image/*"
                      onChange={(e) => handleAdminUploadAvatar(e, selectedClient.id)}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => document.getElementById(`admin-client-avatar-input-${selectedClient.id}`).click()}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      Change Avatar
                    </button>
                    {selectedClient.avatar_url && (
                      <button
                        onClick={() => handleAdminRemoveAvatar(selectedClient.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid #ef4444',
                          borderRadius: '4px',
                          color: '#fca5a5',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!isEditingClient ? (
                /* READ-ONLY VIEW MODE */
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#666', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{selectedClient.phone || 'Not provided'}</span>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#666', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Status</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: selectedClient.status === 'banned' ? '#ef4444' : '#22c55e' }}>
                        {selectedClient.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#666', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role Group</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ca3b24', textTransform: 'uppercase' }}>{selectedClient.role || 'user'}</span>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#666', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UUID Identifier</span>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#aaa', wordBreak: 'break-all' }}>{selectedClient.id}</span>
                    </div>
                  </div>

                  {/* Quick Actions (Edit and Delete) */}
                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginTop: '10px' }}>
                    <button
                      onClick={() => setIsEditingClient(true)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                    >
                      <Edit2 style={{ width: '14px', height: '14px' }} />
                      Edit Account
                    </button>

                    {user && selectedClient.id === user.id ? (
                      <button
                        disabled
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          border: '1px solid rgba(239, 68, 68, 0.1)',
                          color: '#555',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                        Cannot Delete Self
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteClient(selectedClient.id)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid #ef4444',
                          color: '#fca5a5',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                        Delete Account
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* INTERACTIVE EDIT MODE */
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '8px' }}>Fighter Role Group</label>
                    <select 
                      value={selectedClient.role}
                      onChange={(e) => handleRoleChange(selectedClient.id, e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#fff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="user">USER</option>
                      <option value="client">CLIENT</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '8px' }}>Account Control Actions</label>
                    <button
                      onClick={() => handleStatusChange(selectedClient.id, selectedClient.status === 'banned' ? 'active' : 'banned')}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: selectedClient.status === 'banned' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${selectedClient.status === 'banned' ? '#22c55e' : '#ef4444'}`,
                        color: selectedClient.status === 'banned' ? '#86efac' : '#fca5a5',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {selectedClient.status === 'banned' ? 'Restore Fighter Access (Unban)' : 'Suspend Fighter Access (Ban)'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditingClient(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#ca3b24',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      Done Editing
                    </button>
                  </div>
                </>
              )}

              {/* History Details */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <span style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                  Account Created: {selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleDateString() : 'N/A'}
                </span>
                <span style={{ fontSize: '11px', color: '#555', display: 'block' }}>
                  Last Active Update: {selectedClient.updated_at ? new Date(selectedClient.updated_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADD SESSION TYPE MODAL */}
      {showAddSessionTypeModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
        }}>
          <form onSubmit={handleAddSessionType} style={{
            width: '100%', maxWidth: '440px', backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Add New Session Type</h3>
              <button type="button" onClick={() => setShowAddSessionTypeModal(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Session Name / Title</label>
              <input 
                type="text" required placeholder="e.g. Sparring Class"
                value={newSessionType.title} onChange={e => setNewSessionType(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Category</label>
              <select 
                value={newSessionType.category} onChange={e => setNewSessionType(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', cursor: 'pointer' }}
              >
                <option value="Group Class">Group Class</option>
                <option value="Private Session">Private Session</option>
                <option value="Youth Program">Youth Program</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Duration (minutes)</label>
              <input 
                type="number" required placeholder="60"
                value={newSessionType.duration_minutes} onChange={e => setNewSessionType(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Description</label>
              <textarea 
                rows="3" required placeholder="Describe the boxing session..."
                value={newSessionType.description} onChange={e => setNewSessionType(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none', resize: 'none' }}
              />
            </div>

            <button type="submit" style={{ backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
              Save Session Type
            </button>
          </form>
        </div>
      )}

      {/* SCHEDULE SESSION MODAL */}
      {showAddScheduleModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
        }}>
          <form onSubmit={handleAddSchedule} style={{
            width: '100%', maxWidth: '440px', backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Schedule Session Slot</h3>
              <button type="button" onClick={() => setShowAddScheduleModal(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Class Definition (Session Type)</label>
              <select 
                value={newSchedule.session_type_id} 
                onChange={e => setNewSchedule(prev => ({ ...prev, session_type_id: e.target.value }))}
                required
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', cursor: 'pointer' }}
              >
                <option value="">Select a Class Type...</option>
                {sessionTypes.map(st => <option key={st.id} value={st.id}>{st.title}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Date & Time</label>
              <input 
                type="datetime-local" required
                value={newSchedule.datetime} onChange={e => setNewSchedule(prev => ({ ...prev, datetime: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Location</label>
              <input 
                type="text" required placeholder="e.g. Main Ring"
                value={newSchedule.location} onChange={e => setNewSchedule(prev => ({ ...prev, location: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Price (USD)</label>
                <input 
                  type="number" required placeholder="25"
                  value={newSchedule.price_usd} onChange={e => setNewSchedule(prev => ({ ...prev, price_usd: Number(e.target.value) }))}
                  style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Max Capacity</label>
                <input 
                  type="number" required placeholder="15"
                  value={newSchedule.max_slots} onChange={e => setNewSchedule(prev => ({ ...prev, max_slots: Number(e.target.value) }))}
                  style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            {/* Recurring Settings Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input 
                type="checkbox" 
                id="is-recurring-checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#ca3b24' }}
              />
              <label htmlFor="is-recurring-checkbox" style={{ fontSize: '13px', color: '#ccc', cursor: 'pointer', fontWeight: '600' }}>
                Recurring Session
              </label>
            </div>

            {isRecurring && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>Repeat Pattern</label>
                    <select
                      value={recurrencePattern}
                      onChange={e => setRecurrencePattern(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>Stop Condition</label>
                    <select
                      value={recurrenceLimitType}
                      onChange={e => setRecurrenceLimitType(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      <option value="count">Repeat Count</option>
                      <option value="date">End Date</option>
                    </select>
                  </div>
                </div>

                {recurrenceLimitType === 'count' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>Number of times to repeat</label>
                    <input 
                      type="number" min="1" max="50" required
                      value={recurrenceCount} onChange={e => setRecurrenceCount(Number(e.target.value))}
                      style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '4px' }}>End Date</label>
                    <input 
                      type="date" required
                      value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                  </div>
                )}
              </div>
            )}

            <button type="submit" style={{ backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
              Schedule Session
            </button>
          </form>
        </div>
      )}

      {/* ADD BOOKING MODAL */}
      {showAddBookingModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
        }}>
          <form onSubmit={handleAddBooking} style={{
            width: '100%', maxWidth: '440px', backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Schedule Appointment</h3>
              <button type="button" onClick={() => setShowAddBookingModal(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Select Client</label>
              <select 
                value={newBooking.client_id} 
                onChange={e => setNewBooking(prev => ({ ...prev, client_id: e.target.value }))}
                required
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', cursor: 'pointer' }}
              >
                <option value="">Choose a Fighter...</option>
                {profilesList.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Select Class Schedule Slot</label>
              <select 
                value={newBooking.session_id} 
                onChange={e => setNewBooking(prev => ({ ...prev, session_id: e.target.value }))}
                required
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', cursor: 'pointer' }}
              >
                <option value="">Choose a Scheduled Slot...</option>
                {sessionsList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.session_types?.title} - {new Date(s.datetime).toLocaleString()} ({s.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Payment Status</label>
              <select 
                value={newBooking.payment_status} 
                onChange={e => setNewBooking(prev => ({ ...prev, payment_status: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', cursor: 'pointer' }}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <button type="submit" style={{ backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
              Book Session Appointment
            </button>
          </form>
        </div>
      )}

    </AdminLayout>
  );
};
