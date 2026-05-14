import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get('/activity');
        setActivities(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Activity Log</h2>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>Details</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign:'center'}}><div className="spinner spinner-primary" style={{margin:'0 auto'}}></div></td></tr>
            ) : activities.map(act => (
              <tr key={act.id}>
                <td>{act.user_name || 'System'}</td>
                <td><span className="badge badge-todo">{act.action}</span></td>
                <td style={{textTransform:'capitalize'}}>{act.target_type}</td>
                <td>{act.details}</td>
                <td className="text-muted" style={{fontSize:'0.875rem'}}>{new Date(act.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && activities.length === 0 && (
              <tr><td colSpan="5" style={{textAlign:'center'}} className="text-muted">No activity found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLog;
