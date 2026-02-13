import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, X, Sparkles, Zap, Target, MessageCircle, Plus, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/api';
import { gsap } from 'gsap';

const AddProject = () => {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientType: user?.companyName ? 'company' : 'individual',
    projectDescription: '',
    budgetRange: '',
    phoneNumber: user?.phoneNumber || '',
    companyName: user?.companyName || '',
    companySize: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const containerRef = useRef(null);
  const formRef = useRef(null);
  const progressBarRef = useRef(null);
  const stepRefs = useRef([]);

  const totalSteps = 3;

  const budgetOptions = [
    { value: 'less-than-500', label: t('projectForm.budgetOptions.lessThan500'), icon: '💡', color: 'from-blue-500/20 to-blue-600/5' },
    { value: '500-1000', label: t('projectForm.budgetOptions.500to1000'), icon: '🚀', color: 'from-purple-500/20 to-purple-600/5' },
    { value: '1000-3000', label: t('projectForm.budgetOptions.1000to3000'), icon: '⭐', color: 'from-yellow-500/20 to-yellow-600/5' },
    { value: '3000-10000', label: t('projectForm.budgetOptions.3000to10000'), icon: '💎', color: 'from-cyan-500/20 to-cyan-600/5' },
    { value: '10000-plus', label: t('projectForm.budgetOptions.10000plus'), icon: '👑', color: 'from-[#d4af37]/20 to-[#f4d03f]/5' }
  ];

  const companySizeOptions = [
    { value: 'less-than-10', label: t('projectForm.companySizeOptions.lessThan10') },
    { value: '10-50', label: t('projectForm.companySizeOptions.10to50') },
    { value: '50-plus', label: t('projectForm.companySizeOptions.50plus') }
  ];

  // Enhanced entrance animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
    }
  }, []);

  // Animated step transitions
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, x: dir === 'rtl' ? -30 : 30, scale: 0.98 },
        { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: 'power2.out' }
      );
    }

    // Animate progress bar
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${(currentStep / totalSteps) * 100}%`,
        duration: 0.8,
        ease: 'power2.inOut'
      });
    }
  }, [currentStep, dir]);

  // Character count animation
  useEffect(() => {
    if (formData.projectDescription) {
      const newCount = formData.projectDescription.length;
      gsap.to({ count: charCount }, {
        count: newCount,
        duration: 0.3,
        onUpdate: function() {
          setCharCount(Math.round(this.targets()[0].count));
        }
      });
    }
  }, [formData.projectDescription]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.clientType) {
        newErrors.clientType = t('projectForm.steps.clientType.error');
      }
    }

    if (step === 2) {
      if (!formData.projectDescription || formData.projectDescription.trim().length < 10) {
        newErrors.projectDescription = t('projectForm.steps.projectDescription.error');
      }
      if (!formData.budgetRange) {
        newErrors.budgetRange = t('projectForm.steps.budget.error');
      }
    }

    if (step === 3) {
      if (!formData.phoneNumber || formData.phoneNumber.trim().length < 5) {
        newErrors.phoneNumber = t('projectForm.steps.contact.phoneNumberError');
      }
      if (formData.clientType === 'company') {
        if (!formData.companyName || formData.companyName.trim().length < 2) {
          newErrors.companyName = t('projectForm.steps.contact.companyNameError');
        }
        if (!formData.companySize) {
          newErrors.companySize = t('projectForm.steps.contact.companySizeError');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      // Shake animation on error
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { x: -10 },
          { x: 10, duration: 0.1, repeat: 5, yoyo: true, ease: 'power1.inOut' }
        );
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleClose = () => {
    // Check if form has data
    if (formData.projectDescription || formData.budgetRange || 
        (formData.clientType && formData.clientType !== (user?.companyName ? 'company' : 'individual'))) {
      setShowCloseConfirm(true);
    } else {
      navigate('/app/projects');
    }
  };

  const confirmClose = () => {
    navigate('/app/projects');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        title: formData.projectDescription.substring(0, 50) + '...',
        description: formData.projectDescription,
        budget: formData.budgetRange,
        clientType: formData.clientType,
        companyName: formData.clientType === 'company' ? formData.companyName : undefined,
        companySize: formData.clientType === 'company' ? formData.companySize : undefined,
        phoneNumber: formData.phoneNumber
      };

      await api.post('/projects', projectData);
      setIsSubmitted(true);
      
      setTimeout(() => {
        navigate('/app/projects');
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || t('projectForm.errors.createFailed');
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div 
        ref={containerRef}
        className="min-h-screen bg-black text-white flex items-center justify-center px-4 overflow-hidden relative"
        dir={dir}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#d4af37]/5 animate-gradient-shift" />
        
        {/* Celebration particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-celebration"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              {['✨', '🎉', '⭐', '💫', '🌟'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>

        <div className="text-center max-w-2xl relative z-10">
          <div className="mb-8">
            {/* Success icon with multiple animations */}
            <div className="relative w-28 h-28 mx-auto mb-10">
              {/* Outer rings */}
              <div className="absolute inset-0 rounded-full bg-[#d4af37]/20 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-[#d4af37]/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
              
              {/* Main icon */}
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#d4af37] via-[#f4d03f] to-[#d4af37] flex items-center justify-center shadow-2xl shadow-[#d4af37]/50 animate-scale-in">
                <Check className="w-14 h-14 text-black animate-check-draw" strokeWidth={3} />
              </div>

              {/* Sparkles around */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 45}deg) translate(60px) rotate(-${i * 45}deg)`,
                  }}
                >
                  <Sparkles className="w-4 h-4 text-[#d4af37] animate-sparkle" style={{ animationDelay: `${i * 0.1}s` }} />
                </div>
              ))}
            </div>

            <h2 className="text-4xl md:text-6xl font-light mb-6 text-white/90 animate-fade-in-up">
              {t('projectForm.addProject.projectCreated')}
            </h2>
            
            <p className="text-xl md:text-2xl font-light text-white/70 max-w-md mx-auto mb-10 animate-fade-in-up-delay">
              {t('projectForm.addProject.projectCreatedDesc')}
            </p>

            {/* Animated success indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/60 mb-8 animate-fade-in-up-delay-2">
              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <Rocket className="w-5 h-5 text-[#d4af37]" />
                <span>Project Created</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                <Zap className="w-5 h-5 text-[#d4af37]" />
                <span>Team Notified</span>
              </div>
            </div>

            {/* Progress hint */}
            <div className="text-sm text-white/40 animate-fade-in-up-delay-3">
              Redirecting to projects...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black text-white px-4 py-8 md:py-12 relative overflow-hidden"
      dir={dir}
    >
      {/* Enhanced animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 via-transparent to-[#d4af37]/5 animate-gradient-slow" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#d4af37]/20 rounded-full animate-float-particles"
            style={{
              left: `${10 + i * 12}%`,
              top: `${5 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${6 + i}s`
            }}
          />
        ))}
      </div>

      {/* Close confirmation modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-light text-white mb-4">
                {dir === 'rtl' ? 'هل تريد المغادرة؟' : 'Leave without saving?'}
              </h3>
              <p className="text-white/60 mb-8">
                {dir === 'rtl' 
                  ? 'لديك بيانات لم يتم حفظها. هل أنت متأكد من المغادرة؟'
                  : 'You have unsaved changes. Are you sure you want to leave?'
                }
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 px-6 py-3 border-2 border-white/20 text-white rounded-xl hover:bg-white/10 transition-all"
                >
                  {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={confirmClose}
                  className="flex-1 px-6 py-3 bg-red-500/20 border-2 border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
                >
                  {dir === 'rtl' ? 'مغادرة' : 'Leave'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Enhanced Header with close button */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1" />
            <button
              onClick={handleClose}
              className="group p-3 text-white/40 hover:text-white transition-all hover:bg-white/5 rounded-xl"
            >
              <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
            </button>
          </div>

          <div className="text-center">
            {/* Icon with glow */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-[#d4af37]/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-xl shadow-[#d4af37]/30 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Plus className="w-10 h-10 text-black" strokeWidth={2.5} />
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4 text-white/90 bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
              {t('projectForm.addProject.title')}
            </h1>
            
            <p className="text-base md:text-lg font-light text-white/50 max-w-xl mx-auto">
              {t('projectForm.addProject.subtitle')}
            </p>
          </div>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="mb-10">
          {/* Progress bar with gradient */}
          <div className="relative h-2 bg-white/5 rounded-full mb-8 overflow-hidden">
            <div 
              ref={progressBarRef}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37] rounded-full transition-all duration-500 shadow-lg shadow-[#d4af37]/50"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer" />
            </div>
          </div>

          {/* Step circles */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div
                  ref={el => stepRefs.current[step - 1] = el}
                  className={`relative group w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ${
                    currentStep >= step
                      ? 'bg-gradient-to-br from-[#d4af37] to-[#f4d03f] text-black scale-110 shadow-xl shadow-[#d4af37]/50'
                      : 'bg-white/5 text-white/40 scale-100'
                  }`}
                >
                  {currentStep > step ? (
                    <Check className="w-6 h-6 animate-check-pop" />
                  ) : (
                    <span className="text-lg">{step}</span>
                  )}
                  
                  {/* Pulse for current step */}
                  {currentStep === step && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-[#d4af37]/30 animate-ping" />
                      <div className="absolute inset-0 rounded-full bg-[#d4af37]/20 animate-pulse" />
                    </>
                  )}

                  {/* Checkmark trail */}
                  {currentStep > step && (
                    <div className="absolute inset-0 rounded-full border-2 border-[#d4af37] animate-expand-fade" />
                  )}
                </div>
                {step < 3 && (
                  <div className="flex-1 h-px mx-3 bg-transparent" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <span className="text-xs font-light text-white/40 uppercase tracking-widest">
              {t('projectForm.steps.step', { step: currentStep, total: totalSteps })}
            </span>
          </div>
        </div>

        {/* Enhanced Form Content */}
        <div 
          ref={formRef}
          className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-10 lg:p-14 shadow-2xl overflow-hidden"
        >
          {/* Decorative corner elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#d4af37]/5 blur-3xl rounded-full" />

          {/* Floating particles inside form */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-[#d4af37]/20 rounded-full animate-float-slow"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${10 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.6}s`
                }}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative z-10">
            {/* Step 1: Client Type */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-light text-white/90 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    {t('projectForm.steps.clientType.title')}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { 
                        type: 'individual', 
                        icon: '👤',
                        title: t('projectForm.steps.clientType.individual'),
                        desc: t('projectForm.steps.clientType.individualDesc')
                      },
                      { 
                        type: 'company', 
                        icon: '🏢',
                        title: t('projectForm.steps.clientType.company'),
                        desc: t('projectForm.steps.clientType.companyDesc')
                      }
                    ].map((option) => (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => handleChange('clientType', option.type)}
                        onMouseEnter={() => setHoveredOption(option.type)}
                        onMouseLeave={() => setHoveredOption(null)}
                        className={`group relative p-8 border-2 rounded-2xl text-left transition-all duration-300 transform overflow-hidden ${
                          formData.clientType === option.type
                            ? 'border-[#d4af37] bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 scale-105 shadow-xl shadow-[#d4af37]/20'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5 hover:scale-102'
                        }`}
                      >
                        {/* Background glow */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${
                          formData.clientType === option.type 
                            ? 'from-[#d4af37]/10 to-transparent opacity-100' 
                            : 'from-white/5 to-transparent opacity-0 group-hover:opacity-100'
                        } transition-opacity duration-300`} />

                        {/* Selection indicator */}
                        {formData.clientType === option.type && (
                          <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                            <Check className="w-5 h-5 text-black" strokeWidth={3} />
                          </div>
                        )}

                        <div className="relative">
                          <div className="text-5xl mb-6 transform transition-all duration-300 group-hover:scale-125 group-hover:rotate-6">
                            {option.icon}
                          </div>
                          <div className="text-xl md:text-2xl font-light text-white mb-3">
                            {option.title}
                          </div>
                          <div className="text-sm md:text-base text-white/60">
                            {option.desc}
                          </div>
                        </div>

                        {/* Hover effect border */}
                        {hoveredOption === option.type && formData.clientType !== option.type && (
                          <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.clientType && (
                    <p className="mt-5 text-sm text-red-400 flex items-center gap-2 animate-shake">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      {errors.clientType}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Project Description & Budget */}
            {currentStep === 2 && (
              <div className="space-y-10">
                <div>
                  <label htmlFor="projectDescription" className="block text-lg font-light text-white/90 mb-5 flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#d4af37]" />
                      </div>
                      {t('projectForm.steps.projectDescription.title')}
                    </span>
                    <span className={`text-sm px-4 py-1.5 rounded-full transition-all duration-300 ${
                      charCount >= 10 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}>
                      {charCount} {dir === 'rtl' ? 'حرف' : 'chars'}
                    </span>
                  </label>
                  <div className="relative group">
                    <textarea
                      id="projectDescription"
                      value={formData.projectDescription}
                      onChange={(e) => handleChange('projectDescription', e.target.value)}
                      rows={9}
                      className="w-full px-6 py-5 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all resize-none group-hover:border-white/20"
                      placeholder={t('projectForm.steps.projectDescription.placeholder')}
                    />
                    {/* Typing indicator */}
                    {formData.projectDescription && (
                      <div className="absolute bottom-5 right-5 flex gap-1.5 bg-black/50 px-3 py-2 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    )}
                    {/* Focus glow */}
                    <div className="absolute inset-0 rounded-2xl bg-[#d4af37]/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  {errors.projectDescription && (
                    <p className="mt-4 text-sm text-red-400 flex items-center gap-2 animate-shake">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      {errors.projectDescription}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="budgetRange" className="block text-lg font-light text-white/90 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                    {t('projectForm.steps.budget.title')}
                  </label>
                  <div className="grid grid-cols-1 gap-4">
                    {budgetOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange('budgetRange', option.value)}
                        className={`group relative px-7 py-5 border-2 rounded-xl text-left transition-all duration-300 transform overflow-hidden ${
                          formData.budgetRange === option.value
                            ? 'border-[#d4af37] bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/5 scale-102 shadow-lg shadow-[#d4af37]/10'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        {/* Background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${option.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <span className="text-3xl transform transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">
                              {option.icon}
                            </span>
                            <span className="text-base md:text-lg text-white font-light">
                              {option.label}
                            </span>
                          </div>
                          {formData.budgetRange === option.value && (
                            <div className="w-6 h-6 bg-[#d4af37] rounded-full flex items-center justify-center animate-scale-in">
                              <Check className="w-4 h-4 text-black" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.budgetRange && (
                    <p className="mt-4 text-sm text-red-400 flex items-center gap-2 animate-shake">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      {errors.budgetRange}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Contact Details */}
            {currentStep === 3 && (
              <div className="space-y-7">
                {/* Pre-filled user info display */}
                <div className="relative p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 blur-3xl" />
                  <div className="relative">
                    <div className="text-xs font-light text-white/50 uppercase tracking-widest mb-5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" />
                      {t('projectForm.steps.contact.accountInfo')}
                    </div>
                    <div className="space-y-4 text-sm md:text-base font-light text-white/80">
                      <div className="flex items-center gap-4">
                        <span className="text-white/50 min-w-[80px]">{t('projectForm.steps.contact.name')}:</span>
                        <span className="font-medium">{user?.fullName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white/50 min-w-[80px]">{t('projectForm.steps.contact.emailLabel')}:</span>
                        <span className="font-medium">{user?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-light text-white/90 mb-3">
                    {t('projectForm.steps.contact.phoneNumber')} 
                    <span className="text-white/40 text-xs ml-2">
                      ({t('projectForm.steps.contact.phoneNumberEditable')})
                    </span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all hover:border-white/20"
                    placeholder={t('projectForm.steps.contact.phoneNumberPlaceholder')}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                {formData.clientType === 'company' && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-light text-white/90 mb-3">
                        {t('projectForm.steps.contact.companyName')}
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                        className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all hover:border-white/20"
                        placeholder={t('projectForm.steps.contact.companyNamePlaceholder')}
                      />
                      {errors.companyName && (
                        <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                          {errors.companyName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="companySize" className="block text-sm font-light text-white/90 mb-3">
                        {t('projectForm.steps.contact.companySize')}
                      </label>
                      <select
                        id="companySize"
                        value={formData.companySize}
                        onChange={(e) => handleChange('companySize', e.target.value)}
                        className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all cursor-pointer hover:border-white/20"
                      >
                        <option value="" className="bg-black">{t('projectForm.steps.contact.companySizeSelect')}</option>
                        {companySizeOptions.map(option => (
                          <option key={option.value} value={option.value} className="bg-black">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.companySize && (
                        <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                          {errors.companySize}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {errors.submit && (
                  <div className="p-5 bg-red-500/10 border-2 border-red-500/30 rounded-xl animate-shake">
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      {errors.submit}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Navigation Buttons */}
            <div className="flex items-center justify-between mt-14 pt-8 border-t border-white/10">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
                className="group flex items-center gap-3 px-8 py-4 border-2 border-white/20 text-white text-sm font-light tracking-widest uppercase hover:bg-white/10 hover:border-white/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-xl"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                {t('projectForm.navigation.back')}
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="group relative overflow-hidden flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-black text-sm font-medium tracking-widest uppercase transition-all rounded-xl shadow-lg shadow-[#d4af37]/30 hover:shadow-xl hover:shadow-[#d4af37]/50 hover:scale-105"
                >
                  <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative">{t('projectForm.navigation.next')}</span>
                  <ChevronRight className="relative w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative overflow-hidden flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-black text-sm font-medium tracking-widest uppercase transition-all rounded-xl shadow-lg shadow-[#d4af37]/30 hover:shadow-xl hover:shadow-[#d4af37]/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading && (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  )}
                  <span className="relative">
                    {loading ? t('projectForm.addProject.creating') : t('projectForm.navigation.create')}
                  </span>
                  {!loading && <Rocket className="w-5 h-5" />}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes float-celebration {
          0%, 100% { 
            transform: translateY(0) translateX(0) rotate(0deg); 
            opacity: 0;
          }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { 
            transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 100}px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes float-particles {
          0%, 100% { 
            transform: translateY(0) translateX(0); 
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-30px) translateX(20px); 
            opacity: 0.5;
          }
        }
        @keyframes float-slow {
          0%, 100% { 
            transform: translateY(0) translateX(0); 
            opacity: 0.3; 
          }
          50% { 
            transform: translateY(-40px) translateX(20px); 
            opacity: 0.6; 
          }
        }
        @keyframes gradient-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes scale-in {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes check-pop {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes check-draw {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes expand-fade {
          from { 
            transform: scale(1); 
            opacity: 1; 
          }
          to { 
            transform: scale(1.5); 
            opacity: 0; 
          }
        }
        @keyframes sparkle {
          0%, 100% { 
            opacity: 0; 
            transform: scale(0) rotate(0deg); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1) rotate(180deg); 
          }
        }
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        
        .animate-float-celebration {
          animation: float-celebration 4s ease-in forwards;
        }
        .animate-float-particles {
          animation: float-particles 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-gradient-slow {
          animation: gradient-slow 4s ease-in-out infinite;
        }
        .animate-gradient-shift {
          animation: gradient-shift 3s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-check-pop {
          animation: check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-check-draw {
          stroke-dasharray: 100;
          animation: check-draw 0.6s ease-out forwards;
        }
        .animate-expand-fade {
          animation: expand-fade 1s ease-out forwards;
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in-up 0.4s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-fade-in-up-delay {
          animation: fade-in-up 0.8s ease-out 0.2s both;
        }
        .animate-fade-in-up-delay-2 {
          animation: fade-in-up 1s ease-out 0.4s both;
        }
        .animate-fade-in-up-delay-3 {
          animation: fade-in-up 1.2s ease-out 0.6s both;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default AddProject;