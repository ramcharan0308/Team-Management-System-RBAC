const express = require('express');
const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const TeamMember = require('../models/TeamMember');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/roles - List all roles with populated permissions
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find().populate('permissions').sort({ name: 1 });
    res.json(roles.map(r => r.toJSON()));
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/roles - Create new role (Requires Admin role)
router.post('/', async (req, res) => {
  try {
    const requesterMemberships = await TeamMember.find({ user: req.user.id }).populate('role');
    const isRequesterAdmin = requesterMemberships.some(m => m.role && m.role.name === 'Admin');
    if (!isRequesterAdmin) {
      return res.status(403).json({ error: 'Permission denied: Only Admins can create new roles' });
    }

    const { name, permissions } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ error: 'Role already exists' });
    }

    const role = await Role.create({
      name: name.trim(),
      permissions: permissions || [],
    });

    const populated = await Role.findById(role._id).populate('permissions');
    res.status(201).json(populated.toJSON());
  } catch (err) {
    console.error('Error creating role:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/roles/:id/permissions - Assign/update permissions array to a role
// Admin: Can edit permissions for any role
// Manager: Can edit permissions ONLY for the Viewer role
router.put('/:id/permissions', async (req, res) => {
  try {
    const requesterMemberships = await TeamMember.find({ user: req.user.id }).populate('role');
    const isRequesterAdmin = requesterMemberships.some(m => m.role && m.role.name === 'Admin');
    const isRequesterManager = requesterMemberships.some(m => m.role && m.role.name === 'Manager');

    if (!isRequesterAdmin && !isRequesterManager) {
      return res.status(403).json({ error: 'Permission denied: Insufficient privileges to edit role permissions' });
    }

    const targetRole = await Role.findById(req.params.id);
    if (!targetRole) return res.status(404).json({ error: 'Role not found' });

    if (!isRequesterAdmin && isRequesterManager) {
      if (targetRole.name !== 'Viewer') {
        return res.status(403).json({ error: 'Permission denied: Managers can only edit permissions for the Viewer role' });
      }
    }

    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    let resolvedIds = [];
    for (const p of permissions) {
      if (typeof p === 'object' && p !== null) {
        const idVal = p._id || p.id;
        if (idVal && mongoose.Types.ObjectId.isValid(idVal)) {
          const permDoc = await Permission.findById(idVal);
          if (permDoc) resolvedIds.push(permDoc._id);
        }
      } else if (typeof p === 'string') {
        if (mongoose.Types.ObjectId.isValid(p) && p.match(/^[0-9a-fA-F]{24}$/)) {
          const permDoc = await Permission.findById(p);
          if (permDoc) resolvedIds.push(permDoc._id);
        } else {
          const permDoc = await Permission.findOne({ name: p.trim().toUpperCase() });
          if (permDoc) resolvedIds.push(permDoc._id);
        }
      }
    }

    targetRole.permissions = resolvedIds;
    await targetRole.save();

    const updated = await Role.findById(targetRole._id).populate('permissions');
    res.json(updated.toJSON());
  } catch (err) {
    console.error('Error updating role permissions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/roles/:id - Delete role (Requires Admin role)
router.delete('/:id', async (req, res) => {
  try {
    const requesterMemberships = await TeamMember.find({ user: req.user.id }).populate('role');
    const isRequesterAdmin = requesterMemberships.some(m => m.role && m.role.name === 'Admin');
    if (!isRequesterAdmin) {
      return res.status(403).json({ error: 'Permission denied: Only Admins can delete roles' });
    }

    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const assignedCount = await TeamMember.countDocuments({ role: req.params.id });
    if (assignedCount > 0) {
      return res.status(400).json({ error: 'Cannot delete role because it is currently assigned to users.' });
    }

    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
