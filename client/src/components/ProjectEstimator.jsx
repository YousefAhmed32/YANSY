import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Sparkles, MessageCircle, ArrowUpRight, CheckCircle2, Layers,
  Compass, Palette, Code2, ShieldCheck, Rocket, LifeBuoy,
  Globe, LayoutDashboard, Boxes, Bot, ShoppingBag, CalendarClock, Building2,
  Users, CreditCard, Workflow, Plug, Gauge, Search, Smartphone, Zap, Lock,
} from 'lucide-react';
import { trackWhatsAppClick, trackCTAClick } from '../utils/ga4';
import SectionHeader from './SectionHeader';
import { RevealItems } from './Reveal';

const WA_NUMBER = '201090385390';

// Complexity is a qualitative signal, not a price — it tells the visitor how
// much engineering/design depth their idea likely needs.
const COMPLEXITY_LEVELS = [
  { labelAr: 'بسيط', labelEn: 'Simple' },
  { labelAr: 'قياسي', labelEn: 'Standard' },
  { labelAr: 'متقدم', labelEn: 'Advanced' },
  { labelAr: 'مؤسسي', labelEn: 'Enterprise' },
];

const PROJECT_TYPES = [
  { id: 'landing', icon: Rocket, titleAr: 'صفحة هبوط', titleEn: 'Landing Page', descAr: 'صفحة واحدة عالية التحويل لإطلاق فكرة أو حملة بسرعة', descEn: 'A single, high-converting page built to launch an idea or campaign fast.', baseComplexity: 0 },
  { id: 'business', icon: Globe, titleAr: 'موقع أعمال', titleEn: 'Business Website', descAr: 'حضور رقمي احترافي متعدد الصفحات يعكس علامتك التجارية', descEn: 'A professional, multi-page presence that reflects your brand.', baseComplexity: 0 },
  { id: 'platform', icon: LayoutDashboard, titleAr: 'منصة ويب مخصصة', titleEn: 'Custom Web Platform', descAr: 'نظام ويب مبني خصيصاً حول تدفق عملك وعملياتك', descEn: 'A tailor-built web system designed around your specific workflow.', baseComplexity: 1 },
  { id: 'booking', icon: CalendarClock, titleAr: 'نظام حجوزات', titleEn: 'Booking System', descAr: 'جدولة وحجز مؤتمت للخدمات أو المواعيد أو الموارد', descEn: 'Automated scheduling and reservations for services or appointments.', baseComplexity: 1 },
  { id: 'saas', icon: Boxes, titleAr: 'منصة SaaS', titleEn: 'SaaS Platform', descAr: 'منتج اشتراكي متعدد المستخدمين مبني للنمو والتوسّع', descEn: 'A multi-tenant, subscription-ready product built to scale.', baseComplexity: 2 },
  { id: 'ai', icon: Bot, titleAr: 'حل ذكاء اصطناعي', titleEn: 'AI Solution', descAr: 'مساعد أو أتمتة ذكية مبنية على بيانات عملك', descEn: 'An intelligent assistant or automation layer built on your data.', baseComplexity: 2 },
  { id: 'marketplace', icon: ShoppingBag, titleAr: 'سوق إلكتروني', titleEn: 'Marketplace', descAr: 'منصة تربط بائعين ومشترين عبر معاملات متعددة الأطراف', descEn: 'A platform connecting buyers and sellers through multi-party transactions.', baseComplexity: 2 },
  { id: 'erp', icon: Building2, titleAr: 'نظام ERP / CRM', titleEn: 'ERP / CRM System', descAr: 'نظام إداري متكامل لتشغيل عملياتك الداخلية بالكامل', descEn: 'An integrated system engineered to run your internal operations.', baseComplexity: 3 },
];

const CAPABILITIES = [
  { id: 'accounts', icon: Users, labelAr: 'حسابات مستخدمين وصلاحيات', labelEn: 'User Accounts & Role-Based Access', weight: 1 },
  { id: 'payments', icon: CreditCard, labelAr: 'مدفوعات واشتراكات', labelEn: 'Payments & Subscriptions', weight: 1 },
  { id: 'multilingual', icon: Globe, labelAr: 'محتوى متعدد اللغات (عربي / إنجليزي)', labelEn: 'Multi-language Content (AR/EN)', weight: 0 },
  { id: 'automation', icon: Workflow, labelAr: 'أتمتة سير العمل (واتساب / إيميل / API)', labelEn: 'Workflow Automation (WhatsApp/Email/API)', weight: 1 },
  { id: 'ai_features', icon: Sparkles, labelAr: 'ميزات ذكاء اصطناعي (بحث، مساعد، توصيات)', labelEn: 'AI Features (Search, Assistant, Recommendations)', weight: 2 },
  { id: 'integrations', icon: Plug, labelAr: 'تكاملات مع أنظمة خارجية (CRM, ERP, تحليلات)', labelEn: 'Third-Party Integrations (CRM, ERP, Analytics)', weight: 1 },
];

// Delivery track is a preference, not a promise — estimates stay positive and
// widen automatically for heavier scopes instead of quoting long day counts.
const DELIVERY_TRACKS = [
  {
    id: 'standard',
    icon: Gauge,
    labelAr: 'قياسي',
    labelEn: 'Standard',
    descAr: 'وتيرة متوازنة مع مراجعة جودة كاملة',
    descEn: 'A balanced pace with full quality review at every step.',
    estimateAr: ['2–4 أسابيع', '3–5 أسابيع', '5–8 أسابيع', 'خطة تسليم مرحلية'],
    estimateEn: ['2–4 Weeks', '3–5 Weeks', '5–8 Weeks', 'Phased Rollout Plan'],
  },
  {
    id: 'fast',
    icon: Zap,
    labelAr: 'سريع',
    labelEn: 'Fast',
    descAr: 'فريق مركّز وجدول عمل مكثّف لتسريع الإطلاق',
    descEn: 'A focused team on an intensive schedule to accelerate launch.',
    estimateAr: ['1–2 أسبوع', '2–3 أسابيع', '3–5 أسابيع', 'تسريع مرحلي مُدار'],
    estimateEn: ['1–2 Weeks', '2–3 Weeks', '3–5 Weeks', 'Accelerated Rollout'],
  },
  {
    id: 'priority',
    icon: Rocket,
    labelAr: 'أولوية',
    labelEn: 'Priority',
    descAr: 'فريق تنفيذ مخصص بالكامل ومحجوز لمشروعك',
    descEn: 'A fully dedicated delivery team reserved for your project.',
    estimateAr: ['فريق مخصص بالكامل', 'فريق مخصص بالكامل', 'فريق مخصص بالكامل', 'برنامج تنفيذ مخصص'],
    estimateEn: ['Fully Dedicated Team', 'Fully Dedicated Team', 'Fully Dedicated Team', 'Dedicated Program Team'],
  },
];

const PHASES = [
  { icon: Compass, labelAr: 'الاكتشاف', labelEn: 'Discovery' },
  { icon: Palette, labelAr: 'تصميم UX/UI', labelEn: 'UX/UI Design' },
  { icon: Code2, labelAr: 'التطوير', labelEn: 'Development' },
  { icon: ShieldCheck, labelAr: 'ضمان الجودة', labelEn: 'QA' },
  { icon: Rocket, labelAr: 'الإطلاق', labelEn: 'Launch' },
  { icon: LifeBuoy, labelAr: 'الدعم', labelEn: 'Support' },
];

const INCLUDED_SERVICES = [
  { icon: Lock, labelAr: 'ملكية 100٪ للكود المصدري', labelEn: '100% Source Code Ownership' },
  { icon: LifeBuoy, labelAr: 'دعم ما بعد الإطلاق', labelEn: 'Post-Launch Support' },
  { icon: Layers, labelAr: 'بنية قابلة للتوسّع', labelEn: 'Scalable Architecture' },
  { icon: ShieldCheck, labelAr: 'أمان بمستوى المؤسسات', labelEn: 'Enterprise-Grade Security' },
  { icon: Search, labelAr: 'جاهزية كاملة لمحركات البحث', labelEn: 'SEO-Ready Foundation' },
  { icon: Smartphone, labelAr: 'تجاوب كامل مع كل الشاشات', labelEn: 'Fully Responsive' },
  { icon: Zap, labelAr: 'أداء محسّن للسرعة', labelEn: 'Performance Optimized' },
];

const ProjectEstimator = () => {
  const { isRTL } = useLanguage();
  const [selectedType, setSelectedType] = useState(PROJECT_TYPES[0]);
  const [selectedCapabilities, setSelectedCapabilities] = useState(['multilingual']);
  const [selectedTrack, setSelectedTrack] = useState(DELIVERY_TRACKS[0]);

  const toggleCapability = (id) => {
    setSelectedCapabilities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const complexityIndex = useMemo(() => {
    const weightSum = CAPABILITIES
      .filter((c) => selectedCapabilities.includes(c.id))
      .reduce((sum, c) => sum + c.weight, 0);
    return Math.min(3, selectedType.baseComplexity + Math.floor(weightSum / 3));
  }, [selectedType, selectedCapabilities]);

  const complexity = COMPLEXITY_LEVELS[complexityIndex];
  const deliveryEstimate = isRTL
    ? selectedTrack.estimateAr[complexityIndex]
    : selectedTrack.estimateEn[complexityIndex];

  const TrackIcon = selectedTrack.icon;

  const handleWhatsAppSend = () => {
    trackWhatsAppClick('estimator_whatsapp');
    trackCTAClick('estimator_send', 'project_estimator');

    const typeName = isRTL ? selectedType.titleAr : selectedType.titleEn;
    const complexityName = isRTL ? complexity.labelAr : complexity.labelEn;
    const trackName = isRTL ? selectedTrack.labelAr : selectedTrack.labelEn;
    const capabilityNames = selectedCapabilities
      .map((id) => {
        const cap = CAPABILITIES.find((c) => c.id === id);
        return cap ? `• ${isRTL ? cap.labelAr : cap.labelEn}` : '';
      })
      .filter(Boolean)
      .join('\n') || (isRTL ? '• لم يتم تحديد إمكانيات إضافية' : '• No additional capabilities selected');

    const msgAr = `مرحباً YANSY 👋%0A%0Aأرغب في مناقشة مشروع بالمواصفات التالية:%0A📌 *نوع المشروع:* ${typeName}%0A🧩 *مستوى التعقيد المتوقع:* ${complexityName}%0A%0A⚙️ *الإمكانيات المطلوبة:*%0A${encodeURIComponent(capabilityNames)}%0A%0A🚀 *المسار المفضل للتسليم:* ${trackName}%0A%0Aحابب أتناقش معكم في التفاصيل وخطة العمل المقترحة!`;

    const msgEn = `Hello YANSY 👋%0A%0AI'd like to discuss a project with the following scope:%0A📌 *Project Type:* ${typeName}%0A🧩 *Expected Complexity:* ${complexityName}%0A%0A⚙️ *Requested Capabilities:*%0A${encodeURIComponent(capabilityNames)}%0A%0A🚀 *Preferred Delivery Track:* ${trackName}%0A%0ALet's connect and discuss the plan!`;

    const finalUrl = `https://wa.me/${WA_NUMBER}?text=${isRTL ? msgAr : msgEn}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="estimator" dir={isRTL ? 'rtl' : 'ltr'} className="section-shell section-shell--plain">
      <style>{`
        .est-inner { max-width: 1080px; margin: 0 auto; }

        .est-grid { display: grid; grid-template-columns: 7fr 5fr; gap: clamp(20px, 3vw, 32px); align-items: start; }
        @media (max-width: 1024px) { .est-grid { grid-template-columns: 1fr; } }

        /* ── Form card ── */
        .est-form-card {
          background: rgb(var(--bg-elevated));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-sm);
          padding: clamp(22px, 3vw, 32px);
          display: flex; flex-direction: column; gap: clamp(24px, 3vw, 32px);
        }
        .est-step-label {
          display: block; font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: rgb(var(--text-tertiary)); margin-bottom: 12px;
        }
        [dir="rtl"] .est-step-label { letter-spacing: 0; }

        /* Project type */
        .est-type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 640px) { .est-type-grid { grid-template-columns: repeat(2, 1fr); } }
        .est-type-btn {
          position: relative; display: flex; flex-direction: column; gap: 10px;
          text-align: ${isRTL ? 'right' : 'left'};
          border-radius: var(--radius-lg); border: 1px solid rgb(var(--border));
          background: rgb(var(--bg-elevated)); padding: 14px;
          cursor: pointer; transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .est-type-btn:hover { border-color: rgb(var(--border-strong)); transform: translateY(-2px); }
        .est-type-btn:focus-visible { outline: 2px solid rgb(var(--accent)); outline-offset: 2px; }
        .est-type-btn.is-active {
          border-color: rgb(var(--accent)); background: rgb(var(--accent-light));
          box-shadow: 0 0 0 1px rgb(var(--accent)); transform: none;
        }
        .est-type-check { position: absolute; top: 10px; ${isRTL ? 'left' : 'right'}: 10px; width: 16px; height: 16px; color: rgb(var(--accent)); }
        .est-type-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgb(var(--bg-secondary)); color: rgb(var(--text-tertiary));
          transition: background 0.2s ease, color 0.2s ease;
        }
        .est-type-btn.is-active .est-type-icon { background: rgb(var(--accent)); color: #fff; }
        .est-type-icon svg { width: 18px; height: 18px; }
        .est-type-title { font-size: 13px; font-weight: 700; line-height: 1.3; color: rgb(var(--text-primary)); }
        .est-type-btn.is-active .est-type-title { color: rgb(var(--accent)); }

        /* Capabilities */
        .est-cap-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media (max-width: 560px) { .est-cap-grid { grid-template-columns: 1fr; } }
        .est-cap-btn {
          display: flex; align-items: center; gap: 12px;
          border-radius: var(--radius-md); border: 1px solid rgb(var(--border));
          background: rgb(var(--bg-elevated)); padding: 12px 14px;
          font-size: 12.5px; font-weight: 500; color: rgb(var(--text-secondary));
          cursor: pointer; transition: border-color 0.2s ease, background 0.2s ease;
        }
        .est-cap-btn:hover { border-color: rgb(var(--border-strong)); }
        .est-cap-btn:focus-visible { outline: 2px solid rgb(var(--accent)); outline-offset: 2px; }
        .est-cap-btn.is-active { border-color: rgb(var(--accent)); background: rgb(var(--accent-light)); color: rgb(var(--text-primary)); font-weight: 600; }
        .est-cap-icon {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgb(var(--border-strong)); background: rgb(var(--bg-elevated)); color: rgb(var(--text-tertiary));
        }
        .est-cap-btn.is-active .est-cap-icon { background: rgb(var(--accent)); border-color: rgb(var(--accent)); color: #fff; }
        .est-cap-icon svg { width: 15px; height: 15px; }
        .est-cap-text { flex: 1; text-align: ${isRTL ? 'right' : 'left'}; line-height: 1.4; }
        .est-cap-checkbox {
          width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgb(var(--border-strong));
        }
        .est-cap-btn.is-active .est-cap-checkbox { background: rgb(var(--accent)); border-color: rgb(var(--accent)); }

        /* Delivery track */
        .est-track-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 640px) { .est-track-grid { grid-template-columns: 1fr; } }
        .est-track-btn {
          display: flex; flex-direction: column; gap: 8px;
          text-align: ${isRTL ? 'right' : 'left'};
          border-radius: var(--radius-lg); border: 1px solid rgb(var(--border));
          background: rgb(var(--bg-elevated)); padding: 14px;
          cursor: pointer; transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
        }
        .est-track-btn:hover { border-color: rgb(var(--border-strong)); }
        .est-track-btn:focus-visible { outline: 2px solid rgb(var(--accent)); outline-offset: 2px; }
        .est-track-btn.is-active { border-color: rgb(var(--surface-strong)); background: rgb(var(--surface-strong)); box-shadow: var(--shadow-md); }
        .est-track-head { display: flex; align-items: center; gap: 8px; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; }
        .est-track-head svg { width: 16px; height: 16px; color: rgb(var(--text-tertiary)); }
        .est-track-btn.is-active .est-track-head svg { color: #fff; }
        .est-track-label { font-size: 13.5px; font-weight: 700; color: rgb(var(--text-primary)); }
        .est-track-btn.is-active .est-track-label { color: #fff; }
        .est-track-desc { font-size: 11px; line-height: 1.5; color: rgb(var(--text-tertiary)); }
        .est-track-btn.is-active .est-track-desc { color: rgb(255 255 255 / 0.7); }

        /* ── Summary card — the one deliberately dark surface on this page,
           same near-black used by .btn-primary/--surface-strong and
           ContactSection's contrast band, not a separate ad-hoc palette. ── */
        .est-summary {
          position: sticky; top: 96px;
          background: rgb(var(--bg-contrast));
          color: rgb(var(--on-contrast));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--radius-2xl);
          padding: clamp(22px, 3vw, 32px);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        /* relative, not static — this still cancels the sticky-to-viewport
           behavior below 1024px (no offsets are set, so it sits in normal flow
           exactly like static would), but keeps .est-summary a positioning
           context. .est-summary-glow below is an absolutely positioned blob
           with a negative offset; under static it has no containing block
           here and escapes all the way to the initial containing block,
           landing outside .est-summary's own overflow:hidden clip and
           blowing out the page's horizontal scrollWidth on every mobile
           width. */
        @media (max-width: 1024px) { .est-summary { position: relative; } }
        .est-summary-glow {
          position: absolute; top: -60px; ${isRTL ? 'left' : 'right'}: -60px; width: 220px; height: 220px;
          border-radius: 50%; background: rgb(var(--accent) / 0.16); filter: blur(70px);
          pointer-events: none;
        }
        .est-summary-inner { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 22px; }

        .est-summary-head {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);
          flex-direction: ${isRTL ? 'row-reverse' : 'row'};
        }
        .est-summary-eyebrow { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); }
        [dir="rtl"] .est-summary-eyebrow { letter-spacing: 0; }
        .est-summary-badge {
          font-size: 11px; font-weight: 700; padding: 5px 11px; border-radius: 999px;
          background: rgba(34,197,94,0.14); color: #4ADE80; border: 1px solid rgba(34,197,94,0.25);
        }

        .est-summary-type-label { font-size: 11px; color: rgba(255,255,255,0.5); display: block; margin-bottom: 4px; }
        .est-summary-type-name { font-size: 20px; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 6px; }
        .est-summary-type-desc { font-size: 12px; line-height: 1.6; color: rgba(255,255,255,0.55); margin: 0; }

        .est-summary-panel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); border-radius: var(--radius-lg); padding: 16px; }
        .est-meter-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .est-meter-head span:first-child { font-size: 11.5px; color: rgba(255,255,255,0.5); }
        .est-meter-head span:last-child { font-size: 12px; font-weight: 700; }
        .est-meter-bar { display: flex; gap: 6px; }
        .est-meter-seg { height: 6px; flex: 1; border-radius: 999px; background: rgba(255,255,255,0.12); transition: background 0.3s ease; }
        .est-meter-seg.is-filled { background: #93C5FD; }

        .est-track-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; }
        .est-track-card-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; }
        .est-track-card-icon {
          width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(37,99,235,0.16); border: 1px solid rgba(96,165,250,0.3); color: #93C5FD;
        }
        .est-track-card-icon svg { width: 18px; height: 18px; }
        .est-track-card-label { font-size: 11px; color: rgba(255,255,255,0.5); display: block; }
        .est-track-card-value { font-size: 14.5px; font-weight: 800; }
        .est-track-estimate {
          font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.8);
          background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 8px; flex-shrink: 0;
          text-align: center;
        }

        .est-included-label { font-size: 11px; color: rgba(255,255,255,0.5); display: block; margin-bottom: 10px; }
        .est-included-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .est-included-chip {
          display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
          padding: 6px 10px; border-radius: 999px;
        }
        .est-included-chip svg { width: 12px; height: 12px; color: #4ADE80; flex-shrink: 0; }

        .est-summary-ctas { display: flex; flex-direction: column; gap: 10px; padding-top: 2px; }
        .est-wa-btn {
          width: 100%; padding: 15px 22px; border-radius: var(--radius-lg); border: none; cursor: pointer;
          background: #25D366; color: #fff; font-weight: 800; font-size: 14px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 8px 24px rgba(37,211,102,0.25);
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .est-wa-btn:hover { background: #1fbf5c; transform: translateY(-2px); }
        .est-wa-btn:active { transform: translateY(0) scale(0.98); }
        .est-consult-link {
          width: 100%; padding: 12px 22px; border-radius: var(--radius-lg);
          border: 1px solid rgba(255,255,255,0.14); color: rgba(255,255,255,0.75);
          font-weight: 600; font-size: 12.5px; text-decoration: none;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .est-consult-link:hover { border-color: rgba(255,255,255,0.32); color: #fff; }
        .est-summary-note { font-size: 11px; text-align: center; color: rgba(255,255,255,0.45); margin: 0; }

        /* ── Phases strip ── */
        .est-phases { margin-top: clamp(2.5rem, 5vw, 3.5rem); padding-top: clamp(2rem, 4vw, 2.75rem); border-top: 1px solid rgb(var(--border)); }
        .est-phases-head { text-align: center; max-width: 460px; margin: 0 auto clamp(1.75rem, 3vw, 2.25rem); }
        .est-phases-title { font-size: clamp(1.0625rem, 1.6vw, 1.25rem); font-weight: 800; color: rgb(var(--text-primary)); margin: 0 0 6px; }
        .est-phases-lead { font-size: 13px; color: rgb(var(--text-secondary)); margin: 0; }
        .est-phases-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
        @media (max-width: 640px) { .est-phases-row { grid-template-columns: repeat(3, 1fr); row-gap: 24px; } }
        .est-phase { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; min-width: 0; }
        .est-phase-track { display: flex; align-items: center; width: 100%; }
        @media (max-width: 640px) { .est-phase-line { display: none; } }
        .est-phase-line { height: 1px; flex: 1; background: rgb(var(--border)); transition: background 0.3s ease; }
        .est-phase-line.is-transparent { background: transparent; }
        .est-phase:hover .est-phase-line:not(.is-transparent) { background: rgb(var(--accent) / 0.4); }
        .est-phase-icon {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgb(var(--bg-elevated)); border: 2px solid rgb(var(--border-strong));
          color: rgb(var(--text-secondary));
          transition: border-color 0.3s ease, color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }
        .est-phase:hover .est-phase-icon { border-color: rgb(var(--accent)); color: rgb(var(--accent)); transform: scale(1.1); box-shadow: 0 0 0 4px rgb(var(--accent) / 0.08); }
        .est-phase-icon svg { width: 18px; height: 18px; }
        .est-phase-label { font-size: 11px; font-weight: 600; color: rgb(var(--text-primary)); line-height: 1.3; transition: color 0.3s ease; }
        .est-phase:hover .est-phase-label { color: rgb(var(--accent)); }
      `}</style>

      <div className="section-inner est-inner">
        <SectionHeader
          align="center"
          icon={Sparkles}
          eyebrow={isRTL ? 'أداة اكتشاف المشروع' : 'Project Scope Estimator'}
          title={isRTL ? 'افهم نطاق مشروعك قبل أن نبدأ' : "Understand Your Project's Scope Before We Start"}
          lead={isRTL
            ? 'حدد ملامح مشروعك لتحصل على صورة واضحة عن التعقيد والإمكانيات ومسار التسليم الموصى به — ثم شاركها مباشرة مع فريقنا.'
            : 'Shape your project to get a clear picture of its complexity, capabilities, and recommended delivery path — then share it directly with our team.'}
          maxWidth={620}
        />

        <div className="est-grid">

          {/* Form */}
          <div className="est-form-card">

            {/* Step 1: Project Type */}
            <div>
              <label className="est-step-label">{isRTL ? '1. ماذا تريد أن تبني؟' : '1. What Are You Building?'}</label>
              <div className="est-type-grid" role="radiogroup" aria-label={isRTL ? 'نوع المشروع' : 'Project type'}>
                {PROJECT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const active = selectedType.id === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedType(type)}
                      className={`est-type-btn${active ? ' is-active' : ''}`}
                    >
                      {active && <CheckCircle2 className="est-type-check" />}
                      <div className="est-type-icon"><Icon /></div>
                      <span className="est-type-title">{isRTL ? type.titleAr : type.titleEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Capabilities */}
            <div>
              <label className="est-step-label">{isRTL ? '2. ما الإمكانيات التي تحتاجها؟' : '2. Which Capabilities Do You Need?'}</label>
              <div className="est-cap-grid" role="group" aria-label={isRTL ? 'الإمكانيات' : 'Capabilities'}>
                {CAPABILITIES.map((cap) => {
                  const Icon = cap.icon;
                  const checked = selectedCapabilities.includes(cap.id);
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggleCapability(cap.id)}
                      className={`est-cap-btn${checked ? ' is-active' : ''}`}
                    >
                      <div className="est-cap-icon"><Icon /></div>
                      <span className="est-cap-text">{isRTL ? cap.labelAr : cap.labelEn}</span>
                      <div className="est-cap-checkbox">
                        {checked && <CheckCircle2 style={{ width: 11, height: 11, color: '#fff' }} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Delivery Track */}
            <div>
              <label className="est-step-label">{isRTL ? '3. المسار المفضل للتسليم' : '3. Preferred Delivery Track'}</label>
              <div className="est-track-grid" role="radiogroup" aria-label={isRTL ? 'مسار التسليم' : 'Delivery track'}>
                {DELIVERY_TRACKS.map((track) => {
                  const Icon = track.icon;
                  const active = selectedTrack.id === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedTrack(track)}
                      className={`est-track-btn${active ? ' is-active' : ''}`}
                    >
                      <div className="est-track-head">
                        <Icon />
                        <span className="est-track-label">{isRTL ? track.labelAr : track.labelEn}</span>
                      </div>
                      <p className="est-track-desc">{isRTL ? track.descAr : track.descEn}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Summary */}
          <div className="est-summary">
            <div className="est-summary-glow" aria-hidden />
            <div className="est-summary-inner">

              <div className="est-summary-head">
                <span className="est-summary-eyebrow">{isRTL ? 'ملخص نطاق المشروع' : 'Project Scope Summary'}</span>
                <span className="est-summary-badge">{isRTL ? 'جاهز للمناقشة' : 'Ready to Discuss'}</span>
              </div>

              <div>
                <span className="est-summary-type-label">{isRTL ? 'نوع المشروع:' : 'Project Type:'}</span>
                <h3 className="est-summary-type-name">{isRTL ? selectedType.titleAr : selectedType.titleEn}</h3>
                <p className="est-summary-type-desc">{isRTL ? selectedType.descAr : selectedType.descEn}</p>
              </div>

              <div className="est-summary-panel">
                <div className="est-meter-head">
                  <span>{isRTL ? 'مستوى التعقيد المتوقع' : 'Expected Complexity'}</span>
                  <span>{isRTL ? complexity.labelAr : complexity.labelEn}</span>
                </div>
                <div className="est-meter-bar" role="img" aria-label={isRTL ? complexity.labelAr : complexity.labelEn}>
                  {COMPLEXITY_LEVELS.map((_, i) => (
                    <span key={i} className={`est-meter-seg${i <= complexityIndex ? ' is-filled' : ''}`} />
                  ))}
                </div>
              </div>

              <div className="est-summary-panel est-track-card">
                <div className="est-track-card-left">
                  <div className="est-track-card-icon"><TrackIcon /></div>
                  <div style={{ minWidth: 0 }}>
                    <span className="est-track-card-label">{isRTL ? 'مسار التسليم' : 'Delivery Track'}</span>
                    <span className="est-track-card-value">{isRTL ? selectedTrack.labelAr : selectedTrack.labelEn}</span>
                  </div>
                </div>
                <span className="est-track-estimate">{deliveryEstimate}</span>
              </div>

              <div>
                <span className="est-included-label">{isRTL ? 'يشمل كل مشروع:' : 'Included With Every Engagement:'}</span>
                <div className="est-included-list">
                  {INCLUDED_SERVICES.map((service, i) => {
                    const Icon = service.icon;
                    return (
                      <span key={i} className="est-included-chip">
                        <Icon />
                        {isRTL ? service.labelAr : service.labelEn}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="est-summary-ctas">
                <button type="button" onClick={handleWhatsAppSend} className="est-wa-btn">
                  <MessageCircle style={{ width: 19, height: 19 }} fill="currentColor" />
                  <span>{isRTL ? 'احصل على خطة مشروعك المخصصة' : 'Get My Custom Project Plan'}</span>
                  <ArrowUpRight style={{ width: 16, height: 16 }} />
                </button>
                <Link
                  to="/contact"
                  onClick={() => trackCTAClick('estimator_consultation', 'project_estimator')}
                  className="est-consult-link"
                >
                  {isRTL ? 'أو اطلب استشارة مجانية مع فريقنا' : 'Or Request a Free Consultation'}
                </Link>
                <p className="est-summary-note">
                  {isRTL ? '⚡ سيتم فتح واتساب فوراً مع تفاصيل نطاق مشروعك' : '⚡ Opens WhatsApp instantly with your project scope'}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Development Phases Timeline */}
        <div className="est-phases">
          <div className="est-phases-head">
            <h3 className="est-phases-title">{isRTL ? 'رحلة واحدة، ست مراحل، منتج جاهز للإطلاق' : 'One Path, Six Phases, One Launch-Ready Product'}</h3>
            <p className="est-phases-lead">
              {isRTL
                ? 'كل مشروع يمر بنفس المنهجية المُثبتة، بغض النظر عن حجمه أو تعقيده'
                : 'Every engagement follows the same proven methodology, regardless of size or complexity'}
            </p>
          </div>
          <RevealItems className="est-phases-row" step={0.06}>
            {PHASES.map((phase, i) => {
              const Icon = phase.icon;
              const isFirst = i === 0;
              const isLast = i === PHASES.length - 1;
              return (
                <div key={i} className="est-phase">
                  <div className="est-phase-track" aria-hidden="true">
                    <span className={`est-phase-line${isFirst ? ' is-transparent' : ''}`} />
                    <span className="est-phase-icon"><Icon /></span>
                    <span className={`est-phase-line${isLast ? ' is-transparent' : ''}`} />
                  </div>
                  <span className="est-phase-label">{isRTL ? phase.labelAr : phase.labelEn}</span>
                </div>
              );
            })}
          </RevealItems>
        </div>

      </div>
    </section>
  );
};

export default ProjectEstimator;
