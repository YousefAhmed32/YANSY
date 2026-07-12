import { useState, useEffect } from 'react';
import { Shield, RefreshCw, Filter } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  text:      '#0D1117',
  textMuted: '#6B7280',
};

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

const actionColor = (action) => ACTION_COLORS[action] || 'rgba(255,255,255,0.4)';

const timeFormat = (d) => new Date(d).toLocaleString('en', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const AdminAuditLog = () => {
  const { dir } = useLanguage();

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

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: TK.bg, color: TK.text, padding: '32px 32px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)', marginBottom: '10px' }}>
            <Shield style={{ width: '10px', height: '10px', color: TK.accent }} />
            <span style={{ fontSize: '10px', fontWeight: 400, color: TK.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Admin</span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 600, color: TK.text, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
            Audit Log
          </h1>
          <p style={{ fontSize: '13px', color: TK.textMuted, marginTop: '6px' }}>
            {total.toLocaleString()} total entries — immutable record of all admin actions
          </p>
        </div>
        <button
          onClick={() => fetchLogs(1)}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 14px', background: 'transparent', border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '11px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.color = TK.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = TK.border; e.currentTarget.style.color = TK.textMuted; }}
        >
          <RefreshCw style={{ width: '13px', height: '13px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <select
          value={filter.action}
          onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
          style={{ padding: '8px 12px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '12px', outline: 'none' }}
        >
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          type="date"
          value={filter.startDate}
          onChange={e => setFilter(f => ({ ...f, startDate: e.target.value }))}
          style={{ padding: '8px 12px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '12px', outline: 'none' }}
        />
        <input
          type="date"
          value={filter.endDate}
          onChange={e => setFilter(f => ({ ...f, endDate: e.target.value }))}
          style={{ padding: '8px 12px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '12px', outline: 'none' }}
        />
        <button
          onClick={() => fetchLogs(1)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '8px', color: TK.accent, fontSize: '11px', cursor: 'pointer' }}
        >
          <Filter style={{ width: '12px', height: '12px' }} />
          Apply
        </button>
      </div>

      {/* Log Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.15)', borderTopColor: TK.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.5fr', padding: '10px 16px', borderBottom: `1px solid ${TK.border}`, fontSize: '9px', fontWeight: 400, color: TK.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span>Timestamp</span>
            <span>Action</span>
            <span>Actor</span>
            <span>Entity</span>
            <span>Details</span>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: TK.textMuted }}>
              <Shield style={{ width: '28px', height: '28px', margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontSize: '13px', fontWeight: 300 }}>No audit events found</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={log._id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.5fr', padding: '10px 16px', alignItems: 'center', borderBottom: i < logs.length - 1 ? `1px solid rgba(0,0,0,0.04)` : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '10px', color: TK.textMuted }}>{timeFormat(log.createdAt)}</span>
                <span style={{ fontSize: '10px', fontWeight: 400, color: actionColor(log.action), fontFamily: 'monospace' }}>
                  {log.action}
                </span>
                <div>
                  <div style={{ fontSize: '11px', color: TK.text }}>{log.actor?.fullName || log.actorEmail || 'Unknown'}</div>
                  <div style={{ fontSize: '9px', color: TK.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{log.actorRole}</div>
                </div>
                <span style={{ fontSize: '10px', color: TK.textMuted }}>{log.entityType}</span>
                <div style={{ fontSize: '10px', color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.metadata ? JSON.stringify(log.metadata).slice(0, 60) : log.entityId?.toString()?.slice(0, 16) || '—'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1} style={{ padding: '6px 14px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '6px', color: TK.textMuted, fontSize: '11px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>Previous</button>
          <span style={{ padding: '6px 10px', fontSize: '11px', color: TK.textMuted }}>Page {page} of {totalPages}</span>
          <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages} style={{ padding: '6px 14px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '6px', color: TK.textMuted, fontSize: '11px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
