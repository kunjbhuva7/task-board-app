import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { Clock, CheckCircle, ListTodo, TrendingUp, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/my-stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    const s = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000');
    s.on('tasks_updated', fetchStats);
    
    return () => {
      s.disconnect();
    };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner spinner-primary"></div></div>;



  return (
    <div style={{ padding:'2rem' }}>
      {/* Greeting */}
      <div style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontSize:'1.6rem', fontWeight:'800', color:'#1E293B', margin:0 }}>{greeting}, {user.name} 👋</h2>
        <p style={{ color:'#64748B', fontSize:'0.9rem', marginTop:'0.4rem' }}>Here's what's happening with your tasks today.</p>
      </div>

      {/* Stat Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'1.25rem', marginBottom:'2rem'}}>
        <div style={{display:'flex', alignItems:'center', gap:'1rem', background:'linear-gradient(135deg,rgba(100,116,139,0.08),rgba(148,163,184,0.05))', border:'1px solid rgba(100,116,139,0.18)', borderRadius:'16px', padding:'1.25rem', backdropFilter:'blur(12px)', transition:'all 0.2s', cursor:'default'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
          <div style={{background:'rgba(100,116,139,0.15)', padding:'0.85rem', borderRadius:'12px', color:'#64748B', flexShrink:0}}><ListTodo size={22}/></div>
          <div><div style={{fontSize:'0.72rem', fontWeight:'700', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em'}}>To Do</div><div style={{fontSize:'1.8rem', fontWeight:'800', color:'#475569', lineHeight:1.1}}>{stats?.counts.todo || 0}</div></div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'1rem', background:'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(96,165,250,0.05))', border:'1px solid rgba(59,130,246,0.18)', borderRadius:'16px', padding:'1.25rem', backdropFilter:'blur(12px)', transition:'all 0.2s', cursor:'default'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(59,130,246,0.12)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
          <div style={{background:'rgba(59,130,246,0.15)', padding:'0.85rem', borderRadius:'12px', color:'#3B82F6', flexShrink:0}}><Clock size={22}/></div>
          <div><div style={{fontSize:'0.72rem', fontWeight:'700', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em'}}>In Progress</div><div style={{fontSize:'1.8rem', fontWeight:'800', color:'#2563EB', lineHeight:1.1}}>{stats?.counts.inProgress || 0}</div></div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'1rem', background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(52,211,153,0.05))', border:'1px solid rgba(16,185,129,0.18)', borderRadius:'16px', padding:'1.25rem', backdropFilter:'blur(12px)', transition:'all 0.2s', cursor:'default'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(16,185,129,0.12)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
          <div style={{background:'rgba(16,185,129,0.15)', padding:'0.85rem', borderRadius:'12px', color:'#10B981', flexShrink:0}}><CheckCircle size={22}/></div>
          <div><div style={{fontSize:'0.72rem', fontWeight:'700', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em'}}>Done</div><div style={{fontSize:'1.8rem', fontWeight:'800', color:'#059669', lineHeight:1.1}}>{stats?.counts.done || 0}</div></div>
        </div>
      </div>

      {/* Due Today & Recently Updated */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem'}}>
        <div style={{background:'linear-gradient(135deg,rgba(239,68,68,0.06),rgba(252,165,165,0.04))', border:'1px solid rgba(239,68,68,0.15)', borderRadius:'16px', padding:'1.5rem', backdropFilter:'blur(12px)'}}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.2rem' }}>
            <Calendar size={16} color="#EF4444"/>
            <h3 style={{margin:0, color:'#1E293B', fontSize:'1rem', fontWeight:'700'}}>Due Today</h3>
          </div>
          {stats?.dueToday.length === 0 ? (
            <p style={{color:'#64748B', fontSize:'0.875rem'}}>No tasks due today. 🎉</p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
              {stats?.dueToday.map(task => (
                <div key={task.id} style={{padding:'0.75rem 1rem', background:'rgba(255,255,255,0.5)', border:'1px solid rgba(239,68,68,0.12)', borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontWeight:'600', color:'#1E293B', fontSize:'0.875rem'}}>{task.title}</span>
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{background:'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04))', border:'1px solid rgba(99,102,241,0.15)', borderRadius:'16px', padding:'1.5rem', backdropFilter:'blur(12px)'}}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.2rem' }}>
            <TrendingUp size={16} color="#818CF8"/>
            <h3 style={{margin:0, color:'#1E293B', fontSize:'1rem', fontWeight:'700'}}>Recently Updated</h3>
          </div>
          {stats?.recentlyUpdated.length === 0 ? (
            <p style={{color:'#64748B', fontSize:'0.875rem'}}>No recently updated tasks.</p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
              {stats?.recentlyUpdated.map(task => (
                <div key={task.id} style={{padding:'0.75rem 1rem', background:'rgba(255,255,255,0.5)', border:'1px solid rgba(99,102,241,0.1)', borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontWeight:'600', color:'#1E293B', fontSize:'0.875rem'}}>{task.title}</span>
                  <span style={{fontSize:'0.78rem', color:'#64748B'}}>{new Date(task.updated_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
