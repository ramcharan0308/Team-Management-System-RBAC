const express = require('express');
const Permission = require('../models/Permission');
const { authenticate } = require('../middleware/auth');

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

// POST /api/permissions
router.post('/', async (req, res) => {
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

module.exports = router;
