import { useState, useEffect } from 'react';
import api from '../api';

const s = {
  page: { padding: '32px', maxWidth: '900px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  h1: { fontSize: '22px', fontWeight: 700 },
  searchBar: {
    display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '24px',
    background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', width: '100%',
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', color: 'var(--text)',
    fontSize: '14px', outline: 'none',
  },
  btn: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius)', padding: '9px 18px', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  userCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '14px' },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-dim)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
    fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
  },
  name: { fontSize: '15px', fontWeight: 600 },
  email: { fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  date: { fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' },
  empty: {
    textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)',
    border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
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

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async (query = '') => {
    try {
      const res = await api.get(`/users${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(search);
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '' });
      fetchUsers(search);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Users Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>List, filter, and search system users.</p>
        </div>
        <button style={s.btn} onClick={() => setShowModal(true)}>+ Create User</button>
      </div>

      <div style={s.searchBar}>
        <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>🔍</span>
        <input
          style={s.searchInput}
          type="text"
          placeholder="Filter & search users by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSearch('')}>
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '40px' }}>Loading users...</div>
      ) : users.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '15px' }}>No users found matching "{search}"</p>
        </div>
      ) : (
        <div style={s.list}>
          {users.map(u => (
            <div key={u.id} style={s.userCard}>
              <div style={s.userInfo}>
                <div style={s.avatar}>{u.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={s.name}>{u.name}</div>
                  <div style={s.email}>{u.email}</div>
                </div>
              </div>
              <div style={s.date}>
                Registered: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>Create New User</div>
            <form onSubmit={handleCreate}>
              <div style={s.field}>
                <label style={s.label}>NAME</label>
                <input style={s.input} type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Alice Smith" required autoFocus />
              </div>
              <div style={s.field}>
                <label style={s.label}>EMAIL</label>
                <input style={s.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="alice@example.com" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>PASSWORD (optional, defaults to password123)</label>
                <input style={s.input} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <div style={s.actions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
