import { useEffect, useState } from 'react';
import {
  Star, StarHalf, TrendingUp, AlertTriangle, CheckCircle,
  Flag, Trash2, Filter, Calendar, User, Building2,
  MessageSquare, BarChart3,
} from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, PageHeader, StatCard, DataTable, Select, Badge,
  IconButton, Card, SectionHead, ConfirmDialog, PageSpinner,
} from '../admin-ui';

// ── Rating → tone/color helpers ────────────────────────────────────────────────
const ratingTone  = (rating) => rating >= 4 ? 'info' : rating >= 3 ? 'warning' : 'danger';
const ratingColor = (rating) => rating >= 4 ? TK.accent : rating >= 3 ? TK.amber : TK.red;

const renderStars = (rating, size = 14) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={i} style={{ width: size, height: size, color: TK.accent, fill: TK.accent }} />);
  }
  if (hasHalfStar && fullStars < 5) {
    stars.push(<StarHalf key="half" style={{ width: size, height: size, color: TK.accent, fill: TK.accent }} />);
  }
  for (let i = stars.length; i < 5; i++) {
    stars.push(<Star key={i} style={{ width: size, height: size, color: TK.border, fill: TK.border }} />);
  }
  return stars;
};

const getActionDescriptions = (language) => ({
  delete:      language === 'ar' ? 'هل أنت متأكد من حذف هذا التقييم؟' : 'Are you sure you want to delete this feedback?',
  flag:        language === 'ar' ? 'هل تريد وضع علامة على هذا التقييم للمراجعة؟' : 'Flag this feedback for review?',
  unflag:      language === 'ar' ? 'إزالة العلامة من هذا التقييم؟' : 'Remove flag from this feedback?',
  highlight:   language === 'ar' ? 'إبراز هذا التقييم للعرض العام؟' : 'Highlight this feedback for public display?',
  unhighlight: language === 'ar' ? 'إزالة الإبراز من هذا التقييم؟' : 'Remove highlight from this feedback?',
  review:      language === 'ar' ? 'وضع علامة على هذا التقييم كمُراجَع؟' : 'Mark this feedback as reviewed?',
});

const getReviewedOptions = (language) => [
  { value: '', label: language === 'ar' ? 'الكل' : 'All' },
  { value: 'true', label: language === 'ar' ? 'تمت المراجعة' : 'Reviewed' },
  { value: 'false', label: language === 'ar' ? 'لم تتم المراجعة' : 'Not Reviewed' },
];
const getFlaggedOptions = (language) => [
  { value: '', label: language === 'ar' ? 'الكل' : 'All' },
  { value: 'true', label: language === 'ar' ? 'مُعلَّم' : 'Flagged' },
  { value: 'false', label: language === 'ar' ? 'غير مُعلَّم' : 'Not Flagged' },
];
const getMinRatingOptions = (language) => [
  { value: '', label: language === 'ar' ? 'كل التقييمات' : 'All Ratings' },
  { value: '5', label: language === 'ar' ? '5 نجوم' : '5 Stars' },
  { value: '4', label: language === 'ar' ? '4+ نجوم' : '4+ Stars' },
  { value: '3', label: language === 'ar' ? '3+ نجوم' : '3+ Stars' },
  { value: '2', label: language === 'ar' ? '2+ نجوم' : '2+ Stars' },
];
const getSortOptions = (language) => [
  { value: 'createdAt', label: language === 'ar' ? 'التاريخ' : 'Date' },
  { value: 'ratings.overall', label: language === 'ar' ? 'التقييم' : 'Rating' },
];

const AdminFeedback = () => {
  const { language } = useLanguage();
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    isReviewed: '',
    isFlagged: '',
    isHighlighted: '',
    minRating: '',
    feedbackType: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [filters]);


  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/feedback?${params.toString()}`);
      setFeedback(response.data.feedback || []);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      toast.error(language === 'ar' ? 'فشل تحميل التقييمات' : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/feedback/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAction = async (action, feedbackId) => {
    try {
      const updates = {};

      switch (action) {
        case 'review':
          updates.isReviewed = true;
          break;
        case 'flag':
          updates.isFlagged = true;
          break;
        case 'unflag':
          updates.isFlagged = false;
          break;
        case 'highlight':
          updates.isHighlighted = true;
          break;
        case 'unhighlight':
          updates.isHighlighted = false;
          break;
        case 'delete':
          updates.isDeleted = true;
          break;
        default:
          return;
      }

      await api.patch(`/feedback/${feedbackId}`, updates);
      toast.success(language === 'ar' ? 'تم تحديث التقييم بنجاح' : 'Feedback updated successfully');
      fetchFeedback();
      fetchStats();
      setShowModal(false);
      setSelectedFeedback(null);
    } catch (error) {
      console.error('Failed to update feedback:', error);
      toast.error(language === 'ar' ? 'فشل تحديث التقييم' : 'Failed to update feedback');
    }
  };

  const openActionModal = (action, fb) => {
    setModalAction(action);
    setSelectedFeedback(fb);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFeedback(null);
  };

  const columns = [
    {
      key: 'reviewer', label: language === 'ar' ? 'المُراجِع' : 'Reviewer', width: '24%',
      render: (fb) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {fb.isAnonymous ? <User style={{ width: '13px', height: '13px', color: TK.textLight, flexShrink: 0 }} /> : <Building2 style={{ width: '13px', height: '13px', color: TK.textLight, flexShrink: 0 }} />}
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text }}>{fb.isAnonymous ? (language === 'ar' ? 'مجهول' : 'Anonymous') : fb.name}</span>
            {fb.isHighlighted && <Badge tone="info">{language === 'ar' ? 'مُبرز' : 'Highlighted'}</Badge>}
          </div>
          {fb.projectId && <div style={{ fontSize: '10.5px', color: TK.textMuted, marginBottom: '2px' }}>{language === 'ar' ? 'المشروع' : 'Project'}: {fb.projectId.title}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: TK.textLight }}>
            <Calendar style={{ width: '10px', height: '10px' }} />
            {format(new Date(fb.createdAt), 'MMM d, yyyy')}
          </div>
        </div>
      ),
    },
    {
      key: 'rating', label: language === 'ar' ? 'التقييم' : 'Rating', width: '14%',
      render: (fb) => {
        const avg = (
          (fb.ratings.quality + fb.ratings.speed + fb.ratings.communication +
           fb.ratings.professionalism + fb.ratings.overall) / 5
        ).toFixed(1);
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '3px' }}>
              {renderStars(parseFloat(avg))}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: ratingColor(parseFloat(avg)) }}>{avg}</span>
          </div>
        );
      },
    },
    {
      key: 'breakdown', label: language === 'ar' ? 'التفصيل' : 'Breakdown', width: '16%',
      render: (fb) => (
        <span style={{ fontSize: '10.5px', color: TK.textMuted, lineHeight: 1.7 }}>
          Q:{fb.ratings.quality} · S:{fb.ratings.speed} · C:{fb.ratings.communication}<br />
          P:{fb.ratings.professionalism} · O:{fb.ratings.overall}
        </span>
      ),
    },
    {
      key: 'review', label: language === 'ar' ? 'المراجعة' : 'Review', width: '24%',
      render: (fb) => fb.reviewText ? (
        <span style={{
          fontSize: '11.5px', color: TK.textMuted, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {fb.reviewText}
        </span>
      ) : <span style={{ fontSize: '11px', color: TK.textLight }}>—</span>,
    },
    {
      key: 'flags', label: language === 'ar' ? 'العلامات' : 'Flags', width: '8%',
      render: (fb) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          {fb.isFlagged && <Badge tone="danger">{language === 'ar' ? 'مُعلَّم' : 'Flagged'}</Badge>}
          {fb.ratings.overall <= 2 && <Badge tone="warning">{language === 'ar' ? 'منخفض' : 'Low'}</Badge>}
        </div>
      ),
    },
    {
      key: 'actions', label: language === 'ar' ? 'الإجراءات' : 'Actions', width: '14%', align: 'right',
      render: (fb) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }} onClick={e => e.stopPropagation()}>
          {!fb.isReviewed && (
            <IconButton icon={CheckCircle} size={30} onClick={() => openActionModal('review', fb)} title={language === 'ar' ? 'وضع علامة كمُراجَع' : 'Mark as Reviewed'} />
          )}
          <IconButton
            icon={Flag} size={30}
            onClick={() => openActionModal(fb.isFlagged ? 'unflag' : 'flag', fb)}
            title={fb.isFlagged ? (language === 'ar' ? 'إزالة العلامة' : 'Unflag') : (language === 'ar' ? 'وضع علامة' : 'Flag')}
            style={fb.isFlagged ? { color: TK.red } : undefined}
          />
          <IconButton
            icon={Star} size={30}
            onClick={() => openActionModal(fb.isHighlighted ? 'unhighlight' : 'highlight', fb)}
            title={fb.isHighlighted ? (language === 'ar' ? 'إزالة الإبراز' : 'Unhighlight') : (language === 'ar' ? 'إبراز' : 'Highlight')}
            style={fb.isHighlighted ? { color: TK.accent } : undefined}
          />
          <IconButton icon={Trash2} size={30} onClick={() => openActionModal('delete', fb)} title={language === 'ar' ? 'حذف' : 'Delete'} />
        </div>
      ),
    },
  ];

  if (loading && !stats) {
    return (
      <div style={{ minHeight: '100vh', background: TK.bg }}>
        <PageSpinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: 'clamp(20px,3vw,32px) clamp(16px,3vw,32px) 60px' }}>

      <PageHeader
        icon={Star}
        eyebrow={language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
        title={language === 'ar' ? 'ذكاء التقييمات' : 'Feedback Intelligence'}
        subtitle={language === 'ar' ? 'مراقبة جودة الخدمة ورضا العملاء' : 'Monitor service quality and client satisfaction'}
      />

      {/* Statistics Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <StatCard icon={Star}          label={language === 'ar' ? 'المتوسط العام' : 'Overall Average'}  value={`${stats.overallAverage} / 5`}       tone={ratingTone(parseFloat(stats.overallAverage))} highlight />
          <StatCard icon={MessageSquare} label={language === 'ar' ? 'إجمالي التقييمات' : 'Total Feedback'}   value={stats.totalFeedback}                 tone="neutral" />
          <StatCard icon={TrendingUp}    label={language === 'ar' ? 'تقييمات 5 نجوم' : '5★ Reviews'}       value={`${stats.fiveStarPercentage}%`}      tone="success" />
          <StatCard icon={AlertTriangle} label={language === 'ar' ? 'رضا منخفض' : 'Low Satisfaction'} value={stats.lowSatisfactionCount}          tone="danger" />
        </div>
      )}

      {/* Average Ratings by Category */}
      {stats && (
        <Card style={{ marginBottom: '20px' }}>
          <SectionHead icon={BarChart3} title={language === 'ar' ? 'متوسط التقييمات حسب الفئة' : 'Average Ratings by Category'} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
            {Object.entries(stats.averageRatings).map(([category, rating]) => (
              <div key={category} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {language === 'ar'
                    ? ({ quality: 'الجودة', speed: 'السرعة', communication: 'التواصل', professionalism: 'الاحترافية', overall: 'التقييم العام' }[category] || category)
                    : (category.charAt(0).toUpperCase() + category.slice(1))}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '6px' }}>
                  {renderStars(parseFloat(rating), 13)}
                </div>
                <p style={{ fontSize: '18px', fontWeight: 700, color: ratingColor(parseFloat(rating)), margin: 0 }}>
                  {rating}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rating Distribution Chart */}
      {stats && (
        <Card style={{ marginBottom: '20px' }}>
          <SectionHead icon={TrendingUp} title={language === 'ar' ? 'توزيع التقييمات' : 'Rating Distribution'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0;
              const percentage = stats.totalFeedback > 0
                ? (count / stats.totalFeedback) * 100
                : 0;
              const color = star >= 4 ? TK.green : star === 3 ? TK.amber : TK.red;
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '36px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: TK.textMuted }}>{star}</span>
                    <Star style={{ width: '11px', height: '11px', color: TK.accent, fill: TK.accent }} />
                  </div>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percentage}%`, background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: TK.textMuted, width: '84px', textAlign: 'right', flexShrink: 0 }}>
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '20px' }}>
        <SectionHead icon={Filter} title={language === 'ar' ? 'التصفية' : 'Filters'} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {language === 'ar' ? 'حالة المراجعة' : 'Reviewed Status'}
            </label>
            <Select
              value={filters.isReviewed}
              onChange={(e) => setFilters(prev => ({ ...prev, isReviewed: e.target.value }))}
              options={getReviewedOptions(language)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {language === 'ar' ? 'مُعلَّم' : 'Flagged'}
            </label>
            <Select
              value={filters.isFlagged}
              onChange={(e) => setFilters(prev => ({ ...prev, isFlagged: e.target.value }))}
              options={getFlaggedOptions(language)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {language === 'ar' ? 'أقل تقييم' : 'Minimum Rating'}
            </label>
            <Select
              value={filters.minRating}
              onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value }))}
              options={getMinRatingOptions(language)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {language === 'ar' ? 'الترتيب حسب' : 'Sort By'}
            </label>
            <Select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              options={getSortOptions(language)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Card>

      {/* Feedback Table */}
      <DataTable
        columns={columns}
        rows={feedback}
        loading={loading}
        emptyIcon={MessageSquare}
        emptyTitle={language === 'ar' ? 'لا توجد تقييمات' : 'No feedback found'}
        footer={language === 'ar' ? `كل التقييمات (${feedback.length})` : `All Feedback (${feedback.length})`}
      />

      {/* Action Confirmation Modal */}
      <ConfirmDialog
        open={showModal}
        onClose={closeModal}
        onConfirm={() => handleAction(modalAction, selectedFeedback?._id)}
        title={language === 'ar' ? 'تأكيد الإجراء' : 'Confirm Action'}
        description={getActionDescriptions(language)[modalAction] || ''}
        confirmLabel={language === 'ar' ? 'تأكيد' : 'Confirm'}
        danger={modalAction === 'delete'}
      />
    </div>
  );
};

export default AdminFeedback;
