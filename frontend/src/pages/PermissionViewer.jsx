import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Building2, User, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import api from '../api';

const PERMISSION_META = {
  CREATE_TASK: { label: 'Create Task', icon: '➕', desc: 'Can add tasks to team board' },
  EDIT_TASK: { label: 'Edit Task', icon: '✏️', desc: 'Can update task details & assignee' },
  DELETE_TASK: { label: 'Delete Task', icon: '🗑️', desc: 'Can permanently remove tasks' },
  VIEW_ONLY: { label: 'View Only', icon: '👁️', desc: 'Read-only access to team assets' },
  CREATE_TEAM: { label: 'Create Team', icon: '🏗️', desc: 'Can instantiate new team workspaces' },
  MANAGE_MEMBERS: { label: 'Manage Members', icon: '👥', desc: 'Can add & remove team members' },
  ASSIGN_ROLE: { label: 'Assign Role', icon: '🛡️', desc: 'Can change user roles in team' },
  DELETE_TEAM: { label: 'Delete Team', icon: '❌', desc: 'Can destroy team workspace' },
};

export default function PermissionViewer() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/teams').catch(() => api.get('/projects')),
      api.get('/users'),
    ]).then(([teamsRes, usersRes]) => {
      setTeams(teamsRes.data || []);
      setUsers(usersRes.data || []);
      if (teamsRes.data?.length > 0) setSelectedTeamId(teamsRes.data[0].id);
      if (usersRes.data?.length > 0) setSelectedUserId(usersRes.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedTeamId || !selectedUserId) {
      setPermissions([]);
      return;
    }

    setLoadingPerms(true);
    api.get(`/teams/${selectedTeamId}/users/${selectedUserId}/permissions`)
      .then(res => setPermissions(res.data || []))
      .catch(err => {
        console.error('Error fetching resolved permissions:', err);
        setPermissions([]);
      })
      .finally(() => setLoadingPerms(false));
  }, [selectedTeamId, selectedUserId]);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Permission Resolution Inspection
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Real-time permission evaluation for any user within any specific team context.
        </p>
      </div>

      {/* Selectors Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px', background: '#ffffff', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            <Building2 size={14} /> 1. SELECT TARGET TEAM
          </label>
          <select
            value={selectedTeamId}
            onChange={e => setSelectedTeamId(e.target.value)}
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 600 }}
          >
            {teams.length === 0 ? <option value="">No teams available</option> : null}
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            <User size={14} /> 2. SELECT TARGET USER
          </label>
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 600 }}
          >
            {users.length === 0 ? <option value="">No users available</option> : null}
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Container */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              Resolved Active Permissions for <span style={{ color: 'var(--primary)' }}>{selectedUser?.name || 'User'}</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              within Workspace Team: <strong>{selectedTeam?.name || 'Team'}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'var(--success-light)', color: 'var(--success-text)', fontSize: '12px', fontWeight: 700 }}>
            <CheckCircle2 size={16} /> {permissions.length} Active Key{permissions.length !== 1 ? 's' : ''} Resolved
          </div>
        </div>

        {loadingPerms ? (
          <div style={{ padding: '50px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Evaluating RBAC mapping in backend...
          </div>
        ) : permissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
            <Lock size={36} color="var(--text-light)" style={{ marginBottom: '10px' }} />
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No Permissions Resolved</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>If the user holds no role in this team, their permission set defaults to empty (0 permissions).</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {permissions.map((permKey, idx) => {
              const meta = PERMISSION_META[permKey] || { label: permKey, icon: '🔑', desc: 'Active permission key' };

              return (
                <motion.div
                  key={permKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--success-light)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{meta.label}</div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600, margin: '2px 0' }}>{permKey}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{meta.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
