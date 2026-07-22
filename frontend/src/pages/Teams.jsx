import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const s = {
  page: { padding: '32px', maxWidth: '960px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  h1: { fontSize: '22px', fontWeight: 700 },
  btn: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius)', padding: '9px 18px', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px', cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.15s',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' },
  cardTitle: { fontSize: '15px', fontWeight: 600, lineHeight: 1.3 },
  roleBadge: {
    fontSize: '10px', fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: '20px',
    letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
  },
  desc: { fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 },
  meta: { display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
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
  textarea: {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--text)', fontSize: '14px',
    resize: 'vertical', minHeight: '80px',
  },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: {
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: 'var(--radius)', padding: '9px 16px', fontSize: '13px', cursor: 'pointer',
  },
};

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

  if (loading) return <div style={{ ...s.page, color: 'var(--text-muted)', paddingTop: '80px', textAlign: 'center' }}>Loading teams...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.h1}>Teams</h1>
        <button style={s.btn} onClick={() => setShowModal(true)}>+ New Team</button>
      </div>

      {teams.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No teams yet</p>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>Create your first team to start collaborating</p>
          <button style={s.btn} onClick={() => setShowModal(true)}>+ Create Team</button>
        </div>
      ) : (
        <div style={s.grid}>
          {teams.map(t => (
            <div
              key={t.id}
              style={s.card}
              onClick={() => navigate(`/teams/${t.id}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={s.cardHeader}>
                <div style={s.cardTitle}>{t.name}</div>
                <div style={{
                  ...s.roleBadge,
                  background: t.role === 'Admin' ? 'var(--accent-dim)' : 'rgba(120,120,160,0.15)',
                  color: t.role === 'Admin' ? 'var(--accent-bright)' : 'var(--text-muted)',
                }}>{t.role}</div>
              </div>
              {t.description && <div style={s.desc}>{t.description}</div>}
              <div style={s.meta}>
                <span>{t.member_count} member{t.member_count !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{t.task_count} task{t.task_count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>New Team</div>
            <form onSubmit={handleCreate}>
              <div style={s.field}>
                <label style={s.label}>TEAM NAME</label>
                <input style={s.input} type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Engineering Alpha" required autoFocus />
              </div>
              <div style={s.field}>
                <label style={s.label}>DESCRIPTION (optional)</label>
                <textarea style={s.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this team responsible for?" />
              </div>
              <div style={s.actions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
