const express = require('express');
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { requirePermission, getUserPermissions } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

// Helper: check team membership
const checkMembership = async (teamId, userId) => {
  return await TeamMember.findOne({ team: teamId, user: userId });
};

// GET /api/tasks - list tasks for a team/project
router.get('/', async (req, res) => {
  try {
    const teamId = req.query.team_id || req.query.project_id || req.query.teamId || req.query.projectId;
    if (!teamId) return res.status(400).json({ error: 'team_id / project_id is required' });

    const membership = await checkMembership(teamId, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Access denied: Not a member of this team' });

    const tasks = await Task.find({ team: teamId })
      .populate('assignedTo')
      .populate('createdBy')
      .sort({ createdAt: -1 });

    const formatted = tasks.map(t => {
      const json = t.toJSON();
      const assigneeDoc = t.assignedTo && typeof t.assignedTo === 'object' ? t.assignedTo : null;
      const creatorDoc = t.createdBy && typeof t.createdBy === 'object' ? t.createdBy : null;
      return {
        ...json,
        assigned_to: assigneeDoc ? assigneeDoc._id.toString() : (json.assigned_to || null),
        assignedTo: assigneeDoc ? assigneeDoc._id.toString() : (json.assignedTo || null),
        assigned_to_name: assigneeDoc ? assigneeDoc.name : null,
        assigned_to_email: assigneeDoc ? assigneeDoc.email : null,
        created_by_name: creatorDoc ? creatorDoc.name : null,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks - create task
router.post('/', requirePermission('CREATE_TASK'), async (req, res) => {
  try {
    const { project_id, team_id, teamId, title, description, due_date, dueDate, priority, assigned_to, assignedTo } = req.body;
    const finalTeamId = team_id || project_id || teamId;
    const finalAssignee = assigned_to || assignedTo || null;

    if (!finalTeamId || !title) {
      return res.status(400).json({ error: 'Team ID and title are required' });
    }

    if (finalAssignee) {
      const isMember = await checkMembership(finalTeamId, finalAssignee);
      if (!isMember) return res.status(400).json({ error: 'Assigned user is not a team member' });
    }

    const task = await Task.create({
      team: finalTeamId,
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: due_date || dueDate || null,
      priority: priority || 'medium',
      assignedTo: finalAssignee || null,
      createdBy: req.user.id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo')
      .populate('createdBy');

    const json = populated.toJSON();
    const assigneeDoc = populated.assignedTo && typeof populated.assignedTo === 'object' ? populated.assignedTo : null;
    const creatorDoc = populated.createdBy && typeof populated.createdBy === 'object' ? populated.createdBy : null;

    res.status(201).json({
      ...json,
      assigned_to: assigneeDoc ? assigneeDoc._id.toString() : (json.assigned_to || null),
      assignedTo: assigneeDoc ? assigneeDoc._id.toString() : (json.assignedTo || null),
      assigned_to_name: assigneeDoc ? assigneeDoc.name : null,
      assigned_to_email: assigneeDoc ? assigneeDoc.email : null,
      created_by_name: creatorDoc ? creatorDoc.name : null,
    });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tasks/:id - update task
router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const permissions = await getUserPermissions(task.team, req.user.id);
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.id;
    const canEdit = permissions.includes('EDIT_TASK');

    if (!canEdit && !isAssignee) {
      return res.status(403).json({ error: 'Permission denied: You can only update tasks assigned to you' });
    }

    const { title, description, due_date, dueDate, priority, status, assigned_to, assignedTo } = req.body;

    // If missing EDIT_TASK permission, user can only update status if they are the assignee
    if (!canEdit && (title || description || due_date || dueDate || priority || (assigned_to !== undefined || assignedTo !== undefined))) {
      return res.status(403).json({ error: 'Permission denied: EDIT_TASK permission required to edit task details' });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (due_date !== undefined || dueDate !== undefined) task.dueDate = due_date || dueDate || null;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    
    if (assigned_to !== undefined || assignedTo !== undefined) {
      const newAssignee = assigned_to !== undefined ? assigned_to : assignedTo;
      task.assignedTo = newAssignee ? newAssignee : null;
    }

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignedTo')
      .populate('createdBy');

    const json = updated.toJSON();
    const assigneeDoc = updated.assignedTo && typeof updated.assignedTo === 'object' ? updated.assignedTo : null;
    const creatorDoc = updated.createdBy && typeof updated.createdBy === 'object' ? updated.createdBy : null;

    res.json({
      ...json,
      assigned_to: assigneeDoc ? assigneeDoc._id.toString() : (json.assigned_to || null),
      assignedTo: assigneeDoc ? assigneeDoc._id.toString() : (json.assignedTo || null),
      assigned_to_name: assigneeDoc ? assigneeDoc.name : null,
      assigned_to_email: assigneeDoc ? assigneeDoc.email : null,
      created_by_name: creatorDoc ? creatorDoc.name : null,
    });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id - delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const permissions = await getUserPermissions(task.team, req.user.id);
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.id;
    const canDelete = permissions.includes('DELETE_TASK') || isAssignee;

    if (!canDelete) {
      return res.status(403).json({ error: 'Permission denied: DELETE_TASK permission required' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
