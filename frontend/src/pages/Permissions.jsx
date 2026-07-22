import { useState, useEffect } from 'react';
import api from '../api';

const s = {
  page: { padding: '32px', maxWidth: '800px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  h1: { fontSize: '22px', fontWeight: 700 },
  btn: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius)', padding: '9px 18px', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' },
  permCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '16px',
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  badge: {
    fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700,
    color: 'var(--accent-bright)', letterSpacing: '0.5px',
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

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [permName, setPermName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/permissions');
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPermissions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/permissions', { name: permName });
      setShowModal(false);
      setPermName('');
      fetchPermissions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create permission');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '60px 32px', color: 'var(--text-muted)' }}>Loading permissions...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Permissions</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>System-wide action keys mapped to roles.</p>
        </div>
        <button style={s.btn} onClick={() => setShowModal(true)}>+ New Permission</button>
      </div>

      <div style={s.grid}>
        {permissions.map(p => (
          <div key={p.id} style={s.permCard}>
            <span style={{ fontSize: '14px' }}>🔑</span>
            <span style={s.badge}>{p.name}</span>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>Create New Permission</div>
            <form onSubmit={handleCreate}>
              <div style={s.field}>
                <label style={s.label}>PERMISSION NAME (e.g. AUDIT_LOGS)</label>
                <input style={s.input} type="text" value={permName} onChange={e => setPermName(e.target.value)} placeholder="e.g. EXPORT_DATA" required autoFocus />
              </div>
              <div style={s.actions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Permission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
