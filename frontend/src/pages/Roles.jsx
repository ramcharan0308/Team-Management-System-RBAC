import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Plus, CheckSquare, Square, X } from 'lucide-react';
import api from '../api';

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

  if (loading) return <div style={{ color: 'var(--text-muted)', paddingTop: '60px', textAlign: 'center' }}>Loading role matrix...</div>;

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: '4px' }}>Roles & Permission Matrix</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Configure reusable role definitions and toggle dynamic permission keys.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}
        >
          <Plus size={16} /> Create Role
        </motion.button>
      </div>

      {/* Role Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
        {roles.map(r => {
          const rolePermIds = r.permissions ? r.permissions.map(p => typeof p === 'object' ? p.id : p) : [];

          return (
            <motion.div
              key={r.id}
              whileHover={{ y: -2 }}
              style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>{r.name}</div>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '3px 10px', borderRadius: '20px' }}>
                  {rolePermIds.length} Key{rolePermIds.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Permission Checkbox Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                {permissions.map(p => {
                  const isChecked = rolePermIds.includes(p.id);

                  return (
                    <label
                      key={p.id}
                      onClick={() => handleTogglePermission(r, p.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.15s', background: isChecked ? '#ffffff' : 'transparent', border: isChecked ? '1px solid var(--border)' : '1px solid transparent' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isChecked ? <CheckSquare size={16} color="var(--primary)" /> : <Square size={16} color="var(--text-light)" />}
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {p.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isChecked ? 'var(--success-text)' : 'var(--text-light)', fontWeight: 600 }}>
                        {isChecked ? 'GRANTED' : 'DENIED'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Role Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Create Custom Role</h2>
              <button style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateRole}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>ROLE NAME</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px' }} type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Lead Engineer" required autoFocus />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
