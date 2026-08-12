import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileSignature, Plus, Eye, Pencil, Copy, Link2, Archive, Trash2,
  FileText, Send, CheckCircle2, XCircle, Clock, DollarSign, TrendingUp,
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, RADIUS, FONT, PageHeader, Card, Button, IconButton, Badge, SearchInput, FilterPills,
  StatCard, ConfirmDialog, DataTable, useTableState,
} from '../admin-ui';

const STATUS_TONE = {
  DRAFT: 'neutral', SENT: 'info', VIEWED: 'purple', CHANGE_REQUESTED: 'warning',
  ACCEPTED: 'success', REJECTED: 'danger', EXPIRED: 'danger', ARCHIVED: 'neutral',
};

const STATUS_LABEL = {
  DRAFT: { ar: 'مسودة', en: 'Draft' },
  SENT: { ar: 'مُرسَل', en: 'Sent' },
  VIEWED: { ar: 'تمت المشاهدة', en: 'Viewed' },
  CHANGE_REQUESTED: { ar: 'طلب تعديل', en: 'Changes Requested' },
  ACCEPTED: { ar: 'مقبول', en: 'Accepted' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  EXPIRED: { ar: 'منتهي', en: 'Expired' },
  ARCHIVED: { ar: 'مؤرشف', en: 'Archived' },
};

const money = (n, currency = 'EGP') => `${(Number(n) || 0).toLocaleString('en-US')} ${currency}`;
const dateFmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const AdminProposals = () => {
  const { isRTL } = useLanguage();
  const font = FONT(isRTL);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { sortKey, sortDir, onSort, sortRows } = useTableState('createdAt');

  const T = {
    title: isRTL ? 'العروض' : 'Proposals',
    subtitle: isRTL ? 'إنشاء وإدارة ومتابعة عروض العملاء' : 'Create, manage, and track client proposals',
    newProposal: isRTL ? 'عرض جديد' : 'New Proposal',
    all: isRTL ? 'الكل' : 'All',
    proposalNumber: isRTL ? 'رقم العرض' : 'Proposal #',
    client: isRTL ? 'العميل' : 'Client',
    project: isRTL ? 'المشروع' : 'Project',
    amount: isRTL ? 'القيمة' : 'Amount',
    status: isRTL ? 'الحالة' : 'Status',
    created: isRTL ? 'تاريخ الإنشاء' : 'Created',
    lastViewed: isRTL ? 'آخر مشاهدة' : 'Last Viewed',
    view: isRTL ? 'عرض' : 'View',
    edit: isRTL ? 'تعديل' : 'Edit',
    duplicate: isRTL ? 'نسخ' : 'Duplicate',
    copyLink: isRTL ? 'نسخ الرابط' : 'Copy Link',
    archive: isRTL ? 'أرشفة' : 'Archive',
    delete: isRTL ? 'حذف' : 'Delete',
    linkCopied: isRTL ? 'تم نسخ الرابط ✓' : 'Link copied ✓',
    duplicated: isRTL ? 'تم إنشاء نسخة كمسودة ✓' : 'Duplicated as a new draft ✓',
    archived: isRTL ? 'تمت الأرشفة ✓' : 'Archived ✓',
    deleted: isRTL ? 'تم الحذف ✓' : 'Deleted ✓',
    deleteTitle: isRTL ? 'حذف هذا العرض؟' : 'Delete this proposal?',
    deleteDesc: isRTL ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.',
    loadFailed: isRTL ? 'فشل تحميل العروض' : 'Failed to load proposals',
    actionFailed: isRTL ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again',
    emptyTitle: isRTL ? 'لا توجد عروض بعد' : 'No proposals yet',
    emptySubtitle: isRTL ? 'أنشئ أول عرض لبدء العمل مع عميل' : 'Create your first proposal to get started',
    totalProposals: isRTL ? 'إجمالي العروض' : 'Total Proposals',
    draft: isRTL ? 'مسودات' : 'Draft',
    sent: isRTL ? 'مُرسَلة' : 'Sent',
    accepted: isRTL ? 'مقبولة' : 'Accepted',
    totalValue: isRTL ? 'إجمالي القيمة' : 'Total Value',
    monthValue: isRTL ? 'قيمة هذا الشهر' : "This Month's Value",
  };

  const STATUS_OPTIONS = [
    { value: 'all', label: T.all },
    ...Object.keys(STATUS_LABEL).map((s) => ({ value: s, label: isRTL ? STATUS_LABEL[s].ar : STATUS_LABEL[s].en })),
  ];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get('/proposals', { params: { q: search.trim() || undefined, status: statusFilter === 'all' ? undefined : statusFilter, limit: 100 } }),
        api.get('/proposals/stats/overview'),
      ]);
      setItems(listRes.data.items || []);
      setStats(statsRes.data);
    } catch {
      toast.error(T.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const copyLink = (slug) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success(T.linkCopied)).catch(() => {});
  };

  const duplicate = async (id) => {
    try {
      const { data } = await api.post(`/proposals/${id}/duplicate`);
      toast.success(T.duplicated);
      navigate(`/app/admin/proposals/${data.item._id}/edit`);
    } catch {
      toast.error(T.actionFailed);
    }
  };

  const archive = async (id) => {
    try {
      const { data } = await api.post(`/proposals/${id}/archive`);
      setItems((prev) => prev.map((p) => (p._id === id ? data.item : p)));
      toast.success(T.archived);
    } catch {
      toast.error(T.actionFailed);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/proposals/${deleteId}`);
      setItems((prev) => prev.filter((p) => p._id !== deleteId));
      toast.success(T.deleted);
      setDeleteId(null);
    } catch {
      toast.error(T.actionFailed);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'proposalNumber', label: T.proposalNumber, sortable: true, render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.proposalNumber}</span> },
    { key: 'client', label: T.client, render: (r) => (isRTL ? r.client?.nameAr : r.client?.name) || r.client?.name || '—' },
    { key: 'project', label: T.project, render: (r) => (isRTL ? r.project?.titleAr : r.project?.title) || r.project?.title || '—' },
    { key: 'amount', label: T.amount, render: (r) => (r.pricing?.hidePriceFromClient ? '—' : money(r.pricing?.finalPrice, r.pricing?.currency)) },
    { key: 'status', label: T.status, render: (r) => <Badge tone={STATUS_TONE[r.status] || 'neutral'} dot>{isRTL ? STATUS_LABEL[r.status]?.ar : STATUS_LABEL[r.status]?.en}</Badge> },
    { key: 'createdAt', label: T.created, sortable: true, render: (r) => dateFmt(r.createdAt) },
    { key: 'lastViewedAt', label: T.lastViewed, render: (r) => dateFmt(r.lastViewedAt) },
    {
      key: '_actions', label: '', align: 'end',
      render: (r) => (
        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <IconButton icon={Eye} size={28} title={T.view} onClick={() => window.open(`/p/${r.slug}`, '_blank', 'noopener,noreferrer')} />
          <IconButton icon={Pencil} size={28} title={T.edit} onClick={() => navigate(`/app/admin/proposals/${r._id}/edit`)} />
          <IconButton icon={Copy} size={28} title={T.duplicate} onClick={() => duplicate(r._id)} />
          <IconButton icon={Link2} size={28} title={T.copyLink} onClick={() => copyLink(r.slug)} />
          {r.status !== 'ARCHIVED' && <IconButton icon={Archive} size={28} title={T.archive} onClick={() => archive(r._id)} />}
          <IconButton icon={Trash2} size={28} title={T.delete} onClick={() => setDeleteId(r._id)} />
        </div>
      ),
    },
  ];

  const rows = sortRows(items);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px', fontFamily: font }}>
      <PageHeader
        icon={FileSignature}
        eyebrow={isRTL ? 'نظام العروض' : 'Proposal System'}
        title={T.title}
        subtitle={T.subtitle}
        actions={<Button variant="primary" icon={Plus} onClick={() => navigate('/app/admin/proposals/new')}>{T.newProposal}</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon={FileText} label={T.totalProposals} value={stats?.total ?? '—'} />
        <StatCard icon={Clock} label={T.draft} value={stats?.byStatus?.DRAFT ?? 0} tone="neutral" />
        <StatCard icon={Send} label={T.sent} value={(stats?.byStatus?.SENT ?? 0) + (stats?.byStatus?.VIEWED ?? 0)} tone="info" />
        <StatCard icon={CheckCircle2} label={T.accepted} value={stats?.byStatus?.ACCEPTED ?? 0} tone="success" />
        <StatCard icon={DollarSign} label={T.totalValue} value={stats ? money(stats.totalValue) : '—'} tone="purple" />
        <StatCard icon={TrendingUp} label={T.monthValue} value={stats ? money(stats.monthValue) : '—'} tone="warning" />
      </div>

      <Card padding="16px" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
          <FilterPills value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        onRowClick={(r) => navigate(`/app/admin/proposals/${r._id}/edit`)}
        isRTL={isRTL}
        emptyIcon={FileSignature}
        emptyTitle={search.trim() ? (isRTL ? 'لا توجد نتائج مطابقة' : 'No matches for your search') : T.emptyTitle}
        emptySubtitle={search.trim() ? undefined : T.emptySubtitle}
        emptyAction={!search.trim() && <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate('/app/admin/proposals/new')}>{T.newProposal}</Button>}
        footer={`${items.length} ${T.title}`}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={T.deleteTitle}
        description={T.deleteDesc}
        confirmLabel={T.delete}
        cancelLabel={isRTL ? 'إلغاء' : 'Cancel'}
      />
    </div>
  );
};

export default AdminProposals;
