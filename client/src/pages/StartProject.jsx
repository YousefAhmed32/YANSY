import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
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

  const containerRef = useRef(null);
  const formRef = useRef(null);

  const totalSteps = 3;

  const budgetOptions = [
    { value: 'less-than-500', label: t('projectForm.budgetOptions.lessThan500') },
    { value: '500-1000', label: t('projectForm.budgetOptions.500to1000') },
    { value: '1000-3000', label: t('projectForm.budgetOptions.1000to3000') },
    { value: '3000-10000', label: t('projectForm.budgetOptions.3000to10000') },
    { value: '10000-plus', label: t('projectForm.budgetOptions.10000plus') }
  ];

  const companySizeOptions = [
    { value: 'less-than-10', label: t('projectForm.companySizeOptions.lessThan10') },
    { value: '10-50', label: t('projectForm.companySizeOptions.10to50') },
    { value: '50-plus', label: t('projectForm.companySizeOptions.50plus') }
  ];

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );
    }
  }, []);

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
      // Create project directly (not project request)
      const projectData = {
        title: formData.projectDescription.substring(0, 50) + '...', // Use description as title
        description: formData.projectDescription,
        budget: formData.budgetRange,
        clientType: formData.clientType,
        companyName: formData.clientType === 'company' ? formData.companyName : undefined,
        companySize: formData.clientType === 'company' ? formData.companySize : undefined,
        phoneNumber: formData.phoneNumber
      };

      await api.post('/projects', projectData);
      setIsSubmitted(true);
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          navigate('/app/projects');
        }
      }, 2000);
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
        className="min-h-screen bg-black text-white flex items-center justify-center px-4"
        dir={dir}
      >
        <div className="text-center max-w-2xl">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-[#d4af37]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-light mb-4 text-white/90">
              {t('projectForm.startProject.projectCreated')}
            </h2>
            <p className="text-lg font-light text-white/60 max-w-md mx-auto">
              {t('projectForm.startProject.projectCreatedDesc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black text-white px-4 py-12 md:py-20"
      dir={dir}
    >
      {/* Background subtle pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6">
            <span className="block w-24 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-4 text-white/90">
            {t('projectForm.startProject.title')}
          </h1>
          
          <p className="text-lg font-light text-white/50 max-w-xl mx-auto">
            {user?.fullName 
              ? t('projectForm.startProject.welcome', { name: user.fullName.split(' ')[0] })
              : t('projectForm.startProject.welcomeNoName')
            }
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-light transition-all duration-300 ${
                    currentStep >= step
                      ? 'bg-[#d4af37] text-black'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-px mx-2 transition-all duration-300 ${
                      currentStep > step ? 'bg-[#d4af37]' : 'bg-white/10'
                    }`}
                  />
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

        {/* Form Content */}
        <div 
          ref={formRef}
          className="bg-white/5 border border-white/10 rounded-lg p-8 md:p-12"
        >
          <form onSubmit={handleSubmit}>
            {/* Step 1: Client Type */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-light text-white/80 mb-6">
                    Are you requesting as an individual or a company?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleChange('clientType', 'individual')}
                      className={`p-6 border-2 rounded-lg text-left transition-all ${
                        formData.clientType === 'individual'
                          ? 'border-[#d4af37] bg-[#d4af37]/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-lg font-light text-white mb-1">Individual</div>
                      <div className="text-sm text-white/60">Personal project or freelance work</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('clientType', 'company')}
                      className={`p-6 border-2 rounded-lg text-left transition-all ${
                        formData.clientType === 'company'
                          ? 'border-[#d4af37] bg-[#d4af37]/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-lg font-light text-white mb-1">Company</div>
                      <div className="text-sm text-white/60">Business or organization</div>
                    </button>
                  </div>
                  {errors.clientType && (
                    <p className="mt-3 text-sm text-red-400">{errors.clientType}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Project Description & Budget */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-light text-white/80 mb-3">
                    {t('projectForm.steps.projectDescription.title')}
                  </label>
                  <textarea
                    id="projectDescription"
                    value={formData.projectDescription}
                    onChange={(e) => handleChange('projectDescription', e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-colors resize-none"
                    placeholder={t('projectForm.steps.projectDescription.placeholder')}
                  />
                  {errors.projectDescription && (
                    <p className="mt-2 text-sm text-red-400">{errors.projectDescription}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="budgetRange" className="block text-sm font-light text-white/80 mb-4">
                    What is your budget range?
                  </label>
                  <select
                    id="budgetRange"
                    value={formData.budgetRange}
                    onChange={(e) => handleChange('budgetRange', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  >
                    <option value="">Select budget range</option>
                    {budgetOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-black">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.budgetRange && (
                    <p className="mt-2 text-sm text-red-400">{errors.budgetRange}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Contact Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Pre-filled user info display */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg mb-6">
                  <div className="text-xs font-light text-white/40 uppercase tracking-widest mb-3">
                    {t('projectForm.steps.contact.accountInfo')}
                  </div>
                  <div className="space-y-2 text-sm font-light text-white/70">
                    <div>
                      <span className="text-white/40">{t('projectForm.steps.contact.name')}:</span> {user?.fullName}
                    </div>
                    <div>
                      <span className="text-white/40">{t('projectForm.steps.contact.emailLabel')}:</span> {user?.email}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-light text-white/80 mb-2">
                    {t('projectForm.steps.contact.phoneNumber')} <span className="text-white/40 text-xs">({t('projectForm.steps.contact.phoneNumberEditable')})</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-colors"
                    placeholder={t('projectForm.steps.contact.phoneNumberPlaceholder')}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-2 text-sm text-red-400">{errors.phoneNumber}</p>
                  )}
                </div>

                {formData.clientType === 'company' && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-light text-white/80 mb-2">
                        {t('projectForm.steps.contact.companyName')}
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-colors"
                        placeholder={t('projectForm.steps.contact.companyNamePlaceholder')}
                      />
                      {errors.companyName && (
                        <p className="mt-2 text-sm text-red-400">{errors.companyName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="companySize" className="block text-sm font-light text-white/80 mb-2">
                        Company Size
                      </label>
                      <select
                        id="companySize"
                        value={formData.companySize}
                        onChange={(e) => handleChange('companySize', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                      >
                        <option value="">Select company size</option>
                        {companySizeOptions.map(option => (
                          <option key={option.value} value={option.value} className="bg-black">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.companySize && (
                        <p className="mt-2 text-sm text-red-400">{errors.companySize}</p>
                      )}
                    </div>
                  </>
                )}

                {errors.submit && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{errors.submit}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-10 pt-8 border-t border-white/10">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
                className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white text-sm font-light tracking-widest uppercase hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('projectForm.navigation.back')}
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 bg-[#d4af37] text-black text-sm font-light tracking-widest uppercase hover:bg-[#d4af37]/90 transition-all"
                >
                  {t('projectForm.navigation.next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-[#d4af37] text-black text-sm font-light tracking-widest uppercase hover:bg-[#d4af37]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('projectForm.startProject.submitting') : t('projectForm.navigation.submit')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StartProject;

