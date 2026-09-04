import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  ArrowUpLeft, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, CreditCard,
  FolderKanban, MessageSquare, Sparkles, UserCheck, Zap,
} from 'lucide-react';
import { fetchProjects } from '../store/projectSlice';
import { fetchMyRequests } from '../store/projectRequestSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, FONT, Badge, PageSpinner } from '../admin-ui';
import ProjectRequestForm from '../components/ProjectRequestForm';

const STATUS = {
  PLANNING: ['neutral', 'التخطيط', 'Planning'], DESIGN: ['info', 'التصميم', 'Design'],
  DEVELOPMENT: ['purple', 'التطوير', 'Development'], REVIEW: ['warning', 'المراجعة', 'Review'],
  COMPLETED: ['success', 'تم التسليم', 'Delivered'], PAUSED: ['neutral', 'متوقف مؤقتًا', 'Paused'],
  CANCELLED: ['danger', 'ملغي', 'Cancelled'],
};

// Request statuses come from server/models/ProjectRequest.js — 'new' |
// 'in-progress' | 'completed'. Only truthful, status-derived copy here —
// no promised response times or named account managers.
const REQUEST_STATUS = {
  'new':         ['info',    'قيد المراجعة',    'Under review'],
  'in-progress': ['warning', 'قيد المتابعة',    'Being worked on'],
  'completed':   ['success', 'تم التحويل لمشروع', 'Converted to a project'],
};

const getGreeting = (ar) => {
  const h = new Date().getHours();
  return ar ? (h < 12 ? 'صباح الخير' : h < 18 ? 'مساء الخير' : 'مساء النور') : (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
};

const fmtDate = (d, ar) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

const Dashboard = () => {
  const { language, isRTL } = useLanguage();
  const ar = language === 'ar';
  const Arrow = isRTL ? ArrowUpLeft : ArrowUpRight;
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { projects = [], loading } = useSelector(s => s.projects);
  const { requests = [], loading: requestsLoading, loaded: requestsLoaded } = useSelector(s => s.projectRequests);
  const { threads = [], totalUnread = 0 } = useSelector(s => s.messages);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    // The local-only visual QA route renders representative empty-state data
    // without calling protected APIs (and never exists in production).
    if (window.location.pathname.startsWith('/__visual/')) return;
    dispatch(fetchProjects());
    dispatch(fetchMyRequests());
  }, [dispatch]);

  const activeProject = useMemo(() => ['DEVELOPMENT', 'REVIEW', 'DESIGN', 'PLANNING', 'PAUSED']
    .map(status => projects.find(p => p.status === status)).find(Boolean)
    || projects.find(p => !['COMPLETED', 'CANCELLED'].includes(p.status)), [projects]);
  const completedProjects = useMemo(() => projects.filter(p => p.status === 'COMPLETED'), [projects]);
  const latestThread = useMemo(() => [...threads].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0], [threads]);
  const latestRequest = useMemo(() => [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0], [requests]);

  const active = projects.filter(p => !['COMPLETED', 'CANCELLED'].includes(p.status)).length;
  const completed = completedProjects.length;
  const name = user?.fullName?.trim().split(' ')[0] || (ar ? 'بك' : 'there');

  const T = {
    eyebrow: ar ? 'مساحة عملك مع YANSY' : 'YOUR YANSY WORKSPACE',
    subtitle: ar ? 'كل ما يخص مشروعك، واضح ومركّز وفي مكان واحد.' : 'Everything about your project, clear and focused in one place.',
    current: ar ? 'المشروع الجاري' : 'CURRENT PROJECT', open: ar ? 'فتح المشروع' : 'Open project', progress: ar ? 'نسبة الإنجاز' : 'Project progress',
    active: ar ? 'مشاريع نشطة' : 'Active projects', completed: ar ? 'مشاريع مكتملة' : 'Completed', unread: ar ? 'رسائل جديدة' : 'Unread messages', all: ar ? 'كل المشاريع' : 'Total projects',
    help: ar ? 'نحن قريبون دائمًا' : 'We are always close', helpBody: ar ? 'لديك سؤال أو تحتاج قرارًا سريعًا؟ فريقنا جاهز لمساعدتك.' : 'Have a question or need a quick decision? Our team is ready to help.',
    support: ar ? 'مركز الدعم' : 'Support center', message: ar ? 'راسل فريق YANSY' : 'Message YANSY team',
    messages: ar ? 'آخر المحادثات' : 'RECENT CONVERSATION', noMessages: ar ? 'لا توجد محادثات بعد' : 'No conversations yet',
    quick: ar ? 'اختصارات سريعة' : 'QUICK ACTIONS', projects: ar ? 'مشاريعي' : 'My projects', payments: ar ? 'المدفوعات' : 'Payments', meetings: ar ? 'الاجتماعات' : 'Meetings',
    startProject: ar ? 'ابدأ مشروعك' : 'Start your project',
    heroNoProjectTitle: ar ? `أهلاً بك في YANSY${name ? '، ' + name : ''}` : `Welcome to YANSY${name ? ', ' + name : ''}`,
    heroNoProjectBody: ar ? 'لا يوجد لديك مشروع نشط بعد. أخبرنا عمّا تريد بناءه وسنبدأ معك.' : "You don't have an active project yet. Tell us what you want to build and we'll take it from there.",
    heroRequestTitle: ar ? 'طلبك قيد المراجعة' : 'Your request is with us',
    reqSubmitted: ar ? 'أُرسل في' : 'Submitted',
    reqAssigned: ar ? 'المسؤول عن طلبك' : 'Assigned to',
    reqUnassigned: ar ? 'سيتم تعيين مسؤول قريبًا' : 'Not yet assigned to a team member',
    reqNextNew: ar ? 'يراجع فريقنا طلبك الآن — سنتواصل معك قريبًا لمناقشة التفاصيل.' : "Our team is reviewing your request and will reach out to discuss the details.",
    reqNextProgress: ar ? 'يعمل فريقنا على تجهيز مشروعك — تابع أي مستجدات عبر الرسائل.' : "Our team is preparing your project — check messages for any updates.",
    reqNextDone: ar ? 'تم تحويل طلبك إلى مشروع فعلي.' : 'Your request has been converted into an active project.',
    continueConvo: ar ? 'متابعة المحادثة' : 'Continue the conversation',
    newRequest: ar ? 'إرسال طلب جديد' : 'Submit a new request',
  };
  if ((loading || requestsLoading) && projects.length === 0 && !requestsLoaded) return <PageSpinner />;
  const metrics = [[T.active, active, Zap, '#2563EB'], [T.completed, completed, CheckCircle2, '#16A34A'], [T.unread, totalUnread, MessageSquare, '#7C3AED'], [T.all, projects.length, FolderKanban, '#D97706']];

  const progress = activeProject ? Math.min(100, Math.max(0, Number(activeProject.progress || 0))) : 0;
  const status = activeProject ? (STATUS[activeProject.status] || STATUS.PLANNING) : null;

  return <div className="client-dashboard" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: FONT(isRTL), color: TK.text }}>
    <style>{`
      .client-dashboard{max-width:1440px;margin:auto;padding:clamp(24px,4vw,52px);min-height:100vh}.cd-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}.cd-logo{width:132px;height:46px;object-fit:contain}
      .cd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.cd-metric,.cd-card{background:rgba(255,255,255,.9);border:1px solid ${TK.border};box-shadow:0 8px 30px rgba(15,23,42,.045)}.cd-metric{padding:18px;border-radius:16px;display:flex;align-items:center;gap:13px}
      .cd-main{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.75fr);gap:18px}.cd-card{border-radius:24px;overflow:hidden}.cd-project{background:linear-gradient(128deg,#07111f 0%,#0d1c38 54%,#123c91 130%);color:#fff;border:0;position:relative;min-height:390px;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr);isolation:isolate}.cd-project h2{color:#fff!important}.cd-project-copy{padding:clamp(28px,4vw,46px);display:flex;flex-direction:column;justify-content:center;position:relative;z-index:2}.cd-visual{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;min-height:390px}.cd-visual:before{content:'';position:absolute;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,.45),rgba(37,99,235,.08) 55%,transparent 72%);filter:blur(8px)}.cd-visual img{position:relative;z-index:1;width:min(118%,540px);filter:drop-shadow(0 32px 44px rgba(0,0,0,.36));transform:translateY(10px)}
      .cd-side{display:flex;flex-direction:column;gap:18px}.cd-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.cd-link{display:flex;align-items:center;justify-content:space-between;padding:14px 0;text-decoration:none;color:${TK.text};border-bottom:1px solid ${TK.borderSoft};transition:color .2s}.cd-link:last-child{border:0}.cd-link:hover{color:${TK.accent}}.cd-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:11px;text-decoration:none;font-weight:650;font-size:13px;transition:transform .2s;border:none;cursor:pointer;font-family:inherit}.cd-btn:hover{transform:translateY(-1px)}
      @media(max-width:1100px){.cd-project{grid-template-columns:1fr}.cd-visual{position:absolute;inset-inline-end:-70px;bottom:-55px;width:48%;opacity:.48}.cd-project-copy{max-width:68%;min-height:340px}}@media(max-width:980px){.cd-metrics{grid-template-columns:1fr 1fr}.cd-main{grid-template-columns:1fr}.cd-side{display:grid;grid-template-columns:1fr 1fr}}@media(max-width:640px){.client-dashboard{padding:20px 16px 40px}.cd-hero{align-items:flex-start;flex-direction:column}.cd-logo{display:none}.cd-metrics,.cd-grid,.cd-side{grid-template-columns:1fr}.cd-project{min-height:auto;display:block}.cd-project-copy{max-width:none;min-height:410px;justify-content:flex-start}.cd-visual{display:flex;position:absolute;width:260px;height:240px;min-height:0;inset-inline-end:-35px;bottom:-32px;opacity:.55}.cd-visual img{width:290px}.cd-project h2{max-width:85%}}
    `}</style>
    <header className="cd-hero"><div><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TK.accent, fontSize: 11, fontWeight: 700, letterSpacing: ar ? 0 : '.1em', marginBottom: 10 }}><Sparkles size={14}/>{T.eyebrow}</div><h1 style={{ margin: 0, fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.22, letterSpacing: ar ? '-.025em' : '-.04em', fontWeight: 750 }}>{getGreeting(ar)}، {name}</h1><p style={{ margin: '9px 0 0', color: TK.textMuted, fontSize: 14.5 }}>{T.subtitle}</p></div><img className="cd-logo" src="/assets/image/logo/logo-2.png" alt="YANSY Tech" /></header>
    <section className="cd-metrics" aria-label={ar ? 'ملخص الحساب' : 'Account summary'}>{metrics.map(([label, value, Icon, tone]) => <div className="cd-metric" key={label}><div style={{ width: 40, height: 40, borderRadius: 12, background: `${tone}12`, color: tone, display: 'grid', placeItems: 'center' }}><Icon size={18}/></div><div><strong style={{ display: 'block', fontSize: 24, lineHeight: 1 }}>{value}</strong><span style={{ color: TK.textMuted, fontSize: 11.5 }}>{label}</span></div></div>)}</section>
    <div className="cd-main">
      {activeProject ? (
        /* ── State: active project — real progress, real status ────────── */
        <section className="cd-card cd-project"><div className="cd-project-copy"><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span style={{ fontSize: 11, letterSpacing: ar ? 0 : '.12em', color: 'rgba(255,255,255,.62)', fontWeight: 650 }}>{T.current}</span><Badge tone={status[0]} dot>{ar ? status[1] : status[2]}</Badge></div><h2 style={{ fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.2, maxWidth: 580, margin: '34px 0 10px', letterSpacing: ar ? '-.035em' : '-.045em' }}>{activeProject.name || activeProject.title}</h2><p style={{ color: 'rgba(255,255,255,.66)', fontSize: 13 }}>{T.progress}</p><div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}><div style={{ height: 7, flex: 1, maxWidth: 410, borderRadius: 10, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#3B82F6,#fff)' }}/></div><strong dir="ltr">{progress}%</strong></div><div style={{ marginTop: 34 }}><Link className="cd-btn" to={`/app/projects/${activeProject._id}`} style={{ background: '#fff', color: '#172554' }}>{T.open}<Arrow size={15}/></Link></div></div><div className="cd-visual" aria-hidden="true"><img src="/assets/image/yansy-command-center-3d-v1.png" alt="" /></div></section>
      ) : latestRequest ? (
        /* ── State: a request was submitted, no active project yet ─────── */
        (() => {
          const reqStatus = REQUEST_STATUS[latestRequest.status] || REQUEST_STATUS.new;
          const nextCopy = latestRequest.status === 'completed' ? T.reqNextDone : latestRequest.status === 'in-progress' ? T.reqNextProgress : T.reqNextNew;
          return (
            <section className="cd-card cd-project"><div className="cd-project-copy">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontSize: 11, letterSpacing: ar ? 0 : '.12em', color: 'rgba(255,255,255,.62)', fontWeight: 650 }}>{T.heroRequestTitle}</span>
                <Badge tone={reqStatus[0]} dot>{ar ? reqStatus[1] : reqStatus[2]}</Badge>
              </div>
              <h2 style={{ fontSize: 'clamp(24px,3.4vw,36px)', lineHeight: 1.25, maxWidth: 560, margin: '28px 0 14px', letterSpacing: ar ? '-.03em' : '-.04em' }}>
                {latestRequest.projectDescription?.slice(0, 140)}{latestRequest.projectDescription?.length > 140 ? '…' : ''}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,.72)' }}>
                  <CalendarDays size={13} /> {T.reqSubmitted} {fmtDate(latestRequest.createdAt, ar)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,.72)' }}>
                  <UserCheck size={13} /> {latestRequest.assignedTo?.fullName ? `${T.reqAssigned}: ${latestRequest.assignedTo.fullName}` : T.reqUnassigned}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 13.5, lineHeight: 1.7, maxWidth: 480, margin: '0 0 26px', display: 'flex', gap: 8 }}>
                <Clock3 size={15} style={{ flexShrink: 0, marginTop: 2 }} /> {nextCopy}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link className="cd-btn" to="/app/messages" style={{ background: '#fff', color: '#172554' }}>{T.continueConvo}<Arrow size={15}/></Link>
                <button className="cd-btn" onClick={() => setShowRequestForm(true)} style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.25)' }}>{T.newRequest}</button>
              </div>
            </div><div className="cd-visual" aria-hidden="true"><img src="/assets/image/yansy-command-center-3d-v1.png" alt="" /></div></section>
          );
        })()
      ) : (
        /* ── State: no request, no project — clear first action ────────── */
        <section className="cd-card cd-project"><div className="cd-project-copy">
          <span style={{ fontSize: 11, letterSpacing: ar ? 0 : '.12em', color: 'rgba(255,255,255,.62)', fontWeight: 650 }}>{T.eyebrow}</span>
          <h2 style={{ fontSize: 'clamp(26px,3.8vw,40px)', lineHeight: 1.22, maxWidth: 520, margin: '20px 0 12px', letterSpacing: ar ? '-.03em' : '-.04em' }}>{T.heroNoProjectTitle}</h2>
          <p style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, lineHeight: 1.7, maxWidth: 460, margin: '0 0 26px' }}>{T.heroNoProjectBody}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="cd-btn" onClick={() => setShowRequestForm(true)} style={{ background: '#fff', color: '#172554' }}>{T.startProject}<Sparkles size={15}/></button>
            <Link className="cd-btn" to="/app/messages" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.25)' }}>{T.message}</Link>
          </div>
        </div><div className="cd-visual" aria-hidden="true"><img src="/assets/image/yansy-command-center-3d-v1.png" alt="" /></div></section>
      )}
      <aside className="cd-side">
        <section className="cd-card" style={{ padding: 24, background: 'linear-gradient(145deg,#EFF6FF,#fff)' }}><span style={{ color: TK.accent, fontSize: 11, fontWeight: 700 }}>{T.help}</span><p style={{ color: TK.textMuted, fontSize: 12.5, lineHeight: 1.8 }}>{T.helpBody}</p><Link to="/app/support" className="cd-btn" style={{ background: TK.accent, color: '#fff' }}>{T.support}<Arrow size={14}/></Link></section>
        {completed > 0 && (
          <section className="cd-card" style={{ padding: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(22,163,74,.1)', color: '#16A34A', display: 'grid', placeItems: 'center', marginBottom: 16 }}><CheckCircle2 size={18}/></div>
            <h2 style={{ fontSize: 15, margin: '0 0 6px' }}>{ar ? `${completed} مشروع مكتمل` : `${completed} completed project${completed !== 1 ? 's' : ''}`}</h2>
            <p style={{ color: TK.textMuted, fontSize: 12.5, lineHeight: 1.7, margin: '0 0 12px' }}>{ar ? 'استعرض التسليمات والملفات النهائية.' : 'Review deliverables and final files.'}</p>
            <Link to="/app/projects" className="cd-btn" style={{ background: TK.bg, color: TK.text, border: `1px solid ${TK.border}` }}>{T.projects}<Arrow size={14}/></Link>
          </section>
        )}
      </aside>
    </div>
    <div className="cd-grid"><section className="cd-card" style={{ padding: '22px 24px' }}><h2 style={{ fontSize: 12, color: TK.textMuted }}>{T.messages}</h2>{latestThread ? <Link className="cd-link" to="/app/messages"><strong>{latestThread.subject || latestThread.projectName || T.messages}</strong><Arrow size={16}/></Link> : <div style={{ color: TK.textLight, fontSize: 13, padding: '18px 0' }}>{T.noMessages}</div>}</section><section className="cd-card" style={{ padding: '22px 24px' }}><h2 style={{ fontSize: 12, color: TK.textMuted }}>{T.quick}</h2>{[['/app/projects', FolderKanban, T.projects], ['/app/payments', CreditCard, T.payments], ['/app/meetings', CalendarDays, T.meetings]].map(([to, Icon, label]) => <Link className="cd-link" to={to} key={to}><span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon size={16} color={TK.accent}/>{label}</span><Arrow size={15}/></Link>)}</section></div>

    <ProjectRequestForm isOpen={showRequestForm} onClose={() => { setShowRequestForm(false); dispatch(fetchMyRequests()); }} />
  </div>;
};
export default Dashboard;
