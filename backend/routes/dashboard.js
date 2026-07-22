const express = require('express');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const teamId = req.query.team_id || req.query.project_id || req.query.teamId;
    const userId = req.user.id;

    const todayStr = new Date().toISOString().split('T')[0];

    if (teamId) {
      // Single Team dashboard
      const membership = await TeamMember.findOne({ team: teamId, user: userId });
      if (!membership) return res.status(403).json({ error: 'Access denied: Not a member of this team' });

      const totalTasks = await Task.countDocuments({ team: teamId });

      const byStatusAgg = await Task.aggregate([
        { $match: { team: teamId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const byStatus = byStatusAgg.map(item => ({ status: item._id, count: item.count }));

      const byPriorityAgg = await Task.aggregate([
        { $match: { team: teamId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);
      const byPriority = byPriorityAgg.map(item => ({ priority: item._id, count: item.count }));

      const overdueDocs = await Task.find({
        team: teamId,
        status: { $ne: 'done' },
        dueDate: { $ne: null, $lt: todayStr },
      }).populate('assignedTo').sort({ dueDate: 1 });

      const overdueTasks = overdueDocs.map(t => ({
        ...t.toJSON(),
        assigned_to_name: t.assignedTo ? t.assignedTo.name : null,
      }));

      // Tasks per user in team
      const teamMembers = await TeamMember.find({ team: teamId }).populate('user');
      const tasksByUser = await Promise.all(teamMembers.map(async (m) => {
        if (!m.user) return null;
        const uId = m.user._id;
        const userTasks = await Task.find({ team: teamId, assignedTo: uId });
        const taskCount = userTasks.length;
        const doneCount = userTasks.filter(t => t.status === 'done').length;
        const inprogressCount = userTasks.filter(t => t.status === 'inprogress').length;
        const todoCount = userTasks.filter(t => t.status === 'todo').length;

        return {
          id: uId.toString(),
          name: m.user.name,
          task_count: taskCount,
          done_count: doneCount,
          inprogress_count: inprogressCount,
          todo_count: todoCount,
        };
      }));

      return res.json({
        totalTasks,
        byStatus,
        byPriority,
        overdueTasks,
        tasksByUser: tasksByUser.filter(Boolean),
        overdueCount: overdueTasks.length,
      });
    }

    // Global dashboard across all user's teams
    const userMemberships = await TeamMember.find({ user: userId }).populate('team');
    const userTeams = userMemberships.map(m => m.team).filter(Boolean);
    const teamIds = userTeams.map(t => t._id);

    if (teamIds.length === 0) {
      return res.json({
        totalTasks: 0,
        byStatus: [],
        byPriority: [],
        overdueTasks: [],
        overdueCount: 0,
        tasksByUser: [],
        projectCount: 0,
        projects: [],
        teams: [],
      });
    }

    const totalTasks = await Task.countDocuments({ team: { $in: teamIds } });

    const byStatusAgg = await Task.aggregate([
      { $match: { team: { $in: teamIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byStatus = byStatusAgg.map(item => ({ status: item._id, count: item.count }));

    const overdueDocs = await Task.find({
      team: { $in: teamIds },
      status: { $ne: 'done' },
      dueDate: { $ne: null, $lt: todayStr },
    }).populate('assignedTo').populate('team').sort({ dueDate: 1 }).limit(10);

    const overdueTasks = overdueDocs.map(t => ({
      ...t.toJSON(),
      assigned_to_name: t.assignedTo ? t.assignedTo.name : null,
      project_name: t.team ? t.team.name : null,
      team_name: t.team ? t.team.name : null,
    }));

    // Group tasks by assigned user
    const tasksByUserAgg = await Task.aggregate([
      { $match: { team: { $in: teamIds }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const tasksByUser = await Promise.all(tasksByUserAgg.map(async (item) => {
      const u = await User.findById(item._id);
      if (!u) return null;
      return {
        id: u._id.toString(),
        name: u.name,
        task_count: item.count,
      };
    }));

    const formattedTeams = userTeams.map(t => ({
      id: t._id.toString(),
      name: t.name,
      description: t.description,
    }));

    res.json({
      totalTasks,
      byStatus,
      overdueTasks,
      overdueCount: overdueTasks.length,
      tasksByUser: tasksByUser.filter(Boolean),
      projectCount: userTeams.length,
      teamCount: userTeams.length,
      projects: formattedTeams,
      teams: formattedTeams,
    });
  } catch (err) {
    console.error('Error fetching dashboard metrics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
