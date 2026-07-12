import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, X, Activity, MessageSquare,
  FolderKanban, Mail, Phone, Globe, Building2,
  ChevronRight, RefreshCw,
  Briefcase,
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { timeAgo } from '../utils/time';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  text:      '#0D1117',
  textMuted: '#6B7280',
  hoverBg:   'rgba(0,0,0,0.025)',
};

// ── Customer Status Config ────────────────────────────────────────────────────
const STATUS_CFG = {
  lead:     { label: 'Lead',     color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  prospect: { label: 'Prospect', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  active:   { label: 'Active',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  vip:      { label: 'VIP',      color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  churned:  { label: 'Churned',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  inactive: { label: 'Inactive', color: '#6b7280', bg: 'rgba(107,114,128,0.1)'},
};

// ── Activity type icon ────────────────────────────────────────────────────────
const ACTIVITY_ICONS = {
  login:           { icon: Clock,        color: '#6b7280' },
  message_sent:    { icon: MessageSquare,color: '#2563EB' },
  project_created: { icon: FolderKanban, color: '#3b82f6' },
  project_updated: { icon: FolderKanban, color: '#f59e0b' },
  invoice_paid:    { icon: Star,         color: '#10b981' },
  profile_updated: { icon: Users,        color: '#6b7280' },
  onboarding_completed:{ icon: CheckCircle2, color: '#10b981' },
};

// ── Score Bar ─────────────────────────────────────────────────────────────────
const ScoreBar = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#2563EB' : score >= 40 ? '#f59e0b' : '#6b7280';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ flex: 1, height: '3px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '9px', color, fontWeight: 500, minWidth: '28px' }}>{score}</span>
    </div>
  );
};

// ── Customer Row ──────────────────────────────────────────────────────────────
const CustomerRow = ({ user, language, onSelect, isSelected }) => {
  const statusCfg = STATUS_CFG[user.customerStatus] || STATUS_CFG.lead;
  return (
    <div
      onClick={() => onSelect(user)}
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 120px 80px 80px 60px',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: isSelected ? 'rgba(37,99,235,0.06)' : 'transparent',
        border: isSelected ? '1px solid rgba(37,99,235,0.2)' : `1px solid transparent`,
        transition: 'all 0.15s',
        marginBottom: '4px',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = TK.hoverBg; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Avatar */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: user.avatar ? 'transparent' : 'linear-gradient(135deg,rgba(37,99,235,0.25),rgba(37,99,235,0.06))',
        border: '1px solid rgba(37,99,235,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 500, color: '#2563EB',
        overflow: 'hidden',
      }}>
        {user.avatar
          ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (user.fullName?.[0]?.toUpperCase() || '?')
        }
      </div>

      {/* Name + Email */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 400, color: TK.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.fullName || 'Unknown'}
        </div>
        <div style={{ fontSize: '10px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </div>
        {user.companyName && (
          <div style={{ fontSize: '9px', color: TK.textMuted, opacity: 0.7 }}>{user.companyName}</div>
        )}
      </div>

      {/* Status */}
      <span style={{
        padding: '3px 9px', borderRadius: '10px', fontSize: '9px', fontWeight: 500,
        background: statusCfg.bg, color: statusCfg.color,
        letterSpacing: '0.06em', textAlign: 'center',
      }}>
        {statusCfg.label}
      </span>

      {/* Lead Score */}
      <ScoreBar score={user.leadScore || 0} />

      {/* Join date */}
      <span style={{ fontSize: '9px', color: TK.textMuted, whiteSpace: 'nowrap' }}>
        {timeAgo(user.createdAt, language)}
      </span>

      {/* Arrow */}
      <ChevronRight style={{ width: '12px', height: '12px', color: TK.textMuted, opacity: 0.4 }} />
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

  const statusCfg = STATUS_CFG[customer.customerStatus] || STATUS_CFG.lead;

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

  const TAB_STYLE = (active) => ({
    padding: '6px 14px', borderRadius: '8px', fontSize: '10px',
    fontWeight: active ? 500 : 300, letterSpacing: '0.08em',
    border: `1px solid ${active ? 'rgba(37,99,235,0.4)' : TK.border}`,
    background: active ? 'rgba(37,99,235,0.1)' : 'transparent',
    color: active ? TK.accent : TK.textMuted,
    cursor: 'pointer', transition: 'all 0.15s',
  });

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
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(37,99,235,0.25),rgba(37,99,235,0.06))',
              border: '2px solid rgba(37,99,235,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 600, color: TK.accent,
              overflow: 'hidden',
            }}>
              {customer.avatar
                ? <img src={customer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (customer.fullName?.[0]?.toUpperCase() || '?')
              }
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 500, color: TK.text, margin: '0 0 3px' }}>
                {customer.fullName}
              </h3>
              <span style={{
                padding: '2px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: 500,
                background: statusCfg.bg, color: statusCfg.color,
              }}>
                {statusCfg.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, padding: '2px' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
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
            <span style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lead Score</span>
            <span style={{ fontSize: '9px', color: TK.accent }}>{customer.leadScore || 0}/100</span>
          </div>
          <ScoreBar score={customer.leadScore || 0} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', borderBottom: `1px solid ${TK.border}`, flexWrap: 'wrap' }}>
        {['overview', 'activity', 'projects', 'messages'].map(t => (
          <button key={t} style={TAB_STYLE(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.15)', borderTopColor: TK.accent, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Member Since', value: new Date(customer.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' }) },
                  { label: 'Last Login',   value: customer.lastLoginAt ? timeAgo(customer.lastLoginAt, language) : 'Never' },
                  { label: 'Auth Method',  value: customer.authProvider || 'email' },
                  { label: 'Country',      value: customer.country || '—' },
                  { label: 'City',         value: customer.city || '—' },
                  { label: 'Job Role',     value: customer.jobRole || '—' },
                  { label: 'Business',     value: customer.businessType || '—' },
                  { label: 'Primary Goal', value: customer.primaryGoal || '—' },
                  { label: 'How Found',    value: customer.howFound || '—' },
                  { label: 'Projects',     value: projects.length },
                  { label: 'Conversations',value: threads.length },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${TK.border}` }}>
                    <span style={{ fontSize: '10px', color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 400, color: TK.text }}>{value}</span>
                  </div>
                ))}
                {customer.tags?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Tags</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {customer.tags.map(tag => (
                        <span key={tag} style={{
                          padding: '2px 8px', borderRadius: '8px', fontSize: '9px',
                          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', color: TK.accent,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => navigate('/app/messages')}
                  style={{
                    marginTop: '8px', padding: '10px', borderRadius: '8px',
                    background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
                    color: TK.accent, fontSize: '11px', fontWeight: 400,
                    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background=TK.accent; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(37,99,235,0.1)'; e.currentTarget.style.color=TK.accent; }}
                >
                  <MessageSquare style={{ width: '13px', height: '13px' }} />
                  Message Customer
                </button>
              </div>
            )}

            {/* Activity Timeline */}
            {tab === 'activity' && (
              <div>
                {activity.length === 0 ? (
                  <p style={{ fontSize: '12px', color: TK.textMuted, textAlign: 'center', marginTop: '24px' }}>No activity recorded yet</p>
                ) : activity.map(log => {
                  const cfg = ACTIVITY_ICONS[log.type] || { icon: Activity, color: '#6b7280' };
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
                  <p style={{ fontSize: '12px', color: TK.textMuted, textAlign: 'center', marginTop: '24px' }}>No projects found</p>
                ) : projects.map(p => (
                  <div key={p._id} style={{ padding: '9px 0', borderBottom: `1px solid ${TK.border}` }}>
                    <div style={{ fontSize: '12px', color: TK.text, fontWeight: 400, marginBottom: '2px' }}>{p.title}</div>
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
                  <p style={{ fontSize: '12px', color: TK.textMuted, textAlign: 'center', marginTop: '24px' }}>No conversations</p>
                ) : threads.map(t => (
                  <div key={t._id} style={{ padding: '9px 0', borderBottom: `1px solid ${TK.border}` }}>
                    <div style={{ fontSize: '11px', color: TK.text, fontWeight: 400, marginBottom: '2px' }}>{t.subject || 'Direct Message'}</div>
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

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ── Main CRM Page ─────────────────────────────────────────────────────────────
const AdminCRM = () => {
  const { language } = useLanguage();
  const navigate    = useNavigate();

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

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '28px 32px 20px', borderBottom: `1px solid ${TK.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)', marginBottom: '8px' }}>
              <Users style={{ width: '9px', height: '9px', color: TK.accent }} />
              <span style={{ fontSize: '9px', fontWeight: 500, color: TK.accent, letterSpacing: '0.14em', textTransform: 'uppercase' }}>CRM Directory</span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 600, color: TK.text, margin: 0, letterSpacing: '-0.02em', fontFamily: "'Inter',system-ui,sans-serif" }}>
              Customer Directory
            </h1>
            <p style={{ fontSize: '12px', color: TK.textMuted, margin: '4px 0 0', fontWeight: 300 }}>
              {total} customers · Full CRM profile and activity
            </p>
          </div>
          <button
            onClick={fetchUsers}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(37,99,235,0.4)'; e.currentTarget.style.color=TK.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=TK.border; e.currentTarget.style.color=TK.textMuted; }}
          >
            <RefreshCw style={{ width: '12px', height: '12px' }} />
            Refresh
          </button>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '8px', padding: '9px 14px' }}>
            <Search style={{ width: '13px', height: '13px', color: TK.textMuted, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or company…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: TK.text, fontSize: '13px', fontFamily: 'inherit', fontWeight: 300 }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, padding: 0 }}><X style={{ width: '12px', height: '12px' }} /></button>}
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ padding: '9px 14px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table + Detail pane */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 120px 80px 80px 60px', gap: '12px', padding: '6px 16px', marginBottom: '6px' }}>
            {['', 'Customer', 'Status', 'Score', 'Joined', ''].map((h, i) => (
              <span key={i} style={{ fontSize: '9px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.15)', borderTopColor: TK.accent, animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '60px', color: TK.textMuted }}>
              <Users style={{ width: '32px', height: '32px', margin: '0 auto 12px', opacity: 0.2 }} />
              <p style={{ fontSize: '13px', fontWeight: 300 }}>No customers found</p>
            </div>
          ) : (
            <div>
              {filteredUsers.map(u => (
                <CustomerRow
                  key={u._id}
                  user={u}
                  language={language}
                  onSelect={(u) => setSelected(s => s?._id === u._id ? null : u)}
                  isSelected={selected?._id === u._id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <CustomerDetail
            customer={selected}
            language={language}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default AdminCRM;
