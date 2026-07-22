import { useState, useEffect } from 'react';
import api from '../api';

const s = {
  page: { padding: '32px', maxWidth: '1000px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  h1: { fontSize: '22px', fontWeight: 700 },
  btn: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius)', padding: '9px 18px', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' },
  roleCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '14px',
  },
  roleHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  roleName: { fontSize: '16px', fontWeight: 700, color: 'var(--accent-bright)' },
  permCount: { fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' },
  permGrid: { display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px',
    fontFamily: 'var(--mono)', cursor: 'pointer', userSelect: 'none', color: 'var(--text)',
  },
  checkbox: {
    accentColor: 'var(--accent)', width: '16px', height: '16px', cursor: 'pointer',
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
  },
  modalCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '420px',
  },
  modalTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '20px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' },
  input: {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--text)', fontSize: '14px',
  },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: {
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: 'var(--radius)', padding: '9px 16px', fontSize: '13px', cursor: 'pointer',
  },
};

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions'),
      ]);
      setRoles(rRes.data);
      setPermissions(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/roles', { name: newRoleName });
      setShowModal(false);
      setNewRoleName('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = async (role, permId) => {
    const currentPermIds = role.permissions ? role.permissions.map(p => typeof p === 'object' ? p.id : p) : [];
    const hasPerm = currentPermIds.includes(permId);

    const updatedPermIds = hasPerm
      ? currentPermIds.filter(id => id !== permId)
      : [...currentPermIds, permId];

    try {
      // Optimistic update
      setRoles(prev => prev.map(r => r.id === role.id ? {
        ...r,
        permissions: permissions.filter(p => updatedPermIds.includes(p.id))
      } : r));

      await api.put(`/roles/${role.id}/permissions`, { permissions: updatedPermIds });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update role permissions');
      loadData();
    }
  };

  if (loading) return <div style={{ padding: '60px 32px', color: 'var(--text-muted)' }}>Loading roles...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Roles & Permissions Matrix</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Create roles and toggle permission checkboxes dynamically.</p>
        </div>
        <button style={s.btn} onClick={() => setShowModal(true)}>+ Create Role</button>
      </div>

      <div style={s.grid}>
        {roles.map(r => {
          const rolePermIds = r.permissions ? r.permissions.map(p => typeof p === 'object' ? p.id : p) : [];

          return (
            <div key={r.id} style={s.roleCard}>
              <div style={s.roleHeader}>
                <div style={s.roleName}>{r.name}</div>
                <div style={s.permCount}>{rolePermIds.length} permissions</div>
              </div>

              <div style={s.permGrid}>
                {permissions.map(p => {
                  const isChecked = rolePermIds.includes(p.id);

                  return (
                    <label key={p.id} style={s.checkboxLabel}>
                      <input
                        type="checkbox"
                        style={s.checkbox}
                        checked={isChecked}
                        onChange={() => handleTogglePermission(r, p.id)}
                      />
                      <span style={{ color: isChecked ? 'var(--text)' : 'var(--text-muted)' }}>
                        {p.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>Create New Role</div>
            <form onSubmit={handleCreateRole}>
              <div style={s.field}>
                <label style={s.label}>ROLE NAME</label>
                <input style={s.input} type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Lead Developer" required autoFocus />
              </div>
              <div style={s.actions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
