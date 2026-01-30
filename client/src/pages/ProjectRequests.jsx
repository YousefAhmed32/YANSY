import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Filter, Search, ChevronDown, ChevronUp, Calendar, User, Building2, DollarSign, FileText, CheckCircle, Clock, Circle, X } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';

const ProjectRequests = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { isRTL, dir } = useLanguage();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    clientType: '',
    budgetRange: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    adminNotes: ''
  });

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const statsRef = useRef(null);

  // Theme-aware classes
  const bgClass = isDark ? 'bg-black' : 'bg-white';
  const textClass = isDark ? 'text-white/90' : 'text-gray-900';
  const textMuted = isDark ? 'text-white/60' : 'text-gray-600';
  const textSecondary = isDark ? 'text-white/50' : 'text-gray-500';
  const surfaceClass = isDark ? 'bg-white/5' : 'bg-black/5';
  const borderClass = isDark ? 'border-white/10' : 'border-gray-200';
  const borderLight = isDark ? 'border-white/20' : 'border-gray-300';
  const hoverSurface = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

  const budgetLabels = {
    'less-than-500': t('projectRequests.lessThan500', 'Less than $500'),
    '500-1000': t('projectRequests.500to1000', '$500 – $1,000'),
    '1000-3000': t('projectRequests.1000to3000', '$1,000 – $3,000'),
    '3000-10000': t('projectRequests.3000to10000', '$3,000 – $10,000'),
    '10000-plus': t('projectRequests.10000plus', '$10,000+')
  };

  const statusConfig = {
    new: { 
      label: t('projectRequests.new', 'New'), 
      icon: Circle, 
      color: isDark ? 'text-blue-400 bg-blue-400/10 border-blue-400/30' : 'text-blue-600 bg-blue-50 border-blue-200' 
    },
    'in-progress': { 
      label: t('projectRequests.inProgress', 'In Progress'), 
      icon: Clock, 
      color: isDark ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' : 'text-yellow-600 bg-yellow-50 border-yellow-200' 
    },
    completed: { 
      label: t('projectRequests.completed', 'Completed'), 
      icon: CheckCircle, 
      color: 'text-gold bg-gold/10 border-gold/30' 
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filters]);

  // GSAP entrance animations
  useEffect(() => {
    if (containerRef.current && titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
      );
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1, delay: 0.3 }
        );
      }
    }
  }, [stats]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.clientType) params.append('clientType', filters.clientType);
      if (filters.budgetRange) params.append('budgetRange', filters.budgetRange);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await api.get(`/project-requests?${params.toString()}`);
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error(t('common.error', 'Error loading requests'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/project-requests/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest) return;

    try {
      await api.patch(`/project-requests/${selectedRequest._id}/status`, statusUpdate);
      await fetchRequests();
      await fetchStats();
      setShowStatusModal(false);
      setSelectedRequest(null);
      setStatusUpdate({ status: '', adminNotes: '' });
      toast.success(t('common.success', 'Status updated successfully'));
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(t('projectRequests.updateFailed', 'Failed to update status. Please try again.'));
    }
  };

  const openStatusModal = (request) => {
    setSelectedRequest(request);
    setStatusUpdate({
      status: request.status,
      adminNotes: request.adminNotes || ''
    });
    setShowStatusModal(true);
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.new;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 border rounded-sm text-xs font-light tracking-wide uppercase ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`w-12 h-12 border-2 ${isDark ? 'border-gold/30 border-t-gold' : 'border-gold/50 border-t-gold'} rounded-full animate-spin`}></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`space-y-12 px-4 py-8 ${bgClass} ${textClass} transition-colors duration-300`} dir={dir}>
      {/* Header */}
      <div>
        <h1 
          ref={titleRef}
          className={`text-5xl md:text-6xl font-light tracking-tight mb-4 ${textClass}`}
        >
          {t('projectRequests.title', 'Project Requests')}
        </h1>
        <p className={`text-lg font-light ${textSecondary}`}>
          {t('projectRequests.subtitle', 'Manage and review project requests from potential clients')}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div ref={statsRef} className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 ${isRTL ? 'rtl' : ''}`}>
          <div className={`p-6 ${surfaceClass} border ${borderClass} transition-colors duration-300`}>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 p-3 ${surfaceClass} border ${borderLight} ${isRTL ? 'ml-5' : 'mr-5'}`}>
                <FileText className={`h-6 w-6 ${textMuted}`} />
              </div>
              <div className="w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-light ${textMuted} tracking-wide uppercase`}>
                    {t('projectRequests.totalRequests', 'Total Requests')}
                  </dt>
                  <dd className={`text-2xl font-light ${textClass} mt-1`}>
                    {stats.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className={`p-6 ${surfaceClass} border ${borderClass} transition-colors duration-300`}>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 p-3 ${isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-blue-100 border-blue-200'} border ${isRTL ? 'ml-5' : 'mr-5'}`}>
                <Circle className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className="w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-light ${textMuted} tracking-wide uppercase`}>
                    {t('projectRequests.new', 'New')}
                  </dt>
                  <dd className={`text-2xl font-light ${textClass} mt-1`}>
                    {stats.byStatus?.new || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className={`p-6 ${surfaceClass} border ${borderClass} transition-colors duration-300`}>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 p-3 ${isDark ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-yellow-100 border-yellow-200'} border ${isRTL ? 'ml-5' : 'mr-5'}`}>
                <Clock className={`h-6 w-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <div className="w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-light ${textMuted} tracking-wide uppercase`}>
                    {t('projectRequests.inProgress', 'In Progress')}
                  </dt>
                  <dd className={`text-2xl font-light ${textClass} mt-1`}>
                    {stats.byStatus?.['in-progress'] || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className={`p-6 ${surfaceClass} border ${borderClass} transition-colors duration-300`}>
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 p-3 bg-gold/20 border-gold/30 border ${isRTL ? 'ml-5' : 'mr-5'}`}>
                <CheckCircle className="h-6 w-6 text-gold" />
              </div>
              <div className="w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-light ${textMuted} tracking-wide uppercase`}>
                    {t('projectRequests.completed', 'Completed')}
                  </dt>
                  <dd className={`text-2xl font-light ${textClass} mt-1`}>
                    {stats.byStatus?.completed || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`${surfaceClass} border ${borderClass} p-8 transition-colors duration-300`}>
        <div className={`flex items-center gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Filter className={`w-5 h-5 ${textMuted}`} />
          <h2 className={`text-sm font-light ${textMuted} tracking-widest uppercase`}>
            {t('projectRequests.filters', 'Filters')}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className={`block text-sm font-light ${textMuted} tracking-wide uppercase mb-3`}>
              {t('projectRequests.status', 'Status')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={`w-full px-4 py-3 ${surfaceClass} border-b ${borderLight} ${textClass} font-light focus:outline-none focus:border-gold transition-colors duration-500`}
            >
              <option value="">{t('projectRequests.allStatuses', 'All Statuses')}</option>
              <option value="new">{t('projectRequests.new', 'New')}</option>
              <option value="in-progress">{t('projectRequests.inProgress', 'In Progress')}</option>
              <option value="completed">{t('projectRequests.completed', 'Completed')}</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-light ${textMuted} tracking-wide uppercase mb-3`}>
              {t('projectRequests.clientType', 'Client Type')}
            </label>
            <select
              value={filters.clientType}
              onChange={(e) => handleFilterChange('clientType', e.target.value)}
              className={`w-full px-4 py-3 ${surfaceClass} border-b ${borderLight} ${textClass} font-light focus:outline-none focus:border-gold transition-colors duration-500`}
            >
              <option value="">{t('projectRequests.allTypes', 'All Types')}</option>
              <option value="individual">{t('projectRequests.individual', 'Individual')}</option>
              <option value="company">{t('projectRequests.company', 'Company')}</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-light ${textMuted} tracking-wide uppercase mb-3`}>
              {t('projectRequests.budgetRange', 'Budget Range')}
            </label>
            <select
              value={filters.budgetRange}
              onChange={(e) => handleFilterChange('budgetRange', e.target.value)}
              className={`w-full px-4 py-3 ${surfaceClass} border-b ${borderLight} ${textClass} font-light focus:outline-none focus:border-gold transition-colors duration-500`}
            >
              <option value="">{t('projectRequests.allBudgets', 'All Budgets')}</option>
              {Object.entries(budgetLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-light ${textMuted} tracking-wide uppercase mb-3`}>
              {t('projectRequests.sortBy', 'Sort By')}
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className={`w-full px-4 py-3 ${surfaceClass} border-b ${borderLight} ${textClass} font-light focus:outline-none focus:border-gold transition-colors duration-500`}
            >
              <option value="createdAt">{t('projectRequests.date', 'Date')}</option>
              <option value="budgetRange">{t('projectRequests.budget', 'Budget')}</option>
              <option value="status">{t('projects.status', 'Status')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className={`${surfaceClass} border ${borderClass} transition-colors duration-300`}>
        <div className={`px-8 py-6 border-b ${borderClass}`}>
          <h2 className={`text-xl font-light tracking-wide uppercase ${textClass}`}>
            {t('projectRequests.requests', 'Requests')} ({requests.length})
          </h2>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className={`w-12 h-12 ${textSecondary} mx-auto mb-4`} />
            <p className={`${textSecondary} font-light`}>
              {t('projectRequests.noRequests', 'No project requests found')}
            </p>
          </div>
        ) : (
          <div className={`divide-y ${borderClass}`}>
            {requests.map((request) => (
              <div
                key={request._id}
                className={`p-8 ${hoverSurface} transition-colors duration-300`}
              >
                <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                    <div className={`flex items-center gap-6 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {getStatusBadge(request.status)}
                      <div className={`flex items-center gap-2 text-sm font-light ${textSecondary} ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {request.clientType === 'company' ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <span className="capitalize">{t(`projectRequests.${request.clientType}`, request.clientType)}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-sm font-light ${textSecondary} ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <DollarSign className="w-4 h-4" />
                        {budgetLabels[request.budgetRange] || request.budgetRange}
                      </div>
                      <div className={`flex items-center gap-2 text-sm font-light ${textSecondary} ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Calendar className="w-4 h-4" />
                        {format(new Date(request.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>

                    <h3 className={`text-2xl font-light ${textClass} mb-3`}>
                      {request.fullName}
                      {request.companyName && ` - ${request.companyName}`}
                    </h3>

                    <p className={`${textMuted} font-light mb-6 line-clamp-2`}>
                      {request.projectDescription}
                    </p>

                    <div className={`flex flex-wrap gap-6 text-sm font-light ${textSecondary} ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span>📞 {request.phoneNumber}</span>
                      {request.email && <span>✉️ {request.email}</span>}
                      {request.companySize && (
                        <span>👥 {request.companySize.replace('-', ' ')}</span>
                      )}
                    </div>

                    {expandedRequest === request._id && (
                      <div className={`mt-6 p-6 ${surfaceClass} border ${borderClass}`}>
                        <div className="mb-4">
                          <h4 className={`font-light ${textClass} mb-3 tracking-wide uppercase text-sm`}>
                            {t('projectRequests.projectDescription', 'Project Description')}
                          </h4>
                          <p className={`${isDark ? 'text-white/70' : 'text-gray-700'} font-light whitespace-pre-wrap leading-relaxed`}>
                            {request.projectDescription}
                          </p>
                        </div>
                        {request.adminNotes && (
                          <div className={`mt-4 pt-4 border-t ${borderClass}`}>
                            <h4 className={`font-light ${textClass} mb-3 tracking-wide uppercase text-sm`}>
                              {t('projectRequests.adminNotes', 'Admin Notes')}
                            </h4>
                            <p className={`${isDark ? 'text-white/70' : 'text-gray-700'} font-light whitespace-pre-wrap leading-relaxed`}>
                              {request.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`flex items-start gap-3 ${isRTL ? 'mr-6' : 'ml-6'}`}>
                    <button
                      onClick={() => setExpandedRequest(expandedRequest === request._id ? null : request._id)}
                      className={`p-3 ${textMuted} hover:text-gold transition-colors duration-300`}
                    >
                      {expandedRequest === request._id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => openStatusModal(request)}
                      className="px-6 py-3 border border-gold text-gold text-sm font-light tracking-widest uppercase hover:bg-gold hover:text-black transition-all duration-500"
                    >
                      {t('projectRequests.updateStatus', 'Update Status')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedRequest && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-sm`}>
          <div className={`${bgClass} border ${borderLight} max-w-md w-full p-8 transition-colors duration-300`}>
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className={`text-2xl font-light ${textClass}`}>
                {t('projectRequests.updateRequestStatus', 'Update Request Status')}
              </h3>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedRequest(null);
                  setStatusUpdate({ status: '', adminNotes: '' });
                }}
                className={`p-2 ${textMuted} hover:${textClass} transition-colors duration-300`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-light ${textMuted} tracking-wide uppercase mb-3`}>
                  {t('projectRequests.status', 'Status')}
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                  className={`w-full px-4 py-3 ${surfaceClass} border-b ${borderLight} ${textClass} font-light focus:outline-none focus:border-gold transition-colors duration-500`}
                >
                  <option value="new">{t('projectRequests.new', 'New')}</option>
                  <option value="in-progress">{t('projectRequests.inProgress', 'In Progress')}</option>
                  <option value="completed">{t('projectRequests.completed', 'Completed')}</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-light ${textMuted} tracking-wide uppercase mb-3`}>
                  {t('projectRequests.adminNotes', 'Admin Notes')}
                </label>
                <textarea
                  value={statusUpdate.adminNotes}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, adminNotes: e.target.value }))}
                  rows={4}
                  className={`w-full px-4 py-3 ${surfaceClass} border-b ${borderLight} ${textClass} ${isDark ? 'placeholder-white/30' : 'placeholder-gray-400'} font-light focus:outline-none focus:border-gold transition-colors duration-500 resize-none`}
                  placeholder={t('projectRequests.addNotes', 'Add notes about this request...')}
                />
              </div>
            </div>

            <div className={`flex gap-4 mt-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedRequest(null);
                  setStatusUpdate({ status: '', adminNotes: '' });
                }}
                className={`flex-1 px-6 py-3 border ${borderLight} ${textMuted} hover:${textClass} hover:${borderClass} transition-all duration-300 text-sm font-light tracking-wide uppercase`}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleStatusUpdate}
                className="flex-1 px-6 py-3 border border-gold text-gold text-sm font-light tracking-widest uppercase hover:bg-gold hover:text-black transition-all duration-500"
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
