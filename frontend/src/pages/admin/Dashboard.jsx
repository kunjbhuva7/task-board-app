import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Users, CheckCircle, Clock, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner spinner-primary"></div></div>;
  }

  const statusColors = {
    todo: '#94A3B8',
    in_progress: '#2563EB',
    review: '#D97706',
    done: '#16A34A'
  };

  const chartData = stats?.tasksByStatus.map(t => ({
    name: t.status.replace('_', ' ').toUpperCase(),
    count: t.count,
    fill: statusColors[t.status] || '#2563EB'
  }));

  return (
    <div style={{padding: '2rem'}}>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.5rem', marginBottom:'2rem'}}>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'rgba(99,102,241,0.15)', padding:'1rem', borderRadius:'10px', color:'#6366F1'}}><Users size={22}/></div>
          <div><div style={{fontSize:'0.75rem', fontWeight:'700', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em'}}>Total Users</div><div style={{fontSize:'1.6rem', fontWeight:'800', color:'#1E293B'}}>{stats?.totalUsers || 0}</div></div>
        </div>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'rgba(59,130,246,0.15)', padding:'1rem', borderRadius:'10px', color:'#3B82F6'}}><Clock size={22}/></div>
          <div><div style={{fontSize:'0.75rem', fontWeight:'700', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em'}}>Active Tasks</div><div style={{fontSize:'1.6rem', fontWeight:'800', color:'#1E293B'}}>{stats?.activeTasks || 0}</div></div>
        </div>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'rgba(16,185,129,0.15)', padding:'1rem', borderRadius:'10px', color:'#10B981'}}><CheckCircle size={22}/></div>
          <div><div style={{fontSize:'0.75rem', fontWeight:'700', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em'}}>Completed This Week</div><div style={{fontSize:'1.6rem', fontWeight:'800', color:'#1E293B'}}>{stats?.tasksCompletedThisWeek || 0}</div></div>
        </div>
        <div className="card" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{background:'rgba(245,158,11,0.15)', padding:'1rem', borderRadius:'10px', color:'#F59E0B'}}><Send size={22}/></div>
          <div><div style={{fontSize:'0.75rem', fontWeight:'700', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em'}}>Pending Invites</div><div style={{fontSize:'1.6rem', fontWeight:'800', color:'#1E293B'}}>{stats?.pendingInvites || 0}</div></div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1.5rem'}}>
        <div className="card">
          <h3 style={{marginBottom:'1.25rem', color:'#1E293B', fontSize:'1rem'}}>Tasks by Status</h3>
          <div style={{height:'260px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)"/>
                <XAxis dataKey="name" style={{fontSize:'0.72rem'}}/>
                <YAxis style={{fontSize:'0.72rem'}}/>
                <Tooltip contentStyle={{borderRadius:'10px', border:'1px solid #E2E8F0', boxShadow:'0 8px 24px rgba(0,0,0,0.08)'}}/>
                <Bar dataKey="count" radius={[6,6,0,0]} fill="#6366F1"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 style={{marginBottom:'1.25rem', color:'#1E293B', fontSize:'1rem'}}>Recent Activity</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'0.85rem'}}>
            {stats?.recentActivity?.map(act => (
              <div key={act.id} style={{borderBottom:'1px solid rgba(241,245,249,0.8)', paddingBottom:'0.75rem'}}>
                <div style={{fontWeight:'600', color:'#1E293B', fontSize:'0.82rem'}}>{act.user_name || 'System'} <span style={{fontWeight:'400', color:'#64748B'}}>{act.action}</span></div>
                <div style={{fontSize:'0.75rem', color:'#94A3B8', marginTop:'2px'}}>{new Date(act.created_at).toLocaleString()}</div>
              </div>
            ))}
            {!stats?.recentActivity?.length && <div style={{color:'#94A3B8', fontSize:'0.85rem'}}>No recent activity</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
