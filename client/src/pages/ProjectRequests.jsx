import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Kanban, Table, Plus, Search, Filter, Calendar, Clock,
  DollarSign, CheckCircle2, AlertTriangle, AlertCircle,
  MessageSquare, User, Building2, Tag, Globe, ExternalLink,
  ChevronRight, RefreshCw, X, ArrowRight, ArrowLeft, Phone,
  Mail, Link2, Copy, Trash2, Edit3, Send, ShieldCheck
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  TK, FONT, PageHeader, Card, Button, IconButton, Badge,
  SearchInput, Select, Modal, Spinner
} from '../admin-ui';

// ─── STAGE DEFINITIONS ────────────────────────────────────────────────────────
const STAGES = [
  { key: 'new',           ar: 'جديد',          en: 'New',           color: '#2563EB', bg: 'rgba(37,99,235,0.08)'  },
  { key: 'contacted',     ar: 'تم التواصل',    en: 'Contacted',     color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
  { key: 'qualified',     ar: 'مؤهل',          en: 'Qualified',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  { key: 'proposal_sent', ar: 'عرض مُرسل',    en: 'Proposal Sent', color: '#D97706', bg: 'rgba(217,119,6,0.08)'  },
  { key: 'negotiating',   ar: 'قيد التفاوض',   en: 'Negotiating',   color: '#EA580C', bg: 'rgba(234,88,12,0.08)'  },
  { key: 'won',           ar: 'تعاقد ناجح',    en: 'Won',           color: '#16A34A', bg: 'rgba(22,163,74,0.08)'  },
  { key: 'lost',          ar: 'معتذر / مغلق',  en: 'Lost',          color: '#64748B', bg: 'rgba(100,116,139,0.08)'},
];

const PRIORITY_BADGES = {
  urgent: { ar: 'عاجل جداً', en: 'Urgent', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  high:   { ar: 'أولوية عالية', en: 'High', color: '#EA580C', bg: 'rgba(234,88,12,0.1)' },
  medium: { ar: 'متوسط',     en: 'Medium', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  low:    { ar: 'منخفض',     en: 'Low',    color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
};

const LOSS_REASONS = [
  { value: 'budget_too_low',    ar: 'الميزانية أقل من الحد الأدنى', en: 'Budget too low' },
  { value: 'chose_competitor',  ar: 'اختار منافساً آخر',            en: 'Chose a competitor' },
  { value: 'ghosted',           ar: 'انقطع التواصل / لم يرد',        en: 'Client stopped responding' },
  { value: 'timing_not_right',  ar: 'التوقيت غير مناسب حالياً',      en: 'Timing not right' },
  { value: 'out_of_scope',      ar: 'المشروع خارج تخصصنا',           en: 'Out of scope' },
  { value: 'other',             ar: 'سبب آخر',                      en: 'Other reason' },
];

export default function ProjectRequests() {
  const { isRTL, language } = useLanguage();
  const font = FONT(isRTL);

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [pipeline, setPipeline] = useState(null);
  const [tableRequests, setTableRequests] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Selected lead for detail/action modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    status: '',
    priority: 'medium',
    estimatedValue: 0,
    nextFollowUpDate: '',
    lossReason: '',
    stageNote: '',
    adminNotes: '',
  });

  // ── Load Pipeline Data ───────────────────────────────────────────────────
  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/project-requests/pipeline');
      setPipeline(res.data.pipeline || {});
      setTotalLeads(res.data.totalLeads || 0);
      setOverdueCount(res.data.overdueCount || 0);
    } catch (err) {
      console.error('Failed to load pipeline:', err);
      toast.error(isRTL ? 'فشل تحميل بيانات مسار المبيعات' : 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  // ── Load Table Data ──────────────────────────────────────────────────────
  const fetchTable = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/project-requests', {
        params: { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }
      });
      setTableRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'kanban') fetchPipeline();
    else fetchTable();
  }, [viewMode, fetchPipeline, fetchTable]);

  // ── Open Lead Modal ──────────────────────────────────────────────────────
  const handleOpenLead = (lead) => {
    setSelectedLead(lead);
    const dt = lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().slice(0, 16) : '';
    setLeadFormData({
      status: lead.status || 'new',
      priority: lead.priority || 'medium',
      estimatedValue: lead.estimatedValue || 0,
      nextFollowUpDate: dt,
      lossReason: lead.lossReason || '',
      stageNote: '',
      adminNotes: lead.adminNotes || '',
    });
  };

  // ── Update Lead ──────────────────────────────────────────────────────────
  const handleSaveLead = async () => {
    if (!selectedLead) return;
    if (leadFormData.status === 'lost' && !leadFormData.lossReason) {
      toast.error(isRTL ? 'يرجى تحديد سبب الاعتذار عند إغلاق الفرصة' : 'Please specify a loss reason');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        status: leadFormData.status,
        priority: leadFormData.priority,
        estimatedValue: Number(leadFormData.estimatedValue) || 0,
        nextFollowUpDate: leadFormData.nextFollowUpDate ? new Date(leadFormData.nextFollowUpDate) : null,
        lossReason: leadFormData.status === 'lost' ? leadFormData.lossReason : undefined,
        stageNote: leadFormData.stageNote,
        adminNotes: leadFormData.adminNotes,
      };

      const res = await api.patch(`/project-requests/${selectedLead._id}/status`, payload);
      toast.success(isRTL ? 'تم تحديث بيانات الفرصة بنجاح' : 'Lead updated successfully');
      setSelectedLead(null);
      if (viewMode === 'kanban') fetchPipeline();
      else fetchTable();
    } catch (err) {
      toast.error(err.response?.data?.error || (isRTL ? 'فشل التحديث' : 'Update failed'));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Fast Stage Mover ─────────────────────────────────────────────────────
  const handleFastMoveStage = async (leadId, newStage) => {
    try {
      await api.patch(`/project-requests/${leadId}/status`, {
        status: newStage,
        stageNote: isRTL ? `تم النقل السريع إلى ${newStage}` : `Moved to ${newStage}`,
      });
      toast.success(isRTL ? 'تم تغيير المرحلة' : 'Stage updated');
      fetchPipeline();
    } catch (err) {
      toast.error(isRTL ? 'فشل نقل المرحلة' : 'Failed to change stage');
    }
  };

  // ── Copy Magic Brief Link ────────────────────────────────────────────────
  const handleCopyMagicLink = (token) => {
    if (!token) return;
    const url = `${window.location.origin}/brief/${token}`;
    navigator.clipboard.writeText(url);
    toast.success(isRTL ? 'تم نسخ رابط استكمال المواصفات' : 'Magic Brief link copied');
  };

  // ── Filtered leads for Kanban ────────────────────────────────────────────
  const filterLead = (lead) => {
    if (!lead) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = (lead.fullName || '').toLowerCase().includes(q) ||
                    (lead.email || '').toLowerCase().includes(q) ||
                    (lead.phoneNumber || '').includes(q) ||
                    (lead.companyName || '').toLowerCase().includes(q) ||
                    (lead.projectDescription || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (serviceFilter !== 'all' && lead.projectType !== serviceFilter) return false;
    return true;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: TK.bg,
      padding: '24px 28px 60px',
      direction: isRTL ? 'rtl' : 'ltr',
      fontFamily: font,
    }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TK.text, margin: '0 0 4px' }}>
            {isRTL ? 'إدارة فرص البيع والطلبات' : 'Sales Pipeline & Inquiries'}
          </h1>
          <p style={{ fontSize: 13, color: TK.textMuted, margin: 0 }}>
            {isRTL
              ? 'متابعة مسار العملاء المحتملين من أول استفسار حتى التعاقد وإصدار العرض'
              : 'Track and qualify prospective client deals from inquiry to closing'}
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            background: TK.surface,
            border: `1px solid ${TK.border}`,
            borderRadius: 10,
            padding: 3,
            gap: 4,
          }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                border: 'none', cursor: 'pointer', fontFamily: font,
                background: viewMode === 'kanban' ? TK.accent : 'transparent',
                color: viewMode === 'kanban' ? '#FFFFFF' : TK.textMuted,
                transition: 'all 0.15s ease',
              }}
            >
              <Kanban style={{ width: 14, height: 14 }} />
              {isRTL ? 'لوحة المسار (Kanban)' : 'Kanban Board'}
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                border: 'none', cursor: 'pointer', fontFamily: font,
                background: viewMode === 'table' ? TK.accent : 'transparent',
                color: viewMode === 'table' ? '#FFFFFF' : TK.textMuted,
                transition: 'all 0.15s ease',
              }}
            >
              <Table style={{ width: 14, height: 14 }} />
              {isRTL ? 'جدول الطلبات' : 'Data Table'}
            </button>
          </div>

          <Button
            size="sm"
            onClick={viewMode === 'kanban' ? fetchPipeline : fetchTable}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        <div style={{
          background: TK.surface, border: `1px solid ${TK.border}`,
          borderRadius: 12, padding: '16px 20px',
        }}>
          <div style={{ fontSize: 12, color: TK.textMuted, marginBottom: 4 }}>
            {isRTL ? 'إجمالي الطلبات والفرص' : 'Total Inquiries'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: TK.text }}>
            {totalLeads}
          </div>
        </div>

        <div style={{
          background: TK.surface, border: `1px solid ${TK.border}`,
          borderRadius: 12, padding: '16px 20px',
        }}>
          <div style={{ fontSize: 12, color: TK.textMuted, marginBottom: 4 }}>
            {isRTL ? 'الفرص النشطة في المسار' : 'Active Pipeline Deals'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: TK.accent }}>
            {pipeline ? (
              (pipeline.new?.leads?.length || 0) +
              (pipeline.contacted?.leads?.length || 0) +
              (pipeline.qualified?.leads?.length || 0) +
              (pipeline.proposal_sent?.leads?.length || 0) +
              (pipeline.negotiating?.leads?.length || 0)
            ) : 0}
          </div>
        </div>

        <div style={{
          background: overdueCount > 0 ? 'rgba(239, 68, 68, 0.05)' : TK.surface,
          border: `1px solid ${overdueCount > 0 ? 'rgba(239, 68, 68, 0.3)' : TK.border}`,
          borderRadius: 12, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: overdueCount > 0 ? '#DC2626' : TK.textMuted, marginBottom: 4 }}>
            {overdueCount > 0 && <AlertCircle style={{ width: 14, height: 14 }} />}
            {isRTL ? 'متابعات متأخرة / مستحقة' : 'Overdue Follow-ups'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: overdueCount > 0 ? '#DC2626' : TK.text }}>
            {overdueCount}
          </div>
        </div>

        <div style={{
          background: TK.surface, border: `1px solid ${TK.border}`,
          borderRadius: 12, padding: '16px 20px',
        }}>
          <div style={{ fontSize: 12, color: TK.textMuted, marginBottom: 4 }}>
            {isRTL ? 'تعاقدات ناجحة (Won)' : 'Deals Won'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#16A34A' }}>
            {pipeline?.won?.leads?.length || 0}
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1', minWidth: 260 }}>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isRTL ? 'بحث بالاسم، الشركة، الهاتف، أو محتوى الطلب...' : 'Search by name, company, phone, notes...'}
          />
        </div>

        <select
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
          style={{
            height: 38, padding: '0 12px', borderRadius: 9,
            border: `1px solid ${TK.border}`, background: TK.surface,
            color: TK.text, fontSize: 12.5, fontFamily: font, outline: 'none',
          }}
        >
          <option value="all">{isRTL ? 'جميع الخدمات والأنظمة' : 'All Services'}</option>
          <option value="website">{isRTL ? 'مواقع ويب' : 'Websites'}</option>
          <option value="ecommerce">{isRTL ? 'متاجر إلكترونية' : 'E-commerce'}</option>
          <option value="saas">{isRTL ? 'منصات SaaS' : 'SaaS Platforms'}</option>
          <option value="mobile">{isRTL ? 'تطبيقات جوال' : 'Mobile Apps'}</option>
          <option value="erp">{isRTL ? 'أنظمة ERP / CRM' : 'ERP / CRM Systems'}</option>
          <option value="automation">{isRTL ? 'أتمتة وسير عمل' : 'Automations'}</option>
          <option value="other">{isRTL ? 'أخرى' : 'Other'}</option>
        </select>
      </div>

      {/* ── VIEW MODE: KANBAN PIPELINE ── */}
      {viewMode === 'kanban' && (
        <div style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 20,
          minHeight: 560,
        }}>
          {STAGES.map((stage) => {
            const columnData = pipeline?.[stage.key] || { leads: [], totalValue: 0 };
            const visibleLeads = columnData.leads.filter(filterLead);

            return (
              <div
                key={stage.key}
                style={{
                  flex: '0 0 290px',
                  background: 'rgba(248,250,252,0.85)',
                  border: `1px solid ${TK.border}`,
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 270px)',
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${TK.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: TK.surface,
                  borderTopLeftRadius: 14,
                  borderTopRightRadius: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: stage.color, display: 'inline-block',
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: TK.text }}>
                      {isRTL ? stage.ar : stage.en}
                    </span>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 99,
                    fontSize: 11, fontWeight: 700,
                    background: stage.bg, color: stage.color,
                  }}>
                    {visibleLeads.length}
                  </span>
                </div>

                {/* Leads Scroll Area */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}>
                  {visibleLeads.length === 0 ? (
                    <div style={{
                      padding: '30px 10px', textAlign: 'center',
                      fontSize: 12, color: TK.textLight,
                    }}>
                      {isRTL ? 'لا توجد فرص هنا' : 'No leads in this stage'}
                    </div>
                  ) : (
                    visibleLeads.map((lead) => {
                      const priority = PRIORITY_BADGES[lead.priority] || PRIORITY_BADGES.medium;
                      const hasPhone = Boolean(lead.phoneNumber && lead.phoneNumber.length > 5);

                      return (
                        <div
                          key={lead._id}
                          style={{
                            background: TK.surface,
                            borderRadius: 12,
                            border: `1px solid ${lead.isOverdue ? 'rgba(239, 68, 68, 0.4)' : TK.border}`,
                            boxShadow: lead.isOverdue ? '0 2px 8px rgba(239, 68, 68, 0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => handleOpenLead(lead)}
                        >
                          {/* Card Top: Priority & Followup SLA */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
                            <span style={{
                              padding: '2px 7px', borderRadius: 6,
                              fontSize: 10, fontWeight: 600,
                              background: priority.bg, color: priority.color,
                            }}>
                              {isRTL ? priority.ar : priority.en}
                            </span>

                            {lead.isOverdue ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontSize: 10, fontWeight: 700, color: '#DC2626',
                                background: 'rgba(220,38,38,0.1)', padding: '2px 6px', borderRadius: 6,
                              }}>
                                <AlertCircle style={{ width: 10, height: 10 }} />
                                {isRTL ? 'تأخرت المتابعة' : 'Overdue'}
                              </span>
                            ) : lead.nextFollowUpDate ? (
                              <span style={{ fontSize: 10.5, color: TK.textMuted, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Clock style={{ width: 10, height: 10 }} />
                                {new Date(lead.nextFollowUpDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            ) : null}
                          </div>

                          {/* Client Name & Company */}
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: TK.text, marginBottom: 2 }}>
                            {lead.fullName}
                          </div>
                          {lead.companyName && (
                            <div style={{ fontSize: 11.5, color: TK.textMuted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                              <Building2 style={{ width: 11, height: 11 }} />
                              {lead.companyName}
                            </div>
                          )}

                          {/* Service & Budget Tags */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '8px 0' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 6,
                              fontSize: 10.5, background: 'rgba(0,0,0,0.04)', color: TK.textSecondary,
                            }}>
                              {lead.projectType || 'General'}
                            </span>
                            {lead.budgetRange && lead.budgetRange !== 'unknown' && (
                              <span style={{
                                padding: '2px 8px', borderRadius: 6,
                                fontSize: 10.5, background: 'rgba(16,185,129,0.08)', color: '#059669', fontWeight: 600,
                              }}>
                                {lead.budgetRange}
                              </span>
                            )}
                          </div>

                          {/* Brief Excerpt */}
                          {lead.projectDescription && (
                            <p style={{
                              fontSize: 11.5, color: TK.textMuted, lineHeight: 1.4,
                              margin: '0 0 10px',
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {lead.projectDescription}
                            </p>
                          )}

                          {/* Card Footer Actions */}
                          <div
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              paddingTop: 8, borderTop: `1px solid ${TK.border}`, marginTop: 8,
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <div style={{ display: 'flex', gap: 6 }}>
                              {hasPhone && (
                                <a
                                  href={`https://wa.me/${lead.phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(isRTL ? `مرحباً ${lead.fullName} 👋 معك فريق YANSY Tech بخصوص طلبك.` : `Hi ${lead.fullName} 👋 This is YANSY Tech regarding your project inquiry.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={isRTL ? 'مراسلة عبر واتساب' : 'Chat on WhatsApp'}
                                  style={{
                                    width: 26, height: 26, borderRadius: 6,
                                    background: '#25D366', color: '#FFFFFF',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    textDecoration: 'none',
                                  }}
                                >
                                  <Phone style={{ width: 12, height: 12 }} />
                                </a>
                              )}
                              {lead.magicToken && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyMagicLink(lead.magicToken)}
                                  title={isRTL ? 'نسخ رابط مواصفات العميل (Magic Brief)' : 'Copy Magic Brief Link'}
                                  style={{
                                    width: 26, height: 26, borderRadius: 6,
                                    background: TK.surface, border: `1px solid ${TK.border}`,
                                    color: TK.textMuted, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  }}
                                >
                                  <Link2 style={{ width: 12, height: 12 }} />
                                </button>
                              )}
                            </div>

                            {/* Quick stage mover dropdown */}
                            <select
                              value={lead.status}
                              onChange={(e) => handleFastMoveStage(lead._id, e.target.value)}
                              style={{
                                fontSize: 11, height: 24, padding: '0 4px', borderRadius: 6,
                                border: `1px solid ${TK.border}`, background: TK.surface,
                                color: TK.textSecondary, fontFamily: font, outline: 'none',
                              }}
                            >
                              {STAGES.map(s => (
                                <option key={s.key} value={s.key}>{isRTL ? s.ar : s.en}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW MODE: DATA TABLE ── */}
      {viewMode === 'table' && (
        <Card style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${TK.border}`, background: 'rgba(0,0,0,0.02)', textAlign: isRTL ? 'right' : 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: TK.textMuted }}>{isRTL ? 'العميل' : 'Client'}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: TK.textMuted }}>{isRTL ? 'نوع المشروع' : 'Service'}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: TK.textMuted }}>{isRTL ? 'الميزانية' : 'Budget'}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: TK.textMuted }}>{isRTL ? 'المرحلة' : 'Stage'}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: TK.textMuted }}>{isRTL ? 'الأولوية' : 'Priority'}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: TK.textMuted }}>{isRTL ? 'تاريخ الورود' : 'Date'}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: TK.textMuted }}>{isRTL ? 'إجراء' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {tableRequests.filter(filterLead).map((req) => (
                <tr
                  key={req._id}
                  style={{ borderBottom: `1px solid ${TK.border}`, cursor: 'pointer' }}
                  onClick={() => handleOpenLead(req)}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: TK.text }}>{req.fullName}</div>
                    <div style={{ fontSize: 11, color: TK.textMuted }}>{req.email || req.phoneNumber || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: TK.textSecondary }}>{req.projectType}</td>
                  <td style={{ padding: '12px 16px', color: TK.textSecondary }}>{req.budgetRange || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: 'rgba(37,99,235,0.08)', color: '#2563EB',
                    }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, color: TK.textMuted }}>{req.priority || 'medium'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: TK.textMuted, fontSize: 12 }}>
                    {new Date(req.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                  </td>
                  <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenLead(req)}
                      style={{
                        padding: '5px 12px', borderRadius: 7,
                        border: `1px solid ${TK.border}`, background: TK.surface,
                        fontSize: 12, cursor: 'pointer', fontFamily: font,
                      }}
                    >
                      {isRTL ? 'تفاصيل' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── LEAD ACTION / DETAIL MODAL ── */}
      {selectedLead && (
        <Modal
          open={Boolean(selectedLead)}
          onClose={() => setSelectedLead(null)}
          title={isRTL ? 'متابعة وإدارة الفرصة البيعية' : 'Manage Lead & Sales Opportunity'}
          width={640}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Client Profile Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.02)',
              border: `1px solid ${TK.border}`,
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TK.text }}>
                  {selectedLead.fullName}
                </div>
                <div style={{ fontSize: 12, color: TK.textMuted, display: 'flex', gap: 12, marginTop: 4 }}>
                  {selectedLead.email && <span>✉️ {selectedLead.email}</span>}
                  {selectedLead.phoneNumber && <span>📞 {selectedLead.phoneNumber}</span>}
                </div>
              </div>

              {selectedLead.magicToken && (
                <button
                  type="button"
                  onClick={() => handleCopyMagicLink(selectedLead.magicToken)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8, fontSize: 11.5,
                    border: `1px solid ${TK.border}`, background: TK.surface,
                    cursor: 'pointer', fontFamily: font,
                  }}
                >
                  <Copy style={{ width: 12, height: 12 }} />
                  {isRTL ? 'رابط العميل (Brief)' : 'Copy Magic Link'}
                </button>
              )}
            </div>

            {/* Project Details Description */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 4 }}>
                {isRTL ? 'وصف المشروع والمواصفات الأولية:' : 'Project Scope / Inquiry Details:'}
              </div>
              <div style={{
                fontSize: 13, color: TK.text, background: TK.surface,
                padding: '10px 14px', borderRadius: 8, border: `1px solid ${TK.border}`,
                lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
              }}>
                {selectedLead.projectDescription || '—'}
              </div>
            </div>

            {/* Pipeline Stage & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 6 }}>
                  {isRTL ? 'مرحلة المسار البيعي (Stage):' : 'Pipeline Stage:'}
                </label>
                <select
                  value={leadFormData.status}
                  onChange={e => setLeadFormData(p => ({ ...p, status: e.target.value }))}
                  style={{
                    width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                    border: `1px solid ${TK.border}`, background: TK.surface,
                    fontSize: 13, fontFamily: font, outline: 'none',
                  }}
                >
                  {STAGES.map(s => (
                    <option key={s.key} value={s.key}>{isRTL ? s.ar : s.en}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 6 }}>
                  {isRTL ? 'الأولوية (Priority):' : 'Priority:'}
                </label>
                <select
                  value={leadFormData.priority}
                  onChange={e => setLeadFormData(p => ({ ...p, priority: e.target.value }))}
                  style={{
                    width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                    border: `1px solid ${TK.border}`, background: TK.surface,
                    fontSize: 13, fontFamily: font, outline: 'none',
                  }}
                >
                  <option value="urgent">{isRTL ? 'عاجل جداً (Urgent)' : 'Urgent'}</option>
                  <option value="high">{isRTL ? 'أولوية عالية (High)' : 'High'}</option>
                  <option value="medium">{isRTL ? 'متوسط (Medium)' : 'Medium'}</option>
                  <option value="low">{isRTL ? 'منخفض (Low)' : 'Low'}</option>
                </select>
              </div>
            </div>

            {/* Next Followup Date & Estimated Value */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 6 }}>
                  {isRTL ? 'موعد المتابعة القادم (Follow-up):' : 'Next Follow-up Date:'}
                </label>
                <input
                  type="datetime-local"
                  value={leadFormData.nextFollowUpDate}
                  onChange={e => setLeadFormData(p => ({ ...p, nextFollowUpDate: e.target.value }))}
                  style={{
                    width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                    border: `1px solid ${TK.border}`, background: TK.surface,
                    fontSize: 12.5, fontFamily: font, outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 6 }}>
                  {isRTL ? 'القيمة التقديرية (USD / EGP):' : 'Estimated Deal Value:'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={leadFormData.estimatedValue}
                  onChange={e => setLeadFormData(p => ({ ...p, estimatedValue: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                    border: `1px solid ${TK.border}`, background: TK.surface,
                    fontSize: 13, fontFamily: font, outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* If Stage is LOST: Require Loss Reason */}
            {leadFormData.status === 'lost' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#DC2626', marginBottom: 6 }}>
                  {isRTL ? 'سبب الاعتذار / خسارة الفرصة (إلزامي):' : 'Reason for Lost Deal (Required):'}
                </label>
                <select
                  value={leadFormData.lossReason}
                  onChange={e => setLeadFormData(p => ({ ...p, lossReason: e.target.value }))}
                  style={{
                    width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                    border: '1px solid rgba(220,38,38,0.5)', background: 'rgba(220,38,38,0.03)',
                    fontSize: 13, fontFamily: font, outline: 'none',
                  }}
                >
                  <option value="">{isRTL ? '-- اختر سبب الرفض أو الاعتذار --' : '-- Select Reason --'}</option>
                  {LOSS_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{isRTL ? r.ar : r.en}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Transition Note */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 6 }}>
                {isRTL ? 'ملاحظة حركة المرحلة (تُسجل في سجل المتابعة):' : 'Stage Transition Note:'}
              </label>
              <input
                type="text"
                value={leadFormData.stageNote}
                onChange={e => setLeadFormData(p => ({ ...p, stageNote: e.target.value }))}
                placeholder={isRTL ? 'مثال: تم التواصل وتحديد موعد مكالمة استكشافية غداً...' : 'e.g., Called client, scheduled demo call tomorrow...'}
                style={{
                  width: '100%', height: 38, padding: '0 10px', borderRadius: 8,
                  border: `1px solid ${TK.border}`, background: TK.surface,
                  fontSize: 12.5, fontFamily: font, outline: 'none',
                }}
              />
            </div>

            {/* Admin Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 6 }}>
                {isRTL ? 'ملاحظات الإدارة الداخلية الدائمة:' : 'Internal Team Notes:'}
              </label>
              <textarea
                rows={3}
                value={leadFormData.adminNotes}
                onChange={e => setLeadFormData(p => ({ ...p, adminNotes: e.target.value }))}
                placeholder={isRTL ? 'ملاحظات خاصة بالفريق لا يراها العميل...' : 'Internal notes visible to team only...'}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: `1px solid ${TK.border}`, background: TK.surface,
                  fontSize: 12.5, fontFamily: font, outline: 'none', resize: 'vertical',
                }}
              />
            </div>

            {/* Stage History Timeline */}
            {selectedLead.stageHistory && selectedLead.stageHistory.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TK.textMuted, marginBottom: 8 }}>
                  {isRTL ? 'سجل متابعات وتطورات الفرصة:' : 'Stage Movement History:'}
                </div>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 6,
                  maxHeight: 110, overflowY: 'auto', paddingRight: 4,
                }}>
                  {selectedLead.stageHistory.slice().reverse().map((h, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontSize: 11.5, padding: '5px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.02)',
                    }}>
                      <span style={{ fontWeight: 600, color: TK.text }}>{h.stage}</span>
                      <span style={{ color: TK.textMuted }}>{h.note || '—'}</span>
                      <span style={{ color: TK.textLight, fontSize: 10 }}>
                        {new Date(h.movedAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dialog Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button
                variant="secondary"
                onClick={() => setSelectedLead(null)}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveLead}
                disabled={actionLoading}
              >
                {actionLoading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
