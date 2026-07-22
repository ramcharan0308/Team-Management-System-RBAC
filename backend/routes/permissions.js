const express = require('express');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrGlobalPermission } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

// GET /api/permissions
router.get('/', async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ name: 1 });
    res.json(permissions.map(p => p.toJSON()));
  } catch (err) {
    console.error('Error fetching permissions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/permissions (Requires Admin / MANAGE_PERMISSIONS permission)
router.post('/', requireAdminOrGlobalPermission('MANAGE_PERMISSIONS'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Permission name is required' });
    }

    const permName = name.trim().toUpperCase();
    const existing = await Permission.findOne({ name: permName });
    if (existing) {
      return res.status(409).json({ error: 'Permission already exists' });
    }

    const permission = await Permission.create({ name: permName });
    res.status(201).json(permission.toJSON());
  } catch (err) {
    console.error('Error creating permission:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/permissions/:id - Delete permission with validation (Requires Admin / MANAGE_PERMISSIONS permission)
router.delete('/:id', requireAdminOrGlobalPermission('MANAGE_PERMISSIONS'), async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) return res.status(404).json({ error: 'Permission not found' });

    const linkedRolesCount = await Role.countDocuments({ permissions: req.params.id });
    if (linkedRolesCount > 0) {
      return res.status(400).json({ error: 'Cannot delete permission because it is linked to roles.' });
    }

    await Permission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    console.error('Error deleting permission:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
