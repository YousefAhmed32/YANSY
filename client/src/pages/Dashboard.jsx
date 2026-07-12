import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../store/projectSlice';
import {
  FolderKanban, MessageSquare, CreditCard, ChevronRight,
  LifeBuoy, Clock, ArrowRight, Zap,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ── Design tokens ─────────────────────────────────────────────────────────────
const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  accentBg:  'rgba(37,99,235,0.06)',
  text:      '#0D1117',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  green:     '#16a34a',
  amber:     '#d97706',
  red:       '#dc2626',
};

const STATUS_MAP = {
  PLANNING:    { dot: '#94a3b8', label_en: 'Planning',     label_ar: 'التخطيط'      },
  DESIGN:      { dot: '#2563EB', label_en: 'Design',       label_ar: 'التصميم'      },
  DEVELOPMENT: { dot: '#7c3aed', label_en: 'Development',  label_ar: 'التطوير'      },
  REVIEW:      { dot: '#d97706', label_en: 'Review',       label_ar: 'المراجعة'     },
  COMPLETED:   { dot: '#16a34a', label_en: 'Delivered',    label_ar: 'تم التسليم'   },
  PAUSED:      { dot: '#94a3b8', label_en: 'Paused',       label_ar: 'متوقف مؤقتاً' },
  CANCELLED:   { dot: '#dc2626', label_en: 'Cancelled',    label_ar: 'ملغي'         },
};

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: TK.surface, borderRadius: '14px', border: `1px solid ${TK.border}`,
    padding: '20px 22px', transition: 'box-shadow 0.18s, border-color 0.18s',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }}
    onMouseEnter={onClick ? e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; } : undefined}
    onMouseLeave={onClick ? e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = TK.border; } : undefined}
  >
    {children}
  </div>
);

const StatPill = ({ label, value }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '5px 10px', borderRadius: '8px',
    background: 'rgba(0,0,0,0.03)', border: `1px solid ${TK.border}`,
  }}>
    <span style={{ fontSize: '18px', fontWeight: 700, color: TK.text, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: '11px', color: TK.textMuted, lineHeight: 1.2, maxWidth: '55px' }}>{label}</span>
  </div>
);

const getGreeting = (language) => {
  const h = new Date().getHours();
  if (language === 'ar') {
    if (h < 12) return 'صباح الخير';
    return 'مساء الخير';
  }
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const WaIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Dashboard = () => {
  const { language, isRTL } = useLanguage();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { projects = [], loading: projLoading } = useSelector(s => s.projects);
  const { threads = [], totalUnread = 0 } = useSelector(s => s.messages);

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  const activeProject = useMemo(() => {
    const order = ['DEVELOPMENT', 'REVIEW', 'DESIGN', 'PLANNING', 'PAUSED'];
    for (const s of order) {
      const p = projects.find(x => x.status === s);
      if (p) return p;
    }
    return projects.find(p => p.status !== 'COMPLETED' && p.status !== 'CANCELLED') || projects[0] || null;
  }, [projects]);

  const stats = useMemo(() => ({
    total:     projects.length,
    active:    projects.filter(p => !['COMPLETED', 'CANCELLED'].includes(p.status)).length,
    delivered: projects.filter(p => p.status === 'COMPLETED').length,
    messages:  totalUnread,
  }), [projects, totalUnread]);

  const latestThread = useMemo(() => {
    if (!threads.length) return null;
    return [...threads].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
  }, [threads]);

  const greeting  = getGreeting(language);
  const firstName = user?.fullName?.split(' ')[0] || (language === 'ar' ? 'بك' : 'there');
  const statusInfo = activeProject ? (STATUS_MAP[activeProject.status] || STATUS_MAP.PLANNING) : null;
  const progress   = activeProject?.progress ?? 0;
  const pm         = activeProject?.projectManager || null;

  const fmt = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return null; }
  };

  return (
    <div style={{
      minHeight: '100vh', background: TK.bg,
      padding: 'clamp(16px,3vw,32px)',
      fontFamily: isRTL ? 'IBM Plex Sans Arabic, system-ui, sans-serif' : 'Inter, system-ui, sans-serif',
      direction: isRTL ? 'rtl' : 'ltr', maxWidth: '1200px', margin: '0 auto',
    }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color: TK.text, margin: 0, lineHeight: 1.25 }}>
          {greeting}{language !== 'ar' ? ',' : '،'} {firstName} 👋
        </h1>
        <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '5px 0 0' }}>
          {language === 'ar' ? 'إليك نظرة سريعة على ما يحدث' : "Here's what's happening with your projects"}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <StatPill value={stats.total}     label={language === 'ar' ? 'كل المشاريع' : 'Total'} />
        <StatPill value={stats.active}    label={language === 'ar' ? 'قيد التنفيذ' : 'Active'} />
        <StatPill value={stats.delivered} label={language === 'ar' ? 'مكتملة'      : 'Done'} />
        <StatPill value={stats.messages}  label={language === 'ar' ? 'رسائل'       : 'Messages'} />
      </div>

      {/* ── Main grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,340px),1fr))',
        gap: '14px', marginBottom: '14px',
      }}>

        {/* ── Active Project Card (full-width) ── */}
        <div style={{ gridColumn: '1 / -1' }}>
          {activeProject ? (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header bar */}
              <div style={{
                padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${TK.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderKanban style={{ width: '14px', height: '14px', color: TK.accent }} />
                  <span style={{ fontSize: '10.5px', color: TK.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                    {language === 'ar' ? 'المشروع النشط' : 'Active Project'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusInfo?.dot, display: 'inline-block' }} />
                  <span style={{ fontSize: '11px', fontWeight: 500, color: TK.textMuted }}>
                    {language === 'ar' ? statusInfo?.label_ar : statusInfo?.label_en}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 600, color: TK.text, margin: '0 0 4px', wordBreak: 'break-word' }}>
                      {activeProject.name}
                    </h2>
                    {activeProject.description && (
                      <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: 0, lineHeight: 1.5 }}>
                        {activeProject.description.slice(0, 90)}{activeProject.description.length > 90 ? '…' : ''}
                      </p>
                    )}
                  </div>
                  <Link to={`/app/projects/${activeProject._id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 14px', borderRadius: '8px', flexShrink: 0,
                      background: TK.accentBg, border: '1px solid rgba(37,99,235,0.2)',
                      color: TK.accent, textDecoration: 'none', fontSize: '12px', fontWeight: 500,
                      transition: 'background 0.14s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = TK.accentBg; }}
                  >
                    {language === 'ar' ? 'عرض المشروع' : 'View Project'}
                    <ArrowRight style={{ width: '11px', height: '11px', transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                  </Link>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: pm ? '16px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: TK.textMuted }}>
                      {language === 'ar' ? 'نسبة الإنجاز' : 'Progress'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: TK.accent }}>{progress}%</span>
                  </div>
                  <div style={{ height: '5px', background: TK.accentBg, borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '999px',
                      background: `linear-gradient(90deg, ${TK.accent}, #60a5fa)`,
                      width: `${progress}%`, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                  {activeProject.estimatedDelivery && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '7px' }}>
                      <Clock style={{ width: '11px', height: '11px', color: TK.textLight }} />
                      <span style={{ fontSize: '11px', color: TK.textLight }}>
                        {language === 'ar' ? 'موعد التسليم المتوقع: ' : 'Est. delivery: '}
                        {fmt(activeProject.estimatedDelivery)}
                      </span>
                    </div>
                  )}
                </div>

                {/* PM Card */}
                {pm && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: '10px',
                    background: TK.accentBg, border: '1px solid rgba(37,99,235,0.12)',
                    marginTop: '14px', flexWrap: 'wrap', gap: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, color: TK.accent,
                      }}>
                        {pm.name?.[0]?.toUpperCase() || 'Y'}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: TK.text }}>{pm.name || 'YANSY Team'}</div>
                        <div style={{ fontSize: '10.5px', color: TK.textMuted }}>
                          {language === 'ar' ? 'مدير مشروعك' : 'Your Project Manager'}
                        </div>
                      </div>
                    </div>
                    <a href="https://wa.me/201090385390" target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '7px',
                        background: '#25D366', color: '#fff', textDecoration: 'none',
                        fontSize: '11.5px', fontWeight: 500, transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                      <WaIcon />
                      {language === 'ar' ? 'تواصل الآن' : 'Chat Now'}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '20px 16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', background: TK.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                }}>
                  <FolderKanban style={{ width: '22px', height: '22px', color: TK.accent }} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: TK.text, margin: '0 0 6px' }}>
                  {language === 'ar' ? 'لا مشاريع نشطة بعد' : 'No active projects yet'}
                </p>
                <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>
                  {language === 'ar'
                    ? 'سيتواصل معك فريقنا بعد مراجعة طلبك.'
                    : 'Our team will reach out after reviewing your request.'}
                </p>
                <a href="https://wa.me/201090385390" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 18px', borderRadius: '8px',
                    background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 500,
                  }}
                >
                  <WaIcon />
                  {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                </a>
              </div>
            </Card>
          )}
        </div>

        {/* ── Messages Card ── */}
        <Link to="/app/messages" style={{ textDecoration: 'none' }}>
          <Card onClick={undefined} style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <MessageSquare style={{ width: '14px', height: '14px', color: TK.accent }} />
                <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.09em', color: TK.textMuted, fontWeight: 500 }}>
                  {language === 'ar' ? 'الرسائل' : 'Messages'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {totalUnread > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, borderRadius: 9,
                    background: TK.accent, color: 'white',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                  }}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
                <ChevronRight style={{ width: '14px', height: '14px', color: TK.textLight, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
              </div>
            </div>
            {latestThread ? (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: TK.text, marginBottom: '4px', lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {latestThread.subject || latestThread.projectName || (language === 'ar' ? 'محادثة جديدة' : 'New conversation')}
                </div>
                {latestThread.lastMessage && (
                  <div style={{ fontSize: '12px', color: TK.textMuted, lineHeight: 1.5, marginBottom: '8px' }}>
                    {String(latestThread.lastMessage).slice(0, 70)}
                    {String(latestThread.lastMessage).length > 70 ? '…' : ''}
                  </div>
                )}
                <div style={{ fontSize: '10.5px', color: TK.textLight }}>{fmt(latestThread.updatedAt)}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: '8px' }}>
                <MessageSquare style={{ width: '26px', height: '26px', color: TK.textLight }} />
                <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: 0, textAlign: 'center' }}>
                  {language === 'ar' ? 'لا رسائل بعد' : 'No messages yet'}
                </p>
              </div>
            )}
          </Card>
        </Link>

        {/* ── Quick Links ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
            <Zap style={{ width: '14px', height: '14px', color: TK.accent }} />
            <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.09em', color: TK.textMuted, fontWeight: 500 }}>
              {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[
              { to: '/app/projects', label: language === 'ar' ? 'مشاريعي'   : 'My Projects', icon: FolderKanban },
              { to: '/app/payments', label: language === 'ar' ? 'المدفوعات' : 'Payments',    icon: CreditCard   },
              { to: '/app/support',  label: language === 'ar' ? 'الدعم'     : 'Support',     icon: LifeBuoy     },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '8px 10px', borderRadius: '8px',
                  textDecoration: 'none', color: TK.textMuted, transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = TK.accentBg; e.currentTarget.style.color = TK.accent; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TK.textMuted; }}
              >
                <Icon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', flex: 1 }}>{label}</span>
                <ChevronRight style={{ width: '12px', height: '12px', opacity: 0.4, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Contact Banner ── */}
      <div style={{
        padding: '16px 22px', borderRadius: '14px',
        background: 'linear-gradient(135deg,rgba(37,99,235,0.04) 0%,rgba(37,99,235,0.08) 100%)',
        border: '1px solid rgba(37,99,235,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: TK.text, marginBottom: '3px' }}>
            {language === 'ar' ? 'هل تحتاج مساعدة؟' : 'Need help?'}
          </div>
          <div style={{ fontSize: '12px', color: TK.textMuted }}>
            {language === 'ar' ? 'فريقنا متاح على واتساب والبريد الإلكتروني' : 'Our team is available on WhatsApp and email'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="https://wa.me/201090385390" target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px',
              borderRadius: '8px', background: '#25D366', color: '#fff',
              textDecoration: 'none', fontSize: '12px', fontWeight: 500,
            }}
          >
            <WaIcon />
            WhatsApp
          </a>
          <Link to="/app/support"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px',
              borderRadius: '8px', background: TK.surface, border: `1px solid ${TK.border}`,
              color: TK.textMuted, textDecoration: 'none', fontSize: '12px', fontWeight: 500, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = TK.accent; e.currentTarget.style.color = TK.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}
          >
            <LifeBuoy style={{ width: '12px', height: '12px' }} />
            {language === 'ar' ? 'مركز الدعم' : 'Support Center'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
