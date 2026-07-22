import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, Layers, Building2, ArrowUpRight, TrendingUp, BarChart3, PieChart as PieIcon, Plus, UserPlus } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { toTitleCase } from '../components/Layout';

const STATUS_COLORS = { todo: '#64748b', inprogress: '#2563eb', done: '#22c55e' };
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Completed' };

const containerVar = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, duration: 0.2 } }
};

const itemVar = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', paddingTop: '60px', textAlign: 'center', fontWeight: 500 }}>Loading dashboard analytics...</div>;

  const formattedUserName = toTitleCase(user?.name);
  const byStatus = data?.byStatus || [];
  const statusMap = Object.fromEntries(byStatus.map(s => [s.status, s.count]));
  const pieData = ['todo', 'inprogress', 'done'].map(k => ({ name: STATUS_LABELS[k], value: statusMap[k] || 0, key: k }));
  const totalPieTasks = pieData.reduce((acc, curr) => acc + curr.value, 0);
  const teamsList = data?.teams || data?.projects || [];
  const tasksByUser = data?.tasksByUser || [];

  return (
    <motion.div variants={containerVar} initial="hidden" animate="show" style={{ maxWidth: '1200px' }}>
      
      {/* Header Greeting */}
      <motion.div variants={itemVar} style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Welcome back, {formattedUserName} 👋
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>
          Real-time metrics and team statistics across your authorized workspaces.
        </p>
      </motion.div>

      {/* KPI Stats Grid */}
      <motion.div variants={itemVar} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        
        {/* Total Tasks Card */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
          style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #2563eb, #06b6d4)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>TOTAL TASKS</span>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(6,182,212,0.12))', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={26} />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{data?.totalTasks ?? 0}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--primary)', marginTop: '14px', fontWeight: 600 }}>
            <TrendingUp size={14} /> Active workspace action items
          </div>
        </motion.div>

        {/* In Progress Card */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
          style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>IN PROGRESS</span>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(6,182,212,0.12))', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={26} />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{statusMap.inprogress || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '14px', fontWeight: 500 }}>Active execution state</div>
        </motion.div>

        {/* Completed Card */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
          style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #22c55e, #10b981)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>COMPLETED</span>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.12))', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={26} />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>{statusMap.done || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--success-text)', marginTop: '14px', fontWeight: 600 }}>Resolved successfully</div>
        </motion.div>

        {/* Overdue Card */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
          style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #ef4444, #f43f5e)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>OVERDUE</span>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(244,63,94,0.12))', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={26} />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: data?.overdueCount > 0 ? 'var(--danger)' : 'var(--text-muted)', lineHeight: 1 }}>{data?.overdueCount ?? 0}</div>
          <div style={{ fontSize: '12px', color: data?.overdueCount > 0 ? 'var(--danger-text)' : 'var(--text-muted)', marginTop: '14px', fontWeight: 500 }}>Requires attention</div>
        </motion.div>

      </motion.div>

      {/* Analytics Charts Grid */}
      <motion.div variants={itemVar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        
        {/* Tasks by Status Chart Card */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Tasks by Status</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 500 }}>Status Breakdown</span>
          </div>

          {totalPieTasks === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
              <PieIcon size={38} color="#94a3b8" style={{ marginBottom: '12px', opacity: 0.8 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No task activity yet</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center', maxWidth: '300px', fontWeight: 400 }}>
                Create your first team workspace and assign tasks to visualize status breakdown.
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/teams')}
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-xs)' }}
              >
                <Plus size={14} /> Create Team
              </motion.button>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4}>
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                {pieData.map(d => (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: STATUS_COLORS[d.key] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Task Workload Distribution Chart Card */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Task Distribution per User</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 500 }}>Workload Allocation</span>
          </div>

          {tasksByUser.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
              <BarChart3 size={38} color="#94a3b8" style={{ marginBottom: '12px', opacity: 0.8 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No workload data yet</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center', maxWidth: '300px', fontWeight: 400 }}>
                Assign team tasks to active members to track individual workloads.
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/users')}
                style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-xs)' }}
              >
                <UserPlus size={14} /> Invite Users
              </motion.button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tasksByUser} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 500 }} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', fontSize: '12px', fontWeight: 500 }} />
                <Bar dataKey="task_count" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </motion.div>

      {/* Teams & Overdue Lists */}
      <motion.div variants={itemVar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Teams List Card */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Your Teams ({teamsList.length})</span>
            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => navigate('/teams')}>
              View All <ArrowUpRight size={14} />
            </span>
          </div>

          {teamsList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
              <Building2 size={36} color="#94a3b8" style={{ marginBottom: '10px', opacity: 0.8 }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No teams joined yet</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 400 }}>Create a team workspace to start collaborating.</div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/teams')}
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-xs)' }}
              >
                <Plus size={14} /> Create Team
              </motion.button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teamsList.map(t => (
                <div
                  key={t.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onClick={() => navigate(`/teams/${t.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{t.name}</div>
                      {t.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>{t.description}</div>}
                    </div>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks Card */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--danger-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Overdue Tasks ({data?.overdueTasks?.length || 0})
          </div>

          {(!data?.overdueTasks || data.overdueTasks.length === 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 20px' }}>
              <CheckCircle2 size={36} color="var(--success)" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>No overdue tasks</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>All assigned action items are on track!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.overdueTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{t.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--danger-text)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                      {t.team_name || t.project_name} · Due {t.due_date || t.dueDate}
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: '20px', background: '#ffffff', color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </motion.div>

    </motion.div>
  );
}
