import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  CheckSquare, 
  Building2, 
  LogOut, 
  ChevronRight,
  UserCircle,
  Plus,
  UserPlus,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)' },
  sidebar: {
    width: '260px', minHeight: '100vh', background: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--sidebar-border)', padding: '24px 16px',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '0 8px', marginBottom: '32px',
  },
  logoIcon: {
    width: '38px', height: '38px', borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)', flexShrink: 0,
  },
  logoText: { fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' },
  logoSub: { fontSize: '11px', color: 'var(--sidebar-text)', fontFamily: 'var(--font-sans)', fontWeight: 400 },
  sectionHeader: {
    fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b',
    letterSpacing: '1px', textTransform: 'uppercase', margin: '22px 10px 8px 10px', fontWeight: 600,
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    fontSize: '14px', fontWeight: 500, color: 'var(--sidebar-text)',
    transition: 'all 0.15s ease', cursor: 'pointer', textDecoration: 'none',
    marginBottom: '4px', position: 'relative',
  },
  navLinkActive: {
    color: '#ffffff', background: 'rgba(255, 255, 255, 0.08)', fontWeight: 600,
  },
  activeIndicator: {
    position: 'absolute', left: 0, top: '6px', bottom: '6px', width: '4px',
    borderRadius: '0 4px 4px 0', background: 'var(--primary)',
  },
  spacer: { flex: 1 },
  userContainer: {
    borderTop: '1px solid var(--sidebar-border)', paddingTop: '16px', marginTop: '16px',
  },
  userInfo: {
    padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)',
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0,
  },
  userName: { fontSize: '13px', fontWeight: 700, color: '#ffffff' },
  userEmail: { fontSize: '11px', color: 'var(--sidebar-text)', fontFamily: 'var(--font-mono)', fontWeight: 400 },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    fontSize: '13px', fontWeight: 600, color: '#fca5a5', cursor: 'pointer',
    background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
    width: '100%', transition: 'all 0.15s',
  },
  mainContent: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' },
  topHeader: {
    height: '70px', background: '#ffffff', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', flexShrink: 0,
  },
  pageTitle: { fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.4px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  dateBadge: {
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
    color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'var(--font-mono)',
  },
  userBadge: {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
    borderRadius: '20px', background: 'var(--primary-light)', border: '1px solid rgba(37,99,235,0.15)',
    fontSize: '12px', fontWeight: 600, color: 'var(--primary)',
  },
  actionBtn: {
    padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 700,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none',
    boxShadow: 'var(--shadow-xs)',
  },
  btnSecondary: {
    background: '#ffffff', color: 'var(--text-main)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xs)',
  },
};

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        ...s.navLink,
        ...(isActive ? s.navLinkActive : {}),
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeNav"
              style={s.activeIndicator}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          <Icon size={18} color={isActive ? '#38bdf8' : 'var(--sidebar-text)'} />
          <span style={{ flex: 1 }}>{label}</span>
          {isActive && <ChevronRight size={14} color="#38bdf8" />}
        </>
      )}
    </NavLink>
  );
}

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/teams': 'Team Workspaces',
  '/my-tasks': 'Personal Action Items',
  '/users': 'User Directory',
  '/roles': 'Role Matrix',
  '/permissions': 'Permission Keys',
  '/permission-viewer': 'Permission Resolution Inspection',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', description: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentTitle = PAGE_TITLES[location.pathname] || 
    (location.pathname.startsWith('/teams/') ? 'Team Detail Workspace' : 'Team Management System');

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedUserName = toTitleCase(user?.name);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/teams', teamForm);
      setShowTeamModal(false);
      setTeamForm({ name: '', description: '' });
      navigate('/teams');
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', userForm);
      setShowUserModal(false);
      setUserForm({ name: '', email: '', password: '' });
      navigate('/users');
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to invite user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.shell}>
      {/* 260px Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoIcon}>
            <ShieldCheck size={20} color="#ffffff" />
          </div>
          <div>
            <div style={s.logoText}>Team Manager</div>
            <div style={s.logoSub}>Role-Based Access Control</div>
          </div>
        </div>
        
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/teams" icon={Building2} label="Teams" />
        <NavItem to="/my-tasks" icon={CheckSquare} label="My Tasks" />

        <div style={s.sectionHeader}>RBAC Governance</div>
        <NavItem to="/users" icon={Users} label="Users" />
        <NavItem to="/roles" icon={ShieldCheck} label="Roles" />
        <NavItem to="/permissions" icon={KeyRound} label="Permissions" />
        <NavItem to="/permission-viewer" icon={Eye} label="Permission Viewer" />

        <div style={s.spacer} />
        
        <div style={s.userContainer}>
          <div style={s.userInfo}>
            <div style={s.avatar}>{formattedUserName?.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={s.userName}>{formattedUserName}</div>
              <div style={s.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main style={s.mainContent}>
        {/* Top Header Bar */}
        <div style={s.topHeader}>
          <div style={s.pageTitle}>{currentTitle}</div>

          <div style={s.headerRight}>
            <div style={s.dateBadge}>
              <CalendarIcon size={14} color="var(--primary)" /> {formattedDate}
            </div>

            <div style={s.userBadge}>
              <UserCircle size={15} /> {formattedUserName}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTeamModal(true)}
                style={{ ...s.actionBtn, ...s.btnPrimary }}
              >
                <Plus size={14} /> Create Team
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUserModal(true)}
                style={{ ...s.actionBtn, ...s.btnSecondary }}
              >
                <UserPlus size={14} /> Invite User
              </motion.button>
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>

      {/* Create Team Quick Action Modal */}
      {showTeamModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowTeamModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Create Team Workspace</h2>
              <button style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowTeamModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>TEAM NAME</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px', fontWeight: 500 }} type="text" value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Product Design" required autoFocus />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>DESCRIPTION (OPTIONAL)</label>
                <textarea style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px', minHeight: '80px', resize: 'vertical', fontWeight: 500 }} value={teamForm.description} onChange={e => setTeamForm(f => ({ ...f, description: e.target.value }))} placeholder="Team goals and responsibilities..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowTeamModal(false)}>Cancel</button>
                <button type="submit" style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Invite User Quick Action Modal */}
      {showUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowUserModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>Invite New User</h2>
              <button style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowUserModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>FULL NAME</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px', fontWeight: 500 }} type="text" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" required autoFocus />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>EMAIL ADDRESS</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px', fontWeight: 500 }} type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" required />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>INITIAL PASSWORD (OPTIONAL)</label>
                <input style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px', fontWeight: 500 }} type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }} disabled={saving}>
                  {saving ? 'Inviting...' : 'Invite User'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
