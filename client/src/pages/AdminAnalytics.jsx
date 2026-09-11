import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Eye, Clock, TrendingUp, TrendingDown, Globe, Monitor,
  Smartphone, Tablet, RefreshCw, BarChart3, MousePointer, ArrowUpRight,
  Wifi, Activity, Zap, Target, AlertCircle, Calendar, ShieldCheck,
  UserCheck, UserX, ExternalLink, Search, CheckCircle2, MessageSquare,
  ArrowDown, MapPin, Laptop, ChevronLeft, ChevronRight, X, PlayCircle,
  Flame, Download, Copy, Check, Grid, Layers, Split, Filter
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, FONT, Card, SectionHead, StatCard, Badge, Button,
  Skeleton, EmptyState, Tabs, FilterPills, DataTable, Drawer,
  TextInput, Pagination, Spinner
} from '../admin-ui';
import PageHeader from '../admin-ui/PageHeader';

// ── Inline SVG Charts ─────────────────────────────────────────────────────────

const SparkLine = ({ data = [], color = TK.accent, height = 48 }) => {
  if (!data.length) return null;
  const vals = data.map(d => d.views || d.sessions || d.conversions || d.events || 0);
  const max = Math.max(...vals, 1);
  const w = 240;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1 || 1)) * w;
    const y = height - (v / max) * (height - 6);
    return `${x},${y}`;
  });
  const fill = pts.map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(' ');
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
      <path d={fill} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
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
            <div style={{ width: '130px', fontSize: '11px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {item[labelKey] || '—'}
            </div>
            <div style={{ flex: 1, height: '6px', background: TK.bg, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ width: '45px', fontSize: '11px', color: TK.text, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
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
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
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

// ── Hourly 24-Bar Distribution Chart ──────────────────────────────────────────

const HourlyDistributionChart = ({ hourlyData, language }) => {
  const hours = hourlyData?.hours || [];
  if (!hours.length) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;

  const maxVisits = Math.max(...hours.map(h => (h.views || 0) + (h.sessions || 0)), 1);
  const peak = hourlyData?.peakHour;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {peak && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: TK.accentBg, borderRadius: 8, border: `1px solid ${TK.accentBd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock style={{ width: 14, height: 14, color: TK.accent }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: TK.text }}>
              {language === 'ar' ? 'ساعة الذروة اليومية:' : 'Daily Peak Traffic Hour:'}
            </span>
            <Badge tone="accent">{language === 'ar' ? peak.labelAr : peak.label}</Badge>
          </div>
          <span style={{ fontSize: 12, color: TK.textMuted }}>
            {peak.sessions} {language === 'ar' ? 'جلسة' : 'sessions'} • {peak.views} {language === 'ar' ? 'مشاهدة' : 'views'}
          </span>
        </div>
      )}

      {/* 24-hour bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 3, alignItems: 'flex-end', height: 110, padding: '10px 0 4px', borderBottom: `1px solid ${TK.border}` }}>
        {hours.map((h, i) => {
          const val = (h.views || 0) + (h.sessions || 0);
          const heightPct = Math.max(8, Math.round((val / maxVisits) * 100));
          const isPeak = peak?.hour === h.hour;
          const label = language === 'ar' ? h.labelAr : h.label;

          return (
            <div
              key={i}
              title={`${label}\n${language === 'ar' ? 'الجلسات:' : 'Sessions:'} ${h.sessions}\n${language === 'ar' ? 'المشاهدات:' : 'Views:'} ${h.views}\n${language === 'ar' ? 'التحويلات:' : 'Conversions:'} ${h.conversions}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  background: isPeak ? TK.accent : val > 0 ? TK.purple : TK.bgSubtle,
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.4s ease, background 0.2s',
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: TK.textLight, marginTop: -6 }}>
        <span>12:00 AM</span>
        <span>06:00 AM</span>
        <span>12:00 PM</span>
        <span>06:00 PM</span>
        <span>11:00 PM</span>
      </div>
    </div>
  );
};

// ── Shared UI Panel ───────────────────────────────────────────────────────────

const Panel = ({ icon, title, subtitle, action, children }) => (
  <Card>
    <SectionHead icon={icon} title={title} action={action} />
    {subtitle && <p style={{ fontSize: '11px', color: TK.textLight, margin: '-8px 0 14px' }}>{subtitle}</p>}
    {children}
  </Card>
);

// ── Helper: Format Duration ───────────────────────────────────────────────────

const fmtDuration = (sec, language) => {
  const sLabel = language === 'ar' ? 'ث' : 's';
  const mLabel = language === 'ar' ? 'د' : 'm';
  const hLabel = language === 'ar' ? 'س' : 'h';
  if (!sec || sec <= 0) return `0${sLabel}`;
  if (sec < 60) return `${sec}${sLabel}`;
  if (sec < 3600) return `${Math.floor(sec / 60)}${mLabel} ${sec % 60}${sLabel}`;
  return `${Math.floor(sec / 3600)}${hLabel} ${Math.floor((sec % 3600) / 60)}${mLabel}`;
};

// ── Tab 1: Overview ───────────────────────────────────────────────────────────

const OverviewTab = ({ data, hourlyData, loading, language }) => {
  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {Array(8).fill(0).map((_, i) => <Skeleton key={i} height="130px" />)}
    </div>
  );
  if (!data) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label={language === 'ar' ? 'زوار اليوم' : 'Visitors Today'}            value={data.visitorsToday?.toLocaleString() ?? '—'}  icon={Users}       tone="info" />
        <StatCard label={language === 'ar' ? 'زوار هذا الأسبوع' : 'Visitors This Week'}   value={data.visitorsWeek?.toLocaleString() ?? '—'}   icon={Users}       tone="purple" />
        <StatCard label={language === 'ar' ? 'زوار هذا الشهر' : 'Visitors This Month'}    value={data.visitorsMonth?.toLocaleString() ?? '—'}  icon={TrendingUp}  tone="success" />
        <StatCard label={language === 'ar' ? 'مشاهدات الصفحة' : 'Page Views'}             value={data.totalPageViews?.toLocaleString() ?? '—'} icon={Eye}         tone="info" />
        <StatCard label={language === 'ar' ? 'الجلسات الفريدة' : 'Unique Sessions'}       value={data.uniqueSessions?.toLocaleString() ?? '—'} icon={Zap}         tone="warning" />
        <StatCard label={language === 'ar' ? 'الزوار العائدون' : 'Returning Visitors'}    value={data.returningVisitors?.toLocaleString() ?? '—'} icon={RefreshCw} tone="purple" />
        <StatCard label={language === 'ar' ? 'متوسط مدة الجلسة' : 'Avg Duration'}        value={fmtDuration(data.avgSessionDuration, language)} icon={Clock}      tone="success" />
        <StatCard label={language === 'ar' ? 'معدل الارتداد' : 'Bounce Rate'}             value={`${data.bounceRate ?? 0}%`}                icon={TrendingDown} tone={data.bounceRate > 60 ? 'danger' : 'info'} />
      </div>

      {/* Hourly distribution panel */}
      <Panel
        icon={Clock}
        title={language === 'ar' ? 'توزيع الزيارات وأوقات الذروة بالساعة (24 ساعة)' : 'Hourly Traffic & Peak Times (24 Hours)'}
        subtitle={language === 'ar' ? 'توضح بدقة ساعات النشاط العالية وتفاعل الزوار على مدار اليوم' : 'Breakdown of visitor activity and peak times throughout the day'}
      >
        <HourlyDistributionChart hourlyData={hourlyData} language={language} />
      </Panel>

      {/* Timeline sparkline */}
      {data.timeline?.length > 1 && (
        <Panel
          icon={TrendingUp}
          title={data.isHourly ? (language === 'ar' ? 'الاتجاه الزمني بالساعة' : 'Hourly Visitor Trend') : (language === 'ar' ? 'الاتجاه الزمني للزيارات' : 'Daily Visitor Trend')}
          subtitle={language === 'ar' ? 'حجم المشاهدات والجلسات عبر الفترة المختارة' : 'Page views and sessions across selected timeframe'}
        >
          <SparkLine data={data.timeline} color={TK.accent} height={90} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: TK.textLight }}>{data.timeline[0]?._id}</span>
            <span style={{ fontSize: 11, color: TK.textLight }}>{data.timeline[data.timeline.length - 1]?._id}</span>
          </div>
        </Panel>
      )}
    </div>
  );
};

// ── Tab 2: Visitor Journeys & Sessions Explorer ───────────────────────────────

const JourneysTab = ({ language, isRTL, range, visitorFilter, startDate, endDate }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [search, setSearch] = useState('');
  const [convOnly, setConvOnly] = useState(false);
  const [intentFilter, setIntentFilter] = useState('all');
  const [copiedSessionId, setCopiedSessionId] = useState(null);

  // Drawer state
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [journeyData, setJourneyData] = useState(null);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      let q = `/analytics/sessions?range=${range}&visitorFilter=${visitorFilter}&page=${page}&limit=12`;
      if (startDate && endDate) q += `&startDate=${startDate}&endDate=${endDate}`;
      if (convOnly) q += '&hasConversion=true';
      if (intentFilter !== 'all') q += `&intentLevel=${intentFilter}`;
      if (search.trim()) q += `&search=${encodeURIComponent(search.trim())}`;

      const res = await api.get(q);
      setSessions(res.data.sessions || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalSessions(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [range, visitorFilter, startDate, endDate, page, convOnly, intentFilter, search]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openJourney = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setDrawerOpen(true);
    setJourneyLoading(true);
    try {
      const res = await api.get(`/analytics/sessions/${sessionId}/journey`);
      setJourneyData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setJourneyLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!sessions.length) return;
    const headers = [
      'SessionId', 'VisitorName', 'Email', 'VisitorType', 'IntentLevel',
      'Country', 'City', 'Device', 'OS', 'Browser', 'ScreenResolution',
      'Language', 'DurationSec', 'PagesCount', 'HasConversion',
      'Conversions', 'UTM_Campaign', 'UTM_Source', 'StartTime'
    ];
    const rows = sessions.map((s) => [
      `"${s.sessionId || ''}"`,
      `"${s.userName || ''}"`,
      `"${s.userEmail || ''}"`,
      `"${s.visitorType || 'guest'}"`,
      `"${s.intentLevel || 'low'}"`,
      `"${s.country || ''}"`,
      `"${s.city || ''}"`,
      `"${s.device || 'Desktop'}"`,
      `"${s.os || ''}"`,
      `"${s.browser || ''}"`,
      `"${s.screenResolution || ''}"`,
      `"${s.language || ''}"`,
      s.durationSec || 0,
      s.viewsCount || 0,
      s.hasConversion ? 'YES' : 'NO',
      `"${(s.conversions || []).join(';')}"`,
      `"${s.utm?.campaign || ''}"`,
      `"${s.utm?.source || ''}"`,
      `"${new Date(s.startTime).toISOString()}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `yansy_sessions_${range}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyDossier = (session, journey) => {
    if (!session) return;
    const lines = [
      '═════════════════════════════════════',
      '  تقرير رحلة العميل — YANSY Tech',
      '═════════════════════════════════════',
      `• الهوية: ${session.userName || (session.isAdmin ? 'إداري النظام' : 'زائر المنصة')}`,
      session.userEmail ? `• البريد: ${session.userEmail}` : null,
      `• نوع الزائر: ${session.visitorType || 'guest'}`,
      `• الموقع: ${session.city || 'غير محدد'}, ${session.country || 'غير محدد'}`,
      `• الجهاز والمواصفات: ${session.device || 'Desktop'} (${session.os || 'OS'}, ${session.browser || 'Browser'})`,
      session.screenResolution ? `• دقة الشاشة: ${session.screenResolution}` : null,
      session.language ? `• لغة المتصفح: ${session.language}` : null,
      session.visitCount ? `• عدد الزيارات: ${session.visitCount}` : null,
      session.utm?.campaign ? `• الحملة الإعلانية: ${session.utm.campaign} (مصدر: ${session.utm.source || 'utm'})` : null,
      `• إجمالي مدة الجلسة: ${fmtDuration(session.durationSec, language)}`,
      `• مستوى الاهتمام: ${session.intentLevel === 'high' ? '🔥 عالي (نية تعاقد)' : session.intentLevel === 'medium' ? '💡 متوسط (استكشاف)' : 'تصفح عادي'}`,
      `• تحويل فعلي؟: ${session.hasConversion ? 'نعم 🎯 (' + (session.conversions || []).join(', ') + ')' : 'لا'}`,
      `• تسجيل Clarity: https://clarity.microsoft.com/projects/view/x58kfxz02f/recordings`,
      '',
      `التسلسل الزمني للإجراءات (${journey?.length || 0} خطوة):`,
      ...(journey || []).map((j) => `  ${j.index}. [${fmtDuration(j.elapsedSec, language)}] ${language === 'ar' ? j.titleAr : j.titleEn} (${j.page})`),
      '═════════════════════════════════════',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedSessionId(session.sessionId);
    setTimeout(() => setCopiedSessionId(null), 3000);
  };

  const getVisitorBadge = (row) => {
    if (row.isAdmin || row.visitorType === 'admin') {
      return (
        <Badge tone="purple" dot>
          👑 {language === 'ar' ? 'إداري' : 'Admin'}{row.userName ? `: ${row.userName}` : ''}
        </Badge>
      );
    }
    if (row.visitorType === 'client' || row.userId) {
      return (
        <Badge tone="info" dot>
          💼 {language === 'ar' ? 'عميل مسجل' : 'Client'}{row.userName ? `: ${row.userName}` : ''}
        </Badge>
      );
    }
    return (
      <Badge tone="neutral">
        👤 {language === 'ar' ? 'زائر' : 'Guest'}
        {row.city || row.country ? ` (${row.city || ''}${row.city && row.country ? ', ' : ''}${row.country || ''})` : ''}
      </Badge>
    );
  };

  const getIntentBadge = (intent) => {
    if (intent === 'high') {
      return <Badge tone="danger">🔥 {language === 'ar' ? 'نية عالية' : 'High Intent'}</Badge>;
    }
    if (intent === 'medium') {
      return <Badge tone="warning">💡 {language === 'ar' ? 'استكشاف' : 'Engaged'}</Badge>;
    }
    return <Badge tone="neutral">👀 {language === 'ar' ? 'تصفح' : 'Casual'}</Badge>;
  };

  const getDeviceIcon = (dev) => {
    if (dev === 'Mobile') return <Smartphone style={{ width: 14, height: 14, color: TK.purple }} />;
    if (dev === 'Tablet') return <Tablet style={{ width: 14, height: 14, color: TK.green }} />;
    return <Monitor style={{ width: 14, height: 14, color: TK.accent }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Search, Intent & Conversion Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <TextInput
            icon={Search}
            placeholder={language === 'ar' ? 'بحث بالاسم، الإيميل، الـ IP، المدينة، أو صفحة الدخول...' : 'Search by name, email, IP, city, or entry page...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Intent level pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted }}>
            {language === 'ar' ? 'مستوى الاهتمام:' : 'Intent:'}
          </span>
          {[
            { val: 'all',    ar: 'الكل',          en: 'All' },
            { val: 'high',   ar: '🔥 نية عالية',   en: '🔥 High' },
            { val: 'medium', ar: '💡 استكشاف',    en: '💡 Medium' },
            { val: 'low',    ar: '👀 تصفح',       en: '👀 Low' },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => { setIntentFilter(item.val); setPage(1); }}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: intentFilter === item.val ? 600 : 400,
                border: `1px solid ${intentFilter === item.val ? TK.accent : TK.border}`,
                background: intentFilter === item.val ? TK.accentBg : TK.surface,
                color: intentFilter === item.val ? TK.accent : TK.textMuted,
                cursor: 'pointer',
              }}
            >
              {language === 'ar' ? item.ar : item.en}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant={convOnly ? 'primary' : 'secondary'}
            size="sm"
            icon={Target}
            onClick={() => { setConvOnly(!convOnly); setPage(1); }}
          >
            {language === 'ar' ? 'تحويلات فقط 🎯' : 'Conversions Only 🎯'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            title={language === 'ar' ? 'تصدير البيانات بصيغة CSV' : 'Export data to CSV'}
          >
            {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
          </Button>

          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchSessions}>
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Sessions Table */}
      <Panel
        icon={Users}
        title={language === 'ar' ? 'سجل جلسات الزوار والعملاء' : 'Visitor & Client Sessions Log'}
        subtitle={`${totalSessions} ${language === 'ar' ? 'جلسة مطابقة في الفترة المحددة' : 'matching sessions in selected period'}`}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} height="48px" />)}
          </div>
        ) : !sessions.length ? (
          <EmptyState icon={Users} title={noDataTitle(language)} subtitle={language === 'ar' ? 'لا توجد جلسات مطابقة للفلاتر الحالية' : 'No matching sessions found'} />
        ) : (
          <DataTable
            columns={[
              {
                key: 'visitor',
                label: language === 'ar' ? 'الزائر والهوية' : 'Visitor & Identity',
                render: (row) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div>{getVisitorBadge(row)}</div>
                    {row.userEmail && <span style={{ fontSize: 10, color: TK.textLight }}>{row.userEmail}</span>}
                  </div>
                ),
              },
              {
                key: 'intent',
                label: language === 'ar' ? 'الاهتمام' : 'Intent',
                render: (row) => getIntentBadge(row.intentLevel),
              },
              {
                key: 'tech',
                label: language === 'ar' ? 'الجهاز' : 'Device & OS',
                render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    {getDeviceIcon(row.device)}
                    <span>{row.device || 'Desktop'}</span>
                    <span style={{ color: TK.textLight }}>• {row.browser || 'Browser'}</span>
                  </div>
                ),
              },
              {
                key: 'entry',
                label: language === 'ar' ? 'صفحة الدخول' : 'Entry Page',
                render: (row) => (
                  <span style={{ fontSize: 11, color: TK.text, display: 'inline-block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.entryPage || '/'}
                  </span>
                ),
              },
              {
                key: 'duration',
                label: language === 'ar' ? 'المدة والتفاعل' : 'Duration & Pages',
                render: (row) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: TK.text }}>{fmtDuration(row.durationSec, language)}</span>
                    <span style={{ fontSize: 10, color: TK.textLight }}>{row.viewsCount} {language === 'ar' ? 'صفحات' : 'views'}</span>
                  </div>
                ),
              },
              {
                key: 'conversion',
                label: language === 'ar' ? 'التحويل' : 'Conversion',
                render: (row) => (
                  row.hasConversion ? (
                    <Badge tone="success" dot>{language === 'ar' ? 'تحويل 🎯' : 'Converted 🎯'}</Badge>
                  ) : (
                    <span style={{ fontSize: 11, color: TK.textLight }}>—</span>
                  )
                ),
              },
              {
                key: 'time',
                label: language === 'ar' ? 'التوقيت' : 'Time',
                render: (row) => (
                  <span style={{ fontSize: 11, color: TK.textMuted }}>
                    {new Date(row.startTime).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ),
              },
              {
                key: 'action',
                label: '',
                align: 'right',
                render: (row) => (
                  <Button size="sm" variant="secondary" onClick={() => openJourney(row.sessionId)}>
                    {language === 'ar' ? 'تفاصيل الرحلة' : 'Inspect Journey'}
                  </Button>
                ),
              },
            ]}
            rows={sessions.map((s) => ({ ...s, _id: s.sessionId }))}
          />
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} isRTL={isRTL} />
          </div>
        )}
      </Panel>

      {/* Visitor Journey Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={language === 'ar' ? 'رحلة الزائر بالتفصيل خطوة بخطوة' : 'Visitor Journey Dossier'}
        width="560px"
        side={isRTL ? 'left' : 'right'}
      >
        {journeyLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner /></div>
        ) : !journeyData ? (
          <EmptyState icon={Users} title={noDataTitle(language)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Dossier Header Info */}
            <div style={{ background: TK.bg, padding: 16, borderRadius: 12, border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TK.text }}>
                    {journeyData.session.userName || (journeyData.session.isAdmin ? (language === 'ar' ? 'إداري النظام' : 'System Admin') : (language === 'ar' ? 'زائر المنصة' : 'Platform Visitor'))}
                  </div>
                  {getIntentBadge(journeyData.session.intentLevel)}
                </div>
                {getVisitorBadge(journeyData.session)}
              </div>

              {/* Dossier Technical & Behavioral Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, color: TK.textMuted }}>
                <div>📍 {journeyData.session.city || '—'}, {journeyData.session.country || '—'}</div>
                <div>💻 {journeyData.session.device || 'Desktop'} ({journeyData.session.os || 'OS'}, {journeyData.session.browser || 'Browser'})</div>
                <div>⏱️ {fmtDuration(journeyData.session.durationSec, language)} {language === 'ar' ? 'مدة الجلسة' : 'session duration'}</div>
                <div>🔢 {journeyData.totalEvents} {language === 'ar' ? 'أحداث مُسجلة' : 'tracked events'}</div>
                <div>🖥️ {journeyData.session.screenResolution || 'دقة غير محددة'}</div>
                <div>🌐 {journeyData.session.language || 'لغة المتصفح: —'}</div>
                <div>🔁 {journeyData.session.visitCount > 1 ? (language === 'ar' ? `الزيارة رقم ${journeyData.session.visitCount} (عميل متكرر 🔥)` : `Visit #${journeyData.session.visitCount} (Returning)`) : (language === 'ar' ? 'الزيارة الأولى' : 'First Visit')}</div>
                <div>🎯 {journeyData.session.hasConversion ? (language === 'ar' ? 'أتم تحويلاً ناجحاً 🎯' : 'Converted Lead 🎯') : (language === 'ar' ? 'لم يقم بتحويل بعد' : 'No conversion yet')}</div>
              </div>

              {/* UTM Campaign Badge if present */}
              {journeyData.session.utm?.campaign && (
                <div style={{ padding: '6px 10px', background: TK.surface, borderRadius: 6, border: `1px solid ${TK.border}`, fontSize: 11, color: TK.purple, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target style={{ width: 13, height: 13 }} />
                  <span>{language === 'ar' ? 'الحملة الإعلانية:' : 'Ad Campaign:'} <strong>{journeyData.session.utm.campaign}</strong> ({journeyData.session.utm.source || 'source'})</span>
                </div>
              )}

              {/* Actions row: Copy dossier & Clarity link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={copiedSessionId === journeyData.session.sessionId ? Check : Copy}
                  onClick={() => copyDossier(journeyData.session, journeyData.journey)}
                  style={{ flex: 1 }}
                >
                  {copiedSessionId === journeyData.session.sessionId
                    ? (language === 'ar' ? 'تم نسخ التقرير! ✓' : 'Dossier Copied! ✓')
                    : (language === 'ar' ? 'نسخ ملخص تقرير العميل 📋' : 'Copy Client Dossier 📋')}
                </Button>

                <a
                  href="https://clarity.microsoft.com/projects/view/x58kfxz02f/recordings"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    background: TK.ink,
                    color: TK.inkFg,
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 500,
                    textDecoration: 'none',
                    flex: 1,
                  }}
                >
                  <PlayCircle style={{ width: 14, height: 14 }} />
                  <span>{language === 'ar' ? 'تسجيل Clarity 📹' : 'Clarity Replay 📹'}</span>
                  <ExternalLink style={{ width: 11, height: 11 }} />
                </a>
              </div>
            </div>

            {/* Step-by-Step Chronological Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: TK.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {language === 'ar' ? 'التسلسل الزمني الدقيق للرحلة:' : 'Chronological Timeline:'}
              </div>

              {journeyData.journey?.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                  {/* Timeline vertical bar */}
                  {idx < journeyData.journey.length - 1 && (
                    <div style={{ position: 'absolute', top: 22, bottom: -12, insetInlineStart: 12, width: 2, background: TK.border }} />
                  )}

                  {/* Bullet */}
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: step.badge === 'success' ? TK.greenBg : step.badge === 'purple' ? TK.purpleBg : TK.accentBg,
                    border: `1.5px solid ${step.badge === 'success' ? TK.green : step.badge === 'purple' ? TK.purple : TK.accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 1,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: step.badge === 'success' ? TK.green : step.badge === 'purple' ? TK.purple : TK.accent }}>
                      {step.index}
                    </span>
                  </div>

                  {/* Card item */}
                  <div style={{ flex: 1, background: TK.surface, padding: '10px 14px', borderRadius: 8, border: `1px solid ${TK.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: TK.text }}>
                        {language === 'ar' ? step.titleAr : step.titleEn}
                      </span>
                      <span style={{ fontSize: 10, color: TK.textLight, fontVariantNumeric: 'tabular-nums' }}>
                        +{fmtDuration(step.elapsedSec, language)}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: TK.textMuted }}>
                      {step.page && <span style={{ fontFamily: 'monospace', background: TK.bg, padding: '2px 6px', borderRadius: 4 }}>{step.page}</span>}
                    </div>

                    {step.scrollDepth > 0 && (
                      <div style={{ fontSize: 10, color: TK.textLight, marginTop: 4 }}>
                        {language === 'ar' ? 'نسبة التمرير:' : 'Scroll Depth:'} {step.scrollDepth}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

// ── Tab 3: Real-time ──────────────────────────────────────────────────────────

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

  const activityRows = (data?.recentActivity || []).slice(0, 15).map((ev, i) => ({
    ...ev,
    _id: ev._id || `${ev.page || '/'}-${ev.createdAt}-${i}`,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: TK.green, display: 'inline-block', animation: 'au-pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: TK.textMuted }}>{language === 'ar' ? 'مباشر — يتحدث كل 15 ثانية' : 'Live — updates every 15s'}</span>
        </div>
        <span style={{ fontSize: 11, color: TK.textLight }}>{language === 'ar' ? 'آخر تحديث' : 'Last updated'} {lastUpdated.toLocaleTimeString(locale)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label={language === 'ar' ? 'الزوار النشطون الآن' : 'Active Visitors Now'}  value={data?.activeNow ?? 0}      icon={Wifi}     tone="success" sub={language === 'ar' ? 'جلسات نشطة خلال آخر 30 دقيقة' : 'Sessions active in last 30 min'} />
        <StatCard label={language === 'ar' ? 'جلسات جديدة (5 دقائق)' : 'New Sessions (5 min)'} value={data?.recentSessions ?? 0} icon={Activity} tone="info" />
        <StatCard label={language === 'ar' ? 'نشاط الصفحات المباشر' : 'Live Page Activity'}   value={data?.recentActivity?.length ?? 0} icon={Eye} tone="warning" sub={language === 'ar' ? 'أحداث خلال آخر 5 دقائق' : 'Events in last 5 min'} />
      </div>

      {activityRows.length > 0 && (
        <Panel icon={Eye} title={language === 'ar' ? 'نشاط الصفحات والأحداث المباشر' : 'Live Page & Event Stream'} subtitle={language === 'ar' ? 'أحدث تفاعلات الزوار لحظة بلحظة' : 'Most recent visitor interactions in real-time'}>
          <DataTable
            columns={[
              {
                key: 'visitor',
                label: language === 'ar' ? 'الزائر' : 'Visitor',
                render: (row) => (
                  <span style={{ fontSize: 11 }}>
                    {row.isAdmin ? '👑 إداري' : row.visitorType === 'client' ? '💼 عميل' : '👤 زائر'}
                    {row.city ? ` (${row.city})` : ''}
                  </span>
                ),
              },
              {
                key: 'page',
                label: language === 'ar' ? 'الصفحة / الحدث' : 'Page / Event',
                render: (row) => (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <Globe style={{ width: 12, height: 12, color: TK.textLight, flexShrink: 0 }} />
                    <span>{row.title || row.page || '/'}</span>
                  </span>
                ),
              },
              {
                key: 'time',
                label: language === 'ar' ? 'الوقت' : 'Time',
                align: 'right',
                render: (row) => new Date(row.createdAt).toLocaleTimeString(locale),
              },
            ]}
            rows={activityRows}
            dense
          />
        </Panel>
      )}
    </div>
  );
};

// ── Other Tabs: Geography, Sources, Devices, Pages, Conversions ───────────────

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
            const d = (data.devices || []).find(it => it.device === label) || {};
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
        <StatCard label={language === 'ar' ? 'طلبات الحجز' : 'Booking Requests'}   value={data.bookingRequests ?? 0} icon={ArrowUpRight} tone="warning" />
        <StatCard label={language === 'ar' ? 'نقرات دعوة الإجراء' : 'CTA Clicks'}  value={data.ctaClicks ?? 0}       icon={Zap}          tone="purple" />
        <StatCard label={language === 'ar' ? 'إجمالي التحويلات' : 'Total Conversions'} value={data.total ?? 0}      icon={TrendingUp}   tone="info" />
      </div>
      {data.timeline?.length > 1 && (
        <Panel icon={TrendingUp} title={language === 'ar' ? 'اتجاه التحويلات' : 'Conversion Trend'}>
          <SparkLine data={data.timeline} color={TK.green} height={80} />
        </Panel>
      )}
    </div>
  );
};

// ── Tab: Funnel (مسار التحويل) ────────────────────────────────────────────────

const FunnelTab = ({ data, loading, language }) => {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array(4).fill(0).map((_, i) => <Skeleton key={i} height="110px" />)}
    </div>
  );
  if (!data?.steps?.length) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;

  const steps = data.steps;
  const breakdown = data.breakdown || {};
  const maxStepCount = Math.max(...steps.map((s) => s.count || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top funnel KPI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard
          label={language === 'ar' ? 'إجمالي زيارات الهبوط' : 'Total Top-of-Funnel'}
          value={data.totalSessions?.toLocaleString() ?? 0}
          icon={Users}
          tone="info"
        />
        <StatCard
          label={language === 'ar' ? 'العملاء المحولين فعلياً' : 'Total Converted Leads'}
          value={data.convertedSessions?.toLocaleString() ?? 0}
          icon={Target}
          tone="success"
        />
        <StatCard
          label={language === 'ar' ? 'معدل التحويل الكلي' : 'Overall Conversion Rate'}
          value={`${data.overallConversionRate ?? 0}%`}
          icon={TrendingUp}
          tone="purple"
          sub={language === 'ar' ? 'نسبة كل زائر تحول إلى عميل' : 'Sessions resulting in conversion'}
        />
      </div>

      {/* Visual 4-Step Funnel Bars */}
      <Panel
        icon={Split}
        title={language === 'ar' ? 'مسار التحويل الهرمي والفاقد بين المراحل (Drop-off Funnel)' : 'Step-by-Step Conversion Funnel'}
        subtitle={language === 'ar' ? 'تتبع بدقة أين يتوقف الزوار وأين يتحولون إلى عملاء محتملين' : 'Detailed stage progression and drop-off analysis'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {steps.map((step, idx) => {
            const widthPct = Math.max(14, Math.round(((step.count || 0) / maxStepCount) * 100));
            const stepColors = [TK.accent, TK.purple, TK.amber, TK.green];
            const color = stepColors[idx % stepColors.length];

            return (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: color,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TK.text }}>
                      {language === 'ar' ? step.labelAr : step.labelEn}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: TK.text, fontVariantNumeric: 'tabular-nums' }}>
                      {(step.count || 0).toLocaleString()} {language === 'ar' ? 'جلسة' : 'sessions'}
                    </span>
                    <Badge tone={idx === 3 ? 'success' : 'neutral'}>
                      {step.conversionRate}% {language === 'ar' ? 'من الإجمالي' : 'of total'}
                    </Badge>
                  </div>
                </div>

                {/* Funnel Bar */}
                <div style={{ height: 28, background: TK.bg, borderRadius: 8, overflow: 'hidden', padding: 3, border: `1px solid ${TK.border}` }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${widthPct}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      paddingInlineEnd: 10,
                      justifyContent: 'flex-end',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      transition: 'width 0.8s ease',
                    }}
                  >
                    {step.conversionRate}%
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: TK.textLight }}>
                  <span>{language === 'ar' ? step.descAr : step.descEn}</span>
                  {idx < steps.length - 1 && step.dropOffRate > 0 && (
                    <span style={{ color: TK.red, fontWeight: 500 }}>
                      ⚠️ {language === 'ar' ? `تسرب ${step.dropOffRate}% (${step.dropOffCount} زائر)` : `Drop-off ${step.dropOffRate}% (${step.dropOffCount} dropped)`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Conversion Breakdown Details */}
      <Panel
        icon={Target}
        title={language === 'ar' ? 'تفصيل إجراءات التحويل حسب النوع' : 'Conversion Actions Breakdown'}
        subtitle={language === 'ar' ? 'قنوات التواصل المباشرة الأكثر جذباً لعملائك' : 'Distribution of direct contact and booking leads'}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          <div style={{ background: TK.bg, padding: 14, borderRadius: 10, border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: TK.textMuted }}>🟢 {language === 'ar' ? 'محادثات واتساب' : 'WhatsApp Chats'}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: TK.green }}>{breakdown.whatsappClicks || 0}</span>
          </div>
          <div style={{ background: TK.bg, padding: 14, borderRadius: 10, border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: TK.textMuted }}>📬 {language === 'ar' ? 'نماذج استفسار المشاريع' : 'Project Form Inquiries'}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: TK.accent }}>{breakdown.contactForms || 0}</span>
          </div>
          <div style={{ background: TK.bg, padding: 14, borderRadius: 10, border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: TK.textMuted }}>📅 {language === 'ar' ? 'طلبات حجز الاستشارات' : 'Booking Requests'}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: TK.amber }}>{breakdown.bookingRequests || 0}</span>
          </div>
          <div style={{ background: TK.bg, padding: 14, borderRadius: 10, border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: TK.textMuted }}>⚡ {language === 'ar' ? 'نقرات دعوة الإجراء (CTA)' : 'CTA Button Clicks'}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: TK.purple }}>{breakdown.ctaClicks || 0}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
};

// ── Tab: Heatmap (الخريطة الحرارية 7x24) ──────────────────────────────────────

const HeatmapTab = ({ data, loading, language }) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (loading) return <Skeleton height="420px" />;
  if (!data?.matrix?.length) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;

  const matrix = data.matrix;
  const peak = data.peakSlot;
  const bestDay = data.bestDay;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top intelligence cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        <div style={{ background: TK.surface, padding: 16, borderRadius: 12, border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TK.accent }}>
            <Flame style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{language === 'ar' ? 'ساعة الذروة الأسبوعية المطلقة' : 'All-Time Weekly Peak Slot'}</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: TK.text }}>
            {language === 'ar' ? peak.labelAr : peak.labelEn}
          </span>
          <span style={{ fontSize: 11, color: TK.textLight }}>
            {peak.sessions} {language === 'ar' ? 'جلسة' : 'sessions'} • {peak.views} {language === 'ar' ? 'مشاهدة' : 'views'}
          </span>
        </div>

        <div style={{ background: TK.surface, padding: 16, borderRadius: 12, border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TK.purple }}>
            <Calendar style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{language === 'ar' ? 'أفضل يوم تفاعلاً في الأسبوع' : 'Most Active Day of the Week'}</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: TK.text }}>
            {language === 'ar' ? bestDay.nameAr : bestDay.nameEn}
          </span>
          <span style={{ fontSize: 11, color: TK.textLight }}>
            {bestDay.sessions} {language === 'ar' ? 'إجمالي جلسات اليوم' : 'total day sessions'}
          </span>
        </div>

        <div style={{ background: TK.surface, padding: 16, borderRadius: 12, border: `1px solid ${TK.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TK.green }}>
            <Zap style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{language === 'ar' ? 'توصية النشر والإعلانات' : 'Posting & Campaign Advice'}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: TK.text }}>
            {language === 'ar' ? 'أطلق حملاتك ومنشوراتك قبل ساعة الذروة بـ 45 دقيقة لتعظيم التفاعل' : 'Schedule ads & posts 45 min before peak hours for max ROI'}
          </span>
        </div>
      </div>

      {/* 7x24 Matrix Grid */}
      <Panel
        icon={Grid}
        title={language === 'ar' ? 'الخريطة الحرارية الأسبوعية بالتوقيت (7 أيام × 24 ساعة)' : 'Weekly Hourly Heatmap (7 Days × 24 Hours)'}
        subtitle={language === 'ar' ? 'كل خلية تمثل كثافة نشاط الزوار في تلك الساعة من ذلك اليوم' : 'Color density reflects visitor traffic and engagement in each specific hour'}
        action={
          hoveredCell && (
            <Badge tone="accent">
              {hoveredCell.dayName} {hoveredCell.hour}:00 — {hoveredCell.sessions} {language === 'ar' ? 'جلسة' : 'sessions'}
            </Badge>
          )
        }
      >
        <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
          <div style={{ minWidth: 640 }}>
            {/* Hour header labels: 00 to 23 */}
            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(24, 1fr)', gap: 3, marginBottom: 6, fontSize: 9, color: TK.textLight, textAlign: 'center' }}>
              <div></div>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} style={{ overflow: 'hidden' }}>{h}</div>
              ))}
            </div>

            {/* Matrix rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {matrix.map((row) => (
                <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '70px repeat(24, 1fr)', gap: 3, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {language === 'ar' ? row.nameAr : row.nameEn}
                  </span>

                  {row.hours.map((cell) => {
                    let bg = TK.bg;
                    let border = TK.border;
                    if (cell.intensity > 0) {
                      const alpha = Math.max(0.18, (cell.intensity / 100)).toFixed(2);
                      bg = `rgba(147, 51, 234, ${alpha})`;
                      border = `rgba(147, 51, 234, ${Math.min(1, Number(alpha) + 0.25)})`;
                    }
                    if (row.day === peak.day && cell.hour === peak.hour) {
                      bg = '#e11d48';
                      border = '#fb7185';
                    }

                    return (
                      <div
                        key={cell.hour}
                        title={`${language === 'ar' ? row.nameAr : row.nameEn} ${cell.hour}:00 — ${cell.sessions} ${language === 'ar' ? 'جلسة' : 'sessions'}, ${cell.views} ${language === 'ar' ? 'مشاهدة' : 'views'}`}
                        onMouseEnter={() => setHoveredCell({ dayName: language === 'ar' ? row.nameAr : row.nameEn, hour: cell.hour, sessions: cell.sessions, views: cell.views })}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{
                          height: 24,
                          background: bg,
                          border: `1px solid ${border}`,
                          borderRadius: 4,
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend scale */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 14, fontSize: 10, color: TK.textLight }}>
              <span>{language === 'ar' ? 'أقل نشاطاً' : 'Low Traffic'}</span>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: TK.bg, border: `1px solid ${TK.border}` }} />
              <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(147, 51, 234, 0.25)' }} />
              <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(147, 51, 234, 0.60)' }} />
              <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(147, 51, 234, 0.95)' }} />
              <div style={{ width: 12, height: 12, borderRadius: 2, background: '#e11d48' }} />
              <span>{language === 'ar' ? 'ذروة قصوى 🔥' : 'Peak 🔥'}</span>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};

// ── Tab: Campaigns (الحملات الإعلانية و UTM) ──────────────────────────────────

const CampaignsTab = ({ data, loading, language }) => {
  if (loading) return <Skeleton height="350px" />;
  if (!data?.campaigns?.length) return <EmptyState icon={BarChart3} title={noDataTitle(language)} />;

  const campaigns = data.campaigns || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard
          label={language === 'ar' ? 'جلسات الحملات المُتتبعة' : 'Tracked Campaign Sessions'}
          value={data.totalCampaignSessions?.toLocaleString() ?? 0}
          icon={Target}
          tone="purple"
        />
        <StatCard
          label={language === 'ar' ? 'الزيارات العضوية والمباشرة' : 'Direct & Organic Visits'}
          value={data.totalDirectOrganic?.toLocaleString() ?? 0}
          icon={Globe}
          tone="info"
        />
        <StatCard
          label={language === 'ar' ? 'إجمالي التحويلات' : 'Total Conversions'}
          value={data.totalConversions?.toLocaleString() ?? 0}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label={language === 'ar' ? 'معدل التحويل العام' : 'Overall Conversion Rate'}
          value={`${data.overallConversionRate ?? 0}%`}
          icon={TrendingUp}
          tone="warning"
        />
      </div>

      {/* Campaigns Table */}
      <Panel
        icon={Target}
        title={language === 'ar' ? 'تقرير أداء الحملات الإعلانية ومصادر الـ UTM' : 'Campaign Attribution & UTM Performance'}
        subtitle={language === 'ar' ? 'تحديد دقيق لأي منصة أو إعلان أو رابط جذب العملاء الأكثر تفاعلاً' : 'Track which ad campaigns, sources, and mediums deliver the highest ROI'}
      >
        <DataTable
          columns={[
            {
              key: 'campaign',
              label: language === 'ar' ? 'اسم الحملة / المصدر' : 'Campaign & Source',
              render: (row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TK.text }}>
                    {row.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Badge tone="neutral">{row.source || 'Direct'}</Badge>
                    <span style={{ fontSize: 10, color: TK.textLight }}>• {row.medium || 'web'}</span>
                  </div>
                </div>
              ),
            },
            {
              key: 'sessions',
              label: language === 'ar' ? 'الجلسات' : 'Sessions',
              render: (row) => (
                <span style={{ fontSize: 12, fontWeight: 500, color: TK.text, fontVariantNumeric: 'tabular-nums' }}>
                  {row.sessions.toLocaleString()}
                </span>
              ),
            },
            {
              key: 'views',
              label: language === 'ar' ? 'المشاهدات' : 'Views',
              render: (row) => (
                <span style={{ fontSize: 12, color: TK.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                  {row.pageViews.toLocaleString()}
                </span>
              ),
            },
            {
              key: 'duration',
              label: language === 'ar' ? 'متوسط المدة' : 'Avg Duration',
              render: (row) => (
                <span style={{ fontSize: 11, color: TK.textMuted }}>
                  {fmtDuration(row.avgDurationSec, language)}
                </span>
              ),
            },
            {
              key: 'conversions',
              label: language === 'ar' ? 'التحويلات 🎯' : 'Conversions 🎯',
              render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.conversions > 0 ? TK.green : TK.textLight, fontVariantNumeric: 'tabular-nums' }}>
                    {row.conversions}
                  </span>
                  {row.conversions > 0 && <Badge tone="success">{row.conversionRate}%</Badge>}
                </div>
              ),
            },
          ]}
          rows={campaigns.map((c, i) => ({ ...c, _id: `${c.name}-${i}` }))}
        />
      </Panel>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Journeys', 'Funnel', 'Heatmap', 'Campaigns', 'Real-time', 'Geography', 'Sources', 'Devices', 'Pages', 'Conversions'];
const TAB_LABELS = {
  Overview:    { en: 'Overview',             ar: 'نظرة عامة' },
  Journeys:    { en: 'Visitor Journeys',     ar: 'رحلة الزوار والجلسات' },
  Funnel:      { en: 'Conversion Funnel',    ar: 'مسار التحويل (Funnel)' },
  Heatmap:     { en: '7×24 Heatmap',         ar: 'الخريطة الحرارية 7×24' },
  Campaigns:   { en: 'Ad Campaigns (UTM)',   ar: 'الحملات ومصادر الـ UTM' },
  'Real-time': { en: 'Real-time',            ar: 'الوقت الحقيقي' },
  Geography:   { en: 'Geography',            ar: 'الجغرافيا' },
  Sources:     { en: 'Sources',              ar: 'المصادر' },
  Devices:     { en: 'Devices',              ar: 'الأجهزة' },
  Pages:       { en: 'Pages',                ar: 'الصفحات' },
  Conversions: { en: 'Conversions',          ar: 'التحويلات' },
};

const RANGES = [
  { value: 'today',     en: 'Today (Hourly)', ar: 'اليوم (بالساعة)' },
  { value: 'yesterday', en: 'Yesterday',      ar: 'أمس' },
  { value: '7d',        en: '7 Days',         ar: '7 أيام' },
  { value: '30d',       en: '30 Days',        ar: '30 يوم' },
  { value: '90d',       en: '90 Days',        ar: '90 يوم' },
  { value: 'custom',    en: 'Custom Range 📅',ar: 'فترة مخصصة 📅' },
];

const VISITOR_FILTERS = [
  { value: 'all',          en: '👥 All Traffic',       ar: '👥 جميع الزيارات' },
  { value: 'clients_only', en: '⭐ Clients & Guests',  ar: '⭐ العملاء والزوار الفعليين' },
  { value: 'admin_only',   en: '👑 Admin & Team Only', ar: '👑 فريق العمل والإدارة' },
];

export default function AdminAnalytics() {
  const { language, isRTL } = useLanguage();
  const font = FONT(isRTL);

  const [tab, setTab]                     = useState('Overview');
  const [range, setRange]                 = useState('30d');
  const [visitorFilter, setVisitorFilter] = useState('clients_only'); // Default to clients only to isolate real leads!
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const [loading, setLoading]       = useState({});
  const [data, setData]             = useState({});
  const [hourlyData, setHourlyData] = useState(null);
  const [error, setError]           = useState(null);

  const realtimeTimer = useRef(null);

  // Build query string
  const buildQuery = useCallback((r = range, vf = visitorFilter, sd = startDate, ed = endDate) => {
    let q = `range=${r}&visitorFilter=${vf}`;
    if (r === 'custom' && sd && ed) {
      q += `&startDate=${sd}&endDate=${ed}`;
    }
    return q;
  }, [range, visitorFilter, startDate, endDate]);

  const fetchTab = useCallback(async (tabName) => {
    const q = buildQuery();
    const endpointMap = {
      Overview:    `/analytics/visitors?${q}`,
      Funnel:      `/analytics/funnel?${q}`,
      Heatmap:     `/analytics/heatmap?${q}`,
      Campaigns:   `/analytics/campaigns?${q}`,
      'Real-time': `/analytics/realtime?visitorFilter=${visitorFilter}`,
      Geography:   `/analytics/geography?${q}`,
      Sources:     `/analytics/sources?${q}`,
      Devices:     `/analytics/devices?${q}`,
      Pages:       `/analytics/pages/detail?${q}`,
      Conversions: `/analytics/conversions?${q}`,
    };

    if (tabName === 'Journeys') return; // Handled internally by JourneysTab

    const endpoint = endpointMap[tabName];
    if (!endpoint) return;

    setLoading(prev => ({ ...prev, [tabName]: true }));
    setError(null);

    try {
      const res = await api.get(endpoint);
      setData(prev => ({ ...prev, [tabName]: res.data }));

      // If Overview tab, also fetch hourly distribution data
      if (tabName === 'Overview') {
        const hourlyRes = await api.get(`/analytics/hourly?${q}`);
        setHourlyData(hourlyRes.data);
      }
    } catch {
      const label = TAB_LABELS[tabName] ? (language === 'ar' ? TAB_LABELS[tabName].ar : TAB_LABELS[tabName].en) : tabName;
      setError(language === 'ar' ? `تعذر تحميل بيانات ${label}` : `Could not load ${label} data`);
    } finally {
      setLoading(prev => ({ ...prev, [tabName]: false }));
    }
  }, [buildQuery, visitorFilter, language]);

  useEffect(() => {
    fetchTab(tab);
  }, [tab, range, visitorFilter, fetchTab]);

  // Auto-refresh real-time tab every 15 seconds
  useEffect(() => {
    if (tab === 'Real-time') {
      realtimeTimer.current = setInterval(() => fetchTab('Real-time'), 15000);
    } else {
      clearInterval(realtimeTimer.current);
    }
    return () => clearInterval(realtimeTimer.current);
  }, [tab, fetchTab]);

  const handleRangeChange = (r) => {
    if (r === 'custom') {
      setShowCustomPicker(true);
      setRange('custom');
    } else {
      setShowCustomPicker(false);
      setRange(r);
    }
  };

  const handleApplyCustomDate = () => {
    if (startDate && endDate) {
      fetchTab(tab);
    }
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
        title={language === 'ar' ? 'التحليلات الاستخباراتية' : 'Platform Analytics'}
        subtitle={language === 'ar' ? 'تحليلات دقيقة بالساعة، سجل رحلة كل عميل، وفلترة الزيارات الحقيقية لمنصتك' : 'Hourly precision metrics, visitor journey inspection, and real client insights'}
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={() => fetchTab(tab)}>
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        }
      />

      {/* Integration Direct Links Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge tone="success" dot>{language === 'ar' ? 'GA4 نشط' : 'GA4 Active'}</Badge>
          <Badge tone="info" dot>{language === 'ar' ? 'Clarity نشط' : 'Clarity Active'}</Badge>
          <Badge tone="purple" dot>{language === 'ar' ? 'تتبع الزوار المخصص نشط' : 'Custom Telemetry Active'}</Badge>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href="https://clarity.microsoft.com/projects/view/x58kfxz02f/recordings"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: TK.surface,
              border: `1px solid ${TK.border}`,
              color: TK.text,
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <PlayCircle style={{ width: 14, height: 14, color: TK.accent }} />
            <span>{language === 'ar' ? 'تسجيلات Clarity' : 'Clarity Replays'}</span>
            <ExternalLink style={{ width: 12, height: 12, color: TK.textLight }} />
          </a>

          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: TK.surface,
              border: `1px solid ${TK.border}`,
              color: TK.text,
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <BarChart3 style={{ width: 14, height: 14, color: TK.purple }} />
            <span>{language === 'ar' ? 'لوحة GA4' : 'GA4 Hub'}</span>
            <ExternalLink style={{ width: 12, height: 12, color: TK.textLight }} />
          </a>
        </div>
      </div>

      {/* Top Filter Controls (Visitor Segments & Date Ranges) */}
      <div style={{ background: TK.surface, padding: '16px 20px', borderRadius: 12, border: `1px solid ${TK.border}`, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Visitor Filter segment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: TK.textMuted }}>
              {language === 'ar' ? 'تصنيف الزوار:' : 'Visitor Filter:'}
            </span>
            <FilterPills
              value={visitorFilter}
              onChange={setVisitorFilter}
              options={VISITOR_FILTERS.map(vf => ({ value: vf.value, label: language === 'ar' ? vf.ar : vf.en }))}
            />
          </div>

          {/* Date range picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: TK.textMuted }}>
              {language === 'ar' ? 'الفترة:' : 'Range:'}
            </span>
            <FilterPills
              value={range}
              onChange={handleRangeChange}
              options={RANGES.map(r => ({ value: r.value, label: language === 'ar' ? r.ar : r.en }))}
            />
          </div>
        </div>

        {/* Custom date picker row */}
        {(showCustomPicker || range === 'custom') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: `1px dashed ${TK.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: TK.textMuted }}>{language === 'ar' ? 'من تاريخ:' : 'From:'}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${TK.border}`, background: TK.bg, fontSize: 12, color: TK.text }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: TK.textMuted }}>{language === 'ar' ? 'إلى تاريخ:' : 'To:'}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${TK.border}`, background: TK.bg, fontSize: 12, color: TK.text }}
              />
            </div>

            <Button size="sm" variant="primary" onClick={handleApplyCustomDate} disabled={!startDate || !endDate}>
              {language === 'ar' ? 'تطبيق الفترة' : 'Apply Range'}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 24 }}>
        <Tabs value={tab} onChange={setTab} items={TABS.map(t => ({ value: t, label: language === 'ar' ? TAB_LABELS[t].ar : TAB_LABELS[t].en }))} />
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: TK.redBg, border: `1px solid ${TK.redBd}`, marginBottom: 16, color: TK.red, fontSize: 12 }}>
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Tab content */}
      {tab === 'Overview' && (
        <OverviewTab
          data={data['Overview']}
          hourlyData={hourlyData}
          loading={loading['Overview']}
          language={language}
        />
      )}

      {tab === 'Journeys' && (
        <JourneysTab
          language={language}
          isRTL={isRTL}
          range={range}
          visitorFilter={visitorFilter}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {tab === 'Funnel' && (
        <FunnelTab
          data={data['Funnel']}
          loading={loading['Funnel']}
          language={language}
        />
      )}

      {tab === 'Heatmap' && (
        <HeatmapTab
          data={data['Heatmap']}
          loading={loading['Heatmap']}
          language={language}
        />
      )}

      {tab === 'Campaigns' && (
        <CampaignsTab
          data={data['Campaigns']}
          loading={loading['Campaigns']}
          language={language}
        />
      )}

      {tab === 'Real-time' && (
        <RealtimeTab
          data={data['Real-time']}
          loading={loading['Real-time']}
          language={language}
        />
      )}

      {tab === 'Geography'   && <GeographyTab   data={data['Geography']}   loading={loading['Geography']}   language={language} />}
      {tab === 'Sources'     && <SourcesTab     data={data['Sources']}     loading={loading['Sources']}     language={language} />}
      {tab === 'Devices'     && <DevicesTab     data={data['Devices']}     loading={loading['Devices']}     language={language} />}
      {tab === 'Pages'       && <PagesTab       data={data['Pages']}       loading={loading['Pages']}       language={language} />}
      {tab === 'Conversions' && <ConversionsTab data={data['Conversions']} loading={loading['Conversions']} language={language} />}
    </div>
  );
}

