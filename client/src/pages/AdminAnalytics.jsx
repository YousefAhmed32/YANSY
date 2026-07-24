import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Eye, Clock, TrendingUp, TrendingDown, Globe, Monitor,
  Smartphone, Tablet, RefreshCw, BarChart3, MousePointer, ArrowUpRight,
  Wifi, Activity, Zap, Target, AlertCircle,
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, FONT, Card, SectionHead, StatCard, Badge, Button, Skeleton, EmptyState, Tabs, FilterPills, DataTable } from '../admin-ui';
import PageHeader from '../admin-ui/PageHeader';

// ── Inline SVG Charts ─────────────────────────────────────────────────────────

const SparkLine = ({ data = [], color = TK.accent, height = 40 }) => {
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

const noDataTitle = (language) => (language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet');

const HBarChart = ({ data = [], labelKey, valueKey, color = TK.accent, language }) => {
  if (!data.length) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.slice(0, 10).map((item, i) => {
        const pct = Math.round(((item[valueKey] || 0) / max) * 100);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '120px', fontSize: '11px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {item[labelKey] || '—'}
            </div>
            <div style={{ flex: 1, height: '6px', background: TK.bg, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ width: '40px', fontSize: '11px', color: TK.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {(item[valueKey] || 0).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DonutChart = ({ data = [], colorMap = {}, language }) => {
  if (!data.length) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;
  const total = data.reduce((s, d) => s + (d.count || 0), 0) || 1;
  const defaultColors = [TK.accent, TK.purple, TK.green, TK.red, TK.amber];
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
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={TK.border} strokeWidth="10" />
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
            <span style={{ fontSize: '11px', color: TK.textMuted, flex: 1 }}>{seg.device || seg.browser}</span>
            <span style={{ fontSize: '11px', color: TK.text, fontVariantNumeric: 'tabular-nums' }}>{seg.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Shared UI ─────────────────────────────────────────────────────────────────

/** Card + SectionHead wrapper that also supports an optional caption line (SectionHead has no native subtitle). */
const Panel = ({ icon, title, subtitle, action, children }) => (
  <Card>
    <SectionHead icon={icon} title={title} action={action} />
    {subtitle && <p style={{ fontSize: '11px', color: TK.textLight, margin: '-8px 0 14px' }}>{subtitle}</p>}
    {children}
  </Card>
);

// ── Tab panels ────────────────────────────────────────────────────────────────

const OverviewTab = ({ data, loading, language }) => {
  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {Array(8).fill(0).map((_, i) => <Skeleton key={i} height="130px" />)}
    </div>
  );
  if (!data) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;

  const fmtTime = (sec) => {
    const sLabel = language === 'ar' ? 'ث' : 's';
    const mLabel = language === 'ar' ? 'د' : 'm';
    if (!sec) return `0${sLabel}`;
    if (sec < 60) return `${sec}${sLabel}`;
    return `${Math.floor(sec / 60)}${mLabel} ${sec % 60}${sLabel}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label={language === 'ar' ? 'زوار اليوم' : 'Visitors Today'}                value={data.visitorsToday?.toLocaleString() ?? '—'}  icon={Users}       tone="info" />
        <StatCard label={language === 'ar' ? 'زوار هذا الأسبوع' : 'Visitors This Week'}       value={data.visitorsWeek?.toLocaleString() ?? '—'}   icon={Users}       tone="purple" />
        <StatCard label={language === 'ar' ? 'زوار هذا الشهر' : 'Visitors This Month'}        value={data.visitorsMonth?.toLocaleString() ?? '—'}  icon={TrendingUp}  tone="success" />
        <StatCard label={language === 'ar' ? 'مشاهدات الصفحة' : 'Page Views'}                 value={data.totalPageViews?.toLocaleString() ?? '—'} icon={Eye}         tone="info" />
        <StatCard label={language === 'ar' ? 'الجلسات الفريدة' : 'Unique Sessions'}           value={data.uniqueSessions?.toLocaleString() ?? '—'} icon={Zap}         tone="warning" />
        <StatCard label={language === 'ar' ? 'الزوار العائدون' : 'Returning Visitors'}        value={data.returningVisitors?.toLocaleString() ?? '—'} icon={RefreshCw} tone="purple" />
        <StatCard label={language === 'ar' ? 'متوسط مدة الجلسة' : 'Avg Session Duration'}     value={fmtTime(data.avgSessionDuration)}              icon={Clock}      tone="success" />
        <StatCard label={language === 'ar' ? 'معدل الارتداد' : 'Bounce Rate'}                 value={`${data.bounceRate ?? 0}%`}                    icon={TrendingDown} tone={data.bounceRate > 60 ? 'danger' : 'info'} />
      </div>
      {data.timeline?.length > 1 && (
        <Panel icon={TrendingUp} title={language === 'ar' ? 'اتجاه الزوار' : 'Visitor Trend'} subtitle={language === 'ar' ? 'مشاهدات الصفحة والجلسات عبر الزمن' : 'Page views and sessions over time'}>
          <SparkLine data={data.timeline} color={TK.accent} height={80} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: TK.textLight }}>{data.timeline[0]?._id}</span>
            <span style={{ fontSize: 10, color: TK.textLight }}>{data.timeline[data.timeline.length - 1]?._id}</span>
          </div>
        </Panel>
      )}
    </div>
  );
};

const RealtimeTab = ({ data, loading, language }) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  useEffect(() => {
    setLastUpdated(new Date());
  }, [data]);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      {Array(3).fill(0).map((_, i) => <Skeleton key={i} height="100px" />)}
    </div>
  );

  const activityRows = (data?.recentActivity || []).slice(0, 10).map((ev, i) => ({
    ...ev,
    _id: ev._id || `${ev.page || '/'}-${ev.createdAt}-${i}`,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: TK.green, display: 'inline-block', animation: 'au-pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: TK.textMuted }}>{language === 'ar' ? 'مباشر — يُحدَّث كل 30 ثانية' : 'Live — updates every 30s'}</span>
        </div>
        <span style={{ fontSize: 11, color: TK.textLight }}>{language === 'ar' ? 'آخر تحديث' : 'Last updated'} {lastUpdated.toLocaleTimeString(locale)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label={language === 'ar' ? 'الزوار النشطون الآن' : 'Active Visitors Now'}  value={data?.activeNow ?? 0}      icon={Wifi}     tone="success" sub={language === 'ar' ? 'جلسات نشطة خلال آخر 30 دقيقة' : 'Sessions active in last 30 min'} />
        <StatCard label={language === 'ar' ? 'جلسات جديدة (5 دقائق)' : 'New Sessions (5 min)'} value={data?.recentSessions ?? 0} icon={Activity} tone="info" />
        <StatCard label={language === 'ar' ? 'نشاط الصفحات المباشر' : 'Live Page Activity'}   value={data?.recentActivity?.length ?? 0} icon={Eye} tone="warning" sub={language === 'ar' ? 'مشاهدات الصفحة خلال آخر 5 دقائق' : 'Page views in last 5 min'} />
      </div>
      {activityRows.length > 0 && (
        <Panel icon={Eye} title={language === 'ar' ? 'نشاط الصفحات المباشر' : 'Live Page Activity'} subtitle={language === 'ar' ? 'أحدث مشاهدات الصفحة' : 'Most recent page views'}>
          <DataTable
            columns={[
              { key: 'page', label: language === 'ar' ? 'الصفحة' : 'Page', render: (row) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Globe style={{ width: 12, height: 12, color: TK.textLight, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.page || '/'}</span>
                </span>
              ) },
              { key: 'time', label: language === 'ar' ? 'الوقت' : 'Time', align: 'right', render: (row) => new Date(row.createdAt).toLocaleTimeString(locale) },
            ]}
            rows={activityRows}
            dense
          />
        </Panel>
      )}
    </div>
  );
};

const GeographyTab = ({ data, loading, language }) => {
  if (loading) return <Skeleton height="300px" />;
  if (!data) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
      <Panel icon={Globe} title={language === 'ar' ? 'أفضل الدول' : 'Top Countries'} subtitle={`${data.total ?? 0} ${language === 'ar' ? 'جلسة مُتتبعة' : 'tracked sessions'}`}>
        <HBarChart data={data.topCountries || []} labelKey="country" valueKey="count" color={TK.accent} language={language} />
      </Panel>
      <Panel icon={Globe} title={language === 'ar' ? 'أفضل المدن' : 'Top Cities'}>
        <HBarChart data={data.topCities || []} labelKey="city" valueKey="count" color={TK.purple} language={language} />
      </Panel>
    </div>
  );
};

const SourcesTab = ({ data, loading, language }) => {
  if (loading) return <Skeleton height="300px" />;
  if (!data?.length) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;
  const colorMap = { Direct: TK.accent, Google: TK.purple, Social: TK.green, Referral: TK.amber, Campaign: TK.red };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
      <Panel icon={Target} title={language === 'ar' ? 'مصادر الزيارات' : 'Traffic Sources'} subtitle={language === 'ar' ? 'من أين يأتي زوارك' : 'Where your visitors come from'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.map((src, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: TK.text }}>{src.source}</span>
                <span style={{ fontSize: 12, color: TK.textMuted }}>{src.count.toLocaleString()} <span style={{ color: TK.textLight }}>({src.percent}%)</span></span>
              </div>
              <div style={{ height: 6, background: TK.bg, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${src.percent}%`, height: '100%', background: colorMap[src.source] || TK.accent, borderRadius: 3, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel icon={BarChart3} title={language === 'ar' ? 'التوزيع' : 'Distribution'}>
        <DonutChart data={data} colorMap={colorMap} language={language} />
      </Panel>
    </div>
  );
};

const DevicesTab = ({ data, loading, language }) => {
  if (loading) return <Skeleton height="300px" />;
  if (!data) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;
  const devColorMap = { Desktop: TK.accent, Mobile: TK.purple, Tablet: TK.green };
  const brwColorMap = { Chrome: TK.purple, Safari: TK.accent, Firefox: TK.red, Edge: TK.amber, Other: TK.textLight };
  const devLabels = { Desktop: language === 'ar' ? 'سطح المكتب' : 'Desktop', Mobile: language === 'ar' ? 'جوال' : 'Mobile', Tablet: language === 'ar' ? 'لوحي' : 'Tablet' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
      <Panel icon={Monitor} title={language === 'ar' ? 'الأجهزة' : 'Devices'} subtitle={`${data.total ?? 0} ${language === 'ar' ? 'جلسة تم تحليلها' : 'sessions analyzed'}`}>
        <DonutChart data={data.devices || []} colorMap={devColorMap} language={language} />
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Desktop', icon: Monitor },
            { label: 'Mobile',  icon: Smartphone },
            { label: 'Tablet',  icon: Tablet },
          ].map(({ label, icon: Icon }) => {
            const d = (data.devices || []).find(d => d.device === label) || {};
            return (
              <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: TK.bg, borderRadius: 8 }}>
                <Icon style={{ width: 16, height: 16, color: devColorMap[label], margin: '0 auto 6px' }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: TK.text }}>{d.percent ?? 0}%</div>
                <div style={{ fontSize: 10, color: TK.textLight }}>{devLabels[label] || label}</div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel icon={Monitor} title={language === 'ar' ? 'المتصفحات' : 'Browsers'}>
        <DonutChart data={data.browsers || []} colorMap={brwColorMap} language={language} />
      </Panel>
    </div>
  );
};

const PagesTab = ({ data, loading, language }) => {
  if (loading) return <Skeleton height="400px" />;
  if (!data) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        <Panel icon={Eye} title={language === 'ar' ? 'أكثر الصفحات زيارة' : 'Most Visited Pages'}>
          <HBarChart data={data.mostVisited || []} labelKey="page" valueKey="views" color={TK.accent} language={language} />
        </Panel>
        <Panel icon={ArrowUpRight} title={language === 'ar' ? 'أفضل صفحات الدخول' : 'Top Entry Pages'} subtitle={language === 'ar' ? 'أول صفحة يصل إليها الزوار' : 'First page visitors land on'}>
          <HBarChart data={data.entryPages || []} labelKey="page" valueKey="entries" color={TK.purple} language={language} />
        </Panel>
      </div>
      <Panel icon={ArrowUpRight} title={language === 'ar' ? 'أفضل صفحات الخروج' : 'Top Exit Pages'} subtitle={language === 'ar' ? 'آخر صفحة قبل المغادرة' : 'Last page before leaving'}>
        <HBarChart data={data.exitPages || []} labelKey="page" valueKey="exits" color={TK.red} language={language} />
      </Panel>
    </div>
  );
};

const ConversionsTab = ({ data, loading, language }) => {
  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      {Array(5).fill(0).map((_, i) => <Skeleton key={i} height="110px" />)}
    </div>
  );
  if (!data) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label={language === 'ar' ? 'نقرات واتساب' : 'WhatsApp Clicks'}   value={data.whatsappClicks ?? 0}  icon={MousePointer} tone="success" />
        <StatCard label={language === 'ar' ? 'طلبات التواصل' : 'Contact Requests'}  value={data.contactForms ?? 0}    icon={Target}       tone="info" />
        <StatCard label={language === 'ar' ? 'طلبات الحجز' : 'Booking Requests'} value={data.bookingRequests ?? 0} icon={ArrowUpRight} tone="warning" />
        <StatCard label={language === 'ar' ? 'نقرات دعوة الإجراء' : 'CTA Clicks'}        value={data.ctaClicks ?? 0}       icon={Zap}          tone="purple" />
        <StatCard label={language === 'ar' ? 'إجمالي التحويلات' : 'Total Conversions'} value={data.total ?? 0}           icon={TrendingUp}   tone="info" />
      </div>
      {data.timeline?.length > 1 && (
        <Panel icon={TrendingUp} title={language === 'ar' ? 'اتجاه التحويلات' : 'Conversion Trend'}>
          <SparkLine data={data.timeline} color={TK.green} height={80} />
        </Panel>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Real-time', 'Geography', 'Sources', 'Devices', 'Pages', 'Conversions'];
const TAB_LABELS = {
  'Overview':    { en: 'Overview',    ar: 'نظرة عامة' },
  'Real-time':   { en: 'Real-time',   ar: 'الوقت الحقيقي' },
  'Geography':   { en: 'Geography',   ar: 'الجغرافيا' },
  'Sources':     { en: 'Sources',     ar: 'المصادر' },
  'Devices':     { en: 'Devices',     ar: 'الأجهزة' },
  'Pages':       { en: 'Pages',       ar: 'الصفحات' },
  'Conversions': { en: 'Conversions', ar: 'التحويلات' },
};
const RANGES = [
  { value: '7d',  en: '7d',  ar: '7 أيام' },
  { value: '30d', en: '30d', ar: '30 يوم' },
  { value: '90d', en: '90d', ar: '90 يوم' },
];

export default function AdminAnalytics() {
  const { language, isRTL } = useLanguage();
  const font = FONT(isRTL);

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
      const label = TAB_LABELS[tabName] ? (language === 'ar' ? TAB_LABELS[tabName].ar : TAB_LABELS[tabName].en) : tabName;
      setError(language === 'ar' ? `تعذر تحميل بيانات ${label}` : `Could not load ${label} data`);
    } finally {
      setLoading(prev => ({ ...prev, [tabName]: false }));
    }
  }, [range, language]);

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
        background: TK.bg,
        fontFamily: font,
        padding: 'clamp(20px,3vw,32px) clamp(16px,3vw,32px) 60px',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <style>{`
        @keyframes au-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <PageHeader
        icon={BarChart3}
        eyebrow={language === 'ar' ? 'لوحة التحكم' : 'Admin Control'}
        title={language === 'ar' ? 'التحليلات' : 'Analytics'}
        subtitle={language === 'ar' ? 'بيانات الزيارات والتفاعل والتحويلات لمنصتك' : 'Traffic, engagement, and conversion data for your platform'}
        actions={<Button variant="secondary" icon={RefreshCw} onClick={() => fetchTab(tab)}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>}
      />

      {/* Integration badges */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Badge tone="success" dot>{language === 'ar' ? 'GA4 نشط' : 'GA4 Active'}</Badge>
        <Badge tone="info" dot>{language === 'ar' ? 'Clarity نشط' : 'Clarity Active'}</Badge>
        <Badge tone="purple" dot>{language === 'ar' ? 'تحليلات مخصصة' : 'Custom Analytics'}</Badge>
      </div>

      {/* Tab bar + range switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <Tabs value={tab} onChange={setTab} items={TABS.map(t => ({ value: t, label: language === 'ar' ? TAB_LABELS[t].ar : TAB_LABELS[t].en }))} />
        <FilterPills value={tab === 'Real-time' ? null : range} onChange={handleRangeChange} options={RANGES.map(r => ({ value: r.value, label: language === 'ar' ? r.ar : r.en }))} />
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: TK.redBg, border: `1px solid ${TK.redBd}`, marginBottom: 16, color: TK.red, fontSize: 12 }}>
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Tab content */}
      {tab === 'Overview'    && <OverviewTab    data={data['Overview']}    loading={loading['Overview']}    language={language} />}
      {tab === 'Real-time'   && <RealtimeTab    data={data['Real-time']}   loading={loading['Real-time']}   language={language} />}
      {tab === 'Geography'   && <GeographyTab   data={data['Geography']}   loading={loading['Geography']}   language={language} />}
      {tab === 'Sources'     && <SourcesTab     data={data['Sources']}     loading={loading['Sources']}     language={language} />}
      {tab === 'Devices'     && <DevicesTab     data={data['Devices']}     loading={loading['Devices']}     language={language} />}
      {tab === 'Pages'       && <PagesTab       data={data['Pages']}       loading={loading['Pages']}       language={language} />}
      {tab === 'Conversions' && <ConversionsTab data={data['Conversions']} loading={loading['Conversions']} language={language} />}
    </div>
  );
}
