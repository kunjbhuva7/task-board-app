const express = require('express');
const router = express.Router();
const { db } = require('../database');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/permissions');

// Get all projects
router.get('/', auth, checkPermission('can_view_projects'), async (req, res) => {
  try {
    const projects = await db.all(`
      SELECT p.*, u.name as created_by_name 
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);

    // Get task counts for each project
    const projectWithCounts = [];
    for (const p of projects) {
      const countRow = await db.get('SELECT COUNT(*) as count FROM tasks WHERE project_id = $1', [p.id]);
      projectWithCounts.push({ ...p, task_count: countRow.count });
    }

    res.json(projectWithCounts);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Create project
router.post('/', auth, checkPermission('can_manage_projects'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const result = await db.run(
      'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );
    const projectId = result.rows[0].id;

    // Log activity
    await db.run(
      'INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'Project Created', 'project', projectId, `Created project: ${name}`]
    );

    // Inline notification for admins
    const details = `Created project: ${name}`;
    await db.run(
      "INSERT INTO notifications (user_id, message) SELECT id, $1 FROM users WHERE role = 'admin'",
      [details]
    );

    res.status(201).json({ id: projectId, message: 'Project created successfully' });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

// Update project
router.put('/:id', auth, checkPermission('can_manage_projects'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const projectId = req.params.id;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    await db.run('UPDATE projects SET name = $1, description = $2 WHERE id = $3', [name, description, projectId]);

    // Log activity
    await db.run(
      'INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'Project Updated', 'project', projectId, `Updated project: ${name}`]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

// Delete project
router.delete('/:id', auth, checkPermission('can_manage_projects'), async (req, res) => {
  try {
    const projectId = req.params.id;

    // First clear project_id from tasks belonging to this project
    await db.run('UPDATE tasks SET project_id = NULL WHERE project_id = $1', [projectId]);

    const result = await db.run('DELETE FROM projects WHERE id = $1', [projectId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Log activity
    await db.run(
      'INSERT INTO activity_log (user_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'Project Deleted', 'project', projectId, `Deleted project ID: ${projectId}`]
    );

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

module.exports = router;
