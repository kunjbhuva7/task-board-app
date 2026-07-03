import React, { useEffect, useState, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, Clock, Send, Activity, TrendingUp, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CARD = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => api.get('/dashboard/stats')
    .then(r => setStats(r.data))
    .catch(console.error)
    .finally(() => setLoading(false));

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReminders();

    const s = io(import.meta.env.VITE_API_URL?.replace('/api','') || (window.location.hostname === 'localhost' ? 'http://localhost:5005' : window.location.origin));
    s.on('tasks_updated', () => {
      fetchStats();
      fetchReminders();
    });
    return () => s.disconnect();
  }, []);

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'50vh'}}>
      <div style={{width:40,height:40,border:'3px solid rgba(0,0,0,0.08)',borderTopColor:'#FF7E5F',borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/>
    </div>
  );

  const chartData = stats?.tasksByStatus?.map(t => ({
    name: t.status === 'in_progress' ? 'In Progress' : t.status.charAt(0).toUpperCase()+t.status.slice(1),
    count: t.count,
  })) || [];

  const BAR_COLORS = { 'Todo':'#94A3B8', 'In Progress':'#FF7E5F', 'Review':'#FEB47B', 'Done':'#10B981' };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const actionIcon = (action = '') => {
    const a = action.toLowerCase();
    if (a.includes('create')) return '➕';
    if (a.includes('complete') || a.includes('done')) return '✅';
    if (a.includes('edit') || a.includes('update') || a.includes('status')) return '✏️';
    if (a.includes('delete')) return '🗑️';
    if (a.includes('login')) return '🔐';
    if (a.includes('permission')) return '🔑';
    return '📌';
  };

  const statCards = [
    { label: 'Total Users',     value: stats?.totalUsers||0,             icon: Users,       accent: '#FF7E5F' },
    { label: 'Active Tasks',    value: stats?.activeTasks||0,            icon: Clock,       accent: '#FF7E5F' },
    { label: 'Done This Week',  value: stats?.tasksCompletedThisWeek||0, icon: CheckCircle, accent: '#FF7E5F' },
    { label: 'Pending Invites', value: stats?.pendingInvites||0,         icon: Send,        accent: '#FF7E5F' },
  ];

  return (
    <div style={{padding:'2rem', display:'flex', flexDirection:'column', gap:'1.75rem'}}>

      {/* Header */}
      <div>
        <h2 style={{margin:0, fontSize:'1.6rem', fontWeight:'800', color:'#1E293B'}}>
          {greeting}, {user?.name || 'Admin'} 👋
        </h2>
        <p style={{margin:'0.3rem 0 0', color:'#64748B', fontSize:'0.875rem'}}>
          Here's what's happening with your workspace today.
        </p>
      </div>

      {/* Stat Cards — all same style */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem'}}>
        {statCards.map(s => (
          <div key={s.label} style={{
            ...CARD, display:'flex', alignItems:'center', gap:'1rem',
            padding:'1.3rem 1.25rem', transition:'all 0.2s', cursor:'default'
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.08)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.04)';}}>
            <div style={{background:'rgba(255,126,95,0.1)', padding:'0.85rem', borderRadius:'12px', color:'#FF7E5F', flexShrink:0, display:'flex'}}>
              <s.icon size={22}/>
            </div>
            <div>
              <div style={{fontSize:'0.71rem', fontWeight:'800', color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.07em'}}>{s.label}</div>
              <div style={{fontSize:'2rem', fontWeight:'800', color:'#1E293B', lineHeight:1.1, marginTop:'0.1rem'}}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Reminders Summary Widgets ── */}
      {(() => {
        const todayISTStr = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        const startOfWeekISTStr = (() => {
          const d = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          return new Date(d.setDate(diff)).toISOString().split('T')[0];
        })();

        const remStats = {
          total: reminders.length,
          dueToday: reminders.filter(r => r.reminder_date === todayISTStr && r.status !== 'done').length,
          overdue: reminders.filter(r => r.status === 'overdue').length,
          completedThisWeek: reminders.filter(r => r.status === 'done' && r.reminder_date >= startOfWeekISTStr).length,
        };

        return (
          <div style={{ ...CARD, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} color="#8B5CF6" />
                <span style={{ fontWeight: '800', color: '#1E293B', fontSize: '0.95rem' }}>Reminders Alertboard</span>
              </div>
              <span onClick={() => navigate('/user/reminders')} style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8B5CF6', cursor: 'pointer' }}>View All Reminders →</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {[
                { l: 'Total Reminders', v: remStats.total, c: '#8B5CF6', bg: 'rgba(139,92,246,0.07)' },
                { l: 'Due Today', v: remStats.dueToday, c: '#FF7E5F', bg: 'rgba(255,126,95,0.07)' },
                { l: 'Overdue', v: remStats.overdue, c: '#EF4444', bg: 'rgba(239,68,68,0.07)' },
                { l: 'Completed This Week', v: remStats.completedThisWeek, c: '#10B981', bg: 'rgba(16,185,129,0.07)' }
              ].map(w => (
                <div key={w.l} style={{ background: w.bg, padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>{w.l}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1E293B', marginTop: '0.15rem' }}>{w.v}</div>
                  </div>
                  <span style={{ fontSize: '1.2rem', color: w.c }}>🔔</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Bottom Row */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem'}}>

        {/* Task Breakdown & Chart */}
        <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem'}}>
            {[{l:'Todo', v:stats?.todoTasks||0, c:'#64748B'},
              {l:'In Progress', v:stats?.inProgressTasks||0, c:'#3B82F6'},
              {l:'Review', v:stats?.reviewTasks||0, c:'#F59E0B'},
              {l:'Done', v:stats?.doneTasks||0, c:'#10B981'}
            ].map(s => (
              <div key={s.l} style={{...CARD, padding:'1rem', textAlign:'center'}}>
                <div style={{fontSize:'1.5rem', fontWeight:'800', color:s.c}}>{s.v}</div>
                <div style={{fontSize:'0.7rem', fontWeight:'700', color:'#94A3B8', textTransform:'uppercase', marginTop:'0.2rem'}}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{...CARD, padding:'1.5rem', flex:1}}>
          <div style={{display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.5rem'}}>
            <TrendingUp size={16} color="#FF7E5F"/>
            <h3 style={{margin:0, fontSize:'1rem', fontWeight:'700', color:'#1E293B'}}>Tasks by Status</h3>
          </div>
          {chartData.length === 0 ? (
            <div style={{height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8', fontSize:'0.875rem'}}>No task data yet</div>
          ) : (
            <div style={{height:220}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/>
                  <XAxis dataKey="name" tick={{fontSize:12, fill:'#64748B'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:12, fill:'#64748B'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip contentStyle={{borderRadius:'10px', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', background:'rgba(255,255,255,0.97)', color:'#1E293B'}} cursor={{fill:'rgba(255,126,95,0.05)'}}/>
                  <Bar dataKey="count" radius={[8,8,0,0]}>
                    {chartData.map((d,i) => <Cell key={i} fill={BAR_COLORS[d.name] || '#FF7E5F'}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        </div>

        {/* Right Column */}
        <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
          
          {/* Productivity Progress Widget */}
          <div style={{...CARD, padding:'1.5rem'}}>
            <div style={{ fontSize: '0.71rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>
              PRODUCTIVITY PROGRESS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                {(() => {
                  const total = (stats?.todoTasks||0) + (stats?.inProgressTasks||0) + (stats?.reviewTasks||0) + (stats?.doneTasks||0);
                  const pct = total > 0 ? Math.round(((stats?.doneTasks||0) / total) * 100) : 0;
                  return (
                    <>
                      <svg width="48" height="48" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4F46E5" strokeWidth="4" strokeDasharray={`${Math.max(1, Math.min(100, pct))} 100`} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#1E293B' }}>
                        {pct}%
                      </div>
                    </>
                  );
                })()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E293B', marginBottom:'2px' }}>Weekly Goals</div>
                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Real-time progress</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{...CARD, padding:'1.5rem', flex:1}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.25rem'}}>
              <Activity size={16} color="#FF7E5F"/>
            <h3 style={{margin:0, fontSize:'1rem', fontWeight:'700', color:'#1E293B'}}>Recent Activity</h3>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:'250px', overflowY:'auto'}}>
            {stats?.recentActivity?.length ? stats.recentActivity.map((act, i) => (
              <div key={i} style={{padding:'0.6rem 0.85rem', background:'rgba(255,255,255,0.8)', border:'1px solid rgba(0,0,0,0.05)', borderRadius:'10px', display:'flex', gap:'0.75rem', alignItems:'flex-start'}}>
                <span style={{fontSize:'1rem', flexShrink:0}}>{actionIcon(act.action)}</span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight:'600', color:'#1E293B', fontSize:'0.8rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                    {act.details || act.action}
                  </div>
                  <div style={{fontSize:'0.72rem', color:'#94A3B8', marginTop:'1px'}}>
                    {act.user_name || 'System'} · {new Date(act.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{color:'#94A3B8', fontSize:'0.875rem', textAlign:'center', padding:'2rem 0'}}>No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Dashboard;
