import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Plus, Users, CheckSquare, ArrowRight, X } from 'lucide-react';
import api from '../api';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () => api.get('/teams').then(r => setTeams(r.data)).catch(() => api.get('/projects').then(r => setTeams(r.data))).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/teams', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', paddingTop: '60px', textAlign: 'center' }}>Loading team workspaces...</div>;

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: '4px' }}>Team Workspaces</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Collaborative workspaces with dynamic role assignment and RBAC controls.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}
        >
          <Plus size={16} /> New Team Workspace
        </motion.button>
      </div>

      {teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <Building2 size={40} color="var(--text-light)" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No teams joined yet</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Create your first team workspace to start inviting members.</p>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Create Team
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {teams.map(t => (
            <motion.div
              key={t.id}
              whileHover={{ y: -3 }}
              style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onClick={() => navigate(`/teams/${t.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={20} />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>{t.name}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: 700, background: t.role === 'Admin' ? 'var(--primary-light)' : 'var(--border-light)', color: t.role === 'Admin' ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {t.role}
                  </span>
                </div>
                {t.description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>{t.description}</p>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-light)', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {t.member_count} members</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckSquare size={14} /> {t.task_count} tasks</span>
                </div>
                <ArrowRight size={16} color="var(--primary)" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Team Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Create Team Workspace</h2>
              <button style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>TEAM NAME</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '14px' }} type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Platform Engineering" required autoFocus />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>DESCRIPTION (OPTIONAL)</label>
                <textarea style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '14px', minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this team responsible for?" />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
