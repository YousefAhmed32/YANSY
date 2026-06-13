import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Star, StarHalf, TrendingUp, AlertTriangle, CheckCircle, 
  Flag, Eye, Trash2, X, Filter, Calendar, User, Building2,
  BarChart3, MessageSquare
} from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';

const AdminFeedback = () => {
  const { t } = useTranslation();
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

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [filters]);

  useEffect(() => {
    if (containerRef.current && titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
      );
      if (statsRef.current && stats) {
        gsap.fromTo(
          statsRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1, delay: 0.3 }
        );
      }
    }
  }, [stats]);

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
      toast.error('Failed to load feedback');
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
      toast.success('Feedback updated successfully');
      fetchFeedback();
      fetchStats();
      setShowModal(false);
      setSelectedFeedback(null);
    } catch (error) {
      console.error('Failed to update feedback:', error);
      toast.error('Failed to update feedback');
    }
  };

  const openActionModal = (action, fb) => {
    setModalAction(action);
    setSelectedFeedback(fb);
    setShowModal(true);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />);
    }
    if (hasHalfStar && fullStars < 5) {
      stars.push(<StarHalf key="half" className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-white/20 fill-white/10" />);
    }
    return stars;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-[#d4af37]';
    if (rating >= 3) return 'text-yellow-400';
    if (rating >= 2) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-12 px-4 py-8">
      {/* Header */}
      <div>
        <h1 
          ref={titleRef}
          className="text-5xl md:text-6xl font-light tracking-tight mb-4 text-white/90"
        >
          Feedback Intelligence
        </h1>
        <p className="text-lg font-light text-white/50">
          Monitor service quality and client satisfaction
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div ref={statsRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white/5 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-[#d4af37]/20 border border-[#d4af37]/30">
                <Star className="h-6 w-6 text-[#d4af37]" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-light text-white/60 tracking-wide uppercase">
                    Overall Average
                  </dt>
                  <dd className={`text-2xl font-light mt-1 ${getRatingColor(parseFloat(stats.overallAverage))}`}>
                    {stats.overallAverage} / 5
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-white/10 border border-white/20">
                <MessageSquare className="h-6 w-6 text-white/70" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-light text-white/60 tracking-wide uppercase">
                    Total Feedback
                  </dt>
                  <dd className="text-2xl font-light text-white/90 mt-1">
                    {stats.totalFeedback}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-[#d4af37]/20 border border-[#d4af37]/30">
                <TrendingUp className="h-6 w-6 text-[#d4af37]" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-light text-white/60 tracking-wide uppercase">
                    5★ Reviews
                  </dt>
                  <dd className="text-2xl font-light text-white/90 mt-1">
                    {stats.fiveStarPercentage}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-red-500/20 border border-red-500/30">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-light text-white/60 tracking-wide uppercase">
                    Low Satisfaction
                  </dt>
                  <dd className="text-2xl font-light text-red-400 mt-1">
                    {stats.lowSatisfactionCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Average Ratings by Category */}
      {stats && (
        <div className="bg-white/5 border border-white/10 p-8">
          <h2 className="text-xl font-light tracking-wide uppercase text-white/90 mb-6">
            Average Ratings by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {Object.entries(stats.averageRatings).map(([category, rating]) => (
              <div key={category} className="text-center">
                <p className="text-sm font-light text-white/60 tracking-wide uppercase mb-2">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {renderStars(parseFloat(rating))}
                </div>
                <p className={`text-2xl font-light ${getRatingColor(parseFloat(rating))}`}>
                  {rating}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Distribution Chart */}
      {stats && (
        <div className="bg-white/5 border border-white/10 p-8">
          <h2 className="text-xl font-light tracking-wide uppercase text-white/90 mb-6">
            Rating Distribution
          </h2>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0;
              const percentage = stats.totalFeedback > 0 
                ? (count / stats.totalFeedback) * 100 
                : 0;
              return (
                <div key={star} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-light text-white/60 w-4">{star}</span>
                    <Star className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="flex-1 bg-white/5 h-6 border border-white/10 relative overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        star >= 4 ? 'bg-[#d4af37]' : 
                        star >= 3 ? 'bg-yellow-500' : 
                        star >= 2 ? 'bg-orange-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-light text-white/60 w-16 text-right">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 p-8">
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-white/60" />
          <h2 className="text-sm font-light text-white/60 tracking-widest uppercase">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-light text-white/60 tracking-wide uppercase mb-3">
              Reviewed Status
            </label>
            <select
              value={filters.isReviewed}
              onChange={(e) => setFilters(prev => ({ ...prev, isReviewed: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border-b border-white/20 text-white font-light focus:outline-none focus:border-[#d4af37] transition-colors duration-500"
            >
              <option value="">All</option>
              <option value="true">Reviewed</option>
              <option value="false">Not Reviewed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-light text-white/60 tracking-wide uppercase mb-3">
              Flagged
            </label>
            <select
              value={filters.isFlagged}
              onChange={(e) => setFilters(prev => ({ ...prev, isFlagged: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border-b border-white/20 text-white font-light focus:outline-none focus:border-[#d4af37] transition-colors duration-500"
            >
              <option value="">All</option>
              <option value="true">Flagged</option>
              <option value="false">Not Flagged</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-light text-white/60 tracking-wide uppercase mb-3">
              Minimum Rating
            </label>
            <select
              value={filters.minRating}
              onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border-b border-white/20 text-white font-light focus:outline-none focus:border-[#d4af37] transition-colors duration-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-light text-white/60 tracking-wide uppercase mb-3">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border-b border-white/20 text-white font-light focus:outline-none focus:border-[#d4af37] transition-colors duration-500"
            >
              <option value="createdAt">Date</option>
              <option value="ratings.overall">Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white/5 border border-white/10">
        <div className="px-8 py-6 border-b border-white/10">
          <h2 className="text-xl font-light tracking-wide uppercase text-white/90">
            All Feedback ({feedback.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mx-auto"></div>
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/50 font-light">No feedback found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {feedback.map((fb) => {
              const avgRating = (
                (fb.ratings.quality + fb.ratings.speed + fb.ratings.communication + 
                 fb.ratings.professionalism + fb.ratings.overall) / 5
              ).toFixed(1);
              
              return (
                <div
                  key={fb._id}
                  className={`p-8 hover:bg-white/5 transition-colors duration-300 ${
                    fb.isFlagged ? 'bg-red-500/10 border-l-4 border-red-500' : ''
                  } ${fb.ratings.overall <= 2 ? 'bg-orange-500/5 border-l-4 border-orange-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          {fb.isAnonymous ? (
                            <User className="w-5 h-5 text-white/40" />
                          ) : (
                            <Building2 className="w-5 h-5 text-white/40" />
                          )}
                          <span className="text-lg font-light text-white/90">
                            {fb.isAnonymous ? 'Anonymous' : fb.name}
                          </span>
                        </div>
                        {fb.projectId && (
                          <span className="text-sm font-light text-white/50">
                            Project: {fb.projectId.title}
                          </span>
                        )}
                        <span className="text-sm font-light text-white/50 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(fb.createdAt), 'MMM d, yyyy')}
                        </span>
                        {fb.isHighlighted && (
                          <span className="px-2 py-1 text-xs font-light text-[#d4af37] bg-[#d4af37]/20 border border-[#d4af37]/30">
                            Highlighted
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-2">
                          {renderStars(parseFloat(avgRating))}
                          <span className={`text-lg font-light ${getRatingColor(parseFloat(avgRating))}`}>
                            {avgRating}
                          </span>
                        </div>
                        <div className="text-sm font-light text-white/50">
                          Q: {fb.ratings.quality} | S: {fb.ratings.speed} | C: {fb.ratings.communication} | P: {fb.ratings.professionalism} | O: {fb.ratings.overall}
                        </div>
                      </div>

                      {fb.reviewText && (
                        <p className="text-white/70 font-light mb-4 leading-relaxed">
                          {fb.reviewText}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-2 ml-6">
                      {!fb.isReviewed && (
                        <button
                          onClick={() => openActionModal('review', fb)}
                          className="p-2 text-white/60 hover:text-green-400 transition-colors"
                          title="Mark as Reviewed"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => openActionModal(fb.isFlagged ? 'unflag' : 'flag', fb)}
                        className={`p-2 transition-colors ${
                          fb.isFlagged ? 'text-red-400' : 'text-white/60 hover:text-red-400'
                        }`}
                        title={fb.isFlagged ? 'Unflag' : 'Flag'}
                      >
                        <Flag className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openActionModal(fb.isHighlighted ? 'unhighlight' : 'highlight', fb)}
                        className={`p-2 transition-colors ${
                          fb.isHighlighted ? 'text-[#d4af37]' : 'text-white/60 hover:text-[#d4af37]'
                        }`}
                        title={fb.isHighlighted ? 'Unhighlight' : 'Highlight'}
                      >
                        <Star className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openActionModal('delete', fb)}
                        className="p-2 text-white/60 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {showModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black border border-white/20 max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-white/90">
                Confirm Action
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFeedback(null);
                }}
                className="p-2 text-white/60 hover:text-white transition-colors duration-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-white/70 font-light mb-8">
              {modalAction === 'delete' && 'Are you sure you want to delete this feedback?'}
              {modalAction === 'flag' && 'Flag this feedback for review?'}
              {modalAction === 'unflag' && 'Remove flag from this feedback?'}
              {modalAction === 'highlight' && 'Highlight this feedback for public display?'}
              {modalAction === 'unhighlight' && 'Remove highlight from this feedback?'}
              {modalAction === 'review' && 'Mark this feedback as reviewed?'}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFeedback(null);
                }}
                className="flex-1 px-6 py-3 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all duration-300 text-sm font-light tracking-wide uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(modalAction, selectedFeedback._id)}
                className={`flex-1 px-6 py-3 border text-sm font-light tracking-widest uppercase transition-all duration-500 ${
                  modalAction === 'delete' 
                    ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black'
                    : 'border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;

