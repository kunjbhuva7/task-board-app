import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import { Search, Bell, Calendar, Settings, FolderKanban, Shield, Users, Activity, LogOut, X, ChevronLeft, ChevronRight, Clock, CheckCircle, Trash2, AlertTriangle, Moon, Sun } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PanelOverlay = ({ title, icon: Icon, children, onClose }) => (
  <div
    style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ position:'absolute', inset:0, background:'rgba(15, 23, 42, 0.4)', backdropFilter:'blur(8px)' }} onClick={onClose} />
    <div style={{
      position:'relative', width:'90vw', maxWidth:'1000px', height:'90vh',
      background:'var(--glass-strong)', border:'1px solid var(--border)',
      boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius:'24px',
      display:'flex', flexDirection:'column', animation:'fadeIn 0.2s ease',
      zIndex:201, overflow:'hidden'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.5rem 2rem', borderBottom:'1px solid var(--border)', background:'var(--table-head-bg)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ padding:'0.5rem', background:'rgba(255, 126, 95, 0.1)', borderRadius:'10px', display:'flex' }}>
            <Icon size={22} color="#FF7E5F" />
          </div>
          <h3 style={{ margin:0, fontWeight:'800', color:'var(--text-primary)', fontSize:'1.25rem', letterSpacing:'-0.02em' }}>{title}</h3>
        </div>
        <button onClick={onClose} style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:'50%', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'8px', transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.color='var(--text-primary)';}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';}}>
          <X size={18} />
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'2rem', background:'transparent' }}>
        {children}
      </div>
    </div>
  </div>
);

const Sidebar = () => {
  const { user, permissions, logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { canViewAllTasks } = usePermissions();
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [taskDueDates, setTaskDueDates] = useState([]);
  const [events, setEvents] = useState([]);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', event_time: '' });
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const fetchEvents = () => {
    api.get('/events').then(res => setEvents(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    api.get('/activity').then(res => {
      const acts = res.data.slice(0, 15).map((a, i) => ({
        id: a.id,
        type: a.target_type,
        message: `${a.user_name || 'System'} — ${a.action}${a.details ? ': ' + a.details : ''}`,
        time: new Date(a.created_at).toLocaleString(),
        read: i > 2,
      }));
      setNotifications(acts);
    }).catch(() => {});

    api.get('/tasks').then(res => {
      const dates = (res.data || []).filter(t => t.due_date).map(t => ({
        date: t.due_date?.slice(0,10),
        title: t.title,
        status: t.status,
      }));
      setTaskDueDates(dates);
    }).catch(() => {});

    fetchEvents();
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!selectedDate || !eventForm.title || !eventForm.event_time) {
      toast.error('Please fill all fields');
      return;
    }
    setAddingEvent(true);
    try {
      await api.post('/events', {
        title: eventForm.title,
        event_date: selectedDate,
        event_time: eventForm.event_time,
      });
      toast.success('Event scheduled! Email notification sent.');
      setEventForm({ title: '', event_time: '' });
      setSelectedDate(null);
      fetchEvents();
    } catch (err) {
      toast.error('Failed to schedule event');
    } finally {
      setAddingEvent(false);
    }
  };

  const handleDeleteEvent = (id) => {
    setEventToDelete(id);
  };

  const executeDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await api.delete(`/events/${eventToDelete}`);
      toast.success('Event deleted');
      fetchEvents();
      setEventToDelete(null);
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header" style={{ padding:'1.5rem', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.1rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            <div style={{ fontSize:'1.4rem', fontWeight:'800', color:'var(--text-primary)', letterSpacing:'-0.3px', lineHeight:1 }}>
              Pur<span style={{ background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>p</span>le
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section-title">MAIN MENU</div>

          <div className={`sidebar-item${openPanel === 'search' ? ' active' : ''}`}
            onClick={() => setOpenPanel(openPanel === 'search' ? null : 'search')}
            style={{ cursor:'pointer' }}>
            <Search size={17} /> Search
          </div>

          <div className={`sidebar-item${openPanel === 'notification' ? ' active' : ''}`}
            onClick={() => setOpenPanel(openPanel === 'notification' ? null : 'notification')}
            style={{ cursor:'pointer', position:'relative' }}>
            <Bell size={17} /> Notification
            {notifications.filter(n => !n.read).length > 0 && (
              <span style={{ marginLeft:'auto', background:'#EF4444', color:'white', fontSize:'0.65rem', fontWeight:'700', padding:'0.1rem 0.4rem', borderRadius:'10px', minWidth:'18px', textAlign:'center' }}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>

          <div className={`sidebar-item${openPanel === 'calendar' ? ' active' : ''}`}
            onClick={() => setOpenPanel(openPanel === 'calendar' ? null : 'calendar')}
            style={{ cursor:'pointer' }}>
            <Calendar size={17} /> Calendar
          </div>

          <NavLink to="/user/profile" className="sidebar-item">
            <Settings size={17} /> Settings
          </NavLink>

          <div className="sidebar-section-title">MY PAGES</div>

          {/* Dashboard - always visible, route depends on role */}
          {user.role === 'admin' || permissions?.is_super_admin || permissions?.can_view_analytics ? (
            <NavLink to="/admin/dashboard" className="sidebar-item"><FolderKanban size={17} /> Dashboard</NavLink>
          ) : (
            <NavLink to="/user/dashboard" className="sidebar-item"><FolderKanban size={17} /> Dashboard</NavLink>
          )}

          {/* Tasks - always visible */}
          <NavLink to="/user/tasks" className="sidebar-item"><FolderKanban size={17} /> My Tasks</NavLink>

          {/* Admin-level pages — only shown if user has relevant permissions */}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_manage_tasks) && (
            <NavLink to="/admin/tasks" className="sidebar-item"><FolderKanban size={17} /> Task Management</NavLink>
          )}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_view_users || permissions?.can_manage_users) && (
            <NavLink to="/admin/users" className="sidebar-item"><Users size={17} /> Manage Users</NavLink>
          )}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_manage_roles) && (
            <NavLink to="/admin/permissions" className="sidebar-item"><Shield size={17} /> Permissions</NavLink>
          )}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_view_reports) && (
            <NavLink to="/admin/activity" className="sidebar-item"><Activity size={17} /> Activity Log</NavLink>
          )}
        </div>

        <div className="sidebar-footer" style={{ padding:'1rem 1.5rem 1.5rem', borderTop:'1px solid var(--border)' }}>
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background: darkMode ? 'rgba(255,126,95,0.1)' : 'rgba(0,0,0,0.04)', border: darkMode ? '1px solid rgba(255,126,95,0.25)' : '1px solid rgba(0,0,0,0.08)', color:'var(--text-secondary)', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', padding:'0.6rem 0.75rem', borderRadius:'10px', transition:'all 0.2s', marginBottom:'0.5rem' }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,126,95,0.2)' : 'rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,126,95,0.1)' : 'rgba(0,0,0,0.04)'; }}>
            <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>{darkMode ? <Sun size={16} color="#FF7E5F" /> : <Moon size={16} />} {darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            <div style={{ width:'32px', height:'18px', borderRadius:'20px', background: darkMode ? '#FF7E5F' : '#CBD5E1', position:'relative', transition:'background 0.3s' }}>
              <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:'white', position:'absolute', top:'2px', left: darkMode ? '16px' : '2px', transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </button>
          <button
            onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'transparent', border:'none', color:'var(--text-muted)', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', padding:'0.5rem', borderRadius:'8px', transition:'all 0.2s', width:'100%' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; }}>
            <LogOut size={17} /> Logout
          </button>
        </div>
      </div>

      {/* ── Search Panel ── */}
      {openPanel === 'search' && (
        <PanelOverlay title="Search" icon={Search} onClose={() => setOpenPanel(null)}>
          <input
            autoFocus type="text" placeholder="Search tasks, users..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'10px', background:'rgba(255,255,255,0.7)', border:'1px solid rgba(226,232,240,0.8)', color:'#1E293B', outline:'none', fontSize:'0.95rem', marginBottom:'1rem' }}
          />
          <p style={{ color:'#64748B', fontSize:'0.875rem', textAlign:'center', marginTop:'2rem' }}>
            🔍 Global search coming soon!<br/>
            <span style={{ fontSize:'0.8rem' }}>For now, use the search bar in the task view.</span>
          </p>
        </PanelOverlay>
      )}

      {/* ── Notification Panel ── */}
      {openPanel === 'notification' && (
        <PanelOverlay title="Notifications" icon={Bell} onClose={() => setOpenPanel(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                padding:'1rem', borderRadius:'12px', border:'1px solid rgba(226,232,240,0.8)',
                background: n.read ? 'rgba(248,250,252,0.6)' : 'rgba(79,70,229,0.06)',
                display:'flex', gap:'0.85rem', alignItems:'flex-start'
              }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: n.read ? 'rgba(241,245,249,1)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)', display:'flex', justifyContent:'center', alignItems:'center', flexShrink:0, boxShadow: n.read ? 'none' : '0 2px 10px rgba(79,70,229,0.3)' }}>
                  {n.read ? <CheckCircle size={16} color="#64748B" /> : <Bell size={16} color="white" />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:'0.88rem', color: n.read ? '#64748B' : '#0F172A', fontWeight: n.read ? '400' : '600', lineHeight:'1.4' }}>{n.message}</p>
                  <span style={{ fontSize:'0.75rem', color:'#94A3B8', display:'flex', alignItems:'center', gap:'0.3rem', marginTop:'0.45rem' }}>
                    <Clock size={12} /> {n.time}
                  </span>
                </div>
                {!n.read && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#4F46E5', flexShrink:0, marginTop:'6px', boxShadow:'0 0 8px #4F46E5' }}></div>}
              </div>
            ))}
          </div>
        </PanelOverlay>
      )}

      {/* ── Calendar Panel ── */}
      {openPanel === 'calendar' && (
        <PanelOverlay title="Calendar & Events" icon={Calendar} onClose={() => setOpenPanel(null)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', height:'100%' }}>

            {/* LEFT: Calendar */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
                <button onClick={prevMonth}
                  style={{ background:'rgba(241,245,249,1)', border:'1px solid rgba(226,232,240,1)', borderRadius:'8px', padding:'6px 10px', cursor:'pointer', display:'flex', alignItems:'center', color:'#475569' }}>
                  <ChevronLeft size={16}/>
                </button>
                <h4 style={{ margin:0, color:'#0F172A', fontWeight:'800', fontSize:'1.1rem' }}>
                  {monthNames[calMonth]} {calYear}
                </h4>
                <button onClick={nextMonth}
                  style={{ background:'rgba(241,245,249,1)', border:'1px solid rgba(226,232,240,1)', borderRadius:'8px', padding:'6px 10px', cursor:'pointer', display:'flex', alignItems:'center', color:'#475569' }}>
                  <ChevronRight size={16}/>
                </button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'4px', marginBottom:'6px' }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{ textAlign:'center', fontSize:'0.72rem', fontWeight:'700', color:'#94A3B8', padding:'4px' }}>{d}</div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'4px' }}>
                {Array.from({ length: calFirstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: calDaysInMonth }, (_, i) => i + 1).map(day => {
                  const now = new Date();
                  const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                  const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const isSelected = selectedDate === dateStr;
                  const hasTask = taskDueDates.some(t => t.date === dateStr);
                  const hasEvent = events.some(e => e.event_date?.slice(0,10) === dateStr);
                  return (
                    <div key={day}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      style={{
                        textAlign:'center', padding:'9px 4px', borderRadius:'8px', fontSize:'0.85rem',
                        background: isSelected ? '#4F46E5' : isToday ? 'rgba(79,70,229,0.12)' : 'transparent',
                        color: isSelected ? 'white' : isToday ? '#4F46E5' : '#334155',
                        fontWeight: isSelected || isToday ? '700' : '500',
                        border: isSelected ? 'none' : isToday ? '2px solid rgba(79,70,229,0.3)' : '2px solid transparent',
                        cursor:'pointer', transition:'all 0.15s', position:'relative',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='rgba(79,70,229,0.08)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(79,70,229,0.12)' : 'transparent'; }}>
                      {day}
                      <div style={{ display:'flex', justifyContent:'center', gap:'2px', position:'absolute', bottom:'2px', left:0, right:0 }}>
                        {hasTask && <span style={{ width:4, height:4, borderRadius:'50%', background: isSelected ? 'white' : '#F59E0B', display:'inline-block' }}/>}
                        {hasEvent && <span style={{ width:4, height:4, borderRadius:'50%', background: isSelected ? 'white' : '#10B981', display:'inline-block' }}/>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display:'flex', gap:'1rem', marginTop:'1.25rem', flexWrap:'wrap' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.78rem', color:'#64748B' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#F59E0B', display:'inline-block' }}/> Task due
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.78rem', color:'#64748B' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#10B981', display:'inline-block' }}/> Event
                </span>
              </div>
            </div>

            {/* RIGHT: Event Form + List */}
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div style={{ background:'rgba(248,250,252,0.8)', border:'1px solid rgba(226,232,240,0.8)', borderRadius:'12px', padding:'1.25rem' }}>
                <h4 style={{ margin:'0 0 1rem', color:'#0F172A', fontSize:'0.95rem', fontWeight:'700' }}>📅 Schedule Event</h4>
                <form onSubmit={handleAddEvent} style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'#64748B', marginBottom:'4px' }}>Selected Date</label>
                    <input type="date" value={selectedDate || ''} onChange={e => setSelectedDate(e.target.value)}
                      style={{ width:'100%', padding:'0.6rem 0.8rem', borderRadius:'8px', border:'1px solid rgba(226,232,240,0.8)', background:'white', color:'#0F172A', outline:'none', fontSize:'0.875rem' }}
                      onFocus={e => e.target.style.borderColor='#4F46E5'} onBlur={e => e.target.style.borderColor='rgba(226,232,240,0.8)'}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'#64748B', marginBottom:'4px' }}>Event Title</label>
                    <input type="text" placeholder="e.g. Team Standup" value={eventForm.title} onChange={e => setEventForm(f => ({...f, title: e.target.value}))}
                      style={{ width:'100%', padding:'0.6rem 0.8rem', borderRadius:'8px', border:'1px solid rgba(226,232,240,0.8)', background:'white', color:'#0F172A', outline:'none', fontSize:'0.875rem' }}
                      onFocus={e => e.target.style.borderColor='#4F46E5'} onBlur={e => e.target.style.borderColor='rgba(226,232,240,0.8)'}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'0.78rem', fontWeight:'600', color:'#64748B', marginBottom:'4px' }}>Time</label>
                    <input type="time" value={eventForm.event_time} onChange={e => setEventForm(f => ({...f, event_time: e.target.value}))}
                      style={{ width:'100%', padding:'0.6rem 0.8rem', borderRadius:'8px', border:'1px solid rgba(226,232,240,0.8)', background:'white', color:'#0F172A', outline:'none', fontSize:'0.875rem' }}
                      onFocus={e => e.target.style.borderColor='#4F46E5'} onBlur={e => e.target.style.borderColor='rgba(226,232,240,0.8)'}/>
                  </div>
                  <button type="submit" disabled={addingEvent}
                    style={{ background:'#4F46E5', color:'white', border:'none', padding:'0.7rem', borderRadius:'8px', fontWeight:'700', cursor:'pointer', fontSize:'0.875rem', display:'flex', justifyContent:'center', alignItems:'center', gap:'0.5rem', transition:'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#4338CA'}
                    onMouseLeave={e => e.currentTarget.style.background='#4F46E5'}>
                    {addingEvent ? 'Scheduling...' : 'Schedule & Send Email'}
                  </button>
                </form>
              </div>

              <div style={{ flex:1, overflowY:'auto' }}>
                <h4 style={{ margin:'0 0 0.75rem', color:'#0F172A', fontSize:'0.9rem', fontWeight:'700' }}>
                  {selectedDate ? `Events on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}` : 'Upcoming Events'}
                </h4>
                {(() => {
                  const filtered = selectedDate
                    ? events.filter(e => e.event_date?.slice(0,10) === selectedDate)
                    : events.filter(e => new Date(e.event_date + 'T' + e.event_time) >= new Date()).slice(0, 8);
                  return filtered.length === 0 ? (
                    <p style={{ color:'#94A3B8', fontSize:'0.875rem', textAlign:'center', padding:'1rem 0' }}>No events {selectedDate ? 'on this day' : 'scheduled'}.</p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                      {filtered.map(ev => (
                        <div key={ev.id} style={{ background:'rgba(255,255,255,0.9)', border:'1px solid rgba(226,232,240,0.8)', borderRadius:'10px', padding:'0.75rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            <div style={{ fontWeight:'700', color:'#0F172A', fontSize:'0.875rem' }}>{ev.title}</div>
                            <div style={{ fontSize:'0.75rem', color:'#64748B', marginTop:'2px' }}>
                              {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})} at {ev.event_time}
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                            <span style={{ fontSize:'0.7rem', padding:'0.2rem 0.55rem', borderRadius:'20px', background: ev.reminder_sent ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: ev.reminder_sent ? '#059669' : '#D97706', fontWeight:'700' }}>
                              {ev.reminder_sent ? '✓ Reminded' : '⏰ Pending'}
                            </span>
                            <button onClick={() => handleDeleteEvent(ev.id)}
                              style={{ background:'transparent', border:'none', color:'#EF4444', cursor:'pointer', padding:'4px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background='transparent'}
                              title="Delete Event"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </PanelOverlay>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {eventToDelete && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(15, 23, 42, 0.4)', backdropFilter:'blur(4px)' }} onClick={() => setEventToDelete(null)} />
          <div style={{
            position:'relative', background:'white', width:'90%', maxWidth:'400px',
            padding:'2rem', borderRadius:'20px', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)',
            textAlign:'center', animation:'fadeIn 0.2s ease', zIndex:301
          }}>
            <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'rgba(239,68,68,0.1)', color:'#EF4444', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
              <AlertTriangle size={30} />
            </div>
            <h3 style={{ margin:'0 0 0.5rem', fontSize:'1.25rem', color:'#0F172A', fontWeight:'800' }}>Delete Event?</h3>
            <p style={{ margin:'0 0 2rem', color:'#64748B', fontSize:'0.95rem', lineHeight:1.5 }}>Are you sure you want to delete this event? No further notifications will be sent to anyone.</p>
            <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
              <button onClick={() => setEventToDelete(null)} style={{ flex:1, padding:'0.75rem', border:'1px solid rgba(0,0,0,0.1)', background:'white', borderRadius:'10px', color:'#475569', fontWeight:'600', cursor:'pointer' }}>Cancel</button>
              <button onClick={executeDeleteEvent} style={{ flex:1, padding:'0.75rem', border:'none', background:'#EF4444', color:'white', borderRadius:'10px', fontWeight:'600', cursor:'pointer', boxShadow:'0 4px 14px rgba(239,68,68,0.4)' }}>Delete Event</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
