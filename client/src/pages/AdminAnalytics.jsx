import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Eye, Clock, TrendingUp, TrendingDown, Globe, Monitor,
  Smartphone, Tablet, RefreshCw, BarChart3, MousePointer, ArrowUpRight,
  Wifi, Map, Chrome, Activity, Zap, Target, AlertCircle,
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

// ── Design tokens (light-only) ─────────────────────────────────────────────────
const TK = {
  bg:          '#F6F7F9',
  surface:     '#FFFFFF',
  surfaceHov:  'rgba(0,0,0,0.025)',
  border:      '#E8EBF0',
  borderHov:   'rgba(37,99,235,0.25)',
  text:        '#0D1117',
  textSub:     '#6B7280',
  textMuted:   '#9CA3AF',
  gold:        '#2563EB',
  goldDim:     'rgba(37,99,235,0.12)',
  blue:        '#60a5fa',
  blueDim:     'rgba(96,165,250,0.12)',
  green:       '#34d399',
  greenDim:    'rgba(52,211,153,0.12)',
  red:         '#f87171',
  redDim:      'rgba(248,113,113,0.12)',
  purple:      '#a78bfa',
  purpleDim:   'rgba(167,139,250,0.12)',
  shadow:      '0 0 0 1px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)',
};

// ── Inline SVG Charts ─────────────────────────────────────────────────────────

const SparkLine = ({ data = [], color = '#2563EB', height = 40 }) => {
  if (!data.length) return null;
  const vals = data.map(d => d.views || d.sessions || d.conversions || d.events || 0);
  const max = Math.max(...vals, 1);
  const w = 200;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1 || 1)) * w;
    const y = height - (v / max) * (height - 4);
    return `${x},${y}`;
  });
  const fill = pts.map((p, i) => {
    if (i === 0) return `M ${p}`;
    return `L ${p}`;
  }).join(' ');
  const area = `${fill} L ${w},${height} L 0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#','')})`} />
      <path d={fill} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const HBarChart = ({ data = [], labelKey, valueKey, color = '#2563EB', tk }) => {
  if (!data.length) return <EmptyState small tk={tk} />;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.slice(0, 10).map((item, i) => {
        const pct = Math.round(((item[valueKey] || 0) / max) * 100);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '120px', fontSize: '11px', color: tk.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {item[labelKey] || '—'}
            </div>
            <div style={{ flex: 1, height: '6px', background: tk.surface, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ width: '40px', fontSize: '11px', color: tk.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {(item[valueKey] || 0).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DonutChart = ({ data = [], colorMap = {}, tk }) => {
  if (!data.length) return <EmptyState small tk={tk} />;
  const total = data.reduce((s, d) => s + (d.count || 0), 0) || 1;
  const defaultColors = ['#2563EB', '#60a5fa', '#34d399', '#f87171', '#a78bfa'];
  let cumulativePct = 0;

  const segments = data.map((item, i) => {
    const pct = ((item.count || 0) / total) * 100;
    const start = cumulativePct;
    cumulativePct += pct;
    return { ...item, pct, start, color: colorMap[item.device || item.browser] || defaultColors[i % defaultColors.length] };
  });

  const r = 40;
  const cx = 52;
  const cy = 52;
  const circumference = 2 * Math.PI * r;

  let cumulativeLength = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <svg width="104" height="104" viewBox="0 0 104 104" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={tk.border} strokeWidth="10" />
        {segments.map((seg, i) => {
          const segLength = (seg.pct / 100) * circumference;
          const dashArray = `${segLength} ${circumference}`;
          const dashOffset = -cumulativeLength;
          cumulativeLength += segLength;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth="10"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'all 0.6s ease' }}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: tk.textSub, flex: 1 }}>{seg.device || seg.browser}</span>
            <span style={{ fontSize: '11px', color: tk.text, fontVariantNumeric: 'tabular-nums' }}>{seg.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
const EmptyState = ({ tk, small }) => (
  <div style={{ textAlign: 'center', padding: small ? '20px 0' : '40px 0', color: tk.textMuted }}>
    <BarChart3 style={{ width: 24, height: 24, margin: '0 auto 8px', opacity: 0.3 }} />
    <div style={{ fontSize: '12px' }}>No data yet</div>
  </div>
);

const Skeleton = ({ h = 20, w = '100%', tk }) => (
  <div style={{ height: h, width: w, borderRadius: '6px', background: tk.border, animation: 'pulse 1.5s ease-in-out infinite' }} />
);

const StatCard = ({ title, value, subtitle, icon: Icon, color, colorDim, trend, trendVal, tk, sparkData }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? tk.surfaceHov : tk.surface,
        border: `1px solid ${hov ? tk.borderHov : tk.border}`,
        borderRadius: '12px',
        padding: '20px',
        transition: 'all 0.2s',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '9px', background: colorDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 17, height: 17, color }} />
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 10, background: trend >= 0 ? tk.greenDim : tk.redDim, color: trend >= 0 ? tk.green : tk.red, fontSize: 10 }}>
            {trend >= 0 ? <TrendingUp style={{ width: 9, height: 9 }} /> : <TrendingDown style={{ width: 9, height: 9 }} />}
            {trend >= 0 ? '+' : ''}{trendVal}
          </div>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: tk.text, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 10, fontWeight: 400, color: tk.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 10, color: tk.textMuted, marginTop: 4 }}>{subtitle}</div>}
      {sparkData?.length > 1 && (
        <div style={{ marginTop: 12, opacity: 0.7 }}>
          <SparkLine data={sparkData} color={color} height={32} />
        </div>
      )}
    </div>
  );
};

const Card = ({ title, subtitle, children, tk, action }) => (
  <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: '12px', overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${tk.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 400, color: tk.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: tk.textMuted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

const TabBtn = ({ label, active, onClick, tk }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 14px',
      borderRadius: '7px',
      border: 'none',
      background: active ? tk.goldDim : 'transparent',
      color: active ? tk.gold : tk.textSub,
      fontSize: '12px',
      fontWeight: active ? 500 : 350,
      cursor: 'pointer',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

const RangeBtn = ({ label, active, onClick, tk }) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 10px',
      borderRadius: '6px',
      border: `1px solid ${active ? tk.gold : tk.border}`,
      background: active ? tk.goldDim : 'transparent',
      color: active ? tk.gold : tk.textSub,
      fontSize: '11px',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}
  >
    {label}
  </button>
);

// ── Tab panels ────────────────────────────────────────────────────────────────

const OverviewTab = ({ data, loading, tk }) => {
  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {Array(8).fill(0).map((_, i) => <Skeleton key={i} h={130} tk={tk} />)}
    </div>
  );
  if (!data) return <EmptyState tk={tk} />;

  const fmtTime = (sec) => {
    if (!sec) return '0s';
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard title="Visitors Today"        value={data.visitorsToday?.toLocaleString()}  icon={Users}       color={tk.gold}   colorDim={tk.goldDim}   tk={tk} />
        <StatCard title="Visitors This Week"    value={data.visitorsWeek?.toLocaleString()}   icon={Users}       color={tk.blue}   colorDim={tk.blueDim}   tk={tk} />
        <StatCard title="Visitors This Month"   value={data.visitorsMonth?.toLocaleString()}  icon={TrendingUp}  color={tk.green}  colorDim={tk.greenDim}  tk={tk} />
        <StatCard title="Page Views"            value={data.totalPageViews?.toLocaleString()} icon={Eye}         color={tk.purple} colorDim={tk.purpleDim} tk={tk} />
        <StatCard title="Unique Sessions"       value={data.uniqueSessions?.toLocaleString()} icon={Zap}         color={tk.gold}   colorDim={tk.goldDim}   tk={tk} />
        <StatCard title="Returning Visitors"    value={data.returningVisitors?.toLocaleString()} icon={RefreshCw} color={tk.blue} colorDim={tk.blueDim}  tk={tk} />
        <StatCard title="Avg Session Duration"  value={fmtTime(data.avgSessionDuration)}       icon={Clock}      color={tk.green}  colorDim={tk.greenDim}  tk={tk} />
        <StatCard title="Bounce Rate"           value={`${data.bounceRate ?? 0}%`}            icon={TrendingDown} color={data.bounceRate > 60 ? tk.red : tk.gold} colorDim={data.bounceRate > 60 ? tk.redDim : tk.goldDim} tk={tk} />
      </div>
      {data.timeline?.length > 1 && (
        <Card title="Visitor Trend" subtitle="Page views and sessions over time" tk={tk}>
          <SparkLine data={data.timeline} color={tk.gold} height={80} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: tk.textMuted }}>{data.timeline[0]?._id}</span>
            <span style={{ fontSize: 10, color: tk.textMuted }}>{data.timeline[data.timeline.length - 1]?._id}</span>
          </div>
        </Card>
      )}
    </div>
  );
};

const RealtimeTab = ({ data, loading, tk, onRefresh }) => {
  const timeRef = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    setLastUpdated(new Date());
  }, [data]);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      {Array(3).fill(0).map((_, i) => <Skeleton key={i} h={100} tk={tk} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: tk.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: tk.textSub }}>Live — updates every 30s</span>
        </div>
        <span style={{ fontSize: 11, color: tk.textMuted }}>Last updated {lastUpdated.toLocaleTimeString()}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard title="Active Visitors Now"    value={data?.activeNow ?? 0}       icon={Wifi}     color={tk.green}  colorDim={tk.greenDim}  tk={tk} subtitle="Sessions active in last 30 min" />
        <StatCard title="New Sessions (5 min)"   value={data?.recentSessions ?? 0}  icon={Activity} color={tk.blue}   colorDim={tk.blueDim}   tk={tk} />
        <StatCard title="Live Page Activity"     value={data?.recentActivity?.length ?? 0} icon={Eye} color={tk.gold} colorDim={tk.goldDim}   tk={tk} subtitle="Page views in last 5 min" />
      </div>
      {data?.recentActivity?.length > 0 && (
        <Card title="Live Page Activity" subtitle="Most recent page views" tk={tk}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.recentActivity.slice(0, 10).map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${tk.border}` }}>
                <Globe style={{ width: 12, height: 12, color: tk.textMuted, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: tk.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.page || '/'}</span>
                <span style={{ fontSize: 10, color: tk.textMuted, flexShrink: 0 }}>{new Date(ev.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const GeographyTab = ({ data, loading, tk }) => {
  if (loading) return <Skeleton h={300} tk={tk} />;
  if (!data) return <EmptyState tk={tk} />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
      <Card title="Top Countries" subtitle={`${data.total ?? 0} tracked sessions`} tk={tk}>
        <HBarChart data={data.topCountries || []} labelKey="country" valueKey="count" color={tk.gold} tk={tk} />
      </Card>
      <Card title="Top Cities" tk={tk}>
        <HBarChart data={data.topCities || []} labelKey="city" valueKey="count" color={tk.blue} tk={tk} />
      </Card>
    </div>
  );
};

const SourcesTab = ({ data, loading, tk }) => {
  if (loading) return <Skeleton h={300} tk={tk} />;
  if (!data?.length) return <EmptyState tk={tk} />;
  const colorMap = { Direct: tk.gold, Google: tk.blue, Social: tk.green, Referral: tk.purple, Campaign: tk.red };
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
      <Card title="Traffic Sources" subtitle="Where your visitors come from" tk={tk}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.map((src, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: tk.text }}>{src.source}</span>
                <span style={{ fontSize: 12, color: tk.textSub }}>{src.count.toLocaleString()} <span style={{ color: tk.textMuted }}>({src.percent}%)</span></span>
              </div>
              <div style={{ height: 6, background: tk.surface, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${src.percent}%`, height: '100%', background: colorMap[src.source] || tk.gold, borderRadius: 3, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Distribution" tk={tk}>
        <DonutChart data={data} colorMap={colorMap} tk={tk} />
      </Card>
    </div>
  );
};

const DevicesTab = ({ data, loading, tk }) => {
  if (loading) return <Skeleton h={300} tk={tk} />;
  if (!data) return <EmptyState tk={tk} />;
  const devColorMap = { Desktop: tk.gold, Mobile: tk.blue, Tablet: tk.green };
  const brwColorMap = { Chrome: tk.blue, Safari: tk.gold, Firefox: tk.red, Edge: tk.purple, Other: tk.textMuted };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
      <Card title="Devices" subtitle={`${data.total ?? 0} sessions analyzed`} tk={tk}>
        <DonutChart data={data.devices || []} colorMap={devColorMap} tk={tk} />
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Desktop', icon: Monitor },
            { label: 'Mobile',  icon: Smartphone },
            { label: 'Tablet',  icon: Tablet },
          ].map(({ label, icon: Icon }) => {
            const d = (data.devices || []).find(d => d.device === label) || {};
            return (
              <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: tk.surface, borderRadius: 8 }}>
                <Icon style={{ width: 16, height: 16, color: devColorMap[label], margin: '0 auto 6px' }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: tk.text }}>{d.percent ?? 0}%</div>
                <div style={{ fontSize: 10, color: tk.textMuted }}>{label}</div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="Browsers" tk={tk}>
        <DonutChart data={data.browsers || []} colorMap={brwColorMap} tk={tk} />
      </Card>
    </div>
  );
};

const PagesTab = ({ data, loading, tk }) => {
  if (loading) return <Skeleton h={400} tk={tk} />;
  if (!data) return <EmptyState tk={tk} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        <Card title="Most Visited Pages" tk={tk}>
          <HBarChart data={data.mostVisited || []} labelKey="page" valueKey="views" color={tk.gold} tk={tk} />
        </Card>
        <Card title="Top Entry Pages" subtitle="First page visitors land on" tk={tk}>
          <HBarChart data={data.entryPages || []} labelKey="page" valueKey="entries" color={tk.blue} tk={tk} />
        </Card>
      </div>
      <Card title="Top Exit Pages" subtitle="Last page before leaving" tk={tk}>
        <HBarChart data={data.exitPages || []} labelKey="page" valueKey="exits" color={tk.red} tk={tk} />
      </Card>
    </div>
  );
};

const ConversionsTab = ({ data, loading, tk }) => {
  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      {Array(5).fill(0).map((_, i) => <Skeleton key={i} h={110} tk={tk} />)}
    </div>
  );
  if (!data) return <EmptyState tk={tk} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard title="WhatsApp Clicks"    value={data.whatsappClicks ?? 0}   icon={MousePointer} color={tk.green}  colorDim={tk.greenDim}  tk={tk} />
        <StatCard title="Contact Requests"   value={data.contactForms ?? 0}     icon={Target}       color={tk.blue}   colorDim={tk.blueDim}   tk={tk} />
        <StatCard title="Booking Requests"   value={data.bookingRequests ?? 0}  icon={ArrowUpRight} color={tk.gold}   colorDim={tk.goldDim}   tk={tk} />
        <StatCard title="CTA Clicks"         value={data.ctaClicks ?? 0}        icon={Zap}          color={tk.purple} colorDim={tk.purpleDim} tk={tk} />
        <StatCard title="Total Conversions"  value={data.total ?? 0}            icon={TrendingUp}   color={tk.gold}   colorDim={tk.goldDim}   tk={tk} />
      </div>
      {data.timeline?.length > 1 && (
        <Card title="Conversion Trend" tk={tk}>
          <SparkLine data={data.timeline} color={tk.green} height={80} />
        </Card>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Real-time', 'Geography', 'Sources', 'Devices', 'Pages', 'Conversions'];

export default function AdminAnalytics() {
  const { isRTL } = useLanguage();
  const tk = TK;

  const [tab, setTab]         = useState('Overview');
  const [range, setRange]     = useState('30d');
  const [loading, setLoading] = useState({});
  const [data, setData]       = useState({});
  const [error, setError]     = useState(null);

  const realtimeTimer = useRef(null);

  const fetchTab = useCallback(async (tabName, r = range) => {
    const endpointMap = {
      Overview:    `/analytics/visitors?range=${r}`,
      'Real-time': `/analytics/realtime`,
      Geography:   `/analytics/geography?range=${r}`,
      Sources:     `/analytics/sources?range=${r}`,
      Devices:     `/analytics/devices?range=${r}`,
      Pages:       `/analytics/pages/detail?range=${r}`,
      Conversions: `/analytics/conversions?range=${r}`,
    };
    const endpoint = endpointMap[tabName];
    if (!endpoint) return;

    setLoading(prev => ({ ...prev, [tabName]: true }));
    setError(null);

    try {
      const res = await api.get(endpoint);
      setData(prev => ({ ...prev, [tabName]: res.data }));
    } catch {
      setError(`Could not load ${tabName} data`);
    } finally {
      setLoading(prev => ({ ...prev, [tabName]: false }));
    }
  }, [range]);

  useEffect(() => {
    fetchTab(tab);
  }, [tab, range]);

  // Auto-refresh real-time tab every 30 seconds
  useEffect(() => {
    if (tab === 'Real-time') {
      realtimeTimer.current = setInterval(() => fetchTab('Real-time'), 30000);
    } else {
      clearInterval(realtimeTimer.current);
    }
    return () => clearInterval(realtimeTimer.current);
  }, [tab, fetchTab]);

  const handleRangeChange = (r) => {
    setRange(r);
    if (tab !== 'Real-time') fetchTab(tab, r);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: tk.bg,
        padding: '32px',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 300, color: tk.text, letterSpacing: '0.02em', margin: 0, marginBottom: 4 }}>
              Analytics
            </h1>
            <p style={{ fontSize: 12, color: tk.textMuted, margin: 0 }}>
              Traffic, engagement, and conversion data for your platform
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {['7d', '30d', '90d'].map(r => (
              <RangeBtn key={r} label={r} active={range === r && tab !== 'Real-time'} onClick={() => handleRangeChange(r)} tk={tk} />
            ))}
            <button
              onClick={() => fetchTab(tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 7,
                border: `1px solid ${tk.border}`,
                background: 'transparent', cursor: 'pointer',
                color: tk.textSub, fontSize: 11,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = tk.gold; e.currentTarget.style.color = tk.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textSub; }}
            >
              <RefreshCw style={{ width: 11, height: 11 }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Integration badges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'GA4 Active', color: tk.green },
            { label: 'Clarity Active', color: tk.blue },
            { label: 'Custom Analytics', color: tk.gold },
          ].map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 5, background: tk.surface, border: `1px solid ${tk.border}`, fontSize: 10, color: b.color }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: b.color }} />
              {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        padding: '4px', background: tk.surface,
        borderRadius: 10, border: `1px solid ${tk.border}`,
        overflowX: 'auto', flexWrap: 'nowrap',
      }}>
        {TABS.map(t => (
          <TabBtn key={t} label={t} active={tab === t} onClick={() => setTab(t)} tk={tk} />
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: tk.redDim, border: `1px solid ${tk.red}`, marginBottom: 16, color: tk.red, fontSize: 12 }}>
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Tab content */}
      {tab === 'Overview'    && <OverviewTab    data={data['Overview']}    loading={loading['Overview']}    tk={tk} />}
      {tab === 'Real-time'   && <RealtimeTab    data={data['Real-time']}   loading={loading['Real-time']}   tk={tk} onRefresh={() => fetchTab('Real-time')} />}
      {tab === 'Geography'   && <GeographyTab   data={data['Geography']}   loading={loading['Geography']}   tk={tk} />}
      {tab === 'Sources'     && <SourcesTab     data={data['Sources']}     loading={loading['Sources']}     tk={tk} />}
      {tab === 'Devices'     && <DevicesTab     data={data['Devices']}     loading={loading['Devices']}     tk={tk} />}
      {tab === 'Pages'       && <PagesTab       data={data['Pages']}       loading={loading['Pages']}       tk={tk} />}
      {tab === 'Conversions' && <ConversionsTab data={data['Conversions']} loading={loading['Conversions']} tk={tk} />}
    </div>
  );
}
