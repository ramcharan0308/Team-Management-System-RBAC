import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'inprogress', 'done'];
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
const STATUS_COLORS = { todo: 'var(--text-muted)', inprogress: 'var(--accent)', done: 'var(--green)' };
const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--red)' };
const PRIORITY_BG = { low: 'var(--green-dim)', medium: 'var(--yellow-dim)', high: 'var(--red-dim)' };

const s = {
  page: { padding: '32px', maxWidth: '1100px' },
  back: { fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '20px' },
  h1: { fontSize: '24px', fontWeight: 700, marginBottom: '4px' },
  desc: { fontSize: '14px', color: 'var(--text-muted)' },
  roleBadge: {
    fontSize: '10px', fontFamily: 'var(--mono)', padding: '3px 10px', borderRadius: '20px',
    letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
  },
  permPills: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' },
  permPill: { fontSize: '10px', fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: '4px', background: 'var(--accent-dim)', color: 'var(--accent-bright)' },
  tabs: { display: 'flex', gap: '2px', marginBottom: '24px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius)', width: 'fit-content', border: '1px solid var(--border)' },
  tab: { padding: '7px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none', color: 'var(--text-muted)', transition: 'all 0.15s' },
  tabActive: { background: 'var(--accent)', color: '#fff' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  columns: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  col: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', minHeight: '200px' },
  colHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  colTitle: { fontSize: '12px', fontFamily: 'var(--mono)', letterSpacing: '1px', textTransform: 'uppercase' },
  colCount: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '20px' },
  taskCard: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '12px', marginBottom: '10px', cursor: 'pointer', transition: 'border-color 0.15s',
  },
  taskTitle: { fontSize: '13px', fontWeight: 500, marginBottom: '8px', lineHeight: 1.4 },
  taskMeta: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  badge: { fontSize: '10px', fontFamily: 'var(--mono)', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.3px' },
  memberRow: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0',
    borderBottom: '1px solid var(--border)',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-dim)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
  },
  removeBtn: { background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)', borderRadius: 'var(--radius)', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' },
  roleSelect: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' },
  // Modal
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' },
  modalCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '20px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginBottom: '5px', letterSpacing: '0.5px' },
  input: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '9px 13px', color: 'var(--text)', fontSize: '14px' },
  select: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '9px 13px', color: 'var(--text)', fontSize: '14px' },
  textarea: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '9px 13px', color: 'var(--text)', fontSize: '14px', resize: 'vertical', minHeight: '80px' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius)', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' },
};

function TaskModal({ team, members, onClose, onSaved, task, canEditTask }) {
  const [form, setForm] = useState({
    status: task?.status || 'todo',
    title: task?.title || '',
    description: task?.description || '',
    due_date: task?.due_date || task?.dueDate || '',
    priority: task?.priority || 'medium',
    assigned_to: task?.assigned_to || task?.assignedTo || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = task
        ? { status: form.status, ...(canEditTask ? form : {}) }
        : { ...form, project_id: team.id, team_id: team.id };

      if (task) {
        await api.patch(`/tasks/${task.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      onSaved();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modalCard}>
        <div style={s.modalTitle}>{task ? 'Edit Task' : 'Create Task'}</div>
        <form onSubmit={handleSubmit}>
          {(canEditTask || !task) && (
            <>
              <div style={s.field}>
                <label style={s.label}>TITLE</label>
                <input style={s.input} type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required disabled={task && !canEditTask} placeholder="Task title" />
              </div>
              <div style={s.field}>
                <label style={s.label}>DESCRIPTION</label>
                <textarea style={s.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={s.field}>
                  <label style={s.label}>PRIORITY</label>
                  <select style={s.select} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>DUE DATE</label>
                  <input style={s.input} type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>ASSIGN TO</label>
                <select style={s.select} value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                </select>
              </div>
            </>
          )}
          <div style={s.field}>
            <label style={s.label}>STATUS</label>
            <select style={s.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
              {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const userPermissions = team?.permissions || [];
  const canCreateTask = userPermissions.includes('CREATE_TASK');
  const canEditTask = userPermissions.includes('EDIT_TASK');
  const canDeleteTask = userPermissions.includes('DELETE_TASK');
  const canManageMembers = userPermissions.includes('MANAGE_MEMBERS');
  const canAssignRole = userPermissions.includes('ASSIGN_ROLE') || canManageMembers;

  const loadAll = async () => {
    try {
      const [teamRes, taskRes, roleRes] = await Promise.all([
        api.get(`/teams/${id}`).catch(() => api.get(`/projects/${id}`)),
        api.get(`/tasks?project_id=${id}`),
        api.get('/roles').catch(() => ({ data: [] })),
      ]);
      setTeam(teamRes.data);
      setTasks(taskRes.data);
      setAvailableRoles(roleRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/teams/${id}/members/${userId}`);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (userId, newRoleName) => {
    try {
      await api.put(`/teams/${id}/users/${userId}/role`, { role: newRoleName });
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update member role');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await api.post(`/teams/${id}/members`, { email: addMemberEmail, role: addMemberRole || 'Viewer' });
      setAddMemberEmail('');
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  if (loading) return <div style={{ padding: '60px 32px', color: 'var(--text-muted)' }}>Loading team...</div>;
  if (!team) return <div style={{ padding: '32px' }}>Team not found</div>;

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div style={s.page}>
      <div style={s.back} onClick={() => navigate('/teams')}>← Teams</div>

      <div style={s.header}>
        <div>
          <h1 style={s.h1}>{team.name}</h1>
          {team.description && <p style={s.desc}>{team.description}</p>}
          <div style={s.permPills}>
            {userPermissions.map(p => (
              <span key={p} style={s.permPill}>{p}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            ...s.roleBadge,
            background: team.role === 'Admin' ? 'var(--accent-dim)' : 'rgba(120,120,160,0.15)',
            color: team.role === 'Admin' ? 'var(--accent-bright)' : 'var(--text-muted)',
          }}>{team.role}</div>

          {/* DYNAMIC RBAC: Create Task Button hidden if no CREATE_TASK permission */}
          {canCreateTask && (
            <button style={s.btn} onClick={() => setShowTaskModal(true)}>+ Task</button>
          )}
        </div>
      </div>

      <div style={s.tabs}>
        {['board', 'members'].map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'board' ? '⬡ Board' : `◈ Members (${team.members?.length || 0})`}
          </button>
        ))}
      </div>

      {tab === 'board' && (
        <div style={s.columns}>
          {STATUSES.map(status => {
            const colTasks = tasksByStatus(status);
            return (
              <div key={status} style={s.col}>
                <div style={s.colHeader}>
                  <span style={{ ...s.colTitle, color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>
                  <span style={s.colCount}>{colTasks.length}</span>
                </div>
                {colTasks.map(task => {
                  const isAssignee = task.assigned_to === user?.id || task.assignedTo === user?.id;
                  const canEditThis = canEditTask || isAssignee;

                  return (
                    <div
                      key={task.id}
                      style={s.taskCard}
                      onMouseEnter={e => canEditThis && (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                      onClick={() => canEditThis && setEditTask(task)}
                    >
                      <div style={s.taskTitle}>{task.title}</div>
                      <div style={s.taskMeta}>
                        <span style={{ ...s.badge, background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority] }}>
                          {task.priority}
                        </span>
                        {task.assigned_to_name && (
                          <span style={{ ...s.badge, background: 'var(--accent-dim)', color: 'var(--accent-bright)' }}>
                            {task.assigned_to_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span style={{ fontSize: '11px', color: new Date(task.due_date) < new Date() && task.status !== 'done' ? 'var(--red)' : 'var(--text-muted)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>
                            {task.due_date}
                          </span>
                        )}
                      </div>

                      {/* DYNAMIC RBAC: Delete button hidden if no DELETE_TASK permission */}
                      {canDeleteTask && (
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                            onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}
                            title="Delete Task"
                          >✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'members' && (
        <div style={{ maxWidth: '560px' }}>
          {/* DYNAMIC RBAC: Add member form hidden if no MANAGE_MEMBERS permission */}
          {canManageMembers && (
            <div style={{ marginBottom: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>ADD MEMBER</div>
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '10px' }}>
                <input style={{ ...s.input, flex: 1 }} type="email" value={addMemberEmail} onChange={e => setAddMemberEmail(e.target.value)} placeholder="member@email.com" required />
                <select style={{ ...s.roleSelect, flexShrink: 0 }} value={addMemberRole} onChange={e => setAddMemberRole(e.target.value)}>
                  {availableRoles.length > 0 ? (
                    availableRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                  ) : (
                    <>
                      <option value="Viewer">Viewer</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </>
                  )}
                </select>
                <button type="submit" style={{ ...s.btn, opacity: addingMember ? 0.6 : 1 }} disabled={addingMember}>Add</button>
              </form>
            </div>
          )}

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            {team.members?.map(m => (
              <div key={m.id} style={s.memberRow}>
                <div style={s.avatar}>{m.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{m.email}</div>
                </div>

                {/* DYNAMIC RBAC: Role assignment dropdown */}
                {canAssignRole && m.id !== user?.id ? (
                  <select
                    style={s.roleSelect}
                    value={m.role}
                    onChange={e => handleRoleChange(m.id, e.target.value)}
                  >
                    {availableRoles.length > 0 ? (
                      availableRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                    ) : (
                      <>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Viewer">Viewer</option>
                      </>
                    )}
                  </select>
                ) : (
                  <div style={{
                    fontSize: '10px', fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: m.role === 'Admin' ? 'var(--accent-dim)' : 'rgba(120,120,160,0.15)',
                    color: m.role === 'Admin' ? 'var(--accent-bright)' : 'var(--text-muted)',
                  }}>{m.role}</div>
                )}

                {canManageMembers && m.id !== user?.id && (
                  <button style={s.removeBtn} onClick={() => handleRemoveMember(m.id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(showTaskModal || editTask) && (
        <TaskModal
          team={team}
          members={team.members || []}
          task={editTask}
          canEditTask={canEditTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSaved={() => { setShowTaskModal(false); setEditTask(null); loadAll(); }}
        />
      )}
    </div>
  );
}
