import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, User, Building2, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import StarRating from '../components/StarRating';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FeedbackForm = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    isAnonymous: false,
    projectId: '',
    feedbackType: 'general',
    ratings: {
      quality: 0,
      speed: 0,
      communication: 0,
      professionalism: 0,
      overall: 0
    },
    reviewText: ''
  });

  const containerRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    // Auto-fill name if logged in
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || ''
      }));
    }

    // Fetch user's projects if logged in
    if (isAuthenticated) {
      fetchUserProjects();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (containerRef.current && titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
      );
    }
  }, []);

  const fetchUserProjects = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/feedback/my-projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleRatingChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const { ratings, feedbackType, projectId } = formData;
    
    if (Object.values(ratings).some(r => r === 0)) {
      toast.error(t('feedback.allRatingsRequired'));
      return;
    }

    if (feedbackType === 'project' && !projectId) {
      toast.error(t('feedback.selectProjectRequired'));
      return;
    }

    if (!isAuthenticated && !formData.isAnonymous && !formData.name.trim()) {
      toast.error(t('feedback.nameRequired'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        name: formData.isAnonymous ? '' : formData.name,
        projectId: feedbackType === 'project' ? projectId : null
      };

      const response = await api.post('/feedback', payload);
      
      toast.success(t('feedback.thankYou'));
      
      // Reset form
      setFormData({
        name: isAuthenticated && user ? user.fullName : '',
        isAnonymous: false,
        projectId: '',
        feedbackType: 'general',
        ratings: {
          quality: 0,
          speed: 0,
          communication: 0,
          professionalism: 0,
          overall: 0
        },
        reviewText: ''
      });

      // Show alert if low satisfaction
      if (response.data.alert) {
        setTimeout(() => {
          toast.error(t('feedback.lowSatisfactionAlert'));
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error(error.response?.data?.error || t('feedback.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  const allRatingsComplete = Object.values(formData.ratings).every(r => r > 0);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div ref={containerRef} className="max-w-4xl mx-auto px-4 py-8 pt-32">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-[#d4af37] transition-colors duration-300 mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm font-light tracking-wide uppercase">{t('feedback.backToHome')}</span>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 
            ref={titleRef}
            className="text-5xl md:text-6xl font-light tracking-tight mb-4 text-white/90"
          >
            {t('feedback.title')}
          </h1>
          <p className="text-lg font-light text-white/50">
            {t('feedback.subtitle')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Feedback Type */}
          <div className="bg-white/5 border border-white/10 p-8">
            <label className="block text-sm font-light text-white/60 tracking-wide uppercase mb-4">
              {t('feedback.feedbackType')}
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="feedbackType"
                  value="general"
                  checked={formData.feedbackType === 'general'}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedbackType: e.target.value, projectId: '' }))}
                  className="w-4 h-4 text-[#d4af37] bg-white/5 border-white/20 focus:ring-[#d4af37] focus:ring-2"
                />
                <span className="text-white/70 group-hover:text-white transition-colors">{t('feedback.generalFeedback')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="feedbackType"
                  value="project"
                  checked={formData.feedbackType === 'project'}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedbackType: e.target.value }))}
                  disabled={!isAuthenticated || projects.length === 0}
                  className="w-4 h-4 text-[#d4af37] bg-white/5 border-white/20 focus:ring-[#d4af37] focus:ring-2 disabled:opacity-50"
                />
                <span className={`${!isAuthenticated || projects.length === 0 ? 'text-white/30' : 'text-white/70'} group-hover:text-white transition-colors`}>
                  {t('feedback.projectFeedback')}
                </span>
              </label>
            </div>
            {formData.feedbackType === 'project' && (!isAuthenticated || projects.length === 0) && (
              <p className="mt-3 text-sm text-white/40 font-light">
                {!isAuthenticated ? t('feedback.loginRequired') : t('feedback.noProjects')}
              </p>
            )}
          </div>

          {/* Project Selection */}
          {formData.feedbackType === 'project' && isAuthenticated && projects.length > 0 && (
            <div className="bg-white/5 border border-white/10 p-8">
              <label className="block text-sm font-light text-white/60 tracking-wide uppercase mb-4">
                {t('feedback.selectProject')}
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border-b border-white/20 text-white font-light focus:outline-none focus:border-[#d4af37] transition-colors duration-500"
              >
                <option value="">{t('feedback.selectProjectPlaceholder')}</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User Info (for guests) */}
          {!isAuthenticated && (
            <div className="bg-white/5 border border-white/10 p-8 space-y-6">
              <div>
                <label className="block text-sm font-light text-white/60 tracking-wide uppercase mb-4">
                  {t('feedback.yourName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={formData.isAnonymous}
                    placeholder={t('feedback.namePlaceholder')}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border-b border-white/20 text-white placeholder-white/30 font-light focus:outline-none focus:border-[#d4af37] transition-colors duration-500 disabled:opacity-50"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked, name: '' }))}
                  className="w-4 h-4 text-[#d4af37] bg-white/5 border-white/20 focus:ring-[#d4af37] focus:ring-2"
                />
                <span className="text-white/70 group-hover:text-white transition-colors">
                  {t('feedback.anonymous')}
                </span>
              </label>
            </div>
          )}

          {/* Ratings */}
          <div className="bg-white/5 border border-white/10 p-8 space-y-8">
            <h2 className="text-xl font-light tracking-wide uppercase text-white/90 mb-6">
              {t('feedback.rateExperience')}
            </h2>
            
            <StarRating
              label={t('feedback.qualityOfWork')}
              value={formData.ratings.quality}
              onChange={(value) => handleRatingChange('quality', value)}
            />
            
            <StarRating
              label={t('feedback.deliverySpeed')}
              value={formData.ratings.speed}
              onChange={(value) => handleRatingChange('speed', value)}
            />
            
            <StarRating
              label={t('feedback.communication')}
              value={formData.ratings.communication}
              onChange={(value) => handleRatingChange('communication', value)}
            />
            
            <StarRating
              label={t('feedback.professionalism')}
              value={formData.ratings.professionalism}
              onChange={(value) => handleRatingChange('professionalism', value)}
            />
            
            <StarRating
              label={t('feedback.overallSatisfaction')}
              value={formData.ratings.overall}
              onChange={(value) => handleRatingChange('overall', value)}
              size="lg"
            />
          </div>

          {/* Written Review */}
          <div className="bg-white/5 border border-white/10 p-8">
            <label className="block text-sm font-light text-white/60 tracking-wide uppercase mb-4">
              {t('feedback.tellUsExperience')}
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-white/40" />
              <textarea
                value={formData.reviewText}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewText: e.target.value }))}
                rows={6}
                placeholder={t('feedback.reviewPlaceholder')}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border-b border-white/20 text-white placeholder-white/30 font-light focus:outline-none focus:border-[#d4af37] transition-colors duration-500 resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !allRatingsComplete}
              className={`
                px-8 py-4 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase
                hover:bg-[#d4af37] hover:text-black transition-all duration-500
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#d4af37]
                flex items-center gap-3
              `}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
                  {t('feedback.submitting')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t('feedback.submitFeedback')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default FeedbackForm;