const TeamMember = require('../models/TeamMember');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

/**
 * Resolves active permissions for a user within a specific team dynamically from MongoDB.
 * Resolution chain: User -> TeamMember -> Role -> Permissions
 * Returns an array of active permission names (strings), e.g. ['CREATE_TASK', 'EDIT_TASK', 'MANAGE_MEMBERS']
 */
async function getUserPermissions(teamId, userId) {
  if (!teamId || !userId) return [];

  // Step 1: Find TeamMember document
  const membership = await TeamMember.findOne({ team: teamId, user: userId });
  if (!membership || !membership.role) return [];

  // Step 2 & 3: Resolve latest Role document dynamically from Role collection in MongoDB
  let roleDoc = null;
  const roleInput = membership.role;

  if (typeof roleInput === 'object' && roleInput !== null && roleInput._id) {
    roleDoc = await Role.findById(roleInput._id).populate('permissions');
  } else if (typeof roleInput === 'string' || roleInput instanceof String) {
    const roleStr = roleInput.toString();
    if (roleStr.match(/^[0-9a-fA-F]{24}$/)) {
      roleDoc = await Role.findById(roleStr).populate('permissions');
    } else {
      roleDoc = await Role.findOne({ name: new RegExp(`^${roleStr}$`, 'i') }).populate('permissions');
    }
  } else {
    roleDoc = await Role.findById(roleInput).populate('permissions');
  }

  if (!roleDoc || !roleDoc.permissions) {
    return [];
  }

  // Step 4: Map resolved permission documents to permission name strings
  return roleDoc.permissions
    .map(p => (typeof p === 'object' && p ? p.name : p))
    .filter(Boolean);
}

/**
 * Middleware factory requiring a specific team-level permission for the request.
 */
function requirePermission(permissionName) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Resolve teamId from params, body, query or task ID
      let teamId = req.params.teamId || req.params.id || req.body.teamId || req.body.team_id || req.body.project_id || req.query.teamId || req.query.team_id || req.query.project_id || req.headers['x-team-id'];

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

/**
 * Middleware requiring Admin role or specific global permission across any user team.
 */
function requireAdminOrGlobalPermission(permissionName) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const memberships = await TeamMember.find({ user: req.user.id });
      let isAdmin = false;
      let hasPerm = false;

      for (const m of memberships) {
        if (!m.team) continue;
        const perms = await getUserPermissions(m.team, req.user.id);
        if (perms.includes(permissionName)) {
          hasPerm = true;
        }

        // Check if role in team is Admin
        let roleName = '';
        if (m.role) {
          if (typeof m.role === 'object' && m.role.name) {
            roleName = m.role.name;
          } else {
            const roleDoc = await Role.findById(m.role).catch(() => null) || await Role.findOne({ name: m.role }).catch(() => null);
            if (roleDoc) roleName = roleDoc.name;
          }
        }
        if (/^Admin$/i.test(roleName)) {
          isAdmin = true;
        }
      }

      if (!isAdmin && !hasPerm) {
        return res.status(403).json({
          error: `Permission denied: Missing required administrative privileges or permission '${permissionName}'`,
          requiredPermission: permissionName,
        });
      }

      next();
    } catch (err) {
      console.error('Global RBAC Error:', err);
      res.status(500).json({ error: 'Internal server error during global RBAC verification' });
    }
  };
}

module.exports = {
  getUserPermissions,
  requirePermission,
  requireAdminOrGlobalPermission,
};
