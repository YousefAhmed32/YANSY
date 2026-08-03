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
    <section id="estimator" className="section-shell bg-gradient-to-b from-surface-white via-[rgb(var(--bg-elevated))] to-surface-white border-y border-[rgb(var(--border))] py-16 md:py-24">
      <div className="section-inner max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgb(var(--accent-light))] border border-[rgba(37,99,235,0.2)] text-[rgb(var(--accent))] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRTL ? 'أداة اكتشاف المشروع' : 'Project Scope Estimator'}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[rgb(var(--text-primary))] tracking-tight mb-4">
            {isRTL ? 'افهم نطاق مشروعك قبل أن نبدأ' : "Understand Your Project's Scope Before We Start"}
          </h2>
          <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] leading-relaxed">
            {isRTL
              ? 'حدد ملامح مشروعك لتحصل على صورة واضحة عن التعقيد والإمكانيات ومسار التسليم الموصى به — ثم شاركها مباشرة مع فريقنا.'
              : 'Shape your project to get a clear picture of its complexity, capabilities, and recommended delivery path — then share it directly with our team.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Form Options */}
          <div className="lg:col-span-7 space-y-8 bg-surface-white p-6 md:p-8 rounded-3xl border border-[rgb(var(--border))] shadow-sm">

            {/* Step 1: Project Type */}
            <div>
              <label className="block text-xs font-bold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-3">
                {isRTL ? '1. ماذا تريد أن تبني؟' : '1. What Are You Building?'}
              </label>
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                role="radiogroup"
                aria-label={isRTL ? 'نوع المشروع' : 'Project type'}
              >
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
                      className={`group relative flex flex-col ${isRTL ? 'items-end text-right' : 'items-start text-left'} gap-2.5 rounded-2xl border p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 ${
                        active
                          ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-light))] shadow-sm ring-1 ring-[rgb(var(--accent))]'
                          : 'border-[rgb(var(--border))] bg-surface-white hover:border-[rgb(var(--border-strong))] hover:-translate-y-0.5'
                      }`}
                    >
                      {active && (
                        <CheckCircle2 className={`w-4 h-4 text-[rgb(var(--accent))] absolute top-3 ${isRTL ? 'left-3' : 'right-3'}`} />
                      )}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        active ? 'bg-[rgb(var(--accent))] text-white' : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--accent))]'
                      }`}>
                        <Icon className="w-[18px] h-[18px]" />
                      </div>
                      <span className={`text-sm font-bold leading-tight ${active ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--text-primary))]'}`}>
                        {isRTL ? type.titleAr : type.titleEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Capabilities */}
            <div>
              <label className="block text-xs font-bold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-3">
                {isRTL ? '2. ما الإمكانيات التي تحتاجها؟' : '2. Which Capabilities Do You Need?'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-label={isRTL ? 'الإمكانيات' : 'Capabilities'}>
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
                      className={`flex items-center gap-3 rounded-xl border p-3.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 ${
                        checked
                          ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-light))] text-[rgb(var(--text-primary))] font-semibold shadow-xs'
                          : 'border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-strong))]'
                      }`}
                    >
                      <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center border transition-colors ${
                        checked ? 'bg-[rgb(var(--accent))] border-[rgb(var(--accent))] text-white' : 'border-[rgb(var(--border-strong))] bg-surface-white text-[rgb(var(--text-tertiary))]'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`flex-1 leading-snug ${isRTL ? 'text-right' : 'text-left'}`}>
                        {isRTL ? cap.labelAr : cap.labelEn}
                      </span>
                      <div className={`w-4 h-4 flex-shrink-0 rounded flex items-center justify-center border transition-colors ${
                        checked ? 'bg-[rgb(var(--accent))] border-[rgb(var(--accent))]' : 'border-[rgb(var(--border-strong))] bg-surface-white'
                      }`}>
                        {checked && <CheckCircle2 className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Delivery Track */}
            <div>
              <label className="block text-xs font-bold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-3">
                {isRTL ? '3. المسار المفضل للتسليم' : '3. Preferred Delivery Track'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label={isRTL ? 'مسار التسليم' : 'Delivery track'}>
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
                      className={`flex flex-col ${isRTL ? 'items-end text-right' : 'items-start text-left'} gap-2 rounded-xl border p-3.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 ${
                        active
                          ? 'border-[rgb(var(--text-primary))] bg-[rgb(var(--text-primary))] shadow-md'
                          : 'border-[rgb(var(--border))] bg-surface-white hover:border-[rgb(var(--border-strong))]'
                      }`}
                    >
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[rgb(var(--text-tertiary))]'}`} />
                        <span className={`text-sm font-bold ${active ? 'text-white' : 'text-[rgb(var(--text-primary))]'}`}>
                          {isRTL ? track.labelAr : track.labelEn}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${active ? 'text-white/70' : 'text-[rgb(var(--text-tertiary))]'}`}>
                        {isRTL ? track.descAr : track.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Summary Box */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-700/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isRTL ? 'ملخص نطاق المشروع' : 'Project Scope Summary'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                  {isRTL ? '🟢 جاهز للمناقشة' : '🟢 Ready to Discuss'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  {isRTL ? 'نوع المشروع:' : 'Project Type:'}
                </span>
                <h3 className="text-xl font-bold text-white mb-1.5 transition-all duration-300">
                  {isRTL ? selectedType.titleAr : selectedType.titleEn}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isRTL ? selectedType.descAr : selectedType.descEn}
                </p>
              </div>

              {/* Complexity Meter */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {isRTL ? 'مستوى التعقيد المتوقع' : 'Expected Complexity'}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {isRTL ? complexity.labelAr : complexity.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-1.5" role="img" aria-label={isRTL ? complexity.labelAr : complexity.labelEn}>
                  {COMPLEXITY_LEVELS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= complexityIndex ? 'bg-[rgb(var(--accent))]' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Delivery Track Card */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                    <TrackIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-slate-400 block">{isRTL ? 'مسار التسليم' : 'Delivery Track'}</span>
                    <span className="text-base font-extrabold text-white">
                      {isRTL ? selectedTrack.labelAr : selectedTrack.labelEn}
                    </span>
                  </div>
                </div>
                <span className={`text-[11px] font-semibold text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-lg flex-shrink-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {deliveryEstimate}
                </span>
              </div>

              {/* Included Services */}
              <div>
                <span className="text-xs text-slate-400 block mb-2.5">
                  {isRTL ? 'يشمل كل مشروع:' : 'Included With Every Engagement:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INCLUDED_SERVICES.map((service, i) => {
                    const Icon = service.icon;
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 text-[11px] font-medium text-slate-300"
                      >
                        <Icon className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        {isRTL ? service.labelAr : service.labelEn}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleWhatsAppSend}
                  className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-emerald-600 text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>{isRTL ? 'احصل على خطة مشروعك المخصصة' : 'Get My Custom Project Plan'}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <Link
                  to="/contact"
                  onClick={() => trackCTAClick('estimator_consultation', 'project_estimator')}
                  className="w-full py-3 px-6 rounded-2xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  {isRTL ? 'أو اطلب استشارة مجانية مع فريقنا' : 'Or Request a Free Consultation'}
                </Link>

                <p className="text-[11px] text-center text-slate-500">
                  {isRTL ? '⚡ سيتم فتح واتساب فوراً مع تفاصيل نطاق مشروعك' : '⚡ Opens WhatsApp instantly with your project scope'}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Development Phases Timeline */}
        <div className="mt-12 pt-10 border-t border-[rgb(var(--border))]">
          <div className="text-center max-w-xl mx-auto mb-9">
            <h3 className="text-lg md:text-xl font-bold text-[rgb(var(--text-primary))] mb-1.5">
              {isRTL ? 'رحلة واحدة، ست مراحل، منتج جاهز للإطلاق' : 'One Path, Six Phases, One Launch-Ready Product'}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              {isRTL
                ? 'كل مشروع يمر بنفس المنهجية المُثبتة، بغض النظر عن حجمه أو تعقيده'
                : 'Every engagement follows the same proven methodology, regardless of size or complexity'}
            </p>
          </div>
          <div className="relative grid grid-cols-3 sm:grid-cols-6 gap-y-7 gap-x-2">
            <div className="absolute top-5 left-[10%] right-[10%] h-px bg-[rgb(var(--border))] hidden sm:block" aria-hidden="true" />
            {PHASES.map((phase, i) => {
              const Icon = phase.icon;
              return (
                <div key={i} className="relative z-10 flex flex-col items-center text-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-surface-white border-2 border-[rgb(var(--border-strong))] flex items-center justify-center text-[rgb(var(--text-secondary))] transition-colors duration-200 hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-[rgb(var(--text-primary))] leading-tight">
                    {isRTL ? phase.labelAr : phase.labelEn}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProjectEstimator;
