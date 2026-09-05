import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  CheckCircle2, Sparkles, Send, ArrowRight, ArrowLeft,
  Clock, ShieldCheck, FileText, Layers, ExternalLink, Globe
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const FEATURE_TAGS = [
  { id: 'auth_users',      ar: 'تسجيل دخول وصلاحيات مستخدمين', en: 'User Auth & Role Permissions' },
  { id: 'online_payment',  ar: 'بوابة دفع إلكتروني (Stripe / Mada / Visa)', en: 'Online Payment Integration' },
  { id: 'multilingual',    ar: 'دعم لغات متعددة (عربي / إنجليزي)', en: 'Bilingual RTL/LTR Support' },
  { id: 'admin_dashboard', ar: 'لوحة تحكم إدارية متقدمة', en: 'Advanced Admin Dashboard' },
  { id: 'mobile_app',      ar: 'تطبيق هاتف مرافق (iOS / Android)', en: 'Companion Mobile App' },
  { id: 'notifications',   ar: 'إشعارات فورية وإيميلات آلية', en: 'Automated Email & Push Notifications' },
  { id: 'analytics_ai',    ar: 'تحليلات ذكية / ميزات ذكاء اصطناعي AI', en: 'AI Features & Analytics' },
  { id: 'erp_crm',         ar: 'ربط بنظام محاسبي / CRM مؤسسي', en: 'ERP / CRM Integration' },
];

export default function ProjectBriefResume() {
  const { token } = useParams();
  const { isRTL, language } = useLanguage();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form fields
  const [description, setDescription] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [timeline, setTimeline] = useState('flexible');
  const [budgetRange, setBudgetRange] = useState('not-sure');

  const font = isRTL
    ? "'IBM Plex Sans Arabic', system-ui, sans-serif"
    : "'Inter', system-ui, sans-serif";

  useEffect(() => {
    async function loadBrief() {
      try {
        setLoading(true);
        const res = await api.get(`/project-requests/brief/${token}`);
        const b = res.data.brief;
        setBrief(b);
        setDescription(b.projectDescription || '');
        setReferenceUrl(b.referenceUrl || '');
        setSelectedTags(b.tags || []);
        setTimeline(b.timeline || 'flexible');
        setBudgetRange(b.budgetRange || 'not-sure');
      } catch (err) {
        toast.error(isRTL ? 'الرابط غير صالح أو انتهت صلاحيته' : 'Brief link is invalid or expired');
      } finally {
        setLoading(false);
      }
    }
    if (token) loadBrief();
  }, [token, isRTL]);

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.patch(`/project-requests/brief/${token}`, {
        projectDescription: description,
        referenceUrl,
        tags: selectedTags,
        timeline,
        budgetRange,
      });
      setSubmitted(true);
      toast.success(isRTL ? 'تم حفظ المواصفات بنجاح!' : 'Project brief submitted successfully!');
    } catch (err) {
      toast.error(isRTL ? 'فشل الحفظ، يرجى المحاولة ثانية' : 'Failed to save brief');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#2563EB', animation: 'spin 0.75s linear infinite' }} />
      </div>
    );
  }

  if (!brief) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: font }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
          {isRTL ? 'الرابط غير صالح أو تم حذفه' : 'Brief Not Found'}
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', maxWidth: 400, marginBottom: 20 }}>
          {isRTL ? 'تأكد من فتح الرابط الصحيح الذي استلمته من فريق YANSY Tech.' : 'Please make sure you have the exact link sent by YANSY Tech.'}
        </p>
        <Link to="/" style={{ padding: '8px 18px', borderRadius: 10, background: '#2563EB', color: '#FFFFFF', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
          {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#FAFAFA', direction: isRTL ? 'rtl' : 'ltr', fontFamily: font }}>
        <div style={{ maxWidth: 540, width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '36px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 style={{ width: 28, height: 28 }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
            {isRTL ? `شكراً لك أ. ${brief.fullName}!` : `Thank You, ${brief.fullName}!`}
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
            {isRTL
              ? 'تم استلام مواصفات ومتطلبات مشروعك بنجاح. فريقنا الهندسي يدرس المتطلبات حالياً وسنتواصل معك عبر واتساب لتحديد موعد مكالمة استكشافية ومناقشة تفاصيل العرض.'
              : 'Your project brief has been updated. Our engineering team is reviewing your specifications and will follow up with you shortly via WhatsApp.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <a
              href="https://wa.me/201090385390"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10, background: '#25D366', color: '#FFFFFF',
                textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}
            >
              {isRTL ? 'تواصل معنا فوراً عبر واتساب' : 'Chat on WhatsApp'}
            </a>
            <Link
              to="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10, background: '#F1F5F9', color: '#334155',
                textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}
            >
              {isRTL ? 'الرئيسية' : 'Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      direction: isRTL ? 'rtl' : 'ltr',
      fontFamily: font,
      padding: '40px 20px 80px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Top Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A' }}>
              YANSY<span style={{ color: '#2563EB' }}>.</span>
            </span>
          </Link>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 99, background: 'rgba(37,99,235,0.08)',
            color: '#2563EB', fontSize: 11, fontWeight: 600,
          }}>
            <Sparkles style={{ width: 11, height: 11 }} />
            {isRTL ? 'ملف استكمال المواصفات (Magic Brief)' : 'Magic Brief'}
          </span>
        </div>

        {/* Main Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          padding: '32px 36px',
        }}>
          {/* Header text */}
          <div style={{ marginBottom: 26 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
              {isRTL ? `أهلاً بك ${brief.fullName} 👋` : `Welcome ${brief.fullName} 👋`}
            </h1>
            <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              {isRTL
                ? `استكمل تفاصيل ومواصفات طلبك (${brief.projectType || 'مشروع برمجي'}). يمكنك حفظها ومشاركتها مع فريق العمل في أي وقت.`
                : `Enrich your project specifications for ${brief.projectType || 'Software Project'}. You can save and resume anytime.`}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Field 1: Detailed Scope */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                {isRTL ? '1. فكرة المشروع والمتطلبات الأساسية:' : '1. Project Scope & Core Requirements:'}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={isRTL ? 'اكتب ما تهدف لبنائه، الجمهور المستهدف، وأي تفاصيل تقنية ترغب بها...' : 'Describe what you want to build, target audience, and key features...'}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '1px solid #CBD5E1', background: '#F8FAFC',
                  fontSize: 13, fontFamily: font, outline: 'none', resize: 'vertical',
                }}
              />
            </div>

            {/* Field 2: Feature Tags */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
                {isRTL ? '2. الميزات والأنظمة المطلوبة (اختر ما يناسب مشروعك):' : '2. Key Modules & Features Needed:'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                {FEATURE_TAGS.map(f => {
                  const active = selectedTags.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleTag(f.id)}
                      style={{
                        padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                        border: `1px solid ${active ? '#2563EB' : '#E2E8F0'}`,
                        background: active ? 'rgba(37,99,235,0.05)' : '#FFFFFF',
                        color: active ? '#1D4ED8' : '#334155',
                        fontSize: 12, fontWeight: active ? 600 : 500,
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: 4,
                        border: `1px solid ${active ? '#2563EB' : '#CBD5E1'}`,
                        background: active ? '#2563EB' : '#FFFFFF',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        color: '#FFFFFF', fontSize: 10,
                      }}>
                        {active && '✓'}
                      </span>
                      <span>{isRTL ? f.ar : f.en}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field 3: Reference Links */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                {isRTL ? '3. مواقع أو تطبيقات مشابهة تعجبك (روابط مرجعية):' : '3. Reference URLs & Inspiring Examples:'}
              </label>
              <input
                type="url"
                value={referenceUrl}
                onChange={e => setReferenceUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%', height: 42, padding: '0 12px', borderRadius: 10,
                  border: '1px solid #CBD5E1', background: '#F8FAFC',
                  fontSize: 13, fontFamily: font, outline: 'none',
                }}
              />
            </div>

            {/* Field 4: Timeline & Budget flexibility */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  {isRTL ? 'الجدول الزمني المفضل:' : 'Target Timeline:'}
                </label>
                <select
                  value={timeline}
                  onChange={e => setTimeline(e.target.value)}
                  style={{
                    width: '100%', height: 40, padding: '0 10px', borderRadius: 9,
                    border: '1px solid #CBD5E1', background: '#F8FAFC',
                    fontSize: 12.5, fontFamily: font, outline: 'none',
                  }}
                >
                  <option value="asap">{isRTL ? 'في أقرب وقت ممكن (عاجل)' : 'ASAP'}</option>
                  <option value="1month">{isRTL ? 'خلال شهر (3–4 أسابيع)' : 'Within 1 month'}</option>
                  <option value="2-3months">{isRTL ? 'خلال 2–3 أشهر' : '2–3 months'}</option>
                  <option value="flexible">{isRTL ? 'مرن / أبحث عن أفضل إتقان' : 'Flexible'}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  {isRTL ? 'الميزانية المتوقعة:' : 'Budget Range:'}
                </label>
                <select
                  value={budgetRange}
                  onChange={e => setBudgetRange(e.target.value)}
                  style={{
                    width: '100%', height: 40, padding: '0 10px', borderRadius: 9,
                    border: '1px solid #CBD5E1', background: '#F8FAFC',
                    fontSize: 12.5, fontFamily: font, outline: 'none',
                  }}
                >
                  <option value="not-sure">{isRTL ? 'غير محدد بعد / أبحث عن تقديركم' : 'Not sure / Need estimate'}</option>
                  <option value="1000-3000">$1,000 – $3,000 (30,000 – 90,000 EGP)</option>
                  <option value="3000-10000">$3,000 – $10,000 (90,000 – 300,000 EGP)</option>
                  <option value="10000-plus">$10,000+ (أنظمة مؤسسية متقدمة)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ paddingTop: 10 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', height: 46, borderRadius: 10,
                  background: '#2563EB', color: '#FFFFFF', border: 'none',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 2px 10px rgba(37,99,235,0.25)',
                }}
              >
                {submitting ? (
                  <span>{isRTL ? 'جاري الحفظ...' : 'Saving...'}</span>
                ) : (
                  <>
                    <Send style={{ width: 14, height: 14 }} />
                    <span>{isRTL ? 'حفظ وإرسال المواصفات لفريق YANSY' : 'Submit Enriched Brief'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
