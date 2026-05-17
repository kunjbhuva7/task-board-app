const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');

// Get all projects
router.get('/', auth, checkPermission('can_view_projects'), (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, u.name as created_by_name 
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `).all();
    
    // Get task counts for each project
    const projectWithCounts = projects.map(p => {
      const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?').get(p.id).count;
      return { ...p, task_count: taskCount };
    });
    
    res.json(projectWithCounts);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Create project
router.post('/', auth, checkPermission('can_manage_projects'), (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    const stmt = db.prepare('INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)');
    const info = stmt.run(name, description, req.user.id);
    
    // Log activity
    const logStmt = db.prepare('INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)');
    logStmt.run(req.user.id, 'Project Created', 'project', info.lastInsertRowid, `Created project: ${name}`);
    
    res.status(201).json({ id: info.lastInsertRowid, message: 'Project created successfully' });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

// Update project
router.put('/:id', auth, checkPermission('can_manage_projects'), (req, res) => {
  try {
    const { name, description } = req.body;
    const projectId = req.params.id;
    
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    const stmt = db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?');
    stmt.run(name, description, projectId);
    
    // Log activity
    const logStmt = db.prepare('INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)');
    logStmt.run(req.user.id, 'Project Updated', 'project', projectId, `Updated project: ${name}`);
    
    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

// Delete project
router.delete('/:id', auth, checkPermission('can_manage_projects'), (req, res) => {
  try {
    const projectId = req.params.id;
    
    // First clear project_id from tasks belonging to this project
    db.prepare('UPDATE tasks SET project_id = NULL WHERE project_id = ?').run(projectId);
    
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    const info = stmt.run(projectId);
    
    if (info.changes === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Log activity
    const logStmt = db.prepare('INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)');
    logStmt.run(req.user.id, 'Project Deleted', 'project', projectId, `Deleted project ID: ${projectId}`);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

module.exports = router;
