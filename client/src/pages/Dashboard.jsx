import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowUpLeft, ArrowUpRight, CalendarDays, CheckCircle2, CreditCard, FolderKanban, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { fetchProjects } from '../store/projectSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, FONT, Badge, PageSpinner } from '../admin-ui';

const STATUS = {
  PLANNING: ['neutral', 'التخطيط', 'Planning'], DESIGN: ['info', 'التصميم', 'Design'],
  DEVELOPMENT: ['purple', 'التطوير', 'Development'], REVIEW: ['warning', 'المراجعة', 'Review'],
  COMPLETED: ['success', 'تم التسليم', 'Delivered'], PAUSED: ['neutral', 'متوقف مؤقتًا', 'Paused'],
  CANCELLED: ['danger', 'ملغي', 'Cancelled'],
};
const getGreeting = (ar) => {
  const h = new Date().getHours();
  return ar ? (h < 12 ? 'صباح الخير' : h < 18 ? 'مساء الخير' : 'مساء النور') : (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
};

const Dashboard = () => {
  const { language, isRTL } = useLanguage();
  const ar = language === 'ar';
  const Arrow = isRTL ? ArrowUpLeft : ArrowUpRight;
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { projects = [], loading } = useSelector(s => s.projects);
  const { threads = [], totalUnread = 0 } = useSelector(s => s.messages);
  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  const activeProject = useMemo(() => ['DEVELOPMENT', 'REVIEW', 'DESIGN', 'PLANNING', 'PAUSED']
    .map(status => projects.find(p => p.status === status)).find(Boolean)
    || projects.find(p => !['COMPLETED', 'CANCELLED'].includes(p.status)) || projects[0], [projects]);
  const latestThread = useMemo(() => [...threads].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0], [threads]);
  const active = projects.filter(p => !['COMPLETED', 'CANCELLED'].includes(p.status)).length;
  const completed = projects.filter(p => p.status === 'COMPLETED').length;
  const progress = Math.min(100, Math.max(0, Number(activeProject?.progress || 0)));
  const status = STATUS[activeProject?.status] || STATUS.PLANNING;
  const name = user?.fullName?.trim().split(' ')[0] || (ar ? 'بك' : 'there');

  const T = {
    eyebrow: ar ? 'مساحة عملك مع YANSY' : 'YOUR YANSY WORKSPACE',
    subtitle: ar ? 'كل ما يخص مشروعك، واضح ومركّز وفي مكان واحد.' : 'Everything about your project, clear and focused in one place.',
    current: ar ? 'المشروع الجاري' : 'CURRENT PROJECT', open: ar ? 'فتح المشروع' : 'Open project', progress: ar ? 'نسبة الإنجاز' : 'Project progress',
    active: ar ? 'مشاريع نشطة' : 'Active projects', completed: ar ? 'مشاريع مكتملة' : 'Completed', unread: ar ? 'رسائل جديدة' : 'Unread messages', all: ar ? 'كل المشاريع' : 'Total projects',
    next: ar ? 'خطوتك التالية' : 'YOUR NEXT STEP', nextTitle: ar ? 'تابع آخر المستجدات' : 'Stay on top of progress',
    nextBody: ar ? 'راجع تفاصيل المشروع والملفات والملاحظات الجديدة من فريق YANSY.' : 'Review new project details, files and notes from the YANSY team.',
    help: ar ? 'نحن قريبون دائمًا' : 'We are always close', helpBody: ar ? 'لديك سؤال أو تحتاج قرارًا سريعًا؟ فريقنا جاهز لمساعدتك.' : 'Have a question or need a quick decision? Our team is ready to help.',
    support: ar ? 'مركز الدعم' : 'Support center', messages: ar ? 'آخر المحادثات' : 'RECENT CONVERSATION', noMessages: ar ? 'لا توجد محادثات بعد' : 'No conversations yet',
    quick: ar ? 'اختصارات سريعة' : 'QUICK ACTIONS', projects: ar ? 'مشاريعي' : 'My projects', payments: ar ? 'المدفوعات' : 'Payments', meetings: ar ? 'الاجتماعات' : 'Meetings',
  };
  if (loading && projects.length === 0) return <PageSpinner />;
  const metrics = [[T.active, active, Zap, '#2563EB'], [T.completed, completed, CheckCircle2, '#16A34A'], [T.unread, totalUnread, MessageSquare, '#7C3AED'], [T.all, projects.length, FolderKanban, '#D97706']];

  return <div className="client-dashboard" dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: FONT(isRTL), color: TK.text }}>
    <style>{`
      .client-dashboard{max-width:1440px;margin:auto;padding:clamp(24px,4vw,52px);min-height:100vh}.cd-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}.cd-logo{width:132px;height:46px;object-fit:contain}
      .cd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.cd-metric,.cd-card{background:rgba(255,255,255,.9);border:1px solid ${TK.border};box-shadow:0 8px 30px rgba(15,23,42,.045)}.cd-metric{padding:18px;border-radius:16px;display:flex;align-items:center;gap:13px}
      .cd-main{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.75fr);gap:18px}.cd-card{border-radius:20px;overflow:hidden}.cd-project{background:linear-gradient(135deg,#101828,#172554 65%,#1D4ED8 145%);color:#fff;border:0;padding:clamp(24px,4vw,38px);position:relative;min-height:310px}.cd-project:after{content:'';position:absolute;width:340px;height:340px;border:1px solid rgba(255,255,255,.1);border-radius:50%;inset-inline-end:-120px;top:-170px;box-shadow:0 0 0 45px rgba(255,255,255,.035),0 0 0 90px rgba(255,255,255,.02)}.cd-project>*{position:relative;z-index:1}
      .cd-side{display:flex;flex-direction:column;gap:18px}.cd-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.cd-link{display:flex;align-items:center;justify-content:space-between;padding:14px 0;text-decoration:none;color:${TK.text};border-bottom:1px solid ${TK.borderSoft};transition:color .2s}.cd-link:last-child{border:0}.cd-link:hover{color:${TK.accent}}.cd-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:11px;text-decoration:none;font-weight:650;font-size:13px;transition:transform .2s}.cd-btn:hover{transform:translateY(-1px)}
      @media(max-width:980px){.cd-metrics{grid-template-columns:1fr 1fr}.cd-main{grid-template-columns:1fr}.cd-side{display:grid;grid-template-columns:1fr 1fr}}@media(max-width:640px){.client-dashboard{padding:20px 16px 40px}.cd-hero{align-items:flex-start;flex-direction:column}.cd-logo{display:none}.cd-metrics,.cd-grid,.cd-side{grid-template-columns:1fr}.cd-project{min-height:auto}.cd-project:after{display:none}}
    `}</style>
    <header className="cd-hero"><div><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TK.accent, fontSize: 11, fontWeight: 700, letterSpacing: ar ? 0 : '.1em', marginBottom: 10 }}><Sparkles size={14}/>{T.eyebrow}</div><h1 style={{ margin: 0, fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.22, letterSpacing: ar ? '-.025em' : '-.04em', fontWeight: 750 }}>{getGreeting(ar)}، {name}</h1><p style={{ margin: '9px 0 0', color: TK.textMuted, fontSize: 14.5 }}>{T.subtitle}</p></div><img className="cd-logo" src="/assets/image/logo/logo-2.png" alt="YANSY Tech" /></header>
    <section className="cd-metrics" aria-label={ar ? 'ملخص الحساب' : 'Account summary'}>{metrics.map(([label, value, Icon, tone]) => <div className="cd-metric" key={label}><div style={{ width: 40, height: 40, borderRadius: 12, background: `${tone}12`, color: tone, display: 'grid', placeItems: 'center' }}><Icon size={18}/></div><div><strong style={{ display: 'block', fontSize: 24, lineHeight: 1 }}>{value}</strong><span style={{ color: TK.textMuted, fontSize: 11.5 }}>{label}</span></div></div>)}</section>
    <div className="cd-main">
      <section className="cd-card cd-project"><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span style={{ fontSize: 11, letterSpacing: ar ? 0 : '.12em', color: 'rgba(255,255,255,.62)', fontWeight: 650 }}>{T.current}</span>{activeProject && <Badge tone={status[0]} dot>{ar ? status[1] : status[2]}</Badge>}</div><h2 style={{ fontSize: 'clamp(25px,4vw,38px)', lineHeight: 1.25, maxWidth: 670, margin: '34px 0 10px' }}>{activeProject?.name || activeProject?.title || (ar ? 'مشروعك الحالي' : 'Your current project')}</h2><p style={{ color: 'rgba(255,255,255,.66)', fontSize: 13 }}>{T.progress}</p><div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}><div style={{ height: 7, flex: 1, maxWidth: 560, borderRadius: 10, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#60A5FA,#fff)' }}/></div><strong dir="ltr">{progress}%</strong></div><div style={{ marginTop: 34 }}><Link className="cd-btn" to={activeProject?._id ? `/app/projects/${activeProject._id}` : '/app/projects'} style={{ background: '#fff', color: '#172554' }}>{T.open}<Arrow size={15}/></Link></div></section>
      <aside className="cd-side"><section className="cd-card" style={{ padding: 24 }}><div style={{ width: 40, height: 40, borderRadius: 12, background: TK.accentBg, color: TK.accent, display: 'grid', placeItems: 'center', marginBottom: 22 }}><Zap size={18}/></div><span style={{ color: TK.textLight, fontSize: 10.5, fontWeight: 700 }}>{T.next}</span><h2 style={{ fontSize: 18, margin: '8px 0 7px' }}>{T.nextTitle}</h2><p style={{ color: TK.textMuted, fontSize: 12.5, lineHeight: 1.8 }}>{T.nextBody}</p></section><section className="cd-card" style={{ padding: 24, background: 'linear-gradient(145deg,#EFF6FF,#fff)' }}><span style={{ color: TK.accent, fontSize: 11, fontWeight: 700 }}>{T.help}</span><p style={{ color: TK.textMuted, fontSize: 12.5, lineHeight: 1.8 }}>{T.helpBody}</p><Link to="/app/support" className="cd-btn" style={{ background: TK.accent, color: '#fff' }}>{T.support}<Arrow size={14}/></Link></section></aside>
    </div>
    <div className="cd-grid"><section className="cd-card" style={{ padding: '22px 24px' }}><h2 style={{ fontSize: 12, color: TK.textMuted }}>{T.messages}</h2>{latestThread ? <Link className="cd-link" to="/app/messages"><strong>{latestThread.subject || latestThread.title || T.messages}</strong><Arrow size={16}/></Link> : <div style={{ color: TK.textLight, fontSize: 13, padding: '18px 0' }}>{T.noMessages}</div>}</section><section className="cd-card" style={{ padding: '22px 24px' }}><h2 style={{ fontSize: 12, color: TK.textMuted }}>{T.quick}</h2>{[['/app/projects', FolderKanban, T.projects], ['/app/payments', CreditCard, T.payments], ['/app/meetings', CalendarDays, T.meetings]].map(([to, Icon, label]) => <Link className="cd-link" to={to} key={to}><span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon size={16} color={TK.accent}/>{label}</span><Arrow size={15}/></Link>)}</section></div>
  </div>;
};
export default Dashboard;
