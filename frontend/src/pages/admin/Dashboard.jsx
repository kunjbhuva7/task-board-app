import React, { useEffect, useState, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { Users, CheckCircle, Clock, Send, Activity, TrendingUp } from 'lucide-react';
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = () => api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    fetchStats();

    const s = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5005');
    s.on('tasks_updated', fetchStats);
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

      {/* Bottom Row */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem'}}>

        {/* Bar Chart */}
        <div style={{...CARD, padding:'1.5rem'}}>
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

        {/* Recent Activity */}
        <div style={{...CARD, padding:'1.5rem'}}>
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
                    {act.user_name || 'System'} · {new Date(act.created_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
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
  );
};

export default Dashboard;
