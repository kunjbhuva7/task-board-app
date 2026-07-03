import React, { useState, useEffect, useContext } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Projects = () => {
  const { user, permissions } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  
  const canManage = user?.role === 'admin' || permissions?.is_super_admin || permissions?.can_manage_projects;

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/projects/${editingId}`, formData);
        toast.success('Project updated');
      } else {
        await axios.post('/projects', formData);
        toast.success('Project created');
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving project');
    }
  };

  const handleDelete = async (project) => {
    const input = window.prompt(`To delete this project, type the project name exactly:\n"${project.name}"\n\nNote: Tasks belonging to it will not be deleted but will lose their project association.`);
    if (input !== project.name) {
      if (input !== null) toast.error('Project name did not match, deletion cancelled.');
      return;
    }
    
    try {
      await axios.delete(`/projects/${project.id}`);
      toast.success('Project deleted');
      fetchProjects();
    } catch (err) {
      toast.error('Error deleting project');
    }
  };
  const openModal = (proj = null) => {
    if (proj) {
      setFormData({ name: proj.name, description: proj.description || '' });
      setEditingId(proj.id);
    } else {
      setFormData({ name: '', description: '' });
      setEditingId(null);
    }
    setShowModal(true);
  };

  // Styles
  const hdrStyle = {
    background: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 24px 64px rgba(239, 130, 80, 0.08)',
    padding: '2rem 2.5rem',
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: '1.5rem',
    zIndex: 10
  };

  const tableContainerStyle = {
    background: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 24px 64px rgba(239, 130, 80, 0.08)',
    overflow: 'hidden'
  };

  const thStyle = {
    textAlign: 'left',
    padding: '1rem 1.5rem',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748B',
    borderBottom: '1px solid rgba(0,0,0,0.05)'
  };

  const tdStyle = {
    padding: '1rem 1.5rem',
    color: '#1E293B',
    fontSize: '0.95rem',
    borderBottom: '1px solid rgba(0,0,0,0.05)'
  };

  const btnPrimary = {
    background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)',
    color: '#fff',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem'
  };

  const btnEdit = {
    background: '#f1f5f9',
    color: '#334155',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginRight: '0.5rem'
  };

  const btnDelete = {
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer'
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={hdrStyle}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1E293B', margin: '0 0 0.5rem', letterSpacing: '-0.5px' }}>Projects</h1>
          <p style={{ color: '#64748B', margin: 0 }}>Manage your team projects and folders</p>
        </div>
        {canManage && (
          <button style={btnPrimary} onClick={() => openModal()}>+ New Project</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
          No projects found. {canManage && 'Create one to get started!'}
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Project Name</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Tasks</th>
                <th style={thStyle}>Created By</th>
                {canManage && <th style={thStyle}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td style={{ ...tdStyle, fontWeight: '700' }}>{p.name}</td>
                  <td style={tdStyle}>{p.description || '-'}</td>
                  <td style={tdStyle}>
                    <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                      {p.task_count} tasks
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#64748B' }}>{p.created_by_name}</td>
                  {canManage && (
                    <td style={tdStyle}>
                      <button style={btnEdit} onClick={() => openModal(p)}>Edit</button>
                      <button style={btnDelete} onClick={() => handleDelete(p)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#1E293B', fontSize: '1.5rem' }}>{editingId ? 'Edit Project' : 'New Project'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Project Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Description (Optional)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.95rem', minHeight: '100px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={btnPrimary}>Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
