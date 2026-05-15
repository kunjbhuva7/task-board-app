import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
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
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div className="spinner spinner-primary"></div></div>;

  const statCards = [
    { label:'To Do', value: stats?.counts.todo || 0, icon: ListTodo, color:'#64748B', bg:'rgba(148,163,184,0.15)' },
    { label:'In Progress', value: stats?.counts.inProgress || 0, icon: Clock, color:'#60A5FA', bg:'rgba(96,165,250,0.15)' },
    { label:'Done', value: stats?.counts.done || 0, icon: CheckCircle, color:'#4ADE80', bg:'rgba(74,222,128,0.15)' },
  ];

  return (
    <div style={{ padding:'2rem' }}>
      {/* Greeting */}
      <div style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontSize:'1.6rem', fontWeight:'800', color:'#1E293B', margin:0 }}>{greeting}, {user.name} 👋</h2>
        <p style={{ color:'#64748B', fontSize:'0.9rem', marginTop:'0.4rem' }}>Here's what's happening with your tasks today.</p>
      </div>

      {/* Stat Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'1.25rem', marginBottom:'2rem'}}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background:'rgba(0,0,0,0.03)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(0,0,0,0.08)', borderRadius:'16px',
            padding:'1.5rem', display:'flex', alignItems:'center', gap:'1.1rem',
            transition:'all 0.2s', cursor:'default',
            boxShadow:'0 4px 20px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.2)'; }}>
            <div style={{background:s.bg, padding:'0.9rem', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <s.icon size={22} color={s.color}/>
            </div>
            <div>
              <div style={{fontSize:'0.78rem', color:'#64748B', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em'}}>{s.label}</div>
              <div style={{fontSize:'1.75rem', fontWeight:'800', color:'#1E293B', lineHeight:1.1, marginTop:'0.15rem'}}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Due Today & Recently Updated */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem'}}>
        <div style={{
          background:'rgba(0,0,0,0.02)', backdropFilter:'blur(20px)',
          border:'1px solid rgba(0,0,0,0.08)', borderRadius:'16px',
          padding:'1.5rem', boxShadow:'0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.2rem' }}>
            <Calendar size={16} color="#EF4444"/>
            <h3 style={{margin:0, color:'#1E293B', fontSize:'1rem', fontWeight:'700'}}>Due Today</h3>
          </div>
          {stats?.dueToday.length === 0 ? (
            <p style={{color:'#64748B', fontSize:'0.875rem'}}>No tasks due today. 🎉</p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
              {stats?.dueToday.map(task => (
                <div key={task.id} style={{padding:'0.75rem 1rem', background:'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.04)', borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontWeight:'600', color:'#1E293B', fontSize:'0.875rem'}}>{task.title}</span>
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          background:'rgba(0,0,0,0.02)', backdropFilter:'blur(20px)',
          border:'1px solid rgba(0,0,0,0.08)', borderRadius:'16px',
          padding:'1.5rem', boxShadow:'0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.2rem' }}>
            <TrendingUp size={16} color="#818CF8"/>
            <h3 style={{margin:0, color:'#1E293B', fontSize:'1rem', fontWeight:'700'}}>Recently Updated</h3>
          </div>
          {stats?.recentlyUpdated.length === 0 ? (
            <p style={{color:'#64748B', fontSize:'0.875rem'}}>No recently updated tasks.</p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
              {stats?.recentlyUpdated.map(task => (
                <div key={task.id} style={{padding:'0.75rem 1rem', background:'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.04)', borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
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
