import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Sparkles, Zap, Target, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/api';
import { gsap } from 'gsap';

const StartProject = ({ onComplete }) => {
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

  const containerRef = useRef(null);
  const formRef = useRef(null);
  const progressBarRef = useRef(null);
  const stepRefs = useRef([]);

  const totalSteps = 3;

  const budgetOptions = [
    { value: 'less-than-500', label: t('projectForm.budgetOptions.lessThan500'), icon: '💡' },
    { value: '500-1000', label: t('projectForm.budgetOptions.500to1000'), icon: '🚀' },
    { value: '1000-3000', label: t('projectForm.budgetOptions.1000to3000'), icon: '⭐' },
    { value: '3000-10000', label: t('projectForm.budgetOptions.3000to10000'), icon: '💎' },
    { value: '10000-plus', label: t('projectForm.budgetOptions.10000plus'), icon: '👑' }
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
        if (onComplete) {
          onComplete();
        } else {
          navigate('/app/projects');
        }
      }, 2500);
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
        className="min-h-screen bg-black text-white flex items-center justify-center px-4 overflow-hidden"
        dir={dir}
      >
        {/* Celebration particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#d4af37] rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="text-center max-w-2xl relative z-10">
          <div className="mb-8">
            {/* Success icon with pulse animation */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-[#d4af37]/30 animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-2xl shadow-[#d4af37]/50">
                <Check className="w-12 h-12 text-black animate-bounce-in" />
              </div>
            </div>

            <h2 className="text-4xl md:text-6xl font-light mb-6 text-white/90 animate-fade-in">
              {t('projectForm.startProject.projectCreated')}
            </h2>
            
            <p className="text-xl font-light text-white/70 max-w-md mx-auto mb-8 animate-fade-in-delay">
              {t('projectForm.startProject.projectCreatedDesc')}
            </p>

            {/* Animated success indicators */}
            <div className="flex items-center justify-center gap-6 text-sm text-white/50 animate-fade-in-delay-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>Project Created</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#d4af37]" />
                <span>Team Notified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black text-white px-4 py-12 md:py-20 relative overflow-hidden"
      dir={dir}
    >
      {/* Enhanced background with animated gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 via-transparent to-[#d4af37]/5 animate-gradient" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Enhanced Header with icon */}
        <div className="mb-12 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#d4af37]/20 blur-xl rounded-full" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center">
                <Target className="w-8 h-8 text-black" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-4 text-white/90 bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
            {t('projectForm.startProject.title')}
          </h1>
          
          <p className="text-lg font-light text-white/60 max-w-xl mx-auto">
            {user?.fullName 
              ? t('projectForm.startProject.welcome', { name: user.fullName.split(' ')[0] })
              : t('projectForm.startProject.welcomeNoName')
            }
          </p>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="mb-10">
          {/* Progress bar background */}
          <div className="relative h-2 bg-white/5 rounded-full mb-6 overflow-hidden">
            <div 
              ref={progressBarRef}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer" />
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div
                  ref={el => stepRefs.current[step - 1] = el}
                  className={`relative group w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ${
                    currentStep >= step
                      ? 'bg-gradient-to-br from-[#d4af37] to-[#f4d03f] text-black scale-110 shadow-lg shadow-[#d4af37]/50'
                      : 'bg-white/5 text-white/40 scale-100'
                  }`}
                >
                  {currentStep > step ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{step}</span>
                  )}
                  
                  {/* Pulse effect for current step */}
                  {currentStep === step && (
                    <div className="absolute inset-0 rounded-full bg-[#d4af37]/30 animate-ping" />
                  )}
                </div>
                {step < 3 && (
                  <div className="flex-1 h-px mx-2 bg-transparent" />
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
          className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl overflow-hidden"
        >
          {/* Floating particles inside form */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-[#d4af37]/30 rounded-full animate-float-slow"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${10 + i * 15}%`,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative z-10">
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
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#d4af37] rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-4 h-4 text-black" />
                          </div>
                        )}

                        {/* Hover glow effect */}
                        {hoveredOption === option.type && (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-xl" />
                        )}

                        <div className="relative">
                          <div className="text-4xl mb-4 transform transition-transform group-hover:scale-110">
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
                      <span className="w-1 h-1 bg-red-400 rounded-full" />
                      {errors.clientType}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Project Description & Budget */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <label htmlFor="projectDescription" className="block text-base font-light text-white/90 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#d4af37]" />
                      {t('projectForm.steps.projectDescription.title')}
                    </span>
                    <span className={`text-xs ${charCount >= 10 ? 'text-green-400' : 'text-white/40'} transition-colors`}>
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
                      <span className="w-1 h-1 bg-red-400 rounded-full" />
                      {errors.projectDescription}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="budgetRange" className="block text-base font-light text-white/90 mb-4 flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    {t('projectForm.steps.budget.title')}
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {budgetOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange('budgetRange', option.value)}
                        className={`group relative px-6 py-4 border-2 rounded-xl text-left transition-all duration-300 transform ${
                          formData.budgetRange === option.value
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
                          {formData.budgetRange === option.value && (
                            <div className="w-5 h-5 bg-[#d4af37] rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-black" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.budgetRange && (
                    <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                      <span className="w-1 h-1 bg-red-400 rounded-full" />
                      {errors.budgetRange}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Contact Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Pre-filled user info display */}
                <div className="relative p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 blur-3xl" />
                  <div className="relative">
                    <div className="text-xs font-light text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#d4af37] rounded-full" />
                      {t('projectForm.steps.contact.accountInfo')}
                    </div>
                    <div className="space-y-3 text-sm font-light text-white/80">
                      <div className="flex items-center gap-3">
                        <span className="text-white/50">{t('projectForm.steps.contact.name')}:</span>
                        <span className="font-medium">{user?.fullName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/50">{t('projectForm.steps.contact.emailLabel')}:</span>
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
                    className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all"
                    placeholder={t('projectForm.steps.contact.phoneNumberPlaceholder')}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                      <span className="w-1 h-1 bg-red-400 rounded-full" />
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
                        className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all"
                        placeholder={t('projectForm.steps.contact.companyNamePlaceholder')}
                      />
                      {errors.companyName && (
                        <p className="mt-3 text-sm text-red-400 flex items-center gap-2 animate-shake">
                          <span className="w-1 h-1 bg-red-400 rounded-full" />
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
                        className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white focus:outline-none focus:border-[#d4af37] focus:bg-white/10 transition-all cursor-pointer"
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
                          <span className="w-1 h-1 bg-red-400 rounded-full" />
                          {errors.companySize}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {errors.submit && (
                  <div className="p-5 bg-red-500/10 border-2 border-red-500/30 rounded-xl animate-shake">
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full" />
                      {errors.submit}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Navigation Buttons */}
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/10">
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
                    {loading ? t('projectForm.startProject.submitting') : t('projectForm.navigation.create')}
                  </span>
                  {!loading && <Sparkles className="w-5 h-5" />}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-30px) translateX(15px); opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes gradient {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
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
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 5s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        .animate-gradient {
          animation: gradient 3s ease-in-out infinite;
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.2s both;
        }
        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.4s both;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default StartProject;