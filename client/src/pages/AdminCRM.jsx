import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Activity, MessageSquare,
  FolderKanban, Mail, Phone, Globe, Building2,
  ChevronRight, RefreshCw, X,
  Briefcase, Clock, Star, CheckCircle2,
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { timeAgo } from '../utils/time';
import {
  TK, FONT, PageHeader, DataTable, SearchInput, Select, Badge,
  IconButton, Button, Tabs, Avatar, Spinner,
} from '../admin-ui';

// ── Customer Status Config ────────────────────────────────────────────────────
const STATUS_LABEL = {
  lead:     { en: 'Lead',     ar: 'عميل محتمل' },
  prospect: { en: 'Prospect', ar: 'مرشح' },
  active:   { en: 'Active',   ar: 'نشط' },
  vip:      { en: 'VIP',      ar: 'كبار العملاء' },
  churned:  { en: 'Churned',  ar: 'متوقف' },
  inactive: { en: 'Inactive', ar: 'غير نشط' },
};
const STATUS_TONE_MAP = {
  lead:     'neutral',
  prospect: 'purple',
  active:   'success',
  vip:      'info',
  churned:  'danger',
  inactive: 'neutral',
};
const statusLabel = (s, language) => {
  const entry = STATUS_LABEL[s] || STATUS_LABEL.lead;
  return language === 'ar' ? entry.ar : entry.en;
};
const statusTone  = (s) => STATUS_TONE_MAP[s] || 'neutral';

const getStatusOptions = (language) => [
  { value: '', label: language === 'ar' ? 'كل الحالات' : 'All Status' },
  ...Object.keys(STATUS_LABEL).map((value) => ({ value, label: statusLabel(value, language) })),
];

// ── Activity type icon ────────────────────────────────────────────────────────
const ACTIVITY_ICONS = {
  login:                { icon: Clock,        color: TK.textMuted },
  message_sent:         { icon: MessageSquare,color: TK.accent },
  project_created:      { icon: FolderKanban, color: TK.accent },
  project_updated:      { icon: FolderKanban, color: TK.amber },
  invoice_paid:         { icon: Star,         color: TK.green },
  profile_updated:      { icon: Users,        color: TK.textMuted },
  onboarding_completed: { icon: CheckCircle2, color: TK.green },
};

// ── Score Bar ─────────────────────────────────────────────────────────────────
const ScoreBar = ({ score }) => {
  const color = score >= 80 ? TK.green : score >= 60 ? TK.accent : score >= 40 ? TK.amber : TK.textMuted;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ flex: 1, height: '3px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '10px', color, fontWeight: 500, minWidth: '28px' }}>{score}</span>
    </div>
  );
};

// ── Customer Detail Panel ─────────────────────────────────────────────────────
const CustomerDetail = ({ customer, language, onClose }) => {
  const [activity, setActivity]   = useState([]);
  const [projects, setProjects]   = useState([]);
  const [threads,  setThreads]    = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [tab,      setTab]        = useState('overview'); // overview | activity | projects | messages
  const navigate = useNavigate();

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    Promise.all([
      api.get(`/activity/user/${customer._id}?limit=15`).catch(() => ({ data: { logs: [] } })),
      api.get(`/projects?client=${customer._id}&limit=10`).catch(() => ({ data: { projects: [] } })),
      api.get(`/messages/threads?limit=10`).catch(() => ({ data: { threads: [] } })),
    ]).then(([actRes, projRes, threadRes]) => {
      setActivity(actRes.data.logs || []);
      setProjects(projRes.data.projects || []);
      const userThreads = (threadRes.data.threads || []).filter(t =>
        t.participants?.some(p => (p._id || p) === customer._id)
      );
      setThreads(userThreads.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [customer?._id]);

  return (
    <div style={{
      width: '360px', flexShrink: 0,
      background: TK.surface,
      borderLeft: `1px solid ${TK.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${TK.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar name={customer.fullName} email={customer.email} size={48} tone={statusTone(customer.customerStatus)} />
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: TK.text, margin: '0 0 5px' }}>
                {customer.fullName}
              </h3>
              <Badge tone={statusTone(customer.customerStatus)}>{statusLabel(customer.customerStatus, language)}</Badge>
            </div>
          </div>
          <IconButton icon={X} size={30} onClick={onClose} title={language === 'ar' ? 'إغلاق' : 'Close'} />
        </div>

        {/* Quick contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[
            { icon: Mail,      val: customer.email,       href: `mailto:${customer.email}` },
            { icon: Phone,     val: customer.phoneNumber,  href: `tel:${customer.phoneNumber}` },
            { icon: Globe,     val: customer.website,      href: customer.website },
            { icon: Building2, val: customer.companyName,  href: null },
            { icon: Briefcase, val: customer.businessType, href: null },
          ].filter(r => r.val).map(({ icon: Icon, val, href }) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Icon style={{ width: '11px', height: '11px', color: TK.textMuted, flexShrink: 0 }} />
              {href
                ? <a href={href} target="_blank" rel="noopener" style={{ fontSize: '11px', color: TK.accent, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</a>
                : <span style={{ fontSize: '11px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
              }
            </div>
          ))}
        </div>

        {/* Lead Score */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{language === 'ar' ? 'نقاط العميل' : 'Lead Score'}</span>
            <span style={{ fontSize: '9px', color: TK.accent }}>{customer.leadScore || 0}/100</span>
          </div>
          <ScoreBar score={customer.leadScore || 0} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 16px' }}>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'overview', label: language === 'ar' ? 'نظرة عامة' : 'Overview' },
            { value: 'activity', label: language === 'ar' ? 'النشاط' : 'Activity' },
            { value: 'projects', label: language === 'ar' ? 'المشاريع' : 'Projects' },
            { value: 'messages', label: language === 'ar' ? 'الرسائل' : 'Messages' },
          ]}
        />
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <Spinner size={24} />
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'memberSince',   label: language === 'ar' ? 'عضو منذ' : 'Member Since', value: new Date(customer.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' }) },
                  { key: 'lastLogin',     label: language === 'ar' ? 'آخر تسجيل دخول' : 'Last Login',   value: customer.lastLoginAt ? timeAgo(customer.lastLoginAt, language) : (language === 'ar' ? 'أبداً' : 'Never') },
                  { key: 'authMethod',    label: language === 'ar' ? 'طريقة الدخول' : 'Auth Method',  value: customer.authProvider || 'email' },
                  { key: 'country',       label: language === 'ar' ? 'الدولة' : 'Country',      value: customer.country || '—' },
                  { key: 'city',          label: language === 'ar' ? 'المدينة' : 'City',         value: customer.city || '—' },
                  { key: 'jobRole',       label: language === 'ar' ? 'الوظيفة' : 'Job Role',     value: customer.jobRole || '—' },
                  { key: 'business',      label: language === 'ar' ? 'النشاط التجاري' : 'Business',     value: customer.businessType || '—' },
                  { key: 'primaryGoal',   label: language === 'ar' ? 'الهدف الرئيسي' : 'Primary Goal', value: customer.primaryGoal || '—' },
                  { key: 'howFound',      label: language === 'ar' ? 'كيف تعرف علينا' : 'How Found',    value: customer.howFound || '—' },
                  { key: 'projects',      label: language === 'ar' ? 'المشاريع' : 'Projects',     value: projects.length },
                  { key: 'conversations', label: language === 'ar' ? 'المحادثات' : 'Conversations',value: threads.length },
                ].map(({ key, label, value }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${TK.border}` }}>
                    <span style={{ fontSize: '10px', color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: TK.text }}>{value}</span>
                  </div>
                ))}
                {customer.tags?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{language === 'ar' ? 'الوسوم' : 'Tags'}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {customer.tags.map(tag => <Badge key={tag} tone="info">{tag}</Badge>)}
                    </div>
                  </div>
                )}
                <Button variant="primary" icon={MessageSquare} style={{ marginTop: '8px', width: '100%' }} onClick={() => navigate('/app/messages')}>
                  {language === 'ar' ? 'مراسلة العميل' : 'Message Customer'}
                </Button>
              </div>
            )}

            {/* Activity Timeline */}
            {tab === 'activity' && (
              <div>
                {activity.length === 0 ? (
                  <p style={{ fontSize: '12px', color: TK.textMuted, textAlign: 'center', marginTop: '24px' }}>{language === 'ar' ? 'لا يوجد نشاط مسجل بعد' : 'No activity recorded yet'}</p>
                ) : activity.map(log => {
                  const cfg = ACTIVITY_ICONS[log.type] || { icon: Activity, color: TK.textMuted };
                  const Icon = cfg.icon;
                  return (
                    <div key={log._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 0', borderBottom: `1px solid ${TK.border}` }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0, background: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: '11px', height: '11px', color: cfg.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', color: TK.text, margin: '0 0 2px', lineHeight: 1.4 }}>
                          {log.description || log.type}
                        </p>
                        <span style={{ fontSize: '9px', color: TK.textMuted }}>{timeAgo(log.createdAt, language)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Projects */}
            {tab === 'projects' && (
              <div>
                {projects.length === 0 ? (
                  <p style={{ fontSize: '12px', color: TK.textMuted, textAlign: 'center', marginTop: '24px' }}>{language === 'ar' ? 'لا توجد مشاريع' : 'No projects found'}</p>
                ) : projects.map(p => (
                  <div key={p._id} style={{ padding: '9px 0', borderBottom: `1px solid ${TK.border}` }}>
                    <div style={{ fontSize: '12px', color: TK.text, fontWeight: 500, marginBottom: '2px' }}>{p.title}</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', color: TK.textMuted }}>{p.status}</span>
                      {p.progress > 0 && <span style={{ fontSize: '9px', color: TK.accent }}>{p.progress}%</span>}
                      <span style={{ fontSize: '9px', color: TK.textMuted, marginLeft: 'auto' }}>{timeAgo(p.updatedAt, language)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            {tab === 'messages' && (
              <div>
                {threads.length === 0 ? (
                  <p style={{ fontSize: '12px', color: TK.textMuted, textAlign: 'center', marginTop: '24px' }}>{language === 'ar' ? 'لا توجد محادثات' : 'No conversations'}</p>
                ) : threads.map(t => (
                  <div key={t._id} style={{ padding: '9px 0', borderBottom: `1px solid ${TK.border}` }}>
                    <div style={{ fontSize: '11px', color: TK.text, fontWeight: 500, marginBottom: '2px' }}>{t.subject || (language === 'ar' ? 'رسالة مباشرة' : 'Direct Message')}</div>
                    <div style={{ display: 'flex', gap: '6px', fontSize: '9px', color: TK.textMuted }}>
                      <span>{t.type}</span>
                      <span>·</span>
                      <span>{t.status}</span>
                      <span style={{ marginLeft: 'auto' }}>{timeAgo(t.lastActivity, language)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Main CRM Page ─────────────────────────────────────────────────────────────
const AdminCRM = () => {
  const { language, isRTL } = useLanguage();
  const font = FONT(isRTL);

  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [selected, setSelected] = useState(null);
  const [page,     setPage]     = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/users?limit=30&page=${page}&role=USER`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = status
    ? users.filter(u => u.customerStatus === status)
    : users;

  const columns = [
    {
      key: 'customer', label: language === 'ar' ? 'العميل' : 'Customer', width: '34%',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar name={u.fullName} email={u.email} size={36} tone={statusTone(u.customerStatus)} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.fullName || (language === 'ar' ? 'غير معروف' : 'Unknown')}
            </div>
            <div style={{ fontSize: '10.5px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.email}
            </div>
            {u.companyName && <div style={{ fontSize: '10px', color: TK.textLight }}>{u.companyName}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'status', label: language === 'ar' ? 'الحالة' : 'Status', width: '14%',
      render: (u) => <Badge tone={statusTone(u.customerStatus)}>{statusLabel(u.customerStatus, language)}</Badge>,
    },
    {
      key: 'leadScore', label: language === 'ar' ? 'النقاط' : 'Score', width: '18%',
      render: (u) => <ScoreBar score={u.leadScore || 0} />,
    },
    {
      key: 'createdAt', label: language === 'ar' ? 'تاريخ الانضمام' : 'Joined', width: '14%',
      render: (u) => <span style={{ fontSize: '11px', color: TK.textMuted }}>{timeAgo(u.createdAt, language)}</span>,
    },
    {
      key: 'arrow', label: '', width: '5%', align: 'right',
      render: () => <ChevronRight style={{ width: '14px', height: '14px', color: TK.textLight, transform: isRTL ? 'rotate(180deg)' : 'none' }} />,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, fontFamily: font, direction: isRTL ? 'rtl' : 'ltr', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '28px 32px 0' }}>
        <PageHeader
          icon={Users}
          eyebrow={language === 'ar' ? 'دليل إدارة العملاء' : 'CRM Directory'}
          title={language === 'ar' ? 'دليل العملاء' : 'Customer Directory'}
          subtitle={language === 'ar' ? `${total} عميل · ملف CRM كامل والنشاط` : `${total} customers · Full CRM profile and activity`}
          actions={<Button variant="secondary" icon={RefreshCw} onClick={fetchUsers} loading={loading}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>}
        />

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder={language === 'ar' ? 'ابحث بالاسم أو البريد أو الشركة…' : 'Search by name, email or company…'}
          />
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={getStatusOptions(language)}
            style={{ minWidth: '160px' }}
          />
        </div>
      </div>

      {/* Table + Detail pane */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 32px 32px' }}>
          <DataTable
            columns={columns}
            rows={filteredUsers}
            loading={loading}
            emptyIcon={Users}
            emptyTitle={language === 'ar' ? 'لا يوجد عملاء' : 'No customers found'}
            isRTL={isRTL}
            onRowClick={(u) => setSelected(s => s?._id === u._id ? null : u)}
          />
        </div>

        {selected && (
          <CustomerDetail
            customer={selected}
            language={language}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminCRM;
