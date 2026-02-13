import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Sparkles, Zap, Target, MessageCircle, Mail, Phone, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/api';
import { gsap } from 'gsap';

const ProjectRequestForm = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientType: '',
    projectDescription: '',
    budgetRange: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    companyName: '',
    companySize: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [charCount, setCharCount] = useState(0);

  const modalRef = useRef(null);
  const formRef = useRef(null);
  const progressBarRef = useRef(null);

  const totalSteps = 4;

  const budgetOptions = [
    { value: 'less-than-500', label: t('projectForm.budgetOptions.lessThan500'), icon: '💡', color: 'from-blue-500/20 to-blue-600/5' },
    { value: '500-1000', label: t('projectForm.budgetOptions.500to1000'), icon: '🚀', color: 'from-purple-500/20 to-purple-600/5' },
    { value: '1000-3000', label: t('projectForm.budgetOptions.1000to3000'), icon: '⭐', color: 'from-yellow-500/20 to-yellow-600/5' },
    { value: '3000-10000', label: t('projectForm.budgetOptions.3000to10000'), icon: '💎', color: 'from-cyan-500/20 to-cyan-600/5' },
    { value: '10000-plus', label: t('projectForm.budgetOptions.10000plus'), icon: '👑', color: 'from-[#d4af37]/20 to-[#f4d03f]/5' }
  ];

  const companySizeOptions = [
    { value: 'less-than-10', label: t('projectForm.companySizeOptions.lessThan10'), icon: '👥' },
    { value: '10-50', label: t('projectForm.companySizeOptions.10to50'), icon: '👨‍👩‍👧‍👦' },
    { value: '50-plus', label: t('projectForm.companySizeOptions.50plus'), icon: '🏢' }
  ];

  // Enhanced entrance animation for modal
  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' }
      );
    }
  }, [isOpen]);

  // Step transition animation
  useEffect(() => {
    if (formRef.current && isOpen) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, x: dir === 'rtl' ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      );
    }

    // Animate progress bar
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${(currentStep / totalSteps) * 100}%`,
        duration: 0.6,
        ease: 'power2.inOut'
      });
    }
  }, [currentStep, dir, isOpen]);

  // Character count animation
  useEffect(() => {
    if (formData.projectDescription) {
      const newCount = formData.projectDescription.length;
      gsap.to({ count: charCount }, {
        count: newCount,
        duration: 0.2,
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
    }

    if (step === 3) {
      if (!formData.budgetRange) {
        newErrors.budgetRange = t('projectForm.steps.budget.error');
      }
    }

    if (step === 4) {
      if (!formData.fullName || formData.fullName.trim().length < 2) {
        newErrors.fullName = t('projectForm.steps.contact.fullNameError');
      }
      if (!formData.phoneNumber || formData.phoneNumber.trim().length < 5) {
        newErrors.phoneNumber = t('projectForm.steps.contact.phoneNumberError');
      }
      if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = t('projectForm.steps.contact.emailError');
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
          { x: -8 },
          { x: 8, duration: 0.08, repeat: 5, yoyo: true, ease: 'power1.inOut' }
        );
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/project-requests/submit', formData);
      setIsSubmitted(true);
    } catch (error) {
      const errorMessage = error.response?.data?.error || t('projectForm.errors.submitFailed');
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Exit animation
      if (modalRef.current) {
        gsap.to(modalRef.current, {
          opacity: 0,
          scale: 0.95,
          y: 20,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentStep(1);
            setFormData({
              clientType: '',
              projectDescription: '',
              budgetRange: '',
              fullName: '',
              phoneNumber: '',
              email: '',
              companyName: '',
              companySize: ''
            });
            setErrors({});
            setIsSubmitted(false);
            onClose();
          }
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" dir={dir}>
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#d4af37]/30 rounded-full animate-float-slow"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${4 + (i % 3)}s`
            }}
          />
        ))}
      </div>

      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl bg-gradient-to-br from-black via-black to-[#d4af37]/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#d4af37]/10 to-transparent blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-[#d4af37]/20 blur-md rounded-full" />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center">
                  <Target className="w-5 h-5 text-black" />
                </div>
              </div>
              <h2 className="text-2xl font-light text-white bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {t('projectForm.projectRequest.title')}
              </h2>
            </div>
            <p className="text-sm text-white/50 ml-13">
              {t('projectForm.projectRequest.stepOf', { current: currentStep, total: totalSteps })}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="group relative p-2.5 text-white/60 hover:text-white transition-all disabled:opacity-50 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative h-1.5 bg-white/5">
          <div 
            ref={progressBarRef}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] transition-all"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-shimmer" />
          </div>
          {/* Progress indicator dot */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#d4af37] rounded-full shadow-lg shadow-[#d4af37]/50 transition-all duration-600"
            style={{ left: `calc(${(currentStep / totalSteps) * 100}% - 6px)` }}
          >
            <div className="absolute inset-0 bg-[#d4af37]/50 rounded-full animate-ping" />
          </div>
        </div>

        {/* Form Content */}
        <div className="relative p-6 md:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {isSubmitted ? (
            <div className="text-center py-12 animate-fade-in">
              {/* Success celebration */}
              <div className="relative mb-8">
                {/* Celebration particles */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-float"
                    style={{
                      left: `${50 + Math.cos(i * 30 * Math.PI / 180) * 60}%`,
                      top: `${50 + Math.sin(i * 30 * Math.PI / 180) * 60}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
                
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-[#d4af37]/30 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-2xl shadow-[#d4af37]/50">
                    <Check className="w-10 h-10 text-black animate-bounce-in" />
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-light text-white mb-4 animate-fade-in-delay">
                {t('projectForm.projectRequest.requestSubmitted')}
              </h3>
              
              <p className="text-white/70 mb-8 max-w-md mx-auto leading-relaxed animate-fade-in-delay-2">
                {t('projectForm.projectRequest.requestSubmittedDesc')}
              </p>

              {/* Success indicators */}
              <div className="flex items-center justify-center gap-6 mb-8 text-sm text-white/50 animate-fade-in-delay-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>Request Received</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#d4af37]" />
                  <span>Team Notified</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="group relative overflow-hidden px-10 py-4 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-black text-sm font-medium tracking-widest uppercase transition-all rounded-xl shadow-lg shadow-[#d4af37]/30 hover:shadow-xl hover:shadow-[#d4af37]/50 hover:scale-105"
              >
                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative">{t('projectForm.projectRequest.close')}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} ref={formRef}>
              {/* Step 1: Client Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-light text-white/90 mb-6 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-[#d4af37]" />
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
                          className={`group relative p-8 border-2 rounded-xl text-left transition-all duration-300 transform ${
                            formData.clientType === option.type
                              ? 'border-[#d4af37] bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 scale-105 shadow-lg shadow-[#d4af37]/20'
                              : 'border-white/10 hover:border-white/30 hover:bg-white/5 hover:scale-102'
                          }`}
                        >
                          {/* Selection indicator */}
                          {formData.clientType === option.type && (
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#d4af37] rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                              <Check className="w-4 h-4 text-black" />
                            </div>
                          )}

                          {/* Hover glow */}
                          {hoveredOption === option.type && (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-xl" />
                          )}

                          <div className="relative">
                            <div className="text-4xl mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-6">
                              {option.icon}
                            </div>
                            <div className="text-xl font-light text-white mb-2">
                              {option.title}
                            </div>
                            <div className="text-sm text-white/60">
                              {option.desc}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.clientType && (
                      <p className="mt-4 text-sm text-red-400 flex items-center gap-2 animate-shake">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        {errors.clientType}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Project Description */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="projectDescription" className="block text-base font-light text-white/90 mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#d4af37]" />
                        {t('projectForm.steps.projectDescription.title')}
                      </span>
                      <span className={`text-xs transition-colors ${charCount >= 10 ? 'text-green-400' : 'text-white/40'}`}>
                        {charCount} {dir === 'rtl' ? 'حرف' : 'characters'}
                      </span>
                    </label>
                    <div className="relative">
                      <textarea
                        id="projectDescription"
                        value={formData.projectDescription}
                        onChange={(e) => handleChange('projectDescription', e.target.value)}
                        rows={8}
                        className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all resize-none"
                        placeholder={t('projectForm.steps.projectDescription.placeholder')}
                      />
                      {/* Typing indicator */}
                      {formData.projectDescription && (
                        <div className="absolute bottom-4 right-4 flex gap-1">
                          <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                          <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                      )}
                    </div>
                    {errors.projectDescription && (
                      <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        {errors.projectDescription}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Budget Range */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-light text-white/90 mb-4 flex items-center gap-2">
                      <span className="text-2xl">💰</span>
                      {t('projectForm.steps.budget.title')}
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {budgetOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleChange('budgetRange', option.value)}
                          className={`group relative px-6 py-5 border-2 rounded-xl text-left transition-all duration-300 transform overflow-hidden ${
                            formData.budgetRange === option.value
                              ? `border-[#d4af37] bg-gradient-to-r ${option.color} scale-102 shadow-lg shadow-[#d4af37]/20`
                              : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                          }`}
                        >
                          {/* Background pattern */}
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent" />
                          </div>

                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-3xl transform transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">
                                {option.icon}
                              </span>
                              <span className="text-base text-white font-light">
                                {option.label}
                              </span>
                            </div>
                            {formData.budgetRange === option.value && (
                              <div className="w-6 h-6 bg-[#d4af37] rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                                <Check className="w-3.5 h-3.5 text-black" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.budgetRange && (
                      <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        {errors.budgetRange}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Contact Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-light text-white/90 mb-3 flex items-center gap-2">
                      <span className="text-lg">👤</span>
                      {t('projectForm.steps.contact.fullName')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all"
                        placeholder={t('projectForm.steps.contact.fullNamePlaceholder')}
                      />
                      {formData.fullName && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Check className="w-5 h-5 text-green-400" />
                        </div>
                      )}
                    </div>
                    {errors.fullName && (
                      <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-light text-white/90 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#d4af37]" />
                      {t('projectForm.steps.contact.phoneNumber')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all"
                        placeholder={t('projectForm.steps.contact.phoneNumberPlaceholder')}
                      />
                      {formData.phoneNumber && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Check className="w-5 h-5 text-green-400" />
                        </div>
                      )}
                    </div>
                    {errors.phoneNumber && (
                      <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-light text-white/90 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#d4af37]" />
                      {t('projectForm.steps.contact.email')} 
                      <span className="text-white/40 text-xs">({t('projectForm.steps.contact.emailOptional')})</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all"
                        placeholder={t('projectForm.steps.contact.emailPlaceholder')}
                      />
                      {formData.email && /^\S+@\S+\.\S+$/.test(formData.email) && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Check className="w-5 h-5 text-green-400" />
                        </div>
                      )}
                    </div>
                    {errors.email && (
                      <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {formData.clientType === 'company' && (
                    <>
                      <div>
                        <label htmlFor="companyName" className="block text-sm font-light text-white/90 mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#d4af37]" />
                          {t('projectForm.steps.contact.companyName')} <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                            className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all"
                            placeholder={t('projectForm.steps.contact.companyNamePlaceholder')}
                          />
                          {formData.companyName && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <Check className="w-5 h-5 text-green-400" />
                            </div>
                          )}
                        </div>
                        {errors.companyName && (
                          <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                            {errors.companyName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="companySize" className="block text-sm font-light text-white/90 mb-3 flex items-center gap-2">
                          <span className="text-lg">👥</span>
                          {t('projectForm.steps.contact.companySize')} <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                          {companySizeOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleChange('companySize', option.value)}
                              className={`group relative px-6 py-4 border-2 rounded-xl text-left transition-all duration-300 ${
                                formData.companySize === option.value
                                  ? 'border-[#d4af37] bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/5 scale-102 shadow-lg'
                                  : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="text-2xl transform transition-transform group-hover:scale-110">
                                    {option.icon}
                                  </span>
                                  <span className="text-base text-white">
                                    {option.label}
                                  </span>
                                </div>
                                {formData.companySize === option.value && (
                                  <div className="w-5 h-5 bg-[#d4af37] rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-black" />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        {errors.companySize && (
                          <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
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
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1 || loading}
                  className="group flex items-center gap-3 px-6 py-3.5 border-2 border-white/20 text-white text-sm font-light tracking-widest uppercase hover:bg-white/10 hover:border-white/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-xl"
                >
                  <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  {t('projectForm.navigation.back')}
                </button>

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="group relative overflow-hidden flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-black text-sm font-medium tracking-widest uppercase transition-all rounded-xl shadow-lg shadow-[#d4af37]/30 hover:shadow-xl hover:shadow-[#d4af37]/50 hover:scale-105"
                  >
                    <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative">{t('projectForm.navigation.next')}</span>
                    <ChevronRight className="relative w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative overflow-hidden flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-black text-sm font-medium tracking-widest uppercase transition-all rounded-xl shadow-lg shadow-[#d4af37]/30 hover:shadow-xl hover:shadow-[#d4af37]/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading && (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    )}
                    <span className="relative">
                      {loading ? t('projectForm.startProject.submitting') : t('projectForm.navigation.submit')}
                    </span>
                    {!loading && <Sparkles className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-30px) translateX(15px); opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes scale-in {
          0% { transform: scale(0) rotate(-180deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 5s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out; }
        .animate-scale-in { animation: scale-in 0.4s ease-out; }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-fade-in-delay { animation: fade-in 0.6s ease-out 0.2s both; }
        .animate-fade-in-delay-2 { animation: fade-in 0.8s ease-out 0.4s both; }
        .animate-fade-in-delay-3 { animation: fade-in 1s ease-out 0.6s both; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .scale-102 { transform: scale(1.02); }
        
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }
      `}</style>
    </div>
  );
};

export default ProjectRequestForm;