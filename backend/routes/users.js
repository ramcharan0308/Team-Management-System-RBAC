const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const TeamMember = require('../models/TeamMember');
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrGlobalPermission } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

// GET /api/users - List users with optional search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { name: regex },
          { email: regex },
        ],
      };
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    // Include highest role for each user to assist UI hierarchy rendering
    const usersWithRoles = await Promise.all(users.map(async (u) => {
      const userObj = u.toJSON();
      const memberships = await TeamMember.find({ user: u._id }).populate('role');
      let highestRole = 'Viewer';
      if (memberships.some(m => m.role && m.role.name === 'Admin')) {
        highestRole = 'Admin';
      } else if (memberships.some(m => m.role && m.role.name === 'Manager')) {
        highestRole = 'Manager';
      }
      return {
        ...userObj,
        role: highestRole,
      };
    }));

    res.json(usersWithRoles);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users - Create user (Requires Admin / MANAGE_USERS permission)
router.post('/', requireAdminOrGlobalPermission('MANAGE_USERS'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const initialPassword = password || 'password123';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    res.status(201).json(user.toJSON());
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id - Delete user (Admin can delete any user; Manager can only delete Viewer users)
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own active user session profile' });
    }

    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ error: 'User not found' });

    // Check requester role hierarchy
    const requesterMemberships = await TeamMember.find({ user: req.user.id }).populate('role');
    const isRequesterAdmin = requesterMemberships.some(m => m.role && m.role.name === 'Admin');
    const isRequesterManager = requesterMemberships.some(m => m.role && m.role.name === 'Manager');

    if (!isRequesterAdmin && !isRequesterManager) {
      return res.status(403).json({ error: 'Permission denied: Insufficient privileges to delete user' });
    }

    if (!isRequesterAdmin && isRequesterManager) {
      // Manager can ONLY delete Viewer users (target user must not hold Admin or Manager role in any team)
      const targetMemberships = await TeamMember.find({ user: req.params.id }).populate('role');
      const isTargetAdminOrManager = targetMemberships.some(m => 
        m.role && (m.role.name === 'Admin' || m.role.name === 'Manager')
      );

      if (isTargetAdminOrManager) {
        return res.status(403).json({ error: 'Permission denied: Managers can only delete Viewer users' });
      }
    }

    // Clean up memberships and task assignments
    await TeamMember.deleteMany({ user: req.params.id });
    await Task.updateMany({ assignedTo: req.params.id }, { assignedTo: null });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
