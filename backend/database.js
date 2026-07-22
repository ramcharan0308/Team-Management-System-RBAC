const mongoose = require('mongoose');

const DEFAULT_PERMISSIONS = [
  'CREATE_TASK',
  'EDIT_TASK',
  'DELETE_TASK',
  'VIEW_ONLY',
  'CREATE_TEAM',
  'MANAGE_MEMBERS',
  'ASSIGN_ROLE',
  'DELETE_TEAM',
];

async function seedDefaults() {
  const Permission = require('./models/Permission');
  const Role = require('./models/Role');

  // Seed permissions
  const permDocs = {};
  for (const permName of DEFAULT_PERMISSIONS) {
    let perm = await Permission.findOne({ name: permName });
    if (!perm) {
      perm = await Permission.create({ name: permName });
      console.log(`[Seed] Created permission: ${permName}`);
    }
    permDocs[permName] = perm._id;
  }

  // Seed roles
  const defaultRoles = [
    {
      name: 'Admin',
      permissions: Object.values(permDocs),
    },
    {
      name: 'Manager',
      permissions: [
        permDocs['CREATE_TASK'],
        permDocs['EDIT_TASK'],
        permDocs['VIEW_ONLY'],
        permDocs['MANAGE_MEMBERS'],
      ].filter(Boolean),
    },
    {
      name: 'Viewer',
      permissions: [
        permDocs['VIEW_ONLY'],
      ].filter(Boolean),
    },
  ];

  for (const roleDef of defaultRoles) {
    let role = await Role.findOne({ name: roleDef.name });
    if (!role) {
      role = await Role.create(roleDef);
      console.log(`[Seed] Created role: ${roleDef.name}`);
    }
  }
}

async function init() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmanager';
  
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB successfully.');

  await seedDefaults();
}

module.exports = { init, mongoose };
