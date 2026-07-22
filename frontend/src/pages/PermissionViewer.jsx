import { useState, useEffect } from 'react';
import api from '../api';

const s = {
  page: { padding: '32px', maxWidth: '960px' },
  header: { marginBottom: '28px' },
  h1: { fontSize: '22px', fontWeight: 700, marginBottom: '4px' },
  sub: { fontSize: '13px', color: 'var(--text-muted)' },
  selectRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px',
    background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '1px' },
  select: {
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
    padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: '14px',
  },
  resultSection: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '28px',
  },
  resHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '14px',
  },
  resTitle: { fontSize: '16px', fontWeight: 700 },
  roleBadge: {
    fontSize: '11px', fontFamily: 'var(--mono)', padding: '3px 10px', borderRadius: '20px',
    background: 'var(--accent-dim)', color: 'var(--accent-bright)', textTransform: 'uppercase',
  },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' },
  permCard: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
    transition: 'transform 0.15s, border-color 0.15s',
  },
  permIcon: {
    width: '32px', height: '32px', borderRadius: '8px', background: 'var(--green-dim)',
    color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', flexShrink: 0,
  },
  permName: { fontSize: '13px', fontWeight: 600, fontFamily: 'var(--mono)' },
  noPerms: {
    textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)',
    border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
  },
};

const PERMISSION_LABELS = {
  CREATE_TASK: { label: 'Create Task', icon: '➕' },
  EDIT_TASK: { label: 'Edit Task', icon: '✏️' },
  DELETE_TASK: { label: 'Delete Task', icon: '🗑️' },
  VIEW_ONLY: { label: 'View Only', icon: '👁️' },
  CREATE_TEAM: { label: 'Create Team', icon: '🏗️' },
  MANAGE_MEMBERS: { label: 'Manage Members', icon: '👥' },
  ASSIGN_ROLE: { label: 'Assign Role', icon: '🛡️' },
  DELETE_TEAM: { label: 'Delete Team', icon: '❌' },
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
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.h1}>Permission Resolution Viewer</h1>
        <p style={s.sub}>Select a Team and User to dynamically resolve active permissions from backend.</p>
      </div>

      <div style={s.selectRow}>
        <div style={s.field}>
          <label style={s.label}>1. SELECT TEAM</label>
          <select style={s.select} value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}>
            {teams.length === 0 ? <option value="">No teams available</option> : null}
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>2. SELECT USER</label>
          <select style={s.select} value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
            {users.length === 0 ? <option value="">No users available</option> : null}
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
      </div>

      <div style={s.resultSection}>
        <div style={s.resHeader}>
          <div>
            <div style={s.resTitle}>
              Resolved Permissions for <span style={{ color: 'var(--accent-bright)' }}>{selectedUser?.name || 'Selected User'}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              in Team: <strong>{selectedTeam?.name || 'Selected Team'}</strong>
            </div>
          </div>
          <div style={s.roleBadge}>
            {permissions.length} Active Key{permissions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loadingPerms ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
            Resolving permissions from backend...
          </div>
        ) : permissions.length === 0 ? (
          <div style={s.noPerms}>
            <p style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>No Permissions Resolved</p>
            <p style={{ fontSize: '12px' }}>If user has no role in this team, permissions default to empty (No permissions).</p>
          </div>
        ) : (
          <div style={s.cardGrid}>
            {permissions.map(permKey => {
              const meta = PERMISSION_LABELS[permKey] || { label: permKey, icon: '🔑' };
              return (
                <div key={permKey} style={s.permCard}>
                  <div style={s.permIcon}>{meta.icon}</div>
                  <div>
                    <div style={s.permName}>{meta.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{permKey}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
