const express = require('express');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
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

// POST /api/roles - Create new role
router.post('/', async (req, res) => {
  try {
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
router.put('/:id/permissions', async (req, res) => {
  try {
    const { permissions } = req.body; // Array of permission ObjectIds or permission names
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    // Handle case where permissions is an array of IDs or names
    let resolvedIds = [];
    for (const p of permissions) {
      if (typeof p === 'string' && !p.match(/^[0-9a-fA-F]{24}$/)) {
        // It's a name like "CREATE_TASK"
        const permDoc = await Permission.findOne({ name: p.toUpperCase() });
        if (permDoc) resolvedIds.push(permDoc._id);
      } else {
        resolvedIds.push(p);
      }
    }

    role.permissions = resolvedIds;
    await role.save();

    const updated = await Role.findById(role._id).populate('permissions');
    res.json(updated.toJSON());
  } catch (err) {
    console.error('Error updating role permissions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
