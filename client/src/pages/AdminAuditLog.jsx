import { useState, useEffect } from 'react';
import { Shield, RefreshCw, Filter } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, PageHeader, Button, Select, DataTable } from '../admin-ui';

const ACTION_COLORS = {
  'user.delete':         '#f87171',
  'user.deactivate':     '#f87171',
  'user.role_change':    '#f59e0b',
  'project.delete':      '#f87171',
  'invoice.create':      '#60a5fa',
  'invoice.send':        '#2563EB',
  'invoice.mark_paid':   '#34d399',
  'feedback.delete':     '#f87171',
  'feedback.flag':       '#f59e0b',
  'feedback.highlight':  '#2563EB',
};

const actionColor = (action) => ACTION_COLORS[action] || TK.textLight;

const timeFormat = (d) => new Date(d).toLocaleString('en', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const AdminAuditLog = () => {
  const { dir, isRTL, language } = useLanguage();

  const [logs,     setLogs]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [actions,  setActions]  = useState([]);
  const [filter,   setFilter]   = useState({ action: '', startDate: '', endDate: '' });

  const limit = 50;

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit, ...filter };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/audit', { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPage(p);
    } catch (err) {
      console.error('Audit log fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      const res = await api.get('/audit/actions');
      setActions(res.data.actions || []);
    } catch {}
  };

  useEffect(() => {
    fetchLogs(1);
    fetchActions();
  }, []);

  const totalPages = Math.ceil(total / limit);

  const columns = [
    {
      key: 'timestamp', label: language === 'ar' ? 'الوقت' : 'Timestamp', width: '16%',
      render: (log) => <span style={{ fontSize: '11px', color: TK.textMuted }}>{timeFormat(log.createdAt)}</span>,
    },
    {
      key: 'action', label: language === 'ar' ? 'الإجراء' : 'Action', width: '20%',
      render: (log) => (
        <span style={{ fontSize: '11px', fontWeight: 500, color: actionColor(log.action), fontFamily: 'monospace' }}>
          {log.action}
        </span>
      ),
    },
    {
      key: 'actor', label: language === 'ar' ? 'الفاعل' : 'Actor', width: '18%',
      render: (log) => (
        <div>
          <div style={{ fontSize: '12px', color: TK.text }}>{log.actor?.fullName || log.actorEmail || (language === 'ar' ? 'غير معروف' : 'Unknown')}</div>
          <div style={{ fontSize: '10px', color: TK.textLight, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{log.actorRole}</div>
        </div>
      ),
    },
    {
      key: 'entityType', label: language === 'ar' ? 'الكيان' : 'Entity', width: '14%',
      render: (log) => <span style={{ fontSize: '11px', color: TK.textMuted }}>{log.entityType}</span>,
    },
    {
      key: 'details', label: language === 'ar' ? 'التفاصيل' : 'Details', width: '32%',
      render: (log) => (
        <div style={{ fontSize: '11px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {log.metadata ? JSON.stringify(log.metadata).slice(0, 60) : log.entityId?.toString()?.slice(0, 16) || '—'}
        </div>
      ),
    },
  ];

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }}>

      <PageHeader
        icon={Shield}
        eyebrow={language === 'ar' ? 'الإدارة' : 'Admin'}
        title={language === 'ar' ? 'سجل التدقيق' : 'Audit Log'}
        subtitle={language === 'ar'
          ? `${total.toLocaleString()} إجمالي السجلات — سجل ثابت لجميع إجراءات الإدارة`
          : `${total.toLocaleString()} total entries — immutable record of all admin actions`}
        actions={<Button variant="secondary" icon={RefreshCw} onClick={() => fetchLogs(1)} loading={loading}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <Select
          value={filter.action}
          onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
          options={[{ value: '', label: language === 'ar' ? 'كل الإجراءات' : 'All Actions' }, ...actions.map(a => ({ value: a, label: a }))]}
          style={{ minWidth: '180px' }}
        />
        <div className="au-input" style={{ display: 'flex', alignItems: 'center', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '8px', padding: '9px 13px' }}>
          <input
            type="date"
            value={filter.startDate}
            onChange={e => setFilter(f => ({ ...f, startDate: e.target.value }))}
            style={{ fontSize: '12px', color: TK.text }}
          />
        </div>
        <div className="au-input" style={{ display: 'flex', alignItems: 'center', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '8px', padding: '9px 13px' }}>
          <input
            type="date"
            value={filter.endDate}
            onChange={e => setFilter(f => ({ ...f, endDate: e.target.value }))}
            style={{ fontSize: '12px', color: TK.text }}
          />
        </div>
        <Button variant="secondary" icon={Filter} onClick={() => fetchLogs(1)}>{language === 'ar' ? 'تطبيق' : 'Apply'}</Button>
      </div>

      <DataTable
        columns={columns}
        rows={logs}
        getRowId={(r) => r._id}
        loading={loading}
        emptyIcon={Shield}
        emptyTitle={language === 'ar' ? 'لا توجد سجلات تدقيق' : 'No audit events found'}
        isRTL={isRTL}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => fetchLogs(p)}
        footer={language === 'ar'
          ? `عرض ${logs.length} من ${total.toLocaleString()} سجل`
          : `Showing ${logs.length} of ${total.toLocaleString()} entries`}
      />
    </div>
  );
};

export default AdminAuditLog;
