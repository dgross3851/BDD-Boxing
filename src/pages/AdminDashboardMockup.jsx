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
  AlertTriangle
} from 'lucide-react';

export const AdminDashboardMockup = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Supabase Profiles State
  const [profilesList, setProfilesList] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  
  // Date Range Filter State
  const [dateFilter, setDateFilter] = useState('all');

  // Selected Client for Modal View
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  // Mock sessions state for CRUD
  const [sessions, setSessions] = useState([
    { id: '1', title: 'Heavy Bag Drills', category: 'Group Class', duration: '60 mins', price: '$25', capacity: 15 },
    { id: '2', title: '1-on-1 Elite Sparring', category: 'Private Session', duration: '90 mins', price: '$90', capacity: 1 },
    { id: '3', title: 'Kids Boxing Basics', category: 'Youth Program', duration: '45 mins', price: '$20', capacity: 10 },
    { id: '4', title: 'Advanced Footwork', category: 'Group Class', duration: '60 mins', price: '$25', capacity: 12 },
  ]);
  const [activeSessionSubtab, setActiveSessionSubtab] = useState('types');
  const [categories, setCategories] = useState([
    { id: 'c1', name: 'Private Session', description: 'Personal customized boxing tutoring' },
    { id: 'c2', name: 'Group Class', description: 'Cardio, drills and technical sparring' },
    { id: 'c3', name: 'Youth Program', description: 'Safe, fun basics for ages 8-15' }
  ]);
  
  // Add Session State
  const [newSession, setNewSession] = useState({ title: '', category: 'Group Class', duration: '', price: '', capacity: '' });
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);

  // Add Category State
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // Mock Bookings State for CRUD
  const [bookings, setBookings] = useState([
    { id: 'b1', clientName: 'John Doe', sessionName: '1-on-1 Elite Sparring', time: 'Monday, 10:00 AM', status: 'scheduled' },
    { id: 'b2', clientName: 'Jane Smith', sessionName: 'Heavy Bag Drills', time: 'Tuesday, 6:00 PM', status: 'scheduled' },
    { id: 'b3', clientName: 'Mike Tyson', sessionName: 'Heavy Bag Drills', time: 'Wednesday, 6:00 PM', status: 'completed' },
    { id: 'b4', clientName: 'Tony Stark', sessionName: 'Kids Boxing Basics', time: 'Thursday, 4:00 PM', status: 'cancelled' },
  ]);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({ clientName: '', sessionName: 'Heavy Bag Drills', time: '', status: 'scheduled' });

  // Client Search/Filter states
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchAllProfiles = async () => {
    setLoadingProfiles(true);
    setFeedbackMsg('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfilesList(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    fetchAllProfiles();
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
      await fetchAllProfiles();
      
      // Update modal copy if open
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
      await fetchAllProfiles();

      // Update modal copy if open
      if (selectedClient && selectedClient.id === targetId) {
        setSelectedClient(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setFeedbackMsg(`Failed to update status: ${err.message}`);
    }
  };

  // CRUD handlers for Sessions
  const handleAddSession = (e) => {
    e.preventDefault();
    if (!newSession.title) return;
    const newId = String(Date.now());
    setSessions(prev => [...prev, { ...newSession, id: newId }]);
    setNewSession({ title: '', category: 'Group Class', duration: '', price: '', capacity: '' });
    setShowAddSessionModal(false);
  };

  const handleDeleteSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  // CRUD handlers for Categories
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.name) return;
    const newId = 'c' + String(Date.now());
    setCategories(prev => [...prev, { ...newCategory, id: newId }]);
    setNewCategory({ name: '', description: '' });
    setShowAddCategoryModal(false);
  };

  const handleDeleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // CRUD handlers for Bookings
  const handleAddBooking = (e) => {
    e.preventDefault();
    if (!newBooking.clientName || !newBooking.time) return;
    const newId = 'b' + String(Date.now());
    setBookings(prev => [...prev, { ...newBooking, id: newId }]);
    setNewBooking({ clientName: '', sessionName: 'Heavy Bag Drills', time: '', status: 'scheduled' });
    setShowAddBookingModal(false);
  };

  const handleBookingStatusChange = (id, newStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const handleCancelBooking = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  // Filter clients list
  const filteredClients = profilesList.filter(client => {
    const nameMatch = client.full_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
                      client.email?.toLowerCase().includes(clientSearchQuery.toLowerCase());
    const roleMatch = roleFilter === 'all' || client.role === roleFilter;
    return nameMatch && roleMatch;
  });

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
          alignItems: 'center'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 12px' }}>
              <Filter style={{ width: '14px', height: '14px', color: '#ca3b24' }} />
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            <GlassmorphicCard 
              title="Active Sessions" 
              value={sessions.length} 
              icon={Calendar} 
              trend={{ value: '+2', positive: true, label: 'this week' }}
              glowColor="202, 59, 36"
            />
            <GlassmorphicCard 
              title="Registered Clients" 
              value={loadingProfiles ? '...' : profilesList.length} 
              icon={Users} 
              trend={{ value: '+4', positive: true, label: 'new signups' }}
              glowColor="22, 163, 74"
            />
            <GlassmorphicCard 
              title="Appointments Booked" 
              value={bookings.filter(b => b.status === 'scheduled').length} 
              icon={BookOpen} 
              trend={{ value: '+18%', positive: true, label: 'vs last month' }}
              glowColor="37, 99, 235"
            />
            <GlassmorphicCard 
              title="Monthly Target" 
              value="$3,840" 
              icon={DollarSign} 
              trend={{ value: '-2.4%', positive: false, label: 'behind target' }}
              glowColor="234, 179, 8"
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
                onClick={() => { setActiveTab('sessions'); setShowAddSessionModal(true); }}
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
                onClick={() => { setActiveTab('sessions'); setShowAddCategoryModal(true); }}
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
                <span>New Service Category</span>
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
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#fff' }}>
              Recent Audit Log Ledger
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#0a0a0a', borderRadius: '8px', borderLeft: '3px solid #ca3b24' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Activity style={{ width: '16px', height: '16px', color: '#ca3b24' }} />
                  <span style={{ fontSize: '13px' }}>Coach promoted user test@bddboxing.com to CLIENT</span>
                </div>
                <span style={{ fontSize: '11px', color: '#555' }}>Just now</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#0a0a0a', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                  <span style={{ fontSize: '13px' }}>Admin made public avatars bucket visible</span>
                </div>
                <span style={{ fontSize: '11px', color: '#555' }}>10 mins ago</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#0a0a0a', borderRadius: '8px', borderLeft: '3px solid #eab308' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#eab308' }} />
                  <span style={{ fontSize: '13px' }}>System warning: profiles table RLS policies updated</span>
                </div>
                <span style={{ fontSize: '11px', color: '#555' }}>1 hour ago</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SESSIONS SUB-VIEW */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Sessions & Categories</h1>
              <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>Manage boxing classes, schedules and pricing tiers</p>
            </div>
            
            {activeSessionSubtab === 'types' ? (
              <button 
                onClick={() => setShowAddSessionModal(true)}
                style={{
                  backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Add Session Type
              </button>
            ) : (
              <button 
                onClick={() => setShowAddCategoryModal(true)}
                style={{
                  backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Add Category
              </button>
            )}
          </div>

          {/* Subtabs Toggle */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
            <button 
              onClick={() => setActiveSessionSubtab('types')}
              style={{
                backgroundColor: activeSessionSubtab === 'types' ? 'rgba(202, 59, 36, 0.1)' : 'transparent',
                color: activeSessionSubtab === 'types' ? '#ca3b24' : '#888',
                border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
              }}
            >
              Session Types
            </button>
            <button 
              onClick={() => setActiveSessionSubtab('categories')}
              style={{
                backgroundColor: activeSessionSubtab === 'categories' ? 'rgba(202, 59, 36, 0.1)' : 'transparent',
                color: activeSessionSubtab === 'categories' ? '#ca3b24' : '#888',
                border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
              }}
            >
              Service Categories
            </button>
          </div>

          {/* Session Types Table */}
          {activeSessionSubtab === 'types' && (
            <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                      <th style={{ padding: '12px' }}>Session Name</th>
                      <th style={{ padding: '12px' }}>Category</th>
                      <th style={{ padding: '12px' }}>Duration</th>
                      <th style={{ padding: '12px' }}>Pricing</th>
                      <th style={{ padding: '12px' }}>Max Capacity</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{s.title}</td>
                        <td style={{ padding: '12px', color: '#ccc' }}>{s.category}</td>
                        <td style={{ padding: '12px', color: '#aaa' }}>{s.duration}</td>
                        <td style={{ padding: '12px', color: '#ca3b24', fontWeight: '700' }}>{s.price}</td>
                        <td style={{ padding: '12px', color: '#aaa' }}>{s.capacity} spots</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDeleteSession(s.id)}
                            style={{ backgroundColor: 'transparent', border: 'none', color: '#ff8a7a', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeSessionSubtab === 'categories' && (
            <div style={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                      <th style={{ padding: '12px' }}>Category Name</th>
                      <th style={{ padding: '12px' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#ca3b24' }}>{c.name}</td>
                        <td style={{ padding: '12px', color: '#ccc' }}>{c.description}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDeleteCategory(c.id)}
                            style={{ backgroundColor: 'transparent', border: 'none', color: '#ff8a7a', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
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
            {loadingProfiles ? (
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
                    {filteredClients.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ca3b24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                                {p.full_name ? p.full_name.slice(0, 2).toUpperCase() : 'F'}
                              </div>
                            )}
                            <span>{p.full_name || 'N/A'}</span>
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
                          <button 
                            onClick={() => { setSelectedClient(p); setClientModalOpen(true); }}
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOOKINGS SUB-VIEW */}
      {activeTab === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Bookings Calendar</h1>
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
              const dayBookings = bookings.filter(b => b.time.includes(day));
              return (
                <div key={day} style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px', minHeight: '160px' }}>
                  <span style={{ fontSize: '12px', color: '#ca3b24', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>{day}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dayBookings.length === 0 ? (
                      <span style={{ fontSize: '11px', color: '#444' }}>No classes scheduled</span>
                    ) : (
                      dayBookings.map(b => (
                        <div 
                          key={b.id} 
                          style={{
                            padding: '8px', 
                            borderRadius: '6px', 
                            backgroundColor: '#0a0a0a', 
                            borderLeft: `3px solid ${b.status === 'cancelled' ? '#ef4444' : b.status === 'completed' ? '#22c55e' : '#ca3b24'}`,
                            fontSize: '11px'
                          }}
                        >
                          <span style={{ fontWeight: '700', display: 'block', color: '#fff' }}>{b.sessionName}</span>
                          <span style={{ color: '#888', display: 'block', margin: '2px 0' }}>{b.clientName}</span>
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: '800',
                            color: b.status === 'cancelled' ? '#fca5a5' : b.status === 'completed' ? '#86efac' : '#93c5fd',
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
                    <th style={{ padding: '12px' }}>Client</th>
                    <th style={{ padding: '12px' }}>Session Class</th>
                    <th style={{ padding: '12px' }}>Schedule Slot</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{b.clientName}</td>
                      <td style={{ padding: '12px', color: '#ccc' }}>{b.sessionName}</td>
                      <td style={{ padding: '12px', color: '#aaa' }}>{b.time}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          backgroundColor: b.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : b.status === 'cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(202, 59, 36, 0.15)',
                          border: `1px solid ${b.status === 'completed' ? '#22c55e' : b.status === 'cancelled' ? '#ef4444' : '#ca3b24'}`,
                          color: b.status === 'completed' ? '#86efac' : b.status === 'cancelled' ? '#fca5a5' : '#ff8a7a',
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
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {b.status === 'scheduled' && (
                            <>
                              <button 
                                onClick={() => handleBookingStatusChange(b.id, 'completed')}
                                style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#86efac', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Mark Done
                              </button>
                              <button 
                                onClick={() => handleCancelBooking(b.id)}
                                style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT DETAIL MODAL */}
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
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Manage Fighter Profile</h3>
              <button 
                onClick={() => { setClientModalOpen(false); setSelectedClient(null); }}
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
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#ca3b24', display: 'flex', alignItems: 'center', justifycontent: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                    {selectedClient.full_name ? selectedClient.full_name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{selectedClient.full_name || 'Anonymous Fighter'}</h4>
                  <span style={{ fontSize: '13px', color: '#888' }}>{selectedClient.email}</span>
                </div>
              </div>

              {/* Status and Details Cards */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#666', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{selectedClient.phone || 'Not provided'}</span>
                </div>
                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#666', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Status</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: selectedClient.status === 'banned' ? '#ef4444' : '#22c55e' }}>
                    {selectedClient.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Role Action selector */}
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

              {/* Ban / Unban actions */}
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
      {showAddSessionModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
        }}>
          <form onSubmit={handleAddSession} style={{
            width: '100%', maxWidth: '440px', backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Add New Session Type</h3>
              <button type="button" onClick={() => setShowAddSessionModal(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Session Title</label>
              <input 
                type="text" required placeholder="e.g. Sparring Class"
                value={newSession.title} onChange={e => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Category</label>
              <select 
                value={newSession.category} onChange={e => setNewSession(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', cursor: 'pointer' }}
              >
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Duration</label>
                <input 
                  type="text" required placeholder="e.g. 60 mins"
                  value={newSession.duration} onChange={e => setNewSession(prev => ({ ...prev, duration: e.target.value }))}
                  style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Price</label>
                <input 
                  type="text" required placeholder="e.g. $25"
                  value={newSession.price} onChange={e => setNewSession(prev => ({ ...prev, price: e.target.value }))}
                  style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Max Spots</label>
              <input 
                type="number" required placeholder="12"
                value={newSession.capacity} onChange={e => setNewSession(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>

            <button type="submit" style={{ backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
              Create Class Type
            </button>
          </form>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
        }}>
          <form onSubmit={handleAddCategory} style={{
            width: '100%', maxWidth: '440px', backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Add Service Category</h3>
              <button type="button" onClick={() => setShowAddCategoryModal(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Category Name</label>
              <input 
                type="text" required placeholder="e.g. Master Sparring"
                value={newCategory.name} onChange={e => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Description</label>
              <textarea 
                rows="3" required placeholder="Short category description..."
                value={newCategory.description} onChange={e => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none', resize: 'none' }}
              />
            </div>

            <button type="submit" style={{ backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
              Create Category
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
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Client Name</label>
              <input 
                type="text" required placeholder="e.g. John Doe"
                value={newBooking.clientName} onChange={e => setNewBooking(prev => ({ ...prev, clientName: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Session Class</label>
              <select 
                value={newBooking.sessionName} onChange={e => setNewBooking(prev => ({ ...prev, sessionName: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', cursor: 'pointer' }}
              >
                {sessions.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Time Schedule Slot</label>
              <input 
                type="text" required placeholder="e.g. Friday, 10:00 AM"
                value={newBooking.time} onChange={e => setNewBooking(prev => ({ ...prev, time: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none' }}
              />
            </div>

            <button type="submit" style={{ backgroundColor: '#ca3b24', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
              Schedule Appointment
            </button>
          </form>
        </div>
      )}

    </AdminLayout>
  );
};
