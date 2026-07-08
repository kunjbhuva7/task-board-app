import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import { Search, Bell, Calendar, Settings, FolderKanban, Shield, Users, Activity, LogOut, X, ChevronLeft, ChevronRight, Clock, CheckCircle, Trash2, AlertTriangle, Moon, Sun, Folder, Menu, IndianRupee, Dumbbell, Receipt } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

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

const Sidebar = ({ setMobileOpen }) => {
  const { user, permissions, logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { canViewAllTasks } = usePermissions();
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
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

  const fetchNotifications = () => {
    api.get('/notifications').then(res => {
      setNotifications(res.data.map(n => ({
        id: n.id,
        message: n.message,
        time: new Date(n.created_at.replace(' ', 'T') + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase(),
        read: n.is_read === 1
      })));
    }).catch(() => {});
  };

  const fetchTasks = () => {
    api.get('/tasks').then(res => {
      const dates = (res.data || []).map(t => ({
        date: t.due_date?.slice(0,10),
        title: t.title,
        status: t.status,
      }));
      setTaskDueDates(dates);
    }).catch(() => {});
  };

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchTasks();
    fetchEvents();

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstallable(false);
    }

    const s = io(import.meta.env.VITE_API_URL?.replace('/api','') || (window.location.hostname === 'localhost' ? 'http://localhost:5005' : window.location.origin));
    s.on('tasks_updated', () => {
      fetchNotifications();
      fetchTasks();
      fetchEvents();
    });
    return () => {
      s.disconnect();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    });
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const handleClearNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
    } catch (err) {}
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!selectedDate || !eventForm.title || !eventForm.event_time) {
      toast.error('Please fill all fields');
      return;
    }
    setAddingEvent(true);
    await new Promise(r => setTimeout(r, 3000));
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

  const handleDeleteEvent = async (id) => {
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
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header" style={{ padding:'1.5rem', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <div className="sidebar-text" style={{ fontSize:'1.4rem', fontWeight:'800', color:'var(--text-primary)', letterSpacing:'-0.3px', lineHeight:1 }}>
              Helios
            </div>
          </div>
          {setMobileOpen && (
            <button className="mobile-close-sidebar-btn" onClick={() => setMobileOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'none' }}>
              <X size={20} />
            </button>
          )}
          <button className="desktop-collapse-sidebar-btn" onClick={() => setCollapsed(!collapsed)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <Menu size={18} />
          </button>
        </div>

        <div className="sidebar-nav" onClick={() => setMobileOpen && setMobileOpen(false)}>
          <div className="sidebar-section-title">MAIN MENU</div>

          <div className={`sidebar-item${openPanel === 'search' ? ' active' : ''}`}
            onClick={() => setOpenPanel(openPanel === 'search' ? null : 'search')}
            style={{ cursor:'pointer' }}>
            <Search size={17} className="sidebar-icon" /> <span className="sidebar-text">Search</span>
          </div>

          <div className={`sidebar-item${openPanel === 'notification' ? ' active' : ''}`}
            onClick={() => setOpenPanel(openPanel === 'notification' ? null : 'notification')}
            style={{ cursor:'pointer', position:'relative' }}>
            <Bell size={17} className="sidebar-icon" /> <span className="sidebar-text">Notification</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="sidebar-badge" style={{ marginLeft:'auto', background:'#EF4444', color:'white', fontSize:'0.65rem', fontWeight:'700', padding:'0.1rem 0.4rem', borderRadius:'10px', minWidth:'18px', textAlign:'center' }}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>

          <div className={`sidebar-item${openPanel === 'calendar' ? ' active' : ''}`}
            onClick={() => setOpenPanel(openPanel === 'calendar' ? null : 'calendar')}
            style={{ cursor:'pointer' }}>
            <Calendar size={17} className="sidebar-icon" /> <span className="sidebar-text">Calendar</span>
          </div>

          <NavLink to="/user/profile" className="sidebar-item">
            <Settings size={17} className="sidebar-icon" /> <span className="sidebar-text">Settings</span>
          </NavLink>

          <div className="sidebar-section-title">WORKSPACE</div>

          {/* Dashboard - always visible, route depends on role */}
          {user.role === 'admin' || permissions?.is_super_admin || permissions?.can_view_analytics ? (
            <NavLink to="/admin/dashboard" className="sidebar-item"><FolderKanban size={17} className="sidebar-icon" /> <span className="sidebar-text">Dashboard</span></NavLink>
          ) : (
            <NavLink to="/user/dashboard" className="sidebar-item"><FolderKanban size={17} className="sidebar-icon" /> <span className="sidebar-text">Dashboard</span></NavLink>
          )}

          {/* Tasks - always visible */}
          <NavLink to="/user/tasks" className="sidebar-item"><FolderKanban size={17} className="sidebar-icon" /> <span className="sidebar-text">My Tasks</span></NavLink>

          {/* Gym Tracker - always visible */}
          <NavLink to="/user/gym" className="sidebar-item"><Dumbbell size={17} className="sidebar-icon" /> <span className="sidebar-text">Gym Tracker</span></NavLink>

          {/* Reminders - always visible */}
          <NavLink to="/user/reminders" className="sidebar-item"><Bell size={17} className="sidebar-icon" /> <span className="sidebar-text">Reminders</span></NavLink>

          {/* Projects - Admin/Permitted only */}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_view_projects) && (
            <NavLink to="/projects" className="sidebar-item"><Folder size={17} className="sidebar-icon" /> <span className="sidebar-text">Projects</span></NavLink>
          )}

          {/* Management section header */}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_manage_tasks || permissions?.can_view_users || permissions?.can_manage_users || permissions?.can_manage_roles || permissions?.can_view_reports) && (
            <div className="sidebar-section-title" style={{ marginTop: '1.25rem' }}>MANAGEMENT</div>
          )}

          {/* Admin-level pages — only shown if user has relevant permissions */}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_manage_tasks) && (
            <NavLink to="/admin/tasks" className="sidebar-item"><FolderKanban size={17} className="sidebar-icon" /> <span className="sidebar-text">Task Management</span></NavLink>
          )}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_view_users || permissions?.can_manage_users) && (
            <NavLink to="/admin/users" className="sidebar-item"><Users size={17} className="sidebar-icon" /> <span className="sidebar-text">Manage Users</span></NavLink>
          )}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_manage_roles) && (
            <NavLink to="/admin/permissions" className="sidebar-item"><Shield size={17} className="sidebar-icon" /> <span className="sidebar-text">Permissions</span></NavLink>
          )}
          {!!(user.role === 'admin' || permissions?.is_super_admin || permissions?.can_view_reports) && (
            <NavLink to="/admin/activity" className="sidebar-item"><Activity size={17} className="sidebar-icon" /> <span className="sidebar-text">Activity Log</span></NavLink>
          )}

          {/* Financials section header */}
          {!!(user.role === 'admin' || permissions?.is_super_admin) && (
            <>
              <div className="sidebar-section-title" style={{ marginTop: '1.25rem' }}>FINANCIALS</div>
              <NavLink to="/admin/expenses" className="sidebar-item"><IndianRupee size={17} className="sidebar-icon" /> <span className="sidebar-text">SpendFlow</span></NavLink>
              <NavLink to="/user/office-expenses" className="sidebar-item"><Receipt size={17} className="sidebar-icon" /> <span className="sidebar-text">Office Expenses</span></NavLink>
            </>
          )}


          {/* Today's Schedule Widget */}
          <div className="sidebar-section-title sidebar-schedule" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
            <span>TODAY'S SCHEDULE</span>
            <span onClick={() => setOpenPanel('calendar')} style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '0.75rem', fontWeight: '700', color: '#4F46E5', cursor: 'pointer' }}>View all</span>
          </div>
          <div className="sidebar-schedule" style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1rem' }}>
            {(() => {
              const todays = events.filter(e => {
                const todayDate = new Date();
                const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
                return e.event_date && e.event_date.slice(0, 10) === todayStr;
              }).sort((a,b) => a.event_time.localeCompare(b.event_time)).slice(0, 3);
              
              if (todays.length === 0) return <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>No schedule for today.</div>;
              
              return todays.map((ev, i) => {
                const colors = [
                  { bg: 'rgba(59,130,246,0.15)', dot: '#3B82F6' },
                  { bg: 'rgba(245,158,11,0.15)', dot: '#F59E0B' },
                  { bg: 'rgba(16,185,129,0.15)', dot: '#10B981' }
                ];
                const color = colors[i % colors.length];
                return (
                  <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
                    <div style={{ width:'26px', height:'26px', borderRadius:'50%', background: color.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: color.dot }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:'700' }}>
                        {new Date(ev.event_date + 'T' + ev.event_time).toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit'})}
                      </div>
                      <div style={{ fontWeight:'700', color:'var(--text-primary)', fontSize:'0.85rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* PWA Install Banner */}
          {!collapsed && isInstallable && (
            <div style={{
              margin: '1.25rem 0.5rem 0.5rem',
              padding: '1rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(255, 126, 95, 0.05) 100%)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.02)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ fontSize: '1.2rem' }}>📱</div>
              <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.82rem', letterSpacing: '-0.2px' }}>
                Install App
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4', fontWeight: '500' }}>
                Install Helios for faster access and live reminders.
              </div>
              <button
                onClick={handleInstallClick}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #FF7E5F 100%)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(139,92,246,0.25)',
                  transition: 'transform 0.18s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Install Now
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-footer" style={{ padding:'1rem', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'space-between', padding:'0.75rem', borderRadius:'14px', background:'var(--card-bg)', border:'1px solid var(--border)', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 10px rgba(0,0,0,0.02)' }}
               onMouseEnter={e => e.currentTarget.style.background='var(--row-hover)'}
               onMouseLeave={e => e.currentTarget.style.background='var(--card-bg)'}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.8rem' }}>
              <div style={{ position:'relative' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'linear-gradient(135deg, #FF7E5F, #FEB47B)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', fontSize:'1.1rem', boxShadow:'0 4px 12px rgba(255,126,95,0.3)' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ position:'absolute', bottom:'-2px', right:'-2px', width:'12px', height:'12px', background:'#10B981', border:'2px solid var(--card-bg)', borderRadius:'50%' }}></div>
              </div>
              {!collapsed && (
                <div style={{ display:'flex', flexDirection:'column' }}>
                  <span style={{ fontSize:'0.9rem', fontWeight:'700', color:'var(--text-primary)', lineHeight:'1.2' }}>{user?.name}</span>
                  <span style={{ fontSize:'0.75rem', fontWeight:'600', color:'var(--text-muted)' }}>{user?.role === 'admin' ? 'Admin' : 'Developer'}</span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button onClick={handleLogout} style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'6px', transition:'all 0.2s', borderRadius:'8px' }} onMouseEnter={e=>{e.currentTarget.style.color='#EF4444'; e.currentTarget.style.background='rgba(239,68,68,0.1)';}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='transparent';}} title="Logout">
                <LogOut size={16} />
              </button>
            )}
          </div>
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
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'1rem', marginBottom:'1.2rem' }}>
            <button onClick={handleMarkAllAsRead} style={{ background:'none', border:'none', color:'#4F46E5', fontWeight:'700', cursor:'pointer', fontSize:'0.82rem', padding:0 }}>Mark all as read</button>
            <button onClick={handleClearNotifications} style={{ background:'none', border:'none', color:'#EF4444', fontWeight:'700', cursor:'pointer', fontSize:'0.82rem', padding:0 }}>Clear</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign:'center', color:'#94A3B8', padding:'2rem 0', fontSize:'0.9rem' }}>No notifications</div>
            ) : notifications.map(n => (
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
                    style={{ background:'#4F46E5', color:'white', border:'none', padding:'0.7rem', borderRadius:'8px', fontWeight:'700', cursor: addingEvent ? 'not-allowed' : 'pointer', fontSize:'0.875rem', display:'flex', justifyContent:'center', alignItems:'center', gap:'0.5rem', transition:'background 0.2s', opacity: addingEvent ? 0.7 : 1 }}
                    onMouseEnter={e => !addingEvent && (e.currentTarget.style.background='#4338CA')}
                    onMouseLeave={e => !addingEvent && (e.currentTarget.style.background='#4F46E5')}>
                    {addingEvent ? (
                      <>
                        <div className="spinner" style={{ width:14, height:14, borderColor:'rgba(255,255,255,0.3)', borderTopColor:'white', borderWidth:2 }}></div>
                        Scheduling...
                      </>
                    ) : 'Schedule & Send Email'}
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
