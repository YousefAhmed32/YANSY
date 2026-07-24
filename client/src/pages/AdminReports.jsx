import { useEffect, useState, useCallback } from 'react';
import {
  Flag, CheckCircle, Clock, Eye, X,
  RefreshCw, ChevronRight, Shield, MessageSquare,
  FolderKanban, Users
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { timeAgo } from '../utils/time';
import {
  TK, RADIUS, STATUS_TONE, FONT, PageHeader, StatCard, Card,
  Button, IconButton, Badge, FilterPills, DataTable, ConfirmDialog,
} from '../admin-ui';

const TYPE_LABELS_EN = {
  abuse:                 'Abuse',
  spam:                  'Spam',
  fraud:                 'Fraud',
  harassment:            'Harassment',
  inappropriate_content: 'Inappropriate',
  other:                 'Other',
};
const TYPE_LABELS_AR = {
  abuse:                 'إساءة',
  spam:                  'رسائل مزعجة',
  fraud:                 'احتيال',
  harassment:            'تحرش',
  inappropriate_content: 'محتوى غير لائق',
  other:                 'أخرى',
};
const getTypeLabels = (language) => (language === 'ar' ? TYPE_LABELS_AR : TYPE_LABELS_EN);
const TYPE_TONE = {
  abuse: 'danger', spam: 'warning', fraud: 'warning',
  harassment: 'purple', inappropriate_content: 'info', other: 'neutral',
};

const STATUS_LABELS_EN = { pending: 'Pending', under_review: 'Under Review', resolved: 'Resolved', dismissed: 'Dismissed' };
const STATUS_LABELS_AR = { pending: 'قيد الانتظار', under_review: 'قيد المراجعة', resolved: 'تم الحل', dismissed: 'مرفوض' };
const getStatusLabels = (language) => (language === 'ar' ? STATUS_LABELS_AR : STATUS_LABELS_EN);
const STATUS_TONE_MAP = { pending: 'warning', under_review: 'info', resolved: 'success', dismissed: 'neutral' };

const TARGET_ICONS = {
  user:    Users,
  project: FolderKanban,
  message: MessageSquare,
};

const AdminReports = () => {
  const { dir, language, isRTL } = useLanguage();
  const font = FONT(isRTL);

  const [reports,        setReports]        = useState([]);
  const [stats,          setStats]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState('all');
  const [selected,       setSelected]       = useState(null);
  const [page,           setPage]           = useState(1);
  const [total,          setTotal]          = useState(0);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const LIMIT = 15;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filter !== 'all') params.set('status', filter);
      const [rRes, sRes] = await Promise.all([
        api.get(`/reports?${params}`),
        api.get('/reports/stats'),
      ]);
      setReports(rRes.data.reports || []);
      setTotal(rRes.data.total || 0);
      setStats(sRes.data);
    } catch {
      toast.error(language === 'ar' ? 'فشل تحميل البلاغات' : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateStatus = async (reportId, status) => {
    try {
      await api.patch(`/reports/${reportId}`, { status });
      const statusLabels = getStatusLabels(language);
      toast.success(language === 'ar' ? `تم تعليم البلاغ كـ ${statusLabels[status] || status}` : `Report marked as ${statusLabels[status] || status}`);
      fetchReports();
      setSelected(null);
    } catch {
      toast.error(language === 'ar' ? 'فشل تحديث البلاغ' : 'Failed to update report');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeleting(true);
      await api.delete(`/reports/${deleteConfirm}`);
      toast.success(language === 'ar' ? 'تم حذف البلاغ' : 'Report deleted');
      setDeleteConfirm(null);
      setSelected(null);
      fetchReports();
    } catch {
      toast.error(language === 'ar' ? 'فشل حذف البلاغ' : 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  const typeLabels = getTypeLabels(language);
  const statusLabels = getStatusLabels(language);

  const statCards = [
    { label: language === 'ar' ? 'إجمالي البلاغات' : 'Total Reports',  value: stats?.total       || 0, tone: 'info',    icon: Flag },
    { label: language === 'ar' ? 'قيد الانتظار' : 'Pending',        value: stats?.pending      || 0, tone: 'warning', icon: Clock },
    { label: language === 'ar' ? 'قيد المراجعة' : 'Under Review',   value: stats?.underReview  || 0, tone: 'purple',  icon: Eye },
    { label: language === 'ar' ? 'تم الحل' : 'Resolved',       value: stats?.resolved     || 0, tone: 'success', icon: CheckCircle },
  ];

  const columns = [
    {
      key: 'type', label: language === 'ar' ? 'النوع' : 'Type', width: '10%',
      render: (r) => <Badge tone={TYPE_TONE[r.type] || 'neutral'}>{typeLabels[r.type] || r.type}</Badge>,
    },
    {
      key: 'targetType', label: language === 'ar' ? 'الهدف' : 'Target', width: '12%',
      render: (r) => {
        const TargetIcon = TARGET_ICONS[r.targetType] || Flag;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TargetIcon style={{ width: '12px', height: '12px', color: TK.textMuted }} />
            <span style={{ fontSize: '11px', color: TK.textMuted, textTransform: 'capitalize' }}>{r.targetType}</span>
          </div>
        );
      },
    },
    {
      key: 'reporter', label: language === 'ar' ? 'المُبلِغ' : 'Reporter', width: '18%',
      render: (r) => (
        <div>
          <div style={{ fontSize: '12px', color: TK.text }}>{r.reporter?.fullName || r.reporter?.email || (language === 'ar' ? 'غير معروف' : 'Unknown')}</div>
          <div style={{ fontSize: '10px', color: TK.textMuted }}>{r.reporter?.email}</div>
        </div>
      ),
    },
    {
      key: 'description', label: language === 'ar' ? 'الوصف' : 'Description', width: '26%',
      render: (r) => (
        <div style={{ fontSize: '11px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
          {r.description}
        </div>
      ),
    },
    {
      key: 'status', label: language === 'ar' ? 'الحالة' : 'Status', width: '12%',
      render: (r) => <Badge tone={STATUS_TONE_MAP[r.status] || 'warning'} dot>{statusLabels[r.status] || r.status}</Badge>,
    },
    {
      key: 'createdAt', label: language === 'ar' ? 'التاريخ' : 'Date', width: '12%',
      render: (r) => <span style={{ fontSize: '10px', color: TK.textMuted }}>{timeAgo(r.createdAt, language)}</span>,
    },
    {
      key: 'chevron', label: '', width: '4%', align: 'right',
      render: () => <ChevronRight style={{ width: '12px', height: '12px', color: TK.textLight }} />,
    },
  ];

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: TK.bg, fontFamily: font, padding: '32px 32px 60px' }}>
      <PageHeader
        icon={Shield}
        eyebrow={language === 'ar' ? 'الثقة والسلامة' : 'Trust & Safety'}
        title={language === 'ar' ? 'البلاغات والإشراف' : 'Reports & Moderation'}
        actions={<Button variant="secondary" icon={RefreshCw} onClick={fetchReports} loading={loading}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {statCards.map((s) => <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />)}
      </div>

      {/* Filter tabs */}
      <div style={{ marginBottom: '20px' }}>
        <FilterPills
          value={filter}
          onChange={(f) => { setFilter(f); setPage(1); }}
          options={[
            { value: 'all', label: language === 'ar' ? 'كل البلاغات' : 'All Reports' },
            { value: 'pending', label: statusLabels.pending },
            { value: 'under_review', label: statusLabels.under_review },
            { value: 'resolved', label: statusLabels.resolved },
            { value: 'dismissed', label: statusLabels.dismissed },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '20px' }}>
        {/* Report list */}
        <DataTable
          columns={columns}
          rows={reports}
          loading={loading}
          emptyIcon={Flag}
          emptyTitle={language === 'ar' ? 'لا توجد بلاغات' : 'No reports found'}
          isRTL={isRTL}
          onRowClick={(r) => setSelected(selected?._id === r._id ? null : r)}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          footer={language === 'ar' ? `عرض ${reports.length} من ${total} بلاغ` : `Showing ${reports.length} of ${total} reports`}
        />

        {/* Detail Panel */}
        {selected && (
          <Card style={{ alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: TK.text, margin: 0 }}>{language === 'ar' ? 'تفاصيل البلاغ' : 'Report Details'}</h3>
              <IconButton icon={X} size={28} onClick={() => setSelected(null)} title={language === 'ar' ? 'إغلاق' : 'Close'} />
            </div>

            {[
              { key: 'type',      label: language === 'ar' ? 'النوع' : 'Type',      value: typeLabels[selected.type] || selected.type },
              { key: 'target',    label: language === 'ar' ? 'الهدف' : 'Target',    value: `${selected.targetType} — ${selected.targetId}` },
              { key: 'reporter',  label: language === 'ar' ? 'المُبلِغ' : 'Reporter',  value: selected.reporter?.fullName || selected.reporter?.email },
              { key: 'status',    label: language === 'ar' ? 'الحالة' : 'Status',    value: statusLabels[selected.status] || selected.status },
              { key: 'submitted', label: language === 'ar' ? 'تاريخ الإرسال' : 'Submitted', value: new Date(selected.createdAt).toLocaleString() },
            ].map(({ key, label, value }) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: TK.text }}>{value}</div>
              </div>
            ))}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{language === 'ar' ? 'الوصف' : 'Description'}</div>
              <p style={{ fontSize: '12px', color: TK.text, lineHeight: 1.7, margin: 0, padding: '12px', background: TK.bgSubtle, borderRadius: RADIUS.md, border: `1px solid ${TK.border}` }}>
                {selected.description}
              </p>
            </div>

            {selected.adminNotes && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{language === 'ar' ? 'ملاحظات الإدارة' : 'Admin Notes'}</div>
                <p style={{ fontSize: '12px', color: TK.textMuted, lineHeight: 1.7, margin: 0 }}>{selected.adminNotes}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selected.status !== 'under_review' && (
                <button
                  onClick={() => updateStatus(selected._id, 'under_review')}
                  style={{ padding: '9px 16px', borderRadius: RADIUS.md, border: `1px solid ${STATUS_TONE.info.bd}`, background: STATUS_TONE.info.bg, color: STATUS_TONE.info.fg, fontSize: '11px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' }}
                >
                  {language === 'ar' ? 'وضع علامة قيد المراجعة' : 'Mark Under Review'}
                </button>
              )}
              {selected.status !== 'resolved' && (
                <button
                  onClick={() => updateStatus(selected._id, 'resolved')}
                  style={{ padding: '9px 16px', borderRadius: RADIUS.md, border: `1px solid ${STATUS_TONE.success.bd}`, background: STATUS_TONE.success.bg, color: STATUS_TONE.success.fg, fontSize: '11px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' }}
                >
                  {language === 'ar' ? 'وضع علامة تم الحل' : 'Mark Resolved'}
                </button>
              )}
              {selected.status !== 'dismissed' && (
                <button
                  onClick={() => updateStatus(selected._id, 'dismissed')}
                  style={{ padding: '9px 16px', borderRadius: RADIUS.md, border: `1px solid ${TK.border}`, background: 'transparent', color: TK.textMuted, fontSize: '11px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' }}
                >
                  {language === 'ar' ? 'رفض' : 'Dismiss'}
                </button>
              )}
              <Button variant="danger" onClick={() => setDeleteConfirm(selected._id)} style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
                {language === 'ar' ? 'حذف البلاغ' : 'Delete Report'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={language === 'ar' ? 'حذف البلاغ؟' : 'Delete report?'}
        description={language === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف البلاغ نهائياً.' : 'This action cannot be undone. The report will be permanently removed.'}
        confirmLabel={language === 'ar' ? 'حذف' : 'Delete'}
      />
    </div>
  );
};

export default AdminReports;
