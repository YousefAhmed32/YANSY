/**
 * YANSY AI V2 — Senior Solution Consultant
 * A conversational consultant experience with a live-updating project
 * blueprint panel, built to feel like Linear/Perplexity/Notion AI rather
 * than a lead-gen form dressed up as a chat window.
 */
import { useState, useEffect, useRef, useCallback, memo, useMemo, forwardRef, useImperativeHandle } from 'react';
import { floatingCornerStyle, floatingPanelWidth } from '../constants/floatingUi';

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

// ── Blueprint completeness (UI-only heuristic — not a scripted conversation
//    stage; the backend decides conversational flow freely) ────────────────
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
  @keyframes yai-up    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes yai-in    { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes yai-fade  { from{opacity:0} to{opacity:1} }
  @keyframes yai-blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes yai-spin  { to{transform:rotate(360deg)} }
  @keyframes yai-glow  { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes yai-card  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes yai-score { from{width:0} }
  @keyframes yai-think { 0%{opacity:.4} 50%{opacity:1} 100%{opacity:.4} }
  @keyframes yai-shimmer { 0%{background-position:-200px 0} 100%{background-position:200px 0} }
  .yai-win    { animation: yai-in .32s cubic-bezier(.16,1,.3,1) both; }
  .yai-notif  { animation: yai-up .28s cubic-bezier(.16,1,.3,1) both; }
  .yai-fade   { animation: yai-fade .4s ease both; }
  .yai-msg-ai { animation: yai-up .24s cubic-bezier(.16,1,.3,1) both; }
  .yai-msg-usr{ animation: yai-up .2s cubic-bezier(.16,1,.3,1) both; }
  .yai-card   { animation: yai-card .32s cubic-bezier(.16,1,.3,1) both; }
  .yai-scroll::-webkit-scrollbar { width:4px; }
  .yai-scroll::-webkit-scrollbar-thumb { background:rgb(var(--border-strong)); border-radius:2px; }
  .yai-scroll::-webkit-scrollbar-track { background:transparent; }
  .yai-cursor::after { content:'▋'; animation:yai-blink .8s step-end infinite; font-size:.85em; opacity:.5; margin-inline-start:1px; color:rgb(var(--accent)); }
  .yai-btn:hover { background:rgb(var(--accent-light)) !important; border-color:rgba(37,99,235,.35) !important; color:rgb(var(--accent)) !important; transform:translateY(-1px); }
  .yai-send:hover:not(:disabled) { background:rgb(var(--accent-hover)) !important; transform:scale(1.05); box-shadow:0 4px 14px rgba(37,99,235,.35) !important; }
  .yai-ico:hover { background:rgb(var(--border-light)) !important; border-color:rgb(var(--border-strong)) !important; color:rgb(var(--text-secondary)) !important; }
  .yai-wa:hover  { filter:brightness(1.06); transform:translateY(-1px); box-shadow:0 6px 18px rgba(37,211,102,.3) !important; }
  .yai-chip { animation: yai-up .25s cubic-bezier(.16,1,.3,1) both; }
  .yai-skeleton { background:linear-gradient(90deg,rgb(var(--border-light)) 0%,rgb(var(--border)) 50%,rgb(var(--border-light)) 100%); background-size:400px 100%; animation:yai-shimmer 1.6s ease-in-out infinite; }
  /* vh is the browser's largest possible viewport; on mobile Safari/Chrome with
     the address bar visible it overshoots the real visible height, so a
     bottom-anchored fixed panel sized off raw vh can clip its own header above
     the actual screen. dvh tracks the current viewport instead. */
  .yai-panel-h { height: min(700px, calc(100vh - 90px)); height: min(700px, calc(100dvh - 90px)); }
`;

// ── Greeting (fallback if admin config fetch fails) ────────────────────────────
const GREETING_FALLBACK = {
  en: "Hi, I'm YANSY's solution consultant. Tell me a bit about what you're building — or what's not working with what you have — and I'll help you shape it into a clear plan.",
  ar: 'أهلاً، أنا مستشار الحلول لدى يانسي. احكِ لي باختصار عمّا تريد بناءه — أو المشكلة في اللي عندك حالياً — وهساعدك تحوّلها لخطة واضحة.',
};

// ── Discovery buttons (shown before the AI has suggested contextual ones) ─────
const DISCOVERY_BUTTONS = {
  en: [
    { icon: '🌐', label: 'A website',    msg: 'I need to build a professional website' },
    { icon: '🛒', label: 'An online store', msg: 'I need an online store' },
    { icon: '⚡', label: 'A SaaS product', msg: 'I want to build a SaaS platform' },
    { icon: '📱', label: 'A mobile app',  msg: 'I need a mobile app for iOS and Android' },
    { icon: '🧩', label: "I'm not sure yet", msg: "I'm not sure exactly what I need yet — can you help me figure it out?" },
  ],
  ar: [
    { icon: '🌐', label: 'موقع ويب',       msg: 'أحتاج بناء موقع ويب احترافي' },
    { icon: '🛒', label: 'متجر إلكتروني', msg: 'أحتاج متجراً إلكترونياً' },
    { icon: '⚡', label: 'منصة SaaS',      msg: 'أريد بناء منصة SaaS' },
    { icon: '📱', label: 'تطبيق موبايل',  msg: 'أحتاج تطبيقاً للجوال' },
    { icon: '🧩', label: 'مش متأكد لسه',   msg: 'مش متأكد بالظبط عايز إيه لسه — تقدر تساعدني أحدد؟' },
  ],
};

const STAGE_STEPS = {
  en: ['Idea', 'Scope', 'Context', 'Timeline', 'Contact'],
  ar: ['الفكرة', 'النطاق', 'السياق', 'الوقت', 'التواصل'],
};

const THINKING_EN = [
  { icon: '🔍', text: 'Thinking this through...' },
  { icon: '📋', text: 'Updating the blueprint...' },
  { icon: '💡', text: 'Shaping a recommendation...' },
];
const THINKING_AR = [
  { icon: '🔍', text: 'بفكر في الموضوع...' },
  { icon: '📋', text: 'بحدّث المخطط...' },
  { icon: '💡', text: 'بصيغ توصية...' },
];

// ── Rich text renderer ──────────────────────────────────────────────────────────
const fmtInline = (text) =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: 'rgb(var(--text-primary))', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*')  && part.endsWith('*'))  return <em key={i} style={{ color: 'rgb(var(--text-secondary))' }}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`')  && part.endsWith('`'))  return <code key={i} style={{ background: 'rgba(37,99,235,.1)', color: 'rgb(var(--accent))', padding: '1px 5px', borderRadius: 3, fontSize: '.9em', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
    return part;
  });

const RichText = memo(({ text, streaming }) => {
  const lines = (text || '').split('\n');
  const els = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() && i > 0) { els.push(<div key={i} style={{ height: 5 }} />); }
    else if (line.startsWith('### ')) { els.push(<p key={i} style={{ margin: '8px 0 3px', fontWeight: 700, fontSize: 12.5, color: 'rgb(var(--accent))' }}>{line.slice(4)}</p>); }
    else if (line.startsWith('## ')) { els.push(<p key={i} style={{ margin: '10px 0 4px', fontWeight: 700, fontSize: 13, color: 'rgb(var(--text-primary))' }}>{line.slice(3)}</p>); }
    else if (/^[\-•*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\-•*]\s/.test(lines[i])) { items.push(<li key={i} style={{ marginBottom: 3 }}>{fmtInline(lines[i].slice(2))}</li>); i++; }
      els.push(<ul key={`ul${i}`} style={{ margin: '5px 0', paddingInlineStart: 16, listStyle: 'disc' }}>{items}</ul>); continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(<li key={i} style={{ marginBottom: 3 }}>{fmtInline(lines[i].replace(/^\d+\.\s/, ''))}</li>); i++; }
      els.push(<ol key={`ol${i}`} style={{ margin: '5px 0', paddingInlineStart: 18 }}>{items}</ol>); continue;
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
const MicIcon   = ({ on }) => <svg width="12" height="12" fill={on ? 'rgb(var(--accent))' : 'currentColor'} viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const PanelIcon = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>;
const SparkIcon = ({ size = 17 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 17l-1.8-5.8L4.6 9.4l5.6-1.8L12 2z" fill="currentColor"/></svg>;
const ClipIcon  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>;
const HandsFreeIcon = ({ on }) => <svg width="13" height="13" fill="none" stroke={on ? 'rgb(var(--accent))' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 12v-1a9 9 0 0118 0v1"/><path d="M21 12v3a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2z"/><path d="M3 12v3a2 2 0 002 2h1v-6H5a2 2 0 00-2 2z"/></svg>;
const SpeakerIcon = ({ size = 12 }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>;
const DocIcon    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const GlobeIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z"/></svg>;

// ── Voice waveform bars ──────────────────────────────────────────────────────
const Waveform = ({ levels = [2,2,2,2,2], color = 'rgb(var(--accent))' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 22 }}>
    {levels.map((h, i) => (
      <span key={i} style={{ width: 2.5, height: h, background: color, borderRadius: 2, transition: 'height .08s ease' }} />
    ))}
  </div>
);

// ── Attachment chip (pending, pre-send) ────────────────────────────────────────
const AttachmentChip = ({ att, onRemove, isRTL }) => {
  const label = att.kind === 'image' ? (att.name || (isRTL ? 'صورة' : 'Image'))
    : att.kind === 'website' ? att.name
    : att.name || (isRTL ? 'مستند' : 'Document');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', borderRadius: 9, padding: '5px 8px', maxWidth: 180 }}>
      {att.kind === 'image'
        ? <img src={att.dataUrl || att.url} alt="" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
        : <span style={{ color: 'rgb(var(--accent))', flexShrink: 0, display: 'flex' }}>{att.kind === 'website' ? <GlobeIcon /> : <DocIcon />}</span>}
      <span style={{ fontSize: 10.5, color: 'rgb(var(--text-secondary))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: 'rgb(var(--text-tertiary))', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
    </div>
  );
};

// ── Typing dots ─────────────────────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '10px 14px' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(var(--border-strong))', display: 'block', animation: `yai-dot 1.3s ease-in-out ${i * 0.22}s infinite` }} />
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
      <span style={{ fontSize: 12, color: 'rgba(37,99,235,.65)', fontStyle: 'italic' }}>{s.text}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(37,99,235,.45)', animation: `yai-dot 1.3s ease ${i*.22}s infinite` }} />)}
      </div>
    </div>
  );
});
ThinkingState.displayName = 'ThinkingState';

// ── Blueprint-completeness bar ──────────────────────────────────────────────────
const StageBar = memo(({ stage, lang }) => {
  if (stage === 0) return null;
  const steps = STAGE_STEPS[lang] || STAGE_STEPS.en;
  const color = stage >= 5 ? '#16a34a' : 'rgb(var(--accent))';
  return (
    <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid rgb(var(--border))', background: 'rgb(var(--bg-secondary))', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 6 }}>
        {steps.map((label, i) => {
          const done   = i < stage;
          const active = i === stage - 1;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: done ? color : 'rgb(var(--bg-elevated))', border: `1.5px solid ${done ? color : '#D8DCE3'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: done ? '#fff' : 'rgb(var(--text-tertiary))', fontWeight: 700, transition: 'all .4s ease' }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 8, color: active ? color : done ? 'rgb(var(--text-secondary))' : 'rgb(var(--text-tertiary))', letterSpacing: '.02em', textAlign: 'center', transition: 'color .4s' }}>{label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ height: 2, background: 'rgb(var(--border))', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ width: `${Math.round((Math.min(stage,5)/5)*100)}%`, height: '100%', background: `linear-gradient(90deg,${color},${color}cc)`, borderRadius: 1, transition: 'width .6s ease' }} />
      </div>
    </div>
  );
});
StageBar.displayName = 'StageBar';

// ── Intelligence strip — compact horizontal bar for narrow screens ─────────────
const IntelligenceStrip = memo(({ intelligence, leadScore: fallbackScore, lang }) => {
  const { leadScore = fallbackScore || 0, industry, complexity } = intelligence || {};
  const hasData = industry || complexity || leadScore > 0;
  if (!hasData) return null;
  const tierColor  = leadScore >= 70 ? '#16a34a' : leadScore >= 40 ? 'rgb(var(--accent))' : 'rgb(var(--border-strong))';
  const cxColor    = complexity === 'Enterprise' ? '#D97706' : complexity === 'High' ? '#7C3AED' : complexity === 'Medium' ? '#0891B2' : '#16a34a';
  const isAR = lang === 'ar';
  return (
    <div style={{ padding: '6px 12px', borderBottom: '1px solid rgb(var(--border))', background: 'rgb(var(--bg-secondary))', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', flexShrink: 0 }}>
      {industry && <Tag label={industry} color="rgb(var(--accent))" />}
      {complexity && <Tag label={complexity} color={cxColor} />}
      {leadScore > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginInlineStart: 'auto' }}>
          <span style={{ fontSize: 9, color: 'rgb(var(--text-tertiary))', textTransform: 'uppercase', letterSpacing: '.05em' }}>{isAR ? 'التقييم' : 'Fit'}</span>
          <div style={{ width: 44, height: 4, background: 'rgb(var(--border))', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${leadScore}%`, height: '100%', background: tierColor, borderRadius: 2, transition: 'width .8s ease', animation: 'yai-score .8s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
});
IntelligenceStrip.displayName = 'IntelligenceStrip';

const Tag = ({ label, color }) => (
  <span style={{ fontSize: 9.5, color, background: `${color}14`, border: `1px solid ${color}28`, padding: '2px 7px', borderRadius: 5, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
);

const CompletionRing = ({ percent = 0, size = 26 }) => {
  const r = (size - 3) / 2;
  const c = 2 * Math.PI * r;
  const color = percent >= 80 ? '#16a34a' : percent >= 40 ? 'rgb(var(--accent))' : 'rgb(var(--text-tertiary))';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} title={`${percent}%`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--border))" strokeWidth="2.5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (percent / 100) * c} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)' }} />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, fontWeight: 800, color }}>{percent}</span>
    </div>
  );
};

// ── Live Project Blueprint — the centerpiece feature ────────────────────────────
const BlueprintSection = ({ icon, title, children, delay = 0 }) => (
  <div className="yai-card" style={{ animationDelay: `${delay}ms` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: 9.5, fontWeight: 800, color: 'rgb(var(--text-tertiary))', textTransform: 'uppercase', letterSpacing: '.07em' }}>{title}</p>
    </div>
    {children}
  </div>
);

const ChipList = ({ items, color = 'rgb(var(--accent))' }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
    {items.map((f, i) => (
      <span key={i} style={{ fontSize: 10.5, fontWeight: 600, color, background: `${color}0F`, border: `1px solid ${color}24`, padding: '3px 9px', borderRadius: 100 }}>{f}</span>
    ))}
  </div>
);

const BlueprintSkeleton = ({ lang }) => (
  <div style={{ padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
    {[1, 0.7, 0.85].map((w, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="yai-skeleton" style={{ height: 8, width: '30%', borderRadius: 4 }} />
        <div className="yai-skeleton" style={{ height: 12, width: `${w * 100}%`, borderRadius: 4 }} />
      </div>
    ))}
    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgb(var(--text-tertiary))', textAlign: 'center', lineHeight: 1.6 }}>
      {lang === 'ar' ? '✦ المخطط يُبنى تلقائياً أثناء حديثنا' : '✦ Your blueprint builds automatically as we talk'}
    </p>
  </div>
);

const IntelligencePanel = memo(({ intelligence, collected, leadScore: fallbackScore, lang, files = [], onGenerateDocument, generatingDoc, docGenEnabled = true }) => {
  const isAR = lang === 'ar';
  const {
    leadScore = fallbackScore || 0, industry, projectType, businessSummary, recommendedSolution,
    features = [], techStack = [], integrations = [], pages = [], complexity, priority, customerSegment,
    estimatedTimeline, risks = [], nextSteps = [], completionPercent = 0,
  } = intelligence || {};

  const hasHeader   = !!(industry || projectType || complexity);
  const hasSummary  = !!businessSummary;
  const hasRec      = !!recommendedSolution;
  const hasFeatures = features.length > 0;
  const hasPages    = pages.length > 0;
  const hasStack    = techStack.length > 0 || integrations.length > 0;
  const hasEstimate = !!estimatedTimeline;
  const hasRisks    = risks.length > 0;
  const hasNext     = nextSteps.length > 0;
  const hasContact  = collected?.name || collected?.phone || collected?.email;
  const hasAny      = hasHeader || hasSummary || hasRec || hasFeatures || hasStack || hasEstimate || hasRisks || hasNext || files.length > 0;
  const priorityColor = priority === 'High' ? '#DC2626' : priority === 'Medium' ? '#D97706' : 'rgb(var(--text-secondary))';

  const tierColor = leadScore >= 70 ? '#16a34a' : leadScore >= 40 ? 'rgb(var(--accent))' : 'rgb(var(--border-strong))';
  const cxColor   = complexity === 'Enterprise' ? '#D97706' : complexity === 'High' ? '#7C3AED' : complexity === 'Medium' ? '#0891B2' : '#16a34a';

  return (
    <div className="yai-scroll" style={{ width: 260, flexShrink: 0, borderInlineStart: '1px solid rgb(var(--border))', background: 'rgb(var(--bg-secondary))', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>

      <div style={{ padding: '13px 14px 10px', borderBottom: '1px solid rgb(var(--border))', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: 'rgb(var(--bg-elevated))' }}>
        <SparkIcon size={12} />
        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: 'rgb(var(--accent))', letterSpacing: '.08em', textTransform: 'uppercase', flex: 1 }}>
          {isAR ? 'مخطط المشروع الحي' : 'Live Project Blueprint'}
        </p>
        {completionPercent > 0 && <CompletionRing percent={completionPercent} />}
      </div>

      {!hasAny ? (
        <BlueprintSkeleton lang={lang} />
      ) : (
        <div style={{ flex: 1, padding: '14px 13px 20px', display: 'flex', flexDirection: 'column', gap: 15 }}>

          {docGenEnabled && (projectType || collected?.projectType) && (
            <button type="button" onClick={onGenerateDocument} disabled={generatingDoc}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '9px 12px', background: generatingDoc ? 'rgb(var(--bg-surface))' : 'linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-hover)))', border: 'none', borderRadius: 10, color: generatingDoc ? 'rgb(var(--text-tertiary))' : 'rgb(var(--bg-elevated))', fontSize: 11.5, fontWeight: 700, cursor: generatingDoc ? 'wait' : 'pointer', boxShadow: generatingDoc ? 'none' : '0 3px 10px rgba(37,99,235,.25)' }}>
              {generatingDoc
                ? <><div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid rgba(37,99,235,.3)', borderTopColor: 'rgb(var(--accent))', animation: 'yai-spin .7s linear infinite' }} />{isAR ? 'جارِ الإنشاء...' : 'Generating...'}</>
                : <>📄 {isAR ? 'إنشاء وثيقة المشروع الكاملة' : 'Generate Full Project Document'}</>}
            </button>
          )}
          {docGenEnabled && (projectType || collected?.projectType) && generatingDoc && (
            <p style={{ margin: '-9px 0 0', fontSize: 9.5, color: 'rgb(var(--text-tertiary))', textAlign: 'center' }}>
              {isAR ? 'وثيقة كاملة تستغرق حتى دقيقة تقريباً' : 'A full document can take up to a minute'}
            </p>
          )}

          {hasHeader && (
            <BlueprintSection icon="🎯" title={isAR ? 'المشروع' : 'Project'}>
              <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))', lineHeight: 1.35 }}>
                {projectType || (isAR ? 'قيد التحديد' : 'Being defined')}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {industry && <Tag label={industry} color="rgb(var(--accent))" />}
                {complexity && <Tag label={complexity} color={cxColor} />}
                {priority && <Tag label={`${isAR ? 'أولوية' : 'Priority'}: ${priority}`} color={priorityColor} />}
                {customerSegment && <Tag label={customerSegment} color="#7C3AED" />}
              </div>
            </BlueprintSection>
          )}

          {hasSummary && (
            <BlueprintSection icon="🧭" title={isAR ? 'ملخص العمل' : 'Business Summary'} delay={40}>
              <p style={{ margin: 0, fontSize: 11.5, color: 'rgb(var(--text-secondary))', lineHeight: 1.6 }}>{businessSummary}</p>
            </BlueprintSection>
          )}

          {hasRec && (
            <BlueprintSection icon="✦" title={isAR ? 'الحل الموصى به' : 'Recommended Solution'} delay={80}>
              <div style={{ background: 'rgb(var(--accent-light))', border: '1px solid rgb(var(--accent-muted))', borderRadius: 10, padding: '9px 11px' }}>
                <p style={{ margin: 0, fontSize: 11.5, color: 'rgb(var(--accent-hover))', lineHeight: 1.6, fontWeight: 500 }}>{recommendedSolution}</p>
              </div>
            </BlueprintSection>
          )}

          {hasFeatures && (
            <BlueprintSection icon="🧩" title={isAR ? 'الميزات الرئيسية' : 'Key Features'} delay={120}>
              <ChipList items={features} color="rgb(var(--accent))" />
            </BlueprintSection>
          )}

          {hasPages && (
            <BlueprintSection icon="📄" title={isAR ? 'الصفحات' : 'Pages'} delay={140}>
              <ChipList items={pages} color="#7C3AED" />
            </BlueprintSection>
          )}

          {hasStack && (
            <BlueprintSection icon="🛠" title={isAR ? 'التقنيات المقترحة' : 'Suggested Stack'} delay={160}>
              <ChipList items={[...techStack, ...integrations]} color="#0891B2" />
            </BlueprintSection>
          )}

          {hasEstimate && (
            <BlueprintSection icon="📊" title={isAR ? 'الجدول الزمني' : 'Timeline'} delay={200}>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 9, padding: '8px 10px' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0E7490' }}>{estimatedTimeline}</p>
              </div>
            </BlueprintSection>
          )}

          {hasRisks && (
            <BlueprintSection icon="⚠" title={isAR ? 'اعتبارات مهمة' : 'Worth Considering'} delay={240}>
              <ul style={{ margin: 0, paddingInlineStart: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {risks.map((r, i) => <li key={i} style={{ fontSize: 11, color: '#92400E', lineHeight: 1.5 }}>{r}</li>)}
              </ul>
            </BlueprintSection>
          )}

          {hasNext && (
            <BlueprintSection icon="➜" title={isAR ? 'الخطوات التالية' : 'Next Steps'} delay={280}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {nextSteps.map((s, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: 'rgb(var(--text-secondary))', lineHeight: 1.5 }}>
                    <span style={{ color: 'rgb(var(--accent))', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>{s}
                  </li>
                ))}
              </ul>
            </BlueprintSection>
          )}

          {leadScore > 0 && (
            <BlueprintSection icon="📈" title={isAR ? 'مدى الملاءمة' : 'Fit Score'} delay={320}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'rgb(var(--border))', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${leadScore}%`, height: '100%', background: `linear-gradient(90deg,${tierColor}cc,${tierColor})`, borderRadius: 3, transition: 'width .9s cubic-bezier(.16,1,.3,1)', animation: 'yai-score .9s ease' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: tierColor, fontFamily: 'monospace', lineHeight: 1 }}>{leadScore}</span>
              </div>
            </BlueprintSection>
          )}

          {files.length > 0 && (
            <BlueprintSection icon="📎" title={isAR ? 'الملفات المرفوعة' : 'Uploaded Files'} delay={355}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {files.slice(-6).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'rgb(var(--text-secondary))', background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', borderRadius: 7, padding: '5px 8px' }}>
                    <span style={{ color: 'rgb(var(--text-tertiary))', flexShrink: 0 }}>{f.kind === 'image' ? '🖼️' : f.kind === 'website' ? '🔗' : '📄'}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  </div>
                ))}
              </div>
            </BlueprintSection>
          )}

          {hasContact && (
            <BlueprintSection icon="👤" title={isAR ? 'جهة الاتصال' : 'Contact'} delay={360}>
              <div style={{ background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', borderRadius: 9, padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {collected.name  && <IPRow label={isAR ? 'الاسم' : 'Name'}  value={collected.name} />}
                {collected.phone && <IPRow label={isAR ? 'الهاتف' : 'Phone'} value={collected.phone} />}
                {collected.email && <IPRow label={isAR ? 'البريد' : 'Email'} value={collected.email} />}
              </div>
            </BlueprintSection>
          )}
        </div>
      )}
    </div>
  );
});
IntelligencePanel.displayName = 'IntelligencePanel';

const IPRow = ({ label, value }) => (
  <div>
    <p style={{ margin: '0 0 1px', fontSize: 8, color: 'rgb(var(--text-tertiary))', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: 11, color: 'rgb(var(--text-secondary))', fontWeight: 500, lineHeight: 1.35, wordBreak: 'break-word' }}>{value}</p>
  </div>
);

// ── Special cards ───────────────────────────────────────────────────────────────
const WACard = memo(({ msg, isRTL }) => {
  const brief = msg.whatsappBrief;
  const fallbackMsg = isRTL ? 'مرحباً YANSY! أريد مناقشة مشروع.' : "Hello YANSY! I'd like to discuss a project.";
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(brief || fallbackMsg)}`;

  // The brief is a WhatsApp-markdown document (sections separated by blank
  // lines, each optionally starting with an "emoji *Header*" line) — parse it
  // into { header, lines } blocks for a readable preview, not a flat colon-list.
  const briefSections = brief
    ? brief.split('\n\n').slice(1, -1) // drop the greeting line and the closing CTA line
        .map(block => {
          const lines = block.split('\n').filter(Boolean);
          const headerMatch = lines[0]?.match(/^[^\w*]*\*(.+)\*$/);
          return headerMatch
            ? { header: headerMatch[1], lines: lines.slice(1) }
            : { header: null, lines };
        })
        .filter(s => s.lines.length)
    : [];

  return (
    <div className="yai-msg-ai" style={{ background: 'linear-gradient(160deg,rgba(37,211,102,.06),rgba(37,211,102,.015))', border: '1px solid rgba(37,211,102,.22)', borderRadius: 16, padding: '15px 16px', marginTop: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><WaIcon size={15} /></div>
        <div>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#128C4A' }}>{isRTL ? 'جاهز للتواصل مع الفريق' : 'Ready to talk to the team'}</p>
          <p style={{ margin: 0, fontSize: 10.5, color: 'rgb(var(--text-secondary))' }}>{isRTL ? 'لن تحتاج لتكرار أي شيء' : "You won't need to repeat yourself"}</p>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'rgb(var(--text-secondary))', margin: '0 0 11px', lineHeight: 1.55 }}>{msg.content}</p>

      {briefSections.length > 0 && (
        <div style={{ background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', borderRadius: 10, padding: '10px 12px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: '0 0 -2px', fontSize: 9, fontWeight: 800, color: 'rgb(var(--text-tertiary))', textTransform: 'uppercase', letterSpacing: '.06em' }}>{isRTL ? 'ملخص سيصل للفريق' : "What the team will receive"}</p>
          {briefSections.slice(0, 5).map((s, i) => (
            <div key={i}>
              {s.header && <p style={{ margin: '0 0 2px', fontSize: 9.5, fontWeight: 700, color: '#128C4A' }}>{s.header}</p>}
              {s.lines.slice(0, 3).map((l, j) => {
                const isBullet = /^[-\d]/.test(l);
                const [k, ...rest] = l.split(':');
                return (
                  <p key={j} style={{ margin: 0, fontSize: 11, color: 'rgb(var(--text-primary))', lineHeight: 1.5 }}>
                    {!s.header && rest.length ? <><span style={{ color: 'rgb(var(--text-tertiary))' }}>{k}:</span> <span style={{ fontWeight: 500 }}>{rest.join(':').trim()}</span></> : (isBullet ? l : l)}
                  </p>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <a href={url} target="_blank" rel="noopener noreferrer" className="yai-wa"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25d366', color: 'rgb(var(--bg-elevated))', padding: '11px 18px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, textDecoration: 'none', transition: 'all .2s', boxShadow: '0 3px 10px rgba(37,211,102,.25)' }}>
        <WaIcon size={14} /> {isRTL ? 'أكمل مع مستشار الحلول على واتساب' : 'Continue with our solution architect on WhatsApp'}
      </a>
    </div>
  );
});
WACard.displayName = 'WACard';

const TicketCard = memo(({ msg, isRTL }) => (
  <div className="yai-msg-ai" style={{ background: 'rgb(var(--accent-light))', border: '1px solid rgb(var(--accent-muted))', borderRadius: 14, padding: '14px 16px', marginTop: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 16 }}>🎫</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(var(--accent))' }}>{isRTL ? 'تم إنشاء تذكرة دعم' : 'Support Ticket Created'}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--accent-hover))', fontFamily: 'monospace', background: 'rgb(var(--accent-muted))', padding: '3px 10px', borderRadius: 6 }}>{msg.ticketId}</span>
      <span style={{ fontSize: 10.5, color: 'rgb(var(--accent))' }}>• Open</span>
    </div>
    <p style={{ fontSize: 11.5, color: 'rgb(var(--text-secondary))', margin: 0, lineHeight: 1.5 }}>
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
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'rgb(var(--accent))' }}>{isRTL ? 'تم إنشاء طلب المشروع' : 'Project Request Created'}</p>
        <p style={{ margin: 0, fontSize: 10.5, color: 'rgb(var(--text-tertiary))' }}>{isRTL ? 'سيتواصل معك الفريق خلال 24 ساعة' : 'Our team will contact you within 24h'}</p>
      </div>
    </div>
    <div style={{ background: 'rgb(var(--bg-surface))', borderRadius: 9, padding: '10px 13px', border: '1px solid rgb(var(--border))', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px' }}>
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

const DocumentCard = memo(({ msg, isRTL }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(msg.document).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  };
  const download = () => {
    const blob = new Blob([msg.document], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'yansy-project-document.md'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="yai-msg-ai" style={{ background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', borderRadius: 16, padding: '16px 18px', marginTop: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--accent))' }}><DocIcon /></div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'rgb(var(--text-primary))' }}>{isRTL ? 'وثيقة المشروع الكاملة' : 'Full Project Document'}</p>
          <p style={{ margin: 0, fontSize: 10.5, color: 'rgb(var(--text-secondary))' }}>{isRTL ? 'المتطلبات، قصص المستخدم، البنية، خارطة الطريق' : 'Requirements, user stories, architecture, roadmap'}</p>
        </div>
        <button type="button" onClick={copy} title={isRTL ? 'نسخ' : 'Copy'} style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))', borderRadius: 7, padding: '5px 9px', fontSize: 10.5, color: copied ? '#16a34a' : 'rgb(var(--text-secondary))', cursor: 'pointer' }}>{copied ? '✓' : (isRTL ? 'نسخ' : 'Copy')}</button>
        <button type="button" onClick={download} title={isRTL ? 'تنزيل' : 'Download'} style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))', borderRadius: 7, padding: '5px 9px', fontSize: 10.5, color: 'rgb(var(--text-secondary))', cursor: 'pointer' }}>{isRTL ? 'تنزيل' : 'Download'}</button>
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto', fontSize: 12.5, color: 'rgb(var(--text-primary))' }} className="yai-scroll">
        <RichText text={msg.document} />
      </div>
    </div>
  );
});
DocumentCard.displayName = 'DocumentCard';

const RCRow = ({ label, value, mono }) => (
  <div>
    <p style={{ margin: '0 0 1px', fontSize: 9, color: 'rgb(var(--text-tertiary))', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: 11.5, color: 'rgb(var(--text-primary))', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: mono ? 600 : 400 }}>{value}</p>
  </div>
);

// ── Main widget ─────────────────────────────────────────────────────────────────
// The widget no longer renders its own floating launcher button or greeting
// bubble — opening is triggered externally (see FloatingActionMenu) via the
// imperative `open()` handle, and `onOpenChange` lets the parent know when to
// hide its own trigger UI while the chat window/minimized bar is visible.
const AIChatWidget = forwardRef(({ isRTL, user, token, onOpenChange }, ref) => {
  const lang = isRTL ? 'ar' : 'en';
  const dir  = isRTL ? 'rtl' : 'ltr';

  const [open,           setOpen]           = useState(false);
  const [minimized,      setMinimized]      = useState(false);
  const [fullscreen,     setFullscreen]     = useState(false);
  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState('');
  const [streaming,      setStreaming]      = useState(false);
  const [typing,         setTyping]         = useState(false);
  const [showActions,    setShowActions]    = useState(false);
  const [leadScore,      setLeadScore]      = useState(0);
  const [hasOpened,      setHasOpened]      = useState(false);
  const [showPanel,      setShowPanel]      = useState(true);
  const [remoteConfig,   setRemoteConfig]   = useState(null);
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
  // Voice
  const [voiceMode,      setVoiceMode]      = useState('idle'); // idle | listening | speaking
  const [handsFree,      setHandsFree]      = useState(false);
  const [micError,       setMicError]       = useState(null); // null | 'denied' | 'unsupported'
  const [waveLevels,     setWaveLevels]     = useState([2, 2, 2, 2, 2]);
  // Attachments
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [sentAttachments, setSentAttachments] = useState([]);
  const [uploading,      setUploading]      = useState(false);
  const [generatingDoc,  setGeneratingDoc]  = useState(false);
  const [detectedUrl,    setDetectedUrl]    = useState(null);
  const [analyzingUrl,   setAnalyzingUrl]   = useState(false);

  const sessionRef      = useRef(null);
  const historyRef      = useRef([]);
  const endRef          = useRef(null);
  const inputRef        = useRef(null);
  const fileInputRef    = useRef(null);
  const abortRef        = useRef(null);
  const recognitionRef  = useRef(null);
  const handsFreeRef    = useRef(false);
  const silenceTimerRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const recognitionFailCountRef = useRef(0);
  const micStreamRef    = useRef(null);
  const audioCtxRef     = useRef(null);
  const analyserRef     = useRef(null);
  const rafRef          = useRef(null);
  const audioElRef      = useRef(typeof Audio !== 'undefined' ? new Audio() : null);

  const stageNum = useMemo(() => getStageNum(collected), [collected]);
  const greeting = useMemo(() => remoteConfig?.welcomeMessage?.[lang] || GREETING_FALLBACK[lang], [remoteConfig, lang]);

  // ── Fetch admin-configured welcome message once ────────────────────────────
  useEffect(() => {
    fetch(`${getApiBase()}/support/config`)
      .then(r => r.json())
      .then(data => { if (data) setRemoteConfig(data); })
      .catch(() => {});
  }, []);

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
      const scalarFields = ['leadScore', 'industry', 'projectType', 'businessSummary', 'recommendedSolution', 'complexity', 'priority', 'customerSegment', 'estimatedTimeline', 'completionPercent'];
      const arrayFields  = ['features', 'techStack', 'integrations', 'pages', 'risks', 'nextSteps'];
      for (const f of scalarFields) {
        if (delta[f] !== undefined && delta[f] !== '') next[f] = f === 'leadScore' ? Math.max(prev[f] || 0, delta[f]) : delta[f];
      }
      for (const f of arrayFields) {
        if (Array.isArray(delta[f]) && delta[f].length) next[f] = delta[f]; // backend sends cumulative arrays
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

  const showGreeting = useCallback(() => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const id = `ai-${Date.now()}`;
      setMessages([{ id, type: 'ai', content: greeting }]);
      historyRef.current = [{ role: 'assistant', content: greeting }];
      setShowActions(true);
    }, 850);
  }, [greeting]);

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
    setPendingAttachments([]);
    setSentAttachments([]);
    setDetectedUrl(null);
    showGreeting();
  }, [streaming, messages, leadScore, updateConvListEntry, showGreeting]);

  // ── Scroll on new message ──────────────────────────────────────────────────
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Shared restore logic — used for both "same-browser session" and
  // "returning logged-in user on a new device" resume paths.
  const applyRestoredConversation = useCallback((data) => {
    if (!data.messages?.length) return false;
    const restored = data.messages.map((m, i) => ({
      id: `r-${i}`, type: m.role === 'user' ? 'user' : 'ai', content: m.content,
    }));
    setMessages(restored);
    historyRef.current = data.messages.map(m => ({ role: m.role, content: m.content }));
    if (data.leadScore) setLeadScore(data.leadScore);
    if (data.intelligence && Object.keys(data.intelligence).length) mergeIntelligence(data.intelligence);
    if (data.attachmentsLog?.length) setSentAttachments(data.attachmentsLog);
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
    return true;
  }, [mergeIntelligence, mergeCollected]);

  // ── Init on first open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || hasOpened) return;
    setHasOpened(true);

    if (sessionRef.current) {
      fetch(`${getApiBase()}/support/conversation/${sessionRef.current}`)
        .then(r => r.json())
        .then(data => { if (!applyRestoredConversation(data)) showGreeting(); })
        .catch(() => showGreeting());
    } else if (user && token) {
      // No local session on this device — a logged-in user may still have a
      // recent conversation on the server (started on their phone, another
      // browser, etc). Resume it instead of starting over from zero.
      fetch(`${getApiBase()}/support/my-conversation`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.found && applyRestoredConversation(data)) {
            sessionRef.current = data.sessionId;
            try { localStorage.setItem(SESSION_KEY, data.sessionId); } catch {}
          } else { showGreeting(); }
        })
        .catch(() => showGreeting());
    } else { showGreeting(); }

    setTimeout(() => inputRef.current?.focus(), 400);
  }, [open]); // eslint-disable-line

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
    let finalizedText = '';
    setMessages(prev => {
      const next = prev.map(m => m.id === id ? { ...m, streaming: false } : m);
      finalizedText = next.find(m => m.id === id)?.content || '';
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
      if (meta?.suggestWhatsapp || meta?.whatsappBrief) {
        extras.push({
          id: `wa-${Date.now()}`, type: 'whatsapp',
          whatsappBrief: meta.whatsappBrief,
          content: lang === 'ar' ? 'يمكن مستشار الحلول لدينا مساعدتك أسرع على واتساب — مباشر وفوري، وسيصله كل ما ناقشناه.' : 'Our solution architect can help you faster on WhatsApp — direct, immediate, and they\'ll already have everything we discussed.',
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

    if (meta?.intelligence) mergeIntelligence(meta.intelligence);
    else if (meta?.leadScore) setLeadScore(s => Math.max(s, meta.leadScore));

    if (meta?.collected && Object.keys(meta.collected).length) mergeCollected(meta.collected);

    if (meta?.buttons?.length) setDynamicButtons(meta.buttons);

    // Hands-free mode: speak the reply aloud, then resume listening automatically
    if (handsFreeRef.current && finalizedText.trim()) {
      speakRef.current?.(finalizedText.replace(/[*`#_]/g, ''));
    }
  }, [lang, saveHistory, mergeCollected, mergeIntelligence, collected, intelligence, leadScore, updateConvListEntry]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const send = useCallback(async (text, attachmentsOverride) => {
    const msg = (text || '').trim();
    const atts = attachmentsOverride || pendingAttachments;
    if ((!msg && !atts.length) || streaming) return;

    setShowActions(false);
    setDynamicButtons(null);
    addMsg({ id: `u-${Date.now()}`, type: 'user', content: msg, attachments: atts.length ? atts : undefined });
    setInput('');
    setPendingAttachments([]);
    setDetectedUrl(null);
    if (atts.length) setSentAttachments(prev => [...prev, ...atts]);

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
          attachments: atts,
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
  }, [streaming, lang, user, collected, pendingAttachments, addMsg, patchMsg, replaceMsg, finalizeMsg]);

  const submit  = (e) => { e?.preventDefault(); send(input); };
  const onKey   = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } };

  // ── Voice: waveform (real mic-driven bars via a dedicated getUserMedia stream,
  //    independent of SpeechRecognition's own internal capture) ─────────────────
  const stopWaveform = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    micStreamRef.current = null; audioCtxRef.current = null; analyserRef.current = null;
    setWaveLevels([2, 2, 2, 2, 2]);
  }, []);

  const startWaveform = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(data);
        const bars = [0, 1, 2, 3, 4].map(i => {
          const seg = data.slice(i * 3, i * 3 + 3);
          const avg = seg.reduce((a, b) => a + b, 0) / (seg.length || 1);
          return Math.max(2, Math.min(22, Math.round((avg / 255) * 22)));
        });
        setWaveLevels(bars);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Waveform is cosmetic — if the browser blocks this second stream for any
      // reason, speech recognition (which opens its own internal capture) still works.
    }
  }, []);

  // ── Voice: text-to-speech playback ──────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    try { audioElRef.current?.pause(); if (audioElRef.current) audioElRef.current.currentTime = 0; } catch {}
    if (voiceMode === 'speaking') setVoiceMode('idle');
  }, [voiceMode]);

  const speak = useCallback(async (text) => {
    if (!text?.trim() || !audioElRef.current) return;
    try {
      const res = await fetch(`${getApiBase()}/support/tts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sessionId: sessionRef.current }),
      });
      if (!res.ok) throw new Error('tts failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = audioElRef.current;
      audio.src = url;
      setVoiceMode('speaking');
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setVoiceMode('idle');
        if (handsFreeRef.current) startListening('handsfree');
      };
      await audio.play();
    } catch {
      setVoiceMode('idle');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voice: speech-to-text ────────────────────────────────────────────────────
  const hasSpeech = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const voiceUiEnabled = hasSpeech && remoteConfig?.voiceEnabled !== false;

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try { recognitionRef.current?.stop(); } catch {}
    stopWaveform();
    setVoiceMode(m => (m === 'listening' ? 'idle' : m));
  }, [stopWaveform]);

  const startListening = useCallback((mode = 'manual') => {
    if (streaming) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicError('unsupported'); return; }

    stopSpeaking(); // barge-in: stop any AI audio the instant the user starts talking again
    setMicError(null);
    finalTranscriptRef.current = '';

    const r = new SR();
    const continuous = mode === 'handsfree';
    r.lang = isRTL ? 'ar-SA' : 'en-US';
    r.continuous = continuous;
    r.interimResults = true;

    r.onstart = () => { setVoiceMode('listening'); startWaveform(); };

    r.onresult = (e) => {
      recognitionFailCountRef.current = 0; // real audio came through — reset the error circuit breaker
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscriptRef.current += t;
        else interim += t;
      }
      const combined = (finalTranscriptRef.current + interim).trim();
      setInput(combined);

      if (continuous) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const finalMsg = (finalTranscriptRef.current + interim).trim();
          if (finalMsg) {
            try { r.stop(); } catch {}
            finalTranscriptRef.current = '';
            send(finalMsg);
          }
        }, 1400);
      }
    };

    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'permission-denied' || e.error === 'service-not-allowed') {
        setMicError('denied');
        handsFreeRef.current = false;
        setHandsFree(false);
        return;
      }
      if (e.error === 'network') {
        recognitionFailCountRef.current += 1;
        // A brief network blip during continuous listening is normal (onend
        // will just retry); repeated failures back-to-back mean something is
        // actually wrong (offline, blocked) — stop hammering it and say so,
        // instead of looping forever.
        if (recognitionFailCountRef.current >= 3) {
          setMicError('network');
          handsFreeRef.current = false;
          setHandsFree(false);
        }
      }
      // 'no-speech'/'aborted' are routine (user paused, or we stopped it ourselves) — ignore.
    };

    r.onend = () => {
      stopWaveform();
      if (handsFreeRef.current && recognitionFailCountRef.current < 3) {
        try { r.start(); } catch { setVoiceMode('idle'); }
      } else {
        setVoiceMode('idle');
      }
    };

    recognitionRef.current = r;
    try { r.start(); } catch { setVoiceMode('idle'); }
  }, [streaming, isRTL, stopSpeaking, startWaveform, stopWaveform, send]);

  const togglePushToTalk = useCallback(() => {
    if (voiceMode === 'listening') { stopListening(); if (input.trim()) send(input); return; }
    if (voiceMode === 'speaking') { stopSpeaking(); return; }
    startListening('manual');
  }, [voiceMode, input, stopListening, stopSpeaking, startListening, send]);

  const toggleHandsFree = useCallback(() => {
    const next = !handsFree;
    handsFreeRef.current = next;
    setHandsFree(next);
    if (next) { setMicError(null); startListening('handsfree'); }
    else { stopListening(); stopSpeaking(); }
  }, [handsFree, startListening, stopListening, stopSpeaking]);

  // Speak AI replies automatically while in hands-free mode
  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; }, [speak]);

  // Clean up all voice/audio resources on unmount
  useEffect(() => () => { stopWaveform(); try { recognitionRef.current?.stop(); } catch {}; try { audioElRef.current?.pause(); } catch {}; }, [stopWaveform]);

  // ── Attachments ────────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      const res = await fetch(`${getApiBase()}/support/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (data?.attachments?.length) {
        setPendingAttachments(prev => [...prev, ...data.attachments.filter(a => a.kind !== 'error')]);
      }
    } catch {} finally { setUploading(false); }
  }, []);

  const removeAttachment = useCallback((idx) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Detect a pasted/typed URL to offer an inline "analyze this website" action
  useEffect(() => {
    const m = input.match(/https?:\/\/[^\s]+/i);
    setDetectedUrl(m ? m[0] : null);
  }, [input]);

  const generateDocument = useCallback(async () => {
    if (generatingDoc) return;
    setGeneratingDoc(true);
    try {
      const res = await fetch(`${getApiBase()}/support/generate-document`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collected, intelligence, lang, sessionId: sessionRef.current }),
      });
      const data = await res.json();
      if (res.ok && data.document) {
        addMsg({ id: `doc-${Date.now()}`, type: 'document', document: data.document });
      }
    } catch {} finally { setGeneratingDoc(false); }
  }, [generatingDoc, collected, intelligence, lang, addMsg]);

  const analyzeDetectedUrl = useCallback(async () => {
    if (!detectedUrl || analyzingUrl) return;
    setAnalyzingUrl(true);
    try {
      const res = await fetch(`${getApiBase()}/support/analyze-url`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: detectedUrl, lang, sessionId: sessionRef.current }),
      });
      const data = await res.json();
      if (res.ok) {
        setPendingAttachments(prev => [...prev, { kind: 'website', url: data.url, heuristics: data.heuristics, critique: data.critique, name: detectedUrl }]);
        setDetectedUrl(null);
      }
    } catch {} finally { setAnalyzingUrl(false); }
  }, [detectedUrl, analyzingUrl, lang]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const closeChat      = () => {
    abortRef.current?.abort();
    handsFreeRef.current = false;
    setHandsFree(false);
    stopListening();
    stopSpeaking();
    setOpen(false); setFullscreen(false);
  };
  const toggleFullscreen = () => setFullscreen(f => !f);

  // External trigger (FloatingActionMenu's "YANSY AI" action) opens the chat
  // via this handle — the widget has no launcher button of its own anymore.
  // (setOpen/setMinimized are stable setters, so this never needs to change.)
  useImperativeHandle(ref, () => ({ open: () => { setOpen(true); setMinimized(false); } }), []);

  // Lets the parent hide its own floating trigger while the chat window or
  // the minimized bar is on screen, so the two don't overlap.
  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  const activeButtons = useMemo(() => {
    if (dynamicButtons?.length) return dynamicButtons;
    return DISCOVERY_BUTTONS[lang] || DISCOVERY_BUTTONS.en;
  }, [dynamicButtons, lang]);

  const showSplitPanel = !isNarrow && showPanel;

  // No launcher button/greeting bubble of our own anymore — when closed and
  // not minimized there is nothing for this component to render at all.
  if (!open) return null;

  return (
    <>
      <style>{CSS}</style>
      {/* Same corner geometry as FloatingActionMenu — the two swap places, so a
          differing edge gap would make the panel jump sideways on open. */}
      <div style={{ ...floatingCornerStyle(isRTL), zIndex: 9999, gap: 10 }}>

        {/* Chat window */}
        {open && !minimized && (
          <div className={fullscreen ? '' : 'yai-win yai-panel-h'} dir={dir} style={fullscreen ? {
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', flexDirection: 'row', overflow: 'hidden',
            background: 'rgb(var(--bg-elevated))',
            animation: 'yai-fs-in .22s ease both',
            // Fullscreen goes fully edge-to-edge, so it's the one place that has
            // to clear the notch/home-indicator itself instead of relying on the
            // floating panel's own margins.
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          } : {
            width:  floatingPanelWidth(showSplitPanel ? 700 : 420),
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: 'rgb(var(--bg-elevated))',
            border: '1px solid rgb(var(--border))',
            borderRadius: 20,
            boxShadow: '0 24px 80px rgba(13,17,23,0.14), 0 4px 16px rgba(13,17,23,0.06)',
            transition: 'width .3s cubic-bezier(.16,1,.3,1)',
          }}>

            {/* Fullscreen: conversations sidebar */}
            {fullscreen && showSidebar && (
              <div dir={dir} style={{ width: 230, flexShrink: 0, background: 'rgb(var(--bg-surface))', borderInlineEnd: '1px solid rgb(var(--border))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid rgb(var(--border))' }}>
                  <button onClick={startNewConversation} style={{ width: '100%', padding: '8px 12px', background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.2)', borderRadius: 8, color: 'rgb(var(--accent))', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {isRTL ? '+ محادثة جديدة' : '+ New Conversation'}
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                  {convList.length === 0 && (
                    <p style={{ fontSize: 11, color: 'rgb(var(--text-tertiary))', textAlign: 'center', padding: '20px 8px' }}>{isRTL ? 'لا توجد محادثات' : 'No conversations yet'}</p>
                  )}
                  {convList.map(c => (
                    <div key={c.id} style={{ padding: '9px 10px', borderRadius: 8, marginBottom: 4, background: c.id === sessionRef.current ? 'rgb(var(--accent-light))' : 'rgb(var(--bg-secondary))', border: `1px solid ${c.id === sessionRef.current ? 'rgb(var(--accent-muted))' : 'rgb(var(--border))'}`, cursor: 'pointer' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgb(var(--text-primary))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || 'AI Conversation'}</p>
                      {c.lastMsg && <p style={{ margin: '2px 0 0', fontSize: 10.5, color: 'rgb(var(--text-secondary))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMsg}</p>}
                      {c.score > 0 && <p style={{ margin: '3px 0 0', fontSize: 9.5, color: 'rgb(var(--accent))', fontFamily: 'monospace' }}>Score: {c.score}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content: chat column + intelligence panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', minWidth: 0 }}>

              {/* Chat column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, maxWidth: fullscreen ? 720 : '100%', margin: fullscreen && !showSplitPanel ? '0 auto' : undefined }}>

                {/* Header */}
                <div style={{ padding: '13px 14px', borderBottom: '1px solid rgb(var(--border))', background: 'rgb(var(--bg-elevated))', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: 'linear-gradient(135deg,rgb(var(--accent)),rgb(var(--accent-hover)))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', color: 'rgb(var(--bg-elevated))', boxShadow: '0 4px 12px rgba(37,99,235,.28)' }}>
                    <SparkIcon size={17} />
                    <span style={{ position: 'absolute', bottom: -1, insetInlineEnd: -1, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '1.5px solid rgb(var(--bg-elevated))' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'rgb(var(--text-primary))', letterSpacing: '-.01em' }}>YANSY AI</p>
                      {user && <span style={{ fontSize: 9, background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7C3AED', padding: '1px 6px', borderRadius: 9, fontWeight: 700 }}>VIP</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 10.5, color: 'rgb(var(--text-secondary))', letterSpacing: '.01em' }}>
                      {streaming
                        ? (isRTL ? '⟳ جاري التفكير...' : '⟳ Thinking...')
                        : (isRTL ? '● متصل الآن' : '● Online now')}
                    </p>
                  </div>

                  {/* Header controls */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    {!isNarrow && (
                      <button className="yai-ico" onClick={() => setShowPanel(p => !p)} title={isRTL ? 'مخطط المشروع' : 'Project blueprint'} aria-label={isRTL ? 'مخطط المشروع' : 'Project blueprint'} aria-pressed={showPanel} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showPanel ? 'rgb(var(--accent-light))' : 'rgb(var(--bg-elevated))', border: `1px solid ${showPanel ? 'rgb(var(--accent-muted))' : 'rgb(var(--border))'}`, borderRadius: 6, color: showPanel ? 'rgb(var(--accent))' : 'rgb(var(--text-tertiary))', cursor: 'pointer', transition: 'all .2s' }}>
                        <PanelIcon />
                      </button>
                    )}
                    {fullscreen && (
                      <button className="yai-ico" onClick={() => setShowSidebar(s => !s)} title="Conversations" aria-label={isRTL ? 'المحادثات' : 'Conversations'} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showSidebar ? 'rgb(var(--accent-light))' : 'rgb(var(--bg-elevated))', border: `1px solid ${showSidebar ? 'rgb(var(--accent-muted))' : 'rgb(var(--border))'}`, borderRadius: 6, color: showSidebar ? 'rgb(var(--accent))' : 'rgb(var(--text-tertiary))', cursor: 'pointer', fontSize: 13 }}>≡</button>
                    )}
                    {fullscreen && (
                      <button className="yai-ico" onClick={startNewConversation} title={isRTL ? 'محادثة جديدة' : 'New conversation'} aria-label={isRTL ? 'محادثة جديدة' : 'New conversation'} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))', borderRadius: 6, color: 'rgb(var(--text-secondary))', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>+</button>
                    )}
                    <button className="yai-ico" onClick={toggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))', borderRadius: 6, color: 'rgb(var(--text-secondary))', cursor: 'pointer', fontSize: 11 }}>
                      {fullscreen ? '⊡' : '⊞'}
                    </button>
                    {!fullscreen && <button className="yai-ico" onClick={() => setMinimized(true)} aria-label={isRTL ? 'تصغير' : 'Minimize'} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))', borderRadius: 6, color: 'rgb(var(--text-secondary))', cursor: 'pointer', transition: 'background .2s, border-color .2s' }}><MinIcon /></button>}
                    <button className="yai-ico" onClick={closeChat} aria-label={isRTL ? 'إغلاق المحادثة' : 'Close chat'} style={{ width: 27, height: 27, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))', borderRadius: 6, color: 'rgb(var(--text-secondary))', cursor: 'pointer', transition: 'background .2s, border-color .2s' }}><CloseIcon /></button>
                  </div>
                </div>

                {/* Stage bar */}
                <StageBar stage={stageNum} lang={lang} />

                {/* Intelligence strip — only when panel is hidden */}
                {(!showSplitPanel || isNarrow) && (
                  <IntelligenceStrip intelligence={intelligence} leadScore={leadScore} lang={lang} />
                )}

                {/* Messages */}
                <div className="yai-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: 'rgb(var(--bg-elevated))' }}>

                  {messages.map(msg => {
                    if (msg.type === 'whatsapp') return <WACard    key={msg.id} msg={msg} isRTL={isRTL} />;
                    if (msg.type === 'ticket')   return <TicketCard key={msg.id} msg={msg} isRTL={isRTL} />;
                    if (msg.type === 'request')  return <RequestCard key={msg.id} msg={msg} isRTL={isRTL} />;
                    if (msg.type === 'document') return <DocumentCard key={msg.id} msg={msg} isRTL={isRTL} />;

                    const isUser = msg.type === 'user';
                    if (isUser) {
                      return (
                        <div key={msg.id} className="yai-msg-usr" style={{ display: 'flex', flexDirection: 'column', alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 5 }}>
                          {msg.attachments?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: isRTL ? 'flex-start' : 'flex-end', maxWidth: '82%' }}>
                              {msg.attachments.map((a, i) => (
                                a.kind === 'image'
                                  ? <img key={i} src={a.dataUrl || a.url} alt="" style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover', border: '1px solid rgb(var(--border))' }} />
                                  : <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'rgb(var(--text-secondary))', background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))', borderRadius: 7, padding: '4px 9px' }}>
                                      {a.kind === 'website' ? <GlobeIcon /> : <DocIcon />} {a.name}
                                    </span>
                              ))}
                            </div>
                          )}
                          {msg.content && (
                            <div style={{
                              maxWidth: '82%', padding: '9px 14px', fontSize: 13, lineHeight: 1.65,
                              background: 'linear-gradient(135deg,rgb(var(--accent)),#1e40af)',
                              borderRadius: isRTL ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                              color: 'rgb(var(--bg-elevated))', fontWeight: 500,
                              boxShadow: '0 2px 10px rgba(37,99,235,.22)',
                            }}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // AI message — document block style. The avatar+bubble row is
                    // pinned physically left regardless of language (chat convention:
                    // your own messages on the right, the other party's on the left,
                    // unmirrored) — flexDirection compensates for the ambient dir="rtl"
                    // flip that would otherwise push the avatar to the right.
                    return (
                      <div key={msg.id} className="yai-msg-ai" style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 9 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgb(var(--accent-light))', border: '1px solid rgb(var(--accent-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'rgb(var(--accent))', marginTop: 2 }}><SparkIcon size={13} /></div>
                        <div style={{
                          flex: 1, padding: '10px 14px',
                          background: 'rgb(var(--bg-surface))',
                          borderRadius: '2px 12px 12px 12px',
                          border: '1px solid rgb(var(--border))',
                          borderLeft: '2px solid rgba(37,99,235,0.3)',
                          borderRight: '1px solid rgb(var(--border))',
                          fontSize: 13, color: 'rgb(var(--text-primary))', lineHeight: 1.68,
                        }}>
                          {msg.streaming && !msg.content
                            ? <ThinkingState lang={lang} />
                            : <RichText text={msg.content} streaming={msg.streaming} />
                          }
                          {voiceUiEnabled && !msg.streaming && msg.content && (
                            <button type="button" onClick={() => (voiceMode === 'speaking' ? stopSpeaking() : speak(msg.content.replace(/[*`#_]/g, '')))} title={isRTL ? 'استمع' : 'Listen'} aria-label={isRTL ? 'استمع لهذه الرسالة' : 'Listen to this message'}
                              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'rgb(var(--text-tertiary))', cursor: 'pointer', fontSize: 10, padding: 0 }}>
                              <SpeakerIcon size={11} /> {isRTL ? 'استمع' : 'Listen'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {typing && (
                    <div className="yai-msg-ai" style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgb(var(--accent-light))', border: '1px solid rgb(var(--accent-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'rgb(var(--accent))' }}><SparkIcon size={13} /></div>
                      <div style={{ background: 'rgb(var(--bg-surface))', border: '1px solid rgb(var(--border))', borderRadius: '2px 12px 12px 12px' }}>
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  {/* Quick reply chips */}
                  {showActions && !typing && messages.length > 0 && (
                    <div className="yai-fade" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {activeButtons.map((a, idx) => (
                        <button key={`${a.label}-${idx}`} className="yai-btn yai-chip" onClick={() => send(a.msg)} style={{ padding: '6px 11px', fontSize: 11.5, cursor: 'pointer', border: '1px solid rgb(var(--border))', color: 'rgb(var(--text-secondary))', background: 'rgb(var(--bg-secondary))', borderRadius: 8, transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 5, animationDelay: `${idx * 0.04}s` }}>
                          {a.icon && <span>{a.icon}</span>}
                          <span>{a.label}</span>
                        </button>
                      ))}
                      {/* On narrow screens / hidden panel the sidebar's "Generate Document"
                          action isn't reachable at all — surface it here too. */}
                      {!showSplitPanel && remoteConfig?.documentGenerationEnabled !== false && (intelligence?.projectType || collected?.projectType) && (
                        <button className="yai-btn yai-chip" onClick={generateDocument} disabled={generatingDoc} style={{ padding: '6px 11px', fontSize: 11.5, cursor: generatingDoc ? 'wait' : 'pointer', border: '1px solid rgba(37,99,235,.25)', color: 'rgb(var(--accent))', background: 'rgb(var(--accent-light))', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                          📄 {generatingDoc ? (isRTL ? 'جارِ الإنشاء...' : 'Generating...') : (isRTL ? 'إنشاء وثيقة المشروع' : 'Generate Project Document')}
                        </button>
                      )}
                    </div>
                  )}

                  <div ref={endRef} />
                </div>

                {/* Input bar */}
                <div style={{ padding: '10px 12px', borderTop: '1px solid rgb(var(--border))', background: 'rgb(var(--bg-secondary))', flexShrink: 0 }}>

                  {pendingAttachments.length > 0 && (
                    <div className="yai-fade" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {pendingAttachments.map((a, i) => <AttachmentChip key={i} att={a} isRTL={isRTL} onRemove={() => removeAttachment(i)} />)}
                    </div>
                  )}

                  {detectedUrl && !pendingAttachments.some(a => a.url === detectedUrl) && (
                    <div className="yai-fade" style={{ marginBottom: 8 }}>
                      <button type="button" onClick={analyzeDetectedUrl} disabled={analyzingUrl} className="yai-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', fontSize: 11.5, cursor: analyzingUrl ? 'wait' : 'pointer', border: '1px solid rgba(37,99,235,.25)', color: 'rgb(var(--accent))', background: 'rgb(var(--accent-light))', borderRadius: 8 }}>
                        <GlobeIcon />
                        {analyzingUrl ? (isRTL ? 'جارِ تحليل الموقع...' : 'Analyzing website...') : (isRTL ? 'تحليل هذا الموقع' : 'Analyze this website')}
                      </button>
                    </div>
                  )}

                  {micError === 'denied' && (
                    <div className="yai-fade" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>🎙️</span>
                      <p style={{ margin: 0, fontSize: 10.5, color: '#991B1B', lineHeight: 1.5, flex: 1 }}>
                        {isRTL ? 'تم حظر إذن الميكروفون. اضغط على أيقونة القفل بجانب الرابط ← إعدادات الموقع ← اسمح بالميكروفون.' : 'Microphone was blocked. Click the lock icon in your address bar → Site settings → allow Microphone.'}
                      </p>
                      <button type="button" onClick={() => setMicError(null)} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontSize: 15, lineHeight: 1, flexShrink: 0 }}>×</button>
                    </div>
                  )}

                  {micError === 'network' && (
                    <div className="yai-fade" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>📡</span>
                      <p style={{ margin: 0, fontSize: 10.5, color: '#92400E', lineHeight: 1.5, flex: 1 }}>
                        {isRTL ? 'انقطع الاتصال أثناء الاستماع. تحقق من الإنترنت وحاول مرة أخرى.' : 'Lost connection while listening. Check your internet and try again.'}
                      </p>
                      <button type="button" onClick={() => { setMicError(null); recognitionFailCountRef.current = 0; }} style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', fontSize: 15, lineHeight: 1, flexShrink: 0 }}>×</button>
                    </div>
                  )}

                  <form onSubmit={submit} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf,.docx" multiple hidden onChange={handleFileSelect} />
                    <button type="button" className="yai-ico" onClick={() => fileInputRef.current?.click()} disabled={uploading} title={isRTL ? 'إرفاق ملف' : 'Attach a file'} aria-label={isRTL ? 'إرفاق ملف' : 'Attach a file'} style={{ width: 38, height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', borderRadius: 9, color: 'rgb(var(--text-tertiary))', cursor: uploading ? 'wait' : 'pointer', transition: 'all .2s' }}>
                      {uploading ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(37,99,235,.3)', borderTopColor: 'rgb(var(--accent))', animation: 'yai-spin .7s linear infinite' }} /> : <ClipIcon />}
                    </button>

                    {voiceUiEnabled && (
                      <button type="button" className="yai-ico" onClick={togglePushToTalk}
                        title={voiceMode === 'listening' ? (isRTL ? 'إيقاف الاستماع' : 'Stop listening') : voiceMode === 'speaking' ? (isRTL ? 'إيقاف الصوت' : 'Stop speaking') : (isRTL ? 'تحدث' : 'Push to talk')}
                        aria-label={voiceMode === 'listening' ? (isRTL ? 'إيقاف الاستماع' : 'Stop listening') : voiceMode === 'speaking' ? (isRTL ? 'إيقاف الصوت' : 'Stop speaking') : (isRTL ? 'تحدث' : 'Push to talk')}
                        aria-pressed={voiceMode === 'listening'}
                        style={{ width: 38, height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: voiceMode === 'listening' ? 'rgb(var(--accent-light))' : voiceMode === 'speaking' ? '#F0FDF4' : 'rgb(var(--bg-elevated))', border: `1px solid ${voiceMode === 'listening' ? 'rgb(var(--accent-muted))' : voiceMode === 'speaking' ? '#BBF7D0' : 'rgb(var(--border))'}`, borderRadius: 9, color: voiceMode === 'listening' ? 'rgb(var(--accent))' : voiceMode === 'speaking' ? '#16a34a' : 'rgb(var(--text-tertiary))', cursor: 'pointer', transition: 'all .2s' }}>
                        {voiceMode === 'listening' ? <Waveform levels={waveLevels} /> : voiceMode === 'speaking' ? <SpeakerIcon /> : <MicIcon on={false} />}
                      </button>
                    )}

                    {voiceUiEnabled && (
                      <button type="button" className="yai-ico" onClick={toggleHandsFree} title={isRTL ? 'وضع اليدين الحرتين' : 'Hands-free mode'} aria-label={isRTL ? 'وضع اليدين الحرتين' : 'Hands-free mode'} aria-pressed={handsFree}
                        style={{ width: 38, height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: handsFree ? 'rgb(var(--accent-light))' : 'rgb(var(--bg-elevated))', border: `1px solid ${handsFree ? 'rgb(var(--accent-muted))' : 'rgb(var(--border))'}`, borderRadius: 9, color: handsFree ? 'rgb(var(--accent))' : 'rgb(var(--text-tertiary))', cursor: 'pointer', transition: 'all .2s' }}>
                        <HandsFreeIcon on={handsFree} />
                      </button>
                    )}

                    <textarea
                      ref={inputRef} value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={onKey}
                      placeholder={voiceMode === 'listening' ? (isRTL ? 'أستمع...' : 'Listening...') : isRTL ? 'اكتب رسالتك...' : 'Message YANSY AI...'}
                      dir={dir} rows={1}
                      style={{ flex: 1, minWidth: 0, background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', borderRadius: 9, color: 'rgb(var(--text-primary))', padding: '9px 12px', fontSize: 13, outline: 'none', resize: 'none', minHeight: 38, maxHeight: 110, lineHeight: 1.5, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
                      onFocus={e => { e.target.style.borderColor = 'rgb(var(--accent))'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'; }}
                      onBlur={e  => { e.target.style.borderColor = 'rgb(var(--border))'; e.target.style.boxShadow = 'none'; }}
                      onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'; }}
                    />
                    <button type="submit" className="yai-send" disabled={(!input.trim() && !pendingAttachments.length) || streaming} aria-label={isRTL ? 'إرسال' : 'Send message'} style={{ width: 38, height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (input.trim() || pendingAttachments.length) && !streaming ? 'rgb(var(--accent))' : 'rgb(var(--border-light))', border: 'none', borderRadius: 9, color: (input.trim() || pendingAttachments.length) && !streaming ? 'rgb(var(--bg-elevated))' : 'rgb(var(--text-tertiary))', cursor: (input.trim() || pendingAttachments.length) && !streaming ? 'pointer' : 'not-allowed', transition: 'all .2s' }}>
                      {streaming ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(37,99,235,.3)', borderTopColor: 'rgb(var(--accent))', animation: 'yai-spin .7s linear infinite' }} /> : <span style={{ display: 'flex', transform: isRTL ? 'scaleX(-1)' : 'none' }}><SendIcon /></span>}
                    </button>
                  </form>
                  <p style={{ margin: '6px 0 0', textAlign: 'center', fontSize: 9.5, color: 'rgb(var(--text-tertiary))', letterSpacing: '.04em' }}>
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
                  files={sentAttachments}
                  onGenerateDocument={generateDocument}
                  generatingDoc={generatingDoc}
                  docGenEnabled={remoteConfig?.documentGenerationEnabled !== false}
                />
              )}
            </div>
          </div>
        )}

        {/* Minimized bar. `dir` is set explicitly: the floating wrapper is
            pinned to `ltr` so its corner alignment stays physical, so this bar
            can't inherit the page's Arabic direction and has to opt back in. */}
        {open && minimized && (
          <button className="yai-notif" dir={dir} onClick={() => setMinimized(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', cursor: 'pointer', width: floatingPanelWidth(240), background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <span style={{ color: 'rgb(var(--accent))', display: 'flex' }}><SparkIcon size={15} /></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--text-primary))', flex: 1, textAlign: 'start' }}>YANSY AI</span>
            {stageNum > 0 && <span style={{ fontSize: 9.5, color: 'rgba(37,99,235,.6)', fontFamily: 'monospace' }}>{stageNum}/5</span>}
            {leadScore > 0 && <span style={{ fontSize: 10, color: leadScore >= 70 ? '#16a34a' : 'rgb(var(--accent))', fontFamily: 'monospace', fontWeight: 700 }}>{leadScore}</span>}
            <span style={{ fontSize: 10, color: 'rgb(var(--text-secondary))' }}>{isRTL ? 'افتح' : 'Open'}</span>
          </button>
        )}
      </div>
    </>
  );
});

export default AIChatWidget;
