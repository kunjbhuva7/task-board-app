import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Search, Bell, Calendar, Settings, FolderKanban, Shield, Users, Activity, LogOut, X, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const PanelOverlay = ({ title, icon: Icon, children, onClose }) => (
  <div
    style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    {/* Backdrop */}
    <div style={{ position:'absolute', inset:0, background:'rgba(15, 23, 42, 0.4)', backdropFilter:'blur(8px)' }} onClick={onClose} />
    {/* Panel */}
    <div style={{
      position:'relative', width:'90vw', maxWidth:'1000px', height:'90vh',
      background:'rgba(255,255,255,0.98)', border:'1px solid rgba(226, 232, 240, 0.8)',
      boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius:'24px',
      display:'flex', flexDirection:'column', animation:'fadeIn 0.2s ease',
      zIndex:201, overflow:'hidden'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.5rem 2rem', borderBottom:'1px solid rgba(226, 232, 240, 0.8)', background:'rgba(248, 250, 252, 0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ padding:'0.5rem', background:'rgba(79, 70, 229, 0.1)', borderRadius:'10px', display:'flex' }}>
            <Icon size={22} color="#4F46E5" />
          </div>
          <h3 style={{ margin:0, fontWeight:'800', color:'#0F172A', fontSize:'1.25rem', letterSpacing:'-0.02em' }}>{title}</h3>
        </div>
        <button onClick={onClose} style={{ background:'rgba(241, 245, 249, 1)', border:'1px solid rgba(226, 232, 240, 1)', borderRadius:'50%', cursor:'pointer', color:'#64748B', display:'flex', padding:'8px', transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.color='#0F172A'; e.currentTarget.style.background='#E2E8F0';}} onMouseLeave={e=>{e.currentTarget.style.color='#64748B'; e.currentTarget.style.background='rgba(241, 245, 249, 1)';}}>
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
  const { user, logout } = useContext(AuthContext);
  const { canViewAllTasks } = usePermissions();
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState(null); // 'notification' | 'calendar' | 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [taskDueDates, setTaskDueDates] = useState([]);

  useEffect(() => {
    // Fetch real notifications from activity log
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

    // Fetch tasks for calendar due dates
    api.get('/tasks').then(res => {
      const dates = (res.data || []).filter(t => t.due_date).map(t => ({
        date: t.due_date?.slice(0,10),
        title: t.title,
        status: t.status,
      }));
      setTaskDueDates(dates);
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Today's date info for calendar
  const today = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header" style={{ padding:'1.5rem', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', background:'rgba(0,0,0,0.03)', padding:'0.85rem', borderRadius:'12px', width:'100%', border:'1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ flex:1, overflow:'hidden', minWidth:0 }}>
              <div style={{ fontSize:'0.9rem', fontWeight:'700', color:'#1E293B', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>{user.name}</div>
              <div style={{ fontSize:'0.75rem', color:'#64748B', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden', marginTop:'2px' }}>{user.email}</div>
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
              <span style={{ marginLeft:'auto', background:'#EF4444', color:'#1E293B', fontSize:'0.65rem', fontWeight:'700', padding:'0.1rem 0.4rem', borderRadius:'10px', minWidth:'18px', textAlign:'center' }}>
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
          {user.role === 'admin' ? (
            <>
              <NavLink to="/admin/dashboard" className="sidebar-item"><FolderKanban size={17} /> Dashboard</NavLink>
              <NavLink to="/admin/tasks" className="sidebar-item"><FolderKanban size={17} /> All Tasks</NavLink>
              <NavLink to="/admin/users" className="sidebar-item"><Users size={17} /> Manage Users</NavLink>
              <NavLink to="/admin/permissions" className="sidebar-item"><Shield size={17} /> Permissions</NavLink>
              <NavLink to="/admin/activity" className="sidebar-item"><Activity size={17} /> Activity Log</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/user/dashboard" className="sidebar-item"><FolderKanban size={17} /> My Dashboard</NavLink>
              <NavLink to="/user/tasks" className="sidebar-item"><FolderKanban size={17} /> Craftboard Project</NavLink>
              {canViewAllTasks && (
                <NavLink to="/user/all-tasks" className="sidebar-item"><FolderKanban size={17} /> All Tasks</NavLink>
              )}
            </>
          )}
        </div>

        <div className="sidebar-footer" style={{ padding:'1.5rem', borderTop:'1px solid rgba(0,0,0,0.05)' }}>
          <button
            onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'transparent', border:'none', color:'#6B7280', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', padding:'0.5rem', borderRadius:'8px', transition:'all 0.2s', width:'100%' }}
            onMouseEnter={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6B7280'; }}>
            <LogOut size={17} /> Logout
          </button>
        </div>
      </div>

      {/* ── Search Panel ── */}
      {openPanel === 'search' && (
        <PanelOverlay title="Search" icon={Search} onClose={() => setOpenPanel(null)}>
          <input
            autoFocus
            type="text"
            placeholder="Search tasks, users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'10px', background:'rgba(255,255,255,0.7)', border:'1px solid rgba(0,0,0,0.1)', color:'#1E293B', outline:'none', fontSize:'0.95rem', marginBottom:'1rem' }}
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
                padding:'1rem', borderRadius:'12px', border:'1px solid rgba(0,0,0,0.05)',
                background: n.read ? 'rgba(0,0,0,0.02)' : 'rgba(99,102,241,0.1)',
                display:'flex', gap:'0.85rem', alignItems:'flex-start'
              }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: n.read ? 'rgba(0,0,0,0.05)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', justifyContent:'center', alignItems:'center', flexShrink:0, boxShadow: n.read ? 'none' : '0 2px 10px rgba(99,102,241,0.3)' }}>
                  {n.read ? <CheckCircle size={16} color="#64748B" /> : <Bell size={16} color="white" />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:'0.88rem', color: n.read ? '#64748B' : '#1E293B', fontWeight: n.read ? '400' : '600', lineHeight:'1.4' }}>{n.message}</p>
                  <span style={{ fontSize:'0.75rem', color:'#64748B', display:'flex', alignItems:'center', gap:'0.3rem', marginTop:'0.45rem' }}>
                    <Clock size={12} /> {n.time}
                  </span>
                </div>
                {!n.read && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#818CF8', flexShrink:0, marginTop:'6px', boxShadow:'0 0 8px #818CF8' }}></div>}
              </div>
            ))}
          </div>
        </PanelOverlay>
      )}

      {/* ── Calendar Panel ── */}
      {openPanel === 'calendar' && (
        <PanelOverlay title="Calendar" icon={Calendar} onClose={() => setOpenPanel(null)}>
          {/* Month Header */}
          <div style={{ textAlign:'center', marginBottom:'1.5rem', marginTop:'0.5rem' }}>
            <h4 style={{ margin:0, color:'#1E293B', fontWeight:'700', fontSize:'1.1rem' }}>{monthNames[today.getMonth()]} {today.getFullYear()}</h4>
          </div>
          {/* Days of week */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'4px', marginBottom:'8px' }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:'0.75rem', fontWeight:'700', color:'#64748B', padding:'4px' }}>{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'4px' }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isToday = day === today.getDate();
              const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const hasTasks = taskDueDates.some(t => t.date === dateStr);
              return (
                <div key={day} style={{
                  textAlign:'center', padding:'10px 4px', borderRadius:'8px', fontSize:'0.85rem',
                  background: isToday ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'transparent',
                  color: isToday ? 'white' : '#475569',
                  fontWeight: isToday ? '700' : '500',
                  boxShadow: isToday ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                  cursor:'pointer', transition:'all 0.15s', position:'relative',
                }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background='rgba(99,102,241,0.08)'; }}
                onMouseLeave={e => { if (!isToday) e.currentTarget.style.background='transparent'; }}>
                  {day}
                  {hasTasks && <div style={{ position:'absolute', bottom:'3px', left:'50%', transform:'translateX(-50%)', width:'5px', height:'5px', borderRadius:'50%', background: isToday ? 'white' : '#6366F1' }} />}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:'2rem', padding:'1.5rem', background:'rgba(0,0,0,0.03)', borderRadius:'12px', border:'1px solid rgba(0,0,0,0.05)' }}>
            <p style={{ margin:0, color:'#64748B', fontSize:'0.9rem', textAlign:'center', lineHeight:'1.5' }}>
              <Calendar size={24} color="#64748B" style={{marginBottom:'0.5rem'}} /><br/>
              Full calendar integration coming soon!<br/>
              <span style={{ fontSize:'0.8rem', color:'#64748B' }}>Task deadlines will appear here.</span>
            </p>
          </div>
        </PanelOverlay>
      )}
    </>
  );
};

export default Sidebar;
