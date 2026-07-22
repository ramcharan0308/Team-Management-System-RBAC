import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Plus, ShieldAlert, X } from 'lucide-react';
import api from '../api';

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

  if (loading) return <div style={{ color: 'var(--text-muted)', paddingTop: '60px', textAlign: 'center' }}>Loading system permissions...</div>;

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: '4px' }}>Permission Keys</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Atomic authorization keys mapped to role definitions across all team workspaces.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}
        >
          <Plus size={16} /> New Permission Key
        </motion.button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {permissions.map(p => (
          <motion.div
            key={p.id}
            whileHover={{ y: -2 }}
            style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-xs)' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <KeyRound size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>System Action Key</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Create Permission Key</h2>
              <button style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>PERMISSION KEY NAME (UPPERCASE)</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px', fontFamily: 'var(--font-mono)' }} type="text" value={permName} onChange={e => setPermName(e.target.value)} placeholder="e.g. EXPORT_ANALYTICS" required autoFocus />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
