import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Filter, ChevronDown, ChevronUp, Calendar, User, Building2,
  DollarSign, FileText, CheckCircle, Clock, Circle, X,
  Tag, Globe, Timer, Layers, TrendingUp
} from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';

const ProjectRequests = () => {
  const { t } = useTranslation();
  const { isRTL, dir } = useLanguage();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    clientType: '',
    budgetRange: '',
    projectType: '',
    timeline: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', adminNotes: '' });

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const statsRef = useRef(null);

  const bgClass       = 'bg-white';
  const textClass     = 'text-gray-900';
  const textMuted     = 'text-gray-600';
  const textSecondary = 'text-gray-500';
  const surfaceClass  = 'bg-black/5';
  const borderClass   = 'border-gray-200';
  const borderLight   = 'border-gray-300';
  const hoverSurface  = 'hover:bg-black/5';
  const inputBg       = 'bg-white text-gray-900 hover:bg-gray-50';

  // ─── Label maps ──────────────────────────────────────────────────────────────

  const budgetLabels = {
    'less-than-500': t('projectRequests.lessThan500', 'Less than $500'),
    '500-1000':      t('projectRequests.500to1000',  '$500 – $1,000'),
    '1000-3000':     t('projectRequests.1000to3000', '$1,000 – $3,000'),
    '3000-10000':    t('projectRequests.3000to10000','$3,000 – $10,000'),
    '10000-plus':    t('projectRequests.10000plus',  '$10,000+'),
  };

  const timelineLabels = {
    'asap':       t('projectForm.steps.timeline.options.asap',       'ASAP'),
    '1month':     t('projectForm.steps.timeline.options.1month',     '1 Month'),
    '2-3months':  t('projectForm.steps.timeline.options.2to3months', '2–3 Months'),
    'flexible':   t('projectForm.steps.timeline.options.flexible',   'Flexible'),
  };

  const projectTypeLabels = {
    restaurant: t('projectForm.steps.projectType.options.restaurant', 'Restaurant'),
    clinic:     t('projectForm.steps.projectType.options.clinic',     'Clinic'),
    pharmacy:   t('projectForm.steps.projectType.options.pharmacy',   'Pharmacy'),
    ecommerce:  t('projectForm.steps.projectType.options.ecommerce',  'E-commerce'),
    saas:       t('projectForm.steps.projectType.options.saas',       'SaaS / Platform'),
    realestate: t('projectForm.steps.projectType.options.realestate', 'Real Estate'),
    education:  t('projectForm.steps.projectType.options.education',  'Education'),
    delivery:   t('projectForm.steps.projectType.options.delivery',   'Delivery'),
    other:      t('projectForm.steps.projectType.options.other',      'Other'),
  };

  const statusConfig = {
    new: {
      label: t('projectRequests.new', 'New'),
      icon: Circle,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    'in-progress': {
      label: t('projectRequests.inProgress', 'In Progress'),
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    },
    completed: {
      label: t('projectRequests.completed', 'Completed'),
      icon: CheckCircle,
      color: 'text-[#18181B] bg-[#18181B]/10 border-[#18181B]/30',
    },
  };

  // ─── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => { fetchRequests(); fetchStats(); }, [filters]);

  useEffect(() => {
    if (!containerRef.current || !titleRef.current) return;
    gsap.fromTo(titleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
    );
    if (statsRef.current) {
      gsap.fromTo(statsRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1, delay: 0.3 }
      );
    }
  }, [stats]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api.get(`/project-requests?${params}`);
      setRequests(res.data.requests || []);
    } catch {
      toast.error(t('common.error', 'Error loading requests'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/project-requests/stats');
      setStats(res.data);
    } catch { /* silent */ }
  };

  const handleFilterChange = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const handleStatusUpdate = async () => {
    if (!selectedRequest) return;
    try {
      await api.patch(`/project-requests/${selectedRequest._id}/status`, statusUpdate);
      await fetchRequests(); await fetchStats();
      setShowStatusModal(false); setSelectedRequest(null);
      setStatusUpdate({ status: '', adminNotes: '' });
      toast.success(t('common.success', 'Status updated successfully'));
    } catch {
      toast.error(t('projectRequests.updateFailed', 'Failed to update status.'));
    }
  };

  const openStatusModal = (req) => {
    setSelectedRequest(req);
    setStatusUpdate({ status: req.status, adminNotes: req.adminNotes || '' });
    setShowStatusModal(true);
  };

  // ─── UI helpers ───────────────────────────────────────────────────────────────

  const getStatusBadge = (status) => {
    const cfg = statusConfig[status] || statusConfig.new;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-sm text-xs font-light tracking-wide uppercase ${cfg.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {cfg.label}
      </span>
    );
  };

  const Pill = ({ label }) => (
    <span className="inline-block px-2.5 py-1 text-xs font-light tracking-wide border rounded-full border-gray-200 text-gray-500 bg-gray-50">
      {label}
    </span>
  );

  // ─── Select helper ────────────────────────────────────────────────────────────

  const FilterSelect = ({ label, value, onChange, children }) => (
    <div>
      <label className={`block text-xs font-light ${textMuted} tracking-widest uppercase mb-2`}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 rounded-sm ${inputBg} border-b ${borderLight} font-light focus:outline-none focus:border-[#18181B] transition-colors duration-300 text-sm`}
      >
        {children}
      </select>
    </div>
  );

  // ─── Stat card ────────────────────────────────────────────────────────────────

  const StatCard = ({ icon: Icon, iconClass, label, value }) => (
    <div className={`p-5 ${surfaceClass} border ${borderClass} transition-colors duration-300`}>
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 p-2.5 ${iconClass} border rounded-sm ${isRTL ? 'ml-4' : 'mr-4'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={`text-xs font-light ${textMuted} tracking-widest uppercase`}>{label}</p>
          <p className={`text-2xl font-light ${textClass} mt-0.5`}>{value}</p>
        </div>
      </div>
    </div>
  );

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-[#18181B]/50 border-t-[#18181B] rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className={`space-y-10 px-4 py-8 ${bgClass} ${textClass} transition-colors duration-300`} dir={dir}>

      {/* Header */}
      <div>
        <h1 ref={titleRef} className={`text-5xl md:text-6xl font-light tracking-tight mb-3 ${textClass}`}>
          {t('projectRequests.title', 'Project Requests')}
        </h1>
        <p className={`text-base font-light ${textSecondary}`}>
          {t('projectRequests.subtitle', 'Manage and review project requests from potential clients')}
        </p>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            iconClass={`${surfaceClass} border ${borderLight}`}
            label={t('projectRequests.totalRequests', 'Total')}
            value={stats.total || 0}
          />
          <StatCard
            icon={Circle}
            iconClass="bg-blue-100 border-blue-200 text-blue-600"
            label={t('projectRequests.new', 'New')}
            value={stats.byStatus?.new || 0}
          />
          <StatCard
            icon={Clock}
            iconClass="bg-yellow-100 border-yellow-200 text-yellow-600"
            label={t('projectRequests.inProgress', 'In Progress')}
            value={stats.byStatus?.['in-progress'] || 0}
          />
          <StatCard
            icon={CheckCircle}
            iconClass="bg-[#18181B]/20 border-[#18181B]/30 text-[#18181B]"
            label={t('projectRequests.completed', 'Completed')}
            value={stats.byStatus?.completed || 0}
          />
        </div>
      )}

      {/* ── Extra stats row: project types / timelines ── */}
      {stats && (stats.byProjectType || stats.byTimeline) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* By project type */}
          {stats.byProjectType && Object.keys(stats.byProjectType).length > 0 && (
            <div className={`p-6 ${surfaceClass} border ${borderClass}`}>
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Layers className={`w-4 h-4 ${textMuted}`} />
                <h3 className={`text-xs font-light tracking-widest uppercase ${textMuted}`}>
                  {t('projectRequests.byProjectType', 'By Project Type')}
                </h3>
              </div>
              <div className="space-y-2">
                {Object.entries(stats.byProjectType).map(([type, count]) => (
                  <div key={type} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-sm font-light ${textMuted} capitalize`}>
                      {projectTypeLabels[type] || type}
                    </span>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-1.5 rounded-full bg-[#18181B]/40`} style={{ width: `${Math.max(20, (count / (stats.total || 1)) * 120)}px` }} />
                      <span className={`text-sm font-light ${textClass} w-6 text-right`}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By timeline */}
          {stats.byTimeline && Object.keys(stats.byTimeline).length > 0 && (
            <div className={`p-6 ${surfaceClass} border ${borderClass}`}>
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Timer className={`w-4 h-4 ${textMuted}`} />
                <h3 className={`text-xs font-light tracking-widest uppercase ${textMuted}`}>
                  {t('projectRequests.byTimeline', 'By Timeline')}
                </h3>
              </div>
              <div className="space-y-2">
                {Object.entries(stats.byTimeline).map(([tl, count]) => (
                  <div key={tl} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-sm font-light ${textMuted}`}>
                      {timelineLabels[tl] || tl}
                    </span>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="h-1.5 rounded-full bg-blue-400/40" style={{ width: `${Math.max(20, (count / (stats.total || 1)) * 120)}px` }} />
                      <span className={`text-sm font-light ${textClass} w-6 text-right`}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className={`${surfaceClass} border ${borderClass} p-6 transition-colors duration-300`}>
        <div className={`flex items-center gap-3 mb-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Filter className={`w-4 h-4 ${textMuted}`} />
          <h2 className={`text-xs font-light ${textMuted} tracking-widest uppercase`}>
            {t('projectRequests.filters', 'Filters')}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

          <FilterSelect
            label={t('projectRequests.status', 'Status')}
            value={filters.status}
            onChange={v => handleFilterChange('status', v)}
          >
            <option value="">{t('projectRequests.allStatuses', 'All')}</option>
            <option value="new">{t('projectRequests.new', 'New')}</option>
            <option value="in-progress">{t('projectRequests.inProgress', 'In Progress')}</option>
            <option value="completed">{t('projectRequests.completed', 'Completed')}</option>
          </FilterSelect>

          <FilterSelect
            label={t('projectRequests.clientType', 'Client Type')}
            value={filters.clientType}
            onChange={v => handleFilterChange('clientType', v)}
          >
            <option value="">{t('projectRequests.allTypes', 'All')}</option>
            <option value="individual">{t('projectRequests.individual', 'Individual')}</option>
            <option value="company">{t('projectRequests.company', 'Company')}</option>
          </FilterSelect>

          <FilterSelect
            label={t('projectRequests.budgetRange', 'Budget')}
            value={filters.budgetRange}
            onChange={v => handleFilterChange('budgetRange', v)}
          >
            <option value="">{t('projectRequests.allBudgets', 'All')}</option>
            {Object.entries(budgetLabels).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </FilterSelect>

          {/* NEW: project type filter */}
          <FilterSelect
            label={t('projectForm.steps.projectType.title', 'Project Type')}
            value={filters.projectType}
            onChange={v => handleFilterChange('projectType', v)}
          >
            <option value="">All Types</option>
            {Object.entries(projectTypeLabels).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </FilterSelect>

          {/* NEW: timeline filter */}
          <FilterSelect
            label={t('projectForm.steps.timeline.title', 'Timeline')}
            value={filters.timeline}
            onChange={v => handleFilterChange('timeline', v)}
          >
            <option value="">All</option>
            {Object.entries(timelineLabels).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </FilterSelect>

          <FilterSelect
            label={t('projectRequests.sortBy', 'Sort By')}
            value={filters.sortBy}
            onChange={v => handleFilterChange('sortBy', v)}
          >
            <option value="createdAt">{t('projectRequests.date', 'Date')}</option>
            <option value="budgetRange">{t('projectRequests.budget', 'Budget')}</option>
            <option value="status">{t('projects.status', 'Status')}</option>
          </FilterSelect>

        </div>
      </div>

      {/* ── Requests list ── */}
      <div className={`${surfaceClass} border ${borderClass} transition-colors duration-300`}>
        <div className={`px-6 py-5 border-b ${borderClass} flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className={`text-sm font-light tracking-widest uppercase ${textMuted}`}>
            {t('projectRequests.requests', 'Requests')}
          </h2>
          <span className={`text-sm font-light ${textSecondary}`}>{requests.length}</span>
        </div>

        {requests.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className={`w-10 h-10 ${textSecondary} mx-auto mb-3`} />
            <p className={`${textSecondary} font-light text-sm`}>
              {t('projectRequests.noRequests', 'No project requests found')}
            </p>
          </div>
        ) : (
          <div className={`divide-y ${borderClass}`}>
            {requests.map((request) => (
              <div key={request._id} className={`p-6 ${hoverSurface} transition-colors duration-300`}>
                <div className={`flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>

                  {/* Left: main info */}
                  <div className="flex-1 min-w-0">

                    {/* Row 1: badges */}
                    <div className={`flex flex-wrap items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {getStatusBadge(request.status)}

                      {request.projectType && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-sm text-xs font-light tracking-wide ${
                          'border-gray-200 text-gray-500'
                        }`}>
                          <Layers className="w-3 h-3" />
                          {projectTypeLabels[request.projectType] || request.projectType}
                        </span>
                      )}

                      {request.timeline && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-sm text-xs font-light tracking-wide ${
                          'border-gray-200 text-gray-500'
                        }`}>
                          <Timer className="w-3 h-3" />
                          {timelineLabels[request.timeline] || request.timeline}
                        </span>
                      )}

                      <div className={`flex items-center gap-1.5 text-xs font-light ${textSecondary}`}>
                        {request.clientType === 'company' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        <span className="capitalize">{t(`projectRequests.${request.clientType}`, request.clientType)}</span>
                      </div>

                      <div className={`flex items-center gap-1.5 text-xs font-light ${textSecondary}`}>
                        <DollarSign className="w-3.5 h-3.5" />
                        {budgetLabels[request.budgetRange] || request.budgetRange}
                      </div>

                      <div className={`flex items-center gap-1.5 text-xs font-light ${textSecondary}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(request.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {/* Row 2: name */}
                    <h3 className={`text-xl font-light ${textClass} mb-2`}>
                      {request.fullName}
                      {request.companyName && <span className={`${textSecondary}`}> — {request.companyName}</span>}
                    </h3>

                    {/* Row 3: description preview */}
                    <p className={`${textMuted} font-light text-sm mb-4 line-clamp-2 leading-relaxed`}>
                      {request.projectDescription}
                    </p>

                    {/* Row 4: contact + tags row */}
                    <div className={`flex flex-wrap items-center gap-4 text-xs font-light ${textSecondary} mb-3`}>
                      <span>📞 {request.phoneNumber}</span>
                      {request.email && <span>✉️ {request.email}</span>}
                      {request.companySize && <span>👥 {request.companySize.replace('-', ' ')}</span>}
                      {request.referenceUrl && (
                        <a
                          href={request.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#18181B] hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          <Globe className="w-3 h-3" />
                          {t('projectForm.steps.reference.title', 'Reference')}
                        </a>
                      )}
                    </div>

                    {/* Tags */}
                    {request.tags && request.tags.length > 0 && (
                      <div className={`flex flex-wrap gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {request.tags.slice(0, 8).map(tag => <Pill key={tag} label={tag} />)}
                        {request.tags.length > 8 && (
                          <Pill label={`+${request.tags.length - 8}`} />
                        )}
                      </div>
                    )}

                    {/* Expanded detail */}
                    {expandedRequest === request._id && (
                      <div className={`mt-5 p-5 ${surfaceClass} border ${borderClass} space-y-4`}>
                        <div>
                          <h4 className={`text-xs font-light ${textClass} mb-2 tracking-widest uppercase`}>
                            {t('projectRequests.projectDescription', 'Project Description')}
                          </h4>
                          <p className="text-gray-700 font-light text-sm whitespace-pre-wrap leading-relaxed">
                            {request.projectDescription}
                          </p>
                        </div>

                        {request.referenceUrl && (
                          <div className={`pt-4 border-t ${borderClass}`}>
                            <h4 className={`text-xs font-light ${textClass} mb-2 tracking-widest uppercase`}>
                              {t('projectForm.steps.reference.title', 'Reference URL')}
                            </h4>
                            <a
                              href={request.referenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#18181B] text-sm font-light hover:underline break-all"
                            >
                              {request.referenceUrl}
                            </a>
                          </div>
                        )}

                        {request.tags && request.tags.length > 0 && (
                          <div className={`pt-4 border-t ${borderClass}`}>
                            <h4 className={`text-xs font-light ${textClass} mb-3 tracking-widest uppercase`}>
                              {t('projectForm.steps.tags.title', 'Requested Features')}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {request.tags.map(tag => <Pill key={tag} label={tag} />)}
                            </div>
                          </div>
                        )}

                        {request.adminNotes && (
                          <div className={`pt-4 border-t ${borderClass}`}>
                            <h4 className={`text-xs font-light ${textClass} mb-2 tracking-widest uppercase`}>
                              {t('projectRequests.adminNotes', 'Admin Notes')}
                            </h4>
                            <p className="text-gray-700 font-light text-sm whitespace-pre-wrap leading-relaxed">
                              {request.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className={`flex flex-col items-end gap-2 flex-shrink-0 ${isRTL ? 'items-start' : ''}`}>
                    <button
                      onClick={() => setExpandedRequest(expandedRequest === request._id ? null : request._id)}
                      className={`p-2 ${textMuted} hover:text-[#18181B] transition-colors duration-300`}
                    >
                      {expandedRequest === request._id
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openStatusModal(request)}
                      className="px-4 py-2 border border-[#18181B] text-[#18181B] text-xs font-light tracking-widest uppercase hover:bg-[#18181B] hover:text-white transition-all duration-500 whitespace-nowrap"
                    >
                      {t('projectRequests.updateStatus', 'Update')}
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Status modal ── */}
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${bgClass} border ${borderLight} max-w-md w-full p-8 transition-colors duration-300`}>
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className={`text-xl font-light ${textClass}`}>
                {t('projectRequests.updateRequestStatus', 'Update Request Status')}
              </h3>
              <button
                onClick={() => { setShowStatusModal(false); setSelectedRequest(null); setStatusUpdate({ status: '', adminNotes: '' }); }}
                className={`p-2 ${textMuted} hover:text-[#18181B] transition-colors duration-300`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className={`block text-xs font-light ${textMuted} tracking-widest uppercase mb-2`}>
                  {t('projectRequests.status', 'Status')}
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={e => setStatusUpdate(p => ({ ...p, status: e.target.value }))}
                  className={`w-full px-4 py-3 ${surfaceClass} border-b ${borderLight} ${textClass} font-light focus:outline-none focus:border-[#18181B] transition-colors duration-300`}
                >
                  <option value="new">{t('projectRequests.new', 'New')}</option>
                  <option value="in-progress">{t('projectRequests.inProgress', 'In Progress')}</option>
                  <option value="completed">{t('projectRequests.completed', 'Completed')}</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-light ${textMuted} tracking-widest uppercase mb-2`}>
                  {t('projectRequests.adminNotes', 'Admin Notes')}
                </label>
                <textarea
                  value={statusUpdate.adminNotes}
                  onChange={e => setStatusUpdate(p => ({ ...p, adminNotes: e.target.value }))}
                  rows={4}
                  className={`w-full px-4 py-3 ${surfaceClass} border-b ${borderLight} ${textClass} placeholder-gray-400 font-light focus:outline-none focus:border-[#18181B] transition-colors duration-300 resize-none`}
                  placeholder={t('projectRequests.addNotes', 'Add notes about this request...')}
                />
              </div>
            </div>

            <div className={`flex gap-3 mt-7 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => { setShowStatusModal(false); setSelectedRequest(null); setStatusUpdate({ status: '', adminNotes: '' }); }}
                className={`flex-1 px-4 py-3 border ${borderLight} ${textMuted} text-xs font-light tracking-widest uppercase hover:border-[#18181B] transition-all duration-300`}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleStatusUpdate}
                className="flex-1 px-4 py-3 border border-[#18181B] text-[#18181B] text-xs font-light tracking-widest uppercase hover:bg-[#18181B] hover:text-white transition-all duration-500"
              >
                {t('projectRequests.update', 'Update')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectRequests;