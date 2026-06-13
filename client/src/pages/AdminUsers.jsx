import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, UserPlus, Edit, Trash2, Users, UserCheck,
  TrendingUp, Clock, Shield, ChevronLeft, ChevronRight,
  Filter, X, Eye, MoreVertical, Activity
} from 'lucide-react';
import api from '../utils/api';
import { gsap } from 'gsap';
import ClientProfilePanel from '../components/ClientProfilePanel';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, gold, delay = 0 }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay }
      );
    }
  }, []);

  return (
    <div ref={ref} style={{
      background: gold ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${gold ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '4px',
      padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: '12px',
      opacity: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: gold ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${gold ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: '16px', height: '16px', color: gold ? '#d4af37' : 'rgba(255,255,255,0.5)' }} />
        </div>
        {gold && (
          <div style={{
            fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(212,175,55,0.6)', padding: '3px 8px',
            border: '1px solid rgba(212,175,55,0.2)', borderRadius: '2px',
          }}>
            Live
          </div>
        )}
      </div>
      <div>
        <div style={{
          fontSize: '2rem', fontWeight: 600, color: gold ? '#d4af37' : 'rgba(255,255,255,0.9)',
          fontFamily: "'Inter',system-ui,sans-serif", letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          {value}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: '4px' }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: '10px', color: 'rgba(212,175,55,0.5)', marginTop: '4px', letterSpacing: '0.05em' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: user.role === 'ADMIN'
      ? 'linear-gradient(135deg,rgba(212,175,55,0.3),rgba(212,175,55,0.08))'
      : 'linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))',
    border: `1px solid ${user.role === 'ADMIN' ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.1)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Inter',system-ui,sans-serif",
    fontSize: size * 0.32, fontWeight: 400,
    color: user.role === 'ADMIN' ? '#d4af37' : 'rgba(255,255,255,0.6)',
    letterSpacing: '0.05em', userSelect: 'none',
  }}>
    {getInitials(user)}
  </div>
);

// ── Online dot ────────────────────────────────────────────────────────────────
const OnlineDot = ({ lastLogin }) => {
  const mins = lastLogin ? Math.floor((Date.now() - new Date(lastLogin)) / 60000) : Infinity;
  const online  = mins < 30;
  const recent  = mins < 1440;
  const color   = online ? '#4ade80' : recent ? '#d4af37' : 'rgba(255,255,255,0.2)';
  return (
    <span style={{
      display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
      background: color, flexShrink: 0,
      boxShadow: online ? `0 0 6px ${color}` : 'none',
    }} title={online ? 'Online' : recent ? 'Active recently' : 'Inactive'} />
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AdminUsers = () => {
  const { t }      = useTranslation();
  const { isDark } = useTheme?.() || { isDark: true };
  const { isRTL }  = useLanguage?.() || { isRTL: false };

  const [users,           setUsers]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [page,            setPage]            = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [total,           setTotal]           = useState(0);
  const [selectedClientId,setSelectedClientId]= useState(null);
  const [roleFilter,      setRoleFilter]      = useState('ALL');   // ALL | ADMIN | USER
  const [hoveredRow,      setHoveredRow]      = useState(null);
  const [actionMenu,      setActionMenu]      = useState(null);    // userId
  const [deleteConfirm,   setDeleteConfirm]   = useState(null);    // userId

  const tableBodyRef = useRef(null);
  const statsRef     = useRef(null);
  const actionMenuRef= useRef(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => { fetchUsers(); }, [page, searchTerm, roleFilter]);

  useEffect(() => {
    const h = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target))
        setActionMenu(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: {
          page, limit: 15,
          search: searchTerm || undefined,
          role: roleFilter !== 'ALL' ? roleFilter : undefined,
        },
      });
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || res.data.users?.length || 0);
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  // ── Animate rows ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && tableBodyRef.current) {
      const rows = tableBodyRef.current.querySelectorAll('[data-row]');
      gsap.fromTo(rows,
        { opacity: 0, x: isRTL ? 12 : -12 },
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.04, ease: 'power3.out' }
      );
    }
  }, [loading, users]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const admins  = users.filter(u => u.role === 'ADMIN').length;
    const now     = Date.now();
    const active7 = users.filter(u => u.lastLogin && (now - new Date(u.lastLogin)) < 7 * 86400000).length;
    const active30= users.filter(u => u.lastLogin && (now - new Date(u.lastLogin)) < 30 * 86400000).length;
    const never   = users.filter(u => !u.lastLogin).length;
    return { admins, active7, active30, never };
  }, [users]);

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      setDeleteConfirm(null);
      setActionMenu(null);
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  // ── Tokens ────────────────────────────────────────────────────────────────
  const gold      = '#d4af37';
  const bg        = 'transparent';
  const border    = 'rgba(255,255,255,0.07)';
  const textMain  = 'rgba(255,255,255,0.9)';
  const textMuted = 'rgba(255,255,255,0.4)';
  const rowHover  = 'rgba(255,255,255,0.04)';
  const activeRow = 'rgba(212,175,55,0.05)';

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && users.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '1px solid rgba(212,175,55,0.15)', borderTop: `1px solid ${gold}`,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        
        .usr-input::placeholder { color: rgba(255,255,255,0.25); }
        .usr-input:focus { outline: none; }
        .filter-btn:hover { border-color: rgba(212,175,55,0.4) !important; color: #d4af37 !important; }
        .action-btn:hover { color: #d4af37 !important; }
        .del-btn:hover { color: #f87171 !important; }
        .page-btn:hover:not(:disabled) { border-color: rgba(212,175,55,0.4) !important; color: #d4af37 !important; }
        .name-btn:hover { color: #d4af37 !important; }
        .add-btn:hover { background: #d4af37 !important; color: #000 !important; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); border-radius: 2px; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      `}</style>

      <div style={{
        padding: '32px 32px 48px',
        fontFamily: "'Inter',system-ui,sans-serif",
        direction: isRTL ? 'rtl' : 'ltr',
        maxWidth: '1400px',
      }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.3em', color: `rgba(212,175,55,0.6)`, textTransform: 'uppercase', marginBottom: '6px' }}>
              Admin Panel
            </p>
            <h1 style={{
              fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 600,
              letterSpacing: '-0.01em', color: textMain,
              fontFamily: "'Inter',system-ui,sans-serif", lineHeight: 1,
            }}>
              {t('users.title', 'Users')}
            </h1>
            <p style={{ fontSize: '12px', color: textMuted, marginTop: '8px', letterSpacing: '0.05em' }}>
              {total} {t('users.allUsers', 'registered users')}
            </p>
          </div>

          <button
            className="add-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: 'transparent',
              border: `1px solid rgba(212,175,55,0.4)`,
              borderRadius: '4px',
              color: gold, fontSize: '11px', fontWeight: 300,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.25s',
              fontFamily: 'inherit',
            }}
          >
            <UserPlus style={{ width: '14px', height: '14px' }} />
            {t('users.createUser', 'Add User')}
          </button>
        </div>

        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
        }}>
          <StatCard icon={Users}     label="Total Users"    value={total}           sub={`Page ${page}/${totalPages}`} gold delay={0}    />
          <StatCard icon={Shield}    label="Admins"         value={stats.admins}    sub="With full access"             delay={0.08}  />
          <StatCard icon={Activity}  label="Active 7 days"  value={stats.active7}   sub="Recent activity"     gold delay={0.16} />
          <StatCard icon={TrendingUp}label="Active 30 days" value={stats.active30}  sub="Monthly actives"              delay={0.24}  />
          <StatCard icon={Clock}     label="Never logged in" value={stats.never}    sub="Awaiting first login"         delay={0.32}  />
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'center',
          marginBottom: '16px', flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{
            flex: 1, minWidth: '200px',
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${border}`,
            borderRadius: '4px', padding: '10px 16px',
            transition: 'border-color 0.2s',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'}
            onBlurCapture={e  => e.currentTarget.style.borderColor = border}
          >
            <Search style={{ width: '14px', height: '14px', color: textMuted, flexShrink: 0 }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder={t('common.search', 'Search by name or email…')}
              className="usr-input"
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: textMain, fontSize: '13px', fontFamily: 'inherit', fontWeight: 300,
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 0 }}>
                <X style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>

          {/* Role filter */}
          {['ALL', 'USER', 'ADMIN'].map(role => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(1); }}
              className="filter-btn"
              style={{
                padding: '9px 16px',
                background: roleFilter === role ? 'rgba(212,175,55,0.08)' : 'transparent',
                border: `1px solid ${roleFilter === role ? 'rgba(212,175,55,0.4)' : border}`,
                borderRadius: '4px',
                color: roleFilter === role ? gold : textMuted,
                fontSize: '10px', fontWeight: 300,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.18s',
                fontFamily: 'inherit',
              }}
            >
              {role}
            </button>
          ))}
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${border}`,
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {[
                    { label: t('common.name', 'User'),        w: '28%' },
                    { label: t('common.email', 'Email'),      w: '22%' },
                    { label: t('users.role', 'Role'),         w: '10%' },
                    { label: 'Status',                        w: '12%' },
                    { label: t('users.lastLogin', 'Last Active'), w: '16%' },
                    { label: t('common.actions', 'Actions'), w: '12%', align: 'right' },
                  ].map((col) => (
                    <th key={col.label} style={{
                      padding: '14px 20px',
                      textAlign: col.align || (isRTL ? 'right' : 'left'),
                      fontSize: '9px', fontWeight: 300,
                      letterSpacing: '0.25em', textTransform: 'uppercase',
                      color: textMuted, fontFamily: 'inherit',
                      width: col.w,
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody ref={tableBodyRef}>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: '56px', textAlign: 'center',
                      color: textMuted, fontSize: '12px', letterSpacing: '0.1em',
                    }}>
                      No users found
                    </td>
                  </tr>
                ) : users.map((user) => {
                  const isHovered = hoveredRow === user._id;
                  const isActive  = selectedClientId === user._id;
                  return (
                    <tr
                      key={user._id}
                      data-row
                      onMouseEnter={() => setHoveredRow(user._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        background: isActive ? activeRow : isHovered ? rowHover : 'transparent',
                        borderBottom: `1px solid ${border}`,
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* User */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative' }}>
                            <Avatar user={user} size={38} />
                            <span style={{
                              position: 'absolute', bottom: '1px', right: '1px',
                            }}>
                              <OnlineDot lastLogin={user.lastLogin} />
                            </span>
                          </div>
                          <div>
                            <button
                              onClick={() => setSelectedClientId(user._id)}
                              className="name-btn"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: textMain, fontSize: '13px', fontWeight: 300,
                                fontFamily: 'inherit', letterSpacing: '0.02em',
                                textAlign: isRTL ? 'right' : 'left',
                                transition: 'color 0.18s', padding: 0,
                                display: 'block',
                              }}
                            >
                              {getDisplayName(user)}
                            </button>
                            <span style={{ fontSize: '10px', color: textMuted, letterSpacing: '0.05em' }}>
                              Joined {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '12px', color: textMuted, letterSpacing: '0.02em' }}>
                          {user.email}
                        </span>
                        {user.emailVerified === false && (
                          <span style={{ display: 'block', fontSize: '9px', color: '#f59e0b', marginTop: 2, letterSpacing: '0.08em' }}>
                            Unverified
                          </span>
                        )}
                        {user.emailVerified === true && (
                          <span style={{ display: 'block', fontSize: '9px', color: '#34d399', marginTop: 2, letterSpacing: '0.08em' }}>
                            Verified
                          </span>
                        )}
                      </td>

                      {/* Role badge */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          fontSize: '9px', fontWeight: 300,
                          letterSpacing: '0.2em', textTransform: 'uppercase',
                          background: user.role === 'ADMIN' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${user.role === 'ADMIN' ? 'rgba(212,175,55,0.3)' : border}`,
                          color: user.role === 'ADMIN' ? gold : textMuted,
                          borderRadius: '2px',
                        }}>
                          {user.role === 'ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        {(() => {
                          const mins = user.lastLogin
                            ? Math.floor((Date.now() - new Date(user.lastLogin)) / 60000)
                            : Infinity;
                          const label = mins < 30   ? 'Online'
                                      : mins < 1440 ? 'Recent'
                                      : mins < 10080? 'This week'
                                      : 'Inactive';
                          const color = mins < 30   ? '#4ade80'
                                      : mins < 1440 ? gold
                                      : 'rgba(255,255,255,0.25)';
                          return (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0,
                                boxShadow: mins < 30 ? `0 0 5px ${color}` : 'none',
                              }} />
                              <span style={{ fontSize: '11px', color, letterSpacing: '0.05em' }}>{label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Last login */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '11px', color: textMuted, letterSpacing: '0.03em' }}>
                          {relativeTime(user.lastLogin)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: isRTL ? 'left' : 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <button
                            onClick={() => setSelectedClientId(user._id)}
                            className="action-btn"
                            title="View profile"
                            style={{
                              width: '30px', height: '30px', borderRadius: '50%',
                              background: 'transparent', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: textMuted, transition: 'color 0.15s',
                            }}
                          >
                            <Eye style={{ width: '14px', height: '14px' }} />
                          </button>
                          <button
                            className="action-btn"
                            title="Edit user"
                            style={{
                              width: '30px', height: '30px', borderRadius: '50%',
                              background: 'transparent', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: textMuted, transition: 'color 0.15s',
                            }}
                          >
                            <Edit style={{ width: '13px', height: '13px' }} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user._id)}
                            className="del-btn"
                            title="Delete user"
                            style={{
                              width: '30px', height: '30px', borderRadius: '50%',
                              background: 'transparent', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: textMuted, transition: 'color 0.15s',
                            }}
                          >
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

          {/* Table footer */}
          <div style={{
            padding: '12px 20px',
            borderTop: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '10px',
          }}>
            <span style={{ fontSize: '11px', color: textMuted, letterSpacing: '0.05em' }}>
              Showing {users.length} of {total} users
              {roleFilter !== 'ALL' && ` · filtered by ${roleFilter}`}
              {searchTerm && ` · "${searchTerm}"`}
            </span>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="page-btn"
                  style={{
                    width: '32px', height: '32px', borderRadius: '4px',
                    background: 'transparent',
                    border: `1px solid ${border}`,
                    cursor: page === 1 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: textMuted, opacity: page === 1 ? 0.3 : 1, transition: 'all 0.18s',
                  }}
                >
                  <ChevronLeft style={{ width: '14px', height: '14px' }} />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1
                    : page <= 3 ? i + 1
                    : page >= totalPages - 2 ? totalPages - 4 + i
                    : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '4px',
                        background: page === p ? 'rgba(212,175,55,0.1)' : 'transparent',
                        border: `1px solid ${page === p ? 'rgba(212,175,55,0.4)' : border}`,
                        cursor: 'pointer',
                        color: page === p ? gold : textMuted,
                        fontSize: '12px', fontWeight: page === p ? 400 : 300,
                        fontFamily: 'inherit', transition: 'all 0.18s',
                      }}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="page-btn"
                  style={{
                    width: '32px', height: '32px', borderRadius: '4px',
                    background: 'transparent',
                    border: `1px solid ${border}`,
                    cursor: page === totalPages ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: textMuted, opacity: page === totalPages ? 0.3 : 1, transition: 'all 0.18s',
                  }}
                >
                  <ChevronRight style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0e0e0b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '32px',
              width: '360px', maxWidth: '90vw',
              animation: 'popIn 0.2s ease-out',
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Trash2 style={{ width: '20px', height: '20px', color: '#f87171' }} />
            </div>
            <h3 style={{
              textAlign: 'center', fontSize: '1.1rem', fontWeight: 300,
              color: textMain, marginBottom: '8px',
              fontFamily: "'Inter',system-ui,sans-serif", letterSpacing: '0.05em',
            }}>
              Delete User?
            </h3>
            <p style={{ textAlign: 'center', fontSize: '12px', color: textMuted, marginBottom: '24px', lineHeight: 1.6 }}>
              This action cannot be undone. The user and all their data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: '10px',
                  background: 'transparent', border: `1px solid ${border}`,
                  borderRadius: '4px', cursor: 'pointer',
                  color: textMuted, fontSize: '11px', fontWeight: 300,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  fontFamily: 'inherit', transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = textMain; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1, padding: '10px',
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: '4px', cursor: 'pointer',
                  color: '#f87171', fontSize: '11px', fontWeight: 300,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  fontFamily: 'inherit', transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Profile Panel ────────────────────────────────────────── */}
      {selectedClientId && (
        <ClientProfilePanel
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </>
  );
};

export default AdminUsers;