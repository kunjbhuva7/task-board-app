import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Search, Bell, Calendar, Settings, FolderKanban, Shield, Users, Activity, LogOut, X, ChevronRight, Clock, CheckCircle } from 'lucide-react';

const PanelOverlay = ({ title, icon: Icon, children, onClose }) => (
  <div
    style={{ position:'fixed', inset:0, zIndex:200, display:'flex' }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    {/* Backdrop */}
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.2)', backdropFilter:'blur(2px)' }} onClick={onClose} />
    {/* Panel */}
    <div style={{
      position:'absolute', left:'240px', top:0, height:'100%', width:'420px',
      background:'#0F172A', borderRight:'1px solid rgba(255,255,255,0.08)',
      boxShadow:'4px 0 24px rgba(0,0,0,0.5)',
      display:'flex', flexDirection:'column', animation:'slideInLeft 0.2s ease'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.5rem', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
          <Icon size={20} color="#818CF8" />
          <h3 style={{ margin:0, fontWeight:'700', color:'#F8FAFC', fontSize:'1rem' }}>{title}</h3>
        </div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex', padding:'4px' }}
          onMouseEnter={e=>e.currentTarget.style.color='#F8FAFC'} onMouseLeave={e=>e.currentTarget.style.color='#94A3B8'}>
          <X size={18} />
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'1rem' }}>
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

  const handleLogout = () => { logout(); navigate('/login'); };

  // Sample notifications (would be real data from API in future)
  const notifications = [
    { id:1, type:'task', message:'New task "Design Homepage" was assigned to you', time:'2 min ago', read:false },
    { id:2, type:'task', message:'Task "API Integration" moved to Done', time:'1 hour ago', read:false },
    { id:3, type:'system', message:'Welcome to Craftboard! Your account is ready.', time:'2 days ago', read:true },
  ];

  // Today's date info for calendar
  const today = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header" style={{ padding:'1.5rem', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', background:'rgba(255,255,255,0.05)', padding:'0.85rem', borderRadius:'12px', width:'100%', border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ flex:1, overflow:'hidden', minWidth:0 }}>
              <div style={{ fontSize:'0.9rem', fontWeight:'700', color:'#F8FAFC', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>{user.name}</div>
              <div style={{ fontSize:'0.75rem', color:'#94A3B8', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden', marginTop:'2px' }}>{user.email}</div>
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

        <div className="sidebar-footer" style={{ padding:'1.5rem', borderTop:'1px solid #F1F5F9' }}>
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
            style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'10px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.1)', color:'#F8FAFC', outline:'none', fontSize:'0.95rem', marginBottom:'1rem' }}
          />
          <p style={{ color:'#94A3B8', fontSize:'0.875rem', textAlign:'center', marginTop:'2rem' }}>
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
                padding:'1rem', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)',
                background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(129,140,248,0.1)',
                display:'flex', gap:'0.85rem', alignItems:'flex-start'
              }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: n.read ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', justifyContent:'center', alignItems:'center', flexShrink:0, boxShadow: n.read ? 'none' : '0 2px 10px rgba(99,102,241,0.3)' }}>
                  {n.read ? <CheckCircle size={16} color="#64748B" /> : <Bell size={16} color="white" />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:'0.88rem', color: n.read ? '#94A3B8' : '#F8FAFC', fontWeight: n.read ? '400' : '600', lineHeight:'1.4' }}>{n.message}</p>
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
            <h4 style={{ margin:0, color:'#F8FAFC', fontWeight:'700', fontSize:'1.1rem' }}>{monthNames[today.getMonth()]} {today.getFullYear()}</h4>
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
              return (
                <div key={day} style={{
                  textAlign:'center', padding:'10px 4px', borderRadius:'8px', fontSize:'0.85rem',
                  background: isToday ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'transparent',
                  color: isToday ? 'white' : '#CBD5E1',
                  fontWeight: isToday ? '700' : '500',
                  boxShadow: isToday ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                  cursor:'pointer', transition:'all 0.15s',
                }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isToday) e.currentTarget.style.background='transparent'; }}>
                  {day}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:'2rem', padding:'1.5rem', background:'rgba(255,255,255,0.03)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ margin:0, color:'#94A3B8', fontSize:'0.9rem', textAlign:'center', lineHeight:'1.5' }}>
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
