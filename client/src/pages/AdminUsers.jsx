import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Users, UserCheck, TrendingUp, Clock, Shield, Eye, Edit, Trash2, Activity } from 'lucide-react';
import api from '../utils/api';
import ClientProfilePanel from '../components/ClientProfilePanel';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, FONT, PageHeader, StatCard, DataTable, SearchInput, FilterPills,
  Avatar, PresenceDot, Badge, IconButton, ConfirmDialog,
} from '../admin-ui';

const formatDate = (d) => d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const relativeTime = (d, language) => {
  if (!d) return language === 'ar' ? 'أبداً' : 'Never';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return language === 'ar' ? `منذ ${mins}د` : `${mins}m ago`;
  if (mins < 1440) return language === 'ar' ? `منذ ${Math.floor(mins / 60)}س` : `${Math.floor(mins / 60)}h ago`;
  if (mins < 10080) return language === 'ar' ? `منذ ${Math.floor(mins / 1440)}ي` : `${Math.floor(mins / 1440)}d ago`;
  return formatDate(d);
};
const presenceLabel = (lastLogin, language) => {
  const mins = lastLogin ? Math.floor((Date.now() - new Date(lastLogin)) / 60000) : Infinity;
  if (language === 'ar') {
    return mins < 30 ? 'متصل الآن' : mins < 1440 ? 'نشط مؤخراً' : mins < 10080 ? 'هذا الأسبوع' : 'غير نشط';
  }
  return mins < 30 ? 'Online' : mins < 1440 ? 'Recent' : mins < 10080 ? 'This week' : 'Inactive';
};

const AdminUsers = () => {
  const { t }     = useTranslation();
  const { language, isRTL } = useLanguage?.() || { language: 'en', isRTL: false };
  const font = FONT(isRTL);

  const [users,            setUsers]            = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [page,             setPage]             = useState(1);
  const [totalPages,       setTotalPages]       = useState(1);
  const [total,            setTotal]            = useState(0);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [roleFilter,       setRoleFilter]       = useState('ALL');
  const [deleteConfirm,    setDeleteConfirm]    = useState(null);
  const [deleting,         setDeleting]         = useState(false);

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

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      await api.delete(`/users/${deleteConfirm}`);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const columns = [
    {
      key: 'name', label: t('common.name', 'User'), width: '28%',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={u.fullName} email={u.email} size={36} tone={u.role === 'ADMIN' ? 'info' : 'neutral'} />
            <span style={{ position: 'absolute', bottom: '-1px', right: '-1px' }}><PresenceDot lastActive={u.lastLogin} /></span>
          </div>
          <div>
            <button
              onClick={() => setSelectedClientId(u._id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.text, fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', padding: 0, display: 'block' }}
            >
              {u.fullName || u.email || (language === 'ar' ? 'غير معروف' : 'Unknown')}
            </button>
            <span style={{ fontSize: '10.5px', color: TK.textLight }}>{language === 'ar' ? 'انضم في' : 'Joined'} {formatDate(u.createdAt)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email', label: t('common.email', 'Email'), width: '22%',
      render: (u) => (
        <div>
          <span style={{ fontSize: '12px', color: TK.textMuted }}>{u.email}</span>
          {u.emailVerified === false && <div><Badge tone="warning">{language === 'ar' ? 'غير موثّق' : 'Unverified'}</Badge></div>}
        </div>
      ),
    },
    {
      key: 'role', label: t('users.role', 'Role'), width: '10%',
      render: (u) => <Badge tone={u.role === 'ADMIN' ? 'info' : 'neutral'}>{u.role === 'ADMIN' ? (language === 'ar' ? 'مسؤول' : 'Admin') : (language === 'ar' ? 'مستخدم' : 'User')}</Badge>,
    },
    {
      key: 'status', label: language === 'ar' ? 'الحالة' : 'Status', width: '12%',
      render: (u) => {
        const label = presenceLabel(u.lastLogin, language);
        return <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><PresenceDot lastActive={u.lastLogin} /><span style={{ fontSize: '11px', color: TK.textMuted }}>{label}</span></span>;
      },
    },
    {
      key: 'lastLogin', label: t('users.lastLogin', 'Last Active'), width: '16%', sortable: true,
      render: (u) => <span style={{ fontSize: '11px', color: TK.textMuted }}>{relativeTime(u.lastLogin, language)}</span>,
    },
    {
      key: 'actions', label: t('common.actions', 'Actions'), width: '12%', align: 'right',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }} onClick={e => e.stopPropagation()}>
          <IconButton icon={Eye} size={30} onClick={() => setSelectedClientId(u._id)} title={language === 'ar' ? 'عرض الملف الشخصي' : 'View profile'} />
          <IconButton icon={Edit} size={30} title={language === 'ar' ? 'تعديل المستخدم' : 'Edit user'} />
          <IconButton icon={Trash2} size={30} onClick={() => setDeleteConfirm(u._id)} title={language === 'ar' ? 'حذف المستخدم' : 'Delete user'} style={{ color: TK.textMuted }} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 32px 48px', fontFamily: font, direction: isRTL ? 'rtl' : 'ltr', maxWidth: '1400px' }}>

      <PageHeader
        icon={Shield}
        eyebrow={language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
        title={t('users.title', 'Users')}
        subtitle={`${total} ${t('users.allUsers', 'registered users')}`}
        actions={<button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: TK.accent, border: 'none', borderRadius: '9px', color: '#fff', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <UserPlus style={{ width: '14px', height: '14px' }} />
          {t('users.createUser', 'Add User')}
        </button>}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard icon={Users}      label={language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}     value={total}          sub={language === 'ar' ? `صفحة ${page}/${totalPages}` : `Page ${page}/${totalPages}`} tone="info" highlight />
        <StatCard icon={Shield}     label={language === 'ar' ? 'المسؤولون' : 'Admins'}                  value={stats.admins}   sub={language === 'ar' ? 'صلاحية كاملة' : 'Full access'} tone="purple" />
        <StatCard icon={Activity}   label={language === 'ar' ? 'نشط خلال 7 أيام' : 'Active 7 days'}     value={stats.active7}  sub={language === 'ar' ? 'نشاط حديث' : 'Recent activity'} tone="success" />
        <StatCard icon={TrendingUp} label={language === 'ar' ? 'نشط خلال 30 يوم' : 'Active 30 days'}    value={stats.active30} sub={language === 'ar' ? 'نشاط شهري' : 'Monthly actives'} tone="info" />
        <StatCard icon={Clock}      label={language === 'ar' ? 'لم يسجل الدخول أبداً' : 'Never logged in'} value={stats.never}  sub={language === 'ar' ? 'بانتظار تسجيل الدخول' : 'Awaiting login'} tone="warning" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <SearchInput
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          onClear={() => setSearchTerm('')}
          placeholder={t('common.search', 'Search by name or email…')}
        />
        <FilterPills
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1); }}
          options={[
            { value: 'ALL', label: language === 'ar' ? 'الكل' : 'All' },
            { value: 'USER', label: language === 'ar' ? 'مستخدم' : 'User' },
            { value: 'ADMIN', label: language === 'ar' ? 'مسؤول' : 'Admin' },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        emptyIcon={Users}
        emptyTitle={language === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
        isRTL={isRTL}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        footer={language === 'ar'
          ? `عرض ${users.length} من ${total} مستخدم${roleFilter !== 'ALL' ? ` · مصفى حسب ${roleFilter === 'ADMIN' ? 'مسؤول' : 'مستخدم'}` : ''}${searchTerm ? ` · "${searchTerm}"` : ''}`
          : `Showing ${users.length} of ${total} users${roleFilter !== 'ALL' ? ` · filtered by ${roleFilter}` : ''}${searchTerm ? ` · "${searchTerm}"` : ''}`}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={language === 'ar' ? 'حذف المستخدم؟' : 'Delete user?'}
        description={language === 'ar'
          ? 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف المستخدم وجميع بياناته نهائياً.'
          : 'This action cannot be undone. The user and all their data will be permanently removed.'}
        confirmLabel={language === 'ar' ? 'حذف' : 'Delete'}
      />

      {selectedClientId && (
        <ClientProfilePanel clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />
      )}
    </div>
  );
};

export default AdminUsers;
