const TeamMember = require('../models/TeamMember');

/**
 * Resolves permissions for a user within a specific team.
 * Returns an array of permission names (strings), e.g. ['CREATE_TASK', 'EDIT_TASK']
 */
async function getUserPermissions(teamId, userId) {
  if (!teamId || !userId) return [];

  const membership = await TeamMember.findOne({ team: teamId, user: userId })
    .populate({
      path: 'role',
      populate: {
        path: 'permissions',
        model: 'Permission',
      },
    });

  if (!membership || !membership.role || !membership.role.permissions) {
    return [];
  }

  return membership.role.permissions.map(p => p.name);
}

/**
 * Middleware factory requiring a specific permission for the request.
 */
function requirePermission(permissionName) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Resolve teamId from params, body, query or task ID
      let teamId = req.params.teamId || req.params.id || req.body.teamId || req.body.team_id || req.body.project_id || req.query.teamId || req.query.team_id || req.query.project_id || req.headers['x-team-id'];

      // If task ID is present in params, fetch task to find team
      if (!teamId && req.params.taskId) {
        const Task = require('../models/Task');
        const task = await Task.findById(req.params.taskId);
        if (task) teamId = task.team;
      }

      if (!teamId && req.baseUrl.includes('tasks') && req.params.id) {
        const Task = require('../models/Task');
        const task = await Task.findById(req.params.id);
        if (task) teamId = task.team;
      }

      if (!teamId) {
        return res.status(400).json({ error: 'Team context (teamId/project_id) is required to resolve permissions' });
      }

      const permissions = await getUserPermissions(teamId, req.user.id);
      req.userPermissions = permissions;

      const hasPermission = permissions.includes(permissionName) || 
        (permissionName === 'ASSIGN_ROLE' && permissions.includes('MANAGE_MEMBERS'));

      if (!hasPermission) {
        return res.status(403).json({
          error: `Permission denied: Missing required permission '${permissionName}'`,
          requiredPermission: permissionName,
        });
      }

      next();
    } catch (err) {
      console.error('RBAC Middleware Error:', err);
      res.status(500).json({ error: 'Internal server error during permission resolution' });
    }
  };
}

module.exports = {
  getUserPermissions,
  requirePermission,
};
