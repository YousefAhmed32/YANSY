import { useEffect, useState, useCallback } from 'react';
import { Shield, ChevronDown, RefreshCw, Users, UserCheck, Star, Crown, Search, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'USER',        label: 'User',        icon: Users,     color: '#6b7280', description: 'Standard client access' },
  { value: 'MANAGER',     label: 'Manager',     icon: UserCheck, color: '#60a5fa', description: 'Can view all projects and users' },
  { value: 'ADMIN',       label: 'Admin',       icon: Star,      color: '#d4af37', description: 'Full platform management' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', icon: Crown,     color: '#a78bfa', description: 'Unrestricted access' },
];

const PERMISSIONS = {
  USER:        ['projects.view.own'],
  MANAGER:     ['projects.view.all', 'projects.edit', 'users.view', 'billing.view', 'settings.view', 'audit.view'],
  ADMIN:       ['projects.view.all', 'projects.edit', 'projects.delete', 'users.view', 'users.edit', 'users.delete', 'users.export', 'billing.view', 'billing.manage', 'settings.view', 'settings.edit', 'ai.configure', 'audit.view', 'feedback.manage', 'notifications.broadcast'],
  SUPER_ADMIN: ['All permissions including users.impersonate, system.configure'],
};

const RoleDropdown = ({ currentRole, userId, onChanged, isSelf, isDark }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const cfg = ROLES.find(r => r.value === currentRole) || ROLES[0];
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const surface = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  if (isSelf) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '8px', background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, color: cfg.color, fontSize: '11px', fontWeight: 300 }}>
        <cfg.icon size={11} />
        {cfg.label}
      </span>
    );
  }

  const changeRole = async (newRole) => {
    setOpen(false);
    if (newRole === currentRole) return;
    setSaving(true);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      onChanged(userId, newRole);
      toast.success(`Role changed to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: `${cfg.color}12`, border: `1px solid ${cfg.color}30`, color: cfg.color, fontSize: '11px', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
      >
        {saving ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <cfg.icon size={11} />}
        {cfg.label}
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 10, background: isDark ? '#1a1a16' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, borderRadius: '10px', overflow: 'hidden', minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            {ROLES.map(role => (
              <button
                key={role.value}
                onClick={() => changeRole(role.value)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', width: '100%', textAlign: 'left', background: role.value === currentRole ? surface : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = surface; }}
                onMouseLeave={e => { if (role.value !== currentRole) e.currentTarget.style.background = 'transparent'; }}
              >
                <role.icon size={13} style={{ color: role.color }} />
                <div>
                  <div style={{ fontSize: '12px', color: role.color, fontWeight: role.value === currentRole ? 400 : 300 }}>{role.label}</div>
                  <div style={{ fontSize: '10px', color: textMuted }}>{role.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AdminRoles = () => {
  const { isDark } = useTheme();
  const { user: me } = useSelector(s => s.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [total, setTotal] = useState(0);

  const bg       = isDark ? '#080806' : '#fafaf9';
  const surface  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const inputBg  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const gold     = '#d4af37';

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (search)     params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filterRole]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChanged = (userId, newRole) => {
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
  };

  const roleStats = ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.value).length }));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '28px', height: '28px', color: gold, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain, padding: '32px 32px 60px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)', marginBottom: '10px' }}>
            <Shield style={{ width: '10px', height: '10px', color: gold }} />
            <span style={{ fontSize: '10px', fontWeight: 400, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Access Control</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', color: textMain, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
            Role Management
          </h1>
          <p style={{ fontSize: '12px', color: textMuted, marginTop: '6px', fontWeight: 300 }}>
            {total} users · Assign roles and permissions
          </p>
        </div>
        <button onClick={() => fetchUsers(true)} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '8px', color: textMuted, fontSize: '11px', cursor: refreshing ? 'not-allowed' : 'pointer' }}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Role distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {roleStats.map(r => (
          <div key={r.value}
            onClick={() => setFilterRole(filterRole === r.value ? '' : r.value)}
            style={{ padding: '16px', background: filterRole === r.value ? `${r.color}15` : surface, border: `1px solid ${filterRole === r.value ? `${r.color}40` : border}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}
          >
            <r.icon size={18} style={{ color: r.color, margin: '0 auto 6px' }} />
            <div style={{ fontSize: '22px', fontWeight: 600, color: r.color, letterSpacing: '-0.02em' }}>{r.count}</div>
            <div style={{ fontSize: '10px', color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', background: inputBg, border: `1px solid ${border}`, borderRadius: '8px', color: textMain, fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Permissions info */}
      <div style={{ padding: '18px 22px', background: surface, border: `1px solid ${border}`, borderRadius: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>
          Permission Matrix
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {ROLES.map(r => (
            <div key={r.value}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <r.icon size={12} style={{ color: r.color }} />
                <span style={{ fontSize: '10px', fontWeight: 400, color: r.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.label}</span>
              </div>
              {(PERMISSIONS[r.value] || []).map(perm => (
                <div key={perm} style={{ fontSize: '10px', color: textMuted, padding: '2px 0', fontWeight: 300 }}>· {perm}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${border}` }}>
          <h2 style={{ fontSize: '11px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            Users · {users.length} shown
          </h2>
        </div>
        {users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <AlertCircle size={28} style={{ color: textMuted, margin: '0 auto 10px' }} />
            <p style={{ color: textMuted, fontSize: '12px', fontWeight: 300 }}>No users found.</p>
          </div>
        ) : (
          users.map((u, idx) => {
            const isSelf = u._id === me?._id;
            return (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 22px', borderBottom: idx < users.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.06))', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px', color: gold, fontWeight: 300 }}>
                  {u.fullName?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.fullName || 'User'} {isSelf && <span style={{ fontSize: '9px', color: gold }}>(you)</span>}
                  </div>
                  <div style={{ fontSize: '10px', color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <div style={{ fontSize: '10px', color: textMuted }}>{u.isActive ? 'Active' : <span style={{ color: '#f87171' }}>Suspended</span>}</div>
                <RoleDropdown currentRole={u.role} userId={u._id} onChanged={handleRoleChanged} isSelf={isSelf} isDark={isDark} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminRoles;
