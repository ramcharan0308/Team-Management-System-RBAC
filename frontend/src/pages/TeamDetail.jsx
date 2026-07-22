import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Users, LayoutGrid, Trash2, UserPlus, Shield, Calendar, X } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'inprogress', 'done'];
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Completed' };
const STATUS_COLORS = { todo: '#64748b', inprogress: '#2563eb', done: '#22c55e' };
const PRIORITY_COLORS = { low: '#15803d', medium: '#b45309', high: '#b91c1c' };
const PRIORITY_BG = { low: '#f0fdf4', medium: '#fffbeb', high: '#fef2f2' };

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{task ? 'Edit Task' : 'Create Task'}</h2>
          <button style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          {(canEditTask || !task) && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>TITLE</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '14px' }} type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required disabled={task && !canEditTask} placeholder="Task title..." />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>DESCRIPTION</label>
                <textarea style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '14px', minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>PRIORITY</label>
                  <select style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '14px' }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>DUE DATE</label>
                  <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '14px' }} type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>ASSIGNEE</label>
                <select style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '14px' }} value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                </select>
              </div>
            </>
          )}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>STATUS</label>
            <select style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '14px' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Completed</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={onClose}>Cancel</button>
            <button type="submit" style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }} disabled={saving}>
              {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
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

  if (loading) return <div style={{ color: 'var(--text-muted)', paddingTop: '60px', textAlign: 'center' }}>Loading team workspace...</div>;
  if (!team) return <div style={{ padding: '32px' }}>Team not found</div>;

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div style={{ maxWidth: '1150px' }}>
      {/* Back Button */}
      <div
        onClick={() => navigate('/teams')}
        style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <ArrowLeft size={16} /> Back to Teams
      </div>

      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{team.name}</h1>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: 700, background: team.role === 'Admin' ? 'var(--primary-light)' : 'var(--border-light)', color: team.role === 'Admin' ? 'var(--primary)' : 'var(--text-muted)' }}>
              {team.role} Role
            </span>
          </div>
          {team.description && <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{team.description}</p>}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
            {userPermissions.map(p => (
              <span key={p} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: '4px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic RBAC Button */}
        {canCreateTask && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowTaskModal(true)}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}
          >
            <Plus size={16} /> New Task
          </motion.button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#ffffff', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content', boxShadow: 'var(--shadow-xs)' }}>
        <button
          onClick={() => setTab('board')}
          style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', background: tab === 'board' ? 'var(--primary)' : 'transparent', color: tab === 'board' ? '#ffffff' : 'var(--text-muted)' }}
        >
          <LayoutGrid size={16} /> Kanban Board
        </button>
        <button
          onClick={() => setTab('members')}
          style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', background: tab === 'members' ? 'var(--primary)' : 'transparent', color: tab === 'members' ? '#ffffff' : 'var(--text-muted)' }}
        >
          <Users size={16} /> Members ({team.members?.length || 0})
        </button>
      </div>

      {/* Tab 1: KANBAN BOARD */}
      {tab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {STATUSES.map(status => {
            const colTasks = tasksByStatus(status);
            return (
              <div key={status} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', minHeight: '400px', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[status] }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{STATUS_LABELS[status]}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '20px' }}>{colTasks.length}</span>
                </div>

                {colTasks.map(task => {
                  const isAssignee = task.assigned_to === user?.id || task.assignedTo === user?.id;
                  const canEditThis = canEditTask || isAssignee;

                  return (
                    <motion.div
                      key={task.id}
                      whileHover={canEditThis ? { y: -2 } : {}}
                      style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '12px', cursor: canEditThis ? 'pointer' : 'default', transition: 'border-color 0.2s' }}
                      onClick={() => canEditThis && setEditTask(task)}
                      onMouseEnter={e => canEditThis && (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.4 }}>{task.title}</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority], textTransform: 'uppercase' }}>
                          {task.priority}
                        </span>
                        {task.assigned_to_name && (
                          <span style={{ fontSize: '11px', background: '#ffffff', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '20px', color: 'var(--text-main)', fontWeight: 500 }}>
                            👤 {task.assigned_to_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span style={{ fontSize: '11px', color: new Date(task.due_date) < new Date() && task.status !== 'done' ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {task.due_date}
                          </span>
                        )}
                      </div>

                      {canDeleteTask && (
                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }}
                            style={{ cursor: 'pointer', color: 'var(--danger)', opacity: 0.7, padding: '2px' }}
                            title="Delete Task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: MEMBERS MANAGEMENT */}
      {tab === 'members' && (
        <div style={{ maxWidth: '640px' }}>
          {canManageMembers && (
            <div style={{ marginBottom: '24px', background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>INVITE TEAM MEMBER</div>
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '12px' }}>
                <input style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px' }} type="email" value={addMemberEmail} onChange={e => setAddMemberEmail(e.target.value)} placeholder="colleague@company.com" required />
                <select style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }} value={addMemberRole} onChange={e => setAddMemberRole(e.target.value)}>
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
                <button type="submit" style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: addingMember ? 0.7 : 1 }} disabled={addingMember}>
                  <UserPlus size={16} /> Add
                </button>
              </form>
            </div>
          )}

          <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>Team Roster & Roles</div>
            {team.members?.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.email}</div>
                </div>

                {canAssignRole && m.id !== user?.id ? (
                  <select
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600 }}
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
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: 700, background: m.role === 'Admin' ? 'var(--primary-light)' : 'var(--border-light)', color: m.role === 'Admin' ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {m.role}
                  </span>
                )}

                {canManageMembers && m.id !== user?.id && (
                  <button onClick={() => handleRemoveMember(m.id)} style={{ cursor: 'pointer', color: 'var(--danger)', padding: '6px', background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)' }} title="Remove member">
                    <Trash2 size={16} />
                  </button>
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
