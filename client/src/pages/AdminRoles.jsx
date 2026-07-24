import { useEffect, useState, useCallback } from 'react';
import { Shield, ChevronDown, RefreshCw, Users, UserCheck, Star, Crown, Loader2, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, PageHeader, Card, Button, SearchInput, EmptyState, Avatar, Badge } from '../admin-ui';

const rolesList = (language) => [
  { value: 'USER',        label: language === 'ar' ? 'مستخدم' : 'User',        icon: Users,     color: TK.textMuted, description: language === 'ar' ? 'وصول عميل قياسي' : 'Standard client access' },
  { value: 'MANAGER',     label: language === 'ar' ? 'مدير' : 'Manager',     icon: UserCheck, color: '#60a5fa', description: language === 'ar' ? 'يمكنه عرض جميع المشاريع والمستخدمين' : 'Can view all projects and users' },
  { value: 'ADMIN',       label: language === 'ar' ? 'مسؤول' : 'Admin',       icon: Star,      color: TK.accent, description: language === 'ar' ? 'إدارة كاملة للمنصة' : 'Full platform management' },
  { value: 'SUPER_ADMIN', label: language === 'ar' ? 'مسؤول عام' : 'Super Admin', icon: Crown,     color: '#a78bfa', description: language === 'ar' ? 'وصول غير مقيد' : 'Unrestricted access' },
];

const PERMISSIONS = {
  USER:        ['projects.view.own'],
  MANAGER:     ['projects.view.all', 'projects.edit', 'users.view', 'billing.view', 'settings.view', 'audit.view'],
  ADMIN:       ['projects.view.all', 'projects.edit', 'projects.delete', 'users.view', 'users.edit', 'users.delete', 'users.export', 'billing.view', 'billing.manage', 'settings.view', 'settings.edit', 'ai.configure', 'audit.view', 'feedback.manage', 'notifications.broadcast'],
};

const superAdminPermissionText = (language) => language === 'ar'
  ? 'جميع الصلاحيات بما في ذلك users.impersonate و system.configure'
  : 'All permissions including users.impersonate, system.configure';

const RoleDropdown = ({ currentRole, userId, onChanged, isSelf, language }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ROLES = rolesList(language);

  const cfg = ROLES.find(r => r.value === currentRole) || ROLES[0];

  if (isSelf) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: RADIUS.md, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, color: cfg.color, fontSize: '11px', fontWeight: 500 }}>
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
      toast.success(language === 'ar' ? `تم تغيير الدور إلى ${newRole}` : `Role changed to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'ar' ? 'فشل تغيير الدور' : 'Failed to change role'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: RADIUS.md, background: `${cfg.color}12`, border: `1px solid ${cfg.color}30`, color: cfg.color, fontSize: '11px', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
      >
        {saving ? <Loader2 size={11} style={{ animation: 'au-spin 0.8s linear infinite' }} /> : <cfg.icon size={11} />}
        {cfg.label}
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 10, background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.lg, overflow: 'hidden', minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
            {ROLES.map(role => (
              <button
                key={role.value}
                onClick={() => changeRole(role.value)}
                className="au-row"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', width: '100%', textAlign: 'left', background: role.value === currentRole ? TK.hoverBg : 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <role.icon size={13} style={{ color: role.color }} />
                <div>
                  <div style={{ fontSize: '12px', color: role.color, fontWeight: role.value === currentRole ? 600 : 400 }}>{role.label}</div>
                  <div style={{ fontSize: '10px', color: TK.textMuted }}>{role.description}</div>
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
  const { language } = useLanguage();
  const ROLES = rolesList(language);
  const { user: me } = useSelector(s => s.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [total, setTotal] = useState(0);

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
      toast.error(language === 'ar' ? 'فشل تحميل المستخدمين' : 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filterRole, language]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChanged = (userId, newRole) => {
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
  };

  const roleStats = ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.value).length }));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: TK.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '28px', height: '28px', color: TK.accent, animation: 'au-spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }}>

      <PageHeader
        icon={Shield}
        eyebrow={language === 'ar' ? 'التحكم في الوصول' : 'Access Control'}
        title={language === 'ar' ? 'إدارة الأدوار' : 'Role Management'}
        subtitle={language === 'ar' ? `${total} مستخدم · تعيين الأدوار والصلاحيات` : `${total} users · Assign roles and permissions`}
        actions={<Button variant="secondary" icon={RefreshCw} onClick={() => fetchUsers(true)} loading={refreshing}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>}
      />

      {/* Role distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {roleStats.map(r => (
          <div key={r.value}
            onClick={() => setFilterRole(filterRole === r.value ? '' : r.value)}
            className="au-card-hover"
            style={{ padding: '16px', background: filterRole === r.value ? `${r.color}15` : TK.surface, border: `1px solid ${filterRole === r.value ? `${r.color}40` : TK.border}`, borderRadius: RADIUS.lg, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}
          >
            <r.icon size={18} style={{ color: r.color, margin: '0 auto 6px' }} />
            <div style={{ fontSize: '22px', fontWeight: 700, color: r.color, letterSpacing: '-0.02em' }}>{r.count}</div>
            <div style={{ fontSize: '10px', color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder={language === 'ar' ? 'البحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
        />
      </div>

      {/* Permissions info */}
      <Card padding="18px 22px" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 14px' }}>
          {language === 'ar' ? 'مصفوفة الصلاحيات' : 'Permission Matrix'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {ROLES.map(r => (
            <div key={r.value}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <r.icon size={12} style={{ color: r.color }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: r.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.label}</span>
              </div>
              {(r.value === 'SUPER_ADMIN' ? [superAdminPermissionText(language)] : (PERMISSIONS[r.value] || [])).map(perm => (
                <div key={perm} style={{ fontSize: '10px', color: TK.textMuted, padding: '2px 0' }}>· {perm}</div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Users table */}
      <Card padding="0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${TK.border}` }}>
          <h2 style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: 0 }}>
            {language === 'ar' ? `المستخدمون · ${users.length} معروض` : `Users · ${users.length} shown`}
          </h2>
        </div>
        {users.length === 0 ? (
          <EmptyState icon={AlertCircle} title={language === 'ar' ? 'لا يوجد مستخدمون.' : 'No users found.'} />
        ) : (
          users.map((u, idx) => {
            const isSelf = u._id === me?._id;
            return (
              <div key={u._id}
                className="au-row"
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 22px', borderBottom: idx < users.length - 1 ? `1px solid ${TK.borderSoft}` : 'none' }}
              >
                <Avatar name={u.fullName} email={u.email} size={32} tone="info" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.fullName || (language === 'ar' ? 'مستخدم' : 'User')} {isSelf && <span style={{ fontSize: '9px', color: TK.accent }}>({language === 'ar' ? 'أنت' : 'you'})</span>}
                  </div>
                  <div style={{ fontSize: '10.5px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                {u.isActive ? (
                  <Badge tone="neutral">{language === 'ar' ? 'نشط' : 'Active'}</Badge>
                ) : (
                  <Badge tone="danger">{language === 'ar' ? 'موقوف' : 'Suspended'}</Badge>
                )}
                <RoleDropdown currentRole={u.role} userId={u._id} onChanged={handleRoleChanged} isSelf={isSelf} language={language} />
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
};

export default AdminRoles;
