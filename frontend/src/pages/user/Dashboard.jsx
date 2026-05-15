import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { Clock, CheckCircle, ListTodo, TrendingUp, Calendar, Activity, AlertTriangle, BarChart2 } from 'lucide-react';

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

  useEffect(() => {
    fetchStats();
    const s = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5005');
    s.on('tasks_updated', fetchStats);
    return () => s.disconnect();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'4rem'}}>
      <div style={{width:36,height:36,border:'3px solid rgba(0,0,0,0.08)',borderTopColor:'#FF7E5F',borderRadius:'50%',animation:'spin 0.9s linear infinite'}}/>
    </div>
  );

  const { counts = {}, progressPct = 0, dueToday = [], recentlyUpdated = [], recentActivity = [] } = stats || {};
  const total = counts.total || 0;

  const statCards = [
    { label: 'To Do',       value: counts.todo || 0,       icon: ListTodo    },
    { label: 'In Progress', value: counts.inProgress || 0, icon: Clock       },
    { label: 'Done',        value: counts.done || 0,       icon: CheckCircle },
    { label: 'Total',       value: total,                  icon: BarChart2   },
  ];

  const actionIcon = (action = '') => {
    const a = action.toLowerCase();
    if (a.includes('create')) return '➕';
    if (a.includes('complete') || a.includes('done')) return '✅';
    if (a.includes('edit') || a.includes('update') || a.includes('status')) return '✏️';
    if (a.includes('delete')) return '🗑️';
    if (a.includes('login')) return '🔐';
    return '📌';
  };

  return (
    <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* Greeting */}
      <div>
        <h2 style={{ fontSize:'1.6rem', fontWeight:'800', color:'#1E293B', margin:0 }}>
          {greeting}, {user.name} 👋
        </h2>
        <p style={{ color:'#64748B', fontSize:'0.9rem', marginTop:'0.4rem', marginBottom:0 }}>
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stat Cards — all same style */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:'1rem'}}>
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} style={{
            ...CARD, display:'flex', alignItems:'center', gap:'1rem',
            padding:'1.25rem', transition:'all 0.2s', cursor:'default'
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.08)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.04)';}}>
            <div style={{background:'rgba(255,126,95,0.1)', padding:'0.85rem', borderRadius:'12px', color:'#FF7E5F', flexShrink:0}}>
              <Icon size={22}/>
            </div>
            <div>
              <div style={{fontSize:'0.72rem', fontWeight:'700', color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em'}}>{label}</div>
              <div style={{fontSize:'1.9rem', fontWeight:'800', color:'#1E293B', lineHeight:1.1}}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div style={{...CARD, padding:'1.5rem'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem'}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <TrendingUp size={16} color="#FF7E5F"/>
              <span style={{fontWeight:'700', color:'#1E293B', fontSize:'0.95rem'}}>Overall Progress</span>
            </div>
            <span style={{fontWeight:'800', color:'#FF7E5F', fontSize:'1.1rem'}}>{progressPct}%</span>
          </div>
          <div style={{background:'rgba(0,0,0,0.06)', borderRadius:'999px', height:'10px', overflow:'hidden'}}>
            <div style={{
              height:'100%', borderRadius:'999px',
              background:'linear-gradient(90deg,#FF7E5F,#FEB47B)',
              width:`${progressPct}%`, transition:'width 0.6s ease'
            }}/>
          </div>
          <div style={{display:'flex', gap:'1.5rem', marginTop:'0.75rem'}}>
            {[
              { label:'Done',        val: counts.done||0 },
              { label:'In Progress', val: counts.inProgress||0 },
              { label:'To Do',       val: counts.todo||0 },
            ].map(({ label, val }) => (
              <div key={label} style={{display:'flex', alignItems:'center', gap:'0.4rem'}}>
                <div style={{width:8, height:8, borderRadius:'50%', background:'#FF7E5F'}}/>
                <span style={{fontSize:'0.75rem', color:'#64748B', fontWeight:'600'}}>{label}: <strong style={{color:'#1E293B'}}>{val}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem'}}>

        {/* Due Today */}
        <div style={{...CARD, padding:'1.5rem'}}>
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem'}}>
            <AlertTriangle size={16} color="#FF7E5F"/>
            <h3 style={{margin:0, color:'#1E293B', fontSize:'1rem', fontWeight:'700'}}>Due Today</h3>
            {dueToday.length > 0 && (
              <span style={{background:'#FF7E5F', color:'white', borderRadius:'99px', padding:'0.1rem 0.5rem', fontSize:'0.7rem', fontWeight:'700'}}>
                {dueToday.length}
              </span>
            )}
          </div>
          {dueToday.length === 0 ? (
            <p style={{color:'#94A3B8', fontSize:'0.875rem', margin:0}}>No tasks due today. 🎉</p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
              {dueToday.map(task => (
                <div key={task.id} style={{padding:'0.6rem 0.85rem', background:'rgba(255,255,255,0.8)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontWeight:'600', color:'#1E293B', fontSize:'0.85rem'}}>{task.title}</span>
                  <span style={{fontSize:'0.72rem', background:'rgba(255,126,95,0.1)', color:'#FF7E5F', padding:'0.15rem 0.5rem', borderRadius:'6px', fontWeight:'700'}}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{...CARD, padding:'1.5rem'}}>
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem'}}>
            <Activity size={16} color="#FF7E5F"/>
            <h3 style={{margin:0, color:'#1E293B', fontSize:'1rem', fontWeight:'700'}}>Recent Activity</h3>
          </div>
          {recentActivity.length === 0 ? (
            <p style={{color:'#94A3B8', fontSize:'0.875rem', margin:0}}>No recent activity yet.</p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:'220px', overflowY:'auto'}}>
              {recentActivity.map((act, i) => (
                <div key={i} style={{display:'flex', alignItems:'flex-start', gap:'0.6rem', padding:'0.5rem 0.75rem', background:'rgba(255,255,255,0.8)', border:'1px solid rgba(0,0,0,0.05)', borderRadius:'10px'}}>
                  <span style={{fontSize:'1rem', flexShrink:0}}>{actionIcon(act.action)}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:'0.8rem', color:'#1E293B', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                      {act.details || act.action}
                    </div>
                    <div style={{fontSize:'0.72rem', color:'#94A3B8', marginTop:'1px'}}>
                      {act.user_name || 'System'} · {new Date(act.created_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recently Updated Tasks */}
      {recentlyUpdated.length > 0 && (
        <div style={{...CARD, padding:'1.5rem'}}>
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem'}}>
            <Calendar size={16} color="#FF7E5F"/>
            <h3 style={{margin:0, color:'#1E293B', fontSize:'1rem', fontWeight:'700'}}>Recently Updated</h3>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'0.4rem'}}>
            {recentlyUpdated.slice(0,6).map(task => (
              <div key={task.id} style={{padding:'0.6rem 0.85rem', background:'rgba(255,255,255,0.8)', border:'1px solid rgba(0,0,0,0.05)', borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontWeight:'600', color:'#1E293B', fontSize:'0.85rem'}}>{task.title}</span>
                <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_',' ')}</span>
                  <span style={{fontSize:'0.75rem', color:'#94A3B8'}}>{new Date(task.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div style={{textAlign:'center', padding:'3rem', ...CARD}}>
          <div style={{fontSize:'3rem', marginBottom:'0.75rem'}}>📋</div>
          <h3 style={{color:'#1E293B', margin:'0 0 0.5rem'}}>No tasks yet</h3>
          <p style={{color:'#64748B', margin:0, fontSize:'0.9rem'}}>
            Go to <strong>My Tasks</strong> in the sidebar to create your first task!
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
