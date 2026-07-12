/**
 * YANSY AI — Premium Business Consultant Widget
 * Split-panel intelligence interface: conversation + live project blueprint
 */
import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const WA_NUMBER     = '201090385390';
const SESSION_KEY   = 'yansy_chat_session';
const HISTORY_KEY   = 'yansy_chat_history';
const COLLECTED_KEY = 'yansy_chat_collected';
const INTEL_KEY     = 'yansy_chat_intelligence';
const CONVLIST_KEY  = 'yansy_conv_list';
const MAX_HISTORY   = 30;

const getApiBase = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

// ── Stage resolver ─────────────────────────────────────────────────────────────
const getStageNum = (c = {}) => {
  if (c.name && (c.phone || c.email)) return 5;
  if (c.name)                          return 4;
  if (c.timeline)                      return 3;
  if (c.features || c.business)        return 2;
  if (c.projectType)                   return 1;
  return 0;
};

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes yai-dot   { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
  @keyframes yai-fs-in { from{opacity:0;transform:scale(.98)} to{opacity:1;transform:scale(1)} }
  @keyframes yai-pulse { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.6);opacity:0} }
  @keyframes yai-up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes yai-in    { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes yai-fade  { from{opacity:0} to{opacity:1} }
  @keyframes yai-blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes yai-spin  { to{transform:rotate(360deg)} }
  @keyframes yai-glow  { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes yai-card  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes yai-score { from{width:0} }
  @keyframes yai-think { 0%{opacity:.4} 50%{opacity:1} 100%{opacity:.4} }
  .yai-win    { animation: yai-in .32s cubic-bezier(.16,1,.3,1) both; }
  .yai-notif  { animation: yai-up .28s cubic-bezier(.16,1,.3,1) both; }
  .yai-fade   { animation: yai-fade .4s ease both; }
  .yai-msg-ai { animation: yai-up .24s cubic-bezier(.16,1,.3,1) both; }
  .yai-msg-usr{ animation: yai-up .2s cubic-bezier(.16,1,.3,1) both; }
  .yai-card   { animation: yai-card .32s cubic-bezier(.16,1,.3,1) both; }
  .yai-scroll::-webkit-scrollbar { width:4px; }
  .yai-scroll::-webkit-scrollbar-thumb { background:#E8EBF0; border-radius:2px; }
  .yai-scroll::-webkit-scrollbar-track { background:transparent; }
  .yai-cursor::after { content:'▋'; animation:yai-blink .8s step-end infinite; font-size:.85em; opacity:.6; margin-left:1px; }
  .yai-btn:hover { background:#EFF6FF !important; border-color:rgba(37,99,235,.35) !important; color:#2563EB !important; transform:translateY(-1px); }
  .yai-send:hover:not(:disabled) { background:#1d4ed8 !important; transform:scale(1.05); box-shadow:0 4px 14px rgba(37,99,235,.35) !important; }
  .yai-ico:hover { background:#F0F2F5 !important; border-color:#C9CDD6 !important; color:#374151 !important; }
  .yai-wa:hover  { filter:brightness(1.1); transform:translateY(-1px); }
  .yai-chip { animation: yai-up .25s cubic-bezier(.16,1,.3,1) both; }
`;

// ── Greeting ───────────────────────────────────────────────────────────────────
const GREETING = {
  en: "Hello! 👋 I'm YANSY's Senior AI Business Consultant.\n\nI'm here to help you design the perfect digital solution and connect you with our expert team.\n\nWhat are you looking to build?",
  ar: 'مرحباً! 👋 أنا مستشار YANSY الأعمال الرقمية.\n\nأنا هنا لمساعدتك في تصميم الحل التقني المثالي والتواصل مع فريقنا المتخصص.\n\nماذا تريد أن تبني؟',
};

// ── Discovery buttons ──────────────────────────────────────────────────────────
const DISCOVERY_BUTTONS = {
  en: [
    { icon: '🌐', label: 'Website',       msg: 'I need to build a professional website' },
    { icon: '📱', label: 'Mobile App',    msg: 'I need a mobile app for iOS and Android' },
    { icon: '🛒', label: 'E-Commerce',    msg: 'I need an online store' },
    { icon: '⚡', label: 'SaaS Platform', msg: 'I want to build a SaaS platform' },
    { icon: '🤖', label: 'AI Solution',   msg: 'I want AI integrated into my business' },
    { icon: '📅', label: 'Consultation',  msg: 'I would like a free consultation' },
  ],
  ar: [
    { icon: '🌐', label: 'موقع ويب',      msg: 'أحتاج بناء موقع ويب احترافي' },
    { icon: '📱', label: 'تطبيق موبايل', msg: 'أحتاج تطبيقاً للجوال' },
    { icon: '🛒', label: 'متجر إلكتروني',msg: 'أحتاج متجراً إلكترونياً' },
    { icon: '⚡', label: 'منصة SaaS',     msg: 'أريد بناء منصة SaaS' },
    { icon: '🤖', label: 'ذكاء اصطناعي', msg: 'أريد دمج الذكاء الاصطناعي في أعمالي' },
    { icon: '📅', label: 'استشارة',       msg: 'أريد حجز استشارة مجانية' },
  ],
};

// ── Stage labels ───────────────────────────────────────────────────────────────
const STAGE_STEPS = {
  en: ['Intent', 'Scope', 'Context', 'Timeline', 'Contact'],
  ar: ['النية', 'النطاق', 'السياق', 'الوقت', 'التواصل'],
};

// ── Thinking states ────────────────────────────────────────────────────────────
const THINKING_EN = [
  { icon: '🔍', text: 'Analyzing your request...' },
  { icon: '📋', text: 'Building your blueprint...' },
  { icon: '📊', text: 'Calculating estimates...' },
  { icon: '💡', text: 'Crafting recommendation...' },
];
const THINKING_AR = [
  { icon: '🔍', text: 'جاري تحليل طلبك...' },
  { icon: '📋', text: 'جاري بناء المخطط...' },
  { icon: '📊', text: 'جاري الحساب...' },
  { icon: '💡', text: 'جاري صياغة التوصية...' },
];

// ── Rich text renderer ──────────────────────────────────────────────────────────
const fmtInline = (text) =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: '#0D1117', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*')  && part.endsWith('*'))  return <em key={i} style={{ color: '#374151' }}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`')  && part.endsWith('`'))  return <code key={i} style={{ background: 'rgba(37,99,235,.1)', color: '#2563EB', padding: '1px 5px', borderRadius: 3, fontSize: '.9em', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
    return part;
  });

const RichText = memo(({ text, streaming }) => {
  const lines = (text || '').split('\n');
  const els = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() && i > 0) { els.push(<div key={i} style={{ height: 5 }} />); }
    else if (line.startsWith('### ')) { els.push(<p key={i} style={{ margin: '8px 0 3px', fontWeight: 700, fontSize: 12.5, color: '#2563EB' }}>{line.slice(4)}</p>); }
    else if (line.startsWith('## ')) { els.push(<p key={i} style={{ margin: '10px 0 4px', fontWeight: 700, fontSize: 13, color: '#0D1117' }}>{line.slice(3)}</p>); }
    else if (/^[\-•*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\-•*]\s/.test(lines[i])) { items.push(<li key={i} style={{ marginBottom: 3 }}>{fmtInline(lines[i].slice(2))}</li>); i++; }
      els.push(<ul key={`ul${i}`} style={{ margin: '5px 0', paddingLeft: 16, listStyle: 'disc' }}>{items}</ul>); continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(<li key={i} style={{ marginBottom: 3 }}>{fmtInline(lines[i].replace(/^\d+\.\s/, ''))}</li>); i++; }
      els.push(<ol key={`ol${i}`} style={{ margin: '5px 0', paddingLeft: 18 }}>{items}</ol>); continue;
    } else if (line.trim()) { els.push(<p key={i} style={{ margin: 0, lineHeight: 1.65 }}>{fmtInline(line)}</p>); }
    i++;
  }
  if (streaming) els.push(<span key="cur" className="yai-cursor" />);
  return <>{els}</>;
});
RichText.displayName = 'RichText';

// ── Icons ──────────────────────────────────────────────────────────────────────
const WaIcon    = ({ size = 16 }) => <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
const SendIcon  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const MinIcon   = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const CloseIcon = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const MicIcon   = ({ on }) => <svg width="12" height="12" fill={on ? '#2563EB' : 'currentColor'} viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const PanelIcon = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>;

// ── Typing dots ─────────────────────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '10px 14px' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9CDD6', display: 'block', animation: `yai-dot 1.3s ease-in-out ${i * 0.22}s infinite` }} />
    ))}
  </div>
);

// ── Thinking state (during streaming, no content yet) ──────────────────────────
const ThinkingState = memo(({ lang }) => {
  const [idx, setIdx] = useState(0);
  const states = lang === 'ar' ? THINKING_AR : THINKING_EN;
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % states.length), 2100);
    return () => clearInterval(t);
  }, [states.length]);
  const s = states[idx];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ fontSize: 14, animation: 'yai-think 1.8s ease infinite' }}>{s.icon}</span>
      <span style={{ fontSize: 12, color: 'rgba(37,99,235,.6)', fontStyle: 'italic' }}>{s.text}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(37,99,235,.45)', animation: `yai-dot 1.3s ease ${i*.22}s infinite` }} />)}
      </div>
    </div>
  );
});
ThinkingState.displayName = 'ThinkingState';

// ── Stage progress bar ──────────────────────────────────────────────────────────
const StageBar = memo(({ stage, lang }) => {
  if (stage === 0) return null;
  const steps = STAGE_STEPS[lang] || STAGE_STEPS.en;
  const color = stage >= 5 ? '#22c55e' : '#2563EB';
  return (
    <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid #E8EBF0', background: '#F6F7F9', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 6 }}>
        {steps.map((label, i) => {
          const done   = i < stage;
          const active = i === stage - 1;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: done ? color : 'rgba(255,255,255,.05)', border: `1.5px solid ${active ? color : done ? color : 'rgba(255,255,255,.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: done ? '#fff' : '#9BA3AE', fontWeight: 700, transition: 'all .4s ease' }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 8, color: active ? color : done ? '#374151' : '#9BA3AE', letterSpacing: '.02em', textAlign: 'center', transition: 'color .4s' }}>{label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ height: 2, background: '#E8EBF0', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ width: `${Math.round((Math.min(stage,5)/5)*100)}%`, height: '100%', background: `linear-gradient(90deg,${color},${color}cc)`, borderRadius: 1, transition: 'width .6s ease' }} />
      </div>
    </div>
  );
});
StageBar.displayName = 'StageBar';

// ── Intelligence strip — compact horizontal bar for narrow screens ─────────────
const IntelligenceStrip = memo(({ intelligence, collected, leadScore: fallbackScore, lang }) => {
  const { leadScore = fallbackScore || 0, industry, projectType, complexity, estimatedBudget } = intelligence || {};
  const hasData = industry || (projectType || collected?.projectType) || complexity || estimatedBudget || leadScore > 0;
  if (!hasData) return null;
  const tierColor  = leadScore >= 70 ? '#22c55e' : leadScore >= 40 ? '#2563EB' : '#C9CDD6';
  const cxColor    = complexity === 'Enterprise' ? '#f59e0b' : complexity === 'High' ? '#8b5cf6' : complexity === 'Medium' ? '#06b6d4' : '#22c55e';
  const isAR = lang === 'ar';
  return (
    <div style={{ padding: '6px 12px', borderBottom: '1px solid #E8EBF0', background: '#F6F7F9', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', flexShrink: 0 }}>
      {industry && <Tag label={industry} color="#2563EB" />}
      {complexity && <Tag label={complexity} color={cxColor} />}
      {estimatedBudget && <Tag label={estimatedBudget} color="#22c55e" />}
      {leadScore > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
          <span style={{ fontSize: 9, color: '#9BA3AE', textTransform: 'uppercase', letterSpacing: '.05em' }}>{isAR ? 'التقييم' : 'Score'}</span>
          <div style={{ width: 44, height: 4, background: '#E8EBF0', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${leadScore}%`, height: '100%', background: tierColor, borderRadius: 2, transition: 'width .8s ease', animation: 'yai-score .8s ease' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: tierColor, fontFamily: 'monospace' }}>{leadScore}</span>
        </div>
      )}
    </div>
  );
});
IntelligenceStrip.displayName = 'IntelligenceStrip';

const Tag = ({ label, color }) => (
  <span style={{ fontSize: 9.5, color, background: `${color}18`, border: `1px solid ${color}28`, padding: '2px 7px', borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
);

// ── Intelligence panel — full right-side panel ─────────────────────────────────
const IntelligencePanel = memo(({ intelligence, collected, leadScore: fallbackScore, lang }) => {
  const isAR = lang === 'ar';
  const {
    leadScore = fallbackScore || 0, industry, projectType, complexity,
    estimatedBudget, estimatedTimeline, recommendation,
  } = intelligence || {};

  const hasProject = industry || (projectType || collected?.projectType) || complexity;
  const hasBudget  = !!estimatedBudget;
  const hasTime    = !!estimatedTimeline;
  const hasScore   = leadScore > 0;
  const hasRec     = !!recommendation;
  const hasContact = collected?.name || collected?.phone || collected?.email;
  const hasAny     = hasProject || hasBudget || hasTime || hasScore || hasRec || hasContact;

  const tierColor = leadScore >= 70 ? '#22c55e' : leadScore >= 40 ? '#2563EB' : '#C9CDD6';
  const tierLabel = leadScore >= 70 ? (isAR ? 'عميل محتمل' : 'Qualified') : leadScore >= 40 ? (isAR ? 'واعد' : 'Warm Lead') : (isAR ? 'استكشاف' : 'Discovery');
  const cxColor   = complexity === 'Enterprise' ? '#f59e0b' : complexity === 'High' ? '#8b5cf6' : complexity === 'Medium' ? '#06b6d4' : '#22c55e';

  return (
    // <div className="yai-scroll" style={{ width: 210, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,.05)', background: 'rgba(0,0,0,.25)', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>

    
    //   <div style={{ padding: '11px 12px 8px', borderBottom: '1px solid rgba(37,99,235,.08)', flexShrink: 0 }}>
    //     <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: 'rgba(37,99,235,.55)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
    //       ✦ {isAR ? 'مخطط المشروع' : 'Live Blueprint'}
    //     </p>
    //   </div>

    //   <div style={{ flex: 1, padding: '10px 10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

    
    //     {!hasAny && (
    //       <div style={{ padding: '20px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    //         {['Industry', 'Project', 'Complexity'].map(lbl => (
    //           <div key={lbl} style={{ width: '100%', height: 30, background: 'rgba(255,255,255,.02)', borderRadius: 6, border: '1px dashed rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
    //             <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,.14)' }}>{lbl}</span>
    //           </div>
    //         ))}
    //         <p style={{ margin: '6px 0 0', fontSize: 10, color: 'rgba(255,255,255,.18)', textAlign: 'center', lineHeight: 1.6 }}>
    //           {isAR ? 'يُبنى المخطط أثناء المحادثة' : 'Blueprint builds as you chat...'}
    //         </p>
    //       </div>
    //     )}

    //     {hasProject && (
    //       <div className="yai-card" style={{ background: 'rgba(37,99,235,.04)', border: '1px solid rgba(37,99,235,.1)', borderRadius: 10, padding: '10px 11px', display: 'flex', flexDirection: 'column', gap: 7 }}>
    //         {industry && <IPRow label={isAR ? 'القطاع' : 'Industry'} value={industry} />}
    //         {(projectType || collected?.projectType) && <IPRow label={isAR ? 'المشروع' : 'Project'} value={projectType || collected.projectType} />}
    //         {complexity && (
    //           <div>
    //             <p style={{ margin: '0 0 3px', fontSize: 8, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{isAR ? 'التعقيد' : 'Complexity'}</p>
    //             <span style={{ fontSize: 10, fontWeight: 700, color: cxColor, background: `${cxColor}18`, padding: '2px 8px', borderRadius: 4, border: `1px solid ${cxColor}28` }}>{complexity}</span>
    //           </div>
    //         )}
    //       </div>
    //     )}

  
    //     {hasBudget && (
    //       <div className="yai-card" style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.14)', borderRadius: 10, padding: '10px 11px' }}>
    //         <p style={{ margin: '0 0 4px', fontSize: 8, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.06em' }}>💰 {isAR ? 'تقدير الميزانية' : 'Budget Est.'}</p>
    //         <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#22c55e', letterSpacing: '-.01em', lineHeight: 1.2 }}>{estimatedBudget}</p>
    //       </div>
    //     )}

    
    //     {hasTime && (
    //       <div className="yai-card" style={{ background: 'rgba(6,182,212,.04)', border: '1px solid rgba(6,182,212,.14)', borderRadius: 10, padding: '10px 11px' }}>
    //         <p style={{ margin: '0 0 4px', fontSize: 8, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.06em' }}>⏱ {isAR ? 'الجدول الزمني' : 'Timeline Est.'}</p>
    //         <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#06b6d4', letterSpacing: '-.01em', lineHeight: 1.2 }}>{estimatedTimeline}</p>
    //       </div>
    //     )}

 
    //     {hasScore && (
    //       <div className="yai-card" style={{ background: 'rgba(0,0,0,.2)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '10px 11px' }}>
    //         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
    //           <p style={{ margin: 0, fontSize: 8, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{isAR ? 'تقييم العميل' : 'Lead Score'}</p>
    //           <span style={{ fontSize: 8.5, fontWeight: 700, color: tierColor, background: `${tierColor}18`, padding: '1.5px 7px', borderRadius: 4, border: `1px solid ${tierColor}28` }}>{tierLabel}</span>
    //         </div>
    //         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    //           <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.05)', borderRadius: 3, overflow: 'hidden' }}>
    //             <div style={{ width: `${leadScore}%`, height: '100%', background: `linear-gradient(90deg,${tierColor}cc,${tierColor})`, borderRadius: 3, transition: 'width .9s cubic-bezier(.16,1,.3,1)', animation: 'yai-score .9s ease' }} />
    //           </div>
    //           <span style={{ fontSize: 16, fontWeight: 900, color: tierColor, fontFamily: 'monospace', lineHeight: 1, minWidth: 26 }}>{leadScore}</span>
    //         </div>
    //       </div>
    //     )}

  
    //     {hasRec && (
    //       <div className="yai-card" style={{ background: 'rgba(37,99,235,.04)', border: '1px solid rgba(37,99,235,.1)', borderRadius: 10, padding: '10px 11px' }}>
    //         <p style={{ margin: '0 0 5px', fontSize: 8, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.06em' }}>✦ {isAR ? 'التوصية' : 'Recommendation'}</p>
    //         <p style={{ margin: 0, fontSize: 10.5, color: 'rgba(255,255,255,.72)', lineHeight: 1.55 }}>{recommendation}</p>
    //       </div>
    //     )}

   
    //     {hasContact && (
    //       <div className="yai-card" style={{ background: 'rgba(160,145,235,.04)', border: '1px solid rgba(160,145,235,.14)', borderRadius: 10, padding: '10px 11px', display: 'flex', flexDirection: 'column', gap: 6 }}>
    //         <p style={{ margin: '0 0 2px', fontSize: 8, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.06em' }}>👤 {isAR ? 'جهة الاتصال' : 'Contact'}</p>
    //         {collected.name  && <IPRow label={isAR ? 'الاسم' : 'Name'}  value={collected.name} />}
    //         {collected.phone && <IPRow label={isAR ? 'الهاتف' : 'Phone'} value={collected.phone} />}
    //         {collected.email && <IPRow label={isAR ? 'البريد' : 'Email'} value={collected.email} />}
    //       </div>
    //     )}
    //   </div>
    // </div>
    <></>
  );
});
IntelligencePanel.displayName = 'IntelligencePanel';

const IPRow = ({ label, value }) => (
  <div>
    <p style={{ margin: '0 0 1px', fontSize: 8, color: '#9BA3AE', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: 11, color: '#374151', fontWeight: 500, lineHeight: 1.35, wordBreak: 'break-word' }}>{value}</p>
  </div>
);

// ── Special cards ───────────────────────────────────────────────────────────────
const WACard = memo(({ msg, isRTL }) => {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg.waMessage || (isRTL ? 'مرحباً YANSY! أريد مناقشة مشروع.' : "Hello YANSY! I'd like to discuss a project."))}`;
  return (
    <div className="yai-msg-ai" style={{ background: 'linear-gradient(135deg,rgba(37,211,102,.07),rgba(37,211,102,.03))', border: '1px solid rgba(37,211,102,.2)', borderRadius: 14, padding: '14px 16px', marginTop: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><WaIcon size={14} /></div>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#25d366' }}>{isRTL ? 'تواصل عبر واتساب' : 'Continue on WhatsApp'}</span>
      </div>
      <p style={{ fontSize: 12, color: '#374151', margin: '0 0 11px', lineHeight: 1.55 }}>{msg.content}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="yai-wa"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#25d366', color: '#000', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'all .2s' }}>
        <WaIcon size={13} /> {isRTL ? 'ابدأ محادثة' : 'Start Chat'}
      </a>
    </div>
  );
});
WACard.displayName = 'WACard';

const TicketCard = memo(({ msg, isRTL }) => (
  <div className="yai-msg-ai" style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 14, padding: '14px 16px', marginTop: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 16 }}>🎫</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#2563EB' }}>{isRTL ? 'تم إنشاء تذكرة دعم' : 'Support Ticket Created'}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace', background: '#DBEAFE', padding: '3px 10px', borderRadius: 6 }}>{msg.ticketId}</span>
      <span style={{ fontSize: 10.5, color: '#2563EB' }}>• Open</span>
    </div>
    <p style={{ fontSize: 11.5, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
      {isRTL ? 'سيتواصل معك فريقنا قريباً.' : 'Our team will reach out shortly.'}
    </p>
  </div>
));
TicketCard.displayName = 'TicketCard';

const RequestCard = memo(({ msg, isRTL }) => (
  <div className="yai-msg-ai" style={{ background: 'linear-gradient(135deg,rgba(37,99,235,.07),rgba(37,99,235,.02))', border: '1px solid rgba(37,99,235,.2)', borderRadius: 14, padding: '16px 18px', marginTop: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,.12)', border: '1px solid rgba(37,99,235,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
      <div>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#2563EB' }}>{isRTL ? 'تم إنشاء طلب المشروع' : 'Project Request Created'}</p>
        <p style={{ margin: 0, fontSize: 10.5, color: '#9BA3AE' }}>{isRTL ? 'سيتواصل معك الفريق خلال 24 ساعة' : 'Our team will contact you within 24h'}</p>
      </div>
    </div>
    <div style={{ background: '#F6F7F9', borderRadius: 9, padding: '10px 13px', border: '1px solid #E8EBF0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px' }}>
      {msg.requestData?.id           && <RCRow label={isRTL ? 'رقم الطلب'   : 'Request ID'}  value={msg.requestData.id}          mono />}
      {msg.requestData?.customerName && <RCRow label={isRTL ? 'الاسم'       : 'Name'}         value={msg.requestData.customerName} />}
      {msg.requestData?.projectType  && <RCRow label={isRTL ? 'نوع المشروع' : 'Project'}      value={msg.requestData.projectType}  />}
      {(msg.requestData?.phone || msg.requestData?.email) && <RCRow label={isRTL ? 'التواصل' : 'Contact'} value={msg.requestData.phone || msg.requestData.email} />}
      {msg.requestData?.timeline     && <RCRow label={isRTL ? 'الجدول'      : 'Timeline'}     value={msg.requestData.timeline}     />}
    </div>
    <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'yai-glow 2s ease infinite' }} />
      <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{isRTL ? 'تم استلام طلبك بنجاح' : 'Request submitted successfully'}</span>
    </div>
  </div>
));
RequestCard.displayName = 'RequestCard';

const RCRow = ({ label, value, mono }) => (
  <div>
    <p style={{ margin: '0 0 1px', fontSize: 9, color: '#9BA3AE', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: 11.5, color: '#0D1117', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: mono ? 600 : 400 }}>{value}</p>
  </div>
);

// ── Main widget ─────────────────────────────────────────────────────────────────
const AIChatWidget = ({ isRTL, user }) => {
  const lang = isRTL ? 'ar' : 'en';
  const dir  = isRTL ? 'rtl' : 'ltr';

  const [open,           setOpen]           = useState(false);
  const [minimized,      setMinimized]      = useState(false);
  const [fullscreen,     setFullscreen]     = useState(false);
  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState('');
  const [streaming,      setStreaming]      = useState(false);
  const [typing,         setTyping]         = useState(false);
  const [showNotif,      setShowNotif]      = useState(false);
  const [showActions,    setShowActions]    = useState(false);
  const [listening,      setListening]      = useState(false);
  const [leadScore,      setLeadScore]      = useState(0);
  const [hasOpened,      setHasOpened]      = useState(false);
  const [showPanel,      setShowPanel]      = useState(true);    // intelligence panel toggle
  // Qualification state
  const [collected,      setCollected]      = useState({});
  const [intelligence,   setIntelligence]   = useState({});
  const [dynamicButtons, setDynamicButtons] = useState(null);
  // Multi-conversation
  const [convList,       setConvList]       = useState([]);
  const [showSidebar,    setShowSidebar]    = useState(false);
  // Responsive: hide intelligence panel on narrow screens
  const [isNarrow,       setIsNarrow]       = useState(
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  );

  const sessionRef = useRef(null);
  const historyRef = useRef([]);
  const endRef     = useRef(null);
  const inputRef   = useRef(null);
  const srRef      = useRef(null);
  const abortRef   = useRef(null);

  const stageNum = useMemo(() => getStageNum(collected), [collected]);

  // ── Resize listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth < 600);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── Persist + restore ──────────────────────────────────────────────────────
  useEffect(() => {
    const s = localStorage.getItem(SESSION_KEY);
    if (s) sessionRef.current = s;
    const h = localStorage.getItem(HISTORY_KEY);
    if (h) try { historyRef.current = JSON.parse(h); } catch {}
    const c = localStorage.getItem(COLLECTED_KEY);
    if (c) try { setCollected(JSON.parse(c)); } catch {}
    const ni = localStorage.getItem(INTEL_KEY);
    if (ni) try { setIntelligence(JSON.parse(ni)); setLeadScore(JSON.parse(ni).leadScore || 0); } catch {}
    const cl = localStorage.getItem(CONVLIST_KEY);
    if (cl) try { setConvList(JSON.parse(cl)); } catch {}
  }, []);

  const saveHistory = useCallback((msgs) => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY))); } catch {}
  }, []);

  const mergeCollected = useCallback((delta) => {
    setCollected(prev => {
      const next = { ...prev, ...delta };
      try { localStorage.setItem(COLLECTED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const mergeIntelligence = useCallback((delta) => {
    if (!delta) return;
    setIntelligence(prev => {
      const next = { ...prev };
      const fields = ['leadScore','industry','projectType','complexity','estimatedBudget','estimatedTimeline','recommendation'];
      for (const f of fields) {
        if (delta[f]) {
          if (f === 'leadScore') next[f] = Math.max(prev[f] || 0, delta[f]);
          else next[f] = delta[f];
        }
      }
      try { localStorage.setItem(INTEL_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    if (delta.leadScore > 0) setLeadScore(s => Math.max(s, delta.leadScore));
  }, []);

  const updateConvListEntry = useCallback((sessionId, patch) => {
    if (!sessionId) return;
    setConvList(prev => {
      const idx  = prev.findIndex(c => c.id === sessionId);
      const next = idx >= 0
        ? prev.map((c, i) => i === idx ? { ...c, ...patch } : c)
        : [{ id: sessionId, title: patch.title || 'New Conversation', lastMsg: '', score: 0, ts: Date.now(), ...patch }, ...prev];
      try { localStorage.setItem(CONVLIST_KEY, JSON.stringify(next.slice(0, 20))); } catch {}
      return next;
    });
  }, []);

  const startNewConversation = useCallback(() => {
    if (streaming) return;
    abortRef.current?.abort();
    if (sessionRef.current) {
      updateConvListEntry(sessionRef.current, { lastMsg: messages[messages.length - 1]?.content?.slice(0, 60) || '', score: leadScore });
    }
    sessionRef.current = null;
    historyRef.current = [];
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(COLLECTED_KEY);
      localStorage.removeItem(INTEL_KEY);
    } catch {}
    setMessages([]);
    setCollected({});
    setIntelligence({});
    setDynamicButtons(null);
    setLeadScore(0);
    setShowSidebar(false);
    setHasOpened(false);
    showGreeting(); // eslint-disable-line
  }, [streaming, messages, leadScore, updateConvListEntry]); // eslint-disable-line

  // ── Notification bubble ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { if (!open) setShowNotif(true); }, 9000);
    return () => clearTimeout(t);
  }, [open]);

  // ── Scroll on new message ──────────────────────────────────────────────────
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Init on first open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || hasOpened) return;
    setHasOpened(true);

    if (sessionRef.current) {
      fetch(`${getApiBase()}/support/conversation/${sessionRef.current}`)
        .then(r => r.json())
        .then(data => {
          if (data.messages?.length > 0) {
            const restored = data.messages.map((m, i) => ({
              id: `r-${i}`, type: m.role === 'user' ? 'user' : 'ai', content: m.content,
            }));
            setMessages(restored);
            historyRef.current = data.messages.map(m => ({ role: m.role, content: m.content }));
            if (data.leadScore) { setLeadScore(data.leadScore); mergeIntelligence({ leadScore: data.leadScore }); }
            if (data.lead) {
              const { name, phone, email, projectType, features, business, timeline } = data.lead;
              const rc = {};
              if (name)        rc.name        = name;
              if (phone)       rc.phone       = phone;
              if (email)       rc.email       = email;
              if (projectType) rc.projectType = projectType;
              if (features)    rc.features    = features;
              if (business)    rc.business    = business;
              if (timeline)    rc.timeline    = timeline;
              if (Object.keys(rc).length) mergeCollected(rc);
            }
            setShowActions(true);
          } else { showGreeting(); }
        })
        .catch(() => showGreeting()); // eslint-disable-line
    } else { showGreeting(); } // eslint-disable-line

    setTimeout(() => inputRef.current?.focus(), 400);
  }, [open]); // eslint-disable-line

  const showGreeting = () => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const id = `ai-${Date.now()}`;
      setMessages([{ id, type: 'ai', content: GREETING[lang] }]);
      historyRef.current = [{ role: 'assistant', content: GREETING[lang] }];
      setShowActions(true);
    }, 950);
  };

  // ── Message helpers ────────────────────────────────────────────────────────
  const addMsg = useCallback((msg) => {
    setMessages(prev => {
      const next = [...prev, msg];
      saveHistory(next.filter(m => m.type === 'user' || m.type === 'ai').map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })));
      return next;
    });
  }, [saveHistory]);

  const patchMsg = useCallback((id, delta) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: m.content + delta } : m));
  }, []);

  const replaceMsg = useCallback((id, content) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content } : m));
  }, []);

  const finalizeMsg = useCallback((id, meta) => {
    setMessages(prev => {
      const next = prev.map(m => m.id === id ? { ...m, streaming: false } : m);
      const pairs = next.filter(m => m.type === 'user' || m.type === 'ai');
      historyRef.current = pairs.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
      saveHistory(historyRef.current);

      const extras = [];
      if (meta?.ticketId) {
        extras.push({ id: `tck-${Date.now()}`, type: 'ticket', ticketId: meta.ticketId });
      }
      if (meta?.requestCreated && meta?.requestData) {
        extras.push({ id: `req-${Date.now()}`, type: 'request', requestData: meta.requestData });
      }
      if (meta?.suggestWhatsapp) {
        extras.push({
          id: `wa-${Date.now()}`, type: 'whatsapp',
          waMessage: lang === 'ar' ? 'مرحباً YANSY! أريد مناقشة مشروعي.' : "Hello YANSY! I'd like to discuss my project.",
          content: lang === 'ar' ? 'يمكن فريقنا مساعدتك بشكل أسرع عبر واتساب — مباشر وفوري.' : 'Our team can help you faster on WhatsApp — direct and immediate.',
        });
      }
      return [...next, ...extras];
    });

    if (meta?.sessionId && !sessionRef.current) {
      sessionRef.current = meta.sessionId;
      try { localStorage.setItem(SESSION_KEY, meta.sessionId); } catch {}
    }
    if (meta?.sessionId) {
      updateConvListEntry(meta.sessionId, {
        title:   collected.projectType || intelligence.projectType || 'AI Conversation',
        lastMsg: '',
        score:   meta.intelligence?.leadScore || meta.leadScore || leadScore,
        ts:      Date.now(),
      });
    }

    // Update intelligence from AI's JSON analysis
    if (meta?.intelligence) mergeIntelligence(meta.intelligence);
    else if (meta?.leadScore) setLeadScore(s => Math.max(s, meta.leadScore));

    // Update collected from parsed fields
    if (meta?.collected && Object.keys(meta.collected).length) mergeCollected(meta.collected);

    // Update dynamic buttons
    if (meta?.buttons?.length) setDynamicButtons(meta.buttons);
  }, [lang, saveHistory, mergeCollected, mergeIntelligence, collected, intelligence, leadScore, updateConvListEntry]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    const msg = text.trim();
    if (!msg || streaming) return;

    setShowActions(false);
    setDynamicButtons(null);
    addMsg({ id: `u-${Date.now()}`, type: 'user', content: msg });
    setInput('');

    const aiId = `ai-${Date.now()}`;
    setStreaming(true);
    addMsg({ id: aiId, type: 'ai', content: '', streaming: true });

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch(`${getApiBase()}/support/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  ctrl.signal,
        body: JSON.stringify({
          message:   msg,
          history:   historyRef.current.slice(-18),
          sessionId: sessionRef.current,
          lang,
          userId:    user?._id   || undefined,
          userEmail: user?.email || undefined,
          collected,
        }),
      });

      if (!res.ok || !res.body) throw new Error('Stream unavailable');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if      (data.type === 'chunk' && data.content) patchMsg(aiId, data.content);
            else if (data.type === 'patch' && data.content) replaceMsg(aiId, data.content);
            else if (data.type === 'done')                  finalizeMsg(aiId, data.metadata);
          } catch {}
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => prev.map(m => m.id === aiId
        ? { ...m, streaming: false, content: lang === 'ar'
            ? 'عذراً، خطأ في الاتصال. تواصل معنا على واتساب: wa.me/201090385390'
            : 'Sorry, connection error. Reach us on WhatsApp: wa.me/201090385390' }
        : m
      ));
    } finally {
      setStreaming(false);
      setTimeout(() => setShowActions(true), 800);
    }
  }, [streaming, lang, user, collected, addMsg, patchMsg, replaceMsg, finalizeMsg]);

  const submit  = (e) => { e?.preventDefault(); send(input); };
  const onKey   = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } };

  // ── Voice ──────────────────────────────────────────────────────────────────
  const hasSpeech = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const toggleVoice = useCallback(() => {
    if (listening) { srRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = isRTL ? 'ar-SA' : 'en-US';
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror = r.onend = () => setListening(false);
    srRef.current = r; r.start(); setListening(true);
  }, [isRTL, listening]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const openChat       = () => { setOpen(true); setMinimized(false); setShowNotif(false); };
  const closeChat      = () => { abortRef.current?.abort(); setOpen(false); setFullscreen(false); };
  const toggleFullscreen = () => setFullscreen(f => !f);

  const activeButtons = useMemo(() => {
    if (dynamicButtons?.length) return dynamicButtons;
    return DISCOVERY_BUTTONS[lang] || DISCOVERY_BUTTONS.en;
  }, [dynamicButtons, lang]);

  const pos   = isRTL ? { left: '1rem' }  : { right: '1rem' };
  const align = isRTL ? 'flex-start' : 'flex-end';

  // Determine if intelligence panel should render as sidebar
  const showSplitPanel = !isNarrow && showPanel;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position: 'fixed', bottom: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, alignItems: align, ...pos }}>

        {/* Notification bubble */}
        {/* {showNotif && !open && (
          <div className="yai-notif" onClick={openChat} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', cursor: 'pointer', maxWidth: 280, background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👋</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 3px', fontSize: 12.5, fontWeight: 600, color: '#0D1117' }}>YANSY AI</p>
              <p style={{ margin: 0, fontSize: 11.5, color: '#6B7280', lineHeight: 1.5 }}>{isRTL ? 'مرحباً! كيف يمكنني مساعدتك اليوم؟' : 'Hi! How can I help you today?'}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); setShowNotif(false); }} style={{ background: 'none', border: 'none', color: '#9BA3AE', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2, flexShrink: 0, marginTop: -2 }}>×</button>
          </div>
        )} */}

        {/* Chat window */}
        {open && !minimized && (
          <div className={fullscreen ? '' : 'yai-win'} dir={dir} style={fullscreen ? {
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', flexDirection: 'row', overflow: 'hidden',
            background: '#FFFFFF',
            animation: 'yai-fs-in .22s ease both',
          } : {
            width:  `min(${showSplitPanel ? 640 : 455}px, calc(100vw - 1rem))`,
            height: 'min(680px, calc(100vh - 90px))',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: '#FFFFFF',
            border: '1px solid rgba(37,99,235,.13)',
            borderRadius: 20,
            boxShadow: '0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            backdropFilter: 'blur(24px)',
            transition: 'width .3s cubic-bezier(.16,1,.3,1)',
          }}>

            {/* Fullscreen: conversations sidebar */}
            {fullscreen && showSidebar && (
              <div dir={dir} style={{ width: 230, flexShrink: 0, background: '#F6F7F9', borderRight: '1px solid #E8EBF0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #E8EBF0' }}>
                  <button onClick={startNewConversation} style={{ width: '100%', padding: '8px 12px', background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.2)', borderRadius: 8, color: '#2563EB', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {isRTL ? '+ محادثة جديدة' : '+ New Conversation'}
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                  {convList.length === 0 && (
                    <p style={{ fontSize: 11, color: '#9BA3AE', textAlign: 'center', padding: '20px 8px' }}>{isRTL ? 'لا توجد محادثات' : 'No conversations yet'}</p>
                  )}
                  {convList.map(c => (
                    <div key={c.id} style={{ padding: '9px 10px', borderRadius: 8, marginBottom: 4, background: c.id === sessionRef.current ? '#EFF6FF' : '#FAFAFA', border: `1px solid ${c.id === sessionRef.current ? '#DBEAFE' : '#E8EBF0'}`, cursor: 'pointer' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#0D1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || 'AI Conversation'}</p>
                      {c.lastMsg && <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMsg}</p>}
                      {c.score > 0 && <p style={{ margin: '3px 0 0', fontSize: 9.5, color: '#2563EB', fontFamily: 'monospace' }}>Score: {c.score}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content: chat column + intelligence panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: fullscreen ? 'row' : 'row', overflow: 'hidden', minWidth: 0 }}>

              {/* Chat column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, maxWidth: fullscreen ? 700 : '100%', margin: fullscreen && !showSplitPanel ? '0 auto' : undefined }}>

                {/* Header */}
                <div style={{ padding: '13px 14px', borderBottom: '1px solid #E8EBF0', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,rgba(37,99,235,.15),rgba(37,99,235,.05))', border: '1.5px solid rgba(37,99,235,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ fontSize: 17, filter: 'drop-shadow(0 0 7px rgba(37,99,235,.5))' }}>✦</span>
                    <span style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '1.5px solid #FFFFFF' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0D1117', letterSpacing: '-.01em' }}>YANSY AI</p>
                      {user && <span style={{ fontSize: 9, background: 'rgba(160,145,235,.15)', border: '1px solid rgba(160,145,235,.22)', color: 'rgba(160,145,235,.85)', padding: '1px 6px', borderRadius: 9, fontWeight: 700 }}>VIP</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 10.5, color: '#6B7280', letterSpacing: '.01em' }}>
                      {streaming
                        ? (isRTL ? '⟳ جاري التحليل...' : '⟳ Analyzing...')
                        : (isRTL ? '✦ متصل · يرد فوراً' : '✦ Online · Responds instantly')}
                    </p>
                  </div>

                  {/* Header controls */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    {!isNarrow && (
                      <button className="yai-ico" onClick={() => setShowPanel(p => !p)} title={isRTL ? 'لوحة المعلومات' : 'Intelligence panel'} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showPanel ? 'rgba(37,99,235,.1)' : 'rgba(255,255,255,.04)', border: `1px solid ${showPanel ? 'rgba(37,99,235,.28)' : 'rgba(255,255,255,.07)'}`, borderRadius: 6, color: showPanel ? '#2563EB' : 'rgba(255,255,255,.35)', cursor: 'pointer', transition: 'all .2s' }}>
                        <PanelIcon />
                      </button>
                    )}
                    {fullscreen && (
                      <button className="yai-ico" onClick={() => setShowSidebar(s => !s)} title="Conversations" style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showSidebar ? 'rgba(37,99,235,.1)' : 'rgba(255,255,255,.04)', border: `1px solid ${showSidebar ? 'rgba(37,99,235,.28)' : 'rgba(255,255,255,.07)'}`, borderRadius: 6, color: showSidebar ? '#2563EB' : 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: 13 }}>≡</button>
                    )}
                    {fullscreen && (
                      <button className="yai-ico" onClick={startNewConversation} title={isRTL ? 'محادثة جديدة' : 'New conversation'} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F7F9', border: '1px solid #E8EBF0', borderRadius: 6, color: '#6B7280', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>+</button>
                    )}
                    <button className="yai-ico" onClick={toggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F7F9', border: '1px solid #E8EBF0', borderRadius: 6, color: '#6B7280', cursor: 'pointer', fontSize: 11 }}>
                      {fullscreen ? '⊡' : '⊞'}
                    </button>
                    {!fullscreen && <button className="yai-ico" onClick={() => setMinimized(true)} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F7F9', border: '1px solid #E8EBF0', borderRadius: 6, color: '#6B7280', cursor: 'pointer', transition: 'background .2s, border-color .2s' }}><MinIcon /></button>}
                    <button className="yai-ico" onClick={closeChat} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F7F9', border: '1px solid #E8EBF0', borderRadius: 6, color: '#6B7280', cursor: 'pointer', transition: 'background .2s, border-color .2s' }}><CloseIcon /></button>
                  </div>
                </div>

                {/* Stage bar */}
                <StageBar stage={stageNum} lang={lang} />

                {/* Intelligence strip — only when panel is hidden */}
                {(!showSplitPanel || isNarrow) && (
                  <IntelligenceStrip intelligence={intelligence} collected={collected} leadScore={leadScore} lang={lang} />
                )}

                {/* Messages */}
                <div className="yai-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {messages.map(msg => {
                    if (msg.type === 'whatsapp') return <WACard    key={msg.id} msg={msg} isRTL={isRTL} />;
                    if (msg.type === 'ticket')   return <TicketCard key={msg.id} msg={msg} isRTL={isRTL} />;
                    if (msg.type === 'request')  return <RequestCard key={msg.id} msg={msg} isRTL={isRTL} />;

                    const isUser = msg.type === 'user';
                    if (isUser) {
                      return (
                        <div key={msg.id} className="yai-msg-usr" style={{ display: 'flex', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                          <div style={{
                            maxWidth: '82%', padding: '9px 14px', fontSize: 13, lineHeight: 1.65,
                            background: 'linear-gradient(135deg,#2563EB,#1e40af)',
                            borderRadius: isRTL ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                            color: '#000', fontWeight: 500,
                            boxShadow: '0 2px 10px rgba(37,99,235,.22)',
                          }}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    }

                    // AI message — document block style
                    return (
                      <div key={msg.id} className="yai-msg-ai" style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, marginTop: 2 }}>✦</div>
                        <div style={{
                          flex: 1, padding: '10px 14px',
                          background: '#F6F7F9',
                          borderRadius: isRTL ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                          border: '1px solid #E8EBF0',
                          borderLeft: isRTL ? '1px solid #E8EBF0' : '2px solid rgba(37,99,235,0.3)',
                          borderRight: isRTL ? '2px solid rgba(37,99,235,0.3)' : '1px solid #E8EBF0',
                          fontSize: 13, color: '#0D1117', lineHeight: 1.68,
                        }}>
                          {msg.streaming && !msg.content
                            ? <ThinkingState lang={lang} />
                            : <RichText text={msg.content} streaming={msg.streaming} />
                          }
                        </div>
                      </div>
                    );
                  })}

                  {typing && (
                    <div className="yai-msg-ai" style={{ display: 'flex', alignItems: 'flex-end', gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>✦</div>
                      <div style={{ background: '#F6F7F9', border: '1px solid #E8EBF0', borderRadius: '2px 12px 12px 12px' }}>
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  {/* Quick reply chips */}
                  {showActions && !typing && messages.length > 0 && (
                    <div className="yai-fade" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {activeButtons.map((a, idx) => (
                        <button key={`${a.label}-${idx}`} className="yai-btn yai-chip" onClick={() => send(a.msg)} style={{ padding: '6px 11px', fontSize: 11.5, cursor: 'pointer', border: '1px solid #E8EBF0', color: '#374151', background: '#FAFAFA', borderRadius: 8, transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 5, animationDelay: `${idx * 0.04}s` }}>
                          {a.icon && <span>{a.icon}</span>}
                          <span>{a.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div ref={endRef} />
                </div>

                {/* Input bar */}
                <div style={{ padding: '10px 12px', borderTop: '1px solid #E8EBF0', background: '#FAFAFA', flexShrink: 0 }}>
                  <form onSubmit={submit} style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
                    {hasSpeech && (
                      <button type="button" className="yai-ico" onClick={toggleVoice} style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: listening ? 'rgba(37,99,235,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${listening ? 'rgba(37,99,235,.4)' : 'rgba(255,255,255,.07)'}`, borderRadius: 9, color: listening ? '#2563EB' : 'rgba(255,255,255,.28)', cursor: 'pointer', transition: 'all .2s' }}>
                        <MicIcon on={listening} />
                      </button>
                    )}
                    <textarea
                      ref={inputRef} value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={onKey}
                      placeholder={isRTL ? 'اكتب رسالتك...' : 'Message YANSY AI...'}
                      dir={dir} rows={1}
                      style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: 9, color: '#0D1117', padding: '9px 12px', fontSize: 13, outline: 'none', resize: 'none', minHeight: 36, maxHeight: 110, lineHeight: 1.5, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
                      onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                      onBlur={e  => { e.target.style.borderColor = '#E8EBF0'; e.target.style.boxShadow = 'none'; }}
                      onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'; }}
                    />
                    <button type="submit" className="yai-send" disabled={!input.trim() || streaming} style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: input.trim() && !streaming ? '#2563EB' : '#F0F2F5', border: 'none', borderRadius: 9, color: input.trim() && !streaming ? '#FFFFFF' : '#9BA3AE', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed', transition: 'all .2s' }}>
                      {streaming ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(37,99,235,.3)', borderTopColor: '#2563EB', animation: 'yai-spin .7s linear infinite' }} /> : <SendIcon />}
                    </button>
                  </form>
                  <p style={{ margin: '6px 0 0', textAlign: 'center', fontSize: 9.5, color: '#9BA3AE', letterSpacing: '.04em' }}>
                    {isRTL ? 'مدعوم بالذكاء الاصطناعي · YANSY Tech' : 'AI-powered · YANSY Tech'}
                  </p>
                </div>
              </div>

              {/* Intelligence panel */}
              {showSplitPanel && (
                <IntelligencePanel
                  intelligence={intelligence}
                  collected={collected}
                  leadScore={leadScore}
                  lang={lang}
                />
              )}
            </div>
          </div>
        )}

        {/* Minimized bar */}
        {open && minimized && (
          <button className="yai-notif" onClick={() => setMinimized(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', cursor: 'pointer', width: 240, background: '#FFFFFF', border: '1px solid #E8EBF0', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0D1117', flex: 1, textAlign: 'start' }}>YANSY AI</span>
          {stageNum > 0 && <span style={{ fontSize: 9.5, color: 'rgba(37,99,235,.6)', fontFamily: 'monospace' }}>{stageNum}/5</span>}
          {leadScore > 0 && <span style={{ fontSize: 10, color: leadScore >= 70 ? '#22c55e' : '#2563EB', fontFamily: 'monospace', fontWeight: 700 }}>{leadScore}</span>}
          <span style={{ fontSize: 10, color: '#6B7280' }}>{isRTL ? 'افتح' : 'Open'}</span>
          </button>
        )}

        {/* Toggle button */}
        <div style={{ position: 'relative', alignSelf: align }}>
          {!open && (
            <>
              <span style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px solid rgba(37,99,235,.26)', animation: 'yai-pulse 2.4s ease-out infinite', pointerEvents: 'none' }} />
              <span style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px solid rgba(37,99,235,.12)', animation: 'yai-pulse 2.4s ease-out .8s infinite', pointerEvents: 'none' }} />
            </>
          )}
          <button onClick={() => open ? closeChat() : openChat()} aria-label={open ? 'Close AI assistant' : 'Open YANSY AI assistant'} style={{ width: 58, height: 58, borderRadius: '50%', background: open ? '#2563EB' : '#0D1117', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', zIndex: 1, boxShadow: open ? '0 8px 24px rgba(37,99,235,0.4)' : '0 8px 28px rgba(0,0,0,0.3)', transition: 'all .3s cubic-bezier(.16,1,.3,1)' }}>
            {open ? <CloseIcon /> : <span style={{ fontSize: 22, filter: 'drop-shadow(0 0 10px rgba(37,99,235,.5))' }}>✦</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default AIChatWidget;

