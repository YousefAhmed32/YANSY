import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/api';

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

  const totalSteps = 4;

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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir={dir}>
      <div className="relative w-full max-w-2xl bg-black border border-white/10 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-light text-white">{t('projectForm.projectRequest.title')}</h2>
            <p className="text-sm text-white/60 mt-1">{t('projectForm.projectRequest.stepOf', { current: currentStep, total: totalSteps })}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-[#d4af37] transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Form Content */}
        <div className="p-8">
          {isSubmitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-[#d4af37]" />
              </div>
              <h3 className="text-2xl font-light text-white mb-4">{t('projectForm.projectRequest.requestSubmitted')}</h3>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                {t('projectForm.projectRequest.requestSubmittedDesc')}
              </p>
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-[#d4af37] text-black text-sm font-light tracking-widest uppercase hover:bg-[#d4af37]/90 transition-all"
              >
                {t('projectForm.projectRequest.close')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Step 1: Client Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-light text-white/80 mb-4">
                      {t('projectForm.steps.clientType.title')}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleChange('clientType', 'individual')}
                        className={`p-6 border-2 rounded-lg text-left transition-all ${
                          formData.clientType === 'individual'
                            ? 'border-[#d4af37] bg-[#d4af37]/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-lg font-light text-white mb-1">{t('projectForm.steps.clientType.individual')}</div>
                        <div className="text-sm text-white/60">{t('projectForm.steps.clientType.individualDesc')}</div>
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
                        <div className="text-lg font-light text-white mb-1">{t('projectForm.steps.clientType.company')}</div>
                        <div className="text-sm text-white/60">{t('projectForm.steps.clientType.companyDesc')}</div>
                      </button>
                    </div>
                    {errors.clientType && (
                      <p className="mt-2 text-sm text-red-400">{errors.clientType}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Project Description */}
              {currentStep === 2 && (
                <div className="space-y-6">
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
                </div>
              )}

              {/* Step 3: Budget Range */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="budgetRange" className="block text-sm font-light text-white/80 mb-4">
                      {t('projectForm.steps.budget.title')}
                    </label>
                    <select
                      id="budgetRange"
                      value={formData.budgetRange}
                      onChange={(e) => handleChange('budgetRange', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                    >
                      <option value="">{t('projectForm.steps.budget.select')}</option>
                      {budgetOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-black text-red-500">
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

              {/* Step 4: Contact Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-light text-white/80 mb-2">
                      {t('projectForm.steps.contact.fullName')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-colors"
                      placeholder={t('projectForm.steps.contact.fullNamePlaceholder')}
                    />
                    {errors.fullName && (
                      <p className="mt-2 text-sm text-red-400">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-light text-white/80 mb-2">
                      {t('projectForm.steps.contact.phoneNumber')} <span className="text-red-400">*</span>
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

                  <div>
                    <label htmlFor="email" className="block text-sm font-light text-white/80 mb-2">
                      {t('projectForm.steps.contact.email')} <span className="text-white/40 text-xs">({t('projectForm.steps.contact.emailOptional')})</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-colors"
                      placeholder={t('projectForm.steps.contact.emailPlaceholder')}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                    )}
                  </div>

                  {formData.clientType === 'company' && (
                    <>
                      <div>
                        <label htmlFor="companyName" className="block text-sm font-light text-white/80 mb-2">
                          {t('projectForm.steps.contact.companyName')} <span className="text-red-400">*</span>
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
                          {t('projectForm.steps.contact.companySize')} <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="companySize"
                          value={formData.companySize}
                          onChange={(e) => handleChange('companySize', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                        >
                          <option value="">{t('projectForm.steps.contact.companySizeSelect')}</option>
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
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
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
                    className="flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-black text-sm font-light tracking-widest uppercase hover:bg-[#d4af37]/90 transition-all"
                  >
                    {t('projectForm.navigation.next')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-black text-sm font-light tracking-widest uppercase hover:bg-[#d4af37]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('projectForm.startProject.submitting') : t('projectForm.navigation.submit')}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectRequestForm;

