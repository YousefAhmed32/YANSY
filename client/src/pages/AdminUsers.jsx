import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, UserPlus, Edit, Trash2, Users, UserCheck,
  TrendingUp, Clock, Shield, ChevronLeft, ChevronRight,
  X, Eye, Activity
} from 'lucide-react';
import api from '../utils/api';
import ClientProfilePanel from '../components/ClientProfilePanel';
import { useLanguage } from '../contexts/LanguageContext';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  text:      '#0D1117',
  textMuted: '#6B7280',
  hoverBg:   'rgba(0,0,0,0.02)',
  activeRow: 'rgba(37,99,235,0.04)',
};

const getInitials = (user) => {
  if (user.fullName) return user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (user.email)    return user.email.slice(0, 2).toUpperCase();
  return 'U';
};
const getDisplayName = (user) => user.fullName || user.email || 'Unknown';
const formatDate = (d) => d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const relativeTime = (d) => {
  if (!d) return 'Never';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`;
  return formatDate(d);
};

const StatCard = ({ icon: Icon, label, value, sub, highlight }) => (
  <div style={{
    padding: '18px 20px',
    background: highlight ? 'rgba(37,99,235,0.06)' : TK.surface,
    border: `1px solid ${highlight ? 'rgba(37,99,235,0.2)' : TK.border}`,
    borderRadius: '10px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px',
        background: highlight ? 'rgba(37,99,235,0.1)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${highlight ? 'rgba(37,99,235,0.2)' : TK.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: '15px', height: '15px', color: highlight ? TK.accent : TK.textMuted }} />
      </div>
      {highlight && (
        <div style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(37,99,235,0.7)', padding: '2px 7px', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '4px' }}>
          Live
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: '1.75rem', fontWeight: 600, color: highlight ? TK.accent : TK.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '10px', color: TK.textMuted, letterSpacing: '0.08em', marginTop: '4px', textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: highlight ? 'rgba(37,99,235,0.6)' : TK.textMuted, marginTop: '3px' }}>{sub}</div>}
    </div>
  </div>
);

const Avatar = ({ user, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: user.role === 'ADMIN'
      ? 'linear-gradient(135deg,rgba(37,99,235,0.15),rgba(37,99,235,0.05))'
      : 'linear-gradient(135deg,rgba(0,0,0,0.07),rgba(0,0,0,0.03))',
    border: `1px solid ${user.role === 'ADMIN' ? 'rgba(37,99,235,0.3)' : TK.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.32, fontWeight: 400,
    color: user.role === 'ADMIN' ? TK.accent : TK.textMuted,
    letterSpacing: '0.03em', userSelect: 'none',
    fontFamily: "'Inter',system-ui,sans-serif",
  }}>
    {getInitials(user)}
  </div>
);

const OnlineDot = ({ lastLogin }) => {
  const mins = lastLogin ? Math.floor((Date.now() - new Date(lastLogin)) / 60000) : Infinity;
  const online = mins < 30;
  const recent = mins < 1440;
  const color  = online ? '#4ade80' : recent ? TK.accent : 'rgba(0,0,0,0.15)';
  return (
    <span style={{
      display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
      background: color, flexShrink: 0,
      boxShadow: online ? `0 0 5px ${color}` : 'none',
    }} title={online ? 'Online' : recent ? 'Active recently' : 'Inactive'} />
  );
};

const AdminUsers = () => {
  const { t }     = useTranslation();
  const { isRTL } = useLanguage?.() || { isRTL: false };

  const [users,            setUsers]            = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [page,             setPage]             = useState(1);
  const [totalPages,       setTotalPages]       = useState(1);
  const [total,            setTotal]            = useState(0);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [roleFilter,       setRoleFilter]       = useState('ALL');
  const [hoveredRow,       setHoveredRow]       = useState(null);
  const [deleteConfirm,    setDeleteConfirm]    = useState(null);

  useEffect(() => { fetchUsers(); }, [page, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: { page, limit: 15, search: searchTerm || undefined, role: roleFilter !== 'ALL' ? roleFilter : undefined },
      });
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || res.data.users?.length || 0);
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      admins:   users.filter(u => u.role === 'ADMIN').length,
      active7:  users.filter(u => u.lastLogin && (now - new Date(u.lastLogin)) < 7 * 86400000).length,
      active30: users.filter(u => u.lastLogin && (now - new Date(u.lastLogin)) < 30 * 86400000).length,
      never:    users.filter(u => !u.lastLogin).length,
    };
  }, [users]);

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  if (loading && users.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.15)', borderTopColor: TK.accent, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .usr-input::placeholder { color: ${TK.textMuted}; opacity: 0.6; }
        .usr-input:focus { outline: none; }
        .filter-btn:hover { border-color: rgba(37,99,235,0.4) !important; color: #2563EB !important; }
        .action-btn:hover { color: #2563EB !important; }
        .del-btn:hover { color: #f87171 !important; }
        .page-btn:hover:not(:disabled) { border-color: rgba(37,99,235,0.4) !important; color: #2563EB !important; }
        .name-btn:hover { color: #2563EB !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      `}</style>

      <div style={{ padding: '32px 32px 48px', fontFamily: "'Inter',system-ui,sans-serif", direction: isRTL ? 'rtl' : 'ltr', maxWidth: '1400px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)', marginBottom: '10px' }}>
              <Users style={{ width: '9px', height: '9px', color: TK.accent }} />
              <span style={{ fontSize: '9px', fontWeight: 500, color: TK.accent, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Admin Panel</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 600, letterSpacing: '-0.01em', color: TK.text, fontFamily: "'Inter',system-ui,sans-serif", lineHeight: 1, margin: 0 }}>
              {t('users.title', 'Users')}
            </h1>
            <p style={{ fontSize: '12px', color: TK.textMuted, marginTop: '8px', fontWeight: 300 }}>
              {total} {t('users.allUsers', 'registered users')}
            </p>
          </div>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'transparent', border: `1px solid rgba(37,99,235,0.4)`, borderRadius: '8px', color: TK.accent, fontSize: '11px', fontWeight: 300, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = TK.accent; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TK.accent; }}
          >
            <UserPlus style={{ width: '14px', height: '14px' }} />
            {t('users.createUser', 'Add User')}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          <StatCard icon={Users}      label="Total Users"     value={total}          sub={`Page ${page}/${totalPages}`} highlight />
          <StatCard icon={Shield}     label="Admins"          value={stats.admins}   sub="Full access" />
          <StatCard icon={Activity}   label="Active 7 days"   value={stats.active7}  sub="Recent activity" highlight />
          <StatCard icon={TrendingUp} label="Active 30 days"  value={stats.active30} sub="Monthly actives" />
          <StatCard icon={Clock}      label="Never logged in"  value={stats.never}   sub="Awaiting login" />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div
            style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '8px', padding: '10px 16px', transition: 'border-color 0.2s' }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)'}
            onBlurCapture={e  => e.currentTarget.style.borderColor = TK.border}
          >
            <Search style={{ width: '14px', height: '14px', color: TK.textMuted, flexShrink: 0 }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder={t('common.search', 'Search by name or email…')}
              className="usr-input"
              style={{ flex: 1, background: 'transparent', border: 'none', color: TK.text, fontSize: '13px', fontFamily: 'inherit', fontWeight: 300 }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, padding: 0 }}>
                <X style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>
          {['ALL', 'USER', 'ADMIN'].map(role => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(1); }}
              className="filter-btn"
              style={{
                padding: '9px 16px',
                background: roleFilter === role ? 'rgba(37,99,235,0.08)' : 'transparent',
                border: `1px solid ${roleFilter === role ? 'rgba(37,99,235,0.4)' : TK.border}`,
                borderRadius: '8px',
                color: roleFilter === role ? TK.accent : TK.textMuted,
                fontSize: '10px', fontWeight: 300,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.18s',
                fontFamily: 'inherit',
              }}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${TK.border}` }}>
                  {[
                    { label: t('common.name', 'User'),           w: '28%' },
                    { label: t('common.email', 'Email'),         w: '22%' },
                    { label: t('users.role', 'Role'),            w: '10%' },
                    { label: 'Status',                           w: '12%' },
                    { label: t('users.lastLogin', 'Last Active'),w: '16%' },
                    { label: t('common.actions', 'Actions'),     w: '12%', align: 'right' },
                  ].map((col) => (
                    <th key={col.label} style={{ padding: '12px 20px', textAlign: col.align || (isRTL ? 'right' : 'left'), fontSize: '9px', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: TK.textMuted, fontFamily: 'inherit', width: col.w }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '56px', textAlign: 'center', color: TK.textMuted, fontSize: '12px', letterSpacing: '0.1em' }}>
                      No users found
                    </td>
                  </tr>
                ) : users.map((user) => {
                  const isHovered = hoveredRow === user._id;
                  const isActive  = selectedClientId === user._id;
                  return (
                    <tr
                      key={user._id}
                      onMouseEnter={() => setHoveredRow(user._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: isActive ? TK.activeRow : isHovered ? TK.hoverBg : 'transparent', borderBottom: `1px solid ${TK.border}`, transition: 'background 0.15s' }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative' }}>
                            <Avatar user={user} size={36} />
                            <span style={{ position: 'absolute', bottom: '1px', right: '1px' }}>
                              <OnlineDot lastLogin={user.lastLogin} />
                            </span>
                          </div>
                          <div>
                            <button
                              onClick={() => setSelectedClientId(user._id)}
                              className="name-btn"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.text, fontSize: '13px', fontWeight: 300, fontFamily: 'inherit', letterSpacing: '0.02em', textAlign: isRTL ? 'right' : 'left', transition: 'color 0.18s', padding: 0, display: 'block' }}
                            >
                              {getDisplayName(user)}
                            </button>
                            <span style={{ fontSize: '10px', color: TK.textMuted }}>
                              Joined {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '12px', color: TK.textMuted }}>{user.email}</span>
                        {user.emailVerified === false && <span style={{ display: 'block', fontSize: '9px', color: '#f59e0b', marginTop: 2, letterSpacing: '0.08em' }}>Unverified</span>}
                        {user.emailVerified === true  && <span style={{ display: 'block', fontSize: '9px', color: '#34d399', marginTop: 2, letterSpacing: '0.08em' }}>Verified</span>}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', fontSize: '9px', fontWeight: 300,
                          letterSpacing: '0.15em', textTransform: 'uppercase',
                          background: user.role === 'ADMIN' ? 'rgba(37,99,235,0.08)' : 'rgba(0,0,0,0.04)',
                          border: `1px solid ${user.role === 'ADMIN' ? 'rgba(37,99,235,0.25)' : TK.border}`,
                          color: user.role === 'ADMIN' ? TK.accent : TK.textMuted,
                          borderRadius: '4px',
                        }}>
                          {user.role === 'ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        {(() => {
                          const mins = user.lastLogin ? Math.floor((Date.now() - new Date(user.lastLogin)) / 60000) : Infinity;
                          const label = mins < 30 ? 'Online' : mins < 1440 ? 'Recent' : mins < 10080 ? 'This week' : 'Inactive';
                          const color = mins < 30 ? '#4ade80' : mins < 1440 ? TK.accent : TK.textMuted;
                          return (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: mins < 30 ? `0 0 5px ${color}` : 'none' }} />
                              <span style={{ fontSize: '11px', color, letterSpacing: '0.05em' }}>{label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '11px', color: TK.textMuted }}>{relativeTime(user.lastLogin)}</span>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: isRTL ? 'left' : 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <button onClick={() => setSelectedClientId(user._id)} className="action-btn" title="View profile" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textMuted, transition: 'color 0.15s' }}>
                            <Eye style={{ width: '14px', height: '14px' }} />
                          </button>
                          <button className="action-btn" title="Edit user" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textMuted, transition: 'color 0.15s' }}>
                            <Edit style={{ width: '13px', height: '13px' }} />
                          </button>
                          <button onClick={() => setDeleteConfirm(user._id)} className="del-btn" title="Delete user" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textMuted, transition: 'color 0.15s' }}>
                            <Trash2 style={{ width: '13px', height: '13px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${TK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: TK.textMuted }}>
              Showing {users.length} of {total} users
              {roleFilter !== 'ALL' && ` · filtered by ${roleFilter}`}
              {searchTerm && ` · "${searchTerm}"`}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn"
                  style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'transparent', border: `1px solid ${TK.border}`, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textMuted, opacity: page === 1 ? 0.3 : 1, transition: 'all 0.18s' }}>
                  <ChevronLeft style={{ width: '14px', height: '14px' }} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: '32px', height: '32px', borderRadius: '6px', background: page === p ? 'rgba(37,99,235,0.1)' : 'transparent', border: `1px solid ${page === p ? 'rgba(37,99,235,0.4)' : TK.border}`, cursor: 'pointer', color: page === p ? TK.accent : TK.textMuted, fontSize: '12px', fontWeight: page === p ? 500 : 300, fontFamily: 'inherit', transition: 'all 0.18s' }}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn"
                  style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'transparent', border: `1px solid ${TK.border}`, cursor: page === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textMuted, opacity: page === totalPages ? 0.3 : 1, transition: 'all 0.18s' }}>
                  <ChevronRight style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setDeleteConfirm(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px', padding: '32px', width: '360px', maxWidth: '90vw', animation: 'popIn 0.2s ease-out', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trash2 style={{ width: '20px', height: '20px', color: '#f87171' }} />
            </div>
            <h3 style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 400, color: TK.text, marginBottom: '8px', fontFamily: "'Inter',system-ui,sans-serif" }}>
              Delete User?
            </h3>
            <p style={{ textAlign: 'center', fontSize: '12px', color: TK.textMuted, marginBottom: '24px', lineHeight: 1.6 }}>
              This action cannot be undone. The user and all their data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${TK.border}`, borderRadius: '8px', cursor: 'pointer', color: TK.textMuted, fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'inherit', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = TK.text; e.currentTarget.style.color = TK.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                style={{ flex: 1, padding: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', cursor: 'pointer', color: '#f87171', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'inherit', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedClientId && (
        <ClientProfilePanel clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />
      )}
    </>
  );
};

export default AdminUsers;
