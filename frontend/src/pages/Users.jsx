import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Mail, Calendar, Trash2, X } from 'lucide-react';
import api from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user: currentUser, isAdmin, isManager } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
    if (!isAdmin) return;
    setFormError('');
    if (!form.password || !form.password.trim()) {
      setFormError('Initial password is required.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '' });
      fetchUsers(search);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/users/${deleteTarget.id || deleteTarget._id}`);
      setDeleteTarget(null);
      fetchUsers(search);
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete user profile');
    } finally {
      setDeleteLoading(false);
    }
  };

  const canDeleteUser = (u) => {
    if (u.id === currentUser?.id || u._id === currentUser?.id) return false; // cannot delete self
    if (isAdmin) return true; // Admin can delete any user
    if (isManager && u.role === 'Viewer') return true; // Manager can delete Viewer users ONLY
    return false;
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: '4px' }}>User Directory</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Manage user profiles and filter system users by name or email.</p>
        </div>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowModal(true); setFormError(''); }}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}
          >
            <UserPlus size={16} /> Create New User
          </motion.button>
        )}
      </div>

      {/* Search Input Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: '#ffffff', padding: '12px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Filter & search users by name or email address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '14px' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
        )}
      </div>

      {/* User Table Card Container */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '16px 24px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
          <span style={{ flex: 2 }}>USER NAME</span>
          <span style={{ flex: 2 }}>EMAIL ADDRESS</span>
          <span style={{ flex: 1.5 }}>ROLE LEVEL</span>
          <span style={{ width: '60px', textAlign: 'right' }}>ACTION</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Searching user database...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No users found matching "{search}".
          </div>
        ) : (
          users.map(u => (
            <div key={u.id || u._id} style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.15s' }}>
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800 }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                </div>
              </div>

              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <Mail size={14} color="var(--text-light)" /> {u.email}
              </div>

              <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, background: u.role === 'Admin' ? 'var(--primary-light)' : u.role === 'Manager' ? 'var(--accent-light)' : 'var(--border-light)', color: u.role === 'Admin' ? 'var(--primary)' : u.role === 'Manager' ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {u.role || 'Viewer'}
                </span>
              </div>

              {/* Action Column */}
              <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                {canDeleteUser(u) && (
                  <button
                    onClick={() => { setDeleteTarget(u); setDeleteError(''); }}
                    style={{
                      cursor: 'pointer',
                      color: 'var(--danger)',
                      background: 'var(--danger-light)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'opacity 0.15s',
                    }}
                    title="Delete user profile"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create User Modal */}
      {showModal && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Create User Profile</h2>
              <button style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--danger-light)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger-text)', fontSize: '12px', fontWeight: 500, marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>FULL NAME</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px' }} type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Alice Smith" required autoFocus />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>EMAIL ADDRESS</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px' }} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="alice@company.com" required />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>INITIAL PASSWORD</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px' }} type="password" value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); if (formError) setFormError(''); }} placeholder="••••••••" required />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete user "${deleteTarget?.name}"?`}
        message="This action cannot be undone and will remove user memberships."
        error={deleteError}
        loading={deleteLoading}
      />
    </div>
  );
}
