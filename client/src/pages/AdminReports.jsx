import { useEffect, useState, useCallback } from 'react';
import {
  Flag, AlertTriangle, CheckCircle, Clock, Eye, Trash2,
  RefreshCw, Filter, ChevronRight, Shield, MessageSquare,
  FolderKanban, Users
} from 'lucide-react';
import api from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { timeAgo } from '../utils/time';

const TYPE_CONFIG = {
  abuse:                 { label: 'Abuse',               color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  spam:                  { label: 'Spam',                color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  fraud:                 { label: 'Fraud',               color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  harassment:            { label: 'Harassment',          color: '#e879f9', bg: 'rgba(232,121,249,0.12)' },
  inappropriate_content: { label: 'Inappropriate',       color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  other:                 { label: 'Other',               color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  under_review: { label: 'Under Review', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  resolved:     { label: 'Resolved',     color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  dismissed:    { label: 'Dismissed',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

const TARGET_ICONS = {
  user:    Users,
  project: FolderKanban,
  message: MessageSquare,
};

const AdminReports = () => {
  const { isDark }   = useTheme();
  const { dir, language } = useLanguage();

  const [reports,  setReports]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const LIMIT = 15;

  const bg       = isDark ? '#080806' : '#fafaf9';
  const surface  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = isDark ? '#f5f5f0' : '#0a0a0a';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const gold     = '#d4af37';

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
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateStatus = async (reportId, status, adminNotes) => {
    try {
      await api.patch(`/reports/${reportId}`, { status, adminNotes });
      toast.success(`Report marked as ${STATUS_CONFIG[status]?.label || status}`);
      fetchReports();
      setSelected(null);
    } catch {
      toast.error('Failed to update report');
    }
  };

  const deleteReport = async (reportId) => {
    if (!confirm('Delete this report permanently?')) return;
    try {
      await api.delete(`/reports/${reportId}`);
      toast.success('Report deleted');
      fetchReports();
      setSelected(null);
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const statCards = [
    { label: 'Total Reports',  value: stats?.total        || 0, color: gold,      icon: Flag },
    { label: 'Pending',        value: stats?.pending       || 0, color: '#f59e0b', icon: Clock },
    { label: 'Under Review',   value: stats?.underReview   || 0, color: '#60a5fa', icon: Eye },
    { label: 'Resolved',       value: stats?.resolved      || 0, color: '#34d399', icon: CheckCircle },
  ];

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: bg, padding: '32px 32px 60px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 20,
          border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)',
          marginBottom: 10,
        }}>
          <Shield style={{ width: 10, height: 10, color: gold }} />
          <span style={{ fontSize: 10, fontWeight: 400, color: gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Trust & Safety
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 600, color: textMain, margin: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>
            Reports &amp; Moderation
          </h1>
          <button
            onClick={fetchReports}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: 'transparent',
              border: `1px solid ${border}`, borderRadius: 8,
              color: textMuted, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.color = gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {statCards.map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{
            padding: '18px 20px', background: surface,
            border: `1px solid ${border}`, borderRadius: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: `${color}15`, border: `1px solid ${color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
            }}>
              <Icon style={{ width: 15, height: 15, color }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 600, color: textMain, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: textMuted, marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'under_review', 'resolved', 'dismissed'].map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: 6,
              border: `1px solid ${filter === f ? gold : border}`,
              background: filter === f ? 'rgba(212,175,55,0.1)' : 'transparent',
              color: filter === f ? gold : textMuted,
              fontSize: 11, fontWeight: filter === f ? 400 : 300,
              letterSpacing: '0.08em', textTransform: 'capitalize',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {f === 'all' ? 'All Reports' : STATUS_CONFIG[f]?.label || f}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        {/* Report list */}
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(212,175,55,0.15)', borderTopColor: gold, animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Flag style={{ width: 28, height: 28, color: textMuted, margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: 13, color: textMuted, fontWeight: 300 }}>No reports found</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {['Type', 'Target', 'Reporter', 'Description', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => {
                  const typeCfg   = TYPE_CONFIG[r.type] || TYPE_CONFIG.other;
                  const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                  const TargetIcon = TARGET_ICONS[r.targetType] || Flag;
                  return (
                    <tr
                      key={r._id}
                      onClick={() => setSelected(selected?._id === r._id ? null : r)}
                      style={{
                        borderBottom: `1px solid ${border}`,
                        cursor: 'pointer',
                        background: selected?._id === r._id ? 'rgba(212,175,55,0.04)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (selected?._id !== r._id) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                      onMouseLeave={e => { if (selected?._id !== r._id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 10,
                          background: typeCfg.bg, color: typeCfg.color,
                          border: `1px solid ${typeCfg.color}30`, fontWeight: 300,
                        }}>
                          {typeCfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <TargetIcon style={{ width: 12, height: 12, color: textMuted }} />
                          <span style={{ fontSize: 11, color: textMuted, fontWeight: 300, textTransform: 'capitalize' }}>{r.targetType}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 12, color: textMain, fontWeight: 300 }}>
                          {r.reporter?.fullName || r.reporter?.email || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 10, color: textMuted }}>{r.reporter?.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: 220 }}>
                        <div style={{ fontSize: 11, color: textMuted, fontWeight: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.description}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 10,
                          background: statusCfg.bg, color: statusCfg.color,
                          border: `1px solid ${statusCfg.color}30`, fontWeight: 300,
                        }}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 10, color: textMuted }}>
                        {timeAgo(r.createdAt, language)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <ChevronRight style={{ width: 12, height: 12, color: textMuted }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {total > LIMIT && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 0', borderTop: `1px solid ${border}` }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 12px', borderRadius: 5, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 11 }}>
                Prev
              </button>
              <span style={{ fontSize: 11, color: textMuted, padding: '5px 8px' }}>
                {page} / {Math.ceil(total / LIMIT)}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)} style={{ padding: '5px 12px', borderRadius: 5, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: page >= Math.ceil(total / LIMIT) ? 'not-allowed' : 'pointer', fontSize: 11 }}>
                Next
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: 24, alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 300, color: textMain, margin: 0 }}>Report Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 2 }}>✕</button>
            </div>

            {[
              { label: 'Type',       value: TYPE_CONFIG[selected.type]?.label || selected.type },
              { label: 'Target',     value: `${selected.targetType} — ${selected.targetId}` },
              { label: 'Reporter',   value: selected.reporter?.fullName || selected.reporter?.email },
              { label: 'Status',     value: STATUS_CONFIG[selected.status]?.label || selected.status },
              { label: 'Submitted',  value: new Date(selected.createdAt).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, color: textMain, fontWeight: 300 }}>{value}</div>
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
              <p style={{ fontSize: 12, color: textMain, fontWeight: 300, lineHeight: 1.7, margin: 0, padding: 12, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 6, border: `1px solid ${border}` }}>
                {selected.description}
              </p>
            </div>

            {selected.adminNotes && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Admin Notes</div>
                <p style={{ fontSize: 12, color: textMuted, fontWeight: 300, lineHeight: 1.7, margin: 0 }}>{selected.adminNotes}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.status !== 'under_review' && (
                <button onClick={() => updateStatus(selected._id, 'under_review')} style={{ padding: '9px 16px', borderRadius: 6, border: `1px solid rgba(96,165,250,0.4)`, background: 'rgba(96,165,250,0.08)', color: '#60a5fa', fontSize: 11, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                  Mark Under Review
                </button>
              )}
              {selected.status !== 'resolved' && (
                <button onClick={() => updateStatus(selected._id, 'resolved')} style={{ padding: '9px 16px', borderRadius: 6, border: `1px solid rgba(52,211,153,0.4)`, background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 11, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                  Mark Resolved
                </button>
              )}
              {selected.status !== 'dismissed' && (
                <button onClick={() => updateStatus(selected._id, 'dismissed')} style={{ padding: '9px 16px', borderRadius: 6, border: `1px solid rgba(148,163,184,0.3)`, background: 'transparent', color: textMuted, fontSize: 11, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                  Dismiss
                </button>
              )}
              <button onClick={() => deleteReport(selected._id)} style={{ padding: '9px 16px', borderRadius: 6, border: `1px solid rgba(248,113,113,0.3)`, background: 'transparent', color: '#f87171', fontSize: 11, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                Delete Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
