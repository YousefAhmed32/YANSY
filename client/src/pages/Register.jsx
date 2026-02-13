import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { register, clearError } from '../store/authSlice';
import { gsap } from 'gsap';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [brandName, setBrandName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [localError, setLocalError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const formRef = useRef(null);
  const personalSectionRef = useRef(null);
  const businessSectionRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  // GSAP entrance animations
  useEffect(() => {
    if (containerRef.current && titleRef.current && subtitleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 0.2 }
      );
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 }
      );
      if (personalSectionRef.current) {
        gsap.fromTo(
          personalSectionRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08, delay: 0.6 }
        );
      }
      if (businessSectionRef.current) {
        gsap.fromTo(
          businessSectionRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08, delay: 0.8 }
        );
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setLocalError('');

    if (!email || !password || !fullName || !phoneNumber) {
      setLocalError(t('auth.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      setLocalError(t('register.passwordMinLength'));
      return;
    }

    if (fullName.trim().length < 2) {
      setLocalError(t('register.nameMinLength'));
      return;
    }

    if (!brandName && !companyName) {
      setLocalError(t('register.brandOrCompanyRequired'));
      return;
    }

    submittingRef.current = true;
    const result = await dispatch(register({
      email,
      password,
      fullName,
      phoneNumber,
      brandName: brandName || null,
      companyName: companyName || null
    }));
    submittingRef.current = false;

    if (register.rejected.match(result)) {
      setLocalError(result.payload || t('register.registrationFailed'));
      setTimeout(() => {
        const errorEl = formRef.current?.querySelector('[data-error]');
        if (errorEl) {
          gsap.fromTo(
            errorEl,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
          );
        }
      }, 0);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black text-white px-4 py-20"
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

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Brand */}
        <div className="mb-16 text-center">
          <Link 
            to="/" 
            className="inline-block text-5xl md:text-6xl font-light tracking-tight mb-4 hover:text-[#d4af37] transition-colors duration-300"
          >
            YANSY
          </Link>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto" />
        </div>

        {/* Title & Subtitle */}
        <div className="mb-16 text-center">
          <h1 
            ref={titleRef}
            className="text-5xl md:text-6xl font-light tracking-tight mb-4 text-white/90"
          >
            {t('auth.registerTitle')}
          </h1>
          <p 
            ref={subtitleRef}
            className="text-lg md:text-xl font-light text-white/50 max-w-xl mx-auto"
          >
            {t('register.subtitle')}
          </p>
        </div>

        {/* Form */}
        <form 
          ref={formRef}
          className="space-y-12" 
          onSubmit={handleSubmit}
        >
          {/* Error Message */}
          {localError && (
            <div 
              data-error
              className="px-6 py-4 bg-white/5 border border-white/10 rounded-sm"
            >
              <p className="text-sm font-light text-white/70">
                {localError}
              </p>
            </div>
          )}

          {/* Personal Information Section */}
          <div ref={personalSectionRef} className="space-y-8">
            <div className="pb-4 border-b border-white/10">
              <h2 className="text-sm font-light text-white/60 tracking-widest uppercase">
                {t('register.personalInfo')}
              </h2>
            </div>

            <div className="space-y-8">
              {/* Full Name */}
              <div className="space-y-2">
                <label 
                  htmlFor="fullName" 
                  className="block text-sm font-light text-white/60 tracking-wide uppercase"
                >
                  {t('register.fullName')} *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  className="w-full px-0 py-4 bg-transparent border-0 border-b border-white/20 text-white placeholder-white/30 font-light text-lg focus:outline-none focus:border-[#d4af37] transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={t('register.fullNamePlaceholder')}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="block text-sm font-light text-white/60 tracking-wide uppercase"
                >
                  {t('auth.email')} *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  className="w-full px-0 py-4 bg-transparent border-0 border-b border-white/20 text-white placeholder-white/30 font-light text-lg focus:outline-none focus:border-[#d4af37] transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label 
                  htmlFor="phoneNumber" 
                  className="block text-sm font-light text-white/60 tracking-wide uppercase"
                >
                  {t('register.phoneNumber')} *
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onFocus={() => setFocusedField('phoneNumber')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  className="w-full px-0 py-4 bg-transparent border-0 border-b border-white/20 text-white placeholder-white/30 font-light text-lg focus:outline-none focus:border-[#d4af37] transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={t('register.phoneNumberPlaceholder')}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-light text-white/60 tracking-wide uppercase"
                >
                  {t('auth.password')} *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  className="w-full px-0 py-4 bg-transparent border-0 border-b border-white/20 text-white placeholder-white/30 font-light text-lg focus:outline-none focus:border-[#d4af37] transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={t('register.passwordPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div ref={businessSectionRef} className="space-y-8">
            <div className="pb-4 border-b border-white/10">
              <h2 className="text-sm font-light text-white/60 tracking-widest uppercase">
                {t('register.businessInfo')}
              </h2>
              <p className="mt-2 text-xs font-light text-white/40">
                {t('register.brandOrCompanyHint')}
              </p>
            </div>

            <div className="space-y-8">
              {/* Brand Name */}
              <div className="space-y-2">
                <label 
                  htmlFor="brandName" 
                  className="block text-sm font-light text-white/60 tracking-wide uppercase"
                >
                  {t('register.brandName')}
                </label>
                <input
                  id="brandName"
                  name="brandName"
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  onFocus={() => setFocusedField('brandName')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  className="w-full px-0 py-4 bg-transparent border-0 border-b border-white/20 text-white placeholder-white/30 font-light text-lg focus:outline-none focus:border-[#d4af37] transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={t('register.brandNamePlaceholder')}
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <label 
                  htmlFor="companyName" 
                  className="block text-sm font-light text-white/60 tracking-wide uppercase"
                >
                  {t('register.companyName')}
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onFocus={() => setFocusedField('companyName')}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                  className="w-full px-0 py-4 bg-transparent border-0 border-b border-white/20 text-white placeholder-white/30 font-light text-lg focus:outline-none focus:border-[#d4af37] transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={t('register.companyNamePlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#d4af37]"
            >
              {loading ? t('register.creatingAccount') : t('register.createAccount')}
            </button>
          </div>

          {/* Privacy Note */}
          <div className="text-center pt-4">
            <p className="text-xs font-light text-white/30">
              {t('register.privacyNote')}
            </p>
          </div>

          {/* Login Link */}
          <div className="text-center pt-4">
            <p className="text-sm font-light text-white/40">
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className="text-white/60 hover:text-[#d4af37] transition-colors duration-300 underline underline-offset-4"
              >
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;