const express = require('express');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const Role = require('../models/Role');
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');
const { getUserPermissions, requirePermission } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

// Helper to determine role rank weight (Admin > Manager > Viewer)
function getRoleWeight(roleObjOrName) {
  const roleName = typeof roleObjOrName === 'string'
    ? roleObjOrName
    : (roleObjOrName?.name || '');
  if (/^Admin$/i.test(roleName)) return 3;
  if (/^Manager$/i.test(roleName)) return 2;
  return 1; // Default for Viewer or custom roles
}

// Helper function to resolve role ID from ID or Role Name string
async function resolveRoleId(roleInput) {
  if (!roleInput) {
    const defaultRole = await Role.findOne({ name: 'Viewer' }) || await Role.findOne();
    return defaultRole._id;
  }
  if (typeof roleInput === 'string' && roleInput.match(/^[0-9a-fA-F]{24}$/)) {
    return roleInput;
  }
  const found = await Role.findOne({ name: new RegExp(`^${roleInput}$`, 'i') });
  if (found) return found._id;

  const fallback = await Role.findOne({ name: 'Viewer' }) || await Role.findOne();
  return fallback._id;
}

// GET /api/teams - list all teams for current user
router.get('/', async (req, res) => {
  try {
    const memberships = await TeamMember.find({ user: req.user.id })
      .populate('team')
      .populate('role');

    const result = await Promise.all(memberships.map(async (m) => {
      if (!m.team) return null;
      const teamObj = m.team.toJSON();
      const memberCount = await TeamMember.countDocuments({ team: m.team._id });
      const taskCount = await Task.countDocuments({ team: m.team._id });
      return {
        ...teamObj,
        role: m.role ? m.role.name : 'Viewer',
        roleId: m.role ? m.role._id : null,
        member_count: memberCount,
        task_count: taskCount,
      };
    }));

    res.json(result.filter(Boolean));
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/teams - create team
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.user.id,
    });

    const adminRole = await Role.findOne({ name: 'Admin' }) || await Role.findOne();

    await TeamMember.create({
      team: team._id,
      user: req.user.id,
      role: adminRole._id,
    });

    res.status(201).json({
      ...team.toJSON(),
      role: adminRole ? adminRole.name : 'Admin',
      roleId: adminRole ? adminRole._id : null,
      member_count: 1,
      task_count: 0,
    });
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/teams/:id - team details (Resolves dynamic RBAC permissions from MongoDB)
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const currentMember = await TeamMember.findOne({ team: req.params.id, user: req.user.id })
      .populate('role');
    if (!currentMember) return res.status(403).json({ error: 'Access denied: You are not a member of this team' });

    const allMemberships = await TeamMember.find({ team: req.params.id })
      .populate('user')
      .populate('role');

    const members = allMemberships.map(m => {
      const u = m.user ? m.user.toJSON() : {};
      return {
        id: u.id,
        _id: u.id,
        name: u.name,
        email: u.email,
        role: m.role ? m.role.name : 'Viewer',
        roleId: m.role ? m.role._id : null,
        joined_at: m.createdAt,
      };
    });

    // Dynamic Permission Resolution Chain: User -> TeamMember -> Role -> Permissions
    const userPermissions = await getUserPermissions(req.params.id, req.user.id);

    res.json({
      ...team.toJSON(),
      role: currentMember.role ? currentMember.role.name : 'Viewer',
      roleId: currentMember.role ? currentMember.role._id : null,
      permissions: userPermissions,
      members,
    });
  } catch (err) {
    console.error('Error fetching team details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/teams/:id/members - add member to team (requires MANAGE_MEMBERS permission)
router.post('/:id/members', requirePermission('MANAGE_MEMBERS'), async (req, res) => {
  try {
    const { email, userId, roleId, role: roleName } = req.body;
    let targetUserId = userId;

    if (!targetUserId && email) {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(404).json({ error: 'User not found with that email' });
      targetUserId = user._id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID or email is required' });
    }

    const existing = await TeamMember.findOne({ team: req.params.id, user: targetUserId });
    if (existing) return res.status(409).json({ error: 'User is already a team member' });

    const finalRoleId = await resolveRoleId(roleId || roleName);
    const newRoleDoc = await Role.findById(finalRoleId);

    // Role hierarchy check: requester cannot assign a role higher than their own
    const requesterMember = await TeamMember.findOne({ team: req.params.id, user: req.user.id }).populate('role');
    const requesterWeight = getRoleWeight(requesterMember?.role);
    const newRoleWeight = getRoleWeight(newRoleDoc);

    if (newRoleWeight > requesterWeight) {
      return res.status(403).json({ error: 'Permission denied: Cannot assign a role rank higher than your own' });
    }

    await TeamMember.create({
      team: req.params.id,
      user: targetUserId,
      role: finalRoleId,
    });

    const addedUser = await User.findById(targetUserId);
    res.status(201).json({ message: 'Member added', user: addedUser.toJSON() });
  } catch (err) {
    console.error('Error adding team member:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/teams/:id/members/:userId - remove member (requires MANAGE_MEMBERS permission + Role Hierarchy)
router.delete('/:id/members/:userId', requirePermission('MANAGE_MEMBERS'), async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself from the team' });
    }

    const requesterMember = await TeamMember.findOne({ team: req.params.id, user: req.user.id }).populate('role');
    const targetMember = await TeamMember.findOne({ team: req.params.id, user: req.params.userId }).populate('role');

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found in team' });
    }

    const requesterWeight = getRoleWeight(requesterMember?.role);
    const targetWeight = getRoleWeight(targetMember?.role);

    // Rule: Manager (weight 2) cannot delete Admin (weight 3)
    if (requesterWeight < targetWeight) {
      return res.status(403).json({ error: 'Permission denied: Cannot remove a member with a higher role rank than your own' });
    }

    await TeamMember.findOneAndDelete({ team: req.params.id, user: req.params.userId });
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Error removing team member:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/teams/:teamId/users/:userId/role - Assign / update role to user within a team (requires ASSIGN_ROLE/MANAGE_MEMBERS + Hierarchy)
router.put('/:teamId/users/:userId/role', requirePermission('ASSIGN_ROLE'), async (req, res) => {
  try {
    const { roleId, role: roleName } = req.body;
    const finalRoleId = await resolveRoleId(roleId || roleName);
    const newRoleDoc = await Role.findById(finalRoleId);

    const requesterMember = await TeamMember.findOne({ team: req.params.teamId, user: req.user.id }).populate('role');
    const targetMember = await TeamMember.findOne({ team: req.params.teamId, user: req.params.userId }).populate('role');

    const requesterWeight = getRoleWeight(requesterMember?.role);
    const targetWeight = targetMember ? getRoleWeight(targetMember.role) : 0;
    const newRoleWeight = getRoleWeight(newRoleDoc);

    // Hierarchy Check 1: Cannot modify an existing member of higher rank than yourself
    if (targetMember && requesterWeight < targetWeight) {
      return res.status(403).json({ error: 'Permission denied: Cannot modify the role of a member with a higher rank than your own' });
    }

    // Hierarchy Check 2: Cannot promote or assign a role rank higher than your own rank
    if (newRoleWeight > requesterWeight) {
      return res.status(403).json({ error: 'Permission denied: Cannot assign a role rank higher than your own' });
    }

    let membership = targetMember;
    if (!membership) {
      membership = await TeamMember.create({
        team: req.params.teamId,
        user: req.params.userId,
        role: finalRoleId,
      });
    } else {
      membership.role = finalRoleId;
      await membership.save();
    }

    const updated = await TeamMember.findById(membership._id).populate('role');
    res.json({
      message: 'Role updated successfully',
      teamId: req.params.teamId,
      userId: req.params.userId,
      role: updated.role ? updated.role.toJSON() : null,
    });
  } catch (err) {
    console.error('Error updating member role:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/teams/:id - delete team (requires DELETE_TEAM permission)
router.delete('/:id', requirePermission('DELETE_TEAM'), async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    await TeamMember.deleteMany({ team: req.params.id });
    await Task.deleteMany({ team: req.params.id });
    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    console.error('Error deleting team:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/teams/:teamId/users/:userId/permissions - Permission resolution endpoint
router.get('/:teamId/users/:userId/permissions', async (req, res) => {
  try {
    const permissions = await getUserPermissions(req.params.teamId, req.params.userId);
    res.json(permissions);
  } catch (err) {
    console.error('Error getting user team permissions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
