import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Users, CheckCircle, Clock, Send, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CARD = { background:'rgba(255,255,255,0.6)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.8)', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', padding:'1.5rem' };

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'50vh'}}>
      <div style={{width:40,height:40,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366F1',borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/>
    </div>
  );

  const chartData = stats?.tasksByStatus?.map(t => ({
    name: t.status === 'in_progress' ? 'In Progress' : t.status.charAt(0).toUpperCase()+t.status.slice(1),
    count: t.count,
  })) || [];

  const BAR_COLORS = { 'Todo':'#94A3B8', 'In Progress':'#3B82F6', 'Review':'#F59E0B', 'Done':'#10B981' };

  return (
    <div style={{padding:'2rem', display:'flex', flexDirection:'column', gap:'1.75rem'}}>

      {/* Header */}
      <div>
        <h2 style={{margin:0, fontSize:'1.6rem', fontWeight:'800', color:'#1E293B'}}>Admin Dashboard</h2>
        <p style={{margin:'0.3rem 0 0', color:'#64748B', fontSize:'0.875rem'}}>Overview of your workspace activity and metrics</p>
      </div>

      {/* Stat Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.1rem'}}>
        {[
          { label:'Total Users',       value: stats?.totalUsers||0,             color:'#6366F1', bgGrad:'rgba(99,102,241,0.08),rgba(139,92,246,0.05)',  border:'rgba(99,102,241,0.18)',  icon: Users       },
          { label:'Active Tasks',      value: stats?.activeTasks||0,            color:'#3B82F6', bgGrad:'rgba(59,130,246,0.08),rgba(96,165,250,0.05)',   border:'rgba(59,130,246,0.18)',  icon: Clock       },
          { label:'Done This Week',    value: stats?.tasksCompletedThisWeek||0, color:'#10B981', bgGrad:'rgba(16,185,129,0.08),rgba(52,211,153,0.05)',   border:'rgba(16,185,129,0.18)',  icon: CheckCircle },
          { label:'Pending Invites',   value: stats?.pendingInvites||0,         color:'#F59E0B', bgGrad:'rgba(245,158,11,0.08),rgba(251,191,36,0.05)',   border:'rgba(245,158,11,0.18)',  icon: Send        },
        ].map(s => (
          <div key={s.label} style={{display:'flex', alignItems:'center', gap:'1rem', background:`linear-gradient(135deg,${s.bgGrad})`, border:`1px solid ${s.border}`, borderRadius:'16px', padding:'1.3rem 1.25rem', backdropFilter:'blur(12px)', transition:'all 0.2s', cursor:'default'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px ${s.border}`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
            <div style={{background:`rgba(${s.color === '#6366F1' ? '99,102,241' : s.color === '#3B82F6' ? '59,130,246' : s.color === '#10B981' ? '16,185,129' : '245,158,11'},0.15)`, padding:'0.85rem', borderRadius:'12px', color:s.color, flexShrink:0, display:'flex'}}>
              <s.icon size={22}/>
            </div>
            <div>
              <div style={{fontSize:'0.71rem', fontWeight:'800', color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.07em'}}>{s.label}</div>
              <div style={{fontSize:'2rem', fontWeight:'800', color:s.color, lineHeight:1.1, marginTop:'0.1rem'}}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{display:'grid', gridTemplateColumns:'1.8fr 1fr', gap:'1.25rem'}}>

        {/* Bar Chart */}
        <div style={CARD}>
          <div style={{display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.5rem'}}>
            <div style={{background:'rgba(99,102,241,0.12)', padding:'0.5rem', borderRadius:'8px', color:'#6366F1', display:'flex'}}><TrendingUp size={17}/></div>
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
                  <Tooltip contentStyle={{borderRadius:'10px', border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', background:'rgba(255,255,255,0.97)', color:'#1E293B'}} cursor={{fill:'rgba(99,102,241,0.05)'}}/>
                  <Bar dataKey="count" radius={[8,8,0,0]}>
                    {chartData.map((d,i) => <Cell key={i} fill={BAR_COLORS[d.name] || '#6366F1'}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={CARD}>
          <div style={{display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.25rem'}}>
            <div style={{background:'rgba(16,185,129,0.12)', padding:'0.5rem', borderRadius:'8px', color:'#10B981', display:'flex'}}><Activity size={17}/></div>
            <h3 style={{margin:0, fontSize:'1rem', fontWeight:'700', color:'#1E293B'}}>Recent Activity</h3>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'0'}}>
            {stats?.recentActivity?.length ? stats.recentActivity.map((act, i) => (
              <div key={act.id} style={{padding:'0.75rem 0', borderBottom: i < stats.recentActivity.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none', display:'flex', gap:'0.75rem', alignItems:'flex-start'}}>
                <div style={{width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.65rem', fontWeight:'800', flexShrink:0}}>
                  {(act.user_name || 'S').charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight:'600', color:'#1E293B', fontSize:'0.8rem', marginBottom:'1px'}}>
                    {act.user_name || 'System'} <span style={{fontWeight:'400', color:'#64748B'}}>{act.action}</span>
                  </div>
                  <div style={{fontSize:'0.72rem', color:'#94A3B8'}}>{new Date(act.created_at).toLocaleString()}</div>
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
