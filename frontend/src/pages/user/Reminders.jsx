import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Bell, Plus, Search, Filter, MoreHorizontal, Trash2, Edit2, 
  CheckCircle, Clock, AlertTriangle, Calendar, X, ExternalLink, ShieldAlert,
  ChevronDown, HelpCircle, Eye, Info
} from 'lucide-react';
import { io } from 'socket.io-client';

const CARD = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
};

const CATEGORIES = ['Server', 'DevOps', 'Bill', 'Meeting', 'Personal', 'Other'];

const CATEGORY_STYLES = {
  Server:   { bg: '#EFF6FF', color: '#1E40AF', emoji: '🖥️' },
  DevOps:   { bg: '#F5F3FF', color: '#6D28D9', emoji: '⚙️' },
  Bill:     { bg: '#ECFDF5', color: '#047857', emoji: '💳' },
  Meeting:  { bg: '#EFF6FF', color: '#1D4ED8', emoji: '👥' },
  Personal: { bg: '#FFF1F2', color: '#BE123C', emoji: '🏠' },
  Other:    { bg: '#FFF7ED', color: '#C2410C', emoji: '📌' }
};

const PRIORITY_STYLES = {
  low:    { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  medium: { bg: '#FEF3C7', color: '#B45309', dot: '#F59E0B' },
  high:   { bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' }
};

const STATUS_STYLES = {
  upcoming: { bg: '#F1F5F9', color: '#475569', label: 'Upcoming', icon: Clock },
  due_soon: { bg: '#FFFBEB', color: '#D97706', label: 'Due Soon', icon: Info },
  overdue:  { bg: '#FEF2F2', color: '#DC2626', label: 'Overdue', icon: AlertTriangle },
  done:     { bg: '#ECFDF5', color: '#059669', label: 'Done', icon: CheckCircle }
};

const Reminders = () => {
  const { user } = useContext(AuthContext);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  
  // Search and Filters
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Dropdowns States
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSnoozeMenu, setActiveSnoozeMenu] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  // Modal Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: '',
    priority: 'medium',
    repeat_type: 'once',
    category: 'Other',
    email_notify: true,
    notify_15min: false,
    notify_1hour: false,
    is_important: false
  });

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data || []);
    } catch (err) {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();

    // WebSocket auto refresh
    const s = io(import.meta.env.VITE_API_URL?.replace('/api', '') || (window.location.hostname === 'localhost' ? 'http://localhost:5005' : window.location.origin));
    s.on('tasks_updated', fetchReminders);

    const closeDropdowns = () => {
      setActiveDropdown(null);
      setActiveSnoozeMenu(null);
    };

    document.addEventListener('click', closeDropdowns);

    return () => {
      s.disconnect();
      document.removeEventListener('click', closeDropdowns);
    };
  }, []);

  const openAddModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setEditingReminder(null);
    setFormData({
      title: '',
      description: '',
      reminder_date: todayStr,
      reminder_time: '12:00',
      priority: 'medium',
      repeat_type: 'once',
      category: 'Other',
      email_notify: true,
      notify_15min: false,
      notify_1hour: false,
      is_important: false
    });
    setShowModal(true);
  };

  const openEditModal = (rem) => {
    setEditingReminder(rem);
    setFormData({
      title: rem.title,
      description: rem.description || '',
      reminder_date: rem.reminder_date,
      reminder_time: rem.reminder_time,
      priority: rem.priority,
      repeat_type: rem.repeat_type,
      category: rem.category,
      email_notify: rem.email_notify === 1,
      notify_15min: rem.notify_15min === 1,
      notify_1hour: rem.notify_1hour === 1,
      is_important: rem.is_important === 1
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.reminder_date || !formData.reminder_time) {
      toast.error('Title, Date, and Time are required');
      return;
    }

    try {
      if (editingReminder) {
        await api.put(`/reminders/${editingReminder.id}`, formData);
        toast.success('Reminder updated successfully');
      } else {
        await api.post('/reminders', formData);
        toast.success('Reminder scheduled successfully! Confirmation email sent.');
      }
      setShowModal(false);
      fetchReminders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reminder');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await api.delete(`/reminders/${id}`);
      toast.success('Reminder deleted');
      fetchReminders();
    } catch (err) {
      toast.error('Failed to delete reminder');
    }
  };

  const handleToggleStatus = async (rem) => {
    const nextStatus = rem.status === 'done' ? 'upcoming' : 'done';
    try {
      await api.patch(`/reminders/${rem.id}/status`, { status: nextStatus });
      toast.success(nextStatus === 'done' ? 'Reminder completed!' : 'Reminder activated!');
      fetchReminders();
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  const handleSnooze = async (id, minutes) => {
    try {
      await api.patch(`/reminders/${id}/snooze`, { minutes });
      toast.success(`Reminder snoozed for ${minutes} minutes`);
      fetchReminders();
    } catch (err) {
      toast.error('Failed to snooze reminder');
    }
  };

  // Helper date logic for stats
  const getISTDetails = () => {
    const cur = new Date();
    const offset = 5.5 * 60 * 60 * 1000;
    return new Date(cur.getTime() + offset);
  };

  const todayISTStr = getISTDetails().toISOString().split('T')[0];

  const totalReminders = reminders.length;
  const dueTodayCount = reminders.filter(r => r.reminder_date === todayISTStr && r.status !== 'done').length;
  const overdueCount = reminders.filter(r => r.status === 'overdue').length;
  
  // Calculate completed this week
  const getStartOfWeek = () => {
    const d = getISTDetails();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // start on Monday
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };
  const startOfWeekStr = getStartOfWeek();
  const completedThisWeekCount = reminders.filter(r => r.status === 'done' && r.reminder_date >= startOfWeekStr).length;

  const statCards = [
    { label: 'Total Reminders', value: totalReminders, icon: Bell, bg: '#F5F3FF', color: '#8B5CF6' },
    { label: 'Due Today', value: dueTodayCount, icon: Clock, bg: '#FFF7ED', color: '#FF7E5F' },
    { label: 'Overdue Alerts', value: overdueCount, icon: AlertTriangle, bg: '#FEF2F2', color: '#EF4444' },
    { label: 'Done This Week', value: completedThisWeekCount, icon: CheckCircle, bg: '#ECFDF5', color: '#10B981' }
  ];

  // Filtering
  const filtered = reminders.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !(r.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority && r.priority !== filterPriority) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterDate && r.reminder_date !== filterDate) return false;
    return true;
  });

  const selStyle = {
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    padding: '0.55rem 0.85rem',
    fontSize: '0.85rem',
    color: '#1E293B',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100%', position: 'relative' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#1E293B' }}>Reminders</h2>
          <p style={{ margin: '0.3rem 0 0', color: '#64748B', fontSize: '0.875rem' }}>
            Track tasks, deadlines, and scheduled alerts
          </p>
        </div>
        <button onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: '700', color: 'white', cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(255,126,95,0.3)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <Plus size={16} /> Add Reminder
        </button>
      </div>

      {/* ── Stats Summary Widgets ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            ...CARD, display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1.25rem', transition: 'all 0.2s', cursor: 'default'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)'; }}>
            <div style={{ background: s.bg, padding: '0.85rem', borderRadius: '12px', color: s.color, flexShrink: 0, display: 'flex' }}>
              <s.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.71rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1E293B', lineHeight: 1.1, marginTop: '0.1rem' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '1.1rem 1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text" placeholder="Search reminders..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...selStyle, width: '100%', paddingLeft: '2.1rem' }}
          />
        </div>
        <input 
          type="date" 
          value={filterDate} 
          onChange={e => setFilterDate(e.target.value)}
          style={{ ...selStyle }}
        />
        <select style={selStyle} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select style={selStyle} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={selStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="due_soon">Due Soon</option>
          <option value="overdue">Overdue</option>
          <option value="done">Done</option>
        </select>
        {(search || filterPriority || filterStatus || filterCategory || filterDate) && (
          <button onClick={() => { setSearch(''); setFilterPriority(''); setFilterStatus(''); setFilterCategory(''); setFilterDate(''); }}
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', borderRadius: '10px', padding: '0.55rem 0.85rem', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Reminders List / Table ── */}
      <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(255,126,95,0.2)', borderTopColor: '#FF7E5F', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
            No reminders scheduled.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,126,95,0.04)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <th style={{ width: 36, padding: '0.85rem 1.1rem' }}></th>
                  {['Title & Details', 'Category', 'Priority', 'Repeat', 'Scheduled Time', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1.1rem', textAlign: 'left', fontSize: '0.71rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const cat = CATEGORY_STYLES[r.category] || CATEGORY_STYLES.Other;
                  const pri = PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.medium;
                  const stat = STATUS_STYLES[r.status] || STATUS_STYLES.upcoming;
                  const SIcon = stat.icon;
                  const isDone = r.status === 'done';

                  // Dynamic row highlight
                  let rowBg = 'transparent';
                  if (r.status === 'overdue') {
                    rowBg = 'rgba(239, 68, 68, 0.02)';
                  } else if (r.status === 'due_soon') {
                    rowBg = 'rgba(245, 158, 11, 0.02)';
                  } else if (isDone) {
                    rowBg = 'rgba(0, 0, 0, 0.01)';
                  }

                  return (
                    <tr key={r.id}
                      style={{ 
                        borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', 
                        transition: 'background 0.15s',
                        background: rowBg
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = isDone ? 'rgba(0,0,0,0.02)' : 'rgba(255,126,95,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                      
                      {/* Done Circle Toggle */}
                      <td style={{ padding: '0.9rem 1.1rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleToggleStatus(r)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: isDone ? '#10B981' : '#CBD5E1', padding: 0 }}
                          title={isDone ? 'Mark Active' : 'Mark Completed'}
                        >
                          <CheckCircle size={20} fill={isDone ? 'rgba(16,185,129,0.1)' : 'transparent'} />
                        </button>
                      </td>

                      {/* Title & Notes */}
                      <td style={{ padding: '0.9rem 1.1rem', maxWidth: 240 }}>
                        <div style={{ 
                          fontWeight: '700', 
                          color: isDone ? '#94A3B8' : '#1E293B', 
                          fontSize: '0.875rem',
                          textDecoration: isDone ? 'line-through' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {r.is_important === 1 && (
                            <span style={{ fontSize: '0.65rem', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FEE2E2', padding: '2px 5px', borderRadius: '4px', fontWeight: '800' }}>IMP</span>
                          )}
                          {r.title}
                        </div>
                        {r.description && (
                          <div style={{ fontSize: '0.78rem', color: isDone ? '#CBD5E1' : '#64748B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: cat.bg, color: cat.color, padding: '0.22rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                          <span>{cat.emoji}</span> {r.category}
                        </span>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: pri.bg, color: pri.color, padding: '0.22rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'capitalize' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: pri.dot }} />
                          {r.priority}
                        </span>
                      </td>

                      {/* Repeat */}
                      <td style={{ padding: '0.9rem 1.1rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize' }}>
                        🔄 {r.repeat_type}
                      </td>

                      {/* Scheduled Time (IST) */}
                      <td style={{ padding: '0.9rem 1.1rem', color: isDone ? '#94A3B8' : '#374151', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: '700' }}>
                          {new Date(r.reminder_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: isDone ? '#CBD5E1' : '#64748B', fontWeight: '600', marginTop: '2px' }}>
                          ⏰ {r.reminder_time} IST
                          {r.snooze_until && (
                            <span style={{ display: 'block', color: '#F59E0B', fontSize: '0.7rem', fontWeight: '700', marginTop: '1px' }}>
                              Snoozed until {r.snooze_until.slice(11)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: stat.bg, color: stat.color, padding: '0.22rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                          <SIcon size={11} /> {stat.label}
                        </span>
                      </td>

                      {/* Action Dropdowns */}
                      <td style={{ padding: '0.9rem 1.1rem', position: 'relative' }}>
                        <button 
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: '6px', borderRadius: '6px' }}
                          onClick={e => {
                            e.stopPropagation();
                            if (activeDropdown === r.id) {
                              setActiveDropdown(null);
                              setActiveSnoozeMenu(null);
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDropdownPos({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right - window.scrollX });
                            setActiveDropdown(r.id);
                            setActiveSnoozeMenu(null);
                          }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Action Dropdown Modal Overlay ── */}
      {activeDropdown && (() => {
        const rem = reminders.find(r => r.id === activeDropdown);
        if (!rem) return null;
        const isDone = rem.status === 'done';

        return (
          <div style={{ 
            position: 'absolute', 
            top: dropdownPos.top + 4, 
            right: dropdownPos.right, 
            zIndex: 100, 
            background: 'rgba(255,255,255,0.98)', 
            backdropFilter: 'blur(20px)', 
            border: '1px solid rgba(0,0,0,0.1)', 
            borderRadius: '12px', 
            boxShadow: '0 12px 36px rgba(0,0,0,0.12)', 
            width: 180, 
            padding: '0.4rem 0',
            animation: 'fadeIn 0.15s ease' 
          }}
          onClick={e => e.stopPropagation()}>
            <div onClick={() => { setActiveDropdown(null); handleToggleStatus(rem); }}
              style={{ padding: '0.55rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: isDone ? '#475569' : '#10B981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} /> {isDone ? 'Activate Alert' : 'Mark as Done'}
            </div>
            
            {!isDone && (
              <div 
                onMouseEnter={() => setActiveSnoozeMenu(rem.id)}
                style={{ padding: '0.55rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#F59E0B', fontWeight: '600', display: 'flex', alignItems: 'center', justifyStyle: 'space-between', gap: '8px', position: 'relative' }}
              >
                <Clock size={14} /> 
                <span style={{ flex: 1 }}>Snooze Alarm</span> 
                <span style={{ fontSize: '0.65rem' }}>▶</span>

                {/* Snooze Sub-menu */}
                {activeSnoozeMenu === rem.id && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 178,
                    background: 'white',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    width: 140,
                    padding: '0.3rem 0',
                    zIndex: 101
                  }}>
                    {[
                      { l: '10 Minutes', v: 10 },
                      { l: '30 Minutes', v: 30 },
                      { l: '1 Hour',      v: 60 },
                      { l: 'Tomorrow',   v: 1440 },
                      { l: 'Next Week',  v: 10080 }
                    ].map(sz => (
                      <div 
                        key={sz.l} 
                        onClick={() => {
                          setActiveDropdown(null);
                          setActiveSnoozeMenu(null);
                          handleSnooze(rem.id, sz.v);
                        }}
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem', color: '#1E293B', fontWeight: '500' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {sz.l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0.35rem 0' }} />

            <div onClick={() => { setActiveDropdown(null); openEditModal(rem); }}
              style={{ padding: '0.55rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit2 size={14} /> Edit Reminder
            </div>

            <div onClick={() => { setActiveDropdown(null); handleDelete(rem.id); }}
              style={{ padding: '0.55rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#EF4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Trash2 size={14} /> Delete
            </div>
          </div>
        );
      })()}

      {/* ── Add / Edit Reminder Modal Overlay ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '18px', maxWidth: '520px', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1E293B', fontWeight: '800' }}>
                {editingReminder ? '📝 Edit Reminder' : '🔔 Add Reminder'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Reminder Title *</label>
                <input 
                  type="text" 
                  className="input"
                  placeholder="e.g. Reboot Backup Server" 
                  value={formData.title}
                  onChange={e => setFormData(f => ({...f, title: e.target.value}))} 
                  required
                />
              </div>

              <div>
                <label className="label">Task Notes / Description</label>
                <textarea 
                  className="input" 
                  rows="3"
                  placeholder="Additional server details, credentials, or alert rules..."
                  value={formData.description}
                  onChange={e => setFormData(f => ({...f, description: e.target.value}))}
                  style={{ resize: 'none', height: '70px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Date *</label>
                  <input 
                    type="date" 
                    className="input"
                    value={formData.reminder_date}
                    onChange={e => setFormData(f => ({...f, reminder_date: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Time (IST) *</label>
                  <input 
                    type="time" 
                    className="input"
                    value={formData.reminder_time}
                    onChange={e => setFormData(f => ({...f, reminder_time: e.target.value}))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={formData.priority} onChange={e => setFormData(f => ({...f, priority: e.target.value}))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="label">Repeat Schedule</label>
                  <select className="input" value={formData.repeat_type} onChange={e => setFormData(f => ({...f, repeat_type: e.target.value}))}>
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom (Daily)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Category</label>
                <select className="input" value={formData.category} onChange={e => setFormData(f => ({...f, category: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Toggles Panel */}
              <div style={{ background: '#FAF9F6', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569' }}>Email Notification</span>
                  <input 
                    type="checkbox" 
                    checked={formData.email_notify}
                    onChange={e => setFormData(f => ({...f, email_notify: e.target.checked}))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </div>
                
                {formData.email_notify && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '500' }}>Pre-alert 15 minutes before</span>
                      <input 
                        type="checkbox" 
                        checked={formData.notify_15min}
                        onChange={e => setFormData(f => ({...f, notify_15min: e.target.checked}))}
                        style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '500' }}>Pre-alert 1 hour before</span>
                      <input 
                        type="checkbox" 
                        checked={formData.notify_1hour}
                        onChange={e => setFormData(f => ({...f, notify_1hour: e.target.checked}))}
                        style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569' }}>⭐ Mark as Important</span>
                  <input 
                    type="checkbox" 
                    checked={formData.is_important}
                    onChange={e => setFormData(f => ({...f, is_important: e.target.checked}))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.65rem', border: '1px solid rgba(0,0,0,0.1)', background: 'white', borderRadius: '10px', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '0.65rem', border: 'none', background: 'linear-gradient(135deg,#FF7E5F,#FEB47B)', color: 'white', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(255,126,95,0.25)' }}>
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Reminders;
