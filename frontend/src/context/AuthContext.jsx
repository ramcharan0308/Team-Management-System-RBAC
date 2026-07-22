import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [userTeams, setUserTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserTeams = useCallback(async () => {
    try {
      const res = await api.get('/teams');
      setUserTeams(res.data || []);
    } catch {
      setUserTeams([]);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(r => {
          setUser(r.data);
          localStorage.setItem('user', JSON.stringify(r.data));
          fetchUserTeams();
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setUserTeams([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUserTeams]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    fetchUserTeams();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserTeams([]);
  };

  const userRoles = userTeams.map(t => t.role);
  const isAdmin = userRoles.some(r => /^Admin$/i.test(r));
  const isManager = userRoles.some(r => /^Manager$/i.test(r));
  const isViewerOnly = userTeams.length > 0 && !isAdmin && !isManager;
  // System Governance (Users, Roles, Permissions) requires Admin privileges
  const canAccessAdminPages = isAdmin;

  const hasPermission = (permName) => {
    if (isAdmin) return true;
    if (!userTeams || userTeams.length === 0) return true;
    return userTeams.some(t => t.permissions && t.permissions.includes(permName));
  };

  return (
    <AuthContext.Provider value={{
      user,
      userTeams,
      isAdmin,
      isManager,
      isViewerOnly,
      canAccessAdminPages,
      hasPermission,
      login,
      logout,
      loading,
      refetchTeams: fetchUserTeams
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
